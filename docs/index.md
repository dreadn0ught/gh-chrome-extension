# GitHub Codespaces & Actions Chrome Extension

This extension lets you track your GitHub Codespaces and the latest GitHub Actions workflows across all your repositories, right from your browser.

## Features
- **Codespaces:** View all your Codespaces and their running status. Click to open any Codespace in a new tab.
- **Workflows:** See the 10 most recent GitHub Actions workflows from all your repositories, sorted by newest. Click to view details in GitHub.
- **OAuth Login:** Securely log in with your GitHub account using OAuth (no need to manually enter a PAT).
- **Auto-refresh:** Data updates automatically every 10 seconds.
- **Modern UI:** Responsive, clean interface using Tailwind CSS.

## How to Use
1. **Install the Extension:**
   - Download or clone this repository.
   - Go to `chrome://extensions/` in your browser.
   - Enable Developer Mode.
   - Click "Load unpacked" and select the `extension` folder.
2. **Login with GitHub:**
   - Click the "Login with GitHub" button in the popup.
   - Authorize the extension to access your Codespaces and Actions.
   - The extension will display your Codespaces and latest workflows.

## How It Works
- Uses the GitHub REST API to fetch Codespaces and workflow data.
- OAuth flow is handled via GitHub's authorization page. You must register your own OAuth app and set the Client ID in `popup.js`.
- All UI elements are styled with Tailwind CSS for a modern look.

## Deploying to GitHub Pages
This repository includes a GitHub Actions workflow (`static.yml`) to deploy static content to GitHub Pages. To publish documentation or a demo:

1. Push changes to the `main` branch.
2. The workflow will build and deploy the repository to GitHub Pages automatically.
3. Your site will be available at the URL shown in the workflow output (see the Actions tab).

## Customization
- **OAuth App:** Register your own GitHub OAuth app and set the Client ID in `popup.js`.
- **Styling:** Modify `popup.html` and Tailwind classes in `popup.js` for custom branding.
- **Refresh Interval:** Change the interval in `startAutoRefresh()` in `popup.js`.

## Repository Structure
- `extension/` — Chrome extension source code
  - `popup.html` — Main UI
  - `popup.js` — Logic and API calls
  - `styles.css` — (Optional) Custom styles
  - `manifest.json` — Chrome extension manifest
- `.github/workflows/static.yml` — GitHub Pages deployment workflow

## License
MIT

---

For questions or contributions, open an issue or pull request on GitHub.
