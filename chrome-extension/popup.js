// Popup Script
document.addEventListener('DOMContentLoaded', () => {
  const filterButton = document.getElementById('filterButton');
  const checkButton = document.getElementById('checkButton');
  const checkButtonText = document.getElementById('checkButtonText');
  const pauseButton = document.getElementById('pauseButton');
  const resumeButton = document.getElementById('resumeButton');
  const controlButtons = document.getElementById('controlButtons');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsSummary = document.getElementById('resultsSummary');

  let currentTab = null;

  // Progress güncellemelerini dinle
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateProgress') {
      const current = request.current || 0;
      const total = request.total || 0;
      const progress = total > 0 ? Math.round((current / total) * 100) : 0;
      
      progressFill.style.width = progress + '%';
      progressText.textContent = `Kontrol ediliyor... ${current}/${total}`;
      
      // Sonuçları güncelle
      if (request.checked !== undefined) {
        resultsContainer.style.display = 'block';
        resultsSummary.innerHTML = `
          <strong>Kontrol Devam Ediyor</strong><br>
          ${request.checked || 0} sayfa kontrol edildi.<br>
          ${request.highCount || 0} sayfa 25+ reklam (renkli badge).<br>
          ${request.lowCount || 0} sayfa 25 altı reklam (gri badge).
        `;
      }
    }
  });

  // Durum kontrolü
  async function checkStatus() {
    if (!currentTab) return;
    
    chrome.tabs.sendMessage(currentTab.id, { action: 'getStatus' }, (response) => {
      if (response && !chrome.runtime.lastError) {
        if (response.isChecking && !response.isPaused) {
          controlButtons.style.display = 'flex';
          pauseButton.style.display = 'block';
          resumeButton.style.display = 'none';
          checkButton.disabled = true;
        } else if (response.isPaused) {
          controlButtons.style.display = 'flex';
          pauseButton.style.display = 'none';
          resumeButton.style.display = 'block';
          checkButton.disabled = true;
        }
      }
    });
  }

  // Filtreleme butonu
  filterButton.addEventListener('click', async () => {
    try {
      // Aktif tab'ı al
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;
      
      if (!tab.url.includes('facebook.com/ads/library')) {
        alert('Bu özellik sadece Meta Ads Library sayfalarında çalışır.');
        return;
      }

      // Butonu devre dışı bırak
      filterButton.disabled = true;
      filterButton.textContent = 'Filtreleniyor...';

      // Content script'e manuel filtreleme mesajı gönder
      chrome.tabs.sendMessage(tab.id, { action: 'manualFilter' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          alert('Sayfa yüklenmedi. Lütfen sayfayı yenileyin.');
          filterButton.disabled = false;
          filterButton.innerHTML = '<span class="btn-icon">🔍</span><span>Reklamları Filtrele</span>';
          return;
        }

        if (response && response.success) {
          filterButton.textContent = 'Filtrelendi!';
          setTimeout(() => {
            filterButton.disabled = false;
            filterButton.innerHTML = '<span class="btn-icon">🔍</span><span>Reklamları Filtrele</span>';
          }, 2000);
        } else {
          filterButton.disabled = false;
          filterButton.innerHTML = '<span class="btn-icon">🔍</span><span>Reklamları Filtrele</span>';
        }
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Bir hata oluştu: ' + error.message);
      filterButton.disabled = false;
      filterButton.innerHTML = '<span class="btn-icon">🔍</span><span>Reklamları Filtrele</span>';
    }
  });

  // Başlat
  checkButton.addEventListener('click', async () => {
    try {
      // Aktif tab'ı al
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;
      
      if (!tab.url.includes('facebook.com/ads/library')) {
        alert('Bu özellik sadece Meta Ads Library sayfalarında çalışır.');
        return;
      }

      // Butonu devre dışı bırak
      checkButton.disabled = true;
      checkButtonText.textContent = 'Kontrol ediliyor...';
      controlButtons.style.display = 'flex';
      pauseButton.style.display = 'block';
      resumeButton.style.display = 'none';
      progressContainer.style.display = 'block';
      resultsContainer.style.display = 'none';
      progressFill.style.width = '0%';

      // Content script'e mesaj gönder
      chrome.tabs.sendMessage(tab.id, { action: 'checkAdvertisers' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          alert('Sayfa yüklenmedi. Lütfen sayfayı yenileyin.');
          resetUI();
          return;
        }

        if (response && response.success) {
          if (response.paused) {
            progressText.textContent = `Durduruldu - ${response.current}/${response.total}`;
            pauseButton.style.display = 'none';
            resumeButton.style.display = 'block';
          } else {
            progressFill.style.width = '100%';
            progressText.textContent = 'Kontrol tamamlandı!';
            
            setTimeout(() => {
              resultsContainer.style.display = 'block';
              resultsSummary.innerHTML = `
                <strong>Kontrol Tamamlandı</strong><br>
                ${response.checked || 0} sayfa kontrol edildi.<br>
                ${response.highCount || 0} sayfa 25+ reklam bulundu (renkli badge).<br>
                ${response.lowCount || 0} sayfa 25 altı reklam (gri badge).
              `;
              resetUI();
            }, 500);
          }
        } else {
          alert('Kontrol sırasında bir hata oluştu: ' + (response?.error || 'Bilinmeyen hata'));
          resetUI();
        }
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Bir hata oluştu: ' + error.message);
      resetUI();
    }
  });

  // Durdur
  pauseButton.addEventListener('click', async () => {
    if (!currentTab) return;
    chrome.tabs.sendMessage(currentTab.id, { action: 'pauseChecking' }, () => {
      pauseButton.style.display = 'none';
      resumeButton.style.display = 'block';
      progressText.textContent = 'Durduruldu - Devam etmek için butona tıklayın';
    });
  });

  // Devam Et
  resumeButton.addEventListener('click', async () => {
    if (!currentTab) return;
    chrome.tabs.sendMessage(currentTab.id, { action: 'resumeChecking' }, (response) => {
      if (response && response.success) {
        pauseButton.style.display = 'block';
        resumeButton.style.display = 'none';
        progressText.textContent = 'Kontrol ediliyor...';
        
        // Tekrar kontrol başlat
        chrome.tabs.sendMessage(currentTab.id, { action: 'checkAdvertisers' }, (response) => {
          if (response && response.paused) {
            pauseButton.style.display = 'none';
            resumeButton.style.display = 'block';
          }
        });
      }
    });
  });

  function resetUI() {
    checkButton.disabled = false;
    checkButtonText.textContent = 'Sayfadakileri Kontrol Et';
    controlButtons.style.display = 'none';
  }

  // Sayfa açıldığında durumu kontrol et
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentTab = tabs[0];
      checkStatus();
    }
  });
});
