// content.js - GeneSymbol Highlighter Final Polish
let validSymbols = new Set();
let complexMapping = {};
let settings = {};
let highlightedOnPage = new Set();
const summaryCache = new Map();
let hideTimeout = null;
let lastHoveredSymbol = null;
let observer = null;

const tooltip = document.createElement('div');
tooltip.id = 'gene-symbol-tooltip';
Object.assign(tooltip.style, {
  position: 'absolute', display: 'none', backgroundColor: 'white', border: '1px solid #d1d5db',
  borderRadius: '10px', boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)', padding: '18px',
  zIndex: '2147483647', width: '380px', fontFamily: 'system-ui, sans-serif', fontSize: '14px',
  color: '#1f2937', lineHeight: '1.6', pointerEvents: 'auto'
});
document.body.appendChild(tooltip);

tooltip.addEventListener('mouseenter', () => { if (hideTimeout) clearTimeout(hideTimeout); });
tooltip.addEventListener('mouseleave', () => startHideTimer());

function init() {
  chrome.runtime.sendMessage({ action: 'getSymbols' }, (response) => {
    if (!response || !response.settings.enabled) return;
    
    settings = response.settings;
    if (!isWhitelisted(settings.whitelist)) return;

    validSymbols = new Set(response.symbols);
    complexMapping = response.mapping;
    highlightedOnPage.clear();
    
    highlightSymbols(document.body);
    
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutations) => {
      mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType === 1) highlightSymbols(node);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function isWhitelisted(whitelistStr) {
  if (!whitelistStr || whitelistStr.trim() === "") return true;
  const currentDomain = window.location.hostname;
  const list = whitelistStr.split(',').map(s => s.trim());
  return list.some(domain => currentDomain.includes(domain));
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    location.reload(); 
  }
});

function highlightSymbols(root) {
  const regex = /[a-zA-Z0-9-\u0370-\u03FF]{2,14}/g; 
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while(walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'].includes(node.parentElement.tagName) || 
        node.parentElement.closest('#gene-symbol-tooltip') || node.parentElement.closest('.gene-symbol-mark')) continue;
    nodes.push(node);
  }

  nodes.forEach(node => {
    const text = node.nodeValue;
    if (!/[a-zA-Z\u0370-\u03A9]/.test(text)) return; 
    let match;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let hasMatch = false;
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      const original = match[0];
      const normalized = normalizeSymbol(original);
      
      if (settings.caseMode === 'strict' && original !== original.toUpperCase()) continue;
      if (settings.caseMode === 'smart' && !/[A-Z\u0370-\u03A9]/.test(original[0])) continue;
      
      if (settings.highlightMode === 'first' && highlightedOnPage.has(normalized)) continue;

      if (['FIG', 'FIGS', 'TABLE', 'REF', 'REFS'].includes(normalized)) {
        const look = text.substring(match.index + original.length, match.index + original.length + 3);
        if (look.startsWith('.') || /^\s+[0-9]/.test(look)) continue;
      }

      const isBoundary = (!text[match.index - 1] || !/[a-zA-Z0-9-\u0370-\u03FF]/.test(text[match.index - 1])) && 
                         (!text[match.index + original.length] || !/[a-zA-Z0-9-\u0370-\u03FF]/.test(text[match.index + original.length]));

      if (isBoundary && (validSymbols.has(normalized) || validSymbols.has(normalized.replace(/-/g, '')))) {
        highlightedOnPage.add(normalized);
        hasMatch = true;
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
        
        const mark = document.createElement('mark');
        mark.className = 'gene-symbol-mark';
        mark.textContent = original;
        applyHighlightStyle(mark);
        mark.dataset.symbol = normalized;
        
        const trigger = settings.triggerMode === 'click' ? 'click' : 'mouseenter';
        mark.addEventListener(trigger, (e) => handleInteraction(e, original, normalized));
        if (settings.triggerMode === 'hover') mark.addEventListener('mouseleave', startHideTimer);
        
        fragment.appendChild(mark);
        lastIndex = regex.lastIndex;
      }
    }
    if (hasMatch) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      node.replaceWith(fragment);
    }
  });
}

function applyHighlightStyle(el) {
  if (settings.visualStyle === 'bg') {
    el.style.backgroundColor = hexToRgba(settings.highlightColor, settings.highlightOpacity);
    el.style.borderBottom = '1px dashed orange';
  } else {
    el.style.backgroundColor = 'transparent';
    el.style.borderBottom = `2px solid ${settings.highlightColor}`;
  }
  el.style.cursor = 'help';
  el.style.borderRadius = '2px';
  el.style.padding = '0 2px';
}

function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function handleInteraction(e, original, normalized) {
  if (hideTimeout) clearTimeout(hideTimeout);
  lastHoveredSymbol = normalized;
  const rect = e.target.getBoundingClientRect();
  positionTooltip(rect);
  tooltip.style.display = 'block';
  
  if (summaryCache.has(normalized)) renderData(original, summaryCache.get(normalized));
  else { renderLoading(original); fetchData(original, normalized); }
}

function startHideTimer() {
  if (hideTimeout) clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => { tooltip.style.display = 'none'; }, 240);
}

