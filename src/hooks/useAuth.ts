import { useAuthContext } from '../context/AuthContext';
import {
  loginUser,
  registerUser,
  resetPassword,
  sendVerificationEmail,
  logoutUser,
} from '../firebase/auth';
import { UserProfile } from '../types/user';

export function useAuth() {
  const { user, loading, setUser, signOut } = useAuthContext();

  const signIn = async (email: string, pass: string): Promise<UserProfile> => {
    const profile = await loginUser(email, pass);
    setUser(profile);
    return profile;
  };

  const signUp = async (email: string, pass: string, name: string): Promise<UserProfile> => {
    const profile = await registerUser(email, pass, name);
    setUser(profile);
    return profile;
  };

  const sendReset = async (email: string): Promise<void> => {
    await resetPassword(email);
  };

  const sendVerification = async (): Promise<void> => {
    await sendVerificationEmail();
  };

  const updateUserProfileState = (updatedFields: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...updatedFields, updatedAt: new Date().toISOString() });
    }
  };

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signOut,
    sendReset,
    sendVerification,
    updateUserProfileState,
  };
}
