// calibration-ui.js
// UI側でボタンの初期化と外部から呼ぶためのヘルパを提供

import { initCalibration, createCalibrationPoints, runCalibration, clearCalibrationPoints } from "./calibration.js";
import { startTracking, stopTracking, getLogs, resetLogs } from "./tracking.js";
import { downloadCSV } from "./utils.js";
import { sleep } from "./utils.js";

let els = {};

export function initUI({ startBtnId = "startCalib", recalibBtnId = "recalib", downloadBtnId = "download", statusId = "status" } = {}) {
  els.startBtn = document.getElementById(startBtnId);
  els.recalibBtn = document.getElementById(recalibBtnId);
  els.downloadBtn = document.getElementById(downloadBtnId);
  els.statusEl = document.getElementById(statusId);

  if (!els.startBtn || !els.statusEl) console.warn("initUI: elements not found");

  // default states
  if (els.recalibBtn) els.recalibBtn.disabled = true;
  if (els.downloadBtn) els.downloadBtn.disabled = true;
}

export function setStatus(text) {
  if (els.statusEl) els.statusEl.textContent = text;
}

/**
 * registerHandlers(onCalibComplete)
 * - start/recalib/download ボタンのクリック処理を登録する（内部でキャリブレーションを実行）
 * - options: calibration settings は initCalibration で設定済みとする
 */
export function registerHandlers({ onCalibComplete } = {}) {
  if (!els.startBtn) throw new Error("UI not initialized (call initUI first)");

  els.startBtn.addEventListener("click", async () => {
    try {
      els.startBtn.disabled = true;
      setStatus("カメラとWebGazerを初期化中...");
      // reset logs
      resetLogs();

      // create points & run calibration
      setStatus("キャリブレーション点を生成しています...");
      await createCalibrationPoints();
      setStatus("点を順にクリックしてください...");
      const result = await runCalibration();
      clearCalibrationPoints();

      if (result) {
        setStatus(`キャリブレーション完了 (RMSE=${result.rmse.toFixed(1)}px)`);
        if (els.recalibBtn) els.recalibBtn.disabled = false;
        if (els.downloadBtn) els.downloadBtn.disabled = false;
        // start tracking with applied offset
        await sleep(300);
        startTracking();
      } else {
        setStatus("キャリブレーション失敗: 予測データが取得できませんでした");
        if (els.startBtn) els.startBtn.disabled = false;
      }

      if (typeof onCalibComplete === "function") onCalibComplete(result);
    } catch (e) {
      console.error(e);
      setStatus("エラーが発生しました");
      if (els.startBtn) els.startBtn.disabled = false;
    }
  });

  if (els.recalibBtn) {
    els.recalibBtn.addEventListener("click", async () => {
      setStatus("再キャリブレーション中...");
      stopTracking();
      await createCalibrationPoints();
      setStatus("点を順にクリックしてください...");
      const result = await runCalibration();
      clearCalibrationPoints();
      if (result) {
        setStatus(`再キャリブレーション完了 (RMSE=${result.rmse.toFixed(1)}px)`);
        startTracking();
      } else setStatus("再キャリブレーション失敗");
    });
  }

  if (els.downloadBtn) {
    els.downloadBtn.addEventListener("click", () => {
      const logs = getLogs();
      if (!logs || logs.length === 0) {
        setStatus("ログがありません");
        return;
      }
      const header = "timestamp,x,y";
      const rows = logs.map(l => [l.time, l.x, l.y]);
      downloadCSV("gaze_log.csv", header, rows);
    });
  }
}
