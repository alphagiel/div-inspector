(() => {
  // Second injection = toggle off
  if (window.__divInspector) {
    window.__divInspector.destroy();
    return;
  }

  const NEON = "#39ff14";
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
    #box {
      border: 1.5px dashed ${NEON};
    }
    #chip {
      position: fixed; pointer-events: none; display: none;
      font: 600 11px/1 ui-monospace, Menlo, monospace;
      color: #000; background: ${NEON};
      padding: 3px 5px; border-radius: 3px; white-space: nowrap;
      max-width: 60vw; overflow: hidden; text-overflow: ellipsis;
    }
    #hint {
      position: fixed; pointer-events: none; display: none;
      font: 500 10px/1 ui-monospace, Menlo, monospace;
      color: ${NEON}; background: rgba(0,0,0,.75);
      border: 1px dashed ${NEON};
      padding: 3px 5px; border-radius: 3px; white-space: nowrap;
    }
    #panel {
      position: fixed; top: 12px; right: 12px; width: 320px;
      max-height: calc(100vh - 24px); overflow: auto;
      pointer-events: auto; display: none;
      background: #0d0f12; color: #e6e6e6;
      border: 1px solid ${NEON}; border-radius: 8px;
      box-shadow: 0 0 18px rgba(57,255,20,.35);
      font: 12px/1.45 ui-monospace, Menlo, monospace;
    }
    #panel.left { right: auto; left: 12px; }
    .hd { padding: 10px 12px; border-bottom: 1px solid #222; color: ${NEON}; font-weight: 700; word-break: break-all; }
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
  </style>
  <div id="toast"><span>Div Inspector on · <kbd>S</kbd> details · <kbd>Esc</kbd> exit</span><button title="Close">×</button></div>
  <div id="margin" class="layer"></div>
  <div id="padding" class="layer"></div>
  <div id="box" class="layer"></div>
  <div id="chip"></div>
  <div id="hint">press S for details</div>
  <div id="panel"></div>
  `;

  const $ = (id) => root.getElementById(id);
  const mLayer = $("margin"), pLayer = $("padding"), box = $("box"), chip = $("chip"), hint = $("hint"), panel = $("panel");

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

  function draw() {
    if (!target || !target.isConnected) return hide();
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
    chip.textContent = `${comp ? `<${comp}> ` : ""}${label(target)}  ${Math.round(r.width)}×${Math.round(r.height)}`;
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
    [mLayer, pLayer, box, chip, hint].forEach((e) => (e.style.display = "none"));
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
      <div class="hd">${esc(label(el))}${componentOf(el) ? `<small style="color:#cfe">component: ${esc(componentOf(el))}</small>` : ""}<small>S hide · Esc quit</small></div>
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
      <div class="ft">Div Inspector · hover = highlight · S = details</div>`;

    // dock opposite the element so it doesn't cover it
    panel.classList.toggle("left", r.left + r.width / 2 > innerWidth / 2);
    panel.style.display = "block";
  }

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

  const typing = () => {
    const a = document.activeElement;
    return a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
  };

  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape") {
      e.preventDefault();
      return destroy();
    }
    if (typing()) return;
    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      e.stopPropagation();
      if (locked) {
        locked = false;
        panel.style.display = "none";
      } else if (target) {
        locked = true;
        renderPanel();
      }
      if (target) draw();
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
