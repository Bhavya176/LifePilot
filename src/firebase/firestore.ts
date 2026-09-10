import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
  enableNetwork,
  disableNetwork,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Firestore,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { app } from './config';
import { Platform } from 'react-native';

let firestoreDb: Firestore;

try {
  firestoreDb = initializeFirestore(app, {
    localCache:
      Platform.OS === 'web'
        ? persistentLocalCache({
            tabManager: persistentSingleTabManager(undefined),
          })
        : memoryLocalCache(),
  });
} catch (e) {
  firestoreDb = getFirestore(app);
}

export const db: Firestore = firestoreDb;

/**
 * Control Firestore network connection (useful for offline mode testing and battery saving)
 */
export async function setFirestoreNetworkEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await enableNetwork(db);
    } else {
      await disableNetwork(db);
    }
  } catch (err) {
    console.warn('Firestore network toggle error:', err);
  }
}

// Collection path helper functions enforcing user data isolation
export function getUserDocRef(userId: string) {
  return doc(db, 'users', userId);
}

export function getUserCollectionRef(userId: string, subCollection: string) {
  return collection(db, 'users', userId, subCollection);
}

export function getUserSubDocRef(userId: string, subCollection: string, docId: string) {
  return doc(db, 'users', userId, subCollection, docId);
}

/**
 * Recursively strips undefined keys from an object to prevent Firestore errors:
 * "Unsupported field value: undefined"
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeFirestoreData) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        clean[key] = sanitizeFirestoreData(value);
      }
    }
    return clean as T;
  }
  return data;
}

export async function updateUserDoc(userId: string, data: any): Promise<void> {
  const dRef = getUserDocRef(userId);
  const cleanData = sanitizeFirestoreData(data);
  await setDoc(dRef, {
    ...cleanData,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

// Common Firestore helper wrappers
export async function addDocument<T extends DocumentData>(
  userId: string,
  subCollection: string,
  data: any
): Promise<string> {
  const colRef = getUserCollectionRef(userId, subCollection);
  const cleanData = sanitizeFirestoreData(data);
  const docRef = await addDoc(colRef, {
    ...cleanData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function setDocumentWithId<T extends DocumentData>(
  userId: string,
  subCollection: string,
  docId: string,
  data: T
): Promise<void> {
  const dRef = getUserSubDocRef(userId, subCollection, docId);
  const cleanData = sanitizeFirestoreData(data);
  await setDoc(dRef, {
    ...cleanData,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function updateDocument<T extends DocumentData>(
  userId: string,
  subCollection: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  const dRef = getUserSubDocRef(userId, subCollection, docId);
  const cleanData = sanitizeFirestoreData(data);
  await updateDoc(dRef, {
    ...cleanData,
    updatedAt: new Date().toISOString(),
  });
}

export async function removeDocument(
  userId: string,
  subCollection: string,
  docId: string
): Promise<void> {
  const dRef = getUserSubDocRef(userId, subCollection, docId);
  await deleteDoc(dRef);
}

export function subscribeToSubCollection<T>(
  userId: string,
  subCollection: string,
  constraints: QueryConstraint[],
  onData: (items: T[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = getUserCollectionRef(userId, subCollection);
  const q = query(colRef, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as T);
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      else console.warn(`Firestore subscription error on ${subCollection}:`, error);
    }
  );
}
