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
import { s, vs, ms, fs } from '../../utils/responsive';

export default function ProfileScreen() {
  const { isDarkMode } = useTheme();
  const { user, setUser, verifyEmail, sendPasswordReset } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || 'user@example.com');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

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
      <Header title="User Profile" showBack isDarkMode={isDarkMode} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            helperText="Email address cannot be changed."
          />

          <Button
            title="Save Profile Changes"
            onPress={handleUpdateProfile}
            loading={loading}
            isDarkMode={isDarkMode}
            style={{ marginTop: vs(SPACING.sm) }}
          />
        </Card>

        {/* Email Verification Card */}
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

        {/* Password Reset Section */}
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
});
