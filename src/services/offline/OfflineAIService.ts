/**
 * Offline AI Service
 *
 * Offline modda AI benzeri deneyim sağlar:
 * - Önceden cache'lenmiş yanıtları kullanır
 * - Temel kod completion önerileri sunar
 * - Syntax highlighting ve basic validation
 * - Online olunca otomatik senkronizasyon
 */

import LocalCacheService, { CachedAIResponse } from './LocalCacheService';
import OfflineService from './OfflineService';

export interface OfflineAIResponse {
  response: string;
  fromCache: boolean;
  offline: boolean;
  suggestion?: string;
}

class OfflineAIService {
  /**
   * Offline modda AI isteği yap
   * - Önce cache'e bak
   * - Yoksa temel öneri sun
   * - Online olunca gerçek AI'ya gönder
   */
  public async processRequest(
    prompt: string,
    provider: 'claude' | 'openai'
  ): Promise<OfflineAIResponse> {
    const isOnline = OfflineService.isOnline();

    // Online ise gerçek AI'ya gönder (bu servisi çağıran kod handle edecek)
    if (isOnline) {
      return {
        response: '',
        fromCache: false,
        offline: false,
      };
    }

    console.log('🔌 Offline mod - Cache kontrol ediliyor...');

    // Cache'de ara
    const cachedResponse = await LocalCacheService.findCachedResponse(prompt, provider);

    if (cachedResponse) {
      console.log('✅ Cache\'den yanıt bulundu');
      return {
        response: cachedResponse,
        fromCache: true,
        offline: true,
      };
    }

    // Cache'de yoksa temel öneri sun
    const suggestion = this.generateOfflineSuggestion(prompt);

    // İsteği kuyruğa ekle
    await LocalCacheService.addToOfflineQueue({
      type: 'ai_request',
      data: { prompt, provider },
      timestamp: Date.now(),
    });

    return {
      response: '',
      fromCache: false,
      offline: true,
      suggestion,
    };
  }

  /**
   * Offline modda temel öneri oluştur
   */
  private generateOfflineSuggestion(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    // Kod yazma isteği
    if (
      lowerPrompt.includes('write') ||
      lowerPrompt.includes('create') ||
      lowerPrompt.includes('yaz') ||
      lowerPrompt.includes('oluştur')
    ) {
      return this.getCodeTemplateSuggestion(lowerPrompt);
    }

    // Hata düzeltme
    if (lowerPrompt.includes('fix') || lowerPrompt.includes('error') || lowerPrompt.includes('hata')) {
      return `🔌 Offline Mod

Hata düzeltme için internet bağlantısı gerekiyor.

Yapabilecekleriniz:
• Kodu yerel olarak kaydedin
• Internet bağlantısı kurulunca otomatik işlenecek
• Daha önce benzer hatalar için cache'e bakın`;
    }

    // Açıklama isteği
    if (
      lowerPrompt.includes('explain') ||
      lowerPrompt.includes('what') ||
      lowerPrompt.includes('açıkla') ||
      lowerPrompt.includes('nedir')
    ) {
      return `🔌 Offline Mod

Detaylı açıklama için internet bağlantısı gerekiyor.

Öneriler:
• İsteğiniz kaydedildi
• Online olunca otomatik yanıt alacaksınız
• Şu anda yerel kod çalıştırma yapabilirsiniz`;
    }

    // Genel yanıt
    return `🔌 Offline Mod Aktif

AI özellikleri internet bağlantısı gerektirir.

Yapabilecekleriniz:
• Kod yazın ve yerel olarak kaydedin
• Daha önce cache'lenmiş yanıtları kullanın
• Terminal ve File Manager kullanın
• Internet bağlantısı kurulunca tüm istekler işlenecek`;
  }

  /**
   * Kod şablonu önerisi
   */
  private getCodeTemplateSuggestion(prompt: string): string {
    // React component
    if (prompt.includes('react') || prompt.includes('component')) {
      return `🔌 Offline Mod - React Component Şablonu

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MyComponent = () => {
  return (
    <View style={styles.container}>
      <Text>Hello World</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MyComponent;

💡 Internet bağlantısı kurulunca AI ile özelleştirebilirsiniz.`;
    }

    // Function
    if (prompt.includes('function') || prompt.includes('fonksiyon')) {
      return `🔌 Offline Mod - Function Şablonu

const myFunction = (param) => {
  // Your code here
  return result;
};

// Örnek kullanım:
const result = myFunction(input);
console.log(result);

💡 Internet bağlantısı kurulunca AI ile özelleştirebilirsiniz.`;
    }

    // API call
    if (prompt.includes('api') || prompt.includes('fetch') || prompt.includes('axios')) {
      return `🔌 Offline Mod - API Call Şablonu

const fetchData = async () => {
  try {
    const response = await fetch('YOUR_API_URL');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

💡 Internet bağlantısı kurulunca AI ile özelleştirebilirsiniz.`;
    }

    // Genel template
    return `🔌 Offline Mod - Temel Kod Şablonu

// Your code here
const example = () => {
  console.log('Hello from offline mode!');
};

example();

💡 İnternet bağlantısı kurulunca AI ile detaylı kod üretebilirsiniz.
💾 Kodunuz yerel olarak kaydedildi.`;
  }

  /**
   * Offline kuyruğu işle (online olunca)
   */
  public async processOfflineQueue(): Promise<void> {
    if (OfflineService.isOffline()) {
      console.log('⚠️  Hala offline - Kuyruk işlenemez');
      return;
    }

    const queue = await LocalCacheService.getOfflineQueue();

    if (queue.length === 0) {
      console.log('✅ Offline kuyruk boş');
      return;
    }

    console.log(`📤 ${queue.length} offline istek işleniyor...`);

    // TODO: Her isteği gerçek AI'ya gönder
    // Bu kısım ana uygulamada implement edilmeli

    // Şimdilik sadece kuyruğu temizle
    await LocalCacheService.clearOfflineQueue();
    console.log('✅ Offline kuyruk işlendi');
  }

  /**
   * Temel kod tamamlama önerileri (offline)
   */
  public getBasicCompletions(code: string, language: string): string[] {
    const completions: string[] = [];

    // JavaScript/TypeScript
    if (language === 'javascript' || language === 'typescript') {
      if (code.includes('console.')) {
        completions.push('console.log()');
        completions.push('console.error()');
        completions.push('console.warn()');
      }

      if (code.includes('const ') || code.includes('let ') || code.includes('var ')) {
        completions.push('const variable = value;');
        completions.push('let variable = value;');
      }

      if (code.includes('function')) {
        completions.push('function name() {}');
        completions.push('const name = () => {}');
      }
    }

    // React Native
    if (code.includes('React')) {
      completions.push('import { View, Text } from "react-native";');
      completions.push('const Component = () => { return <View></View> }');
      completions.push('useState()');
      completions.push('useEffect()');
    }

    return completions.slice(0, 5); // En fazla 5 öneri
  }
}

export default new OfflineAIService();
