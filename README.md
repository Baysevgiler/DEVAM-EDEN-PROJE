# 🚀 AI Mobile Code - Yapay Zeka Destekli Mobil Kod Editörü

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React Native](https://img.shields.io/badge/React_Native-0.73.4-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6.svg)
![Tests](https://img.shields.io/badge/tests-77%2F77_passing-success.svg)

**Android üzerinde AI destekli kod yazma, çalıştırma ve yönetme deneyimi**

---

## ✨ Özellikler

### 🤖 AI Desteği
- ✅ **Sınırsız AI Kullanımı** - Otomatik anahtar rotasyonu
- ✅ **Claude & OpenAI** - Çift AI provider
- ✅ **Code Completion** - Gerçek zamanlı öneriler
- ✅ **Hata Tespiti** - Otomatik lint ve kontrol

### 💻 Kod Editörü
- ✅ **15+ Dil Desteği** - JS, Python, Java, TS ve daha fazlası
- ✅ **Kod Çalıştırma** - JavaScript/TypeScript direkt çalışır
- ✅ **Gerçek Zamanlı Linting** - Syntax ve best practice
- ✅ **Hızlı Düzeltmeler** - Her hata için çözüm önerisi

### 📂 Dosya Yönetimi
- ✅ **Tam Dosya Sistemi** - Oluştur, sil, düzenle
- ✅ **Kod Kaydetme** - Etiketler ve açıklamalarla
- ✅ **Arama** - Tüm kodlarınızı bulun
- ✅ **Favoriler** - Sık kullanılanları işaretleyin

### 🛠️ Geliştirici Araçları  
- ✅ **Terminal** - npm, git, node komutları
- ✅ **Paket Yöneticisi** - npm, pip, gem, composer
- ✅ **Dark/Light Mode** - Göz yormayan temalar
- ✅ **Türkçe & İngilizce** - Çift dil desteği

---

## 📦 Hızlı Başlangıç

### APK Oluşturma (Otomatik)

**Linux/macOS:**
```bash
chmod +x build-apk.sh
./build-apk.sh
```

**Windows:**
```cmd
build-apk.bat
```

### Gereksinimler

- Node.js v18+
- Java JDK 17+
- Android SDK
- React Native CLI

### Manuel Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Testleri çalıştır
npm test

# Development modda çalıştır
npx react-native run-android
```

---

## 📚 Dokümantasyon

| Dosya | Açıklama |
|-------|----------|
| [GELİŞME_RAPORU.md](GELİŞME_RAPORU.md) | 🇹🇷 Türkçe özellik özeti |
| [ENHANCED_FEATURES_SUMMARY.md](ENHANCED_FEATURES_SUMMARY.md) | 🇬🇧 İngilizce teknik detaylar |
| [APK_OLUŞTURMA_KILAVUZU.md](APK_OLUŞTURMA_KILAVUZU.md) | 📱 APK derleme kılavuzu |
| [PROJECT_INFO.md](PROJECT_INFO.md) | 📄 Proje mimarisi |

---

## 🧪 Testler

```bash
npm test                    # Tüm testler
npm test -- --coverage     # Coverage raporu
```

**Sonuçlar:** ✅ 77/77 test geçti (%100)

---

## 🎯 Kullanım

1. **API Anahtarı Ekle** → Ayarlar > API Yapılandırma
2. **Kod Üret** → Editör > Prompt gir > Oluştur
3. **Çalıştır** → [▶ Çalıştır] butonu
4. **Kaydet** → [💾 Kaydet] butonu

---

## 🗂️ Proje Yapısı

```
ai-mobile-code-apk/
├── src/
│   ├── services/ai/           # AI servisleri
│   ├── screens/               # Ekranlar (6 tab)
│   ├── navigation/            # Navigasyon
│   └── locales/               # Türkçe/İngilizce
├── __tests__/                 # 77 test
├── android/                   # Native kod
├── build-apk.sh              # Build script
└── build-apk.bat             # Windows build
```

---

## 🚀 Gelecek Özellikler

- [ ] Syntax Highlighting
- [ ] Git Entegrasyonu
- [ ] Remote Execution (Python, Java)
- [ ] Cloud Sync
- [ ] Collaboration

---

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE)

---

## 🙏 Teşekkürler

- [React Native](https://reactnative.dev/)
- [Anthropic Claude](https://www.anthropic.com/)
- [OpenAI](https://openai.com/)

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ by AI Mobile Code Team

</div>
