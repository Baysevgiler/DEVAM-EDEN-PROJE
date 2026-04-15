/**
 * AutoSuggestionService
 *
 * Provides real-time AI-powered code suggestions while typing
 * Uses debouncing to avoid excessive API calls
 * Integrates with AIConnectionManager for unlimited support
 */

import AIConnectionManager from './AIConnectionManager';

export interface CodeSuggestion {
  text: string;
  description: string;
  confidence: number;
  insertPosition?: number;
  replaceLength?: number;
}

export interface SuggestionContext {
  code: string;
  cursorPosition: number;
  language: string;
  fileName?: string;
}

class AutoSuggestionService {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 1000; // 1 second
  private lastSuggestionRequest: string = '';

  /**
   * Get code suggestions based on current context
   */
  public async getSuggestions(
    context: SuggestionContext
  ): Promise<CodeSuggestion[]> {
    try {
      // Don't request suggestions for very short code
      if (context.code.length < 3) {
        return [];
      }

      // Avoid duplicate requests
      const requestKey = `${context.code}_${context.cursorPosition}`;
      if (requestKey === this.lastSuggestionRequest) {
        return [];
      }
      this.lastSuggestionRequest = requestKey;

      // Get code before and after cursor
      const beforeCursor = context.code.substring(0, context.cursorPosition);
      const afterCursor = context.code.substring(context.cursorPosition);

      // Build prompt for AI
      const prompt = this.buildSuggestionPrompt(
        beforeCursor,
        afterCursor,
        context.language
      );

      // Request suggestions from AI
      const response = await AIConnectionManager.generateWithRetry({
        prompt,
        language: context.language,
        maxTokens: 512,
        temperature: 0.3, // Lower temperature for more predictable suggestions
      });

      // Parse suggestions from response
      return this.parseSuggestions(response.code, context);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Get suggestions with debouncing
   */
  public getSuggestionsDebounced(
    context: SuggestionContext,
    callback: (suggestions: CodeSuggestion[]) => void
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      const suggestions = await this.getSuggestions(context);
      callback(suggestions);
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Cancel pending suggestions
   */
  public cancelPendingSuggestions(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Build prompt for AI suggestion
   */
  private buildSuggestionPrompt(
    beforeCursor: string,
    afterCursor: string,
    language: string
  ): string {
    return `You are a code completion assistant. Suggest the next code to write.

Language: ${language}

Code before cursor:
\`\`\`${language}
${beforeCursor}
\`\`\`

Code after cursor:
\`\`\`${language}
${afterCursor}
\`\`\`

Provide 1-3 short, relevant code suggestions that could complete or improve the code at the cursor position. Each suggestion should be on a new line starting with "SUGGESTION:".

Example format:
SUGGESTION: const result =
SUGGESTION: return value;

Keep suggestions short (max 50 characters) and contextually relevant.`;
  }

  /**
   * Parse suggestions from AI response
   */
  private parseSuggestions(
    response: string,
    context: SuggestionContext
  ): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      if (line.startsWith('SUGGESTION:')) {
        const text = line.substring('SUGGESTION:'.length).trim();
        if (text.length > 0 && text.length <= 100) {
          suggestions.push({
            text,
            description: `Complete with: ${text}`,
            confidence: 0.8,
            insertPosition: context.cursorPosition,
          });
        }
      }
    }

    // If no structured suggestions, try to extract from code blocks
    if (suggestions.length === 0) {
      const codeMatch = response.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
      if (codeMatch) {
        const code = codeMatch[1].trim();
        if (code.length > 0 && code.length <= 100) {
          suggestions.push({
            text: code,
            description: 'AI suggestion',
            confidence: 0.7,
            insertPosition: context.cursorPosition,
          });
        }
      }
    }

    return suggestions.slice(0, 3); // Max 3 suggestions
  }

  /**
   * Get function signature help
   */
  public async getFunctionHelp(
    functionName: string,
    language: string
  ): Promise<string> {
    try {
      const prompt = `Provide a brief one-line signature and description for the ${language} function "${functionName}".

Format: functionName(param1: type, param2: type): returnType - Description

Example: map(callback: Function): Array - Transforms array elements`;

      const response = await AIConnectionManager.generateWithRetry({
        prompt,
        language,
        maxTokens: 256,
        temperature: 0.2,
      });

      return response.code.split('\n')[0] || '';
    } catch (error) {
      console.error('Failed to get function help:', error);
      return '';
    }
  }

  /**
   * Get quick fix suggestions for errors
   */
  public async getQuickFixes(
    code: string,
    error: string,
    language: string
  ): Promise<string[]> {
    try {
      const prompt = `The following ${language} code has an error:

\`\`\`${language}
${code}
\`\`\`

Error: ${error}

Suggest 2-3 quick fixes. Each fix should be one line starting with "FIX:".

Example:
FIX: Add semicolon at end of line
FIX: Change variable name to camelCase`;

      const response = await AIConnectionManager.generateWithRetry({
        prompt,
        language,
        maxTokens: 512,
        temperature: 0.3,
      });

      const fixes: string[] = [];
      const lines = response.code.split('\n');

      for (const line of lines) {
        if (line.startsWith('FIX:')) {
          const fix = line.substring('FIX:'.length).trim();
          if (fix.length > 0) {
            fixes.push(fix);
          }
        }
      }

      return fixes.slice(0, 3);
    } catch (error) {
      console.error('Failed to get quick fixes:', error);
      return [];
    }
  }
}

export default new AutoSuggestionService();
