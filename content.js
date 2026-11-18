(() => {
  // Second injection = toggle off
  if (window.__divInspector) {
    window.__divInspector.destroy();
    return;
  }

  const ACCENT = "#2563eb";
  const host = document.createElement("div");
  host.style.cssText = "all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
  const root = host.attachShadow({ mode: "open" });
  document.documentElement.appendChild(host);

  root.innerHTML = `
  <style>
    * { box-sizing: border-box; }
    .layer { position: fixed; pointer-events: none; display: none; }
    #margin  { background: rgba(255,155,0,.22); }
    #padding { background: rgba(0,200,120,.22); }
    #grid { position: fixed; inset: 0; pointer-events: none; display: none; }
    #grid div {
      position: fixed; pointer-events: none;
      border: 1px dashed #a855f7; background: rgba(168,85,247,.08);
    }
    #box {
      border: 2px dashed ${ACCENT};
    }
    #chip {
      position: fixed; pointer-events: none; display: none;
      font: 600 11px/1 ui-monospace, Menlo, monospace;
      color: #fff; background: ${ACCENT};
      padding: 3px 5px; border-radius: 3px; white-space: nowrap;
      max-width: 60vw; overflow: hidden; text-overflow: ellipsis;
    }
    #hint {
      position: fixed; pointer-events: none; display: none;
      font: 600 10px/1 ui-monospace, Menlo, monospace;
      color: #fff; background: ${ACCENT};
      border: 1px dashed ${ACCENT};
      padding: 3px 5px; border-radius: 3px; white-space: nowrap;
    }
    #panel {
      position: fixed; top: 12px; right: 12px; width: 320px;
      max-height: calc(100vh - 24px); overflow: auto;
      pointer-events: auto; display: none;
      background: #0d0f12; color: #e6e6e6;
      border: 1px solid ${ACCENT}; border-radius: 8px;
      box-shadow: 0 0 18px rgba(37,99,235,.4);
      font: 12px/1.45 ui-monospace, Menlo, monospace;
    }
    #panel.left { right: auto; left: 12px; }
    .hd { padding: 10px 12px; border-bottom: 1px solid #222; color: ${ACCENT}; font-weight: 700; word-break: break-all; }
    .hd small { display:block; color:#888; font-weight:400; margin-top:2px; }
    .sec { padding: 8px 12px; border-bottom: 1px solid #1c1c1c; }
    .sec h4 { margin: 0 0 6px; font-size: 11px; color: #9aa; text-transform: uppercase; letter-spacing: .06em; }
    .row { display: flex; justify-content: space-between; gap: 10px; }
    .row span:first-child { color: #8a8f98; flex-shrink: 0; }
    .row span:last-child { text-align: right; word-break: break-word; }
    .sw { display:inline-block; width:10px; height:10px; border:1px solid #555; vertical-align:middle; margin-right:4px; }
    .ft { padding: 6px 12px; color: #666; font-size: 10px; }
    /* box model diagram */
    .bm { text-align:center; font-size:10px; }
    .bm .m, .bm .b, .bm .p, .bm .c { position:relative; padding: 14px 22px; border:1px dashed #444; }
    .bm .m { background: rgba(255,155,0,.15); }
    .bm .b { background: rgba(255,220,0,.10); border-style: solid; }
    .bm .p { background: rgba(0,200,120,.15); }
    .bm .c { background: rgba(80,140,255,.2); padding: 6px; }
    .bm .lbl { position:absolute; top:1px; left:4px; color:#777; }
    .bm .t, .bm .bt { position:absolute; left:0; right:0; }
    .bm .t { top:1px; } .bm .bt { bottom:1px; }
    .bm .l, .bm .r { position:absolute; top:50%; transform:translateY(-50%); }
    .bm .l { left:4px; } .bm .r { right:4px; }
    #toast {
      position: fixed; top: 10px; right: 16px; transform: translateY(-8px);
      display: flex; align-items: center; gap: 10px;
      font: 500 12px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #333; background: #fff;
      border: 1px solid #e3e3e3; border-radius: 8px; padding: 8px 8px 8px 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,.22);
      opacity: 0; transition: opacity .2s, transform .2s; white-space: nowrap;
      pointer-events: auto;
    }
    #toast kbd {
      font: 600 11px ui-monospace, Menlo, monospace;
      background: #f2f2f2; border: 1px solid #ddd; border-radius: 3px; padding: 1px 4px;
    }
    #toast button {
      all: unset; cursor: pointer; color: #999; font-size: 16px; line-height: 1;
      padding: 2px 4px; border-radius: 4px;
    }
    #toast button:hover { color: #333; background: #f2f2f2; }
    #toast.show { opacity: 1; transform: translateY(0); }
    #flash {
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
      font: 600 12px/1 ui-monospace, Menlo, monospace;
      color: #fff; background: ${ACCENT}; padding: 7px 10px; border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,.25);
      opacity: 0; transition: opacity .2s; pointer-events: none;
    }
    #flash.show { opacity: 1; }
    .ask { padding: 10px 12px; background: #fff; color: #1f2328; border-bottom: 1px solid ${ACCENT}; }
    .ask h4 { margin: 0 0 6px; font-size: 11px; color: ${ACCENT}; text-transform: uppercase; letter-spacing: .06em; display:flex; justify-content:space-between; align-items:center; }
    .ask select {
      all: unset; font: 10px ui-monospace, Menlo, monospace; color: #57606a; cursor: pointer;
      max-width: 160px; overflow: hidden; text-overflow: ellipsis; text-transform: none; letter-spacing: 0;
    }
    .ask form { display: flex; gap: 6px; }
    .ask input {
      flex: 1; min-width: 0; font: 12px ui-monospace, Menlo, monospace; color: #1f2328;
      background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 5px; padding: 6px 8px; outline: none;
    }
    .ask input:focus { border-color: ${ACCENT}; }
    .ask button {
      all: unset; cursor: pointer; font: 600 11px ui-monospace, Menlo, monospace;
      color: #fff; background: ${ACCENT}; border-radius: 5px; padding: 6px 10px;
    }
    .ask button:disabled { opacity: .5; cursor: default; }
    .ans { margin-top: 8px; white-space: pre-wrap; word-break: break-word; color: #1f2328; }
    .ans:empty { display: none; }
    .ans pre { white-space: pre-wrap; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 5px; padding: 6px 8px; margin: 6px 0; color: #0b3d91; }
    .ans code { color: #0b3d91; background: #eef2f7; border-radius: 3px; padding: 0 3px; }
    .ans pre code { background: none; padding: 0; }
    .ans.err { color: #c62828; }
  </style>
  <div id="toast"><span>Div Inspector on · <kbd>S</kbd> details · <kbd>A</kbd> ask AI · <kbd>C</kbd> copy · <kbd>Esc</kbd> exit</span><button title="Close">×</button></div>
  <div id="grid"></div>
  <div id="margin" class="layer"></div>
  <div id="padding" class="layer"></div>
  <div id="box" class="layer"></div>
  <div id="chip"></div>
  <div id="hint">press S for details</div>
  <div id="panel"></div>
  <div id="flash"></div>
  `;

  const $ = (id) => root.getElementById(id);
  const mLayer = $("margin"), pLayer = $("padding"), box = $("box"), chip = $("chip"), hint = $("hint"), panel = $("panel"), gridLayer = $("grid");

  let target = null;
  let locked = false; // true while details panel is open

  const px = (v) => parseFloat(v) || 0;
  const place = (el, r) => {
    Object.assign(el.style, {
      display: "block",
      left: r.left + "px", top: r.top + "px",
      width: Math.max(0, r.width) + "px", height: Math.max(0, r.height) + "px",
    });
  };

  const label = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += "#" + el.id;
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).filter(Boolean) : [];
    if (cls.length) s += "." + cls.slice(0, 3).join(".") + (cls.length > 3 ? "…" : "");
    return s;
  };

  // Ask the MAIN-world hook which component owns this element (sync via DOM event)
  let compFor = null, compNames = "";
  const componentOf = (el) => {
    if (compFor === el) return compNames;
    compFor = el;
    compNames = "";
    try {
      el.setAttribute("data-di-q", "");
      document.dispatchEvent(new CustomEvent("__di_query"));
      compNames = el.getAttribute("data-di-comp") || "";
    } catch (_) {}
    el.removeAttribute("data-di-q");
    el.removeAttribute("data-di-comp");
    return compNames;
  };

  // Grid overlay: the hovered element if it's a grid, else its parent if that is
  const gridOf = (el) => {
    for (const e of [el, el.parentElement]) {
      if (e && getComputedStyle(e).display.includes("grid")) return e;
    }
    return null;
  };
  // computed grid-template-* resolves to px track sizes; strip [line-names]
  const tracks = (s) => s.replace(/\[[^\]]*\]/g, " ").trim().split(/\s+/).map(parseFloat).filter((n) => !isNaN(n));

  function drawGrid(g) {
    if (!g) {
      gridLayer.style.display = "none";
      return "";
    }
    const r = g.getBoundingClientRect();
    const cs = getComputedStyle(g);
    const x0 = r.left + px(cs.borderLeftWidth) + px(cs.paddingLeft);
    const y0 = r.top + px(cs.borderTopWidth) + px(cs.paddingTop);
    const innerW = r.width - px(cs.borderLeftWidth) - px(cs.borderRightWidth) - px(cs.paddingLeft) - px(cs.paddingRight);
    const innerH = r.height - px(cs.borderTopWidth) - px(cs.borderBottomWidth) - px(cs.paddingTop) - px(cs.paddingBottom);
    const cols = tracks(cs.gridTemplateColumns);
    const rws = tracks(cs.gridTemplateRows);
    if (!cols.length) cols.push(innerW);
    if (!rws.length) rws.push(innerH);
    const cg = px(cs.columnGap), rg = px(cs.rowGap);
    let html = "", y = y0;
    for (const h of rws) {
      let x = x0;
      for (const w of cols) {
        html += `<div style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`;
        x += w + cg;
      }
      y += h + rg;
    }
    gridLayer.innerHTML = html;
    gridLayer.style.display = "block";
    return `grid ${cols.length}×${rws.length}`;
  }

  function draw() {
    if (!target || !target.isConnected) return hide();
    const gridInfo = drawGrid(gridOf(target));
    const r = target.getBoundingClientRect();
    const cs = getComputedStyle(target);
    const m = { t: px(cs.marginTop), r: px(cs.marginRight), b: px(cs.marginBottom), l: px(cs.marginLeft) };
    const bw = { t: px(cs.borderTopWidth), r: px(cs.borderRightWidth), b: px(cs.borderBottomWidth), l: px(cs.borderLeftWidth) };
    const p = { t: px(cs.paddingTop), r: px(cs.paddingRight), b: px(cs.paddingBottom), l: px(cs.paddingLeft) };

    place(mLayer, { left: r.left - m.l, top: r.top - m.t, width: r.width + m.l + m.r, height: r.height + m.t + m.b });
    place(pLayer, { left: r.left + bw.l, top: r.top + bw.t, width: r.width - bw.l - bw.r, height: r.height - bw.t - bw.b });
    // mask content area out of padding layer via clip-path
    const cw = r.width - bw.l - bw.r, ch = r.height - bw.t - bw.b;
    pLayer.style.clipPath = `polygon(0 0,100% 0,100% 100%,0 100%,0 0,${p.l}px ${p.t}px,${p.l}px ${ch - p.b}px,${cw - p.r}px ${ch - p.b}px,${cw - p.r}px ${p.t}px,${p.l}px ${p.t}px)`;
    pLayer.style.clipRule = "evenodd";
    // same for margin (hide area under element)
    mLayer.style.clipPath = `polygon(0 0,100% 0,100% 100%,0 100%,0 0,${m.l}px ${m.t}px,${m.l}px ${m.t + r.height}px,${m.l + r.width}px ${m.t + r.height}px,${m.l + r.width}px ${m.t}px,${m.l}px ${m.t}px)`;

    place(box, { left: r.left - 0.75, top: r.top - 0.75, width: r.width + 1.5, height: r.height + 1.5 });

    const comp = componentOf(target).split(" ‹ ")[0];
    chip.textContent = `${comp ? `<${comp}> ` : ""}${label(target)}  ${Math.round(r.width)}×${Math.round(r.height)}${gridInfo ? `  · ${gridInfo}` : ""}`;
    chip.style.display = "block";
    const ch2 = 18;
    const top = r.top - ch2 - 4 >= 0 ? r.top - ch2 - 4 : Math.min(r.bottom + 4, innerHeight - ch2);
    chip.style.top = top + "px";
    chip.style.left = Math.max(0, Math.min(r.left, innerWidth - chip.offsetWidth)) + "px";

    // hint: top-right of element, same row as chip, never overlapping it
    hint.style.display = locked ? "none" : "block";
    if (!locked) {
      const chipRight = chip.offsetLeft + chip.offsetWidth + 4;
      const left = Math.max(r.right - hint.offsetWidth, chipRight);
      hint.style.top = top + "px";
      hint.style.left = Math.min(left, innerWidth - hint.offsetWidth) + "px";
    }
  }

  function hide() {
    [mLayer, pLayer, box, chip, hint, gridLayer].forEach((e) => (e.style.display = "none"));
  }

  const four = (cs, prop) => {
    const v = ["Top", "Right", "Bottom", "Left"].map((s) => cs[prop + s]);
    if (v.every((x) => x === v[0])) return v[0];
    if (v[0] === v[2] && v[1] === v[3]) return `${v[0]} ${v[1]}`;
    return v.join(" ");
  };

  const toHex = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return c;
    const [r, g, b, a] = m[1].split(/[\s,/]+/).map(Number);
    const hex = "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();
    return a !== undefined && a < 1 ? `${hex} @${a}` : hex;
  };
  const color = (c) => `<span class="sw" style="background:${c}"></span>${toHex(c)}`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  const rows = (pairs) =>
    pairs
      .filter(([, v, keep]) => keep || (v !== undefined && v !== "" && v !== "none" && v !== "normal" && v !== "auto" && v !== "0px"))
      .map(([k, v, , raw]) => `<div class="row"><span>${k}</span><span>${raw ? v : esc(v)}</span></div>`)
      .join("");

  const sec = (title, body) => (body ? `<div class="sec"><h4>${title}</h4>${body}</div>` : "");

  function renderPanel() {
    const el = target;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const v = (s) => Math.round(px(s) * 100) / 100 || 0;

    const bm = `
      <div class="bm">
        <div class="m"><span class="lbl">margin</span>
          <span class="t">${v(cs.marginTop)}</span><span class="bt">${v(cs.marginBottom)}</span>
          <span class="l">${v(cs.marginLeft)}</span><span class="r">${v(cs.marginRight)}</span>
          <div class="b"><span class="lbl">border</span>
            <span class="t">${v(cs.borderTopWidth)}</span><span class="bt">${v(cs.borderBottomWidth)}</span>
            <span class="l">${v(cs.borderLeftWidth)}</span><span class="r">${v(cs.borderRightWidth)}</span>
            <div class="p"><span class="lbl">padding</span>
              <span class="t">${v(cs.paddingTop)}</span><span class="bt">${v(cs.paddingBottom)}</span>
              <span class="l">${v(cs.paddingLeft)}</span><span class="r">${v(cs.paddingRight)}</span>
              <div class="c">${Math.round(r.width * 100) / 100} × ${Math.round(r.height * 100) / 100}</div>
            </div>
          </div>
        </div>
      </div>`;

    const isFlex = cs.display.includes("flex");
    const isGrid = cs.display.includes("grid");

    panel.innerHTML = `
      <div class="hd">${esc(label(el))}${componentOf(el) ? `<small style="color:#cfe">component: ${esc(componentOf(el))}</small>` : ""}<small>S hide · A ask AI · C copy for AI · Esc quit</small></div>
      <div class="ask">
        <h4><span>Ask AI (Ollama)</span><select title="Ollama model"><option>loading…</option></select></h4>
        <form><input placeholder="why is this misaligned?" autocomplete="off"><button type="submit">Ask</button></form>
        <div class="ans"></div>
      </div>
      <div class="sec"><h4>Box model</h4>${bm}</div>
      ${sec("Spacing", rows([
        ["margin", four(cs, "margin"), true],
        ["padding", four(cs, "padding"), true],
        ["gap", isFlex || isGrid ? cs.gap : ""],
        ["box-sizing", cs.boxSizing, true],
      ]))}
      ${sec("Size", rows([
        ["width", cs.width, true],
        ["height", cs.height, true],
        ["min-width", cs.minWidth],
        ["max-width", cs.maxWidth],
        ["min-height", cs.minHeight],
        ["max-height", cs.maxHeight],
      ]))}
      ${sec("Font & Text", rows([
        ["font-family", cs.fontFamily, true],
        ["font-size", cs.fontSize, true],
        ["font-weight", cs.fontWeight, true],
        ["line-height", cs.lineHeight, true],
        ["letter-spacing", cs.letterSpacing],
        ["text-align", cs.textAlign, true],
        ["text-transform", cs.textTransform],
        ["color", color(cs.color), true, true],
      ]))}
      ${sec("Background & Border", rows([
        ["background", cs.backgroundColor === "rgba(0, 0, 0, 0)" ? "transparent" : color(cs.backgroundColor), true, true],
        ["bg-image", cs.backgroundImage],
        ["border", px(cs.borderTopWidth) ? `${cs.borderTopWidth} ${cs.borderTopStyle} ${toHex(cs.borderTopColor)}` : ""],
        ["border-radius", cs.borderRadius],
        ["box-shadow", cs.boxShadow],
        ["opacity", cs.opacity === "1" ? "" : cs.opacity],
      ]))}
      ${sec("Layout", rows([
        ["display", cs.display, true],
        ["position", cs.position, true],
        ["top/right/bottom/left", cs.position !== "static" ? `${cs.top} ${cs.right} ${cs.bottom} ${cs.left}` : ""],
        ["z-index", cs.zIndex],
        ["flex-direction", isFlex ? cs.flexDirection : ""],
        ["justify-content", isFlex || isGrid ? cs.justifyContent : ""],
        ["align-items", isFlex || isGrid ? cs.alignItems : ""],
        ["flex-wrap", isFlex && cs.flexWrap !== "nowrap" ? cs.flexWrap : ""],
        ["grid-template-columns", isGrid ? cs.gridTemplateColumns : ""],
        ["flex", cs.flex !== "0 1 auto" ? cs.flex : ""],
        ["overflow", cs.overflow === "visible" ? "" : cs.overflow],
      ]))}
      ${sec("Effects", rows([
        ["transform", cs.transform],
        ["transition", cs.transitionDuration === "0s" ? "" : cs.transition],
        ["filter", cs.filter],
        ["cursor", cs.cursor],
      ]))}
      <div class="ft">Div Inspector · hover = highlight · S = details · A = ask AI · C = copy</div>`;

    // dock opposite the element so it doesn't cover it
    panel.classList.toggle("left", r.left + r.width / 2 > innerWidth / 2);
    panel.style.display = "block";
    wireAsk();
  }

  // --- ask AI (local Ollama via background) ---
  let askPort = null;
  const stopAsk = () => {
    try { askPort?.disconnect(); } catch {}
    askPort = null;
  };

  // minimal markdown: ```fences``` -> <pre>, `inline` -> <code>
  const md = (t) =>
    esc(t)
      .replace(/```[\w-]*\n?([\s\S]*?)(```|$)/g, (_, c) => `<pre>${c.replace(/\n$/, "")}</pre>`)
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");

  function wireAsk() {
    const form = panel.querySelector(".ask form");
    const input = form.querySelector("input");
    const btn = form.querySelector("button");
    const ans = panel.querySelector(".ans");
    const sel = panel.querySelector(".ask select");

    chrome.runtime.sendMessage({ diOllama: "models" }, (res) => {
      if (chrome.runtime.lastError || !res) {
        sel.innerHTML = `<option>offline</option>`;
        ans.className = "ans err";
        ans.textContent = "Extension background didn't answer. Reload Div Inspector in chrome://extensions, then refresh this page.";
        return;
      }
      if (res.error) {
        sel.innerHTML = `<option>offline</option>`;
        ans.className = "ans err";
        ans.textContent = res.error;
        return;
      }
      sel.innerHTML = res.models.map((m) => `<option ${m === res.model ? "selected" : ""}>${esc(m)}</option>`).join("") || `<option>no models</option>`;
    });
    sel.addEventListener("change", () => chrome.runtime.sendMessage({ diOllama: "setModel", model: sel.value }));

    // keep page shortcuts from eating keystrokes typed in the box
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Escape") input.blur();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q || !target) return;
      stopAsk();
      ans.className = "ans";
      ans.textContent = "thinking…";
      btn.disabled = true;
      let text = "", finished = false;
      const port = (askPort = chrome.runtime.connect({ name: "di-ollama" }));
      port.onMessage.addListener((m) => {
        if (m.delta) {
          text += m.delta;
          ans.innerHTML = md(text);
        }
        if (m.error) {
          ans.className = "ans err";
          ans.textContent = m.error;
        }
        if (m.done || m.error) {
          finished = true;
          btn.disabled = false;
          stopAsk();
        }
      });
      port.onDisconnect.addListener(() => {
        btn.disabled = false;
        if (!finished && askPort === port) {
          ans.className = "ans err";
          ans.textContent = "Lost connection to the extension background. Reload Div Inspector in chrome://extensions, then refresh this page.";
        }
      });
      port.postMessage({ model: sel.value, context: aiContext(target), question: q });
    });
  }

  // --- copy for AI ---
  const selectorOf = (el) => {
    const parts = [];
    for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
      if (e.id && !/\d{3,}|:/.test(e.id)) {
        parts.unshift("#" + CSS.escape(e.id));
        break;
      }
      let s = e.tagName.toLowerCase();
      const p = e.parentElement;
      if (p) {
        const sibs = [...p.children].filter((c) => c.tagName === e.tagName);
        if (sibs.length > 1) s += `:nth-of-type(${sibs.indexOf(e) + 1})`;
      }
      parts.unshift(s);
      if (e === document.body) break;
    }
    return parts.join(" > ");
  };

  const htmlSnippet = (el, max = 1500) => {
    const html = el.outerHTML.replace(/\s+/g, " ");
    if (html.length <= max) return html;
    const open = el.cloneNode(false).outerHTML;
    const close = `</${el.tagName.toLowerCase()}>`;
    const inner = el.innerHTML.replace(/\s+/g, " ");
    const room = Math.max(0, max - open.length - close.length);
    return open.replace(close, "") + inner.slice(0, room) + " …(truncated)… " + close;
  };

  const DEFAULTS = new Set(["", "none", "normal", "auto", "0px", "0s", "visible", "static", "rgba(0, 0, 0, 0)", "0px 0px", "0px 0px 0px 0px"]);
  const STYLE_PROPS = [
    "display", "position", "top", "right", "bottom", "left", "z-index",
    "width", "height", "min-width", "max-width", "min-height", "max-height", "box-sizing",
    "margin", "padding", "gap",
    "flex-direction", "flex-wrap", "justify-content", "align-items", "align-self", "flex",
    "grid-template-columns", "grid-template-rows", "grid-column", "grid-row",
    "font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-align", "color",
    "background-color", "background-image", "border", "border-radius", "box-shadow", "opacity",
    "overflow", "transform", "transition", "cursor",
  ];
  const styleLines = (el) => {
    const cs = getComputedStyle(el);
    return STYLE_PROPS.map((k) => [k, cs.getPropertyValue(k)])
      .filter(([k, v]) => !DEFAULTS.has(v) && !(k === "flex" && v === "0 1 auto") && !(k === "opacity" && v === "1") && !(k === "border" && /^0px/.test(v)))
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n");
  };

  function aiContext(el) {
    const r = el.getBoundingClientRect();
    const comp = componentOf(el);
    const parent = el.parentElement;
    const pcs = parent && getComputedStyle(parent);
    const text = (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 200);
    const out = [
      "## Element from Div Inspector",
      `Page: ${location.href}`,
      `Selector: ${selectorOf(el)}`,
      comp ? `Component chain (inner ‹ outer): ${comp}` : null,
      `Rendered size: ${Math.round(r.width)}×${Math.round(r.height)} at (${Math.round(r.left)}, ${Math.round(r.top)}) · viewport ${innerWidth}×${innerHeight}`,
      parent ? `Parent: ${label(parent)} (display: ${pcs.display}${pcs.display.includes("flex") ? `, flex-direction: ${pcs.flexDirection}` : ""}${pcs.gap !== "normal" ? `, gap: ${pcs.gap}` : ""})` : null,
      text ? `Text: "${text}"` : null,
      "",
      "### Computed styles (non-default)",
      "```css",
      `${selectorOf(el).split(" > ").pop()} {`,
      styleLines(el),
      "}",
      "```",
      "",
      "### HTML",
      "```html",
      htmlSnippet(el),
      "```",
    ];
    return out.filter((x) => x !== null).join("\n");
  }

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:-9999px;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch {}
      ta.remove();
      return ok;
    }
  };

  const flash = $("flash");
  let flashTimer;
  const showFlash = (msg) => {
    flash.textContent = msg;
    flash.classList.add("show");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => flash.classList.remove("show"), 1400);
  };

  // --- events ---
  const isOurs = (e) => e.composedPath().includes(host);

  const onMove = (e) => {
    if (locked || isOurs(e)) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === host || el === document.documentElement) return;
    if (el !== target) {
      target = el;
      draw();
    }
  };

  const typing = (e) => {
    const a = e.composedPath()[0] || document.activeElement;
    return a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
  };

  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (typing(e)) return;
    if (e.key === "Escape") {
      e.preventDefault();
      return destroy();
    }
    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      e.stopPropagation();
      if (locked) {
        locked = false;
        stopAsk();
        panel.style.display = "none";
      } else if (target) {
        locked = true;
        renderPanel();
      }
      if (target) draw();
    } else if ((e.key === "c" || e.key === "C") && target) {
      e.preventDefault();
      e.stopPropagation();
      copyText(aiContext(target)).then((ok) => showFlash(ok ? "✓ Copied for AI" : "Copy failed"));
    } else if ((e.key === "a" || e.key === "A") && target) {
      e.preventDefault();
      e.stopPropagation();
      if (!locked) {
        locked = true;
        renderPanel();
        draw();
      }
      panel.querySelector(".ask input")?.focus();
    }
  };

  const onScroll = () => {
    if (target) draw();
  };

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("keydown", onKey, true);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onScroll);

  function destroy() {
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", onScroll);
    stopAsk();
    host.remove();
    delete window.__divInspector;
    try { chrome.runtime.sendMessage({ divInspector: false }); } catch {}
  }

  const toast = root.getElementById("toast");
  requestAnimationFrame(() => toast.classList.add("show"));
  toast.querySelector("button").addEventListener("click", () => {
    toast.classList.remove("show");
    setTimeout(() => (toast.style.display = "none"), 200);
  });

  window.__divInspector = { destroy };
})();
