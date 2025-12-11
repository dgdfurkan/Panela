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
  const patterns = [
    /aria-level="3"[^>]*>~?(\d+)/i,
    /~?(\d+)\s+sonuç/i,
    /(\d+)\s+results?/i,
    /(\d+)\s+reklam/i
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return 0;
}
