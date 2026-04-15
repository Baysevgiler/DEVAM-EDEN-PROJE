import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '@/contexts/ThemeContext';
import { useAIService } from '@/contexts/AIServiceContext';
import { spacing, typography, borderRadius } from '@constants/theme';
import { ProgrammingLanguage } from '@/types';

const EditorScreen: React.FC = () => {
  const { theme } = useTheme();
  const { aiService, isConfigured } = useAIService();

  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [language, setLanguage] = useState<ProgrammingLanguage>('javascript');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!isConfigured) {
      Alert.alert(
        'API Key Required',
        'Please configure your API key in Settings before using AI features.'
      );
      return;
    }

    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await aiService.generateCode({
        prompt,
        language,
      });
      setGeneratedCode(result.code);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate code. Please try again.');
      console.error('Code generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        {/* Prompt Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>What would you like to create?</Text>
          <TextInput
            style={[
              styles.promptInput,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="E.g., A function to validate email addresses"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Language Selector */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Language</Text>
          <View style={styles.languageRow}>
            {(['javascript', 'python', 'java'] as ProgrammingLanguage[]).map(lang => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageChip,
                  {
                    backgroundColor: language === lang ? theme.primary : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text
                  style={[
                    styles.languageChipText,
                    {
                      color: language === lang ? '#FFFFFF' : theme.text,
                    },
                  ]}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            { backgroundColor: theme.primary },
            isGenerating && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="auto-fix" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate Code</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generated Code */}
        {generatedCode && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Generated Code</Text>
            <View
              style={[
                styles.codeContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <ScrollView horizontal>
                <Text style={[styles.codeText, { color: theme.text }]}>{generatedCode}</Text>
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  promptInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    minHeight: 100,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  languageChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  languageChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  codeContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: 400,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
});

export default EditorScreen;
