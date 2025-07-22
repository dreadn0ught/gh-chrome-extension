// background.js: Handles tab opening from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'openTab' && message.url) {
        chrome.tabs.create({ url: message.url });
    }
});
