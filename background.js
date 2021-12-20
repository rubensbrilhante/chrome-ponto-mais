let color = '#3aa757';

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.storage.sync.set({ color });
//   console.log('Default background color set to %cgreen', `color: ${color}`);
// });

const icons = {
  enabled: "/images/ponto128x128.png",
  disabled: "/images/ponto_disabled128x128"
};

function isWhitelisted(url) {
  let hostName = new URL(url).hostname;
  let isWhitelisted = "app2.pontomais.com.br" == hostName;
  console.log("", { url, isWhitelisted })
  return isWhitelisted;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("on Update", { tab, tabId, changeInfo })
  if (!tab.active || changeInfo.status != "complete") {
    console.log("Not on active tab")
    return;
  }
  console.log("", { action: chrome.action })
  if (isWhitelisted(tab.url)) {
    chrome.action.enable();
    chrome.action.setIcon({ tabId, path: icons.enabled });
    // chrome.action.setPopup({ popup: "index.html" });
    console.log("enabled")
  } else {
    chrome.action.disable();
    // chrome.action.setIcon({ tabId, path: icons.disabled });
    // chrome.action.setPopup({ popup: "" });
    console.log("disabled")
  };
});
