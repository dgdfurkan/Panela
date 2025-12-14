// Background Service Worker
// Arka planda API çağrıları yapar

// Extension yüklendiğinde
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Panela] Extension yüklendi');
});

// Mesaj dinleyici
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAdvertiser') {
    checkAdvertiserAds(request.advertiser, request.country, request.dateRange)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('[Panela Background] Hata:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Async response
  }
});

// Advertiser kontrol et
async function checkAdvertiserAds(advertiser, country, dateRange) {
  try {
    const url = buildAdsLibraryUrl(advertiser, country, dateRange);
    console.log(`[Panela Background] Kontrol ediliyor: ${advertiser} - ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const count = parseResultCount(html);
    
    console.log(`[Panela Background] Sonuç: ${advertiser} - ${count} reklam`);
    
    return {
      advertiser,
      count,
      url
    };
  } catch (error) {
    console.error('[Panela Background] Hata:', error);
    throw error;
  }
}

// Meta Ads Library URL oluştur
function buildAdsLibraryUrl(advertiser, country, dateRange) {
  const baseUrl = 'https://www.facebook.com/ads/library/';
  const params = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country: country || 'GB',
    is_targeted_country: 'false',
    media_type: 'all',
    search_type: 'advertiser',
    advertiser_name: advertiser
  });
  
  if (dateRange && dateRange.start && dateRange.end) {
    params.append('start_date[min]', dateRange.start);
    params.append('start_date[max]', dateRange.end);
  }
  
  return baseUrl + '?' + params.toString();
}

// HTML'den sonuç sayısını parse et
function parseResultCount(html) {
  // Virgüllü/noktalı sayıları handle eden helper
  function parseNumber(str) {
    // "50.000" veya "50,000" formatını handle et
    const cleaned = str.replace(/[.,]/g, '');
    return parseInt(cleaned, 10) || 0;
  }
  
  const patterns = [
    // aria-label içinde sonuç sayısı
    /aria-label="[^"]*~?(\d+[.,]?\d*)[^"]*sonuç/i,
    /aria-label="[^"]*~?(\d+[.,]?\d*)[^"]*results?/i,
    
    // Heading role ile
    /role="heading"[^>]*>~?(\d+[.,]?\d*)\s*sonuç/i,
    /role="heading"[^>]*>~?(\d+[.,]?\d*)\s*results?/i,
    
    // aria-level="3" ile
    /aria-level="3"[^>]*>~?(\d+[.,]?\d*)/i,
    
    // Genel pattern'ler (virgüllü sayılar dahil)
    />~?(\d+[.,]?\d*)\s+sonuç/i,
    />~?(\d+[.,]?\d*)\s+results?/i,
    /~?(\d+[.,]?\d*)\s+sonuç/i,
    /~?(\d+[.,]?\d*)\s+results?/i,
    /(\d+[.,]?\d*)\s+reklam/i,
    
    // ">50.000 sonuç" formatı
    />(\d+[.,]?\d*)\s+sonuç/i,
    />(\d+[.,]?\d*)\s+results?/i,
    
    // Basit pattern'ler (fallback)
    /(\d+)\s+sonuç/i,
    /(\d+)\s+results?/i,
    /(\d+)\s+reklam/i
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = html.match(pattern);
    if (match && match[1]) {
      const count = parseNumber(match[1]);
      if (count > 0) {
        console.log(`[Panela Background] Pattern ${i + 1} eşleşti: "${match[1]}" -> ${count}`);
        return count;
      }
    }
  }
  
  // Eğer hiçbir pattern eşleşmediyse, HTML'de "sonuç" veya "results" kelimesini ara
  const resultTextMatch = html.match(/(\d+[.,]?\d*)\s*(sonuç|results?)/i);
  if (resultTextMatch && resultTextMatch[1]) {
    const count = parseNumber(resultTextMatch[1]);
    if (count > 0) {
      console.log(`[Panela Background] Genel arama eşleşti: "${resultTextMatch[1]}" -> ${count}`);
      return count;
    }
  }
  
  console.warn('[Panela Background] Sonuç sayısı bulunamadı. HTML snippet:', html.substring(0, 500));
  return 0;
}
