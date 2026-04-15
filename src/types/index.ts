/**
 * Core type definitions for the application
 */

export interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface AIGenerationRequest {
  prompt: string;
  language: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIGenerationResponse {
  code: string;
  explanation?: string;
  language: string;
}

export interface AIProvider {
  name: string;
  generateCode(request: AIGenerationRequest): Promise<AIGenerationResponse>;
  completeCode(context: string, language: string): Promise<string>;
  explainCode(code: string, language: string): Promise<string>;
  debugCode(code: string, error: string, language: string): Promise<string>;
}

export type ProgrammingLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'kotlin'
  | 'swift'
  | 'go'
  | 'rust'
  | 'cpp'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'html'
  | 'css'
  | 'sql';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  defaultLanguage: ProgrammingLanguage;
  aiProvider: 'claude' | 'openai';
  autoSave: boolean;
  fontSize: number;
  tabSize: number;
}
