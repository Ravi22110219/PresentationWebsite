import { useState, useEffect, useCallback, useRef } from "react";
import startLogo from "../img/start_logo.png";

const IIT_GANDHINAGAR_LOGO_URL = "https://iitgn.ac.in/cif/img/iitgn.png";
const AIRESQ_CLIMSOLS_LOGO_URL = "https://vijayawada.airesqclimsols.com/assets/branding/floodresq.png";

const localSlideImages = {};
function importLocalSlideImages(r) {
  r.keys().forEach((key) => {
    localSlideImages[key.replace("./", "")] = r(key);
  });
}

try {
  importLocalSlideImages(require.context("../img", true, /\.(png|jpe?g|svg)$/));
} catch (err) {
  // Jest does not provide Webpack's require.context.
}

const localVideoAssets = {};
function importLocalVideoFiles(r) {
  r.keys().forEach((key) => {
    localVideoAssets[key.replace("./", "")] = r(key);
  });
}

try {
  importLocalVideoFiles(require.context("../video", true, /\.(mp4|webm)$/));
} catch (err) {
  // Jest does not provide Webpack's require.context.
}

const CROWD_APP_ORIGIN = "https://crowd.airesqclimsols.com";
const LULC_APP_ORIGIN = "https://geoseg.airesqclimsols.com";
const SLIDE_HASH_PARAM = "slide";

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "";
}

function shouldUseIframeProxy(hostname) {
  return !isLocalHost(hostname) || process.env.NODE_ENV === "development";
}

