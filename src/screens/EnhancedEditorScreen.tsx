/**
 * EnhancedEditorScreen
 *
 * Advanced code editor with:
 * - Real-time AI suggestions
 * - Error detection and highlighting
 * - Code execution
 * - Code saving with tags
 * - Syntax highlighting
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, typography, borderRadius } from '@constants/theme';

import CodeExecutionService, { ExecutionResult } from '@/services/execution/CodeExecutionService';
import AutoSuggestionService, { CodeSuggestion } from '@/services/ai/AutoSuggestionService';
import ErrorDetectionService, { CodeError } from '@/services/ai/ErrorDetectionService';
import CodeSavingService, { SavedCode } from '@/services/storage/CodeSavingService';
import AIConnectionManager from '@/services/ai/AIConnectionManager';

const EnhancedEditorScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Editor state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [cursorPosition, setCursorPosition] = useState(0);

  // AI features
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [errors, setErrors] = useState<CodeError[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');

  // Execution
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveTags, setSaveTags] = useState('');

  // Language selector
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const codeInputRef = useRef<TextInput>(null);

  // Supported languages for execution
  const supportedLanguages = CodeExecutionService.getSupportedLanguages();

  // Available languages
  const languages = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'Kotlin',
    'Swift',
    'Go',
    'Rust',
    'C++',
    'C#',
    'PHP',
    'Ruby',
    'HTML',
    'CSS',
    'SQL',
  ];

  /**
   * Detect errors when code changes
   */
  useEffect(() => {
    if (code.length > 0) {
      const detectedErrors = ErrorDetectionService.detectErrors(code, language);
      setErrors(detectedErrors);
    } else {
      setErrors([]);
    }
  }, [code, language]);

  /**
   * Get suggestions when typing (debounced)
   */
  useEffect(() => {
    if (code.length > 3) {
      AutoSuggestionService.getSuggestionsDebounced(
        {
          code,
          cursorPosition,
          language,
        },
        (newSuggestions) => {
          setSuggestions(newSuggestions);
        }
      );
    } else {
      setSuggestions([]);
    }

    return () => {
      AutoSuggestionService.cancelPendingSuggestions();
    };
  }, [code, cursorPosition, language]);

  /**
   * Handle code change
   */
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  /**
   * Handle selection change to track cursor
   */
  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  /**
   * Apply suggestion
   */
  const applySuggestion = (suggestion: CodeSuggestion) => {
    const before = code.substring(0, cursorPosition);
    const after = code.substring(cursorPosition);
    const newCode = before + suggestion.text + after;
    setCode(newCode);
    setSuggestions([]);

    // Move cursor after suggestion
    setTimeout(() => {
      const newPosition = cursorPosition + suggestion.text.length;
      codeInputRef.current?.setNativeProps({
        selection: { start: newPosition, end: newPosition },
      });
    }, 0);
  };

  /**
   * Generate code with AI
   */
  const generateCode = async () => {
    if (!prompt.trim()) {
      Alert.alert(t.editor.error, t.editor.enterPrompt);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await AIConnectionManager.generateWithRetry({
        prompt,
        language,
        maxTokens: 2048,
      });

      setCode(response.code);
      setPrompt('');
      Alert.alert(t.common.success, 'Kod başarıyla oluşturuldu!');
    } catch (error) {
      Alert.alert(t.common.error, error instanceof Error ? error.message : t.editor.apiError);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Execute code
   */
  const executeCode = async () => {
    if (!code.trim()) {
      Alert.alert(t.common.error, 'Lütfen kod girin');
      return;
    }

    if (!CodeExecutionService.isSupportedLanguage(language)) {
      Alert.alert(
        'Desteklenmiyor',
        `${language} henüz çalıştırma için desteklenmiyor. Sadece ${supportedLanguages.join(', ')} destekleniyor.`
      );
      return;
    }

    // Validate code for security
    const validation = CodeExecutionService.validateCode(code);
    if (!validation.valid) {
      Alert.alert(
        'Güvenlik Uyarısı',
        `Kod potansiyel güvenlik sorunları içeriyor:\n\n${validation.issues.join('\n')}\n\nYine de çalıştırmak istiyor musunuz?`,
        [
          { text: t.common.cancel, style: 'cancel' },
          { text: 'Çalıştır', onPress: () => performExecution() },
        ]
      );
      return;
    }

    performExecution();
  };

  const performExecution = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await CodeExecutionService.executeCode(code, language);
      setExecutionResult(result);

      if (!result.success) {
        Alert.alert('Çalıştırma Hatası', result.error || 'Bilinmeyen hata');
      }
    } catch (error) {
      Alert.alert(t.common.error, 'Kod çalıştırılamadı');
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Save code
   */
  const saveCode = async () => {
    if (!saveTitle.trim()) {
      Alert.alert(t.common.error, 'Lütfen bir başlık girin');
      return;
    }

    try {
      await CodeSavingService.saveCode({
        title: saveTitle,
        code,
        language,
        description: saveDescription,
        tags: saveTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        favorite: false,
      });

      setShowSaveModal(false);
      setSaveTitle('');
      setSaveDescription('');
      setSaveTags('');

      Alert.alert(t.common.success, 'Kod başarıyla kaydedildi!');
    } catch (error) {
      Alert.alert(t.common.error, 'Kod kaydedilemedi');
    }
  };

  /**
   * Get error stats
   */
  const errorStats = ErrorDetectionService.getErrorStats(errors);
  const sortedErrors = ErrorDetectionService.sortErrors(errors);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>Gelişmiş Editör</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => setShowSaveModal(true)}
            disabled={code.length === 0}
          >
            <Icon name="content-save" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selector */}
      <View style={[styles.languageBar, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguageModal(true)}
        >
          <Icon name="code-tags" size={16} color={theme.textSecondary} />
          <Text style={[styles.languageText, { color: theme.text }]}>{language}</Text>
          <Icon name="chevron-down" size={16} color={theme.textSecondary} />
        </TouchableOpacity>

        {errorStats.errors + errorStats.warnings + errorStats.info > 0 && (
          <View style={styles.errorStats}>
            {errorStats.errors > 0 && (
              <View style={styles.errorBadge}>
                <Icon name="alert-circle" size={14} color="#EF4444" />
                <Text style={styles.errorCount}>{errorStats.errors}</Text>
              </View>
            )}
            {errorStats.warnings > 0 && (
              <View style={styles.errorBadge}>
                <Icon name="alert" size={14} color="#F59E0B" />
                <Text style={styles.errorCount}>{errorStats.warnings}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* AI Prompt */}
        <View style={[styles.promptSection, { backgroundColor: theme.surface }]}>
          <TextInput
            style={[styles.promptInput, { color: theme.text, borderColor: theme.border }]}
            placeholder="AI'dan ne yapmasını istiyorsunuz?"
            placeholderTextColor={theme.textSecondary}
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: theme.primary }]}
            onPress={generateCode}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="auto-fix" size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Oluştur</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Code Editor */}
        <View style={[styles.editorContainer, { backgroundColor: theme.surface }]}>
          <TextInput
            ref={codeInputRef}
            style={[styles.codeInput, { color: theme.text }]}
            value={code}
            onChangeText={handleCodeChange}
            onSelectionChange={handleSelectionChange}
            placeholder="Kodunuzu buraya yazın veya AI ile oluşturun..."
            placeholderTextColor={theme.textSecondary}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
          />

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={[styles.suggestionsContainer, { backgroundColor: theme.background }]}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionItem, { borderColor: theme.border }]}
                  onPress={() => applySuggestion(suggestion)}
                >
                  <Icon name="lightbulb-outline" size={16} color={theme.primary} />
                  <Text style={[styles.suggestionText, { color: theme.text }]}>
                    {suggestion.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Errors List */}
        {sortedErrors.length > 0 && (
          <View style={[styles.errorsContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.errorsTitle, { color: theme.text }]}>
              Tespit Edilen Sorunlar ({sortedErrors.length})
            </Text>
            {sortedErrors.slice(0, 5).map((error, index) => (
              <View
                key={index}
                style={[
                  styles.errorItem,
                  {
                    borderLeftColor:
                      error.severity === 'error'
                        ? '#EF4444'
                        : error.severity === 'warning'
                        ? '#F59E0B'
                        : '#3B82F6',
                  },
                ]}
              >
                <Text style={[styles.errorLine, { color: theme.textSecondary }]}>
                  Satır {error.line}:{error.column}
                </Text>
                <Text style={[styles.errorMessage, { color: theme.text }]}>{error.message}</Text>
                {error.suggestedFix && (
                  <Text style={[styles.errorFix, { color: theme.primary }]}>
                    💡 {error.suggestedFix}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={executeCode}
            disabled={isExecuting || code.length === 0}
          >
            {isExecuting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="play" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Çalıştır</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Execution Result */}
        {executionResult && (
          <View
            style={[
              styles.resultContainer,
              {
                backgroundColor: executionResult.success ? theme.surface : '#FEE2E2',
              },
            ]}
          >
            <View style={styles.resultHeader}>
              <Icon
                name={executionResult.success ? 'check-circle' : 'alert-circle'}
                size={20}
                color={executionResult.success ? '#10B981' : '#EF4444'}
              />
              <Text style={[styles.resultTitle, { color: theme.text }]}>
                {executionResult.success ? 'Çalıştırma Başarılı' : 'Çalıştırma Hatası'}
              </Text>
              <Text style={[styles.resultTime, { color: theme.textSecondary }]}>
                {executionResult.executionTime}ms
              </Text>
            </View>
            <ScrollView style={styles.resultOutput} horizontal>
              <Text
                style={[
                  styles.resultText,
                  {
                    color: executionResult.success ? theme.text : '#DC2626',
                  },
                ]}
              >
                {executionResult.success ? executionResult.output : executionResult.error}
              </Text>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Save Modal */}
      <Modal visible={showSaveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Kodu Kaydet</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Başlık"
              placeholderTextColor={theme.textSecondary}
              value={saveTitle}
              onChangeText={setSaveTitle}
            />

            <TextInput
              style={[
                styles.modalInput,
                styles.modalTextArea,
                { backgroundColor: theme.background, color: theme.text },
              ]}
              placeholder="Açıklama (opsiyonel)"
              placeholderTextColor={theme.textSecondary}
              value={saveDescription}
              onChangeText={setSaveDescription}
              multiline
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Etiketler (virgülle ayırın)"
              placeholderTextColor={theme.textSecondary}
              value={saveTags}
              onChangeText={setSaveTags}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.background }]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={saveCode}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Dil Seçin</Text>
            <FlatList
              data={languages}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    language === item && { backgroundColor: theme.primary + '20' },
                  ]}
                  onPress={() => {
                    setLanguage(item);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text style={[styles.languageItemText, { color: theme.text }]}>{item}</Text>
                  {language === item && <Icon name="check" size={20} color={theme.primary} />}
                </TouchableOpacity>
              )}
            />
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
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  languageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  languageText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  errorStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorCount: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  promptSection: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  promptInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 60,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  editorContainer: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    minHeight: 300,
  },
  codeInput: {
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: 'monospace',
    minHeight: 300,
  },
  suggestionsContainer: {
    padding: spacing.sm,
    borderTopWidth: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.xs,
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
  },
  errorsContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorsTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  errorItem: {
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  errorLine: {
    fontSize: typography.fontSize.sm,
    marginBottom: 2,
  },
  errorMessage: {
    fontSize: typography.fontSize.sm,
    marginBottom: 2,
  },
  errorFix: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  resultContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  resultTitle: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  resultTime: {
    fontSize: typography.fontSize.sm,
  },
  resultOutput: {
    maxHeight: 200,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: typography.fontSize.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  languageItemText: {
    fontSize: typography.fontSize.md,
  },
});

export default EnhancedEditorScreen;
