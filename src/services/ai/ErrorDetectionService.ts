/**
 * ErrorDetectionService
 *
 * Detects common errors and issues in code
 * Provides real-time feedback while coding
 * Language-specific validation
 */

export interface CodeError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  type: string;
  suggestedFix?: string;
}

class ErrorDetectionService {
  /**
   * Detect errors in code
   */
  public detectErrors(code: string, language: string): CodeError[] {
    const errors: CodeError[] = [];

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        errors.push(...this.detectJavaScriptErrors(code));
        break;
      case 'typescript':
      case 'ts':
        errors.push(...this.detectTypeScriptErrors(code));
        break;
      case 'python':
      case 'py':
        errors.push(...this.detectPythonErrors(code));
        break;
      case 'java':
        errors.push(...this.detectJavaErrors(code));
        break;
      default:
        errors.push(...this.detectCommonErrors(code));
    }

    return errors;
  }

  /**
   * Detect JavaScript-specific errors
   */
  private detectJavaScriptErrors(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Missing semicolons
      if (/^\s*(const|let|var|return)\s+.*[^;{}\s]$/.test(line)) {
        errors.push({
          line: lineNum,
          column: line.length,
          message: 'Missing semicolon',
          severity: 'warning',
          type: 'syntax',
          suggestedFix: 'Add semicolon at end of line',
        });
      }

      // Undefined variables (var usage)
      if (/\bvar\b/.test(line)) {
        errors.push({
          line: lineNum,
          column: line.indexOf('var'),
          message: 'Use const or let instead of var',
          severity: 'warning',
          type: 'best-practice',
          suggestedFix: 'Replace var with const or let',
        });
      }

      // Double equals instead of triple
      if (/[^=!]={2}[^=]/.test(line)) {
        errors.push({
          line: lineNum,
          column: line.indexOf('=='),
          message: 'Use === instead of ==',
          severity: 'warning',
          type: 'best-practice',
          suggestedFix: 'Replace == with ===',
        });
      }

      // Console.log (should be removed in production)
      if (/console\.log/.test(line)) {
        errors.push({
          line: lineNum,
          column: line.indexOf('console'),
          message: 'Remove console.log before production',
          severity: 'info',
          type: 'best-practice',
        });
      }

      // Unmatched brackets
      const openBrackets = (line.match(/[{[(]/g) || []).length;
      const closeBrackets = (line.match(/[}\])]/g) || []).length;
      if (openBrackets !== closeBrackets && !line.includes('//')) {
        errors.push({
          line: lineNum,
          column: 0,
          message: 'Unmatched brackets',
          severity: 'error',
          type: 'syntax',
        });
      }
    });

    return errors;
  }

  /**
   * Detect TypeScript-specific errors
   */
  private detectTypeScriptErrors(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = code.split('\n');

    // First run JavaScript checks
    errors.push(...this.detectJavaScriptErrors(code));

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Missing type annotations
      if (/function\s+\w+\s*\([^)]*\)\s*{/.test(line) && !/:/.test(line)) {
        errors.push({
          line: lineNum,
          column: 0,
          message: 'Function missing return type annotation',
          severity: 'warning',
          type: 'typescript',
          suggestedFix: 'Add return type annotation',
        });
      }

      // Any type usage
      if (/:\s*any\b/.test(line)) {
        errors.push({
          line: lineNum,
          column: line.indexOf('any'),
          message: 'Avoid using any type',
          severity: 'warning',
          type: 'typescript',
          suggestedFix: 'Use specific type instead of any',
        });
      }
    });

    return errors;
  }

  /**
   * Detect Python-specific errors
   */
  private detectPythonErrors(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Inconsistent indentation
      const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
      if (leadingSpaces % 4 !== 0 && line.trim().length > 0) {
        errors.push({
          line: lineNum,
          column: 0,
          message: 'Inconsistent indentation (should be multiple of 4)',
          severity: 'warning',
          type: 'style',
          suggestedFix: 'Use 4 spaces for indentation',
        });
      }

      // Missing colon after def/class/if/for/while
      if (/^\s*(def|class|if|for|while|try|except|finally)\s+.+[^:]$/.test(line)) {
        errors.push({
          line: lineNum,
          column: line.length,
          message: 'Missing colon',
          severity: 'error',
          type: 'syntax',
          suggestedFix: 'Add colon at end of line',
        });
      }

      // Print without parentheses (Python 3)
      if (/\bprint\s+[^(]/.test(line)) {
        errors.push({
          line: lineNum,
          column: line.indexOf('print'),
          message: 'print requires parentheses in Python 3',
          severity: 'error',
          type: 'syntax',
          suggestedFix: 'Use print(...) instead of print ...',
        });
      }
    });

    return errors;
  }

  /**
   * Detect Java-specific errors
   */
  private detectJavaErrors(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Missing semicolons
      if (/^\s*(int|String|boolean|return|System\.out\.println)\s+.*[^;{}\s]$/.test(line)) {
        errors.push({
          line: lineNum,
          column: line.length,
          message: 'Missing semicolon',
          severity: 'error',
          type: 'syntax',
          suggestedFix: 'Add semicolon at end of line',
        });
      }

      // Class name not capitalized
      if (/^\s*class\s+[a-z]/.test(line)) {
        errors.push({
          line: lineNum,
          column: line.indexOf('class'),
          message: 'Class name should start with uppercase letter',
          severity: 'warning',
          type: 'style',
          suggestedFix: 'Capitalize class name',
        });
      }
    });

    return errors;
  }

  /**
   * Detect common errors across all languages
   */
  private detectCommonErrors(code: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Trailing whitespace
      if (/\s+$/.test(line)) {
        errors.push({
          line: lineNum,
          column: line.length,
          message: 'Trailing whitespace',
          severity: 'info',
          type: 'style',
          suggestedFix: 'Remove trailing whitespace',
        });
      }

      // Lines too long (>120 characters)
      if (line.length > 120) {
        errors.push({
          line: lineNum,
          column: 120,
          message: 'Line too long (>120 characters)',
          severity: 'info',
          type: 'style',
          suggestedFix: 'Break line into multiple lines',
        });
      }

      // TODO/FIXME comments
      if (/\/\/\s*(TODO|FIXME)/i.test(line)) {
        errors.push({
          line: lineNum,
          column: line.search(/TODO|FIXME/i),
          message: 'Unresolved TODO/FIXME comment',
          severity: 'info',
          type: 'todo',
        });
      }
    });

    return errors;
  }

  /**
   * Get error count by severity
   */
  public getErrorStats(errors: CodeError[]): {
    errors: number;
    warnings: number;
    info: number;
  } {
    return {
      errors: errors.filter(e => e.severity === 'error').length,
      warnings: errors.filter(e => e.severity === 'warning').length,
      info: errors.filter(e => e.severity === 'info').length,
    };
  }

  /**
   * Sort errors by severity and line number
   */
  public sortErrors(errors: CodeError[]): CodeError[] {
    const severityOrder = { error: 0, warning: 1, info: 2 };

    return errors.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.line - b.line;
    });
  }
}

export default new ErrorDetectionService();
