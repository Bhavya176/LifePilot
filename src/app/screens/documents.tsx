import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatFileSize } from '../../utils/formatters';
import { useDocuments } from '../../hooks/useDocuments';
import { DocumentItem } from '../../types/document';
import { useSecurity } from '../../context/SecurityContext';
import { Button } from '../../components/ui/Button';
import { s, vs, ms, fs } from '../../utils/responsive';

export default function DocumentsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const { isBiometricEnabled, isVaultLocked, unlockVault } = useSecurity();
  const [searchQuery, setSearchQuery] = useState('');
  const { documents, loading, uploadProgress, uploadDoc, deleteDoc } = useDocuments();

  const handleUploadClick = () => {
    Alert.alert(
      'Upload Document',
      'Choose how you would like to add a document:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload Sample File',
          onPress: async () => {
            try {
              const sampleText = `Sample Document Content - Created ${new Date().toISOString()}`;
              const blob = new Blob([sampleText], { type: 'text/plain' });
              await uploadDoc('Receipt_or_Certificate_Doc.txt', 'Receipt', {
                name: 'Receipt_or_Certificate_Doc.txt',
                blob: blob,
                size: blob.size,
                mimeType: 'text/plain',
              });
              Alert.alert('Upload Successful', 'Sample document uploaded to Firebase Storage.');
            } catch (err: any) {
              Alert.alert('Upload Error', err.message || 'Failed to upload document.');
            }
          },
        },
        {
          text: 'Select File from Device',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
              });

              if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
              }

              const file = result.assets[0];
              const fileName = file.name || 'uploaded_document';
              const mimeType = file.mimeType || 'application/octet-stream';
              const fileSize = file.size || 0;

              await uploadDoc(fileName, 'Other', {
                name: fileName,
                blob: file.uri,
                size: fileSize,
                mimeType: mimeType,
              });

              Alert.alert('Upload Successful', `"${fileName}" has been uploaded to Firebase Storage and saved in your Document Vault.`);
            } catch (err: any) {
              Alert.alert('Upload Error', err.message || 'Failed to pick or upload document.');
            }
          },
        },
      ]
    );
  };

  const handleOpenDoc = async (docItem: DocumentItem) => {
    try {
      if (docItem.fileUrl) {
        await WebBrowser.openBrowserAsync(docItem.fileUrl);
      }
    } catch (e) {
      Linking.openURL(docItem.fileUrl).catch(() => {
        Alert.alert('File Link', docItem.fileUrl);
      });
    }
  };

  const handleDelete = (docItem: DocumentItem) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to permanently remove "${docItem.title}" from Firebase Storage and Firestore?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDoc(docItem),
        },
      ]
    );
  };

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isBiometricEnabled && isVaultLocked) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Header title="Document Vault" showBack isDarkMode={isDarkMode} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s(SPACING.xl) }}>
          <View
            style={{
              width: ms(84),
              height: ms(84),
              borderRadius: ms(42),
              backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: vs(SPACING.lg),
            }}
          >
            <Ionicons name="finger-print-outline" size={ms(44)} color={theme.primary} />
          </View>
          <Text style={{ fontSize: fs(18), fontWeight: '800', color: theme.textPrimary, textAlign: 'center' }}>
            Vault is Locked
          </Text>
          <Text
            style={{
              fontSize: fs(13),
              color: theme.textSecondary,
              textAlign: 'center',
              marginTop: vs(6),
              marginBottom: vs(SPACING.xl),
              lineHeight: fs(18),
            }}
          >
            Authenticate with Face ID, Touch ID, or Device Passcode to access your protected documents.
          </Text>
          <Button
            title="Unlock with Biometrics"
            onPress={unlockVault}
            isDarkMode={isDarkMode}
            style={{ width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Document Vault"
        subtitle="Securely store certificates, receipts & IDs"
        showBack
        isDarkMode={isDarkMode}
        rightAction={
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={handleUploadClick}
          >
            <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Security Banner Warning */}
      <View style={[styles.warningBanner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#B45309" />
        <Text style={[styles.warningText, { color: '#B45309' }]}>
          Protected by Firebase Security Rules. Only your authenticated user account can access your files.
        </Text>
      </View>

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, { color: theme.primary }]}>
            Uploading to Firebase Storage: {uploadProgress}%
          </Text>
          <ProgressBar progress={uploadProgress / 100} color={theme.primary} isDarkMode={isDarkMode} />
        </View>
      )}

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          isDarkMode={isDarkMode}
          leftIcon={<Ionicons name="search-outline" size={20} color={theme.textMuted} />}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: SPACING.md, color: theme.textSecondary }}>
              Loading documents vault...
            </Text>
          </View>
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            title="Vault is Empty"
            description="Upload important files, receipts, or certificates to your Firebase Storage vault."
            actionTitle="Upload Document"
            onAction={handleUploadClick}
            isDarkMode={isDarkMode}
            iconName="cloud-upload-outline"
          />
        ) : (
          filteredDocs.map((docItem) => (
            <Card key={docItem.id} isDarkMode={isDarkMode} style={styles.docCard}>
              <View style={styles.docRow}>
                <View style={[styles.docIcon, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="document-text" size={24} color={theme.primary} />
                </View>

                <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                  <Text style={[styles.docTitle, { color: theme.textPrimary }]}>
                    {docItem.title}
                  </Text>
                  <Text style={[styles.docMeta, { color: theme.textSecondary }]}>
                    {formatFileSize(docItem.fileSize)} • {docItem.category}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleOpenDoc(docItem)}
                >
                  <Ionicons name="open-outline" size={22} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDelete(docItem)}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(RADIUS.full),
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(SPACING.md),
    marginVertical: vs(SPACING.xs),
    padding: s(SPACING.sm + 4),
    borderRadius: ms(RADIUS.md),
    borderWidth: 1,
  },
  warningText: {
    fontSize: fs(12),
    fontWeight: '500',
    marginLeft: s(SPACING.xs + 4),
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: s(SPACING.md),
    marginVertical: vs(SPACING.xs),
  },
  progressText: {
    fontSize: fs(13),
    fontWeight: '600',
    marginBottom: vs(4),
  },
  searchContainer: {
    paddingHorizontal: s(SPACING.md),
    marginVertical: vs(SPACING.xs),
  },
  scrollContent: {
    paddingHorizontal: s(SPACING.md),
    paddingBottom: vs(SPACING.xl),
  },
  docCard: {
    marginBottom: vs(SPACING.sm),
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIcon: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(RADIUS.md),
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  docMeta: {
    fontSize: fs(12),
    marginTop: vs(2),
  },
  actionBtn: {
    padding: s(6),
    marginLeft: s(SPACING.xs),
  },
});
