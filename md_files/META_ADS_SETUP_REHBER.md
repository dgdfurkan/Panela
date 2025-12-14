# 🚀 Meta Ads Proxy Kurulum Rehberi (GitHub Pages için)

Bu rehber, **GitHub Pages'te çalışan siteniz** için Meta Ads Archive API'sini kullanmak üzere Supabase Edge Function proxy'sini kurmanız için gereken adımları içerir.

## 🎯 Önemli Bilgiler

- ✅ **Siteniz GitHub Pages'te çalışacak** - Her şey tarayıcıda çalışır
- ✅ **CLI sadece bir kere kullanılacak** - Edge Function'ı deploy etmek için
- ✅ **Deploy sonrası CLI'ye gerek yok** - Site tamamen GitHub Pages'te çalışır
- ✅ **Token güvende** - Token tarayıcıya inmez, Supabase'de kalır

---

## 📋 İçindekiler

1. [Durum Açıklaması](#durum-açıklaması)
2. [Meta Ads Token'ınızı Alma](#1-meta-ads-tokenınızı-alma)
3. [Token'ı Supabase Secrets'a Ekleme](#2-tokenı-supabase-secretsa-ekleme)
4. [Edge Function'ı Deploy Etme](#3-edge-functionı-deploy-etme)
5. [Proxy URL'ini Siteye Ekleme](#4-proxy-urlini-siteye-ekleme)
6. [Test Etme](#5-test-etme)
7. [Sorun Giderme](#6-sorun-giderme)

---

## Durum Açıklaması

### Nasıl Çalışıyor?

```
GitHub Pages (Tarayıcıda çalışan site)
    ↓
    İstek atar
    ↓
Supabase Edge Function (Backend servisi)
    ↓
    Token kullanır
    ↓
Meta Ads Archive API
```

**Önemli:** 
- GitHub Pages'teki site **sadece frontend** (React uygulaması)
- Supabase Edge Function **backend servisi** (Meta API'ye istek atar)
- Token **Supabase'de saklanır**, tarayıcıya inmez

### Neden CLI Gerekli?

CLI sadece **Edge Function'ı deploy etmek** için bir kere kullanılır. Deploy edildikten sonra:
- ✅ Site GitHub Pages'te çalışır
- ✅ CLI'ye gerek kalmaz
- ✅ Her şey otomatik çalışır

**Alternatif:** Eğer CLI kullanmak istemiyorsanız, Supabase Dashboard'dan manuel olarak da yapabilirsiniz (daha uzun sürer).

---

## 1. Meta Ads Token'ınızı Alma

Meta Ads Archive API'sini kullanmak için bir **System User Token** gereklidir.

### Adım 1.1: Meta Developer Console'a Giriş

1. Tarayıcınızda [https://developers.facebook.com](https://developers.facebook.com) adresine gidin
2. Giriş yapın (Facebook hesabınızla)

### Adım 1.2: App Oluşturma veya Mevcut App'i Seçme

1. **"My Apps"** menüsünden bir app seçin veya **"Create App"** ile yeni app oluşturun
2. App tipi olarak **"Business"** seçin

### Adım 1.3: System User Token Oluşturma

1. Sol menüden **"Tools"** → **"System Users"** seçeneğine gidin
2. **"Add System User"** butonuna tıklayın
3. Bir isim verin (örnek: "Panela Ads Scanner")
4. **"Generate New Token"** butonuna tıklayın
5. **Permissions** kısmında şu izinleri seçin:
   - ✅ `ads_read` (Ads Read) - **ZORUNLU**
   - ✅ `ads_management` (Ads Management) - opsiyonel ama önerilir
6. **"Generate Token"** butonuna tıklayın
7. **Token'ı kopyalayın ve güvenli bir yere kaydedin** ⚠️ **Bir daha göremeyeceksiniz!**

**⚠️ ÖNEMLİ:** Token'ı kopyaladıktan sonra kaydedin. Sayfayı kapatırsanız bir daha göremezsiniz.

---

## 2. Token'ı Supabase Secrets'a Ekleme

Token'ı Supabase'e eklemenin **en kolay yolu** Dashboard üzerinden:

### Adım 2.1: Supabase Dashboard'a Giriş

1. Tarayıcınızda [https://supabase.com](https://supabase.com) adresine gidin
2. Giriş yapın ve projenizi seçin

### Adım 2.2: Proje Bilgilerinizi Bulun

1. Supabase Dashboard'da projenize tıklayın
2. Sol menüden **Settings** (⚙️) → **API** seçeneğine gidin
3. Şu bilgileri not edin:
   - **Project URL**: `https://xxxxx.supabase.co` şeklinde bir URL
   - **Project Reference**: URL'deki `xxxxx` kısmı (örnek: `abcdefghijklmnop`)

### Adım 2.3: Token'ı Secrets'a Ekleme

1. Supabase Dashboard'da projenize gidin
2. Sol menüden **Settings** → **Edge Functions** → **Secrets** seçeneğine gidin
3. **"Add Secret"** butonuna tıklayın
4. **Name:** `META_ADS_TOKEN` (tam olarak bu şekilde, büyük/küçük harf önemli!)
5. **Value:** Meta'dan aldığınız token'ı yapıştırın
6. **"Save"** butonuna tıklayın

✅ Token başarıyla eklendi!

---

## 3. Edge Function'ı Deploy Etme

Edge Function'ı deploy etmek için **iki yöntem** var:

### Yöntem 1: Supabase CLI ile (Hızlı - Önerilen)

#### Adım 3.1: CLI Kurulumu (Sadece bir kere)

Terminal'de şu komutu çalıştırın:

```bash
brew install supabase/tap/supabase
```

Eğer Homebrew yoksa:
```bash
# Önce Homebrew'i kurun
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Sonra Supabase CLI'yi kurun
brew install supabase/tap/supabase
```

#### Adım 3.2: CLI ile Giriş Yapma

Terminal'de şu komutu çalıştırın:

```bash
supabase login
```

Bu komut sizi tarayıcıya yönlendirecek. Giriş yaptıktan sonra terminal'e geri dönün.

#### Adım 3.3: Projeyi Linkleme

Terminal'de şu komutu çalıştırın (Project Reference'ı kendi projenizinkiyle değiştirin):

```bash
cd /Users/furkangunduz/Antigravity/Panela
supabase link --project-ref YOUR_PROJECT_REF
```

**Örnek:**
```bash
supabase link --project-ref abcdefghijklmnop
```

#### Adım 3.4: Deploy İşlemi

Terminal'de şu komutu çalıştırın:

```bash
supabase functions deploy meta-ads-proxy
```

**Başarılı çıktı:**
```
Deploying function meta-ads-proxy...
Function meta-ads-proxy deployed successfully!
```

✅ **Deploy tamamlandı!** Artık CLI'ye gerek yok.

---

### Yöntem 2: Supabase Dashboard ile (Manuel - Daha Uzun)

Eğer CLI kullanmak istemiyorsanız:

1. Supabase Dashboard'da projenize gidin
2. Sol menüden **Edge Functions** seçeneğine gidin
3. **"Create Function"** butonuna tıklayın
4. Function adı: `meta-ads-proxy`
5. Kod olarak `supabase/functions/meta-ads-proxy/index.ts` dosyasının içeriğini kopyalayıp yapıştırın
6. **"Deploy"** butonuna tıklayın

**Not:** Bu yöntem daha uzun sürer ve hata yapma riski daha yüksektir. CLI yöntemi önerilir.

---

## 4. Proxy URL'ini Siteye Ekleme

Deploy edilen Edge Function'ın URL'ini siteye eklemeniz gerekiyor.

### Adım 4.1: Proxy URL'ini Bulma

Proxy URL'iniz şu formatta olacak:

```
https://YOUR_PROJECT_REF.functions.supabase.co/meta-ads-proxy
```

**Örnek:**
```
https://abcdefghijklmnop.functions.supabase.co/meta-ads-proxy
```

### Adım 4.2: GitHub Secrets'a Ekleme (Önerilen)

1. GitHub repository'nize gidin
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. **Name:** `VITE_META_PROXY_URL`
4. **Value:** Proxy URL'inizi yapıştırın
5. **"Add secret"** butonuna tıklayın

### Adım 4.3: Local Test için .env Dosyası (Opsiyonel)

Proje klasörünüzde `.env` dosyası oluşturun:

```bash
cd /Users/furkangunduz/Antigravity/Panela
touch .env
```

`.env` dosyasına şunu ekleyin:

```
VITE_META_PROXY_URL=https://YOUR_PROJECT_REF.functions.supabase.co/meta-ads-proxy
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Not:** `.env` dosyası sadece local test için. Production'da GitHub Secrets kullanılır.

---

## 5. Test Etme

### Adım 5.1: Debug Endpoint'i Test Etme

Proxy'nin çalışıp çalışmadığını kontrol edin:

**Terminal'de:**
```bash
curl https://YOUR_PROJECT_REF.functions.supabase.co/meta-ads-proxy/debug
```

**Tarayıcıda:**
Proxy URL'inizin sonuna `/debug` ekleyin:
```
https://YOUR_PROJECT_REF.functions.supabase.co/meta-ads-proxy/debug
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

### Adım 5.2: GitHub Pages'te Test Etme

1. Değişiklikleri GitHub'a push edin:
   ```bash
   git add .
   git commit -m "Add Meta Ads proxy configuration"
   git push
   ```

2. GitHub Pages'in deploy olmasını bekleyin (birkaç dakika)

3. Tarayıcıda sitenizi açın: `https://dgdfurkan.github.io/Panela`

4. **Research** veya **Meta Ads** sayfasına gidin

5. **AutoMetaScanner** bileşenini bulun

6. Formu doldurun:
   - Ülkeler: `US,CA,GB`
   - Keywords: `shop now`
   - Diğer ayarları varsayılan bırakın

7. **"Taramayı Başlat"** butonuna tıklayın

### Başarılı Test

- ✅ Reklamlar listelenmeye başlamalı
- ✅ Log'larda "Çekilen: X, toplanan: Y" mesajları görünmeli
- ✅ Hata mesajı görünmemeli

### Hata Durumunda

Log'larda şu tür mesajlar görünebilir:

- ❌ **Token Hatası:** Token eksik veya geçersiz
- ❌ **Token geçersiz veya süresi dolmuş:** Yeni token oluşturmanız gerekiyor
- ❌ **Permission denied:** Token'ın yetersiz izinleri var

---

## 6. Sorun Giderme

### Sorun 1: "META_ADS_TOKEN missing"

**Çözüm:**
1. Supabase Dashboard → Settings → Edge Functions → Secrets
2. `META_ADS_TOKEN` secret'ının olduğundan emin olun
3. Yoksa tekrar ekleyin

### Sorun 2: "Invalid or expired access token"

**Çözüm:**
1. Meta Developer Console'a gidin
2. Yeni bir System User Token oluşturun
3. Token'ı Supabase Secrets'a güncelleyin

### Sorun 3: "Permission denied"

**Çözüm:**
1. Meta Developer Console'da System User Token'ınızı kontrol edin
2. Token'ın `ads_read` iznine sahip olduğundan emin olun
3. Gerekirse yeni token oluşturun ve izinleri kontrol edin

### Sorun 4: "Proxy error" veya CORS hatası

**Çözüm:**
1. Proxy URL'inin doğru olduğundan emin olun
2. Debug endpoint'i test edin (`/debug` ekleyerek)
3. Tarayıcı cache'ini temizleyin

### Sorun 5: Site GitHub Pages'te çalışmıyor

**Çözüm:**
1. GitHub repository → Settings → Pages
2. Source'u `gh-pages` branch'i olarak ayarlayın
3. `npm run deploy` komutunu çalıştırın

---

## 📝 Özet Checklist

Kurulum tamamlandığında şunları kontrol edin:

- [ ] Meta System User Token oluşturuldu
- [ ] Token'ın `ads_read` izni var
- [ ] Token Supabase Secrets'a eklendi (Dashboard'dan)
- [ ] Edge Function deploy edildi (CLI veya Dashboard ile)
- [ ] Proxy URL GitHub Secrets'a eklendi (`VITE_META_PROXY_URL`)
- [ ] Debug endpoint çalışıyor (`/debug` ekleyerek test)
- [ ] GitHub Pages'te site çalışıyor
- [ ] AutoMetaScanner test başarılı

---

## 🎯 Sonuç

✅ **Artık her şey hazır!**

- Site GitHub Pages'te çalışıyor
- Edge Function deploy edildi
- Token güvende (Supabase'de)
- Her şey otomatik çalışıyor

**CLI'ye bir daha gerek yok!** Sadece kod değişikliklerini GitHub'a push edin, site otomatik güncellenir.

---

## 🆘 Yardım

Eğer hala sorun yaşıyorsanız:

1. Browser console'da hataları kontrol edin (F12)
2. Supabase Dashboard → Edge Functions → Logs bölümüne bakın
3. Debug endpoint çıktısını kontrol edin
4. GitHub Actions log'larına bakın (deploy sırasında hata varsa)

---

## 🎉 Başarılı!

Tebrikler! Artık Meta Ads Archive API'sini GitHub Pages'te çalışan sitenizde kullanabilirsiniz. Token'ınız güvende ve CORS sorunları çözüldü.
