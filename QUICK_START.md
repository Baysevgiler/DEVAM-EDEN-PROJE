# 🚀 Quick Start Guide

Your AI Mobile Code Writer app is **ready to run**!

## Status: ✅ INSTALLATION COMPLETE

- **678 packages** installed
- **React Native 0.73.4** ✓
- **TypeScript 5.3.3** ✓
- **All dependencies** ✓

---

## Run the App (2 commands)

### Terminal 1: Start Metro Bundler
```bash
npm start
```

### Terminal 2: Run on Android
```bash
npm run android
```

That's it! The app will launch on your connected Android device or emulator.

---

## First Time Setup

### Before Running (One-time setup)

1. **Android Studio** - Make sure it's installed
2. **Android SDK** - Platform 34 installed
3. **Emulator or Device** - At least one available

### Check Your Setup

```bash
# Check if Android SDK is accessible
adb devices

# Should show your device or emulator
```

If no devices show up:
- **Emulator**: Open Android Studio → AVD Manager → Start an emulator
- **Physical Device**: Enable USB Debugging on your phone

---

## What Happens When You Run

1. Metro bundler starts (JavaScript bundler)
2. React Native builds the Android app
3. App installs on your device/emulator
4. App launches automatically

**First launch takes 2-5 minutes** - subsequent launches are faster!

---

## Using the App

### 1. Configure API Key
- Open the app
- Tap **Settings** tab (bottom right)
- Enter your **Claude API Key** (get from https://console.anthropic.com)
- Tap **Save API Key**

### 2. Generate Code
- Tap **Home** tab
- Tap the **+ button**
- Enter a prompt: "Create a function to validate email"
- Select language: JavaScript, Python, etc.
- Tap **Generate Code**
- Watch AI create your code!

### 3. Explore Features
- Toggle Dark/Light mode in Settings
- Switch between Claude and OpenAI
- Try different programming languages

---

## Troubleshooting

### Port 8081 already in use
```bash
# Kill existing Metro process
lsof -ti:8081 | xargs kill -9
npm start
```

### Build fails
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run android
```

### App crashes on launch
- Check Metro bundler terminal for errors
- Ensure device/emulator is running
- Try restarting Metro: Ctrl+C then `npm start`

---

## Development Workflow

```bash
# Start development
npm start              # Terminal 1
npm run android        # Terminal 2

# Make code changes
# → App auto-reloads (Fast Refresh)

# Run linter
npm run lint

# Format code  
npm run format

# Run tests
npm test
```

---

## Building APK

### Debug APK (for testing)
```bash
cd android
./gradlew assembleDebug
```
APK: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (for distribution)
```bash
npm run build:android
```
APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## Project Files

```
ai-mobile-code-apk/
├── src/
│   ├── screens/         → App screens
│   ├── services/ai/     → Claude & OpenAI integration
│   ├── contexts/        → React contexts
│   └── navigation/      → App navigation
├── android/             → Native Android code
├── CLAUDE.md           → Coding standards
├── README.md           → Full documentation
└── package.json        → Dependencies
```

---

## Get API Keys

### Anthropic Claude (Recommended)
1. Go to https://console.anthropic.com/
2. Sign up / Login
3. Settings → API Keys
4. Create key (starts with `sk-ant-`)

### OpenAI (Alternative)
1. Go to https://platform.openai.com/api-keys
2. Create account
3. Create new secret key (starts with `sk-`)

**Pricing**: Both offer free trial credits!

---

## Next Steps

1. ✅ Run `npm start` and `npm run android`
2. ✅ Configure your API key
3. ✅ Generate your first AI code
4. ✅ Start building features!

---

## Need Help?

- **Full docs**: See `README.md`
- **Coding standards**: See `CLAUDE.md`
- **Setup issues**: See `SETUP_GUIDE.md`

Happy coding! 🎉
