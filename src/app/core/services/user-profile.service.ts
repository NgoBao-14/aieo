import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AppUser, Test, UserProfile, UserPackage } from '../../models/app.models';
import { getFirebaseDb, isFirebaseEnabled } from '../firebase/firebase.client';

const PROFILE_KEY = 'ielts9s-profiles';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  async ensureProfile(user: AppUser): Promise<UserProfile> {
    const existing = await this.getUserProfile(user.uid);
    if (existing) {
      // Self-healing: if Firebase is enabled but the document doesn't exist on Firestore, recreate it
      if (isFirebaseEnabled()) {
        const db = getFirebaseDb();
        if (db) {
          try {
            const snapshot = await getDoc(doc(db, 'users', user.uid));
            if (!snapshot.exists()) {
              await setDoc(doc(db, 'users', user.uid), {
                uid: existing.uid,
                displayName: existing.displayName,
                email: existing.email,
                photoURL: existing.photoURL,
                rank: existing.rank,
                targetBand: existing.targetBand,
                stats: existing.stats,
                createdAt: existing.createdAt
              });

              if (!existing.package) {
                existing.package = {
                  create_at: new Date().toISOString(),
                  days: 30,
                  expired_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  number_test: 0,
                  type: 1,
                  uid: user.uid
                };
                const profiles = this.readProfiles();
                profiles[user.uid] = existing;
                localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
              }

              await setDoc(doc(db, 'users', user.uid, 'data', 'package'), existing.package);
            }
          } catch (err) {
            console.error('Error syncing user profile to Firestore:', err);
          }
        }
      }
      return existing;
    }

    const defaultPackage: UserPackage = {
      create_at: new Date().toISOString(),
      days: 30,
      expired_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      number_test: 0,
      type: 1, // 1 is standard
      uid: user.uid
    };

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
      createdAt: new Date().toISOString(),
      package: defaultPackage
    };

    const profiles = this.readProfiles();
    profiles[user.uid] = profile;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));

    if (isFirebaseEnabled()) {
      const db = getFirebaseDb();
      if (db) {
        // Write user profile main doc
        await setDoc(doc(db, 'users', user.uid), {
          uid: profile.uid,
          displayName: profile.displayName,
          email: profile.email,
          photoURL: profile.photoURL,
          rank: profile.rank,
          targetBand: profile.targetBand,
          stats: profile.stats,
          createdAt: profile.createdAt
        });

        // Write user package to users/{uid}/data/package subcollection path
        await setDoc(doc(db, 'users', user.uid, 'data', 'package'), defaultPackage);
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
          const profile = snapshot.data() as UserProfile;

          try {
            const pkgSnap = await getDoc(doc(db, 'users', uid, 'data', 'package'));
            if (pkgSnap.exists()) {
              profile.package = pkgSnap.data() as UserPackage;
            }
          } catch (err) {
            console.error('Error fetching user package from Firestore:', err);
          }

          return profile;
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
    
    if (profile.package) {
      profile.package.number_test = (profile.package.number_test || 0) + 1;
    }

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

        if (profile.package) {
          await updateDoc(doc(db, 'users', userId, 'data', 'package'), {
            number_test: profile.package.number_test
          });
        }
      }
    }
  }

  private readProfiles(): Record<string, UserProfile> {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) as Record<string, UserProfile> : {};
  }
}
