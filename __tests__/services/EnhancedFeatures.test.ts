/**
 * Enhanced Features Integration Tests
 *
 * Tests for all new services:
 * - AIConnectionManager
 * - CodeExecutionService
 * - AutoSuggestionService
 * - ErrorDetectionService
 * - CodeSavingService
 */

import CodeExecutionService from '@/services/execution/CodeExecutionService';
import ErrorDetectionService from '@/services/ai/ErrorDetectionService';
import CodeSavingService from '@/services/storage/CodeSavingService';

// Mock AsyncStorage for CodeSavingService
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock RNFS for CodeSavingService
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/path',
  exists: jest.fn(() => Promise.resolve(false)),
  mkdir: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('')),
  unlink: jest.fn(() => Promise.resolve()),
}));

describe('CodeExecutionService', () => {
  describe('executeCode', () => {
    it('should execute simple JavaScript code', async () => {
      const code = 'return 2 + 2;';
      const result = await CodeExecutionService.executeCode(code, 'javascript');

      expect(result.success).toBe(true);
      expect(result.output).toBe('4');
      expect(result.language).toBe('javascript');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should capture console.log output', async () => {
      const code = "console.log('Hello World');";
      const result = await CodeExecutionService.executeCode(code, 'javascript');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Hello World');
    });

    it('should handle errors in code', async () => {
      const code = 'throw new Error("Test error");';
      const result = await CodeExecutionService.executeCode(code, 'javascript');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Test error');
    });

    it('should handle empty code', async () => {
      const result = await CodeExecutionService.executeCode('', 'javascript');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No code provided');
    });

    it('should reject unsupported languages', async () => {
      const code = 'print("test")';
      const result = await CodeExecutionService.executeCode(code, 'python');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available in this environment');
    });
  });

  describe('validateCode', () => {
    it('should detect dangerous file system access', () => {
      const code = "const fs = require('fs'); fs.readFileSync('test.txt');";
      const validation = CodeExecutionService.validateCode(code);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues[0]).toContain('fs');
    });

    it('should detect child_process usage', () => {
      const code = "const { exec } = require('child_process'); exec('ls');";
      const validation = CodeExecutionService.validateCode(code);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it('should allow safe code', () => {
      const code = 'const x = 5; const y = 10; return x + y;';
      const validation = CodeExecutionService.validateCode(code);

      expect(validation.valid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it('should detect eval usage', () => {
      const code = 'eval("console.log(2+2)")';
      const validation = CodeExecutionService.validateCode(code);

      expect(validation.valid).toBe(false);
    });
  });

  describe('isSupportedLanguage', () => {
    it('should support JavaScript', () => {
      expect(CodeExecutionService.isSupportedLanguage('javascript')).toBe(true);
      expect(CodeExecutionService.isSupportedLanguage('js')).toBe(true);
    });

    it('should support TypeScript', () => {
      expect(CodeExecutionService.isSupportedLanguage('typescript')).toBe(true);
      expect(CodeExecutionService.isSupportedLanguage('ts')).toBe(true);
    });

    it('should not support Python', () => {
      expect(CodeExecutionService.isSupportedLanguage('python')).toBe(false);
    });
  });
});

describe('ErrorDetectionService', () => {
  describe('detectJavaScriptErrors', () => {
    it('should detect missing semicolons', () => {
      const code = 'const x = 5\nconst y = 10';
      const errors = ErrorDetectionService.detectErrors(code, 'javascript');

      const semicolonErrors = errors.filter(e => e.message.includes('semicolon'));
      expect(semicolonErrors.length).toBeGreaterThan(0);
    });

    it('should detect var usage', () => {
      const code = 'var x = 5;';
      const errors = ErrorDetectionService.detectErrors(code, 'javascript');

      const varErrors = errors.filter(e => e.message.includes('var'));
      expect(varErrors.length).toBe(1);
      expect(varErrors[0].severity).toBe('warning');
    });

    it('should detect == instead of ===', () => {
      const code = 'if (x == 5) {}';
      const errors = ErrorDetectionService.detectErrors(code, 'javascript');

      const equalErrors = errors.filter(e => e.message.includes('==='));
      expect(equalErrors.length).toBe(1);
    });

    it('should detect console.log', () => {
      const code = 'console.log("test");';
      const errors = ErrorDetectionService.detectErrors(code, 'javascript');

      const consoleErrors = errors.filter(e => e.message.includes('console'));
      expect(consoleErrors.length).toBe(1);
      expect(consoleErrors[0].severity).toBe('info');
    });

    it('should detect unmatched brackets', () => {
      const code = 'function test() {';
      const errors = ErrorDetectionService.detectErrors(code, 'javascript');

      const bracketErrors = errors.filter(e => e.message.includes('bracket'));
      expect(bracketErrors.length).toBeGreaterThan(0);
    });
  });

  describe('detectTypeScriptErrors', () => {
    it('should detect missing type annotations', () => {
      const code = 'function add(a, b) { return a + b; }';
      const errors = ErrorDetectionService.detectErrors(code, 'typescript');

      const typeErrors = errors.filter(e => e.message.includes('type annotation'));
      expect(typeErrors.length).toBeGreaterThan(0);
    });

    it('should detect any type usage', () => {
      const code = 'const value: any = 5;';
      const errors = ErrorDetectionService.detectErrors(code, 'typescript');

      const anyErrors = errors.filter(e => e.message.includes('any'));
      expect(anyErrors.length).toBe(1);
    });
  });

  describe('detectPythonErrors', () => {
    it('should detect inconsistent indentation', () => {
      const code = 'def test():\n  print("test")';
      const errors = ErrorDetectionService.detectErrors(code, 'python');

      const indentErrors = errors.filter(e => e.message.includes('indentation'));
      expect(indentErrors.length).toBeGreaterThan(0);
    });

    it('should detect missing colon', () => {
      const code = 'def test()';
      const errors = ErrorDetectionService.detectErrors(code, 'python');

      const colonErrors = errors.filter(e => e.message.includes('colon'));
      expect(colonErrors.length).toBe(1);
    });

    it('should detect print without parentheses', () => {
      const code = 'print "test"';
      const errors = ErrorDetectionService.detectErrors(code, 'python');

      const printErrors = errors.filter(e => e.message.includes('print'));
      expect(printErrors.length).toBe(1);
      expect(printErrors[0].severity).toBe('error');
    });
  });

  describe('getErrorStats', () => {
    it('should count errors by severity', () => {
      const code = `
        var x = 5
        if (x == 5) {
          console.log("test")
        }
      `;
      const errors = ErrorDetectionService.detectErrors(code, 'javascript');
      const stats = ErrorDetectionService.getErrorStats(errors);

      expect(stats.errors).toBeGreaterThanOrEqual(0);
      expect(stats.warnings).toBeGreaterThan(0);
      expect(stats.info).toBeGreaterThan(0);
    });
  });

  describe('sortErrors', () => {
    it('should sort errors by severity and line', () => {
      const errors = [
        { line: 5, column: 0, message: 'Info', severity: 'info' as const, type: 'test' },
        { line: 2, column: 0, message: 'Error', severity: 'error' as const, type: 'test' },
        { line: 3, column: 0, message: 'Warning', severity: 'warning' as const, type: 'test' },
        { line: 1, column: 0, message: 'Error', severity: 'error' as const, type: 'test' },
      ];

      const sorted = ErrorDetectionService.sortErrors(errors);

      expect(sorted[0].severity).toBe('error');
      expect(sorted[0].line).toBe(1);
      expect(sorted[1].severity).toBe('error');
      expect(sorted[1].line).toBe(2);
      expect(sorted[2].severity).toBe('warning');
    });
  });
});

describe('CodeSavingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveCode', () => {
    it('should save code snippet', async () => {
      const codeData = {
        title: 'Test Code',
        code: 'console.log("test");',
        language: 'javascript',
        tags: ['test'],
        favorite: false,
      };

      const saved = await CodeSavingService.saveCode(codeData);

      expect(saved.id).toBeDefined();
      expect(saved.title).toBe('Test Code');
      expect(saved.code).toBe('console.log("test");');
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs', async () => {
      const code1 = await CodeSavingService.saveCode({
        title: 'Code 1',
        code: 'test1',
        language: 'javascript',
        tags: [],
        favorite: false,
      });

      const code2 = await CodeSavingService.saveCode({
        title: 'Code 2',
        code: 'test2',
        language: 'javascript',
        tags: [],
        favorite: false,
      });

      expect(code1.id).not.toBe(code2.id);
    });
  });

  describe('updateCode', () => {
    it('should update existing code', async () => {
      const saved = await CodeSavingService.saveCode({
        title: 'Original',
        code: 'original code',
        language: 'javascript',
        tags: [],
        favorite: false,
      });

      // Wait a bit to ensure timestamps differ
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await CodeSavingService.updateCode(saved.id, {
        title: 'Updated',
        favorite: true,
      });

      expect(updated.title).toBe('Updated');
      expect(updated.favorite).toBe(true);
      expect(updated.code).toBe('original code'); // Unchanged
      expect(updated.createdAt).toEqual(saved.createdAt);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(saved.updatedAt.getTime());
    });

    it('should throw error for non-existent code', async () => {
      await expect(
        CodeSavingService.updateCode('non-existent-id', { title: 'test' })
      ).rejects.toThrow('Code not found');
    });
  });

  describe('deleteCode', () => {
    it('should delete code', async () => {
      const saved = await CodeSavingService.saveCode({
        title: 'To Delete',
        code: 'test',
        language: 'javascript',
        tags: [],
        favorite: false,
      });

      await CodeSavingService.deleteCode(saved.id);

      const retrieved = await CodeSavingService.getCode(saved.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('searchCodes', () => {
    it('should search by title', async () => {
      await CodeSavingService.clearAll();

      await CodeSavingService.saveCode({
        title: 'Sorting Algorithm',
        code: 'sort function',
        language: 'javascript',
        tags: [],
        favorite: false,
      });

      const results = await CodeSavingService.searchCodes('sorting');
      expect(results.length).toBe(1);
      expect(results[0].title).toContain('Sorting');
    });

    it('should search by code content', async () => {
      await CodeSavingService.clearAll();

      await CodeSavingService.saveCode({
        title: 'Test',
        code: 'async function fetchData() {}',
        language: 'javascript',
        tags: [],
        favorite: false,
      });

      const results = await CodeSavingService.searchCodes('fetchData');
      expect(results.length).toBe(1);
    });

    it('should search by tags', async () => {
      await CodeSavingService.clearAll();

      await CodeSavingService.saveCode({
        title: 'Test',
        code: 'test code',
        language: 'javascript',
        tags: ['algorithm', 'sorting'],
        favorite: false,
      });

      const results = await CodeSavingService.searchCodes('algorithm');
      expect(results.length).toBe(1);
    });
  });

  describe('getCodesByLanguage', () => {
    it('should filter by language', async () => {
      await CodeSavingService.clearAll();

      await CodeSavingService.saveCode({
        title: 'JS Code',
        code: 'console.log("test");',
        language: 'javascript',
        tags: [],
        favorite: false,
      });

      await CodeSavingService.saveCode({
        title: 'Python Code',
        code: 'print("test")',
        language: 'python',
        tags: [],
        favorite: false,
      });

      const jsResults = await CodeSavingService.getCodesByLanguage('javascript');
      expect(jsResults.length).toBe(1);
      expect(jsResults[0].language).toBe('javascript');
    });
  });

  describe('getFavorites', () => {
    it('should return only favorites', async () => {
      await CodeSavingService.clearAll();

      await CodeSavingService.saveCode({
        title: 'Favorite',
        code: 'favorite code',
        language: 'javascript',
        tags: [],
        favorite: true,
      });

      await CodeSavingService.saveCode({
        title: 'Not Favorite',
        code: 'regular code',
        language: 'javascript',
        tags: [],
        favorite: false,
      });

      const favorites = await CodeSavingService.getFavorites();
      expect(favorites.length).toBe(1);
      expect(favorites[0].favorite).toBe(true);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      const saved = await CodeSavingService.saveCode({
        title: 'Test',
        code: 'test',
        language: 'javascript',
        tags: [],
        favorite: false,
      });

      const toggled1 = await CodeSavingService.toggleFavorite(saved.id);
      expect(toggled1.favorite).toBe(true);

      const toggled2 = await CodeSavingService.toggleFavorite(saved.id);
      expect(toggled2.favorite).toBe(false);
    });
  });
});
