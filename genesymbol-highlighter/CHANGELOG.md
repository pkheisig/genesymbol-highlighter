# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-01-08

### Added
- **Toolbar Popup:** Quick-access interface to toggle highlights and view detected symbol counts.
- **Highlight Counter:** Real-time detection count displayed in the popup.
- **Copy List Feature:** Export unique gene symbols found on the current page to the clipboard.
- **NCBI Context Menu:** Right-click any selected text to search the NCBI Gene database.
- **NCBI API Key Support:** Optional user-provided API key to increase rate limits for data fetching.
- **Settings Management:** 
  - "Reset to Defaults" functionality.
  - "Export Settings" to JSON file.
  - "Import Settings" from JSON file.
  - "Refresh Database" button to manually update the gene symbol cache.
- **UI/UX Polish:**
  - Dark mode support for options and popup pages.
  - "Test Your Style" section with live preview in settings.
  - "Help & Tips" section for keyboard shortcuts and Greek symbol mapping.
  - Pulse animation for loading states.
- **Store Assets:** 
  - Generated 16x16, 48x48, and 128x128 PNG icons.
  - Professional SVG icon source.
  - Compliant Privacy Policy (`privacy.html`).
- **Developer Support:** 
  - `package.json` with test scripts.
  - `test.js` suite for symbol normalization logic.
  - Comprehensive `README.md` and `.gitignore`.

### Changed
- Updated `manifest.json` to Manifest V3 with appropriate permissions and actions.
- Expanded `complexMapping` with more common gene symbols (e.g., P53, HER2, STAT3).
- Improved background logic to preserve user settings during updates.

## [1.0.0] - Initial Release
- Basic symbol identification and highlighting.
- Integration with UniProt and NCBI APIs.
