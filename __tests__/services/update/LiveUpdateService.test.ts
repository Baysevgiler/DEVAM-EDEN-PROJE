/**
 * LiveUpdateService Tests
 *
 * Tests for the live update system that automatically downloads and applies updates from GitHub
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import LiveUpdateService from '@/services/update/LiveUpdateService';

// Mock fetch globally
global.fetch = jest.fn();

describe('LiveUpdateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  afterEach(() => {
    LiveUpdateService.cleanup();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'abc123',
          commit: {
            committer: {
              date: '2024-01-01T00:00:00Z',
            },
            message: 'Test commit',
          },
        }),
      });

      await LiveUpdateService.initialize();

      const status = LiveUpdateService.getUpdateStatus();
      expect(status.autoCheckEnabled).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(LiveUpdateService.initialize()).resolves.not.toThrow();
    });
  });

  describe('update checking', () => {
    it('should detect when update is available', async () => {
      // Set current version
      await AsyncStorage.setItem('@app_current_version', 'old123');

      // Mock GitHub API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'new456',
          commit: {
            committer: {
              date: '2024-01-01T00:00:00Z',
            },
            message: 'New features',
          },
        }),
      });

      // Mock download
      (RNFS.downloadFile as jest.Mock).mockReturnValueOnce({
        promise: Promise.resolve({ statusCode: 200 }),
      });

      const status = await LiveUpdateService.checkForUpdates(false);

      expect(status.isUpdateAvailable).toBe(true);
      expect(status.currentVersion).toBe('old123');
      expect(status.latestVersion).toBe('new456');
    });

    it('should detect when app is up to date', async () => {
      const currentSha = 'abc123';
      await AsyncStorage.setItem('@app_current_version', currentSha);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: currentSha,
          commit: {
            committer: {
              date: '2024-01-01T00:00:00Z',
            },
            message: 'Current version',
          },
        }),
      });

      const status = await LiveUpdateService.checkForUpdates(true);

      expect(status.isUpdateAvailable).toBe(false);
      expect(status.currentVersion).toBe(currentSha);
      expect(status.latestVersion).toBe(currentSha);
    });

    it('should handle GitHub API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const status = await LiveUpdateService.checkForUpdates(false);

      expect(status.isUpdateAvailable).toBe(false);
    });

    it('should prevent concurrent checks', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const promise1 = LiveUpdateService.checkForUpdates(false);
      const promise2 = LiveUpdateService.checkForUpdates(false);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should save last check time', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'abc123',
          commit: {
            committer: {
              date: '2024-01-01T00:00:00Z',
            },
            message: 'Test',
          },
        }),
      });

      await LiveUpdateService.checkForUpdates(false);

      const lastCheck = await LiveUpdateService.getLastCheckTime();
      expect(lastCheck).toBeInstanceOf(Date);
    });
  });

  describe('auto-check functionality', () => {
    it('should start auto-check', () => {
      LiveUpdateService.startAutoCheck();

      const status = LiveUpdateService.getUpdateStatus();
      expect(status.autoCheckEnabled).toBe(true);
    });

    it('should stop auto-check', () => {
      LiveUpdateService.startAutoCheck();
      LiveUpdateService.stopAutoCheck();

      const status = LiveUpdateService.getUpdateStatus();
      expect(status.autoCheckEnabled).toBe(false);
    });

    it('should replace existing auto-check when started twice', () => {
      LiveUpdateService.startAutoCheck();
      LiveUpdateService.startAutoCheck();

      const status = LiveUpdateService.getUpdateStatus();
      expect(status.autoCheckEnabled).toBe(true);
    });
  });

  describe('update application', () => {
    it('should download and apply update', async () => {
      await AsyncStorage.setItem('@app_current_version', 'old123');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'new456',
          commit: {
            committer: {
              date: '2024-01-01T00:00:00Z',
            },
            message: 'New update',
          },
        }),
      });

      (RNFS.downloadFile as jest.Mock).mockReturnValueOnce({
        promise: Promise.resolve({ statusCode: 200 }),
      });

      await LiveUpdateService.checkForUpdates(false);

      // Version should be updated
      const newVersion = await AsyncStorage.getItem('@app_current_version');
      expect(newVersion).toBe('new456');
    });

    it('should handle download failures', async () => {
      await AsyncStorage.setItem('@app_current_version', 'old123');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'new456',
          commit: {
            committer: {
              date: '2024-01-01T00:00:00Z',
            },
            message: 'New update',
          },
        }),
      });

      (RNFS.downloadFile as jest.Mock).mockReturnValueOnce({
        promise: Promise.resolve({ statusCode: 404 }),
      });

      await LiveUpdateService.checkForUpdates(false);

      // Version should NOT be updated on failure
      const version = await AsyncStorage.getItem('@app_current_version');
      expect(version).toBe('old123');
    });

    it('should prevent concurrent updates', async () => {
      await AsyncStorage.setItem('@app_current_version', 'old123');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          sha: 'new456',
          commit: {
            committer: {
              date: '2024-01-01T00:00:00Z',
            },
            message: 'Update',
          },
        }),
      });

      (RNFS.downloadFile as jest.Mock).mockReturnValue({
        promise: new Promise(resolve => setTimeout(() => resolve({ statusCode: 200 }), 100)),
      });

      const promise1 = LiveUpdateService.checkForUpdates(false);
      const promise2 = LiveUpdateService.checkForUpdates(false);

      await Promise.all([promise1, promise2]);

      // Download should only be called once
      expect(RNFS.downloadFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('status tracking', () => {
    it('should track checking status', () => {
      const initialStatus = LiveUpdateService.getUpdateStatus();
      expect(initialStatus.isChecking).toBe(false);
    });

    it('should track updating status', () => {
      const initialStatus = LiveUpdateService.getUpdateStatus();
      expect(initialStatus.isUpdating).toBe(false);
    });

    it('should get last check time', async () => {
      const lastCheck = await LiveUpdateService.getLastCheckTime();
      expect(lastCheck === null || lastCheck instanceof Date).toBe(true);
    });
  });

  describe('manual check', () => {
    it('should perform manual check', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'abc123',
          commit: {
            committer: {
              date: '2024-01-01T00:00:00Z',
            },
            message: 'Current version',
          },
        }),
      });

      await expect(LiveUpdateService.manualCheck()).resolves.not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', () => {
      LiveUpdateService.startAutoCheck();
      LiveUpdateService.cleanup();

      const status = LiveUpdateService.getUpdateStatus();
      expect(status.autoCheckEnabled).toBe(false);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return default version when none stored', async () => {
      const status = await LiveUpdateService.checkForUpdates(false);
      expect(status.currentVersion).toBe('0.0.0');
    });

    it('should return stored version', async () => {
      await AsyncStorage.setItem('@app_current_version', '1.2.3');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: '1.2.3',
          commit: {
            committer: {
              date: '2024-01-01T00:00:00Z',
            },
            message: 'Test',
          },
        }),
      });

      const status = await LiveUpdateService.checkForUpdates(false);
      expect(status.currentVersion).toBe('1.2.3');
    });
  });

  describe('GitHub Token Management', () => {
    it('should save GitHub token', async () => {
      const token = 'ghp_test123';
      await LiveUpdateService.setGitHubToken(token);

      const savedToken = await AsyncStorage.getItem('@github_token');
      expect(savedToken).toBe(token);
    });

    it('should retrieve GitHub token', async () => {
      const token = 'ghp_test456';
      await AsyncStorage.setItem('@github_token', token);

      const retrievedToken = await LiveUpdateService.getGitHubToken();
      expect(retrievedToken).toBe(token);
    });

    it('should remove GitHub token when empty string provided', async () => {
      await AsyncStorage.setItem('@github_token', 'ghp_old');
      await LiveUpdateService.setGitHubToken('');

      const token = await AsyncStorage.getItem('@github_token');
      expect(token).toBeNull();
    });

    it('should use token in API requests when available', async () => {
      const token = 'ghp_test789';
      await LiveUpdateService.setGitHubToken(token);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sha: 'abc123',
          commit: {
            committer: {
              date: '2024-01-01T00:00:00Z',
            },
            message: 'Test',
          },
        }),
      });

      await LiveUpdateService.initialize();

      // Check if fetch was called with Authorization header
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      const lastCall = fetchCalls[fetchCalls.length - 1];
      expect(lastCall[1].headers.Authorization).toBe(`token ${token}`);
    });
  });

  describe('GitHub Rate Limit', () => {
    it('should check rate limit status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resources: {
            core: {
              limit: 5000,
              remaining: 4999,
              reset: 1640995200, // Unix timestamp
            },
          },
        }),
      });

      const rateLimit = await LiveUpdateService.checkGitHubRateLimit();

      expect(rateLimit).not.toBeNull();
      expect(rateLimit?.limit).toBe(5000);
      expect(rateLimit?.remaining).toBe(4999);
      expect(rateLimit?.reset).toBeInstanceOf(Date);
    });

    it('should handle rate limit check errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const rateLimit = await LiveUpdateService.checkGitHubRateLimit();

      expect(rateLimit).toBeNull();
    });
  });
});
