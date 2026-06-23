import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { arrayRemove, collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Test } from '../../models/app.models';
import { getFirebaseDb, getFirebaseStorage, handleFirestoreError, isFirebaseEnabled, OperationType } from '../firebase/firebase.client';

type SkillDocKey = 'reading' | 'listening';

interface CloudTestMetadata extends Omit<Test, 'parts' | 'answerKey' | 'explanations'> {
  parts?: never;
  answerKey?: never;
  explanations?: Record<string, string>;
}

interface CloudTestDetail {
  parts: Test['parts'];
  answerKey: Test['answerKey'];
  explanations?: Test['explanations'];
}

@Injectable({ providedIn: 'root' })
export class CloudTestService {
  private readonly collectionName = 'test';
  private readonly detailsCollectionName = 'testDetails';

  constructor(private http: HttpClient) {}

  isEnabled(): boolean {
    return isFirebaseEnabled();
  }

  async getTests(skill?: Test['skill']): Promise<Test[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const db = getFirebaseDb();
      if (!db) {
        return [];
      }

      const docKeys = skill ? [this.getSkillDocKey(skill)] : ['reading', 'listening'] as SkillDocKey[];
      const snapshots = await Promise.all(
        docKeys.map((docKey) => getDoc(doc(db, this.collectionName, docKey)))
      );

      return snapshots.flatMap((snapshot) => {
        if (!snapshot.exists()) {
          return [];
        }

        const data = snapshot.data()['data'] as CloudTestMetadata[] | undefined;
        return (data ?? []).map((item) => this.mapMetadataToTest(item));
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.collectionName);
    }
  }

  async getTestById(testId: string, skill?: Test['skill']): Promise<Test | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const db = getFirebaseDb();
      if (!db) {
        return null;
      }

      const tests = await this.getTests(skill);
      const metadata = tests.find((test) => test.id === testId);
      if (!metadata) {
        return null;
      }

      const detailsSnapshot = await getDoc(doc(db, this.detailsCollectionName, testId));
      if (!detailsSnapshot.exists()) {
        return metadata;
      }

