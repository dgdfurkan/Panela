# 🔍 Unverified App Sorunu ve Çözümü

App'iniz "Unverified" durumunda. Bu, Ads Archive API'ye erişimi etkileyebilir.

---

## ❓ Unverified App Ne Demek?

Meta Developer Console'da app'ler iki durumda olabilir:
- **Unverified** → Henüz Meta tarafından onaylanmamış
- **Verified** → Meta tarafından onaylanmış

---

## 🎯 Unverified App ile Ads Archive API

### İyi Haber:
- **Ads Archive API genellikle Unverified app'ler için de çalışır**
- Sadece `ads_read` izni gerektirir
- App verification gerektirmez (çoğu durumda)

### Kötü Haber:
- Bazı durumlarda Meta, Unverified app'lerin Ads Archive API'ye erişimini kısıtlayabilir
- Özellikle yeni app'ler için bu durum görülebilir

---

## ✅ Çözüm Adımları

### Adım 1: Token İzinlerini Kontrol Edin (Önce Bu!)

**En muhtemel sorun:** Token'da `ads_read` izni yok

1. Meta Developer Console → **Tools** → **System Users**
2. Token'ınızı bulun
3. **"Generate New Token"** butonuna tıklayın
4. **Permissions** kısmında **mutlaka `ads_read` seçin**
5. Token'ı oluşturun
6. Supabase Secrets'a güncelleyin
7. Function'ı yeniden deploy edin

**Bu çoğu durumda sorunu çözer!**

---

### Adım 2: App Verification (Eğer Adım 1 Çalışmazsa)

Eğer token'da `ads_read` var ama hala çalışmıyorsa:

#### App Verification İçin:

1. Meta Developer Console → App'inizi seçin
2. Sol menüden **"App Review"** veya **"Review"** seçeneğine gidin
3. **"Request Permissions"** veya **"Add Permissions"** butonuna tıklayın
4. **"ads_read"** iznini ekleyin
5. Meta'ya başvurun (gerekirse)

**Not:** App verification genellikle günler/saatler sürebilir.

---

### Adım 3: Alternatif Çözüm - Test Mode

Meta Developer Console'da app'iniz **Test Mode**'da olabilir:

1. Meta Developer Console → App'inizi seçin
2. Üst menüde **"Test Mode"** veya **"Development Mode"** yazısı var mı kontrol edin
3. Eğer varsa, app'i **Live Mode**'a geçirin:
   - **"App Review"** → **"Make App Public"** veya benzeri bir buton

---

## 🧪 Test Etme

### 1. Token'ı Test Edin

Debug endpoint'i test edin:
```
https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy/debug
```

`metaApiTest` bölümünde Ads Archive API testi de olmalı (eklediğimiz kod ile).

### 2. Direkt Meta API'ye Test Edin

Terminal'de:
```bash
curl "https://graph.facebook.com/v19.0/ads_archive?search_type=KEYWORD_UNORDERED&ad_type=ALL&ad_active_status=all&limit=1&access_token=YOUR_TOKEN"
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
    "type": "OAuthException",
    "code": 1
  }
}
```

---

## 📝 Öncelik Sırası

1. **ÖNCE:** Token'da `ads_read` izni var mı kontrol et → Yeni token oluştur
2. **SONRA:** App verification gerekli mi kontrol et → Gerekirse başvur
3. **SON:** Test Mode'da mı kontrol et → Live Mode'a geç

---

## 💡 İpucu

**Çoğu durumda sorun token'da `ads_read` izninin olmamasıdır.**

App Unverified olsa bile, token'da `ads_read` izni varsa Ads Archive API çalışır.

**Önce token'ı düzeltin, sonra app verification'a bakın!**

---

## 🎯 Hızlı Çözüm

1. **Meta Developer Console** → **Tools** → **System Users**
2. **"Generate New Token"** → **Permissions** → **`ads_read` seç**
3. Token'ı oluştur → Supabase Secrets'a ekle
4. Function'ı deploy et
5. Test et

**Bu %90 ihtimalle sorunu çözer!** 🚀

