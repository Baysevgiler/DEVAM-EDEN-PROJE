import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '@/contexts/ThemeContext';
import { useAIService } from '@/contexts/AIServiceContext';
import { spacing, typography, borderRadius } from '@constants/theme';
import { ClaudeService } from '@services/ai/ClaudeService';
import { OpenAIService } from '@services/ai/OpenAIService';

const SettingsScreen: React.FC = () => {
  const { theme, themeMode, toggleTheme } = useTheme();
  const { currentProvider, setProvider, aiService } = useAIService();

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    try {
      if (aiService instanceof ClaudeService || aiService instanceof OpenAIService) {
        await aiService.setApiKey(apiKey);
        Alert.alert('Success', 'API key saved successfully');
        setApiKey('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
      console.error('Save API key error:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          <View style={[styles.settingRow, { backgroundColor: theme.surface }]}>
            <View style={styles.settingLeft}>
              <Icon name="theme-light-dark" size={24} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* AI Provider Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Provider</Text>
          <View style={[styles.settingRow, { backgroundColor: theme.surface }]}>
            <View style={styles.settingLeft}>
              <Icon name="robot" size={24} color={theme.text} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  {currentProvider === 'claude' ? 'Claude' : 'OpenAI'}
                </Text>
                <TouchableOpacity
                  onPress={() => setProvider(currentProvider === 'claude' ? 'openai' : 'claude')}
                >
                  <Text style={[styles.changeText, { color: theme.primary }]}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* API Key Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>API Configuration</Text>
          <View style={[styles.apiKeyContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.apiKeyLabel, { color: theme.text }]}>
              {currentProvider === 'claude' ? 'Anthropic' : 'OpenAI'} API Key
            </Text>
            <View style={styles.apiKeyInputRow}>
              <TextInput
                style={[
                  styles.apiKeyInput,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Enter your API key"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                <Icon
                  name={showApiKey ? 'eye-off' : 'eye'}
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveApiKey}
            >
              <Text style={styles.saveButtonText}>Save API Key</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
          <View style={[styles.settingRow, { backgroundColor: theme.surface }]}>
            <View style={styles.settingLeft}>
              <Icon name="information" size={24} color={theme.text} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Version</Text>
                <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>0.1.0</Text>
              </View>
            </View>
          </View>
        </View>
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
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  settingSubtext: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  changeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  apiKeyContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  apiKeyLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  apiKeyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  apiKeyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.md,
  },
  saveButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default SettingsScreen;
