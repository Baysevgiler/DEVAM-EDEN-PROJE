# CLAUDE.md - AI Mobile Code Writing APK Project

## Project Overview
This is an AI-powered mobile application for writing, generating, and managing code on mobile devices. The application integrates AI models to assist developers with code generation, completion, debugging, and learning.

## Technology Stack Decision
**Platform**: React Native with TypeScript
- Cross-platform (Android & iOS from single codebase)
- Rich ecosystem and community support
- Fast development and hot reload
- Native performance with React Native's bridge
- Easy integration with AI APIs

**AI Integration**: Multi-provider support
- Primary: Anthropic Claude (via Claude API)
- Secondary: OpenAI GPT models
- Future: Google Gemini, local models

## Project Structure
```
ai-mobile-code-apk/
├── android/                 # Native Android code
├── ios/                     # Native iOS code (future)
├── src/
│   ├── components/          # React components
│   │   ├── common/         # Reusable UI components
│   │   ├── editor/         # Code editor components
│   │   └── ai/             # AI-related components
│   ├── screens/            # App screens
│   ├── services/           # Business logic & API calls
│   │   ├── ai/            # AI provider integrations
│   │   └── storage/       # File system & persistence
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── constants/         # App constants & config
│   └── navigation/        # Navigation setup
├── assets/                # Images, fonts, etc.
├── __tests__/            # Test files
└── docs/                 # Documentation
```

## Coding Standards

### TypeScript
- **Always use TypeScript** - No JavaScript files in src/
- **Strict mode enabled** - All type checking enabled
- **Explicit types** - Avoid `any`, use proper types or `unknown`
- **Interface over type** - Use `interface` for object shapes, `type` for unions/intersections

```typescript
// ✅ Good
interface CodeSnippet {
  id: string;
  language: string;
  code: string;
  createdAt: Date;
}

// ❌ Bad
const snippet: any = { ... };
```

### React Native Components
- **Functional components only** - No class components
- **Hooks for state management** - useState, useEffect, custom hooks
- **Component naming** - PascalCase for components, camelCase for utilities
- **One component per file** - Exception: small helper components

```typescript
// ✅ Good
export const CodeEditor: React.FC<CodeEditorProps> = ({ initialCode }) => {
  const [code, setCode] = useState(initialCode);

  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};

// ❌ Bad - anonymous default export
export default ({ initialCode }) => { ... };
```

### Styling
- **StyleSheet.create** - Use React Native's StyleSheet API
- **Themed styles** - Support light/dark mode from start
- **No inline styles** - Except for dynamic values
- **Naming** - Descriptive style names (container, title, button)

```typescript
// ✅ Good
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  codeEditorContainer: {
    padding: 16,
    borderRadius: 8,
  },
});

// ❌ Bad - inline styles
<View style={{ padding: 16, borderRadius: 8 }}>
```

