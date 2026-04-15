import axios, { AxiosInstance } from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import { AIProvider, AIGenerationRequest, AIGenerationResponse } from '@/types';

const ANTHROPIC_API_KEY_STORAGE = '@anthropic_api_key';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export class ClaudeService implements AIProvider {
  public readonly name = 'Claude';
  private apiKey: string | null = null;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: ANTHROPIC_API_URL,
      timeout: 30000,
    });
    this.loadApiKey();
  }

  private async loadApiKey(): Promise<void> {
    try {
      const key = await EncryptedStorage.getItem(ANTHROPIC_API_KEY_STORAGE);
      this.apiKey = key;
    } catch (error) {
      console.error('Failed to load Anthropic API key:', error);
    }
  }

  public async setApiKey(key: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(ANTHROPIC_API_KEY_STORAGE, key);
      this.apiKey = key;
    } catch (error) {
      console.error('Failed to save Anthropic API key:', error);
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
      'x-api-key': this.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    };
  }

  public async generateCode(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const prompt = `Generate ${request.language} code based on this request: ${request.prompt}
${request.context ? `\n\nContext:\n${request.context}` : ''}

Please provide:
1. Clean, well-commented ${request.language} code
2. Brief explanation of what the code does

Format your response as:
CODE:
[your code here]

EXPLANATION:
[your explanation here]`;

    try {
      const response = await this.axiosInstance.post(
        '',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: request.maxTokens || 2048,
          temperature: request.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        { headers: this.getHeaders() }
      );

      const text = response.data.content[0].text;
      const { code, explanation } = this.parseGeneratedResponse(text);

      return {
        code,
        explanation,
        language: request.language,
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to generate code');
    }
  }

  public async completeCode(context: string, language: string): Promise<string> {
    const prompt = `Complete this ${language} code:\n\n${context}\n\nProvide only the completion, no explanations.`;

    try {
      const response = await this.axiosInstance.post(
        '',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }],
        },
        { headers: this.getHeaders() }
      );

      return response.data.content[0].text.trim();
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to complete code');
    }
  }

  public async explainCode(code: string, language: string): Promise<string> {
    const prompt = `Explain this ${language} code in simple terms:\n\n${code}`;

    try {
      const response = await this.axiosInstance.post(
        '',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }],
        },
        { headers: this.getHeaders() }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to explain code');
    }
  }

  public async debugCode(code: string, error: string, language: string): Promise<string> {
    const prompt = `Debug this ${language} code. Error: ${error}\n\nCode:\n${code}\n\nProvide fixed code and explanation.`;

    try {
      const response = await this.axiosInstance.post(
        '',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }],
        },
        { headers: this.getHeaders() }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to debug code');
    }
  }

  private parseGeneratedResponse(text: string): { code: string; explanation: string } {
    const codeMatch = text.match(/CODE:\s*([\s\S]*?)(?=EXPLANATION:|$)/i);
    const explanationMatch = text.match(/EXPLANATION:\s*([\s\S]*?)$/i);

    return {
      code: codeMatch ? codeMatch[1].trim() : text,
      explanation: explanationMatch ? explanationMatch[1].trim() : '',
    };
  }
}
