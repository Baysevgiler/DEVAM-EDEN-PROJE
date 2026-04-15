/**
 * Offline Context
 *
 * Uygulama genelinde offline/online durumunu yönetir.
 * Tüm component'ler bu context'i kullanarak network durumunu takip edebilir.
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import OfflineService, { NetworkStatus } from '@/services/offline/OfflineService';

interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  networkStatus: NetworkStatus;
  showOfflineBanner: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    // Offline service'i başlat
    OfflineService.initialize();

    // Network değişikliklerini dinle
    const unsubscribe = OfflineService.addListener(status => {
      setNetworkStatus(status);

      // Offline olunca banner göster
      if (!status.isConnected || !status.isInternetReachable) {
        setShowOfflineBanner(true);
      } else {
        // Online olunca 2 saniye sonra banner'ı gizle
        setTimeout(() => {
          setShowOfflineBanner(false);
        }, 2000);
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
      OfflineService.cleanup();
    };
  }, []);

  const value: OfflineContextType = {
    isOnline: networkStatus.isConnected && networkStatus.isInternetReachable,
    isOffline: !networkStatus.isConnected || !networkStatus.isInternetReachable,
    networkStatus,
    showOfflineBanner,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
