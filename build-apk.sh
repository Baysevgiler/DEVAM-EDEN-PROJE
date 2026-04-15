#!/bin/bash

###############################################################################
# AI Mobile Code APK Oluşturma Script'i
# Bu script'i yerel makinenizde çalıştırın (Java ve Android SDK gerekli)
###############################################################################

set -e  # Hata durumunda dur

echo "🚀 AI Mobile Code APK Oluşturma Başlatılıyor..."
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Gereksinimleri Kontrol Et
echo "📋 1. Gereksinimleri kontrol ediliyor..."

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js bulunamadı!${NC}"
    echo "Lütfen Node.js v18+ kurun: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js: $NODE_VERSION${NC}"

# npm kontrolü
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm bulunamadı!${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm: $NPM_VERSION${NC}"

# Java kontrolü
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java bulunamadı!${NC}"
    echo "Lütfen JDK 17+ kurun:"
    echo "  macOS: brew install openjdk@17"
    echo "  Ubuntu: sudo apt install openjdk-17-jdk"
    echo "  Windows: https://adoptium.net/"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -n 1)
echo -e "${GREEN}✓ Java: $JAVA_VERSION${NC}"

# JAVA_HOME kontrolü
if [ -z "$JAVA_HOME" ]; then
    echo -e "${YELLOW}⚠️  JAVA_HOME ayarlanmamış${NC}"
    echo "Lütfen JAVA_HOME'u ayarlayın:"
    echo "  export JAVA_HOME=/path/to/jdk"
    # Devam et, belki gradle bulabilir
fi

# Android SDK kontrolü
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${RED}❌ ANDROID_HOME ayarlanmamış!${NC}"
    echo "Lütfen Android SDK yolunu ayarlayın:"
    echo "  macOS: export ANDROID_HOME=\$HOME/Library/Android/sdk"
    echo "  Linux: export ANDROID_HOME=\$HOME/Android/Sdk"
    echo "  Windows: set ANDROID_HOME=C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk"
    exit 1
fi
echo -e "${GREEN}✓ ANDROID_HOME: $ANDROID_HOME${NC}"

echo ""

# 2. Bağımlılıkları Yükle
echo "📦 2. Bağımlılıklar yükleniyor..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Bağımlılıklar yüklendi${NC}"
else
    echo -e "${GREEN}✓ Bağımlılıklar zaten yüklü${NC}"
fi
echo ""

# 3. Testleri Çalıştır
echo "🧪 3. Testler çalıştırılıyor..."
npm test -- --passWithNoTests
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tüm testler başarılı${NC}"
else
    echo -e "${RED}❌ Testler başarısız!${NC}"
    echo "Devam etmek istiyor musunuz? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        exit 1
    fi
fi
echo ""

# 4. Bundle Oluştur
echo "📱 4. React Native bundle oluşturuluyor..."
mkdir -p android/app/src/main/assets

npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Bundle oluşturuldu${NC}"
else
    echo -e "${RED}❌ Bundle oluşturulamadı!${NC}"
    exit 1
fi
echo ""

# 5. Android Projesini Temizle
echo "🧹 5. Android projesi temizleniyor..."
cd android
./gradlew clean
echo -e "${GREEN}✓ Proje temizlendi${NC}"
echo ""

# 6. Release APK Oluştur
echo "🔨 6. Release APK oluşturuluyor..."
echo "Bu işlem birkaç dakika sürebilir..."

./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ APK başarıyla oluşturuldu!${NC}"
else
    echo -e "${RED}❌ APK oluşturulamadı!${NC}"
    exit 1
fi

cd ..
echo ""

# 7. APK Bilgilerini Göster
echo "📊 7. APK Bilgileri:"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✓ APK HAZIR!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📍 Konum: $APK_PATH"
    echo "📦 Boyut: $APK_SIZE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📱 APK'yı cihazınıza yüklemek için:"
    echo "   adb install $APK_PATH"
    echo ""
    echo "Veya APK dosyasını manuel olarak cihazınıza kopyalayıp yükleyin."
else
    echo -e "${RED}❌ APK dosyası bulunamadı: $APK_PATH${NC}"
    exit 1
fi

# 8. İmzalama Hatırlatması
echo ""
echo "⚠️  NOT: Bu unsigned (imzasız) bir APK'dır."
echo "Google Play Store'a yüklemek için imzalı APK gerekir."
echo "İmzalı APK oluşturmak için APK_OLUŞTURMA_KILAVUZU.md dosyasına bakın."
echo ""

echo -e "${GREEN}🎉 İşlem tamamlandı!${NC}"
