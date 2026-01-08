# GeneSymbol Highlighter

A professional browser extension for real-time gene symbol identification and reference.

## Features
- **Automatic Highlighting:** Scans scientific domains for gene symbols.
- **On-Page Context:** Tooltips with official names and NCBI RefSeq summaries.
- **Customizable:** Change organisms (Human/Mouse/Rat), colors, and whitelisted domains.
- **Fast:** Local symbol matching with background caching.

## Local Installation (for Testing)
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked**.
5. Select the `genesymbol-highlighter` folder from this project.

## How to Use
- Once installed, visit a scientific site (e.g., [PubMed](https://pubmed.ncbi.nlm.nih.gov/)).
- Gene symbols like `CD4` or `NFKB1` will be highlighted.
- Hover or click the highlights to see detailed information.
- Use `Ctrl+Shift+H` (or `Cmd+Shift+H` on Mac) to toggle highlights on/off.
- Click the extension icon in the toolbar to access **Options**.

## Project Structure
- `manifest.json`: Extension configuration and permissions.
- `background.js`: Handles data fetching from UniProt and setting sync.
- `content.js`: Main logic for text scanning and highlighting.
- `styles.css`: Tooltip and highlight styles.
- `options.html/js`: Settings dashboard.
- `icon.svg` & `icon*.png`: Extension assets.
- `privacy.html`: [Live Privacy Policy](https://raw.githubusercontent.com/pkheisig/genesymbol-highlighter/main/genesymbol-highlighter/privacy.html)

## Chrome Web Store Submission
When publishing, use the justifications provided in the documentation for host permissions and storage. Ensure the Privacy Policy URL is set to the raw GitHub link provided above.

