# 🔑 Graph API Explorer Token Kullanımı

Graph API Explorer'dan token oluşturdunuz ve gerekli izinleri verdiniz. Bu token'ı kullanabiliriz!

---

## ⚠️ Önemli Notlar

### Graph API Explorer Token Özellikleri:
- ✅ Gerekli izinleri içeriyor (`ads_read` vb.)
- ✅ Hemen kullanılabilir
- ⚠️ **Kısa ömürlü** (genellikle birkaç saat)
- ⚠️ **Test amaçlı** token

### Uzun Vadeli Çözüm:
- **System User Token** kullanmak daha iyi (uzun ömürlü)
- Ama şimdilik Graph API Explorer token'ı ile test edebiliriz!

---

## ✅ Adım Adım Kurulum

### Adım 1: Token'ı Kopyalayın

1. Graph API Explorer'da token'ınızı kopyalayın
2. Token'ın başında `EAA...` ile başladığından emin olun

### Adım 2: Supabase Secrets'a Ekleyin

1. **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**
2. `META_ADS_TOKEN` secret'ını bulun (veya oluşturun)
3. Yeni token'ı yapıştırın
4. **Save** butonuna tıklayın

### Adım 3: Function'ı Yeniden Deploy Edin

**Seçenek A: Supabase Dashboard'dan (Önerilen)**

1. **Supabase Dashboard** → **Edge Functions** → **meta-ads-proxy**
2. Function kodunu kopyalayın (`supabase/functions/meta-ads-proxy/index.ts`)
3. **Deploy** butonuna tıklayın

**Seçenek B: CLI ile (Eğer CLI kuruluysa)**

```bash
cd /Users/furkangunduz/Antigravity/Panela
supabase functions deploy meta-ads-proxy
```

### Adım 4: Test Edin

1. Debug endpoint'i test edin:
   ```
   https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy/debug
   ```

2. Beklenen çıktı:
   ```json
   {
     "tokenPresent": true,
     "tokenValid": true,
     "tokenLength": 200+,
     "tokenPreview": "EAA...",
     "metaApiTest": {
       "status": 200,
       "success": true
     }
   }
   ```

3. Tarayıcıyı test edin:
   - Research sayfasına gidin
   - "Otomatik Meta Tarayıcı" bölümünde bir tarama yapın
   - Hata olmadan çalışmalı!

---

## 🧪 Token'ı Test Etme

### Debug Endpoint ile:

```bash
curl https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy/debug
```

### Direkt Meta API ile:

```bash
curl "https://graph.facebook.com/v19.0/ads_archive?search_type=KEYWORD_UNORDERED&ad_type=ALL&ad_active_status=all&limit=1&access_token=YOUR_TOKEN"
```

**Başarılı çıktı:**
```json
{
  "data": [...]
}
```

---

## ⚠️ Token Süresi Dolduğunda

Graph API Explorer token'ları genellikle birkaç saat sonra süresi dolar.

**Belirtiler:**
- `OAuthException code 1` hatası
- `Invalid or expired access token` hatası

**Çözüm:**
1. Graph API Explorer'dan yeni token oluşturun
2. Supabase Secrets'a güncelleyin
3. Function'ı yeniden deploy edin

---

## 🎯 Uzun Vadeli Çözüm (Önerilen)

Graph API Explorer token'ı geçici bir çözümdür. Uzun vadede:

1. **Meta Developer Console** → **Tools** → **System Users**
2. System User oluşturun (veya mevcut olanı kullanın)
3. **"Generate New Token"** → **Permissions** → **`ads_read` seç**
4. Token'ı oluşturun (bu token uzun ömürlü olacak)
5. Supabase Secrets'a ekleyin

**System User Token avantajları:**
- ✅ Uzun ömürlü (aylar/yıllar)
- ✅ Daha güvenli
- ✅ Production için uygun

---

## 📝 Özet

1. ✅ Graph API Explorer'dan token oluşturdunuz
2. ✅ Gerekli izinleri verdiniz
3. 🔄 **Şimdi:** Token'ı Supabase Secrets'a ekleyin
4. 🔄 **Sonra:** Function'ı yeniden deploy edin
5. 🧪 **Test:** Debug endpoint ve tarayıcıyı test edin

**Hazırsanız başlayalım!** 🚀