function positionTooltip(targetRect) {
  const margin = 12;
  let left = targetRect.left + window.scrollX;
  let top = targetRect.bottom + margin + window.scrollY;
  if (left + 380 > window.innerWidth + window.scrollX) left = window.innerWidth + window.scrollX - 400;
  tooltip.style.left = `${Math.max(10, left)}px`;
  tooltip.style.top = `${top}px`;
}

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function fetchData(displaySymbol, symbol) {
  let querySymbol = complexMapping[symbol] || symbol;
  if (settings.organism === '10090' && settings.caseMode !== 'permissive') {
    querySymbol = querySymbol.charAt(0).toUpperCase() + querySymbol.slice(1).toLowerCase();
  }

  const apiKey = settings.ncbiKey ? `&api_key=${settings.ncbiKey}` : '';

  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term=${querySymbol}[gene]+AND+txid${settings.organism}[orgn]&retmode=json${apiKey}`;
    const searchRes = await fetch(searchUrl).then(r => r.json());
    const geneId = searchRes.esearchresult.idlist?.[0];

    if (geneId) {
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json${apiKey}`;
      const summaryData = await fetch(summaryUrl).then(r => r.json());
      const geneInfo = summaryData.result[geneId];
      const result = {
        symbol: geneInfo.symbol,
        name: geneInfo.description,
        summary: geneInfo.summary,
        geneId: geneId,
        upLink: `https://www.uniprot.org/uniprotkb/search?query=gene:${querySymbol}+AND+taxonomy_id:${settings.organism}`,
        ncbiLink: `https://www.ncbi.nlm.nih.gov/gene/${geneId}`
      };
      summaryCache.set(symbol, result);
      if (lastHoveredSymbol === symbol) renderData(displaySymbol, result);
    } else {
      renderError(displaySymbol, symbol, "No NCBI record found.");
    }
  } catch (err) { renderError(displaySymbol, symbol, "Service busy."); }
}

function renderLoading(symbol) {
  tooltip.innerHTML = `<div style="font-weight:700; margin-bottom:10px;">${sanitize(symbol)}</div><div style="height:12px; width:100%; background:#f3f4f6; border-radius:4px; animation: pulse 1.5s infinite;"></div>`;
}

function renderData(displaySymbol, data) {
  const isCompact = settings.detailLevel === 'compact';
  const safeSymbol = sanitize(displaySymbol);
  const safeName = sanitize(data.name);
  const safeSummary = sanitize(data.summary) || "No authoritative RefSeq summary available.";
  const safeGeneId = sanitize(data.geneId);
  tooltip.innerHTML = `
    <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items: flex-start;">
      <div style="max-width: 70%;">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="font-size:20px; font-weight:800; color:#111827;">${safeSymbol}</div>
          <button id="gene-copy-symbol" style="border:none; background:none; cursor:pointer; font-size:12px; color:#9ca3af;" title="Copy Symbol">📋</button>
        </div>
        <div style="font-size:12px; color:#4b5563; font-weight:600; line-height:1.2; margin-top:4px;">${safeName}</div>
      </div>
      <div style="background:#eff6ff; color:#1e40af; font-size:10px; padding:2px 6px; border-radius:4px; border:1px solid #bfdbfe;">NCBI:${safeGeneId}</div>
    </div>
    ${!isCompact ? `
    <div style="font-size:13.5px; color:#374151; margin-bottom:18px; max-height:200px; overflow-y:auto; border-left: 3px solid #e5e7eb; padding-left: 12px; font-style: italic;">
      ${safeSummary}
      <button id="gene-copy-summary" style="display:block; margin-top:8px; font-size:11px; color:#2563eb; background:none; border:none; cursor:pointer; padding:0;">[Copy Summary]</button>
    </div>` : ''}
    <div style="display:flex; gap:12px; border-top:1px solid #f3f4f6; padding-top:14px; flex-wrap: wrap;">
      <a href="${sanitize(data.ncbiLink)}" target="_blank" style="color:#2563eb; font-weight:700; text-decoration:none;">NCBI Gene ↗</a>
      <a href="${sanitize(data.upLink)}" target="_blank" style="color:#2563eb; font-weight:700; text-decoration:none;">UniProt ↗</a>
      <a href="https://www.google.com/search?q=${safeSymbol}+gene+${settings.organism === '9606' ? 'human' : 'mouse'}" target="_blank" style="color:#2563eb; font-weight:700; text-decoration:none;">Google ↗</a>
    </div>`;

  document.getElementById('gene-copy-symbol').onclick = () => navigator.clipboard.writeText(displaySymbol);
  const copySum = document.getElementById('gene-copy-summary');
  if (copySum) copySum.onclick = () => navigator.clipboard.writeText(data.summary);
}

function renderError(displaySymbol, symbol, msg) {
  const safeSymbol = sanitize(displaySymbol);
  const safeMsg = sanitize(msg);
  const google = `https://www.google.com/search?q=${safeSymbol}+gene`;
  tooltip.innerHTML = `<div style="font-weight:800; font-size:20px; margin-bottom:8px;">${safeSymbol}</div><div style="color:#991b1b; font-size:13px; background:#fef2f2; padding:12px; border-radius:8px; margin-bottom:15px; border: 1px solid #fee2e2;">${safeMsg}</div><a href="${google}" target="_blank" style="color:#2563eb; font-weight:700; text-decoration:none;">Search Google ↗</a>`;
}

function normalizeSymbol(text) {
  const greekMap = { 'α': 'A', 'β': 'B', 'γ': 'G', 'δ': 'D', 'ε': 'E', 'ζ': 'Z', 'η': 'E', 'θ': 'TH', 'ι': 'I', 'κ': 'K', 'λ': 'L', 'μ': 'M', 'ν': 'N', 'ξ': 'X', 'ο': 'O', 'π': 'P', 'ρ': 'R', 'ς': 'S', 'σ': 'S', 'τ': 'T', 'υ': 'Y', 'φ': 'PH', 'χ': 'CH', 'ψ': 'PS', 'ω': 'O' };
  let n = ''; for (let c of text) n += greekMap[c] || c; return n.toUpperCase();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getHighlightCount') {
    sendResponse({ count: highlightedOnPage.size });
  }
  if (request.action === 'getSymbolsList') {
    sendResponse({ symbols: Array.from(highlightedOnPage) });
  }
});

init();