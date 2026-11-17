// Click icon (or Alt+Shift+D) -> inject/toggle inspector in current tab
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["page-hook.js"],
      world: "MAIN",
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    const [{ result: on }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => !!window.__divInspector,
    });
    setBadge(tab.id, on);
  } catch (e) {
    console.warn("Div Inspector can't run here:", e.message);
  }
});

function setBadge(tabId, on) {
  chrome.action.setBadgeText({ tabId, text: on ? "ON" : "" });
  if (on) chrome.action.setBadgeBackgroundColor({ tabId, color: "#2563eb" });
  if (on) chrome.action.setBadgeTextColor?.({ tabId, color: "#fff" });
}

// Esc from the page turns it off
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.divInspector === false && sender.tab?.id) setBadge(sender.tab.id, false);
});

// Navigation/reload wipes the inspector, so clear the badge
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "loading") setBadge(tabId, false);
});
