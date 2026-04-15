/**
 * Offline Service
 *
 * Internet bağlantısını izler ve offline/online durumlarını yönetir.
 * Kullanıcılara offline modda bile uygulama kullanma imkanı sağlar.
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

type NetworkCallback = (status: NetworkStatus) => void;

class OfflineService {
  private isConnected: boolean = true;
  private isInternetReachable: boolean = true;
  private connectionType: string = 'unknown';
  private listeners: NetworkCallback[] = [];
  private unsubscribe: (() => void) | null = null;

  /**
   * Servisi başlat - internet bağlantısını izlemeye başla
   */
  public initialize(): void {
    console.log('🌐 Offline Service başlatılıyor...');

    // İlk durumu kontrol et
    NetInfo.fetch().then(state => {
      this.updateNetworkStatus(state);
      console.log('📶 İlk network durumu:', this.getNetworkStatus());
    });

    // Network değişikliklerini izle
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.updateNetworkStatus(state);
      this.notifyListeners();
    });
  }

  /**
   * Network durumunu güncelle
   */
  private updateNetworkStatus(state: NetInfoState): void {
    const wasConnected = this.isConnected;

    this.isConnected = state.isConnected ?? false;
    this.isInternetReachable = state.isInternetReachable ?? false;
    this.connectionType = state.type;

    // Bağlantı durumu değiştiyse log at
    if (wasConnected !== this.isConnected) {
      if (this.isConnected) {
        console.log('✅ Internet bağlantısı kuruldu');
      } else {
        console.log('❌ Internet bağlantısı kesildi - Offline moddasınız');
      }
    }
  }

  /**
   * Listener kaydet - network durumu değişince bildirim al
   */
  public addListener(callback: NetworkCallback): () => void {
    this.listeners.push(callback);

    // İlk çağrıda mevcut durumu bildir
    callback(this.getNetworkStatus());

    // Unsubscribe fonksiyonu döndür
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Tüm listener'lara bildirim gönder
   */
  private notifyListeners(): void {
    const status = this.getNetworkStatus();
    this.listeners.forEach(callback => callback(status));
  }

  /**
   * Mevcut network durumunu al
   */
  public getNetworkStatus(): NetworkStatus {
    return {
      isConnected: this.isConnected,
      isInternetReachable: this.isInternetReachable,
      type: this.connectionType,
    };
  }

  /**
   * Online mi kontrol et
   */
  public isOnline(): boolean {
    return this.isConnected && this.isInternetReachable;
  }

  /**
   * Offline mi kontrol et
   */
  public isOffline(): boolean {
    return !this.isOnline();
  }

  /**
   * Servisi temizle
   */
  public cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
    console.log('🧹 Offline Service temizlendi');
  }
}

export default new OfflineService();
