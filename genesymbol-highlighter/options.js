const fieldIds = [
  'organism', 'highlightColor', 'highlightOpacity', 'highlightMode', 
  'triggerMode', 'visualStyle', 'caseMode', 'detailLevel', 'whitelist', 'ncbiKey'
];

const fields = {};
fieldIds.forEach(id => fields[id] = document.getElementById(id));

const previewInner = document.getElementById('preview-inner');
const testSymbols = [document.getElementById('test-symbol'), document.getElementById('test-symbol-2')];

function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function updatePreview() {
  const color = fields.highlightColor.value;
  const opacity = fields.highlightOpacity.value;
  const rgba = hexToRgba(color, opacity);
  const isBg = fields.visualStyle.value === 'bg';

  previewInner.style.backgroundColor = rgba;

  testSymbols.forEach(el => {
    if (isBg) {
      el.style.backgroundColor = rgba;
      el.style.borderBottom = '1px dashed orange';
    } else {
      el.style.backgroundColor = 'transparent';
      el.style.borderBottom = `2px solid ${color}`;
    }
  });
}

chrome.storage.sync.get(null, (settings) => {
  fieldIds.forEach(id => {
    if (settings[id] !== undefined) fields[id].value = settings[id];
  });
  updatePreview();
});

fieldIds.forEach(id => {
  fields[id].addEventListener('input', () => {
    chrome.storage.sync.set({ [id]: fields[id].value });
    updatePreview();
  });
});

document.getElementById('reset-defaults').addEventListener('click', () => {
  if (confirm('Reset all settings to default?')) {
    chrome.storage.sync.clear(() => {
      location.reload();
    });
  }
});

document.getElementById('export-settings').addEventListener('click', () => {
  chrome.storage.sync.get(null, (settings) => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genesymbol-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

const importFile = document.getElementById('import-file');
document.getElementById('import-settings').addEventListener('click', () => importFile.click());

importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const settings = JSON.parse(event.target.result);
      chrome.storage.sync.set(settings, () => {
        alert('Settings imported successfully!');
        location.reload();
      });
    } catch (err) {
      alert('Failed to parse settings file.');
    }
  };
  reader.readAsText(file);
});

document.getElementById('refresh-cache').addEventListener('click', (e) => {
  const btn = e.target;
  const originalText = btn.textContent;
  btn.textContent = 'Refreshing...';
  btn.disabled = true;
  
  chrome.runtime.sendMessage({ action: 'refreshCache' }, (response) => {
    btn.textContent = response && response.success ? 'Success!' : 'Failed';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2000);
  });
});
