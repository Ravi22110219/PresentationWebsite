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
  "/node_modules/.vite",
  "/node_modules/vite",
  "/@vite",
  "/@react-refresh",
];

module.exports = function setupProxy(app) {
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
