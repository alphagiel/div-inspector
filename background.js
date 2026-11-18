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

// Tab may be gone (closed, prerendered, replaced) by the time we badge it
function setBadge(tabId, on) {
  const ignore = () => {};
  chrome.action.setBadgeText({ tabId, text: on ? "ON" : "" }).catch(ignore);
  if (on) chrome.action.setBadgeBackgroundColor({ tabId, color: "#2563eb" }).catch(ignore);
  if (on) chrome.action.setBadgeTextColor?.({ tabId, color: "#fff" })?.catch(ignore);
}

// Esc from the page turns it off
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.divInspector === false && sender.tab?.id) setBadge(sender.tab.id, false);
});

// Navigation/reload wipes the inspector, so clear the badge
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "loading") setBadge(tabId, false);
});

// --- Ollama (local AI) ---
const OLLAMA = "http://localhost:11434";
const DEFAULT_MODEL = "qwen2.5-coder:7b";
const SYSTEM = `You are a senior front-end engineer. The user is inspecting one element on a live web page with a dev tool. You get its selector, component chain, computed styles, and HTML. Answer the question directly and briefly. Prefer concrete CSS/HTML fixes in code blocks. Don't restate the context.`;

const ollamaError = (status) =>
  status === 403
    ? 'Ollama blocked the extension (403). Restart it with: OLLAMA_ORIGINS="chrome-extension://*" ollama serve'
    : status === 404
    ? `Model not found. Run: ollama pull ${DEFAULT_MODEL}`
    : `Ollama error ${status}`;
const OFFLINE = "Can't reach Ollama on localhost:11434. Start it with: ollama serve";

async function listModels() {
  const res = await fetch(`${OLLAMA}/api/tags`);
  if (!res.ok) throw new Error(ollamaError(res.status));
  const { models = [] } = await res.json();
  const names = models.map((m) => m.name);
  const { diModel } = await chrome.storage.local.get("diModel");
  const model = [diModel, DEFAULT_MODEL].find((m) => m && names.includes(m)) || names[0] || "";
  return { models: names, model };
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.diOllama === "models") {
    listModels()
      .then(reply)
      .catch((e) => reply({ error: e instanceof TypeError ? OFFLINE : e.message }));
    return true; // async reply
  }
  if (msg?.diOllama === "setModel") chrome.storage.local.set({ diModel: msg.model });
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "di-ollama") return;
  const ctrl = new AbortController();
  let open = true;
  port.onDisconnect.addListener(() => {
    open = false;
    ctrl.abort();
  });
  const send = (m) => open && port.postMessage(m);

  port.onMessage.addListener(async ({ model, context, question }) => {
    try {
      const res = await fetch(`${OLLAMA}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: model || DEFAULT_MODEL,
          stream: true,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: `${context}\n\n## Question\n${question}` },
          ],
        }),
      });
      if (!res.ok) return send({ error: ollamaError(res.status) });

      // NDJSON stream: one {message:{content}, done} per line
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          const j = JSON.parse(line);
          if (j.error) return send({ error: j.error });
          if (j.message?.content) send({ delta: j.message.content });
          if (j.done) return send({ done: true });
        }
      }
      send({ done: true });
    } catch (e) {
      if (e.name !== "AbortError") send({ error: e instanceof TypeError ? OFFLINE : e.message });
    }
  });
});
