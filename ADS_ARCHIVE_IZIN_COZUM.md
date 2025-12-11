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

**Çözüm:**
1. Meta Developer Console → App Settings → Basic
2. **App Review** sekmesine gidin
3. Ads Archive API'nin onaylandığından emin olun
4. Eğer onaylanmamışsa, Meta'ya başvurun

### Sorun: App'in Ads Archive API'ye erişimi yok

**Çözüm:**
1. Meta Developer Console → App Settings → Basic
2. **Permissions and Features** sekmesine gidin
3. Ads Archive API'nin ekli olduğundan emin olun
4. Eğer yoksa, ekleyin

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

