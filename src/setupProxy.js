const { createProxyMiddleware } = require("http-proxy-middleware");

const LULC_TARGET = "https://geoseg.airesqclimsols.com";

const lulcRoutes = [
  "/login",
  "/signup",
  "/maps",
  "/jobs",
  "/results",
  "/terrain",
  "/api/v1",
  "/src",
  "/node_modules",
  "/@vite",
  "/@react-refresh",
];

const viteClientStub = `
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
`;

module.exports = function setupProxy(app) {
  app.get("/@vite/client", (req, res) => {
    res.type("application/javascript").send(viteClientStub);
  });

  app.use(
    lulcRoutes,
    createProxyMiddleware({
      target: LULC_TARGET,
      changeOrigin: true,
      secure: true,
      ws: true,
      cookieDomainRewrite: "",
      cookiePathRewrite: "/",
      onProxyReq(proxyReq) {
        proxyReq.setHeader("origin", LULC_TARGET);
      },
    }),
  );
};
