import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';

import { useTheme } from '@/contexts/ThemeContext';
import { spacing, typography, borderRadius } from '@constants/theme';

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedDate: Date;
  extension?: string;
}

const FileManagerScreen: React.FC = () => {
  const { theme } = useTheme();
  const [currentPath, setCurrentPath] = useState(RNFS.DocumentDirectoryPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    try {
      const items = await RNFS.readDir(currentPath);

      const fileItems: FileItem[] = items.map(item => ({
        name: item.name,
        path: item.path,
        isDirectory: item.isDirectory(),
        size: item.size,
        modifiedDate: new Date(item.mtime),
        extension: item.isFile() ? item.name.split('.').pop() : undefined,
      }));

      // Önce klasörler, sonra dosyalar
      fileItems.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      setFiles(fileItems);
    } catch (error) {
      console.error('Failed to load files:', error);
      Alert.alert('Hata', 'Dosyalar yüklenemedi');
    }
  };

  const navigateToFolder = (folder: FileItem) => {
    if (folder.isDirectory) {
      setCurrentPath(folder.path);
    }
  };

  const navigateBack = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    if (parentPath) {
      setCurrentPath(parentPath);
    }
  };

  const createFileOrFolder = async () => {
    if (!newFileName.trim()) {
      Alert.alert('Hata', 'Lütfen bir isim girin');
      return;
    }

    const newPath = `${currentPath}/${newFileName}`;

    try {
      if (createType === 'folder') {
        await RNFS.mkdir(newPath);
      } else {
        await RNFS.writeFile(newPath, '', 'utf8');
      }

      setShowCreateModal(false);
      setNewFileName('');
      loadFiles();
      Alert.alert('Başarılı', `${createType === 'folder' ? 'Klasör' : 'Dosya'} oluşturuldu`);
    } catch (error) {
      console.error('Failed to create:', error);
      Alert.alert('Hata', 'Oluşturulamadı');
    }
  };

  const deleteFile = (file: FileItem) => {
    Alert.alert(
      'Sil',
      `${file.name} silinsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              if (file.isDirectory) {
                await RNFS.unlink(file.path);
              } else {
                await RNFS.unlink(file.path);
              }
              loadFiles();
              Alert.alert('Başarılı', 'Silindi');
            } catch (error) {
              console.error('Failed to delete:', error);
              Alert.alert('Hata', 'Silinemedi');
            }
          },
        },
      ]
    );
  };

  const renameFile = (file: FileItem) => {
    Alert.prompt(
      'Yeniden Adlandır',
      'Yeni isim:',
      async (newName: string) => {
        if (!newName.trim()) return;

        const newPath = `${currentPath}/${newName}`;
        try {
          await RNFS.moveFile(file.path, newPath);
          loadFiles();
          Alert.alert('Başarılı', 'Yeniden adlandırıldı');
        } catch (error) {
          console.error('Failed to rename:', error);
          Alert.alert('Hata', 'Yeniden adlandırılamadı');
        }
      },
      'plain-text',
      file.name
    );
  };

  const getFileIcon = (file: FileItem): string => {
    if (file.isDirectory) return 'folder';

    const ext = file.extension?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'language-javascript';
      case 'ts':
      case 'tsx':
        return 'language-typescript';
      case 'py':
        return 'language-python';
      case 'java':
        return 'language-java';
      case 'kt':
        return 'language-kotlin';
      case 'swift':
        return 'language-swift';
      case 'go':
        return 'language-go';
      case 'rs':
        return 'language-rust';
      case 'cpp':
      case 'c':
      case 'h':
        return 'language-c';
      case 'cs':
        return 'language-csharp';
      case 'php':
        return 'language-php';
      case 'rb':
        return 'language-ruby';
      case 'html':
        return 'language-html5';
      case 'css':
        return 'language-css3';
      case 'json':
        return 'code-json';
      case 'md':
        return 'language-markdown';
      case 'txt':
        return 'file-document-outline';
      default:
        return 'file-outline';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const renderFile = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={[styles.fileCard, { backgroundColor: theme.surface }]}
      onPress={() => item.isDirectory ? navigateToFolder(item) : setSelectedFile(item)}
      onLongPress={() => {
        Alert.alert(
          item.name,
          'İşlem seçin',
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Yeniden Adlandır', onPress: () => renameFile(item) },
            { text: 'Sil', style: 'destructive', onPress: () => deleteFile(item) },
          ]
        );
      }}
    >
      <Icon name={getFileIcon(item)} size={32} color={item.isDirectory ? theme.primary : theme.text} />
      <View style={styles.fileInfo}>
        <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.fileMetadata}>
          {!item.isDirectory && (
            <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
              {formatFileSize(item.size)}
            </Text>
          )}
          <Text style={[styles.fileDate, { color: theme.textSecondary }]}>
            {formatDate(item.modifiedDate)}
          </Text>
        </View>
      </View>
      {item.isDirectory && (
        <Icon name="chevron-right" size={24} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          onPress={navigateBack}
          disabled={currentPath === RNFS.DocumentDirectoryPath}
        >
          <Icon
            name="arrow-left"
            size={24}
            color={currentPath === RNFS.DocumentDirectoryPath ? theme.border : theme.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {currentPath.split('/').pop() || 'Dosyalarım'}
        </Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Icon name="plus" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Path */}
      <View style={[styles.pathBar, { backgroundColor: theme.surface }]}>
        <Icon name="folder-outline" size={16} color={theme.textSecondary} />
        <Text style={[styles.pathText, { color: theme.textSecondary }]} numberOfLines={1}>
          {currentPath.replace(RNFS.DocumentDirectoryPath, '~')}
        </Text>
      </View>

      {/* File List */}
      <FlatList
        data={files}
        keyExtractor={item => item.path}
        renderItem={renderFile}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="folder-open-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Bu klasör boş
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyButtonText}>Dosya Oluştur</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Yeni Oluştur
            </Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: createType === 'file' ? theme.primary : theme.background,
                  },
                ]}
                onPress={() => setCreateType('file')}
              >
                <Icon
                  name="file-outline"
                  size={24}
                  color={createType === 'file' ? '#FFFFFF' : theme.text}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: createType === 'file' ? '#FFFFFF' : theme.text },
                  ]}
                >
                  Dosya
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: createType === 'folder' ? theme.primary : theme.background,
                  },
                ]}
                onPress={() => setCreateType('folder')}
              >
                <Icon
                  name="folder-outline"
                  size={24}
                  color={createType === 'folder' ? '#FFFFFF' : theme.text}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: createType === 'folder' ? '#FFFFFF' : theme.text },
                  ]}
                >
                  Klasör
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder={`${createType === 'file' ? 'Dosya' : 'Klasör'} adı`}
              placeholderTextColor={theme.textSecondary}
              value={newFileName}
              onChangeText={setNewFileName}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.background }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewFileName('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={createFileOrFolder}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  pathBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  pathText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  listContent: {
    padding: spacing.md,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 4,
  },
  fileMetadata: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fileSize: {
    fontSize: typography.fontSize.sm,
  },
  fileDate: {
    fontSize: typography.fontSize.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  typeButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default FileManagerScreen;
