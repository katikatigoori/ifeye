// calibration.js
// キャリブレーション点の生成と誤差取得 → 平均補正を計算して applyCalibrationOffset に渡す

import { shuffle, sleep } from "./utils.js";
import { applyCalibrationOffset } from "./tracking.js";

export let calibrationPoints = []; // DOM nodes
let config = {
  rows: 3,
  cols: 3,
  pointSize: 34,
  shuffleOrder: true,
  clickWaitMs: 250
};

let offsetSamples = []; // {clickX,clickY,gazeX,gazeY,dx,dy}

export function initCalibration(userConfig = {}) {
  config = { ...config, ...userConfig };
}

/**
 * createCalibrationPoints()
 * - 既存の点は削除してから作成
 */
export async function createCalibrationPoints() {
  clearCalibrationPoints();
  const { rows, cols, pointSize } = config;
  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 0..100% の座標。端を含める。
      const x = (cols === 1) ? 50 : (c / (cols - 1)) * 100;
      const y = (rows === 1) ? 50 : (r / (rows - 1)) * 100;
      positions.push([x, y]);
    }
  }
  if (config.shuffleOrder) shuffle(positions);

  positions.forEach((pos, i) => {
    const [x, y] = pos;
    const el = document.createElement("div");
    el.className = "calibration-point";
    el.textContent = (i + 1);
    el.style.width = pointSize + "px";
    el.style.height = pointSize + "px";
    el.style.left = `calc(${x}% - ${pointSize / 2}px)`;
    el.style.top = `calc(${y}% - ${pointSize / 2}px)`;
    el.style.background = "red";
    document.body.appendChild(el);
    calibrationPoints.push(el);
  });
}

/**
 * runCalibration()
 * - 各点クリックを待って、webgazerの最新推定値を取得して誤差を記録
 * - 最終的に平均補正(dx,dy) と RMSE を計算して適用
 */
export async function runCalibration() {
  offsetSamples = [];
  for (const p of calibrationPoints) {
    p.style.background = "red";
    // wait for click & capture gaze
    const sample = await waitForClickAndSample(p);
    p.style.background = "blue";
    if (sample) offsetSamples.push(sample);
    await sleep(config.clickWaitMs);
  }
  // calculate average dx/dy
  if (offsetSamples.length > 0) {
    let sumDx = 0, sumDy = 0;
    for (const s of offsetSamples) {
      sumDx += (s.clickX - s.gazeX);
      sumDy += (s.clickY - s.gazeY);
    }
    const avgDx = sumDx / offsetSamples.length;
    const avgDy = sumDy / offsetSamples.length;

    // optional: compute RMSE here
    let s = 0;
    for (const samp of offsetSamples) {
      const dx = samp.clickX - samp.gazeX - avgDx;
      const dy = samp.clickY - samp.gazeY - avgDy;
      s += dx * dx + dy * dy;
    }
    const rmse = Math.sqrt(s / offsetSamples.length);

    console.log("calibration: avgDx, avgDy =", avgDx.toFixed(2), avgDy.toFixed(2), "RMSE =", rmse.toFixed(2));

    // apply to tracking module
    applyCalibrationOffset(avgDx, avgDy);

    return { avgDx, avgDy, rmse, samples: offsetSamples.slice() };
  } else {
    console.warn("calibration: samples empty");
    return null;
  }
}

function waitForClickAndSample(element) {
  return new Promise(resolve => {
    const handler = (e) => {
      element.removeEventListener("click", handler);
      // get current prediction from webgazer
      const gaze = (window.webgazer && typeof webgazer.getCurrentPrediction === "function")
        ? webgazer.getCurrentPrediction()
        : null;
      const clickX = e.clientX;
      const clickY = e.clientY;

      if (gaze) {
        // gaze has properties x,y (page coordinates)
        resolve({
          clickX,
          clickY,
          gazeX: gaze.x,
          gazeY: gaze.y,
          dx: clickX - gaze.x,
          dy: clickY - gaze.y
        });
      } else {
        // if gaze not available, resolve null
        resolve(null);
      }
    };
    element.addEventListener("click", handler);
  });
}

export function clearCalibrationPoints() {
  calibrationPoints.forEach(p => p.remove());
  calibrationPoints.length = 0;
}
