import { extractCodeFromResponse, detectLanguage, formatCode } from '@/utils/codeParser';

describe('Code Parser Utilities', () => {
  describe('extractCodeFromResponse', () => {
    it('should extract code from markdown code blocks', () => {
      const response = '```javascript\nconst x = 5;\n```';
      const result = extractCodeFromResponse(response);
      expect(result).toBe('const x = 5;');
    });

    it('should handle multiple code blocks and return the first', () => {
      const response = '```js\ncode1\n```\nsome text\n```js\ncode2\n```';
      const result = extractCodeFromResponse(response);
      expect(result).toBe('code1');
    });

    it('should return original text if no code blocks found', () => {
      const response = 'Just plain text';
      const result = extractCodeFromResponse(response);
      expect(result).toBe('Just plain text');
    });

    it('should handle code blocks without language specification', () => {
      const response = '```\nconst x = 5;\n```';
      const result = extractCodeFromResponse(response);
      expect(result).toBe('const x = 5;');
    });

    it('should trim whitespace from extracted code', () => {
      const response = '```javascript\n\n  const x = 5;  \n\n```';
      const result = extractCodeFromResponse(response);
      expect(result).toBe('const x = 5;');
    });
  });

  describe('detectLanguage', () => {
    it('should detect JavaScript from code patterns', () => {
      expect(detectLanguage('const x = 5;')).toBe('javascript');
      expect(detectLanguage('function test() {}')).toBe('javascript');
      expect(detectLanguage('let arr = [1, 2, 3];')).toBe('javascript');
    });

    it('should detect Python from code patterns', () => {
      expect(detectLanguage('def test():\n    pass')).toBe('python');
      expect(detectLanguage('import numpy as np')).toBe('python');
      expect(detectLanguage('print("hello")')).toBe('python');
    });

    it('should detect Java from code patterns', () => {
      expect(detectLanguage('public class Test {}')).toBe('java');
      expect(detectLanguage('private void method() {}')).toBe('java');
    });

    it('should detect TypeScript from code patterns', () => {
      expect(detectLanguage('interface Test { name: string; }')).toBe('typescript');
      expect(detectLanguage('const x: number = 5;')).toBe('typescript');
    });

    it('should return default language if detection fails', () => {
      expect(detectLanguage('unknown code')).toBe('text');
    });
  });

  describe('formatCode', () => {
    it('should preserve code structure', () => {
      const code = 'function test() {\n  return true;\n}';
      const result = formatCode(code, 'javascript');
      expect(result).toBe(code);
    });

    it('should remove excessive blank lines', () => {
      const code = 'line1\n\n\n\nline2';
      const result = formatCode(code, 'javascript');
      expect(result).toBe('line1\n\nline2');
    });

    it('should handle empty code', () => {
      const result = formatCode('', 'javascript');
      expect(result).toBe('');
    });

    it('should preserve indentation', () => {
      const code = '  const x = 5;\n  const y = 10;';
      const result = formatCode(code, 'javascript');
      expect(result).toContain('  const x = 5;');
    });
  });
});
