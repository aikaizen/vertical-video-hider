let isEnabled = true; // Default state, will be updated from storage
const HIDE_CLASS_NAME = 'vv-hider-hidden-video'; // Unique class name

// Function to check and hide/show a single video element
function checkAndToggleVideo(videoElement) {
  // Ensure we have a valid element with dimensions > 0
  if (!videoElement || typeof videoElement.offsetHeight === 'undefined' || typeof videoElement.offsetWidth === 'undefined') {
      return;
  }

  const height = videoElement.offsetHeight;
  const width = videoElement.offsetWidth;

  // Check if dimensions are valid and if height is greater than width
  if (height > 0 && width > 0 && height > width) {
    // It's a vertical video
    if (isEnabled) {
      console.log('Vertical Video Hider: Hiding video', videoElement);
      videoElement.classList.add(HIDE_CLASS_NAME);
      // Optional: Pause the video if it was playing
      // videoElement.pause();
    } else {
      // Ensure it's shown if the extension is disabled
      videoElement.classList.remove(HIDE_CLASS_NAME);
    }
  } else {
    // Not vertical, ensure it's shown (in case it was hidden before toggle)
    videoElement.classList.remove(HIDE_CLASS_NAME);
  }
}

// Function to process all videos currently on the page
function processAllVideos() {
  // console.log(`Vertical Video Hider: Processing page. Enabled: ${isEnabled}`);
  const videos = document.querySelectorAll('video');
  videos.forEach(checkAndToggleVideo);
}

// Inject CSS rule to hide elements with our specific class
function addHideStyle() {
    const styleId = 'vv-hider-style';
    if (document.getElementById(styleId)) return; // Style already added

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `.${HIDE_CLASS_NAME} { display: none !important; }`;
    (document.head || document.documentElement).appendChild(style);
    console.log('Vertical Video Hider: Hide style injected.');
}

// --- Initialization and Observation ---

// Add the CSS rule ASAP
addHideStyle();

// Load initial state and run first check
chrome.storage.local.get(['vvIsEnabled'], (result) => {
  // Default to true if not set
  isEnabled = result.vvIsEnabled !== undefined ? result.vvIsEnabled : true;
  console.log('Vertical Video Hider: Initial state loaded. Enabled:', isEnabled);
  processAllVideos(); // Initial check
});

// Use MutationObserver to detect videos added dynamically
const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        // Check if the added node is a video element
        if (node.nodeName === 'VIDEO') {
          checkAndToggleVideo(node);
        }
        // Check if the added node contains video elements
        else if (node.querySelectorAll) {
          const nestedVideos = node.querySelectorAll('video');
          nestedVideos.forEach(checkAndToggleVideo);
        }
      });
    }
    // Optional: Observe attribute changes if videos might change size significantly
    // else if (mutation.type === 'attributes' && mutation.target.nodeName === 'VIDEO') {
    //    checkAndToggleVideo(mutation.target);
    // }
  }
});

// Start observing the document body for added nodes
observer.observe(document.body, { childList: true, subtree: true });

// Listen for messages from the background script (e.g., when toggle changes)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateState') {
    const newState = message.isEnabled;
    if (isEnabled !== newState) {
      console.log('Vertical Video Hider: State updated via message. New state:', newState);
      isEnabled = newState;
      // Re-process all videos to apply the new state
      processAllVideos();
    }
    // Optional: Send confirmation back
    sendResponse({ status: "State received by content script", newState: isEnabled });
  }
  return true; // Keep the message channel open for asynchronous response if needed
});

// Optional: Add listeners for events that might change video dimensions
// window.addEventListener('resize', processAllVideos); // If layout changes affect video size
// Note: listening to video events like 'loadedmetadata' or 'resize' on *each* video
// can be complex to manage, especially with dynamic content. Relying on rendered
// dimensions (offsetWidth/Height) and MutationObserver is often more practical.