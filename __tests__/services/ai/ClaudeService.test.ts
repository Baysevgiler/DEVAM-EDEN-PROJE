import { ClaudeService } from '@/services/ai/ClaudeService';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

// Mock dependencies
jest.mock('axios');
jest.mock('react-native-encrypted-storage');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedStorage = EncryptedStorage as jest.Mocked<typeof EncryptedStorage>;

describe('ClaudeService', () => {
  let service: ClaudeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClaudeService();

    // Mock axios.create to return a mock instance
    mockedAxios.create = jest.fn().mockReturnValue({
      post: jest.fn(),
    } as any);
  });

  describe('initialization', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('Claude');
    });

    it('should load API key on initialization', () => {
      expect(mockedStorage.getItem).toHaveBeenCalledWith('@anthropic_api_key');
    });
  });

  describe('setApiKey', () => {
    it('should save API key to encrypted storage', async () => {
      const testKey = 'sk-ant-test-key';
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);

      await service.setApiKey(testKey);

      expect(mockedStorage.setItem).toHaveBeenCalledWith('@anthropic_api_key', testKey);
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

    it('should return false when API key is empty', async () => {
      mockedStorage.getItem = jest.fn().mockResolvedValue('');
      const newService = new ClaudeService();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(newService.isConfigured()).toBe(false);
    });
  });

  describe('generateCode', () => {
    it('should throw error when API key is not configured', async () => {
      await expect(
        service.generateCode({
          prompt: 'test',
          language: 'javascript',
        })
      ).rejects.toThrow('Failed to generate code');
    });

    it('should make correct API call with valid parameters', async () => {
      // Set up the service with an API key
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-ant-test-key');

      const mockResponse = {
        data: {
          content: [
            {
              text: 'function test() { return true; }',
            },
          ],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (service as any).axiosInstance = { post: mockPost };

      const request = {
        prompt: 'Create a test function',
        language: 'javascript',
      };

      const result = await service.generateCode(request);

      expect(mockPost).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: expect.any(Array),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );

      expect(result.code).toBe('function test() { return true; }');
      expect(result.language).toBe('javascript');
    });

    it('should handle API errors gracefully', async () => {
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-ant-test-key');

      const mockPost = jest.fn().mockRejectedValue(new Error('API Error'));
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
        service.completeCode('const x = ', 'javascript')
      ).rejects.toThrow('Failed to complete code');
    });

    it('should make correct API call for code completion', async () => {
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-ant-test-key');

      const mockResponse = {
        data: {
          content: [{ text: '5;' }],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (service as any).axiosInstance = { post: mockPost };

      const result = await service.completeCode('const x = ', 'javascript');

      expect(result).toBe('5;');
      expect(mockPost).toHaveBeenCalled();
    });
  });

  describe('explainCode', () => {
    it('should generate code explanation', async () => {
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-ant-test-key');

      const mockResponse = {
        data: {
          content: [{ text: 'This function returns true.' }],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (service as any).axiosInstance = { post: mockPost };

      const result = await service.explainCode('function test() { return true; }', 'javascript');

      expect(result).toBe('This function returns true.');
    });
  });

  describe('debugCode', () => {
    it('should provide debugging assistance', async () => {
      mockedStorage.setItem = jest.fn().mockResolvedValue(undefined);
      await service.setApiKey('sk-ant-test-key');

      const mockResponse = {
        data: {
          content: [{ text: 'The error is caused by...' }],
        },
      };

      const mockPost = jest.fn().mockResolvedValue(mockResponse);
      (service as any).axiosInstance = { post: mockPost };

      const result = await service.debugCode(
        'console.log(x)',
        'ReferenceError: x is not defined',
        'javascript'
      );

      expect(result).toBe('The error is caused by...');
    });
  });
});
