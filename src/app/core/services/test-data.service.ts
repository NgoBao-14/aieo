import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, forkJoin, from, map, of, shareReplay, switchMap } from 'rxjs';
import { doc, setDoc } from 'firebase/firestore';
import { Submission, Test } from '../../models/app.models';
import { UserProfileService } from './user-profile.service';
import { CloudTestService } from './cloud-test.service';
import { getFirebaseDb } from '../firebase/firebase.client';

const SUBMISSIONS_KEY = 'ielts9s-submissions';

@Injectable({ providedIn: 'root' })
export class TestDataService {
  private localTests$?: Observable<Test[]>;

  constructor(
    private http: HttpClient,
    private userProfileService: UserProfileService,
    private cloudTestService: CloudTestService
  ) {}

  getTests(filters?: { skill?: string; source?: string; preferCloud?: boolean }): Observable<Test[]> {
    const localTests$ = this.getLocalTests();

    const source$ = filters?.preferCloud && this.cloudTestService.isEnabled()
      ? from(this.cloudTestService.getTests(filters?.skill as Test['skill'] | undefined)).pipe(
          switchMap((cloudTests) => cloudTests.length ? of(cloudTests) : localTests$),
          catchError((err) => {
            console.error('Firebase failed to fetch tests, falling back to local files:', err);
            return localTests$;
          })
        )
      : localTests$;

    return source$.pipe(
      map((tests) => tests.filter((test) => {
        const bySkill = filters?.skill ? test.skill === filters.skill : true;
        const bySource = filters?.source ? test.source === filters.source : true;
        return bySkill && bySource;
      }))
    );
  }

  getTestById(testId: string): Observable<Test | null> {
    return this.getLocalTests().pipe(
      switchMap((tests) => {
        const localTest = tests.find((test) => test.id === testId) ?? null;
        if (localTest || !this.cloudTestService.isEnabled()) {
          return of(localTest);
        }

        return from(this.cloudTestService.getTestById(testId)).pipe(
          catchError((err) => {
            console.error('Firebase failed to fetch test detail:', err);
            return of(null);
          })
        );
      })
    );
  }

  async getTestSnapshot(testId: string): Promise<Test | null> {
    return firstValueFrom(this.getTestById(testId));
  }

  async submitTest(userId: string, test: Test, answers: Record<string, string>): Promise<Submission> {
    const score = this.calculateScore(test, answers);
    const bandScore = this.getBandScore(score);
    const submission: Submission = {
      id: `${Date.now()}`,
      userId,
      testId: test.id,
      testTitle: test.title,
      skill: test.skill,
      answers,
      score,
      bandScore,
      createdAt: new Date().toISOString()
    };

    const submissions = this.readSubmissions();
    submissions.unshift(submission);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));

    if (this.cloudTestService.isEnabled()) {
      const db = getFirebaseDb();
      if (db) {
        this.userProfileService.getUserProfile(userId).then((profile) => {
          const displayName = profile?.displayName || 'Học viên';
          const historyDoc: Record<string, any> = {
            created_at: submission.createdAt,
            month: `${new Date().getMonth() + 1}_${new Date().getFullYear()}`,
            name: displayName,
            userId: submission.userId,
            testId: submission.testId,
            testTitle: submission.testTitle,
            skill: submission.skill,
            score: submission.score,
            bandScore: submission.bandScore
          };

          test.parts.forEach((part, index) => {
            const partKey = `part${index + 1}`;
            const questionsList: any[] = [];
            part.questionGroups.forEach((group) => {
              group.questions.forEach((question) => {
                const answer = answers[String(question.id)] ?? '';
                const expected = (test.answerKey[String(question.id)] ?? '').trim().toLowerCase();
                const isCorrect = answer.trim().toLowerCase() === expected;
                questionsList.push({
                  id: question.id,
                  score: isCorrect ? 1 : 0,
                  userAnswer: answer
                });
              });
            });
            historyDoc[partKey] = questionsList;
          });

          setDoc(doc(db, 'history', submission.id), historyDoc)
            .then(() => console.log('[TestDataService] Saved structured submission to Firestore history:', submission.id))
            .catch((error) => console.error('[TestDataService] Failed to save submission to Firestore:', error));
        }).catch((err) => {
          console.error('[TestDataService] Failed to fetch profile for history:', err);
        });
      }
    }

    this.userProfileService.updateUserStats(userId, test, answers, bandScore)
      .catch((error) => console.error('[TestDataService] Failed to update user stats:', error));

    return submission;
  }

  async getRecentUserSubmissions(userId: string, limit = 4): Promise<Submission[]> {
    return this.readSubmissions()
      .filter((submission) => submission.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  async seedDemoTestsToFirebase(): Promise<void> {
    await this.cloudTestService.seedDemoTests();
  }

  private calculateScore(test: Test, answers: Record<string, string>): number {
    return Object.keys(test.answerKey).reduce((total, questionId) => {
      const expected = (test.answerKey[questionId] ?? '').trim().toLowerCase();
      const actual = (answers[questionId] ?? '').trim().toLowerCase();
      return total + (expected === actual ? 1 : 0);
    }, 0);
  }

  private getBandScore(score: number): number {
    if (score >= 39) { return 9; }
    if (score >= 37) { return 8.5; }
    if (score >= 35) { return 8; }
    if (score >= 33) { return 7.5; }
    if (score >= 30) { return 7; }
    if (score >= 27) { return 6.5; }
    if (score >= 23) { return 6; }
    if (score >= 19) { return 5.5; }
    if (score >= 15) { return 5; }
    if (score >= 13) { return 4.5; }
    return 4;
  }

  private getLocalTests(): Observable<Test[]> {
    if (!this.localTests$) {
      this.localTests$ = forkJoin([
        this.http.get<Test[]>('assets/data/reading-tests.json'),
        this.http.get<Test[]>('assets/data/listening-tests.json')
      ]).pipe(
        map(([readingTests, listeningTests]) => [...readingTests, ...listeningTests]),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.localTests$;
  }

  private readSubmissions(): Submission[] {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) as Submission[] : [];
  }
}
