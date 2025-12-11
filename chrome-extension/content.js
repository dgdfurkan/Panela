// Panela Ads Library Filter - Content Script
// Sadece "Shop Now" ve "Şimdi alışveriş yap" butonları olan reklamları gösterir

(function() {
  'use strict';

  const TARGET_BUTTONS = ['Shop Now', 'Şimdi alışveriş yap'];
  let isFiltering = false;
  let isCheckingAdvertisers = false;
  
  // Cache için localStorage kullan
  function getCacheKey(advertiser, country, dateRange) {
    return `panela_${advertiser}_${country}_${dateRange.start}_${dateRange.end}`;
  }
  
  function getCachedResult(key) {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        // 1 saat içindeyse cache'i kullan
        if (Date.now() - data.timestamp < 3600000) {
          return data.result;
        }
      }
    } catch (e) {
      console.error('[Panela] Cache okuma hatası:', e);
    }
    return null;
  }
  
  function setCachedResult(key, result) {
    try {
      localStorage.setItem(key, JSON.stringify({
        result,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('[Panela] Cache yazma hatası:', e);
    }
  }

  // Reklam kartını kontrol et - hedef butonları içeriyor mu?
  function hasTargetButton(adCard) {
    // Tüm button ve link elementlerini bul
    const buttons = adCard.querySelectorAll('button, a[role="button"], span[role="button"]');
    const links = adCard.querySelectorAll('a');
    
    const allClickableElements = [...buttons, ...links];
    
    for (const element of allClickableElements) {
      const text = element.textContent?.trim() || '';
      const ariaLabel = element.getAttribute('aria-label') || '';
      const title = element.getAttribute('title') || '';
      
      const combinedText = `${text} ${ariaLabel} ${title}`.toLowerCase();
      
      // Hedef buton metinlerini kontrol et
      for (const target of TARGET_BUTTONS) {
        if (combinedText.includes(target.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Reklam kartlarını bul ve filtrele
  function filterAds() {
    if (isFiltering) return;
    isFiltering = true;

    try {
      // Meta Ads Library'nin reklam kartlarını bul - çeşitli selector'lar dene
      let adContainers = document.querySelectorAll('[role="article"]');
      
      // Eğer article bulunamazsa, alternatif selector'lar dene
      if (adContainers.length === 0) {
        adContainers = document.querySelectorAll('[data-pagelet*="AdCard"], [data-pagelet*="ad"]');
      }
      
      // Hala bulunamazsa, genel kart yapısını ara
      if (adContainers.length === 0) {
        // Meta Ads Library'de reklamlar genellikle belirli bir yapıda
        const mainContainer = document.querySelector('[role="main"]') || document.body;
        adContainers = mainContainer.querySelectorAll('div[style*="position"] > div, div[data-pagelet]');
      }
      
      let filteredCount = 0;
      let removedCount = 0;

      adContainers.forEach(container => {
        // Container'ın bir reklam kartı olup olmadığını kontrol et
        const hasImage = container.querySelector('img');
        const hasLink = container.querySelector('a[href*="/ads/library"]');
        const hasAdContent = hasImage || hasLink || container.textContent.length > 100;
        
        // Zaten gizlenmişse atla
        if (container.style.display === 'none' && !hasTargetButton(container)) {
          return;
        }

        if (hasAdContent) {
          if (hasTargetButton(container)) {
            // Hedef butonu var, göster
            container.style.display = '';
            container.style.visibility = 'visible';
            filteredCount++;
          } else {
            // Hedef butonu yok, gizle
            container.style.display = 'none';
            container.style.visibility = 'hidden';
            removedCount++;
          }
        }
      });

      // Eğer hiç reklam bulunamadıysa, daha geniş bir arama yap
      if (filteredCount === 0 && removedCount === 0) {
        // Tüm div'leri kontrol et (son çare)
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
          // Sadece görünür ve yeterince büyük div'leri kontrol et
          if (div.offsetHeight > 200 && div.offsetWidth > 200) {
            if (hasTargetButton(div)) {
              div.style.display = '';
              filteredCount++;
            } else if (div.querySelector('img') && div.textContent.length > 50) {
              // Reklam benzeri içerik varsa gizle
              div.style.display = 'none';
              removedCount++;
            }
          }
        });
      }

      if (filteredCount > 0 || removedCount > 0) {
        console.log(`[Panela Filter] Filtrelendi: ${filteredCount} gösterildi, ${removedCount} gizlendi`);
      }
    } catch (error) {
      console.error('[Panela Filter] Hata:', error);
    } finally {
      isFiltering = false;
    }
  }

  // MutationObserver ile yeni reklamlar yüklendiğinde otomatik filtrele
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldFilter = false;
      
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          // Yeni node'lar eklendi, filtrelemeyi tetikle
          shouldFilter = true;
        }
      });

      if (shouldFilter) {
        // Debounce ile filtreleme
        clearTimeout(window.panelaFilterTimeout);
        window.panelaFilterTimeout = setTimeout(() => {
          filterAds();
        }, 300);
      }
    });

    // Ana container'ı gözle
    const targetNode = document.body;
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // Sayfa yüklendiğinde filtrelemeyi başlat
  function init() {
    // Sayfa tamamen yüklendiğinde bekle
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(filterAds, 1000);
        setupObserver();
      });
    } else {
      setTimeout(filterAds, 1000);
      setupObserver();
    }

    // Scroll ile yeni içerik yüklendiğinde de filtrele
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        filterAds();
      }, 500);
    });
  }

  // ============================================
  // ADVERTISER KONTROL SİSTEMİ
  // ============================================

  // Advertiser linklerini bul - Daha geniş ve agresif arama
  function findAdvertiserLinks(adCard) {
    // Tüm linkleri bul (href attribute'u olan tüm a elementleri)
    const allLinks = adCard.querySelectorAll('a[href]');
    const advertisers = [];
    const foundUsernames = new Set();
    
    allLinks.forEach(link => {
      let href = link.getAttribute('href');
      if (!href) return;
      
      // Relative URL'leri absolute'ye çevir
      if (href.startsWith('/')) {
        href = 'https://www.facebook.com' + href;
      }
      
      // Facebook sayfa linklerini bul
      if (href.includes('facebook.com/')) {
        // Ads library, login, help gibi sayfaları filtrele
        const excluded = ['/ads/library', '/login', '/help', '/privacy', '/terms', '/about', '/pages', '/groups', '/events', '/watch', '/marketplace', '/games'];
        const isExcluded = excluded.some(ex => href.includes(ex));
        
        if (!isExcluded) {
          // URL'den advertiser username'ini çıkar
          let match = href.match(/facebook\.com\/([^\/\?&#]+)/);
          if (match && match[1]) {
            const username = match[1];
            
            // Geçersiz username'leri filtrele
            const invalid = ['www', 'ads', 'login', 'help', 'privacy', 'terms', 'about', 'pages', 'groups', 'events', 'watch', 'marketplace', 'games', 'profile.php'];
            
            // Username uzunluğu kontrolü (çok kısa veya çok uzun olmasın)
            if (username.length >= 3 && username.length <= 50 && 
                !invalid.includes(username.toLowerCase()) && 
                !foundUsernames.has(username) &&
                !username.match(/^\d+$/)) { // Sadece sayılardan oluşan username'leri atla
              
              foundUsernames.add(username);
              advertisers.push({
                username: username,
                url: href.startsWith('http') ? href : `https://${href}`,
                card: adCard
              });
              
              console.log(`[Panela] Advertiser bulundu: ${username} - ${href}`);
            }
          }
        }
      }
    });
    
    // Eğer link bulunamadıysa, text içinde de ara
    if (advertisers.length === 0) {
      const cardText = adCard.textContent || '';
      // "facebook.com/username" pattern'ini ara
      const textMatch = cardText.match(/facebook\.com\/([a-zA-Z0-9._-]+)/);
      if (textMatch && textMatch[1]) {
        const username = textMatch[1];
        if (username.length >= 3 && username.length <= 50) {
          advertisers.push({
            username: username,
            url: `https://www.facebook.com/${username}`,
            card: adCard
          });
          console.log(`[Panela] Text'ten advertiser bulundu: ${username}`);
        }
      }
    }
    
    return advertisers;
  }

  // URL'den tarih aralığı ve ülke bilgisini al
  function getCurrentSearchParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const country = urlParams.get('country') || 'GB';
    const startDate = urlParams.get('start_date[min]') || '';
    const endDate = urlParams.get('start_date[max]') || '';
    
    return {
      country,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
  }

  // Badge ekle
  function addBadge(adCard, count, url) {
    // Zaten badge varsa ekleme
    if (adCard.querySelector('.panela-badge')) return;
    
    const badge = document.createElement('div');
    badge.className = 'panela-badge';
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      color: white;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    `;
    
    if (count >= 25) {
      // 25+ için renkli badge (yeşil gradient)
      badge.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      badge.textContent = count >= 100 ? '100+' : count >= 50 ? '50+' : '25+';
      badge.title = `${count} reklam bulundu - Tıkla ve gör`;
      badge.style.cursor = 'pointer';
      badge.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (url) {
          window.open(url, '_blank');
        }
      };
    } else {
      // 25 altı için gri badge (tıklanamaz)
      badge.style.background = '#94a3b8';
      badge.textContent = count > 0 ? count.toString() : '?';
      badge.title = `${count} reklam bulundu`;
      badge.style.cursor = 'default';
    }
    
    badge.onmouseenter = () => {
      badge.style.transform = 'scale(1.1)';
    };
    badge.onmouseleave = () => {
      badge.style.transform = 'scale(1)';
    };
    
    // Reklam kartına pozisyon relative ekle
    const cardStyle = window.getComputedStyle(adCard);
    if (cardStyle.position === 'static') {
      adCard.style.position = 'relative';
    }
    
    adCard.appendChild(badge);
  }

  // Advertiser kontrol et - Background script üzerinden
  async function checkAdvertiser(advertiser, params) {
    // Cache kontrolü
    const cacheKey = getCacheKey(advertiser.username, params.country, params.dateRange);
    const cached = getCachedResult(cacheKey);
    if (cached) {
      console.log(`[Panela] Cache'den alındı: ${advertiser.username} - ${cached.count} sonuç`);
      return cached;
    }
    
    try {
      console.log(`[Panela] Kontrol ediliyor: ${advertiser.username}`);
      
      // Background script'e mesaj gönder
      const response = await chrome.runtime.sendMessage({
        action: 'checkAdvertiser',
        advertiser: advertiser.username,
        country: params.country,
        dateRange: params.dateRange
      });
      
      if (response && response.success && response.result) {
        const result = {
          advertiser: advertiser.username,
          count: response.result.count || 0,
          url: response.result.url
        };
        
        // Cache'e kaydet
        setCachedResult(cacheKey, result);
        
        console.log(`[Panela] Sonuç: ${advertiser.username} - ${result.count} reklam`);
        return result;
      } else {
        console.warn(`[Panela] Kontrol başarısız: ${advertiser.username}`);
        return null;
      }
    } catch (error) {
      console.error('[Panela] Advertiser kontrol hatası:', error);
      return null;
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
    // "~300 sonuç" veya "300 results" gibi metni bul
    const patterns = [
      /~?(\d+)\s+sonuç/i,
      /(\d+)\s+results?/i,
      /aria-level="3"[^>]*>~?(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    return 0;
  }

  // Kontrol durumu - Sıralı kart kontrolü için
  let isPaused = false;
  let currentCardIndex = 0;
  let adCardsList = [];
  let checkedCount = 0;
  let highCount = 0;
  let lowCount = 0;
  
  // Sayfadaki tüm reklamları kontrol et - İlk karttan başlayarak sıralı
  async function checkAllAdvertisers() {
    if (isCheckingAdvertisers && !isPaused) {
      console.log('[Panela] Zaten kontrol ediliyor...');
      return;
    }
    
    // Eğer pause edilmişse ve devam ediliyorsa
    if (isPaused) {
      isPaused = false;
      console.log('[Panela] Kontrol devam ediyor...');
    } else {
      // Yeni kontrol başlat
      isCheckingAdvertisers = true;
      currentCardIndex = 0;
      adCardsList = [];
      checkedCount = 0;
      highCount = 0;
      lowCount = 0;
      
      // Progress'i sıfırla
      chrome.runtime.sendMessage({
        action: 'updateProgress',
        checked: 0,
        highCount: 0,
        lowCount: 0,
        total: 0,
        current: 0
      }).catch(() => {});
    }
    
    try {
      const params = getCurrentSearchParams();
      console.log('[Panela] Arama parametreleri:', params);
      
      // Eğer reklam kartları henüz toplanmadıysa, topla
      if (adCardsList.length === 0) {
        // Sadece görünür reklam kartlarını al (Shop Now/Şimdi alışveriş yap olanlar)
        let adCards = Array.from(document.querySelectorAll('[role="article"]')).filter(card => {
          return card.style.display !== 'none' && hasTargetButton(card);
        });
        
        console.log(`[Panela] İlk aramada ${adCards.length} reklam kartı bulundu (role="article")`);
        
        // Eğer article bulunamazsa, alternatif selector'lar dene
        if (adCards.length === 0) {
          // Tüm div'leri kontrol et
          const allDivs = document.querySelectorAll('div');
          adCards = Array.from(allDivs).filter(card => {
            // Görünür mü?
            if (card.style.display === 'none' || card.offsetHeight === 0) return false;
            
            // Reklam içeriği var mı?
            const hasImage = card.querySelector('img');
            const hasAdContent = hasImage || card.textContent.length > 100;
            
            // Shop Now butonu var mı?
            const hasButton = hasTargetButton(card);
            
            return hasAdContent && hasButton;
          });
          
          console.log(`[Panela] Alternatif aramada ${adCards.length} reklam kartı bulundu`);
        }
        
        adCardsList = adCards;
        console.log(`[Panela] Toplam ${adCardsList.length} reklam kartı bulundu`);
      }
      
      // İlk karttan başlayarak sırayla kontrol et
      for (let i = currentCardIndex; i < adCardsList.length; i++) {
        // Pause kontrolü
        if (isPaused) {
          currentCardIndex = i;
          console.log(`[Panela] Kontrol duraklatıldı. Kart ${i + 1}/${adCardsList.length}`);
          return {
            success: true,
            paused: true,
            checked: checkedCount,
            highCount,
            lowCount,
            total: adCardsList.length,
            current: i + 1
          };
        }
        
        const card = adCardsList[i];
        console.log(`[Panela] Kart ${i + 1}/${adCardsList.length} kontrol ediliyor...`);
        
        // Bu kart için advertiser linklerini bul
        const advertisers = findAdvertiserLinks(card);
        
        if (advertisers.length === 0) {
          console.log(`[Panela] Kart ${i + 1}: Advertiser bulunamadı`);
          // Advertiser bulunamadıysa bir sonraki karta geç
          continue;
        }
        
        // İlk advertiser'ı kullan (genelde bir kartta bir advertiser olur)
        const advertiser = advertisers[0];
        console.log(`[Panela] Kart ${i + 1}: Advertiser bulundu: ${advertiser.username}`);
        
        // Advertiser'ı kontrol et - ASYNC BEKLE (sonucu beklemeden 0 dememeli)
        try {
          const result = await checkAdvertiser(advertiser, params);
          
          if (result && result.count !== undefined) {
            checkedCount++;
            const count = result.count;
            
            console.log(`[Panela] Kart ${i + 1}: ${advertiser.username} - ${count} reklam bulundu`);
            
            // Badge ekle - 25+ için renkli, 25 altı için gri
            if (count >= 25) {
              highCount++;
              addBadge(card, count, result.url);
            } else {
              lowCount++;
              addBadge(card, count, result.url);
            }
            
            // Progress güncelle
            chrome.runtime.sendMessage({
              action: 'updateProgress',
              checked: checkedCount,
              highCount,
              lowCount,
              total: adCardsList.length,
              current: i + 1
            }).catch(() => {});
          } else {
            console.warn(`[Panela] Kart ${i + 1}: Sonuç alınamadı`);
          }
        } catch (error) {
          console.error(`[Panela] Kart ${i + 1} kontrol hatası:`, error);
          // Hata olsa bile devam et
        }
        
        // Her kontrol arasında kısa bir bekleme (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Tüm kontroller tamamlandı
      isCheckingAdvertisers = false;
      console.log(`[Panela] Kontrol tamamlandı! ${checkedCount} sayfa kontrol edildi.`);
      
      // Final progress güncelle
      chrome.runtime.sendMessage({
        action: 'updateProgress',
        checked: checkedCount,
        highCount,
        lowCount,
        total: adCardsList.length,
        current: adCardsList.length
      }).catch(() => {});
      
      return {
        success: true,
        checked: checkedCount,
        highCount,
        lowCount,
        total: adCardsList.length
      };
    } catch (error) {
      console.error('[Panela] Kontrol hatası:', error);
      isCheckingAdvertisers = false;
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Kontrolü durdur
  function pauseChecking() {
    isPaused = true;
    console.log('[Panela] Kontrol duraklatıldı');
  }
  
  // Kontrolü devam ettir
  function resumeChecking() {
    if (isPaused) {
      console.log('[Panela] Kontrol devam ettiriliyor...');
      isPaused = false;
      // Kontrolü devam ettir
      checkAllAdvertisers();
    }
  }

  // Popup'tan gelen mesajları dinle
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkAdvertisers') {
      checkAllAdvertisers().then(result => {
        sendResponse(result);
      });
      return true; // Async response
    }
    
    if (request.action === 'pauseChecking') {
      pauseChecking();
      sendResponse({ success: true });
      return true;
    }
    
    if (request.action === 'resumeChecking') {
      resumeChecking();
      sendResponse({ success: true });
      return true;
    }
    
    if (request.action === 'getStatus') {
      sendResponse({
        isChecking: isCheckingAdvertisers,
        isPaused: isPaused,
        current: currentCardIndex + 1,
        total: adCardsList.length,
        checked: checkedCount,
        highCount,
        lowCount
      });
      return true;
    }
  });

  // Scroll ile yeni reklamlar geldiğinde otomatik kontrol
  let lastCheckedCount = 0;
  let autoCheckTimeout = null;
  
  function autoCheckNewAds() {
    const currentAds = document.querySelectorAll('[role="article"]:not([style*="display: none"])').length;
    
    if (currentAds > lastCheckedCount && !isCheckingAdvertisers) {
      // Yeni reklamlar var, kontrol et (debounce ile)
      clearTimeout(autoCheckTimeout);
      autoCheckTimeout = setTimeout(() => {
        checkAllAdvertisers().then(() => {
          lastCheckedCount = currentAds;
        });
      }, 3000); // 3 saniye bekle (kullanıcı scroll ederken sürekli tetiklenmesin)
    }
  }

  // Scroll observer'ı güncelle
  const originalObserver = setupObserver();
  const scrollObserver = new MutationObserver(() => {
    autoCheckNewAds();
  });
  scrollObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // İlk yüklemede de kontrol et
  setTimeout(() => {
    const initialAds = document.querySelectorAll('[role="article"]:not([style*="display: none"])').length;
    lastCheckedCount = initialAds;
  }, 2000);

  // Başlat
  init();
})();
