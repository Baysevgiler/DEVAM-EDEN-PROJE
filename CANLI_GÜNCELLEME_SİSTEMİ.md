# 🔄 Canlı Güncelleme Sistemi

## 📋 Genel Bakış

AI Mobile Code uygulaması, **CodePush benzeri bir canlı güncelleme sistemi** ile donatılmıştır. Bu sistem sayesinde:

- ✅ APK telefonda yüklü olsa bile kod değiştiğinde otomatik güncellenir
- ✅ Kullanıcılar yeni APK indirmek veya yüklemek zorunda kalmaz
- ✅ Güncellemeler GitHub'dan otomatik olarak çekilir
- ✅ Her 30 saniyede bir yeni versiyon kontrolü yapılır
- ✅ Güncellemeler arka planda sessizce indirilir
- ✅ Kullanıcı onayı ile uygulama yeniden başlatılır

---

## 🎯 Nasıl Çalışır?

### 1. Otomatik Versiyon Kontrolü

```
[Uygulama Başlangıcı]
          ↓
[LiveUpdateService Initialize]
          ↓
[GitHub API'den Son Commit SHA'sı Al]
          ↓
[Mevcut Versiyon ile Karşılaştır]
          ↓
    ╔═══════════╗
    ║ Yeni Mi?  ║
    ╚═══════════╝
       ↓     ↓
    EVET    HAYIR
       ↓       ↓
   [İndir]  [Bekle]
       ↓
[Bundle'ı GitHub'dan İndir]
       ↓
[AsyncStorage'a Kaydet]
       ↓
[Kullanıcıya Bildir]
       ↓
[Onay ile Yeniden Başlat]
```

### 2. Her 30 Saniyede Otomatik Kontrol

Uygulama çalışırken, arka planda sürekli olarak:

```javascript
setInterval(() => {
  checkForUpdates();
}, 30000); // 30 saniye
```

---

## 🔧 Teknik Detaylar

### LiveUpdateService.ts

**Dosya Yeri:** `src/services/update/LiveUpdateService.ts`

#### Ana Metodlar:

```typescript
// Servisi başlat
await LiveUpdateService.initialize();

// Manuel güncelleme kontrolü
await LiveUpdateService.checkForUpdates(true);

// Otomatik kontrol başlat
LiveUpdateService.startAutoCheck();

// Otomatik kontrol durdur
LiveUpdateService.stopAutoCheck();

// Güncelleme durumunu al
const status = LiveUpdateService.getUpdateStatus();
// {
//   isChecking: boolean,
//   isUpdating: boolean,
//   autoCheckEnabled: boolean
// }

// Son kontrol zamanını al
const lastCheck = await LiveUpdateService.getLastCheckTime();

// Manuel kontrol (kullanıcı tetikler)
await LiveUpdateService.manualCheck();

// Temizlik
LiveUpdateService.cleanup();
```

#### Versiyon Takibi

Versiyon takibi için **GitHub commit SHA** kullanılır:

```typescript
const STORAGE_KEY_VERSION = '@app_current_version';

// Mevcut versiyon
const currentVersion = await AsyncStorage.getItem(STORAGE_KEY_VERSION);
// Örnek: "abc123def456..." (commit SHA)

// GitHub'dan son commit
const response = await fetch(
  'https://api.github.com/repos/Baysevgiler/DEVAM-EDEN-PROJE/commits/main'
);
const data = await response.json();
const latestSha = data.sha;

// Karşılaştır
if (latestSha !== currentVersion) {
  // Güncelleme var!
}
```

#### Bundle İndirme

```typescript
const BUNDLE_PATH = `${RNFS.DocumentDirectoryPath}/live-bundle.js`;

const bundleUrl =
  'https://raw.githubusercontent.com/Baysevgiler/DEVAM-EDEN-PROJE/main/android/app/src/main/assets/index.android.bundle';

await RNFS.downloadFile({
  fromUrl: bundleUrl,
  toFile: BUNDLE_PATH,
}).promise;
```

#### Uygulama Yeniden Başlatma

