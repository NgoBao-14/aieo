import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseEnabled } from '../firebase/firebase.client';

export interface VocabSessionRecord {
  sessionIndex: number;
  date: string;
  nouns: number;
  verbs: number;
  adjs: number;
  advs: number;
  total: number;
}

export interface UserVocabProgress {
  streakDays: number;
  todayWordsLearned: number;
  totalLearnedCount: number;
  maxRecord: number;
  savedWords: string[];
  learnedWords: string[];
  learnedDays: string[];
  lastStudyDate?: string;
  nounCount: number;
  verbCount: number;
  adjCount: number;
  advCount: number;
  index: VocabSessionRecord[];
}

const LOCAL_VOCAB_KEY = 'ielts9s-vocab-progress';

const DEFAULT_VOCAB_PROGRESS: UserVocabProgress = {
  streakDays: 0,
  todayWordsLearned: 0,
  totalLearnedCount: 0,
  maxRecord: 0,
  savedWords: [],
  learnedWords: [],
  learnedDays: [],
  lastStudyDate: '',
  nounCount: 0,
  verbCount: 0,
  adjCount: 0,
  advCount: 0,
  index: []
};

@Injectable({ providedIn: 'root' })
export class VocabProgressService {

  async loadProgress(userId: string): Promise<UserVocabProgress> {
    // 1. Tải từ Firebase nếu khả dụng
    if (isFirebaseEnabled() && userId && userId !== 'demo-user') {
      const db = getFirebaseDb();
      if (db) {
        try {
          const snapshot = await getDoc(doc(db, 'users', userId, 'data', 'vocabulary'));
          if (snapshot.exists()) {
            const data = snapshot.data() as Partial<UserVocabProgress>;
            return {
              ...DEFAULT_VOCAB_PROGRESS,
              ...data,
              savedWords: data.savedWords || [],
              learnedWords: data.learnedWords || [],
              learnedDays: data.learnedDays || [],
              index: data.index || []
            };
          }
        } catch (err) {
          console.error('Error loading vocabulary progress from Firestore:', err);
        }
      }
    }

    // 2. Dự phòng bằng LocalStorage
    try {
      const key = `${LOCAL_VOCAB_KEY}-${userId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserVocabProgress>;
        return {
          ...DEFAULT_VOCAB_PROGRESS,
          ...parsed,
          savedWords: parsed.savedWords || [],
          learnedWords: parsed.learnedWords || [],
          learnedDays: parsed.learnedDays || [],
          index: parsed.index || []
        };
      }
    } catch (err) {
      console.error('Error loading vocabulary progress from LocalStorage:', err);
    }

    return { ...DEFAULT_VOCAB_PROGRESS };
  }

  async saveProgress(userId: string, progress: UserVocabProgress): Promise<void> {
    if (!userId) return;

    // 1. Lưu LocalStorage trước để đảm bảo dữ liệu luôn có bản sao offline
    try {
      const key = `${LOCAL_VOCAB_KEY}-${userId}`;
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (err) {
      console.error('Error saving vocabulary progress to LocalStorage:', err);
    }

    // 2. Lưu lên Firebase Firestore nếu khả dụng
    if (isFirebaseEnabled() && userId !== 'demo-user') {
      const db = getFirebaseDb();
      if (db) {
        try {
          await setDoc(doc(db, 'users', userId, 'data', 'vocabulary'), {
            streakDays: progress.streakDays,
            todayWordsLearned: progress.todayWordsLearned,
            totalLearnedCount: progress.totalLearnedCount,
            maxRecord: progress.maxRecord,
            savedWords: progress.savedWords,
            learnedDays: progress.learnedDays,
            lastStudyDate: progress.lastStudyDate || '',
            index: progress.index
          });
        } catch (err) {
          console.error('Error saving vocabulary progress to Firestore:', err);
        }
      }
    }
  }
}
