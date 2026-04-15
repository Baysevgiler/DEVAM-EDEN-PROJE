import { OpenAIService } from '@/services/ai/OpenAIService';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

jest.mock('axios');
jest.mock('react-native-encrypted-storage');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedStorage = EncryptedStorage as jest.Mocked<typeof EncryptedStorage>;

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OpenAIService();

    mockedAxios.create = jest.fn().mockReturnValue({
      post: jest.fn(),
    } as any);
  });

  describe('initialization', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('OpenAI');
    });

    it('should load API key on initialization', () => {
      expect(mockedStorage.getItem).toHaveBeenCalledWith('@openai_api_key');
    });
  });

  describe('setApiKey', () => {
    it('should save API key to encrypted storage', async () => {
      const testKey = 'sk-test-key';
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);

      await service.setApiKey(testKey);

      expect(mockedStorage.setItem).toHaveBeenCalledWith('@openai_api_key', testKey);
    });

    it('should throw error if storage fails', async () => {
      mockedStorage.setItem = jest.fn().mockRejectedValue(new Error('Storage error'));

      await expect(service.setApiKey('test-key')).rejects.toThrow('Failed to save API key');
    });
  });

  describe('isConfigured', () => {
    it('should return false when API key is null', () => {
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('generateCode', () => {
    it('should throw error when API key is not configured', async () => {
      await expect(
        service.generateCode({
          prompt: 'test',
          language: 'python',
        })
      ).rejects.toThrow('Failed to generate code');
    });

    it('should make correct API call with GPT-4', async () => {
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-test-key');

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'def test():\n    return True',
              },
            },
          ],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (service as any).axiosInstance = { post: mockPost };

      const result = await service.generateCode({
        prompt: 'Create a test function',
        language: 'python',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
            }),
          ]),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-test-key',
          }),
        })
      );

      expect(result.code).toBe('def test():\n    return True');
      expect(result.language).toBe('python');
    });

    it('should handle custom parameters', async () => {
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-test-key');

      const mockResponse = {
        data: {
          choices: [{ message: { content: 'code' } }],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (service as any).axiosInstance = { post: mockPost };

      await service.generateCode({
        prompt: 'test',
        language: 'javascript',
        maxTokens: 1000,
        temperature: 0.5,
      });

      expect(mockPost).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          max_tokens: 1000,
          temperature: 0.5,
        }),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-test-key');

      const mockPost = jest.fn().mockRejectedValue(new Error('Rate limit exceeded'));
      (service as any).axiosInstance = { post: mockPost };

      await expect(
        service.generateCode({
          prompt: 'test',
          language: 'javascript',
        })
      ).rejects.toThrow('Failed to generate code');
    });
  });

  describe('completeCode', () => {
    it('should throw error when API key is not configured', async () => {
      await expect(
        service.completeCode('function test() {\n', 'javascript')
      ).rejects.toThrow('Failed to complete code');
    });

    it('should complete code with lower temperature', async () => {
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-test-key');

      const mockResponse = {
        data: {
          choices: [{ message: { content: '  console.log(x);' } }],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (service as any).axiosInstance = { post: mockPost };

      const result = await service.completeCode('function test() {\n', 'javascript');

      expect(result).toBe('console.log(x);');
      expect(mockPost).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          temperature: 0.3,
          max_tokens: 1024,
        }),
        expect.any(Object)
      );
    });
  });

  describe('explainCode', () => {
    it('should explain code functionality', async () => {
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-test-key');

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'This is a recursive factorial function.',
              },
            },
          ],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (service as any).axiosInstance = { post: mockPost };

      const result = await service.explainCode(
        'function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }',
        'javascript'
      );

      expect(result).toBe('This is a recursive factorial function.');
    });
  });

  describe('debugCode', () => {
    it('should provide debugging suggestions', async () => {
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-test-key');

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'The variable needs to be declared first.',
              },
            },
          ],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (service as any).axiosInstance = { post: mockPost };

      const result = await service.debugCode(
        'console.log(undefinedVar);',
        'ReferenceError: undefinedVar is not defined',
        'javascript'
      );

      expect(result).toBe('The variable needs to be declared first.');
    });
  });
});
