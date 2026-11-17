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
  } catch (e) {
    console.warn("Div Inspector can't run here:", e.message);
  }
});
