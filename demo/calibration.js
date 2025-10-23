// ---------------------------------------------
// calibration.js
// WebGazer.js用クリック式キャリブレーション
// ---------------------------------------------

export async function startCalibration() {
  const area = document.getElementById("calibrationArea");
  area.innerHTML = "";

  // 9点を配置
  const positions = [
    [10, 10], [50, 10], [90, 10],
    [10, 50], [50, 50], [90, 50],
    [10, 90], [50, 90], [90, 90],
  ];

  // 各点を生成
  const dots = positions.map(([x, y]) => {
    const dot = document.createElement("div");
    dot.className = "calib-dot";
    dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
    area.appendChild(dot);
    return dot;
  });

  // 各点クリックでWebGazerに学習させる
  for (const dot of dots) {
    await waitForClick(dot);
    dot.style.backgroundColor = "green";

    // 現在のスクリーン位置を15回記録して学習
    for (let i = 0; i < 15; i++) {
      webgazer.recordScreenPosition(dot.offsetLeft, dot.offsetTop, "click");
      await sleep(50);
    }
  }

  alert("キャリブレーション完了！");
  area.innerHTML = "";
}

// クリック待機
function waitForClick(element) {
  return new Promise((resolve) => {
    element.style.opacity = 1;
    element.addEventListener("click", () => {
      element.style.opacity = 0.5;
      resolve();
    }, { once: true });
  });
}

// 短い待機関数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
