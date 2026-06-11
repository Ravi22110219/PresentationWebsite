const styleElements = new Map();

export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}

export function updateStyle(id, css) {
  let style = styleElements.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("data-vite-dev-id", id);
    document.head.appendChild(style);
    styleElements.set(id, style);
  }
  style.textContent = css;
}

export function removeStyle(id) {
  const style = styleElements.get(id);
  if (style) {
    style.remove();
    styleElements.delete(id);
  }
}
