import OfflineService from '@/services/offline/OfflineService';
import NetInfo from '@react-native-community/netinfo';

jest.mock('@react-native-community/netinfo');

describe('OfflineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    OfflineService.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize and fetch initial network state', async () => {
      const mockFetch = NetInfo.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });

      OfflineService.initialize();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalled();
      expect(OfflineService.isOnline()).toBe(true);
    });

    it('should set up network change listener', () => {
      const mockAddEventListener = NetInfo.addEventListener as jest.Mock;

      OfflineService.initialize();

      expect(mockAddEventListener).toHaveBeenCalled();
    });
  });

  describe('Network Status', () => {
    it('should return correct online status', () => {
      expect(OfflineService.isOnline()).toBe(true);
    });

    it('should return correct offline status', () => {
      expect(OfflineService.isOffline()).toBe(false);
    });

    it('should get network status', () => {
      const status = OfflineService.getNetworkStatus();

      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('isInternetReachable');
      expect(status).toHaveProperty('type');
    });
  });

  describe('Listeners', () => {
    it('should add listener and receive initial status', () => {
      const callback = jest.fn();

      OfflineService.addListener(callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          isConnected: expect.any(Boolean),
          isInternetReachable: expect.any(Boolean),
          type: expect.any(String),
        })
      );
    });

    it('should unsubscribe listener', () => {
      const callback = jest.fn();
      const unsubscribe = OfflineService.addListener(callback);

      callback.mockClear();
      unsubscribe();

      // Listener should not be called after unsubscribe
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', () => {
      OfflineService.initialize();
      OfflineService.cleanup();

      // After cleanup, should still work but with default values
      expect(() => OfflineService.getNetworkStatus()).not.toThrow();
    });
  });
});
