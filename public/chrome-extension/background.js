// Background Service Worker
// Arka planda API çağrıları yapar

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAdvertiser') {
    checkAdvertiserAds(request.advertiser, request.country, request.dateRange)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }
});

async function checkAdvertiserAds(advertiser, country, dateRange) {
  try {
    // Meta Ads Library URL'ini oluştur
    const url = buildAdsLibraryUrl(advertiser, country, dateRange);
    
    // Fetch ile sayfayı al (headless)
    const response = await fetch(url);
    const html = await response.text();
    
    // HTML'den sonuç sayısını parse et
    const resultCount = parseResultCount(html);
    
    return {
      advertiser,
      count: resultCount,
      url
    };
  } catch (error) {
    console.error('Error checking advertiser:', error);
    return {
      advertiser,
      count: 0,
      error: error.message
    };
  }
}

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

function parseResultCount(html) {
  // HTML'den "~300 sonuç" gibi metni bul
  const match = html.match(/~?(\d+)\s+sonuç/i) || html.match(/(\d+)\s+results?/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}
