# 🔍 Token Test Adımları

Token var ve gönderiliyor ama Meta API'den hata alıyorsunuz. Şimdi token'ın Meta API için geçerli olup olmadığını test edelim.

---

## ✅ Adım 1: Debug Endpoint'i Test Edin

Tarayıcıda şu URL'yi açın:

```
https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy/debug
```

**Beklenen çıktı:**
```json
{
  "tokenPresent": true,
  "tokenValid": true,
  "tokenLength": 243,
  "tokenPreview": "EAA9Y5I8p9...8qfgH",
  "metaApiTest": {
    "status": 200,
    "success": true,
    "error": null,
    "data": { ... }
  }
}
```

**Eğer `metaApiTest.error` varsa:**
- Token Meta API için geçersiz
- Token'ın izinleri yetersiz
- Token System User Token değil

---

## ✅ Adım 2: Token'ı Direkt Meta API'ye Test Edin

Terminal'de (token'ınızı kullanarak):

```bash
curl "https://graph.facebook.com/v19.0/me?access_token=YOUR_TOKEN_HERE"
```

**Başarılı çıktı:**
```json
{
  "name": "...",
  "id": "..."
}
```

**Hata çıktısı:**
```json
{
  "error": {
    "message": "...",
    "type": "OAuthException",
    "code": 1
  }
}
```

---

## 🎯 Sorun Tespiti

### Senaryo 1: Debug endpoint'te `metaApiTest.error` var

**Sorun:** Token Meta API için geçersiz

**Çözüm:**
1. Meta Developer Console → Tools → System Users
2. Yeni System User Token oluşturun
3. İzinler: `ads_read` + `ads_management`
4. Token'ı Supabase Secrets'a güncelleyin
5. Function'ı yeniden deploy edin

### Senaryo 2: Debug endpoint çalışıyor ama gerçek API çağrısında hata var

**Sorun:** Token'ın `ads_read` izni yok veya Ads Archive API'ye erişim yok

**Çözüm:**
1. Meta Developer Console → Tools → System Users
2. Token'ınızı bulun
3. İzinleri kontrol edin
4. `ads_read` izni yoksa yeni token oluşturun
5. Token'ı Supabase Secrets'a güncelleyin

### Senaryo 3: Token direkt Meta API'ye test edildiğinde hata var

**Sorun:** Token geçersiz veya süresi dolmuş

**Çözüm:**
1. Yeni System User Token oluşturun
2. Token'ı Supabase Secrets'a güncelleyin
3. Function'ı yeniden deploy edin

---

## 📝 Kontrol Listesi

- [ ] Debug endpoint test edildi (`/debug`)
- [ ] `metaApiTest` sonucu kontrol edildi
- [ ] Token direkt Meta API'ye test edildi (`/me` endpoint)
- [ ] Token'ın `ads_read` izni var mı?
- [ ] Token System User Token mı?
- [ ] Token Supabase Secrets'a eklendi mi?
- [ ] Function yeniden deploy edildi mi?

---

## 💡 İpucu

**En hızlı çözüm:**

1. Debug endpoint'i test edin → `metaApiTest.error` varsa token geçersiz
2. Yeni System User Token oluşturun → İzinler: `ads_read` + `ads_management`
3. Token'ı Supabase Secrets'a güncelleyin
4. Function'ı yeniden deploy edin
5. Test edin

**Bu kesinlikle çalışır!** 🚀