### File Naming
- **Components**: PascalCase (e.g., `CodeEditor.tsx`)
- **Utilities**: camelCase (e.g., `formatCode.ts`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useAICompletion.ts`)
- **Types**: PascalCase with `.types.ts` suffix (e.g., `CodeEditor.types.ts`)
- **Tests**: Same as source with `.test.tsx` or `.test.ts`

### AI Service Integration
- **Provider abstraction** - Create unified interface for all AI providers
- **Error handling** - Graceful degradation, retry logic
- **API key management** - Secure storage, never hardcode
- **Rate limiting** - Implement client-side rate limiting
- **Streaming support** - Use streaming APIs where available

```typescript
// ✅ Good - Abstracted AI service
interface AIProvider {
  generateCode(prompt: string, language: string): Promise<string>;
  completeCode(context: string): Promise<string>;
  explainCode(code: string): Promise<string>;
}

class ClaudeProvider implements AIProvider {
  async generateCode(prompt: string, language: string): Promise<string> {
    // Implementation
  }
}
```

### State Management
- **React Context** - For global app state (theme, settings)
- **Local state** - useState for component-specific state
- **Async state** - Custom hooks for API calls
- **No Redux initially** - Keep it simple, add if needed

### Error Handling
- **Try-catch blocks** - For all async operations
- **User-friendly messages** - No raw error dumps
- **Error boundaries** - For component error catching
- **Logging** - Use console in dev, proper logging in production

```typescript
// ✅ Good
try {
  const result = await aiService.generateCode(prompt, language);
  setGeneratedCode(result);
} catch (error) {
  console.error('Code generation failed:', error);
  showErrorMessage('Failed to generate code. Please try again.');
}
```

### Security
- **API keys** - Store in secure storage (react-native-encrypted-storage)
- **Input validation** - Validate all user inputs
- **No sensitive data in logs** - Sanitize logs in production
- **HTTPS only** - All API calls over HTTPS

### Performance
- **Lazy loading** - Load screens and components on demand
- **Memoization** - Use React.memo, useMemo, useCallback appropriately
- **List optimization** - Use FlatList with proper keys
- **Image optimization** - Compress images, use appropriate formats

### Testing
- **Jest** - Unit tests for utilities and services
- **React Native Testing Library** - Component tests
- **Coverage target** - Aim for 70%+ coverage
- **Test naming** - Descriptive: `should generate code when prompt is valid`

### Git Workflow
- **Branch naming**: `feature/`, `bugfix/`, `hotfix/`
- **Commits**: Conventional commits (feat:, fix:, docs:, etc.)
- **PR reviews**: Required before merge to main
- **No direct commits to main**

### Documentation
- **JSDoc comments** - For public APIs and complex functions
- **README updates** - Keep setup instructions current
- **Inline comments** - For complex logic only
- **Type definitions** - Self-documenting code preferred

```typescript
/**
 * Generates code using AI based on natural language prompt
 * @param prompt - Natural language description of desired code
 * @param language - Target programming language
 * @param options - Additional generation options
 * @returns Generated code snippet
 * @throws {AIServiceError} When AI service is unavailable
 */
async function generateCode(
  prompt: string,
  language: string,
  options?: GenerationOptions
): Promise<string> {
  // Implementation
}
```

## Dependencies Policy
- **Minimal dependencies** - Only add when necessary
- **Well-maintained libraries** - Check last update date
- **License compatibility** - MIT, Apache 2.0 preferred
- **Bundle size awareness** - Consider impact on APK size

## Core Features to Implement

### Phase 1 (MVP)
1. Code editor with syntax highlighting
2. AI code generation from prompts
3. Code completion suggestions
4. Save/load code snippets locally
5. Support for 5+ programming languages

### Phase 2
1. Code explanation and documentation
2. Debug assistance and error fixing
3. Project management (multiple files)
4. Cloud sync (optional)
5. Code templates and snippets library

### Phase 3
1. Collaborative features
2. Version control integration
3. AI model selection
4. Offline mode with cached responses
5. Advanced editor features (find/replace, multi-cursor)

## Environment Configuration
- **Development**: Use .env.development
- **Production**: Use .env.production
- **Required vars**: AI_API_KEY, API_BASE_URL
- **Never commit**: .env files (add to .gitignore)

## Build Configuration
- **Android**: Min SDK 23 (Android 6.0), Target SDK 34
- **APK optimization**: ProGuard enabled, unused code removal
- **Signing**: Proper keystore management
- **Versioning**: Semantic versioning (MAJOR.MINOR.PATCH)

## Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] No console.log in production code
- [ ] Error handling is implemented
- [ ] UI is responsive and accessible
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance is acceptable

## Resources
- React Native Docs: https://reactnative.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Anthropic Claude API: https://docs.anthropic.com/
- React Navigation: https://reactnavigation.org/

## Notes
- Prioritize user experience and app responsiveness
- AI features should enhance, not replace, developer skills
- Support offline functionality where possible
- Keep APK size under 50MB
- Test on both low-end and high-end devices
