// ---------------------------------------------
// main.js
// WebGazer起動とキャリブレーション実行
// ---------------------------------------------

import { startCalibration } from "./calibration.js";

window.onload = async function () {
  // WebGazerの初期化
  await webgazer.setRegression("ridge")
                .setTracker("TFFacemesh")
                .begin();

  webgazer.showVideo(false)
          .showFaceOverlay(false)
          .showFaceFeedbackBox(false)
          .showPredictionPoints(false);

  // キャリブレーションボタンにイベント設定
  document.getElementById("startBtn").addEventListener("click", async () => {
    await startCalibration();
    // キャリブレーション完了後に視線追跡を開始
    startTracking();
  });
};

// 視線をリアルタイム表示
function startTracking() {
  const dot = document.getElementById("gazeDot");

  webgazer.setGazeListener((data) => {
    if (!data) return;
    dot.style.left = data.x + "px";
    dot.style.top = data.y + "px";
  });
}
