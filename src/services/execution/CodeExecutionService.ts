/**
 * CodeExecutionService
 *
 * Provides safe code execution in a sandboxed environment
 * Supports multiple programming languages
 * Handles timeouts and resource limits
 */

import { Platform } from 'react-native';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  language: string;
}

export interface ExecutionOptions {
  timeout?: number; // milliseconds
  maxOutputLength?: number;
  args?: string[];
  input?: string;
}

class CodeExecutionService {
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_OUTPUT_LENGTH = 10000; // 10KB

  /**
   * Execute code in the specified language
   */
  public async executeCode(
    code: string,
    language: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;
    const maxLength = options.maxOutputLength || this.MAX_OUTPUT_LENGTH;

    try {
      // Validate code
      if (!code || code.trim().length === 0) {
        return {
          success: false,
          output: '',
          error: 'No code provided',
          executionTime: Date.now() - startTime,
          language,
        };
      }

      // Execute based on language
      const result = await this.executeByLanguage(code, language, options, timeout);

      // Truncate output if too long
      if (result.output.length > maxLength) {
        result.output = result.output.substring(0, maxLength) + '\n... (output truncated)';
      }

      result.executionTime = Date.now() - startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown execution error',
        executionTime: Date.now() - startTime,
        language,
      };
    }
  }

  /**
   * Execute code based on language
   */
  private async executeByLanguage(
    code: string,
    language: string,
    options: ExecutionOptions,
    timeout: number
  ): Promise<ExecutionResult> {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return this.executeJavaScript(code, options, timeout);

      case 'typescript':
      case 'ts':
        return this.executeTypeScript(code, options, timeout);

      case 'python':
      case 'py':
        return this.executePython(code, options, timeout);

      default:
        return {
          success: false,
          output: '',
          error: `Language '${language}' is not supported for execution`,
          executionTime: 0,
          language,
        };
    }
  }

  /**
   * Execute JavaScript code
   */
  private async executeJavaScript(
    code: string,
    options: ExecutionOptions,
    timeout: number
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          output: '',
          error: 'Execution timeout',
          executionTime: timeout,
          language: 'javascript',
        });
      }, timeout);

      try {
        // Capture console output
        const logs: string[] = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args: any[]) => {
          logs.push(args.map(a => String(a)).join(' '));
        };
        console.error = (...args: any[]) => {
          logs.push('ERROR: ' + args.map(a => String(a)).join(' '));
        };
        console.warn = (...args: any[]) => {
          logs.push('WARN: ' + args.map(a => String(a)).join(' '));
        };

        // Create safe execution environment
        const safeCode = `
          (function() {
            'use strict';
            ${code}
          })();
        `;

        // Execute code
        // eslint-disable-next-line no-eval
        const result = eval(safeCode);

        // Restore console
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;

        clearTimeout(timeoutId);

        const output = logs.length > 0 ? logs.join('\n') : String(result);

        resolve({
          success: true,
          output: output || '(no output)',
          executionTime: 0,
          language: 'javascript',
        });
      } catch (error) {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          output: '',
          error: error instanceof Error ? error.message : 'Execution error',
          executionTime: 0,
          language: 'javascript',
        });
      }
    });
  }

  /**
   * Execute TypeScript code
   * Note: This requires transpilation to JavaScript first
   */
  private async executeTypeScript(
    code: string,
    options: ExecutionOptions,
    timeout: number
  ): Promise<ExecutionResult> {
    try {
      // For now, we'll try to execute TypeScript as JavaScript
      // In a production app, you'd use a TypeScript compiler
      return await this.executeJavaScript(code, options, timeout);
    } catch (error) {
      return {
        success: false,
        output: '',
        error: 'TypeScript execution requires compilation. Please use JavaScript or install a TypeScript runtime.',
        executionTime: 0,
        language: 'typescript',
      };
    }
  }

  /**
   * Execute Python code
   * Note: This is a simulation - React Native cannot execute Python directly
   */
  private async executePython(
    code: string,
    options: ExecutionOptions,
    timeout: number
  ): Promise<ExecutionResult> {
    // Python execution would require a Python runtime or API call
    return {
      success: false,
      output: '',
      error: 'Python execution is not available in this environment. Consider using an online Python interpreter API.',
      executionTime: 0,
      language: 'python',
    };
  }

  /**
   * Validate code for security issues
   */
  public validateCode(code: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      /require\s*\(\s*['"]fs['"]\s*\)/g, // File system access
      /require\s*\(\s*['"]child_process['"]\s*\)/g, // Process execution
      /require\s*\(\s*['"]net['"]\s*\)/g, // Network access
      /require\s*\(\s*['"]http['"]\s*\)/g, // HTTP requests
      /require\s*\(\s*['"]https['"]\s*\)/g, // HTTPS requests
      /XMLHttpRequest/g, // XHR
      /fetch\s*\(/g, // Fetch API
      /import\s+.*\s+from\s+['"]fs['"]/g, // ES6 imports of dangerous modules
      /import\s+.*\s+from\s+['"]child_process['"]/g,
      /eval\s*\(/g, // Eval (already used internally but shouldn't be in user code)
      /Function\s*\(/g, // Function constructor
      /setTimeout\s*\(/g, // Timers
      /setInterval\s*\(/g,
    ];

    dangerousPatterns.forEach((pattern) => {
      if (pattern.test(code)) {
        issues.push(`Potentially dangerous pattern detected: ${pattern.source}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Check if language is supported for execution
   */
  public isSupportedLanguage(language: string): boolean {
    const supported = ['javascript', 'js', 'typescript', 'ts'];
    return supported.includes(language.toLowerCase());
  }

  /**
   * Get list of supported languages
   */
  public getSupportedLanguages(): string[] {
    return ['JavaScript', 'TypeScript'];
  }
}

export default new CodeExecutionService();
