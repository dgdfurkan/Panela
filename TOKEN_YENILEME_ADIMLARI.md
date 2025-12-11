# 🔄 Token Yenileme Adımları

Meta API'den "An unknown error has occurred" (OAuthException code 1) hatası alıyorsunuz. Bu, token'ın Meta API için geçersiz olduğu anlamına gelir.

---

## ✅ Adım Adım Çözüm

### 1. Meta Developer Console'a Gidin

1. Tarayıcıda [https://developers.facebook.com](https://developers.facebook.com) açın
2. Giriş yapın
3. App'inizi seçin

### 2. System User Token Oluşturun

1. Sol menüden **Tools** → **System Users** seçeneğine gidin
2. **"Add System User"** butonuna tıklayın
3. Bir isim verin (örn: "Panela Ads Scanner")
4. **"Generate New Token"** butonuna tıklayın

### 3. İzinleri Seçin

**ZORUNLU İZİNLER:**
- ✅ **ads_read** (Ads Read) - **MUTLAKA SEÇİN**
- ✅ **ads_management** (Ads Management) - Önerilir

**ÖNEMLİ:** 
- İzinleri seçmeden token oluşturmayın
- Sadece `ads_read` yeterli ama `ads_management` de ekleyin

### 4. Token'ı Oluşturun

1. İzinleri seçtikten sonra **"Generate Token"** butonuna tıklayın
2. **Token'ı hemen kopyalayın** ⚠️ Bir daha göremeyeceksiniz!
3. Token'ı güvenli bir yere kaydedin

### 5. Supabase Secrets'a Ekleyin

1. Supabase Dashboard → Settings → Edge Functions → Secrets
2. `META_ADS_TOKEN` secret'ını bulun
3. **"Edit"** veya **"Update"** butonuna tıklayın
4. Yeni token'ı yapıştırın
5. **"Save"** butonuna tıklayın

**ÖNEMLİ:**
- Token'da başında/sonunda boşluk olmamalı
- Sadece token'ın kendisini kopyalayın
- Token'ı kontrol edin (234 karakter civarı olmalı)

### 6. Function'ı Yeniden Deploy Edin (Opsiyonel)

Bazen token güncellemesi için function'ı yeniden deploy etmek gerekebilir:

1. Supabase Dashboard → Edge Functions → meta-ads-proxy
2. **"Deploy"** veya **"Redeploy"** butonuna tıklayın
3. Birkaç dakika bekleyin

### 7. Test Edin

1. Debug endpoint'i test edin:
   ```
   https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy/debug
   ```
   
   **Beklenen çıktı:**
   ```json
   {
     "tokenPresent": true,
     "tokenValid": true,
     "tokenError": null,
     "tokenLength": 234,
     "tokenPreview": "EAA9Y5I8p9...MX9nh"
   }
   ```

2. Sitede tarama yapın:
   - Research sayfasına gidin
   - AutoMetaScanner'ı açın
   - Formu doldurun
   - "Taramayı Başlat" butonuna tıklayın

---

## 🆘 Hala Sorun Varsa

### Sorun: Token oluştururken izinler görünmüyor

**Çözüm:**
1. App'inizin **Business** tipinde olduğundan emin olun
2. App'inizin **Ads API** erişimi olduğundan emin olun
3. Meta Business Manager'da app'inize izin verin

### Sorun: Token oluşturuldu ama hala çalışmıyor

**Çözüm:**
1. Token'ın System User Token olduğundan emin olun
2. Token'ın `ads_read` iznine sahip olduğundan emin olun
3. Token'ı Supabase Secrets'a doğru şekilde eklediğinizden emin olun
4. Function'ı yeniden deploy edin

### Sorun: "Permission denied" hatası

**Çözüm:**
1. Token'ın `ads_read` iznine sahip olduğundan emin olun
2. Yeni token oluştururken izinleri seçin
3. Token'ı Supabase Secrets'a güncelleyin

---

## 📝 Checklist

- [ ] Meta Developer Console'a giriş yapıldı
- [ ] System User Token oluşturuldu
- [ ] Token'ın `ads_read` izni var
- [ ] Token'ın `ads_management` izni var (opsiyonel)
- [ ] Token kopyalandı ve kaydedildi
- [ ] Token Supabase Secrets'a eklendi (`META_ADS_TOKEN`)
- [ ] Token'da boşluk veya özel karakter yok
- [ ] Debug endpoint çalışıyor
- [ ] Function yeniden deploy edildi (opsiyonel)
- [ ] Sitede test edildi

---

## 💡 İpucu

**Token'ı doğru şekilde kopyalama:**
- Token'ı kopyalarken başında/sonunda boşluk olmamalı
- Sadece token'ın kendisini kopyalayın
- Token genellikle 200-250 karakter uzunluğundadır

**Token tipini kontrol etme:**
- System User Token → ✅ Doğru
- User Access Token → ❌ Yanlış
- App Access Token → ❌ Yanlış
- Page Access Token → ❌ Yanlış

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
9. Function'ı yeniden deploy edin (opsiyonel)
10. Test edin

---

## 🔍 Token Kontrolü

Token'ınızın doğru olduğunu kontrol etmek için:

1. Debug endpoint'i test edin
2. Supabase Logs'u kontrol edin
3. Meta Developer Console'da token'ı kontrol edin

Eğer hala sorun varsa, Meta Developer Console'da token'ın durumunu ve izinlerini kontrol edin.

