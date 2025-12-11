# 🔧 Function Not Found Sorunu Çözümü

"NOT_FOUND" hatası alıyorsunuz. Bu, function'ın deploy edilmediği veya aktif olmadığı anlamına gelir.

---

## 🔍 Kontrol Listesi

### 1. Supabase Dashboard'da Function'ı Kontrol Edin

1. Supabase Dashboard'a gidin: [https://supabase.com](https://supabase.com)
2. Projenizi seçin
3. Sol menüden **Edge Functions** seçeneğine tıklayın
4. `meta-ads-proxy` function'ını bulun

**Eğer function yoksa:**
- Function silinmiş veya hiç oluşturulmamış
- Yeni function oluşturmanız gerekiyor

**Eğer function varsa ama çalışmıyorsa:**
- Function deploy edilmemiş olabilir
- Function aktif değil olabilir

---

## ✅ Çözüm Adımları

### Senaryo 1: Function Yok veya Silinmiş

**Yeni function oluşturun:**

1. Supabase Dashboard → Edge Functions
2. **"Create Function"** veya **"New Function"** butonuna tıklayın
3. **Function Name:** `meta-ads-proxy` (tam olarak bu şekilde)
4. **Region:** Size en yakın region'ı seçin
5. **"Create Function"** butonuna tıklayın

**Kodu ekleyin:**

1. Kod editöründe `supabase/functions/meta-ads-proxy/index.ts` dosyasındaki kodu kopyalayın
2. Supabase Dashboard'daki kod editörüne yapıştırın
3. **"Deploy"** veya **"Save"** butonuna tıklayın
4. Deploy işleminin tamamlanmasını bekleyin (1-2 dakika)

---

### Senaryo 2: Function Var Ama Deploy Edilmemiş

**Function'ı deploy edin:**

1. Supabase Dashboard → Edge Functions → `meta-ads-proxy`
2. Kod editöründe kodu kontrol edin
3. **"Deploy"** veya **"Save"** butonuna tıklayın
4. Deploy işleminin tamamlanmasını bekleyin

**Kod güncellemesi:**

1. Eğer kod eski versiyondaysa, `supabase/functions/meta-ads-proxy/index.ts` dosyasındaki yeni kodu kopyalayın
2. Supabase Dashboard'daki kod editörüne yapıştırın
3. **"Deploy"** butonuna tıklayın

---

### Senaryo 3: Function URL'i Yanlış

**Doğru URL formatı:**

Supabase Edge Function URL'leri şu formatta olmalı:
```
https://PROJECT_REF.supabase.co/functions/v1/FUNCTION_NAME
```

**Sizin URL'iniz:**
```
https://kynwwhugwnzekrozxytj.supabase.co/functions/v1/meta-ads-proxy
```

Bu URL doğru görünüyor. Eğer hala çalışmıyorsa:

1. Supabase Dashboard → Edge Functions → `meta-ads-proxy`
2. Function sayfasında **URL'i kontrol edin**
3. Doğru URL'i kopyalayın

---

## 🧪 Test Etme

### 1. Function Durumunu Kontrol Edin

Supabase Dashboard → Edge Functions → `meta-ads-proxy` sayfasında:

- ✅ Function **Active** durumunda olmalı
- ✅ Son deploy tarihi görünmeli
- ✅ Function URL'i görünmeli

### 2. Debug Endpoint'i Test Edin

Deploy sonrası birkaç dakika bekleyin, sonra:

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
- `tokenPresent: false` → Token Secrets'a eklenmemiş (normal, önce function çalışmalı)
- `NOT_FOUND` → Function hala deploy edilmemiş

### 3. Function Logs'unu Kontrol Edin

Supabase Dashboard → Edge Functions → `meta-ads-proxy` → **Logs** sekmesine gidin:

- Deploy sırasında hata var mı?
- Function çağrıları görünüyor mu?
- Hata mesajları var mı?

---

## 🆘 Yaygın Sorunlar

### Sorun: "Function not found" hatası devam ediyor

**Çözüm:**
1. Function'ın gerçekten deploy edildiğinden emin olun
2. Deploy işleminden sonra 2-3 dakika bekleyin
3. Function URL'ini Supabase Dashboard'dan kopyalayın
4. Tarayıcı cache'ini temizleyin (Cmd+Shift+R)

### Sorun: Deploy butonu çalışmıyor

**Çözüm:**
1. Kod syntax hatası olabilir - kod editöründe hata mesajlarını kontrol edin
2. Tarayıcıyı yenileyin
3. Farklı bir tarayıcı deneyin

### Sorun: Function deploy oluyor ama çalışmıyor

**Çözüm:**
1. Function Logs'unu kontrol edin
2. Kod hatası olabilir - syntax kontrolü yapın
3. Token Secrets'a eklenmiş mi kontrol edin

---

## 📝 Adım Adım Kontrol Listesi

- [ ] Supabase Dashboard'da function var mı?
- [ ] Function **Active** durumunda mı?
- [ ] Function kodu güncel mi? (`supabase/functions/meta-ads-proxy/index.ts`)
- [ ] Function deploy edildi mi?
- [ ] Deploy işleminden sonra 2-3 dakika beklendi mi?
- [ ] Function URL'i doğru mu?
- [ ] Debug endpoint test edildi mi?
- [ ] Function Logs kontrol edildi mi?

---

## 🎯 Hızlı Çözüm

**En hızlı yol:**

1. Supabase Dashboard → Edge Functions
2. `meta-ads-proxy` function'ını bulun (yoksa oluşturun)
3. Kod editöründe `supabase/functions/meta-ads-proxy/index.ts` dosyasındaki kodu yapıştırın
4. **"Deploy"** butonuna tıklayın
5. 2-3 dakika bekleyin
6. Debug endpoint'i test edin: `/debug` ekleyerek

---

## 💡 İpucu

Function deploy edildikten sonra **birkaç dakika** beklemek gerekebilir. Supabase Edge Function'ları deploy edildikten sonra aktif hale gelmesi biraz zaman alabilir.

Eğer hala sorun varsa, Supabase Dashboard → Edge Functions → Logs bölümüne bakın ve hata mesajlarını kontrol edin.