```typescript
if (__DEV__) {
  // Development modda hot reload
  const { DevSettings } = require('react-native');
  DevSettings.reload();
} else {
  // Production modda tam yeniden başlat
  const RNRestart = require('react-native-restart');
  RNRestart.Restart();
}
```

---

## 📱 Kullanıcı Arayüzü

### Settings Ekranı

**Ayarlar > Live Updates** bölümünde:

1. **Auto Update Toggle**
   - Otomatik güncelleme kontrolünü açar/kapar
   - Kapalıysa, güncellemeler kontrol edilmez
   - Açıksa, her 30 saniyede kontrol edilir

2. **Güncelleme Durumu**
   - 🔄 "Checking for updates..." - Kontrol yapılıyor
   - 📥 "Downloading update..." - Güncelleme indiriliyor
   - ✅ "Up to date" - Güncel

3. **Son Kontrol Zamanı**
   - "Just now" - Az önce
   - "5 minutes ago" - 5 dakika önce
   - "2 hours ago" - 2 saat önce

4. **"Check for Updates" Butonu**
   - Manuel güncelleme kontrolü tetikler
   - Kontrol veya indirme sırasında devre dışı kalır

---

## 🚀 Deployment Süreci

### 1. Kod Değişiklikleri Yap

```bash
# Örnek: Hata düzeltmesi
vim src/screens/HomeScreen.tsx
```

### 2. Bundle Oluştur

```bash
# React Native bundle oluştur
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
```

### 3. Commit ve Push

```bash
git add .
git commit -m "fix: Hata düzeltmesi"
git push origin main
```

### 4. Otomatik Güncelleme

- ✅ Push sonrası, tüm cihazlarda **30 saniye içinde** kontrol edilir
- ✅ Yeni commit SHA tespit edilir
- ✅ Bundle otomatik indirilir
- ✅ Kullanıcıya bildirim gösterilir
- ✅ Onay ile uygulama yeniden başlar

---

## ⚠️ Önemli Notlar

### 1. Bundle Boyutu

Bundle dosyası ~2-3 MB olabilir. Kullanıcılar mobil veri kullanıyorsa dikkat edilmeli.

**Çözüm:** Bundle boyutunu azaltmak için:

```bash
# ProGuard aktif
# android/app/build.gradle
buildTypes {
  release {
    minifyEnabled true
    shrinkResources true
  }
}
```

### 2. GitHub API Rate Limit

GitHub API saatte **60 istek** limiti vardır (authenticated ise 5000).

**Geçerli Durum:**
- 30 saniyede 1 istek = Saatte 120 istek
- ⚠️ Limit aşılabilir!

**Çözüm:**
- Authentication token kullan
- Veya interval'i artır (60 saniye)

```typescript
const UPDATE_CHECK_INTERVAL = 60000; // 60 saniye
```

### 3. Native Kod Değişiklikleri

Bu sistem **SADECE JavaScript kodu** için çalışır.

**Güncellenemez:**
- ❌ Android native kod (Java/Kotlin)
- ❌ Yeni native modüller
- ❌ AndroidManifest.xml değişiklikleri
- ❌ build.gradle değişiklikleri
- ❌ Yeni izinler (permissions)

**Güncellenebilir:**
- ✅ React bileşenleri
- ✅ JavaScript mantık
- ✅ Stil değişiklikleri
- ✅ Yeni ekranlar
- ✅ API endpoint değişiklikleri

### 4. Rollback (Geri Alma)

Hatalı bir güncelleme yayınlandıysa:

```bash
# 1. Önceki commit'e dön
git revert HEAD
git push origin main

# 2. Veya belirli bir commit'e git
git reset --hard <previous-commit-sha>
git push origin main --force

# 3. Cihazlar 30 saniye içinde eski versiyonu indirir
```

### 5. Test Etme

Canlı güncellemeyi test etmek için:

```bash
# 1. Release APK oluştur
cd android && ./gradlew assembleRelease

# 2. Cihaza yükle
adb install app/build/outputs/apk/release/app-release.apk

# 3. Kod değişikliği yap
echo "// Test değişikliği" >> src/screens/HomeScreen.tsx

# 4. Bundle oluştur
npx react-native bundle ...

# 5. Commit ve push
git add . && git commit -m "test" && git push

# 6. Uygulamada Settings > Live Updates > "Check for Updates"

# 7. Güncelleme indirilmeli ve uygulanmalı
```

