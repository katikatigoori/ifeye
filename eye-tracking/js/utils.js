// utils.js
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function calcRMSE(samples) {
  // samples: [{dx, dy}] -> RMSE over sqrt(mean(dx^2+dy^2))
  if (!samples || samples.length === 0) return null;
  let s = 0;
  for (const p of samples) s += (p.dx * p.dx + p.dy * p.dy);
  return Math.sqrt(s / samples.length);
}

export function downloadCSV(filename, header, rows) {
  // header: string like "timestamp,x,y"
  // rows: array of arrays or comma-joined strings
  let csv = header + "\n";
  for (const r of rows) {
    if (Array.isArray(r)) csv += r.map(v => `${v}`).join(",") + "\n";
    else csv += r + "\n";
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
