// background.js - Focused Life Science Whitelist
const complexMapping = {
  'CD3': 'CD3E', 'CD8': 'CD8A', 'CD4': 'CD4', 'CD16': 'FCGR3A',
  'CD19': 'CD19', 'MHC': 'HLA-A', 'TCR': 'TRAC', 'BCR': 'CD79A',
  'NFKB': 'NFKB1', 'NF-KB': 'NFKB1', 'P53': 'TP53', 'HER2': 'ERBB2',
  'STAT3': 'STAT3', 'MYC': 'MYC', 'EGFR': 'EGFR', 'AKT': 'AKT1'
};

const lifeScienceWhitelist = [
  'nature.com', 'science.org', 'pnas.org', 'plos.org', 'cell.com',
  'biorxiv.org', 'medrxiv.org', 'zenodo.org', 'figshare.com',
  'pubmed.ncbi.nlm.nih.gov', 'ncbi.nlm.nih.gov', 'uniprot.org', 'europepmc.org', 
  'bioinformatics.org', 'genome.gov', 'pubchem.ncbi.nlm.nih.gov',
  'thelancet.com', 'nejm.org', 'bmj.com', 'jama.com',
  'sciencedirect.com', 'wiley.com', 'springer.com', 'frontiersin.org', 'mdpi.com', 'embo.org',
  'amsterdamumc.org', 'amsterdamumc.nl', 'nih.gov', 'cdc.gov', 'who.int'
].join(', ');

async function refreshSymbolCache(taxId) {
  try {
    const tsvUrl = `https://rest.uniprot.org/uniprotkb/stream?format=tsv&fields=gene_names&query=(taxonomy_id:${taxId})+AND+(reviewed:true)`;
    const response = await fetch(tsvUrl);
    const text = await response.text();
    const symbols = new Set();
    Object.keys(complexMapping).forEach(k => symbols.add(k));
    for (let i = 1; i <= 400; i++) symbols.add(`CD${i}`);
    text.split('\n').forEach((line, index) => {
      if (index === 0 || !line.trim()) return;
      const names = line.split('\t')[0].replace(/[()/]/g, ' ').split(/\s+/);
      names.forEach(name => {
        const clean = name.trim().toUpperCase();
        if (clean.length > 1) {
          symbols.add(clean);
          if (clean.includes('-')) symbols.add(clean.replace(/-/g, ''));
        }
      });
    });
    const symbolArray = Array.from(symbols);
    await chrome.storage.local.set({ [`symbols_${taxId}`]: symbolArray });
    return symbolArray;
  } catch (err) { return []; }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'searchNCBI',
    title: 'Search NCBI Gene for "%s"',
    contexts: ['selection']
  });

  chrome.storage.sync.get('organism', (data) => {
    if (!data.organism) {
      chrome.storage.sync.set({
        organism: '9606',
        highlightColor: '#ffff00',
        highlightOpacity: '0.4',
        highlightMode: 'all',
        triggerMode: 'hover',
        visualStyle: 'bg',
        caseMode: 'smart',
        detailLevel: 'full',
        whitelist: lifeScienceWhitelist,
        enabled: true
      });
      refreshSymbolCache('9606');
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'searchNCBI') {
    const query = encodeURIComponent(info.selectionText.trim());
    chrome.storage.sync.get('organism', (settings) => {
      const taxId = settings.organism || '9606';
      const url = `https://www.ncbi.nlm.nih.gov/gene/?term=${query}[gene]+AND+txid${taxId}[orgn]`;
      chrome.tabs.create({ url });
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-highlights') {
    chrome.storage.sync.get('enabled', (data) => {
      chrome.storage.sync.set({ enabled: !data.enabled });
    });
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.organism) {
    refreshSymbolCache(changes.organism.newValue);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshCache') {
    chrome.storage.sync.get('organism', async (data) => {
      const symbols = await refreshSymbolCache(data.organism || '9606');
      sendResponse({ success: symbols.length > 0 });
    });
    return true;
  }

  if (request.action === 'getSymbols') {
    chrome.storage.sync.get(null, (settings) => {
      const taxId = settings.organism || '9606';
      chrome.storage.local.get([`symbols_${taxId}`], (result) => {
        sendResponse({
          symbols: result[`symbols_${taxId}`] || [], 
          taxId, mapping: complexMapping, settings 
        });
      });
    });
    return true;
  }
});
