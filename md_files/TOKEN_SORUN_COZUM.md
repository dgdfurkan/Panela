# 🔧 Token "Invalid or expired" Hatası Çözümü

Debug endpoint çalışıyor ama Meta API çağrısında token geçersiz hatası alıyorsunuz. Bu genellikle token'ın izinleri veya tipiyle ilgilidir.

---

## 🔍 Sorun Tespiti

### 1. Supabase Dashboard'da Log'ları Kontrol Edin

1. Supabase Dashboard → Edge Functions → meta-ads-proxy → **Logs** sekmesine gidin
2. Son çağrıları kontrol edin
3. Meta API'den gelen tam hata mesajını görün

**Aranacak bilgiler:**
- `errorCode`: Meta'nın hata kodu
- `errorType`: Hata tipi
- `errorMessage`: Meta'nın tam hata mesajı
- `errorSubcode`: Alt hata kodu

---

## ✅ Çözüm Adımları

### Adım 1: Token Tipini Kontrol Edin

Meta Developer Console'da token'ınızın **System User Token** olduğundan emin olun:

1. Meta Developer Console → Tools → System Users
2. Token'ınızı bulun
3. Token tipini kontrol edin

**❌ Yanlış Token Tipleri:**
- User Access Token (kullanıcı girişi gerektirir)
- App Access Token (sadece app bilgileri için)
- Page Access Token (sadece sayfa için)

**✅ Doğru Token Tipi:**
- System User Token (uzun ömürlü, API için)

---

### Adım 2: Token İzinlerini Kontrol Edin

Token'ınızın **ads_read** iznine sahip olduğundan emin olun:

1. Meta Developer Console → Tools → System Users
2. Token'ınızı bulun
3. **Permissions** veya **Scopes** bölümüne bakın

**Gerekli İzinler:**
- ✅ `ads_read` (Ads Read) - **ZORUNLU**
- ✅ `ads_management` (Ads Management) - Önerilir

**Eğer izinler yoksa:**
1. Yeni bir System User Token oluşturun
2. İzinleri seçerken `ads_read` ve `ads_management` seçin
3. Token'ı oluşturun
4. Supabase Secrets'a güncelleyin

---

### Adım 3: Token'ı Yenileyin

Eğer token'ın izinleri doğruysa ama hala çalışmıyorsa:

1. Meta Developer Console → Tools → System Users
2. Mevcut token'ı silin veya yeni token oluşturun
3. **Yeni token'ı kopyalayın** (bir daha göremezsiniz!)
4. Supabase Dashboard → Settings → Edge Functions → Secrets
5. `META_ADS_TOKEN` secret'ını güncelleyin
6. Yeni token'ı yapıştırın
7. Save

---

### Adım 4: Token Formatını Kontrol Edin

Token'da boşluk veya özel karakter olmamalı:

1. Supabase Dashboard → Settings → Edge Functions → Secrets
2. `META_ADS_TOKEN` secret'ını açın
3. Token'ı kopyalayın
4. Boşluk veya satır sonu olmadığından emin olun
5. Sadece token'ın kendisini kopyalayın (başında/sonunda boşluk yok)

---

## 🧪 Test Etme

### 1. Debug Endpoint'i Tekrar Test Edin

```
https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy/debug
```

**Kontrol edilecekler:**
- `tokenPresent: true` olmalı
- `tokenValid: true` olmalı
- `tokenLength` 200+ olmalı

### 2. Supabase Logs'unu Kontrol Edin

Supabase Dashboard → Edge Functions → meta-ads-proxy → Logs:

**Aranacak bilgiler:**
- Meta API'den gelen tam hata mesajı
- Error code ve type
- Debug bilgileri

### 3. Meta API'yi Direkt Test Edin (Opsiyonel)

Terminal'de (token'ınızı kullanarak):

```bash
curl "https://graph.facebook.com/v19.0/ads_archive?search_type=KEYWORD_UNORDERED&ad_type=ALL&ad_active_status=all&limit=1&access_token=YOUR_TOKEN_HERE"
```

**Başarılı çıktı:**
```json
{
  "data": [...]
}
```

**Hata çıktısı:**
```json
{
  "error": {
    "message": "...",
    "type": "...",
    "code": 1
  }
}
```

---

## 🆘 Yaygın Sorunlar

### Sorun: "Invalid or expired access token" (Code 1)

**Çözüm:**
1. Token'ın System User Token olduğundan emin olun
2. Token'ın `ads_read` iznine sahip olduğundan emin olun
3. Token'ı yenileyin

### Sorun: "Permission denied" (Code 10)

**Çözüm:**
1. Token'ın `ads_read` iznine sahip olduğundan emin olun
2. Yeni token oluştururken izinleri seçin
3. Token'ı Supabase Secrets'a güncelleyin

### Sorun: "Access token has expired" (Code 190)

**Çözüm:**
1. Token'ın süresi dolmuş
2. Yeni bir System User Token oluşturun
3. Token'ı Supabase Secrets'a güncelleyin

---

## 📝 Checklist

- [ ] Token System User Token mı?
- [ ] Token'ın `ads_read` izni var mı?
- [ ] Token'ın `ads_management` izni var mı? (opsiyonel)
- [ ] Token'da boşluk veya özel karakter yok mu?
- [ ] Token Supabase Secrets'a doğru şekilde eklenmiş mi?
- [ ] Debug endpoint çalışıyor mu?
- [ ] Supabase Logs'da Meta'nın tam hata mesajı görünüyor mu?

---

## 💡 İpucu

Eğer hala sorun varsa:

1. **Supabase Logs'u kontrol edin** - Meta'nın tam hata mesajını göreceksiniz
2. **Yeni token oluşturun** - Bazen token'lar beklenmedik şekilde geçersiz olabilir
3. **Meta Developer Console'da token'ı kontrol edin** - İzinleri ve durumu görün

---

## 🎯 Hızlı Çözüm

**En hızlı yol:**

1. Meta Developer Console → Tools → System Users
2. Yeni System User Token oluşturun
3. İzinler: `ads_read` + `ads_management`
4. Token'ı kopyalayın
5. Supabase Dashboard → Settings → Edge Functions → Secrets
6. `META_ADS_TOKEN` secret'ını güncelleyin
7. Yeni token'ı yapıştırın
8. Save
9. Test edin

