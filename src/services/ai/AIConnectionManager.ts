/**
 * AI Connection Manager
 * Otomatik key rotation ve sınırsız AI desteği için akıllı bağlantı yöneticisi
 */

import { ClaudeService } from './ClaudeService';
import { OpenAIService } from './OpenAIService';
import { AIProvider, AIGenerationRequest, AIGenerationResponse } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AIKeyPool {
  claude: string[];
  openai: string[];
}

interface ConnectionStats {
  provider: 'claude' | 'openai';
  keyIndex: number;
  requestCount: number;
  lastUsed: Date;
  errorCount: number;
  rateLimitUntil?: Date;
}

const STORAGE_KEY_POOL = '@ai_key_pool';
const STORAGE_STATS = '@connection_stats';
const MAX_REQUESTS_PER_KEY = 100; // Her key için max istek
const RATE_LIMIT_COOLDOWN = 60000; // 1 dakika cooldown
const MAX_ERRORS_BEFORE_ROTATE = 3; // 3 hatadan sonra key değiştir

export class AIConnectionManager {
  private claudeServices: ClaudeService[] = [];
  private openAIServices: OpenAIService[] = [];
  private stats: ConnectionStats[] = [];
  private currentClaudeIndex = 0;
  private currentOpenAIIndex = 0;

  constructor() {
    this.loadKeyPool();
    this.loadStats();
  }

