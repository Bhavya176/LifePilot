import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { uploadUserFile } from '../../firebase/storage';
import { updateUserProfile, auth } from '../../firebase/auth';
import { HapticsService } from '../../services/hapticsService';
import { s, vs, ms, fs } from '../../utils/responsive';

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { user, setUser, verifyEmail, sendPasswordReset, signOut, deleteAccount } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const isGuest = !!user?.isGuest;
  const [name, setName] = useState(user?.name || (isGuest ? 'Guest Explorer' : ''));
  const [email] = useState(user?.email || (isGuest ? 'Guest Mode (No email linked)' : 'user@example.com'));
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      isGuest ? 'Exit Guest Mode' : 'Sign Out',
      isGuest
        ? 'Are you sure you want to exit guest mode? To preserve your tasks, habits, and progress across devices, consider creating a free account.'
        : 'Are you sure you want to sign out of LifePilot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isGuest ? 'Exit Guest Mode' : 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);
              await HapticsService.medium();
              await signOut();
              router.replace('/(auth)/welcome');
            } catch (err: any) {
              Alert.alert('Sign Out Error', err?.message || 'Failed to sign out. Please try again.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account Permanently',
      'Are you absolutely sure? This will delete your LifePilot account and all associated personal data (tasks, habits, notes, expenses, goals, and documents). This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await HapticsService.heavy();
              await deleteAccount();
              router.replace('/(auth)/welcome');
            } catch (e: any) {
              Alert.alert('Account Deletion Failed', e?.message || 'Could not delete account.');
            }
          },
        },
      ]
    );
  };

  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      await verifyEmail();
      Alert.alert('Verification Sent', `A verification link has been sent to ${email}. Please check your inbox.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send verification email.');
    } finally {
      setSendingVerification(false);
    }
  };

  const handleSendResetPassword = async () => {
    setSendingReset(true);
    try {
      await sendPasswordReset(email);
      Alert.alert('Password Reset Sent', `A password reset link has been dispatched to ${email}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send password reset email.');
    } finally {
      setSendingReset(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access media library is required to select a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingAvatar(true);
      const uid = auth.currentUser?.uid || user?.uid;
      if (!uid) throw new Error('User must be signed in.');
      const fileName = `avatar_${Date.now()}.jpg`;

      const { downloadUrl } = await uploadUserFile(
        uid,
        'profile',
        fileName,
        asset.uri,
        'image/jpeg'
      );

      await updateUserProfile({ displayName: name || user?.name, photoURL: downloadUrl });

      if (user) {
        setUser({ ...user, profileImage: downloadUrl });
      }

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      Alert.alert('Upload Error', error.message || 'Failed to upload profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await updateUserProfile({ displayName: name });
      if (user) {
        setUser({ ...user, name });
      }
      Alert.alert('Profile Updated', 'Your profile details have been saved.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="User Profile"
        showBack
        isDarkMode={isDarkMode}
        rightAction={
          <TouchableOpacity
            style={[
              styles.headerLogoutBtn,
              { backgroundColor: isDarkMode ? '#271B20' : '#FEE2E2' },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel="Sign Out"
          >
            <Ionicons name="log-out-outline" size={ms(18)} color="#EF4444" />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Guest Mode Banner if exploring as Guest */}
        {isGuest && (
          <Card isDarkMode={isDarkMode} style={[styles.guestCard, { borderColor: '#F59E0B' }]}>
            <View style={styles.guestRow}>
              <Ionicons name="sparkles" size={ms(22)} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: s(SPACING.sm) }}>
                <Text style={[styles.guestTitle, { color: theme.textPrimary }]}>
                  Guest Account Active
                </Text>
                <Text style={[styles.guestSub, { color: theme.textSecondary }]}>
                  Create a permanent account to sync your tasks, streaks, and expenses across devices.
                </Text>
              </View>
            </View>
            <Button
              title="Create Free Account"
              size="sm"
              onPress={() => router.push('/(auth)/register')}
              isDarkMode={isDarkMode}
              style={{ marginTop: vs(SPACING.sm) }}
            />
          </Card>
        )}

        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: theme.primaryLight }]}
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={54} color={theme.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cameraBtn, { backgroundColor: theme.primary }]}
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
          >
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Card isDarkMode={isDarkMode} style={styles.card}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            isDarkMode={isDarkMode}
            leftIcon={<Ionicons name="person-outline" size={20} color={theme.textMuted} />}
          />

          <Input
            label="Email Address"
            value={email}
            editable={false}
            isDarkMode={isDarkMode}
            leftIcon={<Ionicons name="mail-outline" size={20} color={theme.textMuted} />}
            helperText={isGuest ? 'Create an account to attach an email.' : 'Email address cannot be changed.'}
          />

          <Button
            title="Save Profile Changes"
            onPress={handleUpdateProfile}
            loading={loading}
            isDarkMode={isDarkMode}
            style={{ marginTop: vs(SPACING.sm) }}
          />
        </Card>

        {/* Email Verification Card - Only for registered accounts */}
        {!isGuest && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: vs(SPACING.lg) }]}>
              Account Verification
            </Text>
            <Card isDarkMode={isDarkMode} style={styles.card}>
              <View style={styles.verifyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.verifyTitle, { color: theme.textPrimary }]}>Email Status</Text>
                  <Text style={[styles.verifySub, { color: user?.emailVerified ? theme.success : theme.warning }]}>
                    {user?.emailVerified ? '✅ Verified (Firebase Auth Secured)' : '⚠️ Unverified Email'}
                  </Text>
                </View>
                {!user?.emailVerified && (
                  <Button
                    title="Verify Email"
                    size="sm"
                    variant="outline"
                    onPress={handleSendVerification}
                    loading={sendingVerification}
                    isDarkMode={isDarkMode}
                  />
                )}
              </View>
            </Card>
          </>
        )}

        {/* Password Reset Section - Only for registered accounts */}
        {!isGuest && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: vs(SPACING.lg) }]}>
              Security & Password
            </Text>
            <Card isDarkMode={isDarkMode} style={styles.card}>
              <Text style={[styles.passwordSub, { color: theme.textSecondary }]}>
                Need to update your password? Firebase will send a secure password reset link to your email.
              </Text>
              <Button
                title="Send Password Reset Email 🔑"
                variant="outline"
                onPress={handleSendResetPassword}
                loading={sendingReset}
                isDarkMode={isDarkMode}
                style={{ marginTop: vs(SPACING.sm) }}
              />
            </Card>
          </>
        )}

        {/* Account Session & Sign Out Actions */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: vs(SPACING.lg) }]}>
          Account Session
        </Text>
        <Card isDarkMode={isDarkMode} style={styles.card}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: isDarkMode ? '#271B20' : '#FEF2F2',
                borderColor: isDarkMode ? '#7F1D1D' : '#FECACA',
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Ionicons
                  name="log-out-outline"
                  size={ms(20)}
                  color="#EF4444"
                  style={{ marginRight: s(SPACING.sm) }}
                />
                <Text style={styles.logoutText}>
                  {isGuest ? 'Exit Guest Mode' : 'Sign Out of LifePilot'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!isGuest && (
            <TouchableOpacity
              style={styles.deleteAccountBtn}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={ms(15)}
                color="#EF4444"
                style={{ marginRight: s(SPACING.xs) }}
              />
              <Text style={styles.deleteAccountText}>
                Delete Account Permanently
              </Text>
            </TouchableOpacity>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(SPACING.xl),
  },
  headerLogoutBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(RADIUS.md),
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCard: {
    padding: s(SPACING.md),
    marginBottom: vs(SPACING.md),
    borderWidth: 1,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  guestSub: {
    fontSize: fs(12),
    marginTop: vs(2),
    lineHeight: fs(16),
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: vs(SPACING.lg),
    position: 'relative',
  },
  avatarCircle: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(RADIUS.full),
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: '36%',
    width: ms(32),
    height: ms(32),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  card: {
    padding: s(SPACING.lg),
  },
  sectionTitle: {
    fontSize: fs(14.5),
    fontWeight: '700',
    marginBottom: vs(SPACING.xs),
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifyTitle: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  verifySub: {
    fontSize: fs(12.5),
    marginTop: vs(2),
    fontWeight: '600',
  },
  passwordSub: {
    fontSize: fs(12.5),
    lineHeight: fs(18),
    marginBottom: vs(SPACING.xs),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(12),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
  },
  logoutText: {
    fontSize: fs(14.5),
    fontWeight: '700',
    color: '#EF4444',
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(SPACING.md),
    paddingVertical: vs(SPACING.xs),
  },
  deleteAccountText: {
    fontSize: fs(12.5),
    color: '#EF4444',
    fontWeight: '600',
  },
});
