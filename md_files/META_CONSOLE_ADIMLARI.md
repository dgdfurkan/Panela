# 📍 Meta Developer Console'da İzin Kontrolü - Görsel Rehber

Meta Developer Console'da "Basic" settings sayfasındasınız. İzinleri kontrol etmek için şu adımları izleyin:

---

## ✅ Yöntem 1: System Users Üzerinden (En Kolay)

Bu yöntem **en garantili** çözümdür:

### Adım 1: System Users'a Gidin

1. Sol menüden **"Tools"** seçeneğine tıklayın
2. **"System Users"** seçeneğine tıklayın
3. System User'ınızı bulun (veya yeni oluşturun)

### Adım 2: Token İzinlerini Kontrol Edin

1. System User'ınızın yanında **"Generate New Token"** veya **"View Token"** butonuna tıklayın
2. Token oluştururken **"Permissions"** veya **"Scopes"** bölümüne bakın
3. Şu izinlerin seçili olduğundan emin olun:
   - ✅ **ads_read** (Ads Read) - **ZORUNLU**
   - ✅ **ads_management** (Ads Management) - Önerilir

### Adım 3: Yeni Token Oluşturun

1. **"Generate New Token"** butonuna tıklayın
2. **Permissions** kısmında **mutlaka `ads_read` seçin**
3. **"Generate Token"** butonuna tıklayın
4. Token'ı kopyalayın ⚠️

---

## ✅ Yöntem 2: Advanced Sekmesinden

### Adım 1: Advanced Sekmesine Gidin

1. Sol menüden **"App settings"** → **"Advanced"** sekmesine tıklayın
2. Bu sayfada **"Permissions"** veya **"Features"** bölümünü arayın

### Adım 2: İzinleri Kontrol Edin

- Bu sayfada aktif izinlerin listesi görünebilir
- **"Ads Archive API"** veya **"ads_read"** arayın
- Eğer görünmüyorsa, System Users yöntemini kullanın

---

## ✅ Yöntem 3: Products Menüsünden

### Adım 1: Products Menüsüne Gidin

1. Sol menüde **"Products"** veya **"Add Product"** seçeneğini arayın
2. Eğer varsa, tıklayın

### Adım 2: Ads Archive API'yi Kontrol Edin

1. **"Ads Archive API"** veya **"Ads Library API"** arayın
2. Eğer görünmüyorsa, **"Add Product"** butonuna tıklayın
3. Ads Archive API'yi ekleyin

---

## ✅ Yöntem 4: Graph API Explorer ile Test

### Adım 1: Graph API Explorer'a Gidin

1. Sol menüden **"Tools"** → **"Graph API Explorer"** seçeneğine tıklayın

### Adım 2: Token'ı Test Edin

1. **"User or Page"** dropdown'ından token'ınızı seçin
2. Endpoint olarak şunu yazın: `/ads_archive`
3. **"Submit"** butonuna tıklayın
4. Hata alırsanız, token'ın `ads_read` izni yoktur

---

## 🎯 En Hızlı Çözüm

**"App Review" veya "Permissions and Features" bulmak yerine:**

1. **Tools** → **System Users** → Token'ınızı bulun
2. **"Generate New Token"** butonuna tıklayın
3. **Permissions** kısmında **mutlaka `ads_read` seçin**
4. Token'ı oluşturun
5. Supabase Secrets'a güncelleyin
6. Function'ı yeniden deploy edin

**Bu kesinlikle çalışır!** 🚀

---

## 📝 Notlar

- "Basic" settings sayfasında izinler görünmez
- İzinler genellikle **System Users** veya **Advanced** sekmesinde bulunur
- En kolay yol: Token'ı yeniden oluştururken `ads_read` iznini seçmek

---

## 💡 İpucu

Meta Developer Console'un yeni arayüzünde bölümler farklı yerlerde olabilir. Eğer bulamıyorsanız:

1. **System Users** yöntemini kullanın (en garantili)
2. Token'ı yeniden oluştururken `ads_read` iznini seçin
3. Bu kesinlikle çalışır!

