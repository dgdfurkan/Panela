# ⚡ HIZLI TOKEN ÇÖZÜMÜ - 5 Dakikada Çöz!

Token hatası alıyorsunuz. İşte **en hızlı çözüm**:

---

## 🚀 5 Dakikalık Çözüm

### Adım 1: Meta Developer Console (2 dakika)

1. [https://developers.facebook.com](https://developers.facebook.com) → Giriş yap
2. **Tools** → **System Users**
3. **"Generate New Token"** butonuna tıkla
4. **İzinleri seç:**
   - ✅ `ads_read` (Ads Read) - **MUTLAKA SEÇ**
   - ✅ `ads_management` (Ads Management) - Seç
5. **"Generate Token"** → Token'ı kopyala ⚠️

---

### Adım 2: Supabase Secrets (1 dakika)

1. [https://supabase.com](https://supabase.com) → Projenizi seçin
2. **Settings** → **Edge Functions** → **Secrets**
3. `META_ADS_TOKEN` secret'ını bulun
4. **"Edit"** veya **"Update"** butonuna tıklayın
5. **Eski token'ı silin**, yeni token'ı yapıştırın
6. **"Save"** butonuna tıklayın

**ÖNEMLİ:** Token'da başında/sonunda boşluk olmamalı!

---

### Adım 3: Function'ı Yeniden Deploy (1 dakika)

1. Supabase Dashboard → **Edge Functions** → **meta-ads-proxy**
2. **"Deploy"** veya **"Redeploy"** butonuna tıklayın
3. 1-2 dakika bekleyin

**NEDEN?** Bazen token güncellemesi için function'ı yeniden deploy etmek gerekir.

---

### Adım 4: Test (1 dakika)

1. Debug endpoint'i test edin:
   ```
   https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy/debug
   ```

2. Başarılı çıktı:
   ```json
   {
     "tokenPresent": true,
     "tokenValid": true,
     "tokenError": null
   }
   ```

3. Sitede test edin - Artık çalışmalı!

---

## 🆘 Hala Çalışmıyorsa

### Kontrol Listesi:

- [ ] Token System User Token mı? (User Access Token değil!)
- [ ] Token'ın `ads_read` izni var mı?
- [ ] Token Supabase Secrets'a eklendi mi?
- [ ] Token'da boşluk yok mu?
- [ ] Function yeniden deploy edildi mi?
- [ ] Debug endpoint çalışıyor mu?

---

## 💡 En Sık Yapılan Hatalar

1. **Token tipi yanlış** → System User Token olmalı
2. **İzinler eksik** → `ads_read` mutlaka olmalı
3. **Function deploy edilmedi** → Token güncelledikten sonra deploy et
4. **Token'da boşluk var** → Token'ı kopyalarken dikkat et

---

## 🎯 Kesin Çözüm

**Eğer hala çalışmıyorsa:**

1. Eski token'ı **tamamen silin** (Supabase Secrets'dan)
2. Yeni token oluşturun (Meta Developer Console)
3. Yeni token'ı ekleyin (Supabase Secrets)
4. Function'ı yeniden deploy edin
5. 2-3 dakika bekleyin
6. Test edin

**Bu kesinlikle çalışır!** 🚀

