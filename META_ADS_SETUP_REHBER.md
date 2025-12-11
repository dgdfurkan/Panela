# 🚀 Meta Ads Proxy Kurulum Rehberi

Bu rehber, Meta Ads Archive API'sini kullanmak için Supabase Edge Function proxy'sini kurmanız için gereken tüm adımları içerir.

---

## 📋 İçindekiler

1. [Supabase CLI Kurulumu](#1-supabase-cli-kurulumu)
2. [Supabase Projenize Bağlanma](#2-supabase-projenize-bağlanma)
3. [Meta Ads Token'ınızı Alma](#3-meta-ads-tokenınızı-alma)
4. [Token'ı Supabase Secrets'a Ekleme](#4-tokenı-supabase-secretsa-ekleme)
5. [Proxy'yi Deploy Etme](#5-proxyyi-deploy-etme)
6. [Test Etme](#6-test-etme)
7. [Sorun Giderme](#7-sorun-giderme)

---

## 1. Supabase CLI Kurulumu

Supabase CLI, Edge Function'ları deploy etmek için gereklidir.

### macOS için:

```bash
# Homebrew ile kurulum (en kolay yol)
brew install supabase/tap/supabase

# Kurulumu kontrol edin
supabase --version
```

Eğer Homebrew yoksa:
```bash
# Homebrew'i önce kurun
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Sonra Supabase CLI'yi kurun
brew install supabase/tap/supabase
```

### Alternatif: Manuel Kurulum
```bash
# macOS için
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_darwin_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

---

## 2. Supabase Projenize Bağlanma

### Adım 2.1: Supabase Dashboard'a Giriş Yapın

1. Tarayıcınızda [https://supabase.com](https://supabase.com) adresine gidin
2. "Sign In" butonuna tıklayın ve giriş yapın
3. Projenizi seçin (veya yeni proje oluşturun)

### Adım 2.2: Proje Bilgilerinizi Bulun

1. Supabase Dashboard'da projenize tıklayın
2. Sol menüden **Settings** (⚙️) → **API** seçeneğine gidin
3. Şu bilgileri not edin:
   - **Project URL**: `https://xxxxx.supabase.co` şeklinde bir URL
   - **Project Reference**: URL'deki `xxxxx` kısmı (örnek: `abcdefghijklmnop`)

### Adım 2.3: CLI ile Giriş Yapın

Terminal'de şu komutu çalıştırın:

```bash
supabase login
```

Bu komut sizi tarayıcıya yönlendirecek. Giriş yaptıktan sonra terminal'e geri dönün.

### Adım 2.4: Projeyi Linkleyin

Proje klasörünüze gidin ve şu komutu çalıştırın:

```bash
cd /Users/furkangunduz/Antigravity/Panela
supabase link --project-ref YOUR_PROJECT_REF
```

**Not:** `YOUR_PROJECT_REF` yerine Adım 2.2'de bulduğunuz Project Reference'ı yazın.

Örnek:
```bash
supabase link --project-ref abcdefghijklmnop
```

---

## 3. Meta Ads Token'ınızı Alma

Meta Ads Archive API'sini kullanmak için bir **System User Token** gereklidir.

### Adım 3.1: Meta Developer Console'a Giriş

1. [https://developers.facebook.com](https://developers.facebook.com) adresine gidin
2. Giriş yapın (Facebook hesabınızla)

### Adım 3.2: App Oluşturma veya Mevcut App'i Seçme

1. **"My Apps"** menüsünden bir app seçin veya **"Create App"** ile yeni app oluşturun
2. App tipi olarak **"Business"** seçin

### Adım 3.3: System User Token Oluşturma

1. Sol menüden **"Tools"** → **"System Users"** seçeneğine gidin
2. **"Add System User"** butonuna tıklayın
3. Bir isim verin (örnek: "Panela Ads Scanner")
4. **"Generate New Token"** butonuna tıklayın
5. **Permissions** kısmında şu izinleri seçin:
   - ✅ `ads_read` (Ads Read)
   - ✅ `ads_management` (Ads Management) - opsiyonel ama önerilir
6. **"Generate Token"** butonuna tıklayın
7. **Token'ı kopyalayın ve güvenli bir yere kaydedin** (bir daha göremeyeceksiniz!)

**⚠️ ÖNEMLİ:** Token'ı kopyaladıktan sonra kaydedin. Sayfayı kapatırsanız bir daha göremezsiniz.

---

## 4. Token'ı Supabase Secrets'a Ekleme

Token'ı Supabase'e eklemenin iki yolu var:

### Yöntem 1: Supabase CLI ile (Önerilen)

Terminal'de şu komutu çalıştırın:

```bash
supabase secrets set META_ADS_TOKEN=your_token_here
```

**Örnek:**
```bash
supabase secrets set META_ADS_TOKEN=EAABsbCS1iHgBO7ZC...
```

### Yöntem 2: Supabase Dashboard ile

1. Supabase Dashboard'da projenize gidin
2. Sol menüden **Settings** → **Edge Functions** → **Secrets** seçeneğine gidin
3. **"Add Secret"** butonuna tıklayın
4. **Name:** `META_ADS_TOKEN`
5. **Value:** Token'ınızı yapıştırın
6. **"Save"** butonuna tıklayın

### Token'ı Kontrol Etme

Token'ın doğru şekilde eklendiğini kontrol edin:

```bash
supabase secrets list
```

Çıktıda `META_ADS_TOKEN` görmelisiniz (değeri gösterilmez, güvenlik için).

---

## 5. Proxy'yi Deploy Etme

### Adım 5.1: .env Dosyası Oluşturma (Opsiyonel)

Proje klasörünüzde `.env` dosyası oluşturun:

```bash
cd /Users/furkangunduz/Antigravity/Panela
touch .env
```

`.env` dosyasına şunu ekleyin:

```
META_ADS_TOKEN=your_token_here
```

**Not:** Bu dosya sadece local test için. Production'da Supabase Secrets kullanılır.

### Adım 5.2: Deploy İşlemi

Terminal'de şu komutu çalıştırın:

```bash
supabase functions deploy meta-ads-proxy
```

Eğer `.env` dosyası kullanmak istiyorsanız:

```bash
supabase functions deploy meta-ads-proxy --env-file .env
```

### Deploy Başarılı Olursa

Terminal'de şuna benzer bir çıktı göreceksiniz:

```
Deploying function meta-ads-proxy...
Function meta-ads-proxy deployed successfully!
```

---

## 6. Test Etme

### Adım 6.1: Debug Endpoint'i Test Etme

Proxy'nin çalışıp çalışmadığını kontrol edin:

```bash
# Terminal'de:
curl https://YOUR_PROJECT_REF.functions.supabase.co/meta-ads-proxy/debug
```

**Not:** `YOUR_PROJECT_REF` yerine kendi proje referansınızı yazın.

**Başarılı çıktı örneği:**
```json
{
  "tokenPresent": true,
  "tokenValid": true,
  "tokenError": null,
  "tokenLength": 200,
  "tokenPreview": "EAABsbCS1...xyz12"
}
```

### Adım 6.2: Uygulamada Test Etme

1. Projenizi çalıştırın:
   ```bash
   npm run dev
   ```

2. Tarayıcıda uygulamanızı açın
3. **Research** veya **Meta Ads** sayfasına gidin
4. **AutoMetaScanner** bileşenini bulun
5. Formu doldurun ve **"Taramayı Başlat"** butonuna tıklayın

### Başarılı Test

- Reklamlar listelenmeye başlamalı
- Log'larda "Çekilen: X, toplanan: Y" mesajları görünmeli
- Hata mesajı görünmemeli

### Hata Durumunda

Log'larda şu tür mesajlar görünebilir:

- ❌ **Token Hatası:** Token eksik veya geçersiz
- ❌ **Token geçersiz veya süresi dolmuş:** Yeni token oluşturmanız gerekiyor
- ❌ **Permission denied:** Token'ın yetersiz izinleri var

---

## 7. Sorun Giderme

### Sorun 1: "supabase: command not found"

**Çözüm:** Supabase CLI kurulu değil. [Adım 1](#1-supabase-cli-kurulumu)'e geri dönün.

### Sorun 2: "Project not found" veya "Unauthorized"

**Çözüm:** 
1. `supabase login` komutunu tekrar çalıştırın
2. `supabase link --project-ref YOUR_PROJECT_REF` komutunu kontrol edin

### Sorun 3: "META_ADS_TOKEN missing"

**Çözüm:**
1. Token'ın Supabase Secrets'a eklendiğinden emin olun: `supabase secrets list`
2. Token'ı tekrar ekleyin: `supabase secrets set META_ADS_TOKEN=your_token`

### Sorun 4: "Invalid or expired access token"

**Çözüm:**
1. Meta Developer Console'a gidin
2. Yeni bir System User Token oluşturun
3. Token'ı Supabase Secrets'a güncelleyin

### Sorun 5: "Permission denied"

**Çözüm:**
1. Meta Developer Console'da System User Token'ınızı kontrol edin
2. Token'ın `ads_read` iznine sahip olduğundan emin olun
3. Gerekirse yeni token oluşturun ve izinleri kontrol edin

### Sorun 6: CORS Hatası

**Çözüm:** Proxy kodunda CORS headers zaten var. Eğer hala sorun varsa:
1. Proxy'yi tekrar deploy edin
2. Tarayıcı cache'ini temizleyin

---

## 📝 Özet Checklist

Kurulum tamamlandığında şunları kontrol edin:

- [ ] Supabase CLI kurulu (`supabase --version`)
- [ ] Supabase'e giriş yapıldı (`supabase login`)
- [ ] Proje linklendi (`supabase link`)
- [ ] Meta System User Token oluşturuldu
- [ ] Token'ın `ads_read` izni var
- [ ] Token Supabase Secrets'a eklendi (`supabase secrets list`)
- [ ] Proxy deploy edildi (`supabase functions deploy meta-ads-proxy`)
- [ ] Debug endpoint çalışıyor (`curl .../debug`)
- [ ] Uygulamada test başarılı

---

## 🆘 Yardım

Eğer hala sorun yaşıyorsanız:

1. Terminal çıktılarını kontrol edin
2. Browser console'da hataları kontrol edin
3. Supabase Dashboard → Edge Functions → Logs bölümüne bakın
4. Debug endpoint çıktısını kontrol edin

---

## 🎉 Başarılı!

Tebrikler! Artık Meta Ads Archive API'sini kullanabilirsiniz. Proxy sayesinde token'ınız güvende ve CORS sorunları çözüldü.

