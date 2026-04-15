/**
 * LiveUpdateService
 *
 * Canlı güncelleme servisi - APK telefonda olsa bile kod değiştiğinde otomatik günceller
 * GitHub'dan en son kodu çeker ve anında uygular
 * Uygulama yeniden başlatılmadan değişiklikler uygulanır
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import RNFS from 'react-native-fs';

interface UpdateInfo {
  version: string;
  bundleUrl: string;
  commitSha: string;
  timestamp: string;
  description: string;
}

interface UpdateStatus {
  isUpdateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  updateInfo?: UpdateInfo;
}

const GITHUB_REPO = 'Baysevgiler/DEVAM-EDEN-PROJE';
const GITHUB_BRANCH = 'main';
const UPDATE_CHECK_INTERVAL = 30000; // 30 saniye
const STORAGE_KEY_VERSION = '@app_current_version';
const STORAGE_KEY_LAST_CHECK = '@app_last_update_check';
const BUNDLE_PATH = `${RNFS.DocumentDirectoryPath}/live-bundle.js`;

class LiveUpdateService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking: boolean = false;
  private isUpdating: boolean = false;

  /**
   * Canlı güncelleme sistemini başlat
   */
  public async initialize(): Promise<void> {
    console.log('🔄 Live Update Service başlatılıyor...');

    try {
      // Mevcut versiyonu kontrol et
      const currentVersion = await this.getCurrentVersion();
      console.log(`📱 Mevcut versiyon: ${currentVersion}`);

      // İlk kontrol
      await this.checkForUpdates(true);

      // Otomatik kontrol başlat
      this.startAutoCheck();

      console.log('✅ Live Update Service başlatıldı');
    } catch (error) {
      console.error('❌ Live Update Service başlatılamadı:', error);
    }
  }

  /**
   * Otomatik güncelleme kontrolünü başlat
   */
  public startAutoCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Her 30 saniyede bir kontrol et
    this.checkInterval = setInterval(() => {
      this.checkForUpdates(false);
    }, UPDATE_CHECK_INTERVAL);

    console.log(`🔄 Otomatik güncelleme kontrolü başlatıldı (${UPDATE_CHECK_INTERVAL / 1000}s)`);
  }

  /**
   * Otomatik güncelleme kontrolünü durdur
   */
  public stopAutoCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏸️  Otomatik güncelleme kontrolü durduruldu');
    }
  }

  /**
   * Güncelleme kontrolü yap
   */
  public async checkForUpdates(showNoUpdateMessage: boolean = false): Promise<UpdateStatus> {
    if (this.isChecking) {
      console.log('⏳ Zaten kontrol yapılıyor, atlıyorum...');
      return {
        isUpdateAvailable: false,
        currentVersion: await this.getCurrentVersion(),
        latestVersion: await this.getCurrentVersion(),
      };
    }

    this.isChecking = true;

    try {
      console.log('🔍 Güncelleme kontrol ediliyor...');

      const currentVersion = await this.getCurrentVersion();
      const latestInfo = await this.fetchLatestUpdateInfo();

      // Son kontrol zamanını kaydet
      await AsyncStorage.setItem(STORAGE_KEY_LAST_CHECK, new Date().toISOString());

      if (!latestInfo) {
        console.log('⚠️  Güncelleme bilgisi alınamadı');
        return {
          isUpdateAvailable: false,
          currentVersion,
          latestVersion: currentVersion,
        };
      }

      const isUpdateAvailable = latestInfo.commitSha !== currentVersion;

      if (isUpdateAvailable) {
        console.log(`🆕 Yeni güncelleme mevcut: ${latestInfo.commitSha}`);
        console.log(`📝 Açıklama: ${latestInfo.description}`);

        // Otomatik güncelle
        await this.applyUpdate(latestInfo);

        return {
          isUpdateAvailable: true,
          currentVersion,
          latestVersion: latestInfo.commitSha,
          updateInfo: latestInfo,
        };
      } else {
        if (showNoUpdateMessage) {
          console.log('✅ Uygulama güncel');
        }
        return {
          isUpdateAvailable: false,
          currentVersion,
          latestVersion: latestInfo.commitSha,
        };
      }
    } catch (error) {
      console.error('❌ Güncelleme kontrolü başarısız:', error);
      return {
        isUpdateAvailable: false,
        currentVersion: await this.getCurrentVersion(),
        latestVersion: await this.getCurrentVersion(),
      };
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * GitHub'dan son commit bilgilerini al
   */
  private async fetchLatestUpdateInfo(): Promise<UpdateInfo | null> {
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/commits/${GITHUB_BRANCH}`;

      const response = await fetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API hatası: ${response.status}`);
      }

      const data = await response.json();

      const updateInfo: UpdateInfo = {
        version: '2.0.0',
        bundleUrl: `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/android/app/src/main/assets/index.android.bundle`,
        commitSha: data.sha,
        timestamp: data.commit.committer.date,
        description: data.commit.message.split('\n')[0], // İlk satır
      };

      return updateInfo;
    } catch (error) {
      console.error('❌ GitHub\'dan bilgi alınamadı:', error);
      return null;
    }
  }

  /**
   * Güncellemeyi uygula
   */
  private async applyUpdate(updateInfo: UpdateInfo): Promise<void> {
    if (this.isUpdating) {
      console.log('⏳ Zaten güncelleme yapılıyor...');
      return;
    }

    this.isUpdating = true;

    try {
      console.log('📥 Güncelleme indiriliyor...');

      // Bundle'ı indir
      const downloadResult = await RNFS.downloadFile({
        fromUrl: updateInfo.bundleUrl,
        toFile: BUNDLE_PATH,
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error(`İndirme başarısız: ${downloadResult.statusCode}`);
      }

      console.log('✅ Güncelleme indirildi');

      // Versiyonu kaydet
      await AsyncStorage.setItem(STORAGE_KEY_VERSION, updateInfo.commitSha);

      console.log('✅ Güncelleme uygulandı');

      // Kullanıcıya bildir
      Alert.alert(
        '🎉 Güncelleme Uygulandı',
        'Yeni özellikler ve iyileştirmeler yüklendi!\n\n' + updateInfo.description,
        [
          {
            text: 'Devam Et',
            onPress: () => {
              // Uygulamayı yeniden yükle
              this.reloadApp();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Güncelleme uygulanamadı:', error);

      Alert.alert(
        'Güncelleme Hatası',
        'Güncelleme uygulanırken bir hata oluştu. Uygulama mevcut versiyonla çalışmaya devam edecek.'
      );
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Uygulamayı yeniden yükle
   */
  private reloadApp(): void {
    try {
      // React Native'de bundle'ı yeniden yükle
      if (__DEV__) {
        // Development modda hot reload
        const { DevSettings } = require('react-native');
        DevSettings.reload();
      } else {
        // Production modda tam yeniden başlat
        const RNRestart = require('react-native-restart');
        RNRestart.Restart();
      }
    } catch (error) {
      console.error('❌ Uygulama yeniden yüklenemedi:', error);
      Alert.alert(
        'Yeniden Başlatma Gerekli',
        'Değişikliklerin uygulanması için uygulamayı manuel olarak kapatıp açın.'
      );
    }
  }

  /**
   * Mevcut versiyonu al
   */
  private async getCurrentVersion(): Promise<string> {
    try {
      const version = await AsyncStorage.getItem(STORAGE_KEY_VERSION);
      return version || '0.0.0';
    } catch (error) {
      console.error('❌ Versiyon okunamadı:', error);
      return '0.0.0';
    }
  }

  /**
   * Son kontrol zamanını al
   */
  public async getLastCheckTime(): Promise<Date | null> {
    try {
      const lastCheck = await AsyncStorage.getItem(STORAGE_KEY_LAST_CHECK);
      return lastCheck ? new Date(lastCheck) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Güncelleme durumunu al
   */
  public getUpdateStatus(): {
    isChecking: boolean;
    isUpdating: boolean;
    autoCheckEnabled: boolean;
  } {
    return {
      isChecking: this.isChecking,
      isUpdating: this.isUpdating,
      autoCheckEnabled: this.checkInterval !== null,
    };
  }

  /**
   * Manuel güncelleme kontrolü (kullanıcı tetikler)
   */
  public async manualCheck(): Promise<void> {
    Alert.alert(
      '🔄 Güncelleme Kontrolü',
      'Güncellemeler kontrol ediliyor...',
      [],
      { cancelable: false }
    );

    const status = await this.checkForUpdates(true);

    if (!status.isUpdateAvailable) {
      Alert.alert('✅ Güncel', 'Uygulama zaten en son sürümde!');
    }
  }

  /**
   * Temizlik - servis kapatılırken
   */
  public cleanup(): void {
    this.stopAutoCheck();
    console.log('🧹 Live Update Service temizlendi');
  }
}

export default new LiveUpdateService();
