# 🎯 Sorun Özeti - Ne Arıyoruz?

## ❌ Şu Anki Sorun

Token'ınız var ve çalışıyor AMA Ads Archive API'ye erişemiyor.

---

## 🔍 Durum Analizi

### ✅ Çalışan Kısımlar:
- Token Supabase Secrets'da var ✅
- Token geçerli format ✅
- Token `/me` endpoint'ine çalışıyor ✅ (debug endpoint'te test ettik)

### ❌ Çalışmayan Kısım:
- Token `/ads_archive` endpoint'ine çalışmıyor ❌
- Meta API'den "Invalid or expired access token" hatası alıyoruz ❌

---

## 🎯 Sorunun Kaynağı

**Token'ın `ads_read` izni yok!**

Meta API'de her endpoint için farklı izinler gerekiyor:
- `/me` endpoint'i → Genel erişim (token varsa çalışır)
- `/ads_archive` endpoint'i → **`ads_read` izni gerektirir** (token'ınızda bu izin yok)

---

## ✅ Çözüm

### Ne Yapmalıyız?

**Token'ı yeniden oluştururken `ads_read` iznini seçmek!**

### Nasıl Yapılır?

1. **Meta Developer Console** → **Tools** → **System Users**
2. System User'ınızı bulun
3. **"Generate New Token"** butonuna tıklayın
4. **Permissions** kısmında şu izinleri seçin:
   - ✅ **ads_read** (Ads Read) - **MUTLAKA SEÇ**
   - ✅ **ads_management** (Ads Management) - Önerilir
5. Token'ı oluşturun
6. Supabase Secrets'a güncelleyin
7. Function'ı yeniden deploy edin

---

## 📝 Özet

**Sorun:** Token'da `ads_read` izni yok
**Çözüm:** Token'ı yeniden oluştururken `ads_read` iznini seçmek
**Nerede:** Meta Developer Console → Tools → System Users → Generate New Token → Permissions

---

## 💡 Basit Açıklama

Meta API'de her şey için farklı izinler var:
- Genel erişim → Token yeterli
- Ads Archive API → **`ads_read` izni gerekli**

Token'ınızda `ads_read` izni olmadığı için Ads Archive API'ye erişemiyorsunuz.

**Çözüm:** Token'ı yeniden oluştururken `ads_read` iznini seçmek.

---

## 🚀 Hızlı Çözüm (3 Adım)

1. **Meta Developer Console** → **Tools** → **System Users** → **Generate New Token**
2. **Permissions** → **`ads_read` seç** → Token oluştur
3. **Supabase Secrets** → Token'ı güncelle → Function'ı deploy et

**Bu kesinlikle çalışır!** 🎯

