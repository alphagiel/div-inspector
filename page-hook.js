// Runs in the page's MAIN world so it can read React/Vue internals on DOM nodes.
// Content script marks an element with data-di-q, fires __di_query, reads data-di-comp back.
(() => {
  if (window.__divInspectorHook) return;
  window.__divInspectorHook = true;

  const nameOf = (type) => {
    if (!type) return null;
    if (typeof type === "function") return type.displayName || type.name || null;
    if (typeof type === "object") {
      // memo / forwardRef / lazy wrappers
      return type.displayName || nameOf(type.render) || nameOf(type.type) || null;
    }
    return null; // host elements ("div") are strings
  };

  const reactChain = (el) => {
    let node = el;
    let key;
    // nearest DOM node that React knows about
    while (node && !(key = Object.keys(node).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")))) {
      node = node.parentElement;
    }
    if (!node) return [];
    const names = [];
    for (let f = node[key]; f && names.length < 4; f = f.return) {
      const n = nameOf(f.type);
      if (n && n.length > 1 && !names.includes(n)) names.push(n);
    }
    return names;
  };

  const vueChain = (el) => {
    let node = el;
    while (node && !node.__vueParentComponent && !node.__vue__) node = node.parentElement;
    if (!node) return [];
    const names = [];
    // Vue 3
    for (let c = node.__vueParentComponent; c && names.length < 4; c = c.parent) {
      const n = c.type && (c.type.name || c.type.__name);
      if (n && !names.includes(n)) names.push(n);
    }
    // Vue 2
    for (let c = node.__vue__; c && names.length < 4; c = c.$parent) {
      const n = c.$options && (c.$options.name || c.$options._componentTag);
      if (n && !names.includes(n)) names.push(n);
    }
    return names;
  };

  document.addEventListener("__di_query", () => {
    const el = document.querySelector("[data-di-q]");
    if (!el) return;
    let names = [];
    try {
      names = reactChain(el);
      if (!names.length) names = vueChain(el);
    } catch (_) {}
    el.setAttribute("data-di-comp", names.join(" ‹ "));
  });
})();
