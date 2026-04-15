/**
 * Extract code from AI response that may contain markdown code blocks
 */
export function extractCodeFromResponse(response: string): string {
  // Match code blocks with optional language identifier
  const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
  const match = response.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Return original if no code block found
  return response.trim();
}

/**
 * Detect programming language from code content
 */
export function detectLanguage(code: string): string {
  const patterns = {
    typescript: [
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /:\s*(string|number|boolean)/,
      /<.*>.*\(/,
    ],
    javascript: [
      /\b(const|let|var)\s+\w+/,
      /function\s+\w+\s*\(/,
      /=>\s*{/,
      /console\.log/,
    ],
    python: [
      /def\s+\w+\s*\(/,
      /import\s+\w+/,
      /from\s+\w+\s+import/,
      /print\s*\(/,
      /:\s*$/m,
    ],
    java: [
      /public\s+class\s+\w+/,
      /private\s+(void|int|String)/,
      /public\s+static\s+void\s+main/,
    ],
    kotlin: [/fun\s+\w+\s*\(/, /val\s+\w+/, /class\s+\w+/],
    go: [/func\s+\w+\s*\(/, /package\s+\w+/, /import\s+\(/],
    rust: [/fn\s+\w+\s*\(/, /let\s+mut\s+/, /impl\s+\w+/],
    cpp: [/#include\s*</, /std::/, /cout\s*<</],
    csharp: [/using\s+System/, /namespace\s+\w+/, /public\s+class/],
    php: [/<\?php/, /\$\w+\s*=/, /function\s+\w+\s*\(/],
    ruby: [/def\s+\w+/, /end\s*$/, /puts\s+/],
  };

  for (const [lang, regexList] of Object.entries(patterns)) {
    if (regexList.some(regex => regex.test(code))) {
      return lang;
    }
  }

  return 'text';
}

/**
 * Format code by removing excessive blank lines and normalizing whitespace
 */
export function formatCode(code: string, language: string): string {
  if (!code) return '';

  // Remove more than 2 consecutive blank lines
  let formatted = code.replace(/\n{3,}/g, '\n\n');

  // Trim trailing whitespace from each line
  formatted = formatted
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');

  return formatted;
}

/**
 * Count lines of code (excluding blank lines and comments)
 */
export function countLinesOfCode(code: string): number {
  return code
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('#');
    }).length;
}

/**
 * Validate if code contains potential security issues
 */
export function validateCodeSafety(code: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check for dangerous patterns
  if (/eval\s*\(/.test(code)) {
    warnings.push('Use of eval() detected - potential security risk');
  }

  if (/exec\s*\(/.test(code)) {
    warnings.push('Use of exec() detected - potential security risk');
  }

  if (/__(import|code)__/.test(code)) {
    warnings.push('Dynamic code execution detected');
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}
