# 🔧 Ads Archive API İzin Sorunu Çözümü

Token `/me` endpoint'ine çalışıyor ama `/ads_archive` endpoint'ine çalışmıyor. Bu, token'ın Ads Archive API'ye erişim izni olmadığını gösteriyor.

---

## ✅ Çözüm: Token İzinlerini Kontrol Edin

### Adım 1: Meta Developer Console'da Token İzinlerini Kontrol Edin

1. [https://developers.facebook.com](https://developers.facebook.com) → Giriş yapın
2. App'inizi seçin
3. **Tools** → **System Users** seçeneğine gidin
4. Token'ınızı bulun
5. **Permissions** veya **Scopes** bölümüne bakın

**Kontrol edilecekler:**
- ✅ `ads_read` (Ads Read) - **MUTLAKA OLMALI**
- ✅ `ads_management` (Ads Management) - Önerilir

**Eğer `ads_read` yoksa:**
- Token Ads Archive API'ye erişemez
- Yeni token oluşturmanız gerekiyor

---

### Adım 2: Yeni Token Oluşturun (İzinlerle)

1. Meta Developer Console → Tools → System Users
2. **"Generate New Token"** butonuna tıklayın
3. **Permissions** kısmında şu izinleri seçin:
   - ✅ **ads_read** (Ads Read) - **ZORUNLU**
   - ✅ **ads_management** (Ads Management) - Önerilir
4. **"Generate Token"** butonuna tıklayın
5. Token'ı kopyalayın ⚠️

**ÖNEMLİ:** İzinleri seçmeden token oluşturmayın!

---

### Adım 3: Token'ı Supabase Secrets'a Güncelleyin

1. Supabase Dashboard → Settings → Edge Functions → Secrets
2. `META_ADS_TOKEN` secret'ını bulun
3. **"Edit"** veya **"Update"** butonuna tıklayın
4. Eski token'ı silin, yeni token'ı yapıştırın
5. **"Save"** butonuna tıklayın

---

### Adım 4: Function'ı Yeniden Deploy Edin

1. Supabase Dashboard → Edge Functions → meta-ads-proxy
2. **"Deploy"** veya **"Redeploy"** butonuna tıklayın
3. 1-2 dakika bekleyin

---

### Adım 5: Test Edin

1. Debug endpoint'i test edin:
   ```
   https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy/debug
   ```

2. Sitede tarama yapın - Artık çalışmalı!

---

## 🆘 Hala Çalışmıyorsa

### Sorun: Token'da `ads_read` var ama hala çalışmıyor

**Çözüm 1: App Review Kontrolü**

Meta Developer Console'da app review kontrolü yapmak için:

1. [https://developers.facebook.com](https://developers.facebook.com) → Giriş yapın
2. App'inizi seçin
3. Sol menüden şu seçeneklerden birini bulun:
   - **"App Review"** veya
   - **"Review"** veya
   - **"Permissions"** veya
   - **"Settings" → "Basic" → "App Review"** sekmesi

**Eğer bulamazsanız:**
- Meta'nın yeni arayüzünde bu bölüm farklı yerde olabilir
- Genellikle sol menüde **"Tools"** veya **"Settings"** altında bulunur
- Veya üst menüde **"My Apps"** → App'inizi seçin → Sol menüden arayın

**Ads Archive API Kontrolü:**
- App Review sayfasında **"Permissions"** veya **"Features"** bölümüne bakın
- **"Ads Archive API"** veya **"Ads Library API"** arayın
- Eğer görünmüyorsa veya "Not Approved" yazıyorsa, Meta'ya başvurmanız gerekebilir

---

### Sorun: App'in Ads Archive API'ye erişimi yok

**Çözüm 2: Permissions and Features Kontrolü**

Meta Developer Console'da permissions kontrolü yapmak için:

1. [https://developers.facebook.com](https://developers.facebook.com) → Giriş yapın
2. App'inizi seçin
3. Sol menüden şu seçeneklerden birini bulun:
   - **"Settings"** → **"Basic"** → **"Permissions and Features"** sekmesi
   - Veya **"Tools"** → **"Permissions"**
   - Veya **"Products"** → **"Ads Archive API"**

**Eğer bulamazsanız:**

**Yöntem A: Settings üzerinden:**
1. Sol menüden **"Settings"** seçeneğine tıklayın
2. **"Basic"** sekmesine gidin
3. Sayfanın altında veya sağında **"Permissions and Features"** veya **"App Permissions"** bölümünü arayın
4. Burada tüm izinlerin listesi görünür

**Yöntem B: Products üzerinden:**
1. Sol menüden **"Products"** veya **"Add Product"** seçeneğine tıklayın
2. **"Ads Archive API"** veya **"Ads Library API"** arayın
3. Eğer görünmüyorsa, **"Add Product"** butonuna tıklayın ve ekleyin

**Yöntem C: Tools üzerinden:**
1. Sol menüden **"Tools"** seçeneğine tıklayın
2. **"Graph API Explorer"** veya **"API Explorer"** seçeneğine gidin
3. Burada kullanılabilir API'leri görebilirsiniz

---

### Sorun: Ads Archive API görünmüyor

**Çözüm 3: App Tipini Kontrol Edin**

Ads Archive API'ye erişim için app'inizin doğru tipte olması gerekir:

1. Meta Developer Console → App'inizi seçin
2. **"Settings"** → **"Basic"** sekmesine gidin
3. **"App Type"** veya **"Category"** bölümüne bakın
4. App tipi **"Business"** veya **"Marketing"** olmalı

**Eğer farklı bir tip ise:**
- App'i silip yeniden oluşturun
- App tipi olarak **"Business"** seçin
- Veya mevcut app'in tipini değiştirmeyi deneyin (eğer mümkünse)

---

### Sorun: Hiçbir yerde bulamıyorum

**Çözüm 4: Direkt API Test**

Token'ınızı direkt Ads Archive API'ye test edin:

**Terminal'de:**
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
    "type": "OAuthException",
    "code": 1
  }
}
```

Eğer hata alırsanız, token'ın `ads_read` izni olmadığı kesindir.

---

### Sorun: Token'da `ads_read` var ama API çalışmıyor

**Çözüm 5: Meta Business Manager Kontrolü**

Bazen Ads Archive API'ye erişim için Meta Business Manager'da ayar yapmak gerekir:

1. [https://business.facebook.com](https://business.facebook.com) → Giriş yapın
2. Business Manager'ınızı seçin
3. **"Business Settings"** → **"Users"** → **"System Users"** seçeneğine gidin
4. System User'ınızı bulun
5. **"Assign Assets"** veya **"Assign Permissions"** butonuna tıklayın
6. App'inize erişim verin

---

## 📝 Alternatif Kontrol Yöntemleri

### Yöntem 1: Graph API Explorer ile Test

1. Meta Developer Console → **"Tools"** → **"Graph API Explorer"**
2. Token'ınızı seçin
3. Endpoint olarak şunu yazın: `/ads_archive`
4. **"Submit"** butonuna tıklayın
5. Hata alırsanız, token'ın izinleri yetersizdir

### Yöntem 2: App Dashboard'dan Kontrol

1. Meta Developer Console → App'inizi seçin
2. Ana sayfada (Dashboard) **"Permissions"** veya **"Features"** kartını arayın
3. Burada aktif izinleri görebilirsiniz

### Yöntem 3: System Users Sayfasından Kontrol

1. Meta Developer Console → **"Tools"** → **"System Users"**
2. System User'ınızı bulun
3. Token'ın yanında **"View"** veya **"Edit"** butonuna tıklayın
4. **"Permissions"** veya **"Scopes"** bölümüne bakın
5. `ads_read` izninin olduğundan emin olun

---

## 💡 İpucu

**Meta Developer Console'un yeni arayüzünde:**

- Bölümler farklı yerlerde olabilir
- Menü yapısı değişmiş olabilir
- Arama özelliğini kullanın (üst menüde genellikle bir arama kutusu var)
- **"Ads Archive"** veya **"ads_read"** kelimelerini arayın

**En kolay yol:**

1. Meta Developer Console → **"Tools"** → **"System Users"**
2. Token'ınızı bulun
3. Yeni token oluştururken **mutlaka `ads_read` iznini seçin**
4. Bu kesinlikle çalışır!

---

## 📝 Kontrol Listesi

- [ ] Token'ın `ads_read` izni var mı?
- [ ] Token'ın `ads_management` izni var mı? (opsiyonel)
- [ ] Token System User Token mı?
- [ ] App'in Ads Archive API'ye erişimi var mı?
- [ ] Token Supabase Secrets'a güncellendi mi?
- [ ] Function yeniden deploy edildi mi?
- [ ] Debug endpoint test edildi mi?

---

## 💡 İpucu

**Token `/me` endpoint'ine çalışıyor ama `/ads_archive` endpoint'ine çalışmıyorsa:**

Bu, token'ın Ads Archive API'ye erişim izni olmadığını gösterir. Token'ı yeniden oluştururken **mutlaka `ads_read` iznini seçin**.

**Bu kesinlikle çalışır!** 🚀

