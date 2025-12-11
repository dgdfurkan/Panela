# 🔧 "Missing authorization header" Hatası Çözümü

"Missing authorization header" hatası alıyorsunuz. Bu, Supabase Edge Function'ın authorization header beklediği anlamına gelir.

---

## ✅ Çözüm: Function'ı Public Yapmak

Supabase Edge Function'ları varsayılan olarak authorization header gerektirir. Function'ı **public** yaparak bu kontrolü kaldırabilirsiniz.

### Adım 1: Supabase Dashboard'a Gidin

1. [https://supabase.com](https://supabase.com) → Projenizi seçin
2. Sol menüden **Edge Functions** → **meta-ads-proxy** seçeneğine tıklayın

### Adım 2: Function Ayarlarını Kontrol Edin

1. Function sayfasında **Settings** veya **Configuration** sekmesine gidin
2. **"Verify JWT"** veya **"Require Authorization"** seçeneğini **KAPATIN** (disable)
3. **"Save"** butonuna tıklayın

**Not:** Eğer bu ayar görünmüyorsa, function zaten public olabilir veya farklı bir yerde ayarlanmış olabilir.

---

## ✅ Alternatif Çözüm: Client Tarafında Authorization Header Göndermek

Eğer function'ı public yapmak istemiyorsanız, client tarafında authorization header'ını her zaman gönderebilirsiniz.

### Adım 1: Supabase Anon Key'i Kontrol Edin

`.env` dosyanızda veya GitHub Secrets'da şunların olduğundan emin olun:

```
VITE_SUPABASE_URL=https://kynwwhugwnzekrozxytj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Adım 2: Supabase Anon Key'i Bulun

1. Supabase Dashboard → **Settings** → **API**
2. **Project API keys** bölümünde **anon/public** key'i kopyalayın
3. GitHub Secrets'a ekleyin: `VITE_SUPABASE_ANON_KEY`

---

## 🧪 Test Etme

### 1. Function'ı Public Yaptıktan Sonra

Debug endpoint'i test edin:

```
https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy/debug
```

**Başarılı çıktı:**
```json
{
  "tokenPresent": true,
  "tokenValid": true,
  "tokenError": null,
  "tokenLength": 200,
  "tokenPreview": "EAABsbCS1...xyz12"
}
```

### 2. Client Tarafında Test

Sitede AutoMetaScanner'ı test edin. Artık "Missing authorization header" hatası görünmemeli.

---

## 🆘 Hala Sorun Varsa

### Sorun: Function ayarlarında "Verify JWT" seçeneği yok

**Çözüm:**
- Function'ı yeniden oluşturun ve public olarak oluşturun
- Veya Supabase CLI kullanarak function'ı deploy edin (ama CLI kurulumu sorunlu)

### Sorun: Authorization header gönderiyorum ama hala hata alıyorum

**Çözüm:**
1. Browser console'da (F12) Network sekmesine bakın
2. Request headers'ı kontrol edin
3. `Authorization` ve `apikey` header'larının gönderildiğinden emin olun

### Sorun: VITE_SUPABASE_ANON_KEY eksik

**Çözüm:**
1. Supabase Dashboard → Settings → API
2. anon/public key'i kopyalayın
3. GitHub Secrets'a `VITE_SUPABASE_ANON_KEY` olarak ekleyin
4. Veya `.env` dosyasına ekleyin (local test için)

---

## 📝 Özet

**En Kolay Çözüm:**
1. Supabase Dashboard → Edge Functions → meta-ads-proxy
2. Settings → "Verify JWT" veya "Require Authorization" seçeneğini KAPATIN
3. Save
4. Test edin

**Alternatif:**
1. GitHub Secrets'a `VITE_SUPABASE_ANON_KEY` ekleyin
2. Supabase Dashboard → Settings → API → anon/public key'i kopyalayın
3. Client kodunda zaten authorization header gönderiliyor, sadece key eksik

---

## 💡 İpucu

Function'ı public yapmak **daha kolay** ve **daha hızlı** bir çözümdür. Zaten Meta API token'ı kullanıyorsunuz, bu yüzden Supabase anon key'i gereksiz bir katman ekliyor.