  /**
   * Key pool'u yükle
   */
  private async loadKeyPool(): Promise<void> {
    try {
      const poolData = await AsyncStorage.getItem(STORAGE_KEY_POOL);
      if (poolData) {
        const pool: AIKeyPool = JSON.parse(poolData);

        // Claude servislerini başlat
        pool.claude.forEach((key, index) => {
          const service = new ClaudeService();
          service.setApiKey(key);
          this.claudeServices.push(service);

          if (!this.stats.find(s => s.provider === 'claude' && s.keyIndex === index)) {
            this.stats.push({
              provider: 'claude',
              keyIndex: index,
              requestCount: 0,
              lastUsed: new Date(),
              errorCount: 0,
            });
          }
        });

        // OpenAI servislerini başlat
        pool.openai.forEach((key, index) => {
          const service = new OpenAIService();
          service.setApiKey(key);
          this.openAIServices.push(service);

          if (!this.stats.find(s => s.provider === 'openai' && s.keyIndex === index)) {
            this.stats.push({
              provider: 'openai',
              keyIndex: index,
              requestCount: 0,
              lastUsed: new Date(),
              errorCount: 0,
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to load key pool:', error);
    }
  }

  /**
   * İstatistikleri yükle
   */
  private async loadStats(): Promise<void> {
    try {
      const statsData = await AsyncStorage.getItem(STORAGE_STATS);
      if (statsData) {
        this.stats = JSON.parse(statsData);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  /**
   * Key pool'a yeni key ekle
   */
  public async addKeyToPool(provider: 'claude' | 'openai', apiKey: string): Promise<void> {
    try {
      const poolData = await AsyncStorage.getItem(STORAGE_KEY_POOL);
      const pool: AIKeyPool = poolData ? JSON.parse(poolData) : { claude: [], openai: [] };

      if (!pool[provider].includes(apiKey)) {
        pool[provider].push(apiKey);
        await AsyncStorage.setItem(STORAGE_KEY_POOL, JSON.stringify(pool));

        // Servisi ekle
        if (provider === 'claude') {
          const service = new ClaudeService();
          await service.setApiKey(apiKey);
          this.claudeServices.push(service);
        } else {
          const service = new OpenAIService();
          await service.setApiKey(apiKey);
          this.openAIServices.push(service);
        }

        console.log(`Added new ${provider} key to pool. Total: ${pool[provider].length}`);
      }
    } catch (error) {
      console.error('Failed to add key to pool:', error);
      throw error;
    }
  }

  /**
   * En iyi servisi seç (load balancing + health check)
   */
  private selectBestService(provider: 'claude' | 'openai'): { service: AIProvider; index: number } | null {
    const services = provider === 'claude' ? this.claudeServices : this.openAIServices;
    const providerStats = this.stats.filter(s => s.provider === provider);

    if (services.length === 0) {
      return null;
    }

    // Rate limit ve error count kontrolü
    const availableIndices = providerStats
      .filter(stat => {
        // Rate limit kontrolü
        if (stat.rateLimitUntil && stat.rateLimitUntil > new Date()) {
          return false;
        }

        // Max request kontrolü
        if (stat.requestCount >= MAX_REQUESTS_PER_KEY) {
          return false;
        }

        // Error count kontrolü
        if (stat.errorCount >= MAX_ERRORS_BEFORE_ROTATE) {
          return false;
        }

        return true;
      })
      .map(s => s.keyIndex);

    if (availableIndices.length === 0) {
      // Tüm keyler doluysa, en az kullanılanı seç ve reset et
      const leastUsed = providerStats.reduce((prev, curr) =>
        prev.requestCount < curr.requestCount ? prev : curr
      );
      leastUsed.requestCount = 0;
      leastUsed.errorCount = 0;
      leastUsed.rateLimitUntil = undefined;
      return { service: services[leastUsed.keyIndex], index: leastUsed.keyIndex };
    }

    // En az kullanılan key'i seç
    const selectedIndex = availableIndices.reduce((prev, curr) => {
      const prevStat = providerStats.find(s => s.keyIndex === prev);
      const currStat = providerStats.find(s => s.keyIndex === curr);
      return (prevStat?.requestCount || 0) < (currStat?.requestCount || 0) ? prev : curr;
    });

    return { service: services[selectedIndex], index: selectedIndex };
  }

  /**
   * İstatistikleri güncelle
   */
  private updateStats(provider: 'claude' | 'openai', index: number, success: boolean): void {
    const stat = this.stats.find(s => s.provider === provider && s.keyIndex === index);
    if (stat) {
      stat.requestCount++;
      stat.lastUsed = new Date();

      if (!success) {
        stat.errorCount++;

        // Rate limit hatası ise cooldown koy
        if (stat.errorCount >= MAX_ERRORS_BEFORE_ROTATE) {
          stat.rateLimitUntil = new Date(Date.now() + RATE_LIMIT_COOLDOWN);
        }
      } else {
        // Başarılı istek, error count'u sıfırla
        stat.errorCount = 0;
      }

      // İstatistikleri kaydet
      AsyncStorage.setItem(STORAGE_STATS, JSON.stringify(this.stats));
    }
  }

  /**
   * Otomatik retry ile kod üret
   */
  public async generateCodeWithRetry(
    request: AIGenerationRequest,
    provider: 'claude' | 'openai' = 'claude',
    maxRetries: number = 3
  ): Promise<AIGenerationResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const selected = this.selectBestService(provider);

        if (!selected) {
          // Pool boşsa, diğer provider'ı dene
          const fallbackProvider = provider === 'claude' ? 'openai' : 'claude';
          const fallback = this.selectBestService(fallbackProvider);

          if (!fallback) {
            throw new Error('No available API keys in pool. Please add keys.');
          }

          console.log(`Falling back to ${fallbackProvider}`);
          const result = await fallback.service.generateCode(request);
          this.updateStats(fallbackProvider, fallback.index, true);
          return result;
        }

        // İstek gönder
        const result = await selected.service.generateCode(request);
        this.updateStats(provider, selected.index, true);
        return result;

      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error.message);

        // Eğer hata rate limit veya quota ise, bir sonraki key'e geç
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          const selected = this.selectBestService(provider);
          if (selected) {
            this.updateStats(provider, selected.index, false);
          }

          // Kısa bir bekleme
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        // Diğer hatalar için tekrar deneme
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }

    throw lastError || new Error('Failed to generate code after retries');
  }

  /**
   * Pool durumunu al
   */
  public getPoolStatus(): {
    claude: { total: number; available: number };
    openai: { total: number; available: number };
  } {
    const claudeStats = this.stats.filter(s => s.provider === 'claude');
    const openAIStats = this.stats.filter(s => s.provider === 'openai');

    return {
      claude: {
        total: this.claudeServices.length,
        available: claudeStats.filter(s =>
          s.requestCount < MAX_REQUESTS_PER_KEY &&
          s.errorCount < MAX_ERRORS_BEFORE_ROTATE &&
          (!s.rateLimitUntil || s.rateLimitUntil < new Date())
        ).length,
      },
      openai: {
        total: this.openAIServices.length,
        available: openAIStats.filter(s =>
          s.requestCount < MAX_REQUESTS_PER_KEY &&
          s.errorCount < MAX_ERRORS_BEFORE_ROTATE &&
          (!s.rateLimitUntil || s.rateLimitUntil < new Date())
        ).length,
      },
    };
  }

  /**
   * Pool'u sıfırla (yeni gün için)
   */
  public async resetPool(): Promise<void> {
    this.stats.forEach(stat => {
      stat.requestCount = 0;
      stat.errorCount = 0;
      stat.rateLimitUntil = undefined;
    });

    await AsyncStorage.setItem(STORAGE_STATS, JSON.stringify(this.stats));
    console.log('Pool reset completed');
  }

  /**
   * Virtual connection simülasyonu (kullanıcıya göstermek için)
   */
  public async establishVirtualConnection(): Promise<{
    status: 'connected' | 'connecting' | 'error';
    activeConnections: number;
    totalCapacity: number;
  }> {
    const status = this.getPoolStatus();
    const totalAvailable = status.claude.available + status.openai.available;
    const totalCapacity = status.claude.total + status.openai.total;

    return {
      status: totalAvailable > 0 ? 'connected' : 'error',
      activeConnections: totalAvailable,
      totalCapacity,
    };
  }
}

// Singleton instance
export const aiConnectionManager = new AIConnectionManager();
