# 📱 APK Oluşturma Kılavuzu

## 🎯 Genel Bakış

Bu kılavuz, AI Mobile Code uygulamasını Android APK dosyası olarak derlemek için adım adım talimatlar içerir.

---

## ✅ Gereksinimler

### 1. Node.js ve npm
- **Node.js:** v18.0.0 veya üzeri
- **npm:** v9.0.0 veya üzeri

```bash
node --version  # v18.0.0+
npm --version   # v9.0.0+
```

### 2. Java Development Kit (JDK)
- **JDK:** v17 veya üzeri (önerilen: JDK 17)

```bash
java -version  # 17 veya üzeri
```

**JDK Kurulumu:**
- **Windows:** [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) veya [OpenJDK](https://adoptium.net/)
- **macOS:** `brew install openjdk@17`
- **Linux:** `sudo apt install openjdk-17-jdk`

**JAVA_HOME Ayarlama:**

**Windows:**
```cmd
setx JAVA_HOME "C:\Program Files\Java\jdk-17"
setx PATH "%PATH%;%JAVA_HOME%\bin"
```

**macOS/Linux:**
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin
```

### 3. Android Studio ve Android SDK
- **Android Studio:** Arctic Fox veya üzeri
- **Android SDK:** API Level 33 (Android 13) veya üzeri

**Android Studio Kurulumu:**
1. [Android Studio'yu indirin](https://developer.android.com/studio)
2. Kurulumu tamamlayın
3. SDK Manager'ı açın (Tools > SDK Manager)
4. Şunları kurun:
   - Android SDK Platform 33
   - Android SDK Build-Tools 33.0.0
   - Android Emulator
   - Android SDK Platform-Tools

**ANDROID_HOME Ayarlama:**

**Windows:**
```cmd
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools"
```

**macOS/Linux:**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

---

## 🚀 APK Oluşturma Adımları

### Adım 1: Projeyi Klonlama ve Bağımlılıkları Yükleme

```bash
# Projeyi klonla (eğer henüz klonlamadıysanız)
cd /yol/to/ai-mobile-code-apk

# Bağımlılıkları yükle
npm install

# Android bağımlılıklarını kontrol et
npx react-native doctor
```

### Adım 2: Android Klasörünü Temizleme (Opsiyonel)

```bash
cd android

# Gradle cache'i temizle
./gradlew clean

cd ..
```

### Adım 3: Bundle Oluşturma

```bash
# React Native bundle oluştur
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
```

### Adım 4: Release APK Oluşturma

#### Yöntem 1: Gradle ile (Önerilen)

```bash
cd android

# Release APK oluştur
./gradlew assembleRelease

# APK konumu
ls -la app/build/outputs/apk/release/
# app-release.apk dosyası burada olacak
```

#### Yöntem 2: React Native CLI ile

```bash
# Ana dizinden
npx react-native build-android --mode=release
```

### Adım 5: APK'yı Bulma

Release APK şu konumda oluşturulur:

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔐 İmzalı APK Oluşturma (Production için)

Production'a yüklemek için APK'nın imzalanması gerekir.

### Adım 1: Keystore Oluşturma

```bash
# Keystore dosyası oluştur
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Bilgileri girin:**
- İsim: [Adınız]
- Organizasyon: [Şirket/Proje adı]
- Şehir: [Şehir]
- Eyalet: [Eyalet/İl]
- Ülke kodu: TR
- Şifre: [Güçlü bir şifre]

### Adım 2: Keystore'u Android Klasörüne Taşıma

```bash
mv my-release-key.keystore android/app/
```

### Adım 3: Gradle Yapılandırması

`android/gradle.properties` dosyasına ekleyin:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=şifreniz
MYAPP_RELEASE_KEY_PASSWORD=şifreniz
```

`android/app/build.gradle` dosyasını düzenleyin:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

### Adım 4: İmzalı APK Oluşturma

```bash
cd android
./gradlew assembleRelease
```

İmzalı APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📦 AAB (Android App Bundle) Oluşturma

Google Play Store'a yüklemek için AAB formatı önerilir.

```bash
cd android
./gradlew bundleRelease
```

AAB konumu: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🔍 APK Boyutunu Optimize Etme

### 1. ProGuard Aktifleştirme

`android/app/build.gradle`:

```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 2. Gereksiz Dilleri Kaldırma

`android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        ...
        resConfigs "en", "tr"  // Sadece İngilizce ve Türkçe
    }
}
```

### 3. ABI Split Kullanma

Her işlemci mimarisi için ayrı APK:

`android/app/build.gradle`:

```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk true  // Tüm mimarileri içeren APK
        }
    }
}
```

---

## 🐛 Yaygın Sorunlar ve Çözümleri

### Sorun 1: "JAVA_HOME is not set"

**Çözüm:**
```bash
export JAVA_HOME=/path/to/jdk-17
export PATH=$PATH:$JAVA_HOME/bin
```

### Sorun 2: "SDK location not found"

**Çözüm:**
`android/local.properties` dosyası oluşturun:

```properties
sdk.dir=/Users/kullanici/Library/Android/sdk  # macOS
# veya
sdk.dir=C\:\\Users\\kullanici\\AppData\\Local\\Android\\Sdk  # Windows
```

### Sorun 3: "Unable to load script"

**Çözüm:**
```bash
# Bundle'ı yeniden oluştur
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle
```

### Sorun 4: "Execution failed for task ':app:mergeReleaseResources'"

**Çözüm:**
```bash
cd android
./gradlew clean
cd ..
rm -rf android/app/src/main/res/drawable-*
npx react-native bundle ...  # Bundle'ı tekrar oluştur
```

### Sorun 5: Gradle version hatası

**Çözüm:**
`android/gradle/wrapper/gradle-wrapper.properties`:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-bin.zip
```

---

## 📲 APK'yı Cihaza Yükleme

### Yöntem 1: ADB ile

```bash
# APK'yı yükle
adb install android/app/build/outputs/apk/release/app-release.apk

# Eski sürümü kaldırıp yükle
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Yöntem 2: Manuel Yükleme

1. APK dosyasını telefona kopyalayın
2. Dosya yöneticisinden APK'ya tıklayın
3. "Bilinmeyen kaynaklardan yükleme" izni verin
4. Yükle'ye basın

---

## 🎯 Hızlı Başvuru Komutları

### Temel Build
```bash
# Development APK (debug)
npx react-native run-android

# Release APK (unsigned)
cd android && ./gradlew assembleRelease

# Release APK (signed)
cd android && ./gradlew assembleRelease  # (keystore ayarlandıysa)

# AAB (Google Play)
cd android && ./gradlew bundleRelease
```

### Temizleme
```bash
# Gradle cache temizle
cd android && ./gradlew clean

# Node modules temizle
rm -rf node_modules && npm install

# Metro bundler cache temizle
npx react-native start --reset-cache
```

### Test
```bash
# Tüm testleri çalıştır
npm test

# Coverage raporu
npm test -- --coverage
```

---

## 📝 Kontrol Listesi

Build öncesi kontrol edin:

- [ ] Node.js v18+ kurulu
- [ ] JDK 17+ kurulu
- [ ] JAVA_HOME ayarlanmış
- [ ] Android Studio kurulu
- [ ] Android SDK kurulu
- [ ] ANDROID_HOME ayarlanmış
- [ ] npm install çalıştırıldı
- [ ] android/local.properties var
- [ ] Bundle oluşturuldu
- [ ] Keystore oluşturuldu (production için)
- [ ] Testler geçiyor

---

## 🎓 İleri Seviye

### CI/CD Pipeline Kurulumu

GitHub Actions örneği (`.github/workflows/build-android.yml`):

```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Build APK
      run: |
        cd android
        ./gradlew assembleRelease

    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-release
        path: android/app/build/outputs/apk/release/app-release.apk
```

### Otomatik Versiyon Artırma

`android/app/build.gradle`:

```gradle
def getVersionCode = { ->
    def code = System.getenv('BUILD_NUMBER')
    return code ? code.toInteger() : 1
}

android {
    defaultConfig {
        versionCode getVersionCode()
        versionName "2.0.${getVersionCode()}"
    }
}
```

---

## 📞 Destek

Sorun yaşıyorsanız:

1. [GitHub Issues](https://github.com/yourusername/ai-mobile-code-apk/issues)
2. [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
3. [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

---

## 🎉 Başarılı Build!

APK'nız başarıyla oluşturulduysa:

1. ✅ `android/app/build/outputs/apk/release/app-release.apk`
2. ✅ Dosya boyutu: ~20-40 MB (optimize edilmişse)
3. ✅ Android 5.0+ cihazlarda çalışır
4. ✅ Google Play Store'a yüklenmeye hazır (AAB formatında)

**İyi kullanımlar!** 🚀

---

**Son Güncelleme:** 2026-04-15
**Versiyon:** 2.0.0
