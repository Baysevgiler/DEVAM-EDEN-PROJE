# 🔑 GitHub Token Kurulum Kılavuzu

## 📋 Neden GitHub Token Gerekli?

Canlı güncelleme sistemi GitHub API kullanır. İki farklı rate limit vardır:

| Durum | Rate Limit | Açıklama |
|-------|------------|----------|
| **Token YOK** | 60 istek/saat | ⚠️ Çok düşük, 30 saniyede 1 kontrol için yetersiz |
| **Token VAR** | 5000 istek/saat | ✅ Yeterli, sorunsuz çalışır |

**30 saniyede 1 kontrol** = **120 istek/saat**

**Sonuç**: Token olmadan rate limit aşılır ve güncelleme sistemi çalışmaz!

---

## 🚀 GitHub Token Oluşturma (Adım Adım)

### Adım 1: GitHub'a Giriş Yapın

https://github.com adresine gidin ve giriş yapın.

### Adım 2: Settings > Developer Settings

1. Sağ üstteki profil fotoğrafınıza tıklayın
2. **Settings** seçin
3. Sol menüde en altta **Developer settings** tıklayın

![GitHub Settings](https://docs.github.com/assets/cb-45016/mw-1440/images/help/settings/settings-sidebar-developer-settings.webp)

### Adım 3: Personal Access Tokens

1. Sol menüde **Personal access tokens** seçin
2. **Tokens (classic)** seçin (veya Fine-grained tokens)
3. **Generate new token** butonuna tıklayın
4. **Generate new token (classic)** seçin

### Adım 4: Token Ayarları

#### Token Adı (Note)
```
AI Mobile Code - Live Updates
```

#### Expiration (Geçerlilik Süresi)
- **30 days**: Test için
- **90 days**: Üretim için
- **No expiration**: Kalıcı kullanım (önerilir)

#### Scopes (İzinler)

**Public Repository için** (DEVAM-EDEN-PROJE):
- ✅ **public_repo** - Public repository'lere erişim

**Private Repository için**:
- ✅ **repo** - Tüm repository erişimi

**Diğer izinler**: Gerekli değil, işaretlemeyin.

![Token Scopes](https://docs.github.com/assets/cb-43299/mw-1440/images/help/settings/token-scopes.webp)

### Adım 5: Token Oluştur

1. Sayfanın en altına inin
2. **Generate token** butonuna tıklayın
3. Token görünecek: `ghp_xxxxxxxxxxxxxxxxxxxx`

⚠️ **ÖNEMLİ**: Token sadece BİR KEZ gösterilir! Kopyalayın ve güvenli bir yere kaydedin.

---

## 📱 Uygulamada Token Kullanımı

### Yöntem 1: Uygulama İçinden (Önerilen)

1. Uygulamayı açın
2. **Settings** (Ayarlar) tabına gidin
3. **Live Updates** bölümüne inin
4. **GitHub Token** kısmında:
   - Token'ı yapıştırın
   - **Save Token** butonuna basın
5. ✅ Rate limit durumu güncellenecek

```
🔑 Authenticated
Rate Limit: 4999/5000
Resets: 3:45 PM
```

### Yöntem 2: Environment Variable (Geliştiriciler için)

`.env` dosyası oluşturun:

```bash
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO=Baysevgiler/DEVAM-EDEN-PROJE
GITHUB_BRANCH=main
```

---

## ✅ Token Doğrulama

Token'ın çalıştığını kontrol etmek için:

### Terminal'den Test:

```bash
curl -H "Authorization: token ghp_your_token_here" \
     https://api.github.com/rate_limit
```

**Başarılı Yanıt**:
```json
{
  "resources": {
    "core": {
      "limit": 5000,
      "remaining": 4999,
      "reset": 1640995200
    }
  }
}
```

### Uygulama İçinden Test:

1. Settings > Live Updates
2. GitHub Token bölümüne bakın
3. **Rate Limit** bilgisini kontrol edin

**Token varsa**:
```
🔑 Authenticated
Rate Limit: 4999/5000
```

**Token yoksa**:
```
⚠️  Not Authenticated
Rate Limit: 59/60
```

---

## 🔒 Güvenlik

### Token'ı Güvenli Tutun

✅ **YAPILMASI GEREKENLER**:
- Token'ı sadece güvenilir cihazlarda kullanın
- Token'ı kimseyle paylaşmayın
- Token'ı git'e commit ETMEYİN

❌ **YAPILMAMASI GEREKENLER**:
- Token'ı public kod deposuna eklemeyin
- Token'ı screenshot'a almayın
- Token'ı mesaj ile göndermeyin

### .gitignore Kontrolü

`.gitignore` dosyasında olmalı:

```gitignore
# Environment variables
.env
.env.local

# Never commit tokens!
*.token
```

### Token Sızdıysa

1. Hemen GitHub'dan token'ı **silin**:
   - Settings > Developer settings
   - Personal access tokens
   - Token'ı bulun ve **Delete**

2. Yeni token oluşturun
3. Uygulamayı yeni token ile güncelleyin

---

## 🔄 Token Yenileme

Token'ın süresi dolduğunda:

1. GitHub'da yeni token oluşturun
2. Settings > Live Updates
3. Yeni token'ı kaydedin
4. **Save Token** basın

---

## ❓ Sık Sorulan Sorular

### Q: Token olmadan çalışır mı?

**A**: Evet ama çok sınırlı (60 istek/saat). 30 saniyede 1 kontrol yapılırsa limit aşılır.

### Q: Token'ım sızdı, ne yapmalıyım?

**A**: Hemen GitHub'dan token'ı silin ve yeni oluşturun.

### Q: Token'ı nasıl değiştiririm?

**A**: Settings > Live Updates > GitHub Token kısmından yeni token kaydedin.

### Q: Token zorunlu mu?

**A**: Production kullanımda **evet**. Test için opsiyonel.

### Q: Fine-grained token kullanabilir miyim?

**A**: Evet, sadece repository erişimi verin.

### Q: Token'ın süresi doldu, ne yapmalıyım?

**A**: Yeni token oluşturun ve güncelleyin.

---

## 🧪 Test Senaryoları

### Senaryo 1: Token Olmadan

```
1. Token kaydetmeyin
2. Settings > Live Updates açın
3. Göreceksiniz:
   ⚠️  Not Authenticated
   Rate Limit: 59/60

4. Manuel güncelleme kontrolü yapın
5. 60 kez kontrol sonrası:
   ❌ API rate limit exceeded
```

### Senaryo 2: Token ile

```
1. Token kaydedin
2. Settings > Live Updates açın
3. Göreceksiniz:
   🔑 Authenticated
   Rate Limit: 4999/5000

4. İstediğiniz kadar kontrol yapın
5. Sorunsuz çalışır ✅
```

---

## 📊 Rate Limit Karşılaştırması

| Özellik | Token YOK | Token VAR |
|---------|-----------|-----------|
| Limit | 60/saat | 5000/saat |
| 30s kontrol | ❌ Yetersiz | ✅ Yeterli |
| Güvenlik | ⚠️ Düşük | ✅ Yüksek |
| Tracking | ❌ Yok | ✅ Var |
| Production | ❌ Kullanılmaz | ✅ Kullanılır |

---

## 🎯 Özet

1. **GitHub'a giriş yapın**
2. **Settings > Developer settings > Personal access tokens**
3. **Generate new token (classic)**
4. **Token adı**: AI Mobile Code - Live Updates
5. **Scope**: public_repo (veya repo)
6. **Generate token**
7. **Token'ı kopyalayın** (bir daha gösterilmez!)
8. **Uygulamada kaydedin**: Settings > Live Updates > GitHub Token

**Başarılı! Artık unlimited güncelleme kontrolü yapabilirsiniz! 🎉**

---

## 🔗 Faydalı Linkler

- [GitHub Personal Access Tokens Docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub API Rate Limits](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [Token Security Best Practices](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation)

---

**Tarih**: 15 Nisan 2026
**Versiyon**: 2.0.0
**Yazar**: AI Mobile Code Team
