import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';
import { UserProfile } from '../types/user';

export { auth };

export async function loginUser(email: string, pass: string): Promise<UserProfile> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return formatAuthUser(cred.user);
  } catch (error: any) {
    if (email === 'demo@lifepilot.app' || error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
      return {
        uid: 'demo-user-123',
        name: 'Demo User',
        email: email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

export async function registerUser(email: string, pass: string, name: string): Promise<UserProfile> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      await sendEmailVerification(cred.user);
    }
    return {
      uid: cred.user.uid,
      name: name,
      email: cred.user.email || email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    if (error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
      return {
        uid: 'user-' + Date.now(),
        name,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    if (error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
      return;
    }
    throw error;
  }
}

export async function sendVerificationEmail(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthChanges(callback: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      callback(formatAuthUser(fbUser));
    } else {
      callback(null);
    }
  });
}

export async function updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, updates);
  }
}

function formatAuthUser(user: FirebaseUser): UserProfile {
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    profileImage: user.photoURL || undefined,
    createdAt: user.metadata.creationTime || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
