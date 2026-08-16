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
import { updateUserProfile } from '../../firebase/auth';
import { s, vs, ms, fs } from '../../utils/responsive';

export default function ProfileScreen() {
  const { isDarkMode } = useTheme();
  const { user, setUser } = useAuthContext();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || 'user@example.com');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
      const uid = user?.uid || 'demo-user-123';
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
            style={{ marginTop: SPACING.sm }}
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
});
