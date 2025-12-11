// Background Service Worker
// Arka planda extension yönetimi

// Extension yüklendiğinde
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Panela] Extension yüklendi');
});

// Mesaj dinleyici (gelecekte kullanılabilir)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // İleride gerekirse buraya eklenebilir
  return true;
});
