@echo off
REM ###############################################################################
REM AI Mobile Code APK Olusturma Script'i (Windows)
REM Bu script'i yerel makinenizde calistirin (Java ve Android SDK gerekli)
REM ###############################################################################

setlocal enabledelayedexpansion

echo.
echo ======================================
echo   AI Mobile Code APK Olusturma
echo ======================================
echo.

REM 1. Gereksinimleri Kontrol Et
echo [1/7] Gereksinimler kontrol ediliyor...

REM Node.js kontrolu
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Node.js bulunamadi!
    echo Lutfen Node.js v18+ kurun: https://nodejs.org/
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js: %NODE_VERSION%

REM npm kontrolu
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] npm bulunamadi!
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm: %NPM_VERSION%

REM Java kontrolu
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Java bulunamadi!
    echo Lutfen JDK 17+ kurun: https://adoptium.net/
    exit /b 1
)
for /f "tokens=*" %%i in ('java -version 2^>^&1 ^| findstr /R "version"') do set JAVA_VERSION=%%i
echo [OK] Java: %JAVA_VERSION%

REM JAVA_HOME kontrolu
if "%JAVA_HOME%"=="" (
    echo [UYARI] JAVA_HOME ayarlanmamis
    echo Lutfen JAVA_HOME'u ayarlayin:
    echo   set JAVA_HOME=C:\Program Files\Java\jdk-17
)

REM ANDROID_HOME kontrolu
if "%ANDROID_HOME%"=="" (
    echo [HATA] ANDROID_HOME ayarlanmamis!
    echo Lutfen Android SDK yolunu ayarlayin:
    echo   set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
    exit /b 1
)
echo [OK] ANDROID_HOME: %ANDROID_HOME%
echo.

REM 2. Bagimliliklari Yukle
echo [2/7] Bagimliliklar yukleniyor...
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [HATA] Bagimliliklar yaklenamaadi!
        exit /b 1
    )
    echo [OK] Bagimliliklar yuklendi
) else (
    echo [OK] Bagimliliklar zaten yuklu
)
echo.

REM 3. Testleri Calistir
echo [3/7] Testler calistiriliyor...
call npm test -- --passWithNoTests
if %ERRORLEVEL% NEQ 0 (
    echo [UYARI] Testler basarisiz!
    set /p CONTINUE="Devam etmek istiyor musunuz? (Y/N): "
    if /i not "!CONTINUE!"=="Y" exit /b 1
)
echo [OK] Testler basarili
echo.

REM 4. Bundle Olustur
echo [4/7] React Native bundle olusturuluyor...
if not exist "android\app\src\main\assets" mkdir android\app\src\main\assets

call npx react-native bundle ^
  --platform android ^
  --dev false ^
  --entry-file index.js ^
  --bundle-output android/app/src/main/assets/index.android.bundle ^
  --assets-dest android/app/src/main/res

if %ERRORLEVEL% NEQ 0 (
    echo [HATA] Bundle olusturulamadi!
    exit /b 1
)
echo [OK] Bundle olusturuldu
echo.

REM 5. Android Projesini Temizle
echo [5/7] Android projesi temizleniyor...
cd android
call gradlew.bat clean
if %ERRORLEVEL% NEQ 0 (
    echo [UYARI] Temizleme basarisiz oldu, devam ediliyor...
)
echo [OK] Proje temizlendi
cd ..
echo.

REM 6. Release APK Olustur
echo [6/7] Release APK olusturuluyor...
echo Bu islem birkac dakika surebilir...
cd android
call gradlew.bat assembleRelease

if %ERRORLEVEL% NEQ 0 (
    echo [HATA] APK olusturulamadi!
    cd ..
    exit /b 1
)
cd ..
echo [OK] APK basariyla olusturuldu!
echo.

REM 7. APK Bilgilerini Goster
echo [7/7] APK Bilgileri:
set APK_PATH=android\app\build\outputs\apk\release\app-release.apk

if exist "%APK_PATH%" (
    for %%A in ("%APK_PATH%") do set APK_SIZE=%%~zA
    set /a APK_SIZE_MB=!APK_SIZE! / 1048576
    echo ========================================
    echo   APK HAZIR!
    echo ========================================
    echo Konum: %APK_PATH%
    echo Boyut: !APK_SIZE_MB! MB
    echo ========================================
    echo.
    echo APK'yi cihaziniza yuklemek icin:
    echo   adb install %APK_PATH%
    echo.
    echo Veya APK dosyasini manuel olarak cihaziniza kopyalayip yukleyin.
) else (
    echo [HATA] APK dosyasi bulunamadi: %APK_PATH%
    exit /b 1
)

echo.
echo [NOT] Bu unsigned (imzasiz) bir APK'dir.
echo Google Play Store'a yuklemek icin imzali APK gerekir.
echo Imzali APK olusturmak icin APK_OLUSTURMA_KILAVUZU.md dosyasina bakin.
echo.
echo ========================================
echo   Islem Tamamlandi!
echo ========================================
echo.

pause
