import LocalCacheService, { CachedCode, CachedAIResponse } from '@/services/offline/LocalCacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('LocalCacheService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Code Caching', () => {
    it('should save code to cache', async () => {
      const code: CachedCode = {
        id: 'test-1',
        code: 'console.log("Hello")',
        language: 'javascript',
        timestamp: Date.now(),
      };

      await LocalCacheService.saveCode(code);

      const saved = await AsyncStorage.getItem('@cached_codes');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('test-1');
    });

    it('should get all cached codes', async () => {
      const code1: CachedCode = {
        id: 'test-1',
        code: 'console.log("1")',
        language: 'javascript',
        timestamp: Date.now(),
      };

      const code2: CachedCode = {
        id: 'test-2',
        code: 'console.log("2")',
        language: 'typescript',
        timestamp: Date.now(),
      };

      await LocalCacheService.saveCode(code1);
      await LocalCacheService.saveCode(code2);

      const codes = await LocalCacheService.getAllCodes();
      expect(codes).toHaveLength(2);
    });

    it('should get specific code by id', async () => {
      const code: CachedCode = {
        id: 'test-unique',
        code: 'const x = 1;',
        language: 'javascript',
        timestamp: Date.now(),
      };

      await LocalCacheService.saveCode(code);

      const retrieved = await LocalCacheService.getCode('test-unique');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.code).toBe('const x = 1;');
    });

    it('should delete code from cache', async () => {
      const code: CachedCode = {
        id: 'to-delete',
        code: 'test',
        language: 'javascript',
        timestamp: Date.now(),
      };

      await LocalCacheService.saveCode(code);
      await LocalCacheService.deleteCode('to-delete');

      const codes = await LocalCacheService.getAllCodes();
      expect(codes).toHaveLength(0);
    });

    it('should update existing code', async () => {
      const code1: CachedCode = {
        id: 'test-1',
        code: 'old code',
        language: 'javascript',
        timestamp: Date.now(),
      };

      await LocalCacheService.saveCode(code1);

      const code2: CachedCode = {
        id: 'test-1',
        code: 'new code',
        language: 'javascript',
        timestamp: Date.now(),
      };

      await LocalCacheService.saveCode(code2);

      const codes = await LocalCacheService.getAllCodes();
      expect(codes).toHaveLength(1);
      expect(codes[0].code).toBe('new code');
    });
  });

  describe('AI Response Caching', () => {
    it('should cache AI response', async () => {
      const response: CachedAIResponse = {
        prompt: 'Write a function',
        response: 'const func = () => {}',
        provider: 'claude',
        timestamp: Date.now(),
      };

      await LocalCacheService.cacheAIResponse(response);

      const cached = await LocalCacheService.getCachedResponses();
      expect(cached).toHaveLength(1);
      expect(cached[0].prompt).toBe('Write a function');
    });

    it('should find cached response by prompt', async () => {
      const response: CachedAIResponse = {
        prompt: 'Hello World',
        response: 'console.log("Hello World")',
        provider: 'claude',
        timestamp: Date.now(),
      };

      await LocalCacheService.cacheAIResponse(response);

      const found = await LocalCacheService.findCachedResponse('Hello World', 'claude');
      expect(found).toBe('console.log("Hello World")');
    });

    it('should return null for non-existent cached response', async () => {
      const found = await LocalCacheService.findCachedResponse('Non-existent', 'claude');
      expect(found).toBeNull();
    });

    it('should be case insensitive when finding cached response', async () => {
      const response: CachedAIResponse = {
        prompt: 'Test Prompt',
        response: 'result',
        provider: 'claude',
        timestamp: Date.now(),
      };

      await LocalCacheService.cacheAIResponse(response);

      const found = await LocalCacheService.findCachedResponse('test prompt', 'claude');
      expect(found).toBe('result');
    });
  });

  describe('Offline Queue', () => {
    it('should add request to offline queue', async () => {
      const request = {
        type: 'ai_request' as const,
        data: { prompt: 'test' },
        timestamp: Date.now(),
      };

      await LocalCacheService.addToOfflineQueue(request);

      const queue = await LocalCacheService.getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('ai_request');
    });

    it('should get offline queue', async () => {
      const request1 = {
        type: 'ai_request' as const,
        data: { prompt: 'test1' },
        timestamp: Date.now(),
      };

      const request2 = {
        type: 'code_save' as const,
        data: { code: 'test2' },
        timestamp: Date.now(),
      };

      await LocalCacheService.addToOfflineQueue(request1);
      await LocalCacheService.addToOfflineQueue(request2);

      const queue = await LocalCacheService.getOfflineQueue();
      expect(queue).toHaveLength(2);
    });

    it('should clear offline queue', async () => {
      const request = {
        type: 'ai_request' as const,
        data: { prompt: 'test' },
        timestamp: Date.now(),
      };

      await LocalCacheService.addToOfflineQueue(request);
      await LocalCacheService.clearOfflineQueue();

      const queue = await LocalCacheService.getOfflineQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe('Cache Management', () => {
    it('should get cache statistics', async () => {
      const code: CachedCode = {
        id: 'test-1',
        code: 'test',
        language: 'javascript',
        timestamp: Date.now(),
      };

      await LocalCacheService.saveCode(code);

      const stats = await LocalCacheService.getCacheStats();

      expect(stats.totalCodes).toBe(1);
      expect(stats.totalResponses).toBe(0);
      expect(stats.queuedRequests).toBe(0);
      expect(stats.cacheSize).toMatch(/KB/);
    });

    it('should clear all cache', async () => {
      const code: CachedCode = {
        id: 'test-1',
        code: 'test',
        language: 'javascript',
        timestamp: Date.now(),
      };

      const response: CachedAIResponse = {
        prompt: 'test',
        response: 'result',
        provider: 'claude',
        timestamp: Date.now(),
      };

      await LocalCacheService.saveCode(code);
      await LocalCacheService.cacheAIResponse(response);
      await LocalCacheService.clearAllCache();

      const codes = await LocalCacheService.getAllCodes();
      const responses = await LocalCacheService.getCachedResponses();

      expect(codes).toHaveLength(0);
      expect(responses).toHaveLength(0);
    });
  });
});