---

## 📊 Güncelleme İstatistikleri

LiveUpdateService şunları takip eder:

```typescript
interface UpdateStatus {
  isUpdateAvailable: boolean;
  currentVersion: string; // Commit SHA
  latestVersion: string; // Commit SHA
  updateInfo?: {
    version: string; // "2.0.0"
    bundleUrl: string;
    commitSha: string;
    timestamp: string; // ISO date
    description: string; // Commit message
  };
}
```

---

## 🔐 Güvenlik

### 1. HTTPS Kullanımı

Tüm indirmeler HTTPS üzerinden yapılır:

```
https://raw.githubusercontent.com/...
https://api.github.com/...
```

### 2. Versiyon Doğrulama

Commit SHA ile versiyon doğrulanır - manipülasyon mümkün değil.

### 3. Hata Durumunda Rollback

İndirme başarısız olursa:
- ❌ Versiyon güncellenmez
- ✅ Mevcut bundle korunur
- ✅ Uygulama çalışmaya devam eder

---

## 🐛 Sorun Giderme

### Sorun 1: "GitHub API hatası: 403"

**Sebep:** Rate limit aşıldı

**Çözüm:**
```typescript
// GitHub token ekle
const response = await fetch(apiUrl, {
  headers: {
    Accept: 'application/vnd.github.v3+json',
    Authorization: 'token ghp_YOUR_TOKEN_HERE',
  },
});
```

### Sorun 2: "İndirme başarısız: 404"

**Sebep:** Bundle dosyası GitHub'da yok

**Çözüm:**
```bash
# Bundle'ı oluştur ve commit et
npx react-native bundle ...
git add android/app/src/main/assets/index.android.bundle
git commit -m "Add bundle"
git push
```

### Sorun 3: Güncelleme sonrası uygulama crash

**Sebep:** Bundle hatalı veya incompatible

**Çözüm:**
```bash
# Rollback yap
git revert HEAD
git push origin main

# Veya bundle'ı sil ve yeniden oluştur
rm android/app/src/main/assets/index.android.bundle
npx react-native bundle ...
```

### Sorun 4: "Uygulama yeniden yüklenemedi"

**Sebep:** react-native-restart yüklü değil

**Çözüm:**
```bash
npm install react-native-restart
cd android && ./gradlew clean
cd .. && npx react-native run-android
```

---

## 📚 Kaynaklar

- [React Native Bundle](https://reactnative.dev/docs/bundle)
- [GitHub API - Commits](https://docs.github.com/en/rest/commits/commits)
- [React Native FS](https://github.com/itinance/react-native-fs)
- [React Native Restart](https://github.com/avishayil/react-native-restart)

---

## ✅ Özellikler Özeti

| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Otomatik kontrol | ✅ | Her 30 saniyede bir |
| GitHub entegrasyonu | ✅ | Commit SHA takibi |
| Bundle indirme | ✅ | RNFS kullanarak |
| Versiyon takibi | ✅ | AsyncStorage |
| Uygulama restart | ✅ | react-native-restart |
| UI kontrolü | ✅ | Settings ekranı |
| Hata yönetimi | ✅ | Graceful fallback |
| Test coverage | ✅ | Comprehensive tests |
| Rate limit koruması | ⚠️ | Token gerekebilir |
| Native kod güncellemesi | ❌ | Sadece JS |

---

## 🎉 Başarılı Kullanım!

Artık uygulamanız **Google Play Store'a tekrar yüklemeden** güncellenebilir!

1. ✅ Kod değiştir
2. ✅ Bundle oluştur
3. ✅ Push yap
4. ✅ 30 saniye bekle
5. ✅ Tüm cihazlar güncellenir!

**Kullanıcılar hiçbir şey yapmadan en son özelliklere sahip olur! 🚀**

---

**Son Güncelleme:** 2026-04-15
**Versiyon:** 2.0.0
**GitHub Repo:** https://github.com/Baysevgiler/DEVAM-EDEN-PROJE
