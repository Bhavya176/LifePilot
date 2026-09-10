import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { deleteDoc } from 'firebase/firestore';
import { auth } from './config';
import { UserProfile } from '../types/user';
import { updateUserDoc, getUserDocRef } from './firestore';
import { AnalyticsService } from './analytics';
import { SentryService } from '../services/sentry';

export { auth };

/** Convert Firebase Auth error codes to user-friendly messages */
export function getFriendlyAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again in a few moments.';
    case 'auth/requires-recent-login':
      return 'For security purposes, please log in again before deleting your account.';
    default:
      return error?.message || 'An authentication error occurred. Please try again.';
  }
}

/** Real Firebase Sign In */
export async function loginUser(email: string, pass: string): Promise<UserProfile> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const formatted = formatAuthUser(cred.user);
    
    // Sync profile metadata with Firestore
    await updateUserDoc(formatted.uid, {
      name: formatted.name,
      email: formatted.email,
      lastLoginAt: new Date().toISOString(),
    }).catch(() => null);

    AnalyticsService.logEvent('login', { method: 'password' });
    AnalyticsService.setUserIdentifier(formatted.uid);
    SentryService.addBreadcrumb('User logged in successfully', 'auth', 'info');

    return formatted;
  } catch (error: any) {
    SentryService.addBreadcrumb(`User login failed: ${error?.code || 'unknown'}`, 'auth', 'warning');
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/** Real Firebase Registration */
export async function registerUser(email: string, pass: string, name: string): Promise<UserProfile> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name.trim() });
      await sendEmailVerification(cred.user).catch(() => null);
    }
    const formatted: UserProfile = {
      uid: cred.user.uid,
      name: name.trim(),
      email: cred.user.email || email.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Initialize user document in Firestore
    await updateUserDoc(formatted.uid, {
      name: formatted.name,
      email: formatted.email,
      createdAt: formatted.createdAt,
    }).catch(() => null);

    AnalyticsService.logEvent('sign_up', { method: 'password' });
    AnalyticsService.setUserIdentifier(formatted.uid);
    SentryService.addBreadcrumb('User registered successfully', 'auth', 'info');

    return formatted;
  } catch (error: any) {
    SentryService.addBreadcrumb(`User registration failed: ${error?.code || 'unknown'}`, 'auth', 'warning');
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/** Real Firebase Password Reset */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    SentryService.addBreadcrumb('Password reset requested', 'auth', 'info');
  } catch (error: any) {
    SentryService.addBreadcrumb(`Password reset failed: ${error?.code || 'unknown'}`, 'auth', 'warning');
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/** Real Firebase Email Verification */
export async function sendVerificationEmail(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

/** Real Firebase Sign Out */
export async function logoutUser(): Promise<void> {
  AnalyticsService.setUserIdentifier(null);
  await firebaseSignOut(auth);
}

/**
 * Permanently delete user account and profile data (Apple App Store Guideline 5.1.1(v) Compliance)
 */
export async function deleteUserAccount(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found to delete.');
  }

  const userId = currentUser.uid;

  try {
    // 1. Delete user root document in Firestore
    const userDocRef = getUserDocRef(userId);
    await deleteDoc(userDocRef).catch((e) => console.warn('User doc cleanup warning:', e));

    // 2. Clear analytics tracking
    AnalyticsService.setUserIdentifier(null);

    // 3. Delete Firebase Auth user
    await deleteUser(currentUser);
  } catch (error: any) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/** Subscribe to real-time Firebase Auth state */
export function subscribeToAuthChanges(callback: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      callback(formatAuthUser(fbUser));
    } else {
      callback(null);
    }
  });
}

/** Real Firebase Profile Updates */
export async function updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, updates);
    if (updates.displayName || updates.photoURL) {
      await updateUserDoc(auth.currentUser.uid, {
        name: updates.displayName,
        profileImage: updates.photoURL,
      }).catch(() => null);
    }
    AnalyticsService.logEvent('profile_updated');
  }
}

function formatAuthUser(user: FirebaseUser): UserProfile {
  return {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Explorer',
    email: user.email || '',
    emailVerified: user.emailVerified,
    profileImage: user.photoURL || undefined,
    createdAt: user.metadata.creationTime || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
