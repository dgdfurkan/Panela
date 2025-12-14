# ⚡ Hızlı Başlangıç - Meta Ads Proxy

Edge Function'ınız zaten deploy edilmiş! Şimdi sadece birkaç adım kaldı:

**Proxy URL'iniz:**
```
https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy
```

---

## ✅ Yapılacaklar (3 Adım)

### 1. Function Kodunu Güncelleme

Function'ınızın kodunu yeni versiyonla güncellemeniz gerekiyor (token validation ve error handling için).

**Adımlar:**

1. Supabase Dashboard'a gidin: [https://supabase.com](https://supabase.com)
2. Projenizi seçin
3. Sol menüden **Edge Functions** → **meta-ads-proxy** seçeneğine tıklayın
4. Kod editöründe mevcut kodu silin
5. `supabase/functions/meta-ads-proxy/index.ts` dosyasındaki kodu kopyalayıp yapıştırın
6. **"Deploy"** veya **"Save"** butonuna tıklayın

✅ Function güncellendi!

---

### 2. Token'ı Secrets'a Ekleme

Meta Ads token'ınızı Supabase Secrets'a eklemeniz gerekiyor.

**Adımlar:**

1. Supabase Dashboard'da projenize gidin
2. Sol menüden **Settings** → **Edge Functions** → **Secrets** seçeneğine gidin
3. **"Add Secret"** butonuna tıklayın
4. **Name:** `META_ADS_TOKEN` (tam olarak bu şekilde, büyük/küçük harf önemli!)
5. **Value:** Meta Developer Console'dan aldığınız System User Token'ı yapıştırın
6. **"Save"** butonuna tıklayın

✅ Token eklendi!

**Token'ı nereden alacaksınız?**
- Meta Developer Console → Tools → System Users → Generate New Token
- İzinler: `ads_read` (zorunlu), `ads_management` (opsiyonel)

---

### 3. Proxy URL'ini Siteye Ekleme

Proxy URL'ini GitHub Secrets'a veya `.env` dosyasına eklemeniz gerekiyor.

#### Yöntem A: GitHub Secrets (Production için - Önerilen)

1. GitHub repository'nize gidin: [https://github.com/dgdfurkan/Panela](https://github.com/dgdfurkan/Panela)
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. **Name:** `VITE_META_PROXY_URL`
4. **Value:** `https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy`
5. **"Add secret"** butonuna tıklayın

✅ GitHub Secrets'a eklendi!

#### Yöntem B: .env Dosyası (Local Test için)

Proje klasörünüzde `.env` dosyası oluşturun:

```bash
cd /Users/furkangunduz/Antigravity/Panela
touch .env
```

`.env` dosyasına şunu ekleyin:

```
VITE_META_PROXY_URL=https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy
```

**Not:** `.env` dosyasını `.gitignore`'a ekleyin (zaten ekli olmalı).

---

## 🧪 Test Etme

### 1. Debug Endpoint'i Test Edin

Tarayıcıda şu URL'yi açın:

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

**Hata varsa:**
- `tokenPresent: false` → Token Secrets'a eklenmemiş
- `tokenValid: false` → Token geçersiz veya format hatası

### 2. Sitede Test Edin

1. GitHub'a push edin (GitHub Secrets kullandıysanız):
   ```bash
   git add .
   git commit -m "Add Meta Ads proxy URL"
   git push
   ```

2. GitHub Pages'in deploy olmasını bekleyin (2-3 dakika)

3. Tarayıcıda sitenizi açın: `https://dgdfurkan.github.io/Panela`

4. **Research** veya **Meta Ads** sayfasına gidin

5. **AutoMetaScanner** bileşenini bulun

6. Formu doldurun:
   - Ülkeler: `US,CA,GB`
   - Keywords: `shop now`
   - Diğer ayarları varsayılan bırakın

7. **"Taramayı Başlat"** butonuna tıklayın

**Başarılı test:**
- ✅ Reklamlar listelenmeye başlamalı
- ✅ Log'larda "Çekilen: X, toplanan: Y" mesajları görünmeli
- ✅ Hata mesajı görünmemeli

---

## 🆘 Sorun Giderme

### Sorun: "META_ADS_TOKEN missing"

**Çözüm:**
1. Supabase Dashboard → Settings → Edge Functions → Secrets
2. `META_ADS_TOKEN` secret'ının olduğundan emin olun
3. Yoksa tekrar ekleyin

### Sorun: "Invalid or expired access token"

**Çözüm:**
1. Meta Developer Console'a gidin
2. Yeni bir System User Token oluşturun
3. Token'ı Supabase Secrets'a güncelleyin

### Sorun: "Proxy error" veya CORS hatası

**Çözüm:**
1. Proxy URL'inin doğru olduğundan emin olun
2. Debug endpoint'i test edin (`/debug` ekleyerek)
3. Tarayıcı cache'ini temizleyin (Cmd+Shift+R)

### Sorun: Site GitHub Pages'te çalışmıyor

**Çözüm:**
1. GitHub repository → Settings → Pages
2. Source'u `gh-pages` branch'i olarak ayarlayın
3. `npm run deploy` komutunu çalıştırın

---

## 📝 Checklist

Kurulum tamamlandığında şunları kontrol edin:

- [ ] Function kodu güncellendi (yeni versiyon)
- [ ] Meta System User Token oluşturuldu
- [ ] Token'ın `ads_read` izni var
- [ ] Token Supabase Secrets'a eklendi (`META_ADS_TOKEN`)
- [ ] Proxy URL GitHub Secrets'a eklendi (`VITE_META_PROXY_URL`)
- [ ] Debug endpoint çalışıyor (`/debug` ekleyerek test)
- [ ] GitHub Pages'te site çalışıyor
- [ ] AutoMetaScanner test başarılı

---

## 🎉 Tamamlandı!

Artık Meta Ads Archive API'sini GitHub Pages'te çalışan sitenizde kullanabilirsiniz!

**Özet:**
- ✅ Function zaten deploy edilmiş
- ✅ Kod güncellendi
- ✅ Token eklendi
- ✅ Proxy URL siteye eklendi
- ✅ Her şey çalışıyor!

