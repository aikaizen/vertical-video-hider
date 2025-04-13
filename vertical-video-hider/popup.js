const toggleSwitch = document.getElementById('toggleSwitch');
const statusLabel = toggleSwitch.nextElementSibling; // The <span> next to the checkbox

// Load the saved state when the popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['vvIsEnabled'], (result) => {
    // Default to true if not set
    const currentState = result.vvIsEnabled !== undefined ? result.vvIsEnabled : true;
    toggleSwitch.checked = currentState;
    statusLabel.textContent = currentState ? 'Hiding Enabled' : 'Hiding Disabled';
  });
});

// Listen for changes on the toggle switch
toggleSwitch.addEventListener('change', () => {
  const newState = toggleSwitch.checked;
  statusLabel.textContent = newState ? 'Hiding Enabled' : 'Hiding Disabled';

  // Save the new state to storage
  chrome.storage.local.set({ vvIsEnabled: newState }, () => {
    console.log('Vertical Video Hider: State saved:', newState);

    // Send a message to the background script to update the content script
    chrome.runtime.sendMessage({ action: 'updateState', isEnabled: newState }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
        } else {
            console.log("Message sent to background, response:", response);
        }
    });
  });
});