      const details = detailsSnapshot.data() as CloudTestDetail;
      return {
        ...metadata,
        parts: details.parts ?? [],
        answerKey: details.answerKey ?? {},
        explanations: details.explanations ?? metadata.explanations ?? {}
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${this.collectionName}/${testId}`);
    }
  }

  async createTest(test: Test): Promise<string> {
    return this.upsertTest(test);
  }

  async updateTest(id: string, test: Test): Promise<void> {
    await this.upsertTest({ ...test, id });
  }

  async deleteTest(id: string, skill: Test['skill']): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const db = getFirebaseDb();
      if (!db) {
        return;
      }

      const skillKey = this.getSkillDocKey(skill);
      const skillDocRef = doc(db, this.collectionName, skillKey);
      const skillDocSnap = await getDoc(skillDocRef);

      if (skillDocSnap.exists() && Array.isArray(skillDocSnap.data()['data'])) {
        const current = skillDocSnap.data()['data'] as CloudTestMetadata[];
        const item = current.find((test) => test.id === id);
        if (item) {
          await updateDoc(skillDocRef, {
            data: arrayRemove(item)
          });
        }
      }

      await deleteDoc(doc(db, this.detailsCollectionName, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${this.collectionName}/${id}`);
    }
  }

  async uploadAudio(file: File, testId: string, partNumber: number): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('Firebase is not enabled.');
    }

    try {
      const storage = getFirebaseStorage();
      if (!storage) {
        throw new Error('Firebase storage is not available.');
      }

      const storageRef = ref(storage, `audio/${testId}/part_${partNumber}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `audio/${testId}/part_${partNumber}`);
    }
  }

  async seedDemoTests(): Promise<void> {
    console.log('[CloudTestService] seedDemoTests starting...');
    if (!this.isEnabled()) {
      console.error('[CloudTestService] Firebase is not enabled!');
      throw new Error('Firebase is not enabled.');
    }

    const [readingTests, listeningTests] = await Promise.all([
      firstValueFrom(this.http.get<Test[]>('assets/data/reading-tests.json')),
      firstValueFrom(this.http.get<Test[]>('assets/data/listening-tests.json'))
    ]);

    const playableTests = [...readingTests, ...listeningTests].filter((test) =>
      test.parts.some((part) => part.questionGroups.length > 0)
    );

    console.log('[CloudTestService] Found playable tests to seed:', playableTests.map(t => t.title));

    for (const test of playableTests) {
      console.log('[CloudTestService] Seeding test:', test.title);
      await this.upsertTest({
        ...test,
        source: test.source || 'IELTS9s Demo Seed'
      });
    }
    console.log('[CloudTestService] seedDemoTests completed successfully!');
  }

  private async upsertTest(test: Test): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('Firebase is not enabled.');
    }

    try {
      const db = getFirebaseDb();
      if (!db) {
        throw new Error('Firebase firestore is not available.');
      }

      const id = test.id || doc(collection(db, this.detailsCollectionName)).id;
      console.log(`[CloudTestService] Upserting to Firestore: testId=${id}, title=${test.title}`);
      const metadata = this.sanitizeFirestoreData(this.toMetadata({ ...test, id }));
      const detail = this.sanitizeFirestoreData({
        parts: test.parts ?? [],
        answerKey: test.answerKey ?? {},
        explanations: test.explanations ?? {}
      }) as CloudTestDetail;

      console.log(`[CloudTestService] Writing details to ${this.detailsCollectionName}/${id}`);
      await setDoc(doc(db, this.detailsCollectionName, id), detail, { merge: true });

      const skillKey = this.getSkillDocKey(test.skill);
      const skillDocRef = doc(db, this.collectionName, skillKey);
      console.log(`[CloudTestService] Fetching metadata document: ${this.collectionName}/${skillKey}`);
      const skillDocSnap = await getDoc(skillDocRef);
      const current = skillDocSnap.exists() && Array.isArray(skillDocSnap.data()['data'])
        ? skillDocSnap.data()['data'] as CloudTestMetadata[]
        : [];

      const next = current.filter((item) => item.id !== id);
      next.push(metadata);

      console.log(`[CloudTestService] Updating metadata document with ${next.length} items`);
      await setDoc(skillDocRef, { data: next }, { merge: true });
      console.log(`[CloudTestService] Upsert success for testId=${id}`);

      return id;
    } catch (error) {
      console.error('[CloudTestService] Error in upsertTest:', error);
      handleFirestoreError(error, OperationType.CREATE, this.collectionName);
    }
  }

  private toMetadata(test: Test): CloudTestMetadata {
    const partsCount = test.parts?.length ?? 0;
    const questionCount = test.parts?.reduce(
      (sum, p) => sum + (p.questionGroups ?? []).reduce((s, g) => s + (g.questions?.length ?? 0), 0), 0
    ) ?? 0;
    const questionTypes = [...new Set(
      (test.parts ?? []).flatMap(p => (p.questionGroups ?? []).map(g => g.type))
    )];

    return {
      id: test.id,
      title: test.title,
      skill: test.skill,
      source: test.source,
      attempts: test.attempts ?? 0,
      createdAt: test.createdAt,
      explanations: test.explanations ?? {},
      partsCount,
      questionCount,
      questionTypes
    } as any;
  }

  private sanitizeFirestoreData<T>(value: T): T {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeFirestoreData(item)) as T;
    }

    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>).reduce((acc, [key, item]) => {
        if (item !== undefined) {
          acc[key] = this.sanitizeFirestoreData(item);
        }
        return acc;
      }, {} as Record<string, unknown>) as T;
    }

    return value;
  }

  private mapMetadataToTest(metadata: any): Test {
    return {
      id: metadata.id ?? '',
      title: metadata.title,
      skill: metadata.skill,
      source: metadata.source,
      attempts: metadata.attempts,
      parts: [],
      answerKey: {},
      explanations: metadata.explanations ?? {},
      createdAt: metadata.createdAt,
      partsCount: metadata.partsCount,
      questionCount: metadata.questionCount,
      questionTypes: metadata.questionTypes
    };
  }

  private getSkillDocKey(skill: Test['skill']): SkillDocKey {
    return skill.toLowerCase() as SkillDocKey;
  }
}
