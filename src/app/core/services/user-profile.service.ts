import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AppUser, Test, UserProfile } from '../../models/app.models';
import { getFirebaseDb, isFirebaseEnabled } from '../firebase/firebase.client';

const PROFILE_KEY = 'ielts9s-profiles';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  async ensureProfile(user: AppUser): Promise<UserProfile> {
    const existing = await this.getUserProfile(user.uid);
    if (existing) {
      return existing;
    }

    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      rank: 'novice',
      targetBand: 6,
      stats: {
        reading: {},
        listening: {}
      },
      createdAt: new Date().toISOString()
    };

    const profiles = this.readProfiles();
    profiles[user.uid] = profile;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));

    if (isFirebaseEnabled()) {
      const db = getFirebaseDb();
      if (db) {
        await setDoc(doc(db, 'users', user.uid), profile);
      }
    }

    return profile;
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseEnabled()) {
      const db = getFirebaseDb();
      if (db) {
        const snapshot = await getDoc(doc(db, 'users', uid));
        if (snapshot.exists()) {
          return snapshot.data() as UserProfile;
        }
      }
    }

    return this.readProfiles()[uid] ?? null;
  }

  async updateUserStats(userId: string, test: Test, answers: Record<string, string>, bandScore: number): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      return;
    }

    const skillKey = test.skill.toLowerCase() as 'reading' | 'listening';
    const nextStats = {
      ...profile.stats,
      [skillKey]: { ...profile.stats[skillKey] }
    };

    const buckets: Record<string, { correct: number; total: number }> = {};
    test.parts
      .flatMap((part) => part.questionGroups)
      .forEach((group) => group.questions.forEach((question) => {
      const key = question.type ?? group.type;
      const isCorrect = (test.answerKey[String(question.id)] ?? '').trim().toLowerCase() === (answers[String(question.id)] ?? '').trim().toLowerCase();

      if (!buckets[key]) {
        buckets[key] = { correct: 0, total: 0 };
      }

      buckets[key].total += 1;
      if (isCorrect) {
        buckets[key].correct += 1;
      }
    }));

    Object.entries(buckets).forEach(([type, bucket]) => {
      nextStats[skillKey][type] = bucket.total ? bucket.correct / bucket.total : 0;
    });

    const nextRank: UserProfile['rank'] = bandScore >= 8 ? 'master' : bandScore >= 7 ? 'knight' : bandScore >= 6 ? 'scout' : 'novice';
    const updatedProfile: UserProfile = {
      ...profile,
      stats: nextStats,
      rank: nextRank
    };

    const profiles = this.readProfiles();
    profiles[userId] = updatedProfile;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));

    if (isFirebaseEnabled()) {
      const db = getFirebaseDb();
      if (db) {
        await updateDoc(doc(db, 'users', userId), {
          stats: nextStats,
          rank: nextRank
        });
      }
    }
  }

  private readProfiles(): Record<string, UserProfile> {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) as Record<string, UserProfile> : {};
  }
}
