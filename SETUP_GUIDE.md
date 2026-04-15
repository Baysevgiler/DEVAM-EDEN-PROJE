# Quick Setup Guide

This guide will help you get the AI Mobile Code Writer app running on your development machine.

## Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development
```bash
# Terminal 1 - Start Metro bundler
npm start

# Terminal 2 - Run on Android
npm run android
```

## First Time Setup

### Required Software

1. **Node.js & npm** (Already verified: Node v20.20.2, npm v10.8.2 ✓)
2. **Android Studio** - Download from https://developer.android.com/studio
3. **Java JDK 17+** - Usually comes with Android Studio

### Android Setup

1. Open Android Studio
2. Go to SDK Manager (Tools → SDK Manager)
3. Install:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android Emulator (if testing on emulator)

4. Set environment variables (add to ~/.bashrc or ~/.zshrc):
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

5. Reload shell:
   ```bash
   source ~/.bashrc  # or source ~/.zshrc
   ```

### Configure API Keys (Optional - can be done in app)

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and add your keys:
```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

Or configure later in the app's Settings screen.

## Testing Your Setup

### Check Android Setup
```bash
# Check if adb is available
adb devices

# Should show connected devices/emulators
```

### Run the App

**Option 1: Using Emulator**
1. Open Android Studio
2. AVD Manager → Create Virtual Device
3. Start emulator
4. Run: `npm run android`

**Option 2: Using Physical Device**
1. Enable Developer Options on your Android phone
2. Enable USB Debugging
3. Connect phone via USB
4. Run: `adb devices` (should show your device)
5. Run: `npm run android`

## Building APK

### Debug APK (for testing)
```bash
cd android
./gradlew assembleDebug
cd ..
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (for distribution)

**Important**: You need to generate a signing key first.

```bash
# Generate key
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000

# Build release
cd ../..
npm run build:android
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Common Issues

### Port 8081 already in use
```bash
# Kill Metro bundler
npx react-native-community/cli-server-api@latest --reset-cache
```

### Build fails
```bash
# Clean everything
npm run clean:android
cd android && ./gradlew clean && cd ..
rm -rf node_modules
npm install
npm run android
```

### Gradle issues
```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
```

### Module not found
```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

## Project Structure

```
ai-mobile-code-apk/
├── src/
│   ├── screens/         # HomeScreen, EditorScreen, SettingsScreen
│   ├── services/ai/     # ClaudeService, OpenAIService
│   ├── contexts/        # ThemeContext, AIServiceContext
│   ├── navigation/      # App navigation setup
│   ├── constants/       # Theme, languages
│   └── types/           # TypeScript definitions
├── android/             # Native Android code
├── App.tsx              # Root component
└── package.json         # Dependencies
```

## Development Workflow

1. Make changes to code
2. Metro bundler auto-reloads (Fast Refresh)
3. Test on device/emulator
4. Run tests: `npm test`
5. Lint code: `npm run lint:fix`
6. Build APK when ready

## Getting API Keys

### Anthropic Claude
1. Go to https://console.anthropic.com/
2. Sign up/Login
3. Go to API Keys section
4. Create new key
5. Copy key (starts with `sk-ant-`)

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Sign up/Login
3. Create new secret key
4. Copy key (starts with `sk-`)

## Next Steps

1. Configure your API key in Settings
2. Try generating code in the Editor
3. Explore the codebase
4. Add new features!

## Need Help?

- Check CLAUDE.md for coding standards
- Check README.md for detailed documentation
- Open an issue on GitHub

Happy coding! 🚀
