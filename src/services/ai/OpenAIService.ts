import axios, { AxiosInstance } from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { AIProvider, AIGenerationRequest, AIGenerationResponse } from '@/types';

const OPENAI_API_KEY_STORAGE = '@openai_api_key';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIService implements AIProvider {
  public readonly name = 'OpenAI';
  private apiKey: string | null = null;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: OPENAI_API_URL,
      timeout: 30000,
    });
    this.loadApiKey();
  }

  private async loadApiKey(): Promise<void> {
    try {
      const key = await EncryptedStorage.getItem(OPENAI_API_KEY_STORAGE);
      this.apiKey = key;
    } catch (error) {
      console.error('Failed to load OpenAI API key:', error);
    }
  }

  public async setApiKey(key: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(OPENAI_API_KEY_STORAGE, key);
      this.apiKey = key;
    } catch (error) {
      console.error('Failed to save OpenAI API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  public isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  private getHeaders() {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  public async generateCode(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const prompt = `Generate ${request.language} code: ${request.prompt}
${request.context ? `\n\nContext:\n${request.context}` : ''}

Provide clean, well-commented code and a brief explanation.`;

    try {
      const response = await this.axiosInstance.post(
        '',
        {
          model: 'gpt-4',
          max_tokens: request.maxTokens || 2048,
          temperature: request.temperature || 0.7,
          messages: [{ role: 'user', content: prompt }],
        },
        { headers: this.getHeaders() }
      );

      const text = response.data.choices[0].message.content;

      return {
        code: text,
        explanation: '',
        language: request.language,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate code');
    }
  }

  public async completeCode(context: string, language: string): Promise<string> {
    const prompt = `Complete this ${language} code:\n\n${context}`;

    try {
      const response = await this.axiosInstance.post(
        '',
        {
          model: 'gpt-4',
          max_tokens: 1024,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }],
        },
        { headers: this.getHeaders() }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to complete code');
    }
  }

  public async explainCode(code: string, language: string): Promise<string> {
    const prompt = `Explain this ${language} code:\n\n${code}`;

    try {
      const response = await this.axiosInstance.post(
        '',
        {
          model: 'gpt-4',
          max_tokens: 1024,
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }],
        },
        { headers: this.getHeaders() }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to explain code');
    }
  }

  public async debugCode(code: string, error: string, language: string): Promise<string> {
    const prompt = `Debug this ${language} code. Error: ${error}\n\nCode:\n${code}`;

    try {
      const response = await this.axiosInstance.post(
        '',
        {
          model: 'gpt-4',
          max_tokens: 2048,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }],
        },
        { headers: this.getHeaders() }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to debug code');
    }
  }
}
