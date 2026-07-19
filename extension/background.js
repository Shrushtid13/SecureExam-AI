// background.js - Monitors active tabs and posts flags directly to backend

let activeExams = {}; // map of tabId -> { examId, token, apiUrl }

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ type: 'PONG' });
  } else if (message.type === 'START_EXAM') {
    if (sender.tab && sender.tab.id) {
      activeExams[sender.tab.id] = {
        examId: message.examId,
        token: message.token,
        apiUrl: message.apiUrl || 'http://localhost:5000'
      };
      console.log('Exam started in tab', sender.tab.id, 'for exam', message.examId);
    }
    sendResponse({ status: 'started' });
  } else if (message.type === 'END_EXAM') {
    if (sender.tab && sender.tab.id) {
      delete activeExams[sender.tab.id];
    }
    sendResponse({ status: 'ended' });
  }
});

// Function to post flag to backend directly
async function postFlag(tabId, type, detail) {
  const examInfo = activeExams[tabId];
  if (!examInfo) return;

  try {
    const url = `${examInfo.apiUrl}/api/exams/${examInfo.examId}/proctoring/flag`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${examInfo.token}`
      },
      body: JSON.stringify({
        source: 'extension',
        flagType: type,
        detail: detail
      })
    });
    console.log('Extension posted flag:', type);
  } catch (err) {
    console.error('Failed to post flag from extension:', err);
  }
}

// Track active tab to detect switches
let currentActiveTabId = null;

chrome.tabs.onActivated.addListener((activeInfo) => {
  currentActiveTabId = activeInfo.tabId;
  
  // If any exam tab lost focus
  Object.keys(activeExams).forEach(tabIdStr => {
    const tabId = parseInt(tabIdStr, 10);
    if (tabId !== currentActiveTabId) {
      postFlag(tabId, 'tab_switched', 'User switched to another tab.');
    }
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  // A new tab was created while an exam is active
  if (Object.keys(activeExams).length > 0) {
    Object.keys(activeExams).forEach(tabIdStr => {
      postFlag(parseInt(tabIdStr, 10), 'tab_opened', 'User opened a new tab.');
    });
  }
});

// Detect navigation within the exam tab (URL change)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && activeExams[tabId]) {
    // The exam tab navigated away from the exam page
    postFlag(tabId, 'tab_navigated', `Exam tab navigated to: ${changeInfo.url}`);
  }
});

// Also track window focus
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Chrome lost focus entirely
    Object.keys(activeExams).forEach(tabIdStr => {
      postFlag(parseInt(tabIdStr, 10), 'window_blurred', 'Exam window lost focus.');
    });
  }
});
