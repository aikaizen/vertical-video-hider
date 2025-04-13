// Set initial state on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['vvIsEnabled'], (result) => {
    if (result.vvIsEnabled === undefined) {
      // Set default state to true only if it's not already set
      chrome.storage.local.set({ vvIsEnabled: true }, () => {
          console.log('Vertical Video Hider: Default state set to enabled on installation.');
      });
    }
  });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateState') {
    console.log('Background: Received state update from popup. New state:', message.isEnabled);

    // Forward the message to the content script in the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const activeTabId = tabs[0].id;
        chrome.tabs.sendMessage(activeTabId, { action: 'updateState', isEnabled: message.isEnabled }, (response) => {
           if (chrome.runtime.lastError) {
                // Handle cases where the content script might not be ready or injected
                console.warn("Could not send message to content script:", chrome.runtime.lastError.message);
                 sendResponse({ status: "Failed to send to content script", error: chrome.runtime.lastError.message });
            } else {
                console.log("Background: Message sent to content script, response:", response);
                 sendResponse({ status: "Message relayed to content script" });
            }
        });
      } else {
           console.warn("Background: No active tab found to send message to.");
           sendResponse({ status: "No active tab found" });
      }
    });
    // Return true to indicate you wish to send a response asynchronously
    return true;
  }
});