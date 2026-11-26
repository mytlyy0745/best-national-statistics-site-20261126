// NationStat charts — dependency-free canvas line and bar charts.
// Every chart is drawn on a <canvas> with a HiDPI-aware scale so lines
// stay crisp on retina screens. No libraries, no network.

const CHART_COLORS = ["#0f766e", "#b45309", "#16233a", "#7c3aed", "#be185d", "#0369a1"];
const CHART_GRID = "#e3ddcc";
const CHART_AXIS = "#6b7688";

// Format a big number with a short suffix: 29,298,013,000,000 -> "$29.30tn".
function shortMoney(billions) {
  if (billions >= 1000) return "$" + (billions / 1000).toFixed(2) + "tn";
  return "$" + billions.toFixed(0) + "bn";
}

// Format a population in millions: 340 -> "340m".
function shortPop(millions) {
  if (millions >= 1000) return (millions / 1000).toFixed(2) + "bn";
  return millions.toFixed(0) + "m";
}

// Prepare a canvas for a device-pixel-ratio-aware draw. Returns the 2d
// context scaled so drawing coordinates are CSS pixels.
function setupCanvas(canvas, cssWidth, cssHeight) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function niceTicks(min, max, count) {
  const span = max - min || 1;
  const step = Math.pow(10, Math.floor(Math.log10(span / count)));
  const candidates = [1, 2, 2.5, 5, 10];
  let best = step;
  for (const c of candidates) {
    if (step * c * count >= span) { best = step * c; break; }
  }
  const start = Math.ceil(min / best) * best;
  const ticks = [];
  for (let v = start; v <= max + best * 0.001; v += best) ticks.push(v);
  return ticks;
}

// Draw a line chart of one series. labels: year strings. formatValue
// turns a y value into its axis label.
function drawLineChart(canvas, labels, values, options) {
  const opts = options || {};
  const width = canvas.clientWidth || 640;
  const height = opts.height || 260;
  const ctx = setupCanvas(canvas, width, height);
  const padL = 64, padR = 14, padT = 12, padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  let min = Math.min.apply(null, values);
  let max = Math.max.apply(null, values);
  const pad = (max - min) * 0.12 || 1;
  min = Math.max(0, min - pad);
  max = max + pad;

  const x = (i) => padL + (plotW * i) / (values.length - 1);
  const y = (v) => padT + plotH * (1 - (v - min) / (max - min));

  ctx.font = "12px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = CHART_AXIS;
  ctx.strokeStyle = CHART_GRID;
  ctx.lineWidth = 1;

  const ticks = niceTicks(min, max, 4);
  for (const t of ticks) {
    ctx.beginPath();
    ctx.moveTo(padL, y(t));
    ctx.lineTo(width - padR, y(t));
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.formatValue ? opts.formatValue(t) : String(Math.round(t)), padL - 8, y(t));
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < labels.length; i++) {
    if (i % 2 === 0 || i === labels.length - 1) {
      ctx.fillText(labels[i], x(i), height - padB + 8);
    }
  }

  // A darker baseline at the bottom of the plot area, so the chart sits
  // on something even when every gridline is faint.
  ctx.beginPath();
  ctx.moveTo(padL, padT + plotH);
  ctx.lineTo(width - padR, padT + plotH);
  ctx.strokeStyle = "#c9c2ae";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = CHART_GRID;
  ctx.lineWidth = 1;

  // Area fill under the line, then the line itself, then dots.
  const color = opts.color || CHART_COLORS[0];
  ctx.beginPath();
  ctx.moveTo(x(0), y(values[0]));
  for (let i = 1; i < values.length; i++) ctx.lineTo(x(i), y(values[i]));
  ctx.lineTo(x(values.length - 1), padT + plotH);
  ctx.lineTo(x(0), padT + plotH);
  ctx.closePath();
  ctx.fillStyle = color + "22";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x(0), y(values[0]));
  for (let i = 1; i < values.length; i++) ctx.lineTo(x(i), y(values[i]));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.fillStyle = color;
  for (let i = 0; i < values.length; i++) {
    ctx.beginPath();
    ctx.arc(x(i), y(values[i]), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label the last point's value.
  const last = values[values.length - 1];
  ctx.font = "bold 13px 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = color;
  ctx.fillText(opts.formatValue ? opts.formatValue(last) : String(last), width - padR, y(last) - 8);
}

// Draw a horizontal bar chart. items: [{label, value, color}].
// formatValue turns a value into the label shown at the bar's end.
function drawBarChart(canvas, items, options) {
  const opts = options || {};
  const width = canvas.clientWidth || 640;
  const rowH = opts.rowHeight || 44;
  const height = Math.max(120, items.length * rowH + 24);
  const ctx = setupCanvas(canvas, width, height);
  const padL = 130, padR = 90, padT = 8;
  const plotW = width - padL - padR;

  const max = Math.max.apply(null, items.map((it) => it.value)) || 1;
  const min = Math.min(0, Math.min.apply(null, items.map((it) => it.value)));
  const span = max - min || 1;

  ctx.font = "13px 'Helvetica Neue', Arial, sans-serif";
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const top = padT + i * rowH;
    const barY = top + 8;
    const barH = 22;
    const zeroX = padL + ((0 - min) / span) * plotW;
    const valX = padL + ((it.value - min) / span) * plotW;
    const x0 = Math.min(zeroX, valX);
    const w = Math.max(2, Math.abs(valX - zeroX));

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#16233a";
    ctx.fillText(it.label, padL - 10, barY + barH / 2);

    ctx.fillStyle = it.color || CHART_COLORS[i % CHART_COLORS.length];
    ctx.beginPath();
    ctx.roundRect(x0, barY, w, barH, 4);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = "#3c4a63";
    ctx.font = "bold 13px 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(opts.formatValue ? opts.formatValue(it.value) : String(it.value), x0 + w + 8, barY + barH / 2);
    ctx.font = "13px 'Helvetica Neue', Arial, sans-serif";
  }
}
