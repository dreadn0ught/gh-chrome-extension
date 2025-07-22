# gh-widget

Track your GitHub Actions and Codespaces in a Chrome extension or as a standalone webpage.

## Features

- Shows your current running GitHub Codespaces and their status (running/stopped)
- Clicking a Codespace opens it in a new tab
- Shows the latest GitHub Actions workflow status for your first repo
- Clicking a workflow opens it in a new tab
- Works as a Chrome extension or as a standalone webpage

## How It Works

The app uses the GitHub REST API to fetch your Codespaces and Actions workflows. You provide a GitHub Personal Access Token (PAT) in the popup UI. The app detects if it's running as a Chrome extension or a webpage and uses the correct APIs for storage and tab opening.

## Testing as a Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select the `/extension` folder in this repo
4. The extension will appear in your browser toolbar
5. Click the extension icon, enter your GitHub PAT, and use the widget

## Testing as a Standalone Webpage

1. Run a local web server in your Codespace or locally:
   ```bash
   npx serve extension
   ```
2. Open the provided URL (e.g., `http://localhost:3000/popup.html`) in your browser
3. Enter your GitHub PAT and use the widget

## Notes

- You need a GitHub PAT with `repo` and `codespace` scopes
- The app only shows the latest workflow for your first repo (can be extended)
- No custom icons/branding yet; you can add icons from Flaticons or Bootstrap Icons

## File Structure

- `extension/manifest.json` — Chrome extension manifest
- `extension/popup.html` — Popup UI (also used for webpage)
- `extension/popup.js` — Main logic, detects environment
- `extension/styles.css` — Styling
- `extension/background.js` — Handles tab opening in extension mode
