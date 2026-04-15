import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '@/contexts/ThemeContext';
import { useAIService } from '@/contexts/AIServiceContext';
import { useOffline } from '@/contexts/OfflineContext';
import { spacing, typography, borderRadius } from '@constants/theme';
import { ClaudeService } from '@services/ai/ClaudeService';
import { OpenAIService } from '@services/ai/OpenAIService';
import LiveUpdateService from '@/services/update/LiveUpdateService';
import LocalCacheService from '@/services/offline/LocalCacheService';

const SettingsScreen: React.FC = () => {
  const { theme, themeMode, toggleTheme } = useTheme();
  const { currentProvider, setProvider, aiService } = useAIService();
  const { isOnline, isOffline, networkStatus } = useOffline();

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [rateLimit, setRateLimit] = useState<{
    limit: number;
    remaining: number;
    reset: Date;
    authenticated: boolean;
  } | null>(null);
  const [updateStatus, setUpdateStatus] = useState({
    isChecking: false,
    isUpdating: false,
    autoCheckEnabled: false,
  });
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [cacheStats, setCacheStats] = useState({
    totalCodes: 0,
    totalResponses: 0,
    queuedRequests: 0,
    cacheSize: '0 KB',
  });

  // Load update status and GitHub token on mount
  useEffect(() => {
    loadUpdateStatus();
    loadGitHubToken();
    loadRateLimit();
    loadCacheStats();
    const interval = setInterval(loadUpdateStatus, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUpdateStatus = async () => {
    const status = LiveUpdateService.getUpdateStatus();
    setUpdateStatus(status);

    const lastCheck = await LiveUpdateService.getLastCheckTime();
    setLastCheckTime(lastCheck);
  };

  const loadGitHubToken = async () => {
    const token = await LiveUpdateService.getGitHubToken();
    if (token) {
      setGithubToken(token);
    }
  };

  const loadRateLimit = async () => {
    const limit = await LiveUpdateService.checkGitHubRateLimit();
    setRateLimit(limit);
  };

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

  const handleManualUpdateCheck = async () => {
    await LiveUpdateService.manualCheck();
    await loadUpdateStatus();
  };

  const handleToggleAutoUpdate = () => {
    if (updateStatus.autoCheckEnabled) {
      LiveUpdateService.stopAutoCheck();
    } else {
      LiveUpdateService.startAutoCheck();
    }
    loadUpdateStatus();
  };

  const formatLastCheckTime = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  const handleSaveGitHubToken = async () => {
    try {
      await LiveUpdateService.setGitHubToken(githubToken);
      Alert.alert('Success', 'GitHub token saved successfully');
      await loadRateLimit();
      setGithubToken('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save GitHub token');
      console.error('Save GitHub token error:', error);
    }
  };

  const handleRemoveGitHubToken = async () => {
    Alert.alert(
      'Remove GitHub Token',
      'Are you sure you want to remove the GitHub token?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await LiveUpdateService.setGitHubToken('');
              Alert.alert('Success', 'GitHub token removed');
              await loadRateLimit();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove GitHub token');
            }
          },
        },
      ]
    );
  };

  const loadCacheStats = async () => {
    const stats = await LocalCacheService.getCacheStats();
    setCacheStats(stats);
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Offline Cache',
      'This will delete all cached code and AI responses. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await LocalCacheService.clearAllCache();
              await loadCacheStats();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
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

        {/* Live Update Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Updates</Text>

          {/* Auto Update Toggle */}
          <View style={[styles.settingRow, { backgroundColor: theme.surface, marginBottom: spacing.sm }]}>
            <View style={styles.settingLeft}>
              <Icon name="auto-fix" size={24} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Auto Update</Text>
            </View>
            <Switch
              value={updateStatus.autoCheckEnabled}
              onValueChange={handleToggleAutoUpdate}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Update Status */}
          <View style={[styles.updateStatusContainer, { backgroundColor: theme.surface }]}>
            <View style={styles.updateStatusRow}>
              <Icon
                name={updateStatus.isUpdating ? 'download' : updateStatus.isChecking ? 'refresh' : 'check-circle'}
                size={20}
                color={updateStatus.isUpdating || updateStatus.isChecking ? theme.primary : theme.success}
              />
              <Text style={[styles.updateStatusText, { color: theme.text }]}>
                {updateStatus.isUpdating
                  ? 'Downloading update...'
                  : updateStatus.isChecking
                  ? 'Checking for updates...'
                  : 'Up to date'}
              </Text>
            </View>

            {lastCheckTime && (
              <Text style={[styles.lastCheckText, { color: theme.textSecondary }]}>
                Last checked: {formatLastCheckTime(lastCheckTime)}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.checkUpdateButton,
                { backgroundColor: theme.primary },
                (updateStatus.isChecking || updateStatus.isUpdating) && styles.disabledButton,
              ]}
              onPress={handleManualUpdateCheck}
              disabled={updateStatus.isChecking || updateStatus.isUpdating}
            >
              {updateStatus.isChecking ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="cloud-download" size={20} color="#FFFFFF" />
                  <Text style={styles.checkUpdateButtonText}>Check for Updates</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.updateInfoText, { color: theme.textSecondary }]}>
              {updateStatus.autoCheckEnabled
                ? 'App checks for updates every 30 seconds'
                : 'Enable auto-update to get the latest features automatically'}
            </Text>
          </View>

          {/* GitHub Token Configuration */}
          <View style={[styles.apiKeyContainer, { backgroundColor: theme.surface, marginTop: spacing.md }]}>
            <View style={styles.githubTokenHeader}>
              <Icon name="github" size={20} color={theme.text} />
              <Text style={[styles.apiKeyLabel, { color: theme.text, marginLeft: spacing.xs }]}>
                GitHub Token (Optional)
              </Text>
            </View>

            {/* Rate Limit Info */}
            {rateLimit && (
              <View style={styles.rateLimitContainer}>
                <Text style={[styles.rateLimitText, { color: theme.textSecondary }]}>
                  {rateLimit.authenticated ? '🔑 Authenticated' : '⚠️  Not Authenticated'}
                </Text>
                <Text style={[styles.rateLimitText, { color: theme.textSecondary }]}>
                  Rate Limit: {rateLimit.remaining}/{rateLimit.limit}
                </Text>
                <Text style={[styles.rateLimitText, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]}>
                  Resets: {rateLimit.reset.toLocaleTimeString()}
                </Text>
              </View>
            )}

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
                value={githubToken}
                onChangeText={setGithubToken}
                placeholder="ghp_xxxxxxxxxxxx"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showGithubToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowGithubToken(!showGithubToken)}>
                <Icon
                  name={showGithubToken ? 'eye-off' : 'eye'}
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.tokenButtonRow}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary, flex: 1, marginRight: spacing.xs }]}
                onPress={handleSaveGitHubToken}
              >
                <Text style={styles.saveButtonText}>Save Token</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.removeTokenButton, { borderColor: theme.error, flex: 1, marginLeft: spacing.xs }]}
                onPress={handleRemoveGitHubToken}
              >
                <Text style={[styles.removeTokenButtonText, { color: theme.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.tokenInfoText, { color: theme.textSecondary }]}>
              Token increases rate limit from 60 to 5000 requests/hour
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert(
                'GitHub Token',
                'Get your token from:\nhttps://github.com/settings/tokens\n\nRequired scope: public_repo',
                [{ text: 'OK' }]
              )}
            >
              <Text style={[styles.tokenLinkText, { color: theme.primary }]}>
                How to get a token?
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Offline Mode Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Offline Mode</Text>

          {/* Network Status */}
          <View style={[styles.settingRow, { backgroundColor: theme.surface, marginBottom: spacing.sm }]}>
            <View style={styles.settingLeft}>
              <Icon
                name={isOnline ? 'wifi-check' : 'wifi-off'}
                size={24}
                color={isOnline ? theme.success : theme.error}
              />
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
                <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>
                  {networkStatus.type}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? theme.success : theme.error },
              ]}
            />
          </View>

          {/* Cache Statistics */}
          <View style={[styles.updateStatusContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.apiKeyLabel, { color: theme.text, marginBottom: spacing.sm }]}>
              Offline Cache
            </Text>

            <View style={styles.cacheStatRow}>
              <Text style={[styles.cacheStatLabel, { color: theme.textSecondary }]}>
                Cached Codes:
              </Text>
              <Text style={[styles.cacheStatValue, { color: theme.text }]}>
                {cacheStats.totalCodes}
              </Text>
            </View>

            <View style={styles.cacheStatRow}>
              <Text style={[styles.cacheStatLabel, { color: theme.textSecondary }]}>
                AI Responses:
              </Text>
              <Text style={[styles.cacheStatValue, { color: theme.text }]}>
                {cacheStats.totalResponses}
              </Text>
            </View>

            <View style={styles.cacheStatRow}>
              <Text style={[styles.cacheStatLabel, { color: theme.textSecondary }]}>
                Queued Requests:
              </Text>
              <Text style={[styles.cacheStatValue, { color: theme.text }]}>
                {cacheStats.queuedRequests}
              </Text>
            </View>

            <View style={styles.cacheStatRow}>
              <Text style={[styles.cacheStatLabel, { color: theme.textSecondary }]}>
                Cache Size:
              </Text>
              <Text style={[styles.cacheStatValue, { color: theme.text }]}>
                {cacheStats.cacheSize}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.clearCacheButton, { borderColor: theme.error }]}
              onPress={handleClearCache}
            >
              <Icon name="delete-sweep" size={20} color={theme.error} />
              <Text style={[styles.clearCacheButtonText, { color: theme.error }]}>
                Clear Cache
              </Text>
            </TouchableOpacity>

            <Text style={[styles.updateInfoText, { color: theme.textSecondary, marginTop: spacing.sm }]}>
              Offline mode allows you to use the app without internet. Your work is saved locally
              and synced when online.
            </Text>
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
                <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>2.1.0</Text>
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
  updateStatusContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  updateStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  updateStatusText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  lastCheckText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  checkUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  checkUpdateButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  disabledButton: {
    opacity: 0.6,
  },
  updateInfoText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  githubTokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rateLimitContainer: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  rateLimitText: {
    fontSize: typography.fontSize.sm,
    marginBottom: 2,
  },
  tokenButtonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  removeTokenButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  removeTokenButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  tokenInfoText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  tokenLinkText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cacheStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cacheStatLabel: {
    fontSize: typography.fontSize.sm,
  },
  cacheStatValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  clearCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  clearCacheButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default SettingsScreen;
