// Panela Ads Library Filter - Content Script
// Sadece "Shop Now" ve "Şimdi alışveriş yap" butonları olan reklamları gösterir

(function() {
  'use strict';

  const TARGET_BUTTONS = ['Shop Now', 'Şimdi alışveriş yap'];
  let isFiltering = false;

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

  // Header'ı scroll'da gizle/göster
  function setupScrollHide() {
    let lastScrollTop = 0;
    let scrollTimeout;
    const headerSelector = '.x6s0dn4.x9f619.x78zum5.x2lah0s.x5yr21d.xdj266r.x11t971q.xat24cr.xvc5jky.xr8eajr.x1dr75xp.xz9dl7a.xp48ta0.xsag5q8.xtssl2i.x1n2onr6.xh8yej3.x10s2t04.x13tfk3b.x2i0hdy.x1jkuegs';
    
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const header = document.querySelector(headerSelector);
        
        if (!header) return;
        
        // Scroll threshold - 50px'den fazla scroll yapıldıysa
        if (scrollTop > 50) {
          if (scrollTop > lastScrollTop) {
            // Aşağı scroll - gizle
            header.classList.remove('panela-header-visible');
            header.classList.add('panela-header-hidden');
          } else {
            // Yukarı scroll - göster
            header.classList.remove('panela-header-hidden');
            header.classList.add('panela-header-visible');
          }
        } else {
          // En üstte - her zaman göster
          header.classList.remove('panela-header-hidden');
          header.classList.add('panela-header-visible');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
      }, 10); // Throttle
    }, { passive: true });
  }

  // Sayfa yüklendiğinde filtrelemeyi başlat
  function init() {
    // Sayfa tamamen yüklendiğinde bekle
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          filterAds();
          setupScrollHide();
        }, 1000);
        setupObserver();
      });
    } else {
      setTimeout(() => {
        filterAds();
        setupScrollHide();
      }, 1000);
      setupObserver();
    }

    // Scroll ile yeni içerik yüklendiğinde de filtrele
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        filterAds();
      }, 500);
    }, { passive: true });
  }

  // Başlat
  init();
})();
