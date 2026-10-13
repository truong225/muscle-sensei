#!/usr/bin/env node
// Cổng V1/V4: tô màu đồ thị đúng (hai cơ kề nhau khác màu) và màu đủ phân biệt (CIEDE2000).
// - Mọi cạnh trong muscle-colors.json: hai đầu khác màu; mọi cơ trong muscles.json có màu.
// - Các màu trong bảng khác nhau từng đôi ΔE00 ≥ 20.
// - Mỗi màu bảng khác màu nền "đất sét" (PALETTE.clay) ΔE00 ≥ 20 và khác màu chọn (PALETTE.selected) ΔE00 ≥ 15.
import { readFileSync } from "node:fs";
import { PALETTE } from "../src/viewer/palette.js";

const C = JSON.parse(readFileSync("src/data/muscle-colors.json", "utf8"));
const M = JSON.parse(readFileSync("src/data/muscles.json", "utf8"));
const errs = [];

for (const m of M.muscles) if (!(m.id in C.colors)) errs.push(`thiếu màu cho ${m.id}`);
for (const [a, b] of C.edges) if (C.colors[a] === C.colors[b]) errs.push(`cạnh ${a}–${b} cùng màu ${C.colors[a]}`);
for (const v of Object.values(C.colors)) if (!(v >= 0 && v < C.palette.length)) errs.push(`chỉ số màu ${v} ngoài bảng`);

// sRGB hex → Lab (D65)
function lab(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const X = (0.4124 * lin[0] + 0.3576 * lin[1] + 0.1805 * lin[2]) / 0.95047;
  const Y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  const Z = (0.0193 * lin[0] + 0.1192 * lin[1] + 0.9505 * lin[2]) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
// CIEDE2000
function dE(h1, h2) {
  const [L1, a1, b1] = lab(h1), [L2, a2, b2] = lab(h2);
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) * deg + 360) % 360, h2p = (Math.atan2(b2, a2p) * deg + 360) % 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = h2p - h1p; if (C1p * C2p === 0) dhp = 0; else if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p; if (C1p * C2p !== 0) hbp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2 : (h1p + h2p) / 2;
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const SL = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2), SC = 1 + 0.045 * Cbp, SH = 1 + 0.015 * Cbp * T;
  const RT = -2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hbp - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH));
}

let minPair = Infinity;
for (let i = 0; i < C.palette.length; i++) for (let j = i + 1; j < C.palette.length; j++) {
  const d = dE(C.palette[i], C.palette[j]); minPair = Math.min(minPair, d);
  if (d < 20) errs.push(`màu ${C.palette[i]} và ${C.palette[j]} quá giống (ΔE00=${d.toFixed(1)})`);
}
const vs = {};
for (const key of ["clay", "selected"]) {
  if (!PALETTE[key]) { errs.push(`src/viewer/palette.js thiếu PALETTE.${key}`); continue; }
  const lim = key === "clay" ? 20 : 15;
  vs[key] = Math.min(...C.palette.map((p) => dE(p, PALETTE[key])));
  for (const p of C.palette) { const d = dE(p, PALETTE[key]); if (d < lim) errs.push(`màu ${p} quá giống PALETTE.${key} ${PALETTE[key]} (ΔE00=${d.toFixed(1)})`); }
}
console.log(JSON.stringify({ muscles: M.muscles.length, edges: C.edges.length, colors: C.palette.length, minPaletteDeltaE: +minPair.toFixed(1), minVs: Object.fromEntries(Object.entries(vs).map(([k, v]) => [k, +v.toFixed(1)])) }));
if (errs.length) { console.error("FAIL colors\n" + errs.join("\n")); process.exit(1); }
console.log("PASS colors: cơ kề nhau khác màu; bảng màu phân biệt (ΔE00) với nhau, với nền đất sét và màu chọn");
