// tracking.js
// トラッキング：DOM要素は initTracking で初期化する（モジュールロード時に直接参照しない）.

let dotEl = null;
let logs = [];
let smoothX = null, smoothY = null;
let offsetX = 0, offsetY = 0;
let isTracking = false;

const SMOOTH_FACTOR = 0.25; // EMA係数（大きいほど反応速い、ノイズ増）

export function initTracking({ dotId = "dot" } = {}) {
  dotEl = document.getElementById(dotId);
  if (!dotEl) console.warn("tracking.js: dot element not found:", dotId);
}

export function applyCalibrationOffset(dx, dy) {
  offsetX = dx;
  offsetY = dy;
  console.log("applyCalibrationOffset:", dx, dy);
}

export function startTracking() {
  if (isTracking) return;
  if (!window.webgazer) {
    console.error("startTracking: webgazer が利用できません");
    return;
  }
  isTracking = true;
  if (dotEl) dotEl.style.display = "block";

  webgazer.setGazeListener((data) => {
    if (!data) return;
    if (smoothX === null) { smoothX = data.x; smoothY = data.y; }
    smoothX = SMOOTH_FACTOR * data.x + (1 - SMOOTH_FACTOR) * smoothX;
    smoothY = SMOOTH_FACTOR * data.y + (1 - SMOOTH_FACTOR) * smoothY;

    const adjX = smoothX + offsetX;
    const adjY = smoothY + offsetY;

    if (dotEl) {
      dotEl.style.left = (adjX - (dotEl.offsetWidth / 2)) + "px";
      dotEl.style.top = (adjY - (dotEl.offsetHeight / 2)) + "px";
    }

    logs.push({ time: Date.now(), x: adjX, y: adjY });
  });
}

export function stopTracking() {
  isTracking = false;
  if (window.webgazer) webgazer.clearGazeListener();
  if (dotEl) dotEl.style.display = "none";
  smoothX = null; smoothY = null;
}

export function getLogs() {
  return logs.slice();
}

export function resetLogs() {
  logs.length = 0;
}
