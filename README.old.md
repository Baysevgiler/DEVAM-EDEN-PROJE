# AI Mobile Code Writer

An AI-powered mobile application for writing, generating, and managing code on Android devices. Built with React Native and TypeScript, featuring integration with Claude (Anthropic) and OpenAI GPT models.

## Features

- 🤖 **AI Code Generation**: Generate code from natural language prompts
- 📝 **Code Editor**: Built-in code editor with syntax highlighting
- 🌓 **Dark Mode**: Beautiful light and dark themes
- 🔒 **Secure API Keys**: Encrypted storage for API credentials
- 🌍 **Multi-Language Support**: JavaScript, Python, Java, TypeScript, and more
- 💬 **AI Providers**: Switch between Claude and OpenAI
- 📱 **Native Performance**: React Native for smooth mobile experience

## Screenshots

_Coming soon_

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Java Development Kit (JDK)** 17 or higher
- **Android Studio** with Android SDK
- **Android SDK Platform 34**
- **Android Build Tools**

### Environment Setup

1. Install Android Studio from [developer.android.com](https://developer.android.com/studio)
2. Configure Android SDK:
   - Open Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
   - Install Android SDK Platform 34
   - Install Android SDK Build-Tools 34.0.0

3. Set environment variables:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-mobile-code-apk
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
ANTHROPIC_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: You can also configure API keys directly in the app's Settings screen.

### 4. Install Android dependencies

```bash
cd android
./gradlew clean
cd ..
```

## Running the App

### Development Mode

1. Start the Metro bundler:
   ```bash
   npm start
   ```

2. In a new terminal, run on Android:
   ```bash
   npm run android
   ```

The app will launch on your connected Android device or emulator.

### Troubleshooting

If you encounter issues:

```bash
# Clean project
npm run clean:android

# Rebuild
cd android
./gradlew clean
cd ..
npm run android
```

## Building APK

### Debug APK

```bash
npm run build:android
```

The APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Release APK

1. Generate a signing key:
   ```bash
   cd android/app
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/gradle.properties`:
   ```properties
   MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=my-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=****
   MYAPP_RELEASE_KEY_PASSWORD=****
   ```

3. Build release APK:
   ```bash
   npm run build:android
   ```

## Usage

### Getting Started

1. **Configure API Key**:
   - Open the app
   - Go to Settings tab
   - Enter your Anthropic Claude or OpenAI API key
   - Tap "Save API Key"

2. **Generate Code**:
   - Tap the "+" button on the Home screen
   - Enter a prompt (e.g., "Create a function to sort an array")
   - Select programming language
   - Tap "Generate Code"

3. **Switch AI Provider**:
   - Go to Settings
   - Tap "Change" under AI Provider
   - Toggle between Claude and OpenAI

### API Keys

You can obtain API keys from:

- **Anthropic Claude**: [console.anthropic.com](https://console.anthropic.com/)
- **OpenAI**: [platform.openai.com](https://platform.openai.com/api-keys)

## Project Structure

```
ai-mobile-code-apk/
├── android/                 # Native Android code
├── src/
│   ├── components/          # React components
│   ├── screens/            # App screens
│   ├── services/           # Business logic & APIs
│   │   └── ai/            # AI provider services
│   ├── contexts/          # React contexts
│   ├── navigation/        # Navigation config
│   ├── constants/         # App constants
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities
├── App.tsx                # Root component
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

## Technologies Used

- **React Native 0.73**: Cross-platform mobile framework
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation library
- **Anthropic Claude API**: AI code generation
- **OpenAI API**: Alternative AI provider
- **Encrypted Storage**: Secure credential storage
- **Axios**: HTTP client

## Development

### Code Style

This project follows strict TypeScript and React Native best practices:

- Functional components with hooks
- TypeScript strict mode
- ESLint + Prettier for code formatting
- No `any` types allowed

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Roadmap

### Phase 1 (Current - MVP)
- ✅ Code editor with syntax highlighting
- ✅ AI code generation
- ✅ Multi-language support
- ✅ Dark mode
- 🔄 Save/load snippets locally

### Phase 2
- Code explanation and documentation
- Debug assistance
- Project management
- Cloud sync
- Code templates library

### Phase 3
- Collaborative features
- Version control integration
- Offline mode with caching
- Advanced editor (find/replace, multi-cursor)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Contact: [your-email@example.com]

## Acknowledgments

- Anthropic for Claude API
- OpenAI for GPT models
- React Native community
- All contributors

---

**Made with ❤️ using React Native and AI**
