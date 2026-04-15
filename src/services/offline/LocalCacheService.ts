/**
 * Local Cache Service
 *
 * AI yanıtlarını ve kod snippet'lerini yerel olarak saklar.
 * Offline modda kullanıcılara daha önce kaydedilmiş içerik gösterir.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CachedCode {
  id: string;
  code: string;
  language: string;
  prompt?: string;
  response?: string;
  timestamp: number;
  offline?: boolean;
}

export interface CachedAIResponse {
  prompt: string;
  response: string;
  provider: 'claude' | 'openai';
  timestamp: number;
}

const STORAGE_KEY_CODES = '@cached_codes';
const STORAGE_KEY_AI_RESPONSES = '@cached_ai_responses';
const STORAGE_KEY_OFFLINE_QUEUE = '@offline_queue';
const MAX_CACHE_SIZE = 100; // Maximum cache items

class LocalCacheService {
  /**
   * Kod snippet'i kaydet
   */
  public async saveCode(code: CachedCode): Promise<void> {
    try {
      const existingCodes = await this.getAllCodes();

      // Eğer ID varsa güncelle, yoksa ekle
      const index = existingCodes.findIndex(c => c.id === code.id);
      if (index >= 0) {
        existingCodes[index] = code;
      } else {
        existingCodes.unshift(code);
      }

      // Cache size limitini uygula
      const limitedCodes = existingCodes.slice(0, MAX_CACHE_SIZE);

      await AsyncStorage.setItem(STORAGE_KEY_CODES, JSON.stringify(limitedCodes));
      console.log('💾 Kod kaydedildi (cache):', code.id);
    } catch (error) {
      console.error('❌ Kod kaydedilemedi:', error);
      throw error;
    }
  }

  /**
   * Tüm kod snippet'leri al
   */
  public async getAllCodes(): Promise<CachedCode[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_CODES);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Kodlar okunamadı:', error);
      return [];
    }
  }

  /**
   * Belirli bir kodu al
   */
  public async getCode(id: string): Promise<CachedCode | null> {
    try {
      const codes = await this.getAllCodes();
      return codes.find(c => c.id === id) || null;
    } catch (error) {
      console.error('❌ Kod bulunamadı:', error);
      return null;
    }
  }

  /**
   * Kodu sil
   */
  public async deleteCode(id: string): Promise<void> {
    try {
      const codes = await this.getAllCodes();
      const filtered = codes.filter(c => c.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY_CODES, JSON.stringify(filtered));
      console.log('🗑️ Kod silindi:', id);
    } catch (error) {
      console.error('❌ Kod silinemedi:', error);
      throw error;
    }
  }

  /**
   * AI yanıtını cache'e kaydet
   */
  public async cacheAIResponse(response: CachedAIResponse): Promise<void> {
    try {
      const responses = await this.getCachedResponses();

      // Aynı prompt varsa güncelle
      const index = responses.findIndex(r => r.prompt === response.prompt);
      if (index >= 0) {
        responses[index] = response;
      } else {
        responses.unshift(response);
      }

      // Limiti uygula
      const limited = responses.slice(0, MAX_CACHE_SIZE);

      await AsyncStorage.setItem(STORAGE_KEY_AI_RESPONSES, JSON.stringify(limited));
      console.log('💾 AI yanıtı cache\'lendi');
    } catch (error) {
      console.error('❌ AI yanıtı cache\'lenemedi:', error);
    }
  }

  /**
   * Cache'lenmiş AI yanıtlarını al
   */
  public async getCachedResponses(): Promise<CachedAIResponse[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_AI_RESPONSES);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Cache\'lenmiş yanıtlar okunamadı:', error);
      return [];
    }
  }

  /**
   * Belirli bir prompt için cache'lenmiş yanıt ara
   */
  public async findCachedResponse(
    prompt: string,
    provider: 'claude' | 'openai'
  ): Promise<string | null> {
    try {
      const responses = await this.getCachedResponses();
      const found = responses.find(
        r => r.prompt.toLowerCase() === prompt.toLowerCase() && r.provider === provider
      );
      return found ? found.response : null;
    } catch (error) {
      console.error('❌ Cache arama hatası:', error);
      return null;
    }
  }

  /**
   * Offline kuyruğa istek ekle
   */
  public async addToOfflineQueue(request: {
    type: 'ai_request' | 'code_save';
    data: any;
    timestamp: number;
  }): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      queue.push(request);
      await AsyncStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify(queue));
      console.log('📥 Offline kuyruğa eklendi:', request.type);
    } catch (error) {
      console.error('❌ Offline kuyruğa eklenemedi:', error);
    }
  }

  /**
   * Offline kuyruğu al
   */
  public async getOfflineQueue(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_OFFLINE_QUEUE);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Offline kuyruk okunamadı:', error);
      return [];
    }
  }

  /**
   * Offline kuyruğu temizle
   */
  public async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_OFFLINE_QUEUE, JSON.stringify([]));
      console.log('🧹 Offline kuyruk temizlendi');
    } catch (error) {
      console.error('❌ Offline kuyruk temizlenemedi:', error);
    }
  }

  /**
   * Tüm cache'i temizle
   */
  public async clearAllCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_CODES);
      await AsyncStorage.removeItem(STORAGE_KEY_AI_RESPONSES);
      await AsyncStorage.removeItem(STORAGE_KEY_OFFLINE_QUEUE);
      console.log('🧹 Tüm cache temizlendi');
    } catch (error) {
      console.error('❌ Cache temizlenemedi:', error);
      throw error;
    }
  }

  /**
   * Cache istatistikleri
   */
  public async getCacheStats(): Promise<{
    totalCodes: number;
    totalResponses: number;
    queuedRequests: number;
    cacheSize: string;
  }> {
    try {
      const codes = await this.getAllCodes();
      const responses = await this.getCachedResponses();
      const queue = await this.getOfflineQueue();

      // Approximate cache size calculation
      const codesSize = JSON.stringify(codes).length;
      const responsesSize = JSON.stringify(responses).length;
      const queueSize = JSON.stringify(queue).length;
      const totalBytes = codesSize + responsesSize + queueSize;
      const totalKB = (totalBytes / 1024).toFixed(2);

      return {
        totalCodes: codes.length,
        totalResponses: responses.length,
        queuedRequests: queue.length,
        cacheSize: `${totalKB} KB`,
      };
    } catch (error) {
      console.error('❌ Cache istatistikleri alınamadı:', error);
      return {
        totalCodes: 0,
        totalResponses: 0,
        queuedRequests: 0,
        cacheSize: '0 KB',
      };
    }
  }
}

export default new LocalCacheService();
