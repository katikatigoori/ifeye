// main.js
// --------------------------------------------
// 全体統括スクリプト
// --------------------------------------------

import { initUI, registerHandlers, setStatus } from "./calibration-ui.js";
import { initCalibration } from "./calibration.js";

window.addEventListener("DOMContentLoaded", () => {
  // ① キャリブレーションUI初期化
  initUI({
    startBtnId: "startCalib",
    recalibBtnId: "recalib",
    downloadBtnId: "download",
    statusId: "status"
  });

  // ② キャリブレーション設定（任意に調整可）
  initCalibration({
    rows: 3,         // キャリブレーション点 縦方向
    cols: 3,         // 横方向
    pointSize: 34,   // 点のサイズ(px)
    shuffleOrder: true,
    clickWaitMs: 250 // 各点クリック間の待機時間
  });

  // ③ ボタン処理登録
  registerHandlers({
    onCalibComplete: (result) => {
      if (result) {
        console.log("✅ Calibration complete:", result);
        setStatus(`完了 (RMSE=${result.rmse.toFixed(1)}px)`);
      } else {
        console.warn("❌ Calibration failed or cancelled.");
        setStatus("キャリブレーション失敗");
      }
    }
  });
});
