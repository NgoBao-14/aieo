import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { AppUser } from '../../models/app.models';
import { createGoogleProvider, getFirebaseAuth, isFirebaseEnabled } from '../firebase/firebase.client';
import { UserProfileService } from './user-profile.service';

const DEMO_USER_KEY = 'ielts9s-demo-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AppUser | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(true);

  readonly user$: Observable<AppUser | null> = this.userSubject.asObservable();
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  constructor(private userProfileService: UserProfileService) {
    this.bootstrapAuth();
  }

  get currentUser(): AppUser | null {
    return this.userSubject.value;
  }

  async loginWithGoogle(): Promise<AppUser> {
    if (!isFirebaseEnabled()) {
      const demoUser: AppUser = {
        uid: 'demo-user',
        displayName: 'Demo Learner',
        email: 'demo@ielts9s.local',
        photoURL: 'https://ui-avatars.com/api/?name=Demo+Learner&background=0f766e&color=ffffff',
        provider: 'demo'
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      this.userSubject.next(demoUser);
      this.loadingSubject.next(false);
      await this.userProfileService.ensureProfile(demoUser);
      return demoUser;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase auth is not available.');
    }

    const result = await signInWithPopup(auth, createGoogleProvider());
    const appUser = this.mapFirebaseUser(result.user);
    this.userSubject.next(appUser);
    this.loadingSubject.next(false);
    await this.userProfileService.ensureProfile(appUser);
    return appUser;
  }

  async logout(): Promise<void> {
    const auth = getFirebaseAuth();
    if (auth) {
      await signOut(auth);
    }

    localStorage.removeItem(DEMO_USER_KEY);
    this.userSubject.next(null);
    this.loadingSubject.next(false);
  }

  private bootstrapAuth(): void {
    if (!isFirebaseEnabled()) {
      const saved = localStorage.getItem(DEMO_USER_KEY);
      if (saved) {
        this.userSubject.next(JSON.parse(saved) as AppUser);
      }
      this.loadingSubject.next(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      this.loadingSubject.next(false);
      return;
    }

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const appUser = this.mapFirebaseUser(user);
        this.userSubject.next(appUser);
        await this.userProfileService.ensureProfile(appUser);
      } else {
        this.userSubject.next(null);
      }
      this.loadingSubject.next(false);
    });
  }

  private mapFirebaseUser(user: User): AppUser {
    return {
      uid: user.uid,
      displayName: user.displayName ?? 'IELTS9s Learner',
      email: user.email ?? '',
      photoURL: user.photoURL ?? 'https://ui-avatars.com/api/?name=IELTS9s&background=1d4ed8&color=ffffff',
      provider: 'firebase'
    };
  }
}
