document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleEnabled');
  const openOptions = document.getElementById('openOptions');

  // Load current state
  chrome.storage.sync.get('enabled', (data) => {
    toggle.checked = !!data.enabled;
    if (data.enabled) updateCount();
  });

  function updateCount() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getHighlightCount' }, (response) => {
          if (chrome.runtime.lastError) {
            document.getElementById('pageCount').style.display = 'none';
            return;
          }
          if (response && response.count !== undefined) {
            document.getElementById('countValue').textContent = response.count;
          }
        });
      }
    });
  }

  // Sync toggle if changed externally (e.g. shortcut)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.enabled) {
      toggle.checked = changes.enabled.newValue;
    }
  });

  // Toggle state
  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
  });

  // Open options
  openOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('copySymbols').addEventListener('click', (e) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getSymbolsList' }, (response) => {
          if (response && response.symbols) {
            navigator.clipboard.writeText(response.symbols.join(', '));
            const btn = e.target;
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = original; }, 2000);
          }
        });
      }
    });
  });
});