function getSlideIndexFromLocation(total) {
  if (typeof window === "undefined" || total < 1) return null;

  const hash = window.location.hash.replace(/^#/, "");
  const hashSlide = new URLSearchParams(hash).get(SLIDE_HASH_PARAM);
  const searchSlide = new URLSearchParams(window.location.search).get(SLIDE_HASH_PARAM);
  const rawSlide = hashSlide || searchSlide;

  if (!rawSlide) return null;

  const slideNumber = Number.parseInt(rawSlide, 10);
  if (!Number.isInteger(slideNumber) || slideNumber < 1) return null;

  return Math.min(slideNumber - 1, total - 1);
}

function replaceSlideHash(index) {
  if (typeof window === "undefined") return;

  const nextUrl = `${window.location.pathname}${window.location.search}#${SLIDE_HASH_PARAM}=${index + 1}`;
  window.history.replaceState(null, "", nextUrl);
}

function clearSlideHash() {
  if (typeof window === "undefined") return;

  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

function resolveSlideUrl(url) {
  if (!url) return url;
  if (url.startsWith("img/")) {
    const key = url.replace(/^img\//, "");
    return localSlideImages[key] || url;
  }
  if (url.startsWith("video/")) {
    const key = url.replace(/^video\//, "");
    return localVideoAssets[key] || url;
  }
  return url;
}

function resolveIframeUrl(url) {
  if (!url || typeof window === "undefined") return url;

  try {
    const parsed = new URL(url);
    if (parsed.origin === CROWD_APP_ORIGIN && !isLocalHost(window.location.hostname)) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    if (parsed.origin === LULC_APP_ORIGIN && shouldUseIframeProxy(window.location.hostname)) {
      const pathname = parsed.pathname === "/" ? "/maps" : parsed.pathname;
      return `${pathname}${parsed.search}${parsed.hash}`;
    }
  } catch (err) {
    return url;
  }

  return url;
}

function isTrustedAppUrl(url) {
  if (!url) return false;

  try {
    const origin = new URL(url).origin;
    return origin === CROWD_APP_ORIGIN || origin === LULC_APP_ORIGIN;
  } catch (err) {
    return false;
  }
}

function getFooterSlideLabel(slide, index) {
  const title = slide?.title || `Slide ${index + 1}`;
  const shortTitle = title.replace(/^Demo\s+\d+:\s*/i, "");

  if (/FloodAstra/i.test(shortTitle)) return "FloodAstra";
  if (/Citizen Reports/i.test(shortTitle)) return "Citizen Reports";

  return shortTitle;
}

/**
 * Presentation Component
 *
 * Props:
 *   slides      — array of slide objects (from your JSON file)
 *   slideCount  — number of slides to show (slices the array)
 *
 * Slide object shape:
 * {
 *   "title": "My Slide",
 *   "type": "image" | "iframe" | "video",
 *   "url": "https://..."
 * }
 *
 * Usage example:
 *   import slidesData from "./slides.json";
 *   <Presentation slides={slidesData} slideCount={5} />
 */

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap');

  .pres-root {
    --bg0: #081f26;
    --bg1: #114754;
    --bg2: #163740;
    --bg3: #1b4c59;
    --border: rgba(107,195,210,0.2);
    --border-hover: rgba(107,195,210,0.35);
    --accent: #6BC3D2;
    --accent-dim: rgba(107,195,210,0.16);
    --text: #eef8fa;
    --text2: #b1dee2;
    --text3: #7caab5;
    --radius: 10px;
    --ease: cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Roboto', 'Poppins', sans-serif;
    background: var(--bg0);
    color: var(--text);
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    min-height: 100vh;
    min-height: 100dvh;
  }

  /* ── HEADER ── */
  .pres-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 28px;
    background: var(--bg1);
    border-bottom: 0.5px solid var(--border);
    flex-shrink: 0;
    gap: 16px;
    transition: opacity 0.25s var(--ease), transform 0.25s var(--ease);
  }
  .pres-brand-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }
  .pres-brand {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
  }
  .pres-slide-title {
    font-family: 'Roboto', sans-serif;
    font-size: 20px;
    font-weight: 500;
    color: var(--text);
    letter-spacing: 0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pres-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }
  .pres-counter {
    font-size: 11px;
    color: var(--text2);
    letter-spacing: 0.1em;
  }
  .pres-type-badge {
    font-size: 10px;
    letter-spacing: 0.12em;
    padding: 3px 9px;
    border-radius: 4px;
    background: var(--accent-dim);
    color: var(--accent);
    border: 0.5px solid rgba(212,168,67,0.3);
    text-transform: uppercase;
  }
  .pres-exit-btn {
    background: transparent;
    border: 0.5px solid var(--border);
    border-radius: 6px;
    color: var(--text2);
    padding: 5px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    cursor: pointer;
    letter-spacing: 0.06em;
    transition: border-color 0.2s, color 0.2s;
  }
  .pres-exit-btn:hover { border-color: var(--border-hover); color: var(--text); }

  /* ── STAGE ── */
  .pres-stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0b2e36;
    position: relative;
    overflow: hidden;
    min-height: 0;
    touch-action: pan-y;
  }
  .pres-stage > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .pres-stage > video {
    width: 100%;
    height: 100%;
    border: none;
    background: #082026;
    display: block;
    object-fit: contain;
  }
  .pres-stage > iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: #082026;
    display: block;
  }
  .pres-logo-overlay {
    position: absolute;
    top: 18px;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    padding: 1px;
    border-radius: 50%;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
    pointer-events: none;
  }
  .pres-logo-overlay-left {
    left: 22px;
    background: rgba(8, 31, 38, 0.82);
    border: 1px solid rgba(107, 195, 210, 0.22);
  }
  .pres-logo-overlay-right {
    right: 22px;
    width: auto;
    height: auto;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
  .pres-logo-overlay img {
    display: block;
    width: auto;
    height: auto;
    max-height: 52px;
    max-width: 52px;
    object-fit: contain;
  }
  .pres-logo-iit {
    max-width: 52px;
  }
  .pres-logo-airesq {
    width: auto;
    height: 48px;
    max-width: 132px;
    max-height: none;
    border: 3px solid rgba(8, 31, 38, 0.69);
    object-fit: contain;
  }
  @media (max-width: 700px) {
    .pres-logo-overlay {
      top: 10px;
      width: 44px;
      height: 44px;
      padding: 1px;
    }
    .pres-logo-overlay-left {
      left: 10px;
    }
    .pres-logo-overlay-right {
      right: 10px;
      width: auto;
      height: auto;
      padding: 0;
    }
    .pres-logo-overlay img {
      max-height: 40px;
      max-width: 40px;
    }
    .pres-logo-airesq {
      width: auto;
      height: 36px;
      max-width: 96px;
      max-height: none;
    }
  }
  .pres-empty {
    font-size: 12px;
    color: var(--text3);
    letter-spacing: 0.08em;
    text-align: center;
  }

  /* slide fade transition */
  .slide-enter { animation: slideIn 0.5s var(--ease) forwards; }
  .slide-exit { animation: slideOut 0.3s var(--ease) forwards; }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(60px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-60px); }
  }

  /* slide label overlay */
  .pres-label-overlay {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(15, 71, 90, 0.92));
    padding: 60px 28px 20px;
    pointer-events: none;
    transition: opacity 0.25s var(--ease), transform 0.25s var(--ease);
  }
  .pres-label-hidden {
    opacity: 0;
    transform: translateY(8px);
    pointer-events: none;
  }
  .pres-label-text {
    font-family: 'Roboto', sans-serif;
    font-size: 22px;
    font-weight: 500;
    color: rgba(238,248,250,0.95);
    letter-spacing: 0.02em;
  }

  /* ── PROGRESS FOOTER ── */
  .pres-footer {
    flex-shrink: 0;
    background: var(--bg1);
    border-top: 0.5px solid var(--border);
    padding: 6px 16px 8px;
    transition: opacity 0.25s var(--ease), transform 0.25s var(--ease), max-height 0.25s var(--ease), padding 0.25s var(--ease);
  }
  .pres-header-hidden {
    opacity: 0;
    transform: translateY(-12px);
    pointer-events: none;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-bottom-color: transparent;
  }
  .pres-footer-hidden {
    opacity: 0;
    transform: translateY(12px);
    pointer-events: none;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-top-color: transparent;
  }
  .pres-progress-track {
    height: 2px;
    background: var(--bg3);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 6px;
  }
  .pres-progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.45s var(--ease);
  }
  .pres-nav-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
  }
  .pres-slide-tabs {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px 2px 4px;
    scrollbar-width: thin;
  }
  .pres-slide-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 176px;
    height: 26px;
    border-radius: 6px;
    background: var(--bg3);
    border: 0.5px solid var(--border);
    color: var(--text2);
    cursor: pointer;
    flex: 0 0 auto;
    padding: 0 9px;
    transition: border-color 0.2s var(--ease), color 0.2s var(--ease), background 0.2s var(--ease);
    outline: none;
    font-family: 'Roboto', sans-serif;
  }
  .pres-slide-tab:hover {
    background: var(--accent-dim);
    border-color: var(--border-hover);
    color: var(--text);
  }
  .pres-slide-tab.active {
    background: var(--accent-dim);
    border-color: var(--accent);
    color: var(--accent);
  }
  .pres-slide-tab-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(8, 31, 38, 0.42);
    color: var(--text);
    flex: 0 0 auto;
    font-size: 9px;
    font-family: 'JetBrains Mono', monospace;
  }
  .pres-slide-tab.active .pres-slide-tab-index {
    background: var(--accent);
    color: #082026;
  }
  .pres-slide-tab-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10px;
    letter-spacing: 0.02em;
  }
  @media (max-width: 760px) {
    .pres-nav-row {
      grid-template-columns: 1fr auto;
      gap: 8px;
    }
    .pres-slide-tabs {
      grid-column: 1 / -1;
      order: 3;
    }
    .pres-slide-tab {
      max-width: 132px;
      height: 24px;
      padding: 0 7px;
    }
  }
  .pres-nav-btn {
    background: transparent;
    border: 0.5px solid var(--border);
    border-radius: var(--radius);
    color: var(--text2);
    padding: 4px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    cursor: pointer;
    letter-spacing: 0.08em;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    white-space: nowrap;
  }
  .pres-nav-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-dim);
  }
  .pres-nav-btn:disabled { opacity: 0.25; cursor: default; }

  /* ── SETUP SCREEN ── */
  .pres-setup {
    background: var(--bg0);
    height: 100vh;
    height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pres-setup-card {
    background: rgba(15, 71, 90, 0.94);
    border: 0.5px solid rgba(107,195,210,0.18);
    border-radius: 18px;
    padding: 40px 48px;
    max-width: 460px;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
  }
  .pres-start-logo {
    display: block;
    margin: 0 auto 22px;
    max-width: 180px;
    width: 100%;
    height: auto;
    filter: drop-shadow(0 8px 16px rgba(0,0,0,0.22));
  }
  .pres-setup-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px;
    font-style: italic;
    color: var(--accent);
    margin-bottom: 8px;
    letter-spacing: 0.02em;
  }
  .pres-setup-sub {
    font-size: 11px;
    color: var(--text2);
    letter-spacing: 0.1em;
    margin-bottom: 32px;
  }
  .pres-setup-info {
    background: var(--bg2);
    border: 0.5px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 20px;
    text-align: left;
    margin-bottom: 28px;
  }
  .pres-setup-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    padding: 4px 0;
    border-bottom: 0.5px solid var(--border);
  }
  .pres-setup-info-row:last-child { border-bottom: none; }
  .pres-setup-info-label { color: var(--text2); letter-spacing: 0.06em; }
  .pres-setup-info-val { color: var(--text); font-weight: 500; }
  .pres-start-btn {
    width: 100%;
    background: var(--accent);
    color: #082026;
    border: none;
    border-radius: var(--radius);
    padding: 13px 24px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .pres-start-btn:hover { opacity: 0.88; }
  .pres-start-btn:disabled { opacity: 0.35; cursor: default; }
  .pres-error {
    font-size: 11px;
    color: #e05252;
    margin-top: 12px;
    letter-spacing: 0.05em;
  }
  .pres-hint {
    font-size: 10px;
    color: var(--text3);
    margin-top: 16px;
    letter-spacing: 0.06em;
    line-height: 1.7;
  }
`;

function SlideContent({ slide, animKey }) {
  if (!slide.url) {
    return (
      <div className="pres-empty">
        no url provided for this slide
      </div>
    );
  }

  const resolvedUrl = slide.type === "iframe"
    ? resolveIframeUrl(resolveSlideUrl(slide.url))
    : resolveSlideUrl(slide.url);
  const isTrustedApp = slide.type === "iframe" && isTrustedAppUrl(slide.url);

  if (slide.type === "image") {
    return (
      <img
        key={animKey}
        className="slide-enter"
        src={resolvedUrl}
        alt={slide.title || "slide"}
        loading="lazy"
      />
    );
  }

  if (slide.type === "video") {
    return (
      <video
        key={animKey}
        className="slide-enter"
        src={resolvedUrl}
        controls
        playsInline
      />
    );
  }

  return (
    <iframe
      key={animKey}
      className="slide-enter"
      src={resolvedUrl}
      title={slide.title || "slide"}
      allowFullScreen
      allow="autoplay; camera; clipboard-write; fullscreen; geolocation; microphone; payment"
      sandbox={isTrustedApp ? undefined : "allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"}
    />
  );
}

export default function Presentation({ slides = [], slideCount }) {
  const visibleSlides = slides.slice(0, slideCount ?? slides.length);
  const total = visibleSlides.length;

  const initialSlideFromLocation = getSlideIndexFromLocation(total);

  const [started, setStarted] = useState(initialSlideFromLocation !== null);
  const [current, setCurrent] = useState(initialSlideFromLocation ?? 0);
  const [animKey, setAnimKey] = useState(0);
  const [, setShowUI] = useState(true);
  const uiTimerRef = useRef(null);
  const touchStartRef = useRef(null);

  const resetUITimer = useCallback(() => {
    setShowUI(true);
    if (uiTimerRef.current) {
      window.clearTimeout(uiTimerRef.current);
    }
    uiTimerRef.current = window.setTimeout(() => {
      setShowUI(false);
    }, 1000);
  }, []);

  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }, []);

  const startPresentation = useCallback(() => {
    setStarted(true);
    replaceSlideHash(current);
    enterFullscreen();
  }, [current, enterFullscreen]);

  const stopPresentation = useCallback(() => {
    setStarted(false);
    clearSlideHash();
    exitFullscreen();
  }, [exitFullscreen]);

  useEffect(() => {
    if (started) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  }, [started, enterFullscreen, exitFullscreen]);

  const goTo = useCallback((i) => {
    if (i < 0 || i >= total) return;
    setCurrent(i);
    setAnimKey((k) => k + 1);
  }, [total]);

  const navigate = useCallback((dir) => goTo(current + dir), [current, goTo]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) navigate(1);
      else navigate(-1);
      resetUITimer();
    }
    touchStartRef.current = null;
  }, [navigate, resetUITimer]);

  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === "touch") {
      touchStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (e.pointerType !== "touch" || !touchStartRef.current) return;
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) navigate(1);
      else navigate(-1);
      resetUITimer();
    }
    touchStartRef.current = null;
  }, [navigate, resetUITimer]);

  useEffect(() => {
    if (!started || total === 0) return;

    replaceSlideHash(current);
  }, [started, current, total]);

  useEffect(() => {
    if (total === 0) return;

    const handleHashChange = () => {
      const nextSlide = getSlideIndexFromLocation(total);
      if (nextSlide === null) return;

      setStarted(true);
      setCurrent((prev) => {
        if (prev !== nextSlide) {
          setAnimKey((k) => k + 1);
          return nextSlide;
        }
        return prev;
      });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [total]);

  useEffect(() => {
    if (!started) {
      setShowUI(true);
      if (uiTimerRef.current) {
        window.clearTimeout(uiTimerRef.current);
      }
      return;
    }

    resetUITimer();
  }, [started, current, resetUITimer]);

  useEffect(() => {
    if (!started) return;

    const handler = (e) => {
      resetUITimer();

      // navigation
      if (e.key === "ArrowRight" || e.key === "ArrowDown") return navigate(1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   return navigate(-1);
      if (e.key === "Escape") return stopPresentation();

      // toggle play/pause for video slides on Space
      if (e.code === "Space" || e.key === " ") {
        const vid = document.querySelector('.pres-stage video');
        // nothing to do if there's no video
        if (!vid) return;
        // if the video element is focused, let the browser handle Space
        if (document.activeElement === vid) return;
        // prevent page scrolling and other handlers
        e.preventDefault();
        e.stopPropagation();
        if (vid.paused) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      }
    };
    const mouseMoveHandler = () => resetUITimer();

    window.addEventListener("keydown", handler);
    window.addEventListener("mousemove", mouseMoveHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, [started, navigate, resetUITimer, stopPresentation]);

  // Auto-play video when its slide becomes active (muted to satisfy autoplay policies)
  useEffect(() => {
    if (!started) {
      // pause any playing videos when presentation isn't started
      document.querySelectorAll('.pres-stage video').forEach(v => v.pause());
      return;
    }

    const playCurrentVideo = async () => {
      const vid = document.querySelector('.pres-stage video');
      if (!vid) {
        // no video on this slide, pause any residual videos
        document.querySelectorAll('.pres-stage video').forEach(v => v.pause());
        return;
      }

      // pause other videos if present
      document.querySelectorAll('.pres-stage video').forEach(v => { if (v !== vid) v.pause(); });

      // try autoplay muted (more likely to succeed); user can unmute via controls
      try {
        vid.muted = true;
        await vid.play();
      } catch (err) {
        // autoplay blocked — ignore silently
      }
    };

    playCurrentVideo();
  }, [started, current, animKey]);

  const progress = total > 1 ? (current / (total - 1)) * 100 : 100;
  const slide = visibleSlides[current];

  const hasError = total === 0;

  // ── SETUP SCREEN ──
  if (!started) {
    return (
      <>
        <style>{styles}</style>
        <div className="pres-root">
          <div className="pres-setup">
            <div className="pres-setup-card">
              <img src={startLogo} alt="AIResQ ClimSols" className="pres-start-logo" />
              <div className="pres-setup-title">AIResQ ClimSols</div>
              <div className="pres-setup-sub">climate solutions presentation</div>

              <div className="pres-setup-info">
                <div className="pres-setup-info-row">
                  <span className="pres-setup-info-label">slides loaded</span>
                  <span className="pres-setup-info-val">{total}</span>
                </div>
                <div className="pres-setup-info-row">
                  <span className="pres-setup-info-label">images</span>
                  <span className="pres-setup-info-val">
                    {visibleSlides.filter(s => s.type === "image").length}
                  </span>
                </div>
                <div className="pres-setup-info-row">
                  <span className="pres-setup-info-label">iframes</span>
                  <span className="pres-setup-info-val">
                    {visibleSlides.filter(s => s.type === "iframe").length}
                  </span>
                </div>
              </div>

              {hasError && (
                <div className="pres-error">
                  no slides found — check your JSON and slideCount prop
                </div>
              )}

              <button
                className="pres-start-btn"
                onClick={startPresentation}
                disabled={hasError}
              >
                ▶ &nbsp;begin presentation
              </button>

              <div className="pres-hint">
                Press F11 to enter full screen before starting.<br />
                ← → arrow keys to navigate &nbsp;·&nbsp; swipe left/right on touch screens &nbsp;·&nbsp; esc to return here
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── PRESENTATION SCREEN ──
  return (
    <>
      <style>{styles}</style>
      <div className="pres-root">

        {/* header removed; exit and counter moved into footer */}
        <div className="pres-logo-overlay pres-logo-overlay-left" aria-hidden="true">
          <img className="pres-logo-iit" src={IIT_GANDHINAGAR_LOGO_URL} alt="" />
        </div>
        <div className="pres-logo-overlay pres-logo-overlay-right" aria-hidden="true">
          <img className="pres-logo-airesq" src={AIRESQ_CLIMSOLS_LOGO_URL} alt="" />
        </div>

        {/* Stage */}
        <div
          className="pres-stage"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <SlideContent slide={slide} animKey={animKey} />
        </div>

        {/* Footer */}
        <div className="pres-footer">
          <div className="pres-progress-track">
            <div
              className="pres-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="pres-nav-row">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                className="pres-exit-btn"
                onClick={stopPresentation}
              >
                ✕ exit
              </button>

              <button
                className="pres-nav-btn"
                onClick={() => navigate(-1)}
                disabled={current === 0}
              >
                ← prev
              </button>

              <span className="pres-counter" style={{ marginLeft: 8 }}>{current + 1} / {total}</span>
            </div>

            <div className="pres-slide-tabs" aria-label="slide navigation">
              {visibleSlides.map((slideItem, i) => (
                <button
                  key={i}
                  className={[
                    "pres-slide-tab",
                    i === current ? "active" : "",
                  ].join(" ")}
                  onClick={() => goTo(i)}
                  title={`${i + 1}. ${slideItem.title || "Slide"}`}
                  aria-label={`go to slide ${i + 1}: ${slideItem.title || "Slide"}`}
                >
                  <span className="pres-slide-tab-index">{i + 1}</span>
                  <span className="pres-slide-tab-label">{getFooterSlideLabel(slideItem, i)}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="pres-nav-btn"
                onClick={() => navigate(1)}
                disabled={current === total - 1}
              >
                next →
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
