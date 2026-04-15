/**
 * CodeSavingService
 *
 * Saves and manages code snippets with metadata
 * Supports favorites, tags, and search
 * Persists to AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

export interface SavedCode {
  id: string;
  title: string;
  code: string;
  language: string;
  description?: string;
  tags: string[];
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  filePath?: string;
}

const STORAGE_KEY = '@saved_codes';
const FILE_DIRECTORY = `${RNFS.DocumentDirectoryPath}/codes`;

class CodeSavingService {
  private cache: SavedCode[] | null = null;

  constructor() {
    this.ensureDirectoryExists();
  }

  /**
   * Ensure the codes directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      const exists = await RNFS.exists(FILE_DIRECTORY);
      if (!exists) {
        await RNFS.mkdir(FILE_DIRECTORY);
      }
    } catch (error) {
      console.error('Failed to create directory:', error);
    }
  }

  /**
   * Save code snippet
   */
  public async saveCode(
    code: Omit<SavedCode, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SavedCode> {
    try {
      const codes = await this.getAllCodes();

      const newCode: SavedCode = {
        ...code,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to file system if requested
      if (code.filePath) {
        await this.saveToFile(newCode);
      }

      codes.push(newCode);
      await this.persistCodes(codes);

      return newCode;
    } catch (error) {
      console.error('Failed to save code:', error);
      throw new Error('Failed to save code');
    }
  }

  /**
   * Update existing code
   */
  public async updateCode(id: string, updates: Partial<SavedCode>): Promise<SavedCode> {
    const codes = await this.getAllCodes();
    const index = codes.findIndex(c => c.id === id);

    if (index === -1) {
      throw new Error('Code not found');
    }

    try {

      const updatedCode: SavedCode = {
        ...codes[index],
        ...updates,
        id: codes[index].id, // Preserve ID
        createdAt: codes[index].createdAt, // Preserve creation date
        updatedAt: new Date(),
      };

      // Update file if exists
      if (updatedCode.filePath) {
        await this.saveToFile(updatedCode);
      }

      codes[index] = updatedCode;
      await this.persistCodes(codes);

      return updatedCode;
    } catch (error) {
      console.error('Failed to update code:', error);
      throw new Error('Failed to update code');
    }
  }

  /**
   * Delete code
   */
  public async deleteCode(id: string): Promise<void> {
    try {
      const codes = await this.getAllCodes();
      const code = codes.find(c => c.id === id);

      if (code?.filePath) {
        await this.deleteFile(code.filePath);
      }

      const filtered = codes.filter(c => c.id !== id);
      await this.persistCodes(filtered);
    } catch (error) {
      console.error('Failed to delete code:', error);
      throw new Error('Failed to delete code');
    }
  }

  /**
   * Get all saved codes
   */
  public async getAllCodes(): Promise<SavedCode[]> {
    try {
      if (this.cache) {
        return this.cache;
      }

      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.cache = [];
        return [];
      }

      const codes = JSON.parse(data) as SavedCode[];

      // Parse dates
      codes.forEach(code => {
        code.createdAt = new Date(code.createdAt);
        code.updatedAt = new Date(code.updatedAt);
      });

      this.cache = codes;
      return codes;
    } catch (error) {
      console.error('Failed to load codes:', error);
      return [];
    }
  }

  /**
   * Get code by ID
   */
  public async getCode(id: string): Promise<SavedCode | null> {
    const codes = await this.getAllCodes();
    return codes.find(c => c.id === id) || null;
  }

  /**
   * Search codes
   */
  public async searchCodes(query: string): Promise<SavedCode[]> {
    const codes = await this.getAllCodes();
    const lowerQuery = query.toLowerCase();

    return codes.filter(code =>
      code.title.toLowerCase().includes(lowerQuery) ||
      code.code.toLowerCase().includes(lowerQuery) ||
      code.description?.toLowerCase().includes(lowerQuery) ||
      code.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Filter codes by language
   */
  public async getCodesByLanguage(language: string): Promise<SavedCode[]> {
    const codes = await this.getAllCodes();
    return codes.filter(c => c.language.toLowerCase() === language.toLowerCase());
  }

  /**
   * Get favorite codes
   */
  public async getFavorites(): Promise<SavedCode[]> {
    const codes = await this.getAllCodes();
    return codes.filter(c => c.favorite);
  }

  /**
   * Get codes by tag
   */
  public async getCodesByTag(tag: string): Promise<SavedCode[]> {
    const codes = await this.getAllCodes();
    return codes.filter(c => c.tags.includes(tag));
  }

  /**
   * Get all unique tags
   */
  public async getAllTags(): Promise<string[]> {
    const codes = await this.getAllCodes();
    const tags = new Set<string>();

    codes.forEach(code => {
      code.tags.forEach(tag => tags.add(tag));
    });

    return Array.from(tags).sort();
  }

  /**
   * Toggle favorite status
   */
  public async toggleFavorite(id: string): Promise<SavedCode> {
    const code = await this.getCode(id);
    if (!code) {
      throw new Error('Code not found');
    }

    return this.updateCode(id, { favorite: !code.favorite });
  }

  /**
   * Export code to file
   */
  public async exportToFile(id: string, filePath?: string): Promise<string> {
    try {
      const code = await this.getCode(id);
      if (!code) {
        throw new Error('Code not found');
      }

      const path = filePath || `${FILE_DIRECTORY}/${code.id}.${this.getFileExtension(code.language)}`;
      await RNFS.writeFile(path, code.code, 'utf8');

      // Update code with file path
      await this.updateCode(id, { filePath: path });

      return path;
    } catch (error) {
      console.error('Failed to export code:', error);
      throw new Error('Failed to export code');
    }
  }

  /**
   * Import code from file
   */
  public async importFromFile(filePath: string): Promise<SavedCode> {
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        throw new Error('File not found');
      }

      const code = await RNFS.readFile(filePath, 'utf8');
      const fileName = filePath.split('/').pop() || 'imported';
      const extension = fileName.split('.').pop() || '';
      const language = this.languageFromExtension(extension);

      return this.saveCode({
        title: fileName,
        code,
        language,
        tags: [],
        favorite: false,
        filePath,
      });
    } catch (error) {
      console.error('Failed to import code:', error);
      throw new Error('Failed to import code');
    }
  }

  /**
   * Get recent codes
   */
  public async getRecentCodes(limit: number = 10): Promise<SavedCode[]> {
    const codes = await this.getAllCodes();
    return codes
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Clear all codes
   */
  public async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this.cache = [];
    } catch (error) {
      console.error('Failed to clear codes:', error);
      throw new Error('Failed to clear codes');
    }
  }

  /**
   * Private: Persist codes to storage
   */
  private async persistCodes(codes: SavedCode[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    this.cache = codes;
  }

  /**
   * Private: Save code to file system
   */
  private async saveToFile(code: SavedCode): Promise<void> {
    if (!code.filePath) return;

    try {
      await RNFS.writeFile(code.filePath, code.code, 'utf8');
    } catch (error) {
      console.error('Failed to save to file:', error);
    }
  }

  /**
   * Private: Delete file from file system
   */
  private async deleteFile(filePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  /**
   * Private: Generate unique ID
   */
  private generateId(): string {
    return `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Get file extension for language
   */
  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      kotlin: 'kt',
      swift: 'swift',
      go: 'go',
      rust: 'rs',
      cpp: 'cpp',
      csharp: 'cs',
      php: 'php',
      ruby: 'rb',
      html: 'html',
      css: 'css',
      sql: 'sql',
    };

    return extensions[language.toLowerCase()] || 'txt';
  }

  /**
   * Private: Get language from file extension
   */
  private languageFromExtension(extension: string): string {
    const languages: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      kt: 'kotlin',
      swift: 'swift',
      go: 'go',
      rs: 'rust',
      cpp: 'cpp',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      html: 'html',
      css: 'css',
      sql: 'sql',
    };

    return languages[extension.toLowerCase()] || 'text';
  }
}

export default new CodeSavingService();
