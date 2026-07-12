// content.js - Runs in the context of the SecureExam web app

// (Flag injection removed; web app now uses externally_connectable PING)
// 2. Prevent clipboard and context menu
['copy', 'cut', 'paste', 'contextmenu'].forEach(evt => {
  document.addEventListener(evt, (e) => {
    // Only block if we are actually taking an exam (URL starts with /exam/ and has an ID)
    if (window.location.pathname.match(/^\/exam\/\d+/)) {
      e.preventDefault();
      window.postMessage({ type: 'SECURE_EXAM_VIOLATION', violation: evt }, '*');
    }
  }, true); // useCapture to ensure it runs first
});

// 3. Listen for messages from background script (like tab switches)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TAB_SWITCHED') {
    window.postMessage({ type: 'SECURE_EXAM_VIOLATION', violation: 'tab_switch' }, '*');
  }
});
