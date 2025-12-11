// Popup Script
document.addEventListener('DOMContentLoaded', () => {
  const checkButton = document.getElementById('checkButton');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsSummary = document.getElementById('resultsSummary');

  checkButton.addEventListener('click', async () => {
    try {
      // Aktif tab'ı al
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('facebook.com/ads/library')) {
        alert('Bu özellik sadece Meta Ads Library sayfalarında çalışır.');
        return;
      }

      // Butonu devre dışı bırak
      checkButton.disabled = true;
      checkButton.textContent = 'Kontrol ediliyor...';
      progressContainer.style.display = 'block';
      resultsContainer.style.display = 'none';

      // Content script'e mesaj gönder
      chrome.tabs.sendMessage(tab.id, { action: 'checkAdvertisers' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          alert('Sayfa yüklenmedi. Lütfen sayfayı yenileyin.');
          checkButton.disabled = false;
          checkButton.innerHTML = '<span class="btn-icon">🔍</span><span>Sayfadakileri Kontrol Et</span>';
          progressContainer.style.display = 'none';
          return;
        }

        if (response && response.success) {
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
            checkButton.disabled = false;
            checkButton.innerHTML = '<span class="btn-icon">🔍</span><span>Sayfadakileri Kontrol Et</span>';
          }, 500);
        } else {
          alert('Kontrol sırasında bir hata oluştu.');
          checkButton.disabled = false;
          checkButton.innerHTML = '<span class="btn-icon">🔍</span><span>Sayfadakileri Kontrol Et</span>';
          progressContainer.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Bir hata oluştu: ' + error.message);
      checkButton.disabled = false;
      checkButton.innerHTML = '<span class="btn-icon">🔍</span><span>Sayfadakileri Kontrol Et</span>';
      progressContainer.style.display = 'none';
    }
  });
});
