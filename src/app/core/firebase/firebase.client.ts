import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, GoogleAuthProvider, getAuth } from 'firebase/auth';
import { Analytics, getAnalytics } from 'firebase/analytics';
import { Firestore, doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { environment } from '../../../environments/environment';
import * as firebaseAppletConfig from '../../../../firebase-applet-config.json';

type FirebaseConfig = typeof environment.firebase;

const firebaseConfig: FirebaseConfig = isValidConfig(firebaseAppletConfig)
  ? firebaseAppletConfig
  : environment.firebase;

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let analyticsInstance: Analytics | null = null;

function isValidConfig(config: Partial<FirebaseConfig> | null | undefined): config is FirebaseConfig {
  return Boolean(
    config?.apiKey &&
    config?.authDomain &&
    config?.projectId &&
    config?.appId
  );
}

export function isFirebaseEnabled(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseEnabled()) {
    return null;
  }

  if (!appInstance) {
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  return appInstance;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  if (!authInstance) {
    authInstance = getAuth(app);
  }

  return authInstance;
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  if (!dbInstance) {
    dbInstance = getFirestore(app);
  }

  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  if (!storageInstance) {
    storageInstance = getStorage(app);
  }

  return storageInstance;
}

export function getFirebaseAnalytics(): Analytics | null {
  const app = getFirebaseApp();
  if (!app || typeof window === 'undefined') {
    return null;
  }

  if (!analyticsInstance) {
    analyticsInstance = getAnalytics(app);
  }

  return analyticsInstance;
}

export function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  return provider;
}

async function testConnection(): Promise<void> {
  const db = getFirebaseDb();
  if (!db) {
    return;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }>;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const auth = getFirebaseAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map((provider) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) ?? []
    },
    operationType,
    path
  };

  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
