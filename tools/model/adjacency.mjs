#!/usr/bin/env node
// V1 (nút code): đồ thị kề giữa các cơ chọn được + tô màu đồ thị (DSatur) → src/data/muscle-colors.json
// Hai cơ "kề nhau" khi có cặp đỉnh (cùng bên cơ thể, hoặc một bên là cơ giữa) cách nhau ≤ D (đơn vị mô hình).
// Dùng: node tools/model/adjacency.mjs [D]
import { readFileSync, writeFileSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read("public/models/muscles.glb");
const M = JSON.parse(readFileSync("src/data/muscles.json", "utf8"));

// 1. Lấy đỉnh theo toạ độ thế giới cho từng đơn vị (muscleId, side)
const units = []; // {id, side, pts: Float64Array}
let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (const n of doc.getRoot().listNodes()) {
  const m = /^muscle:([a-z0-9-]+):(L|R|C)$/.exec(n.getName());
  if (!m || !n.getMesh()) continue;
  const W = n.getWorldMatrix();
  const pts = [];
  for (const p of n.getMesh().listPrimitives()) {
    const a = p.getAttribute("POSITION");
    const v = [0, 0, 0];
    for (let i = 0; i < a.getCount(); i++) {
      a.getElement(i, v);
      const x = W[0] * v[0] + W[4] * v[1] + W[8] * v[2] + W[12];
      const y = W[1] * v[0] + W[5] * v[1] + W[9] * v[2] + W[13];
      const z = W[2] * v[0] + W[6] * v[1] + W[10] * v[2] + W[14];
      pts.push(x, y, z);
      min = [Math.min(min[0], x), Math.min(min[1], y), Math.min(min[2], z)];
      max = [Math.max(max[0], x), Math.max(max[1], y), Math.max(max[2], z)];
    }
  }
  units.push({ id: m[1], side: m[2], pts: Float64Array.from(pts) });
}
const height = max[1] - min[1];
// Ngưỡng mặc định: 0,4% chiều cao cơ thể (~7 mm với người 1,7 m)
const D = Number(process.argv[2]) || height * 0.004;

// 2. Lưới băm không gian
const key = (x, y, z) => `${Math.floor(x / D)},${Math.floor(y / D)},${Math.floor(z / D)}`;
const grid = new Map();
units.forEach((u, ui) => {
  for (let i = 0; i < u.pts.length; i += 3) {
    const k = key(u.pts[i], u.pts[i + 1], u.pts[i + 2]);
    let cell = grid.get(k);
    if (!cell) grid.set(k, (cell = []));
    cell.push(ui, i);
  }
});
const sideOk = (a, b) => a === "C" || b === "C" || a === b;
const pairs = new Map(); // "idA|idB" -> số cặp đỉnh gần
const D2 = D * D;
units.forEach((u, ui) => {
  for (let i = 0; i < u.pts.length; i += 3) {
    const x = u.pts[i], y = u.pts[i + 1], z = u.pts[i + 2];
    const cx = Math.floor(x / D), cy = Math.floor(y / D), cz = Math.floor(z / D);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const cell = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
      if (!cell) continue;
      for (let c = 0; c < cell.length; c += 2) {
        const vj = cell[c];
        if (vj <= ui) continue;
        const v = units[vj];
        if (v.id === u.id || !sideOk(u.side, v.side)) continue;
        const j = cell[c + 1];
        const ddx = v.pts[j] - x, ddy = v.pts[j + 1] - y, ddz = v.pts[j + 2] - z;
        if (ddx * ddx + ddy * ddy + ddz * ddz <= D2) {
          const k = [u.id, v.id].sort().join("|");
          pairs.set(k, (pairs.get(k) || 0) + 1);
        }
      }
    }
  }
});
// Bỏ chạm do nhiễu: cần ≥ 3 cặp đỉnh gần
const edges = [...pairs].filter(([, n]) => n >= 3).map(([k, n]) => [...k.split("|"), n]).sort();

// 3. DSatur
const ids = M.muscles.map((m) => m.id);
const adj = new Map(ids.map((i) => [i, new Set()]));
for (const [a, b] of edges) { adj.get(a)?.add(b); adj.get(b)?.add(a); }
const color = new Map();
while (color.size < ids.length) {
  let best = null, bestSat = -1, bestDeg = -1;
  for (const v of ids) {
    if (color.has(v)) continue;
    const sat = new Set([...adj.get(v)].filter((w) => color.has(w)).map((w) => color.get(w))).size;
    const deg = adj.get(v).size;
    if (sat > bestSat || (sat === bestSat && deg > bestDeg) || (sat === bestSat && deg === bestDeg && v < best)) { best = v; bestSat = sat; bestDeg = deg; }
  }
  const used = new Set([...adj.get(best)].filter((w) => color.has(w)).map((w) => color.get(w)));
  let c = 0; while (used.has(c)) c++;
  color.set(best, c);
}
const k = Math.max(...color.values()) + 1;

// 4. Bảng màu phân biệt (Okabe–Ito + bổ sung), đủ k màu; kiểm định ở scripts/check-colors.mjs
const PALETTE = ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#7A5195", "#8C9F3A", "#3FA7A0"];
if (k > PALETTE.length) throw new Error(`cần ${k} màu, bảng chỉ có ${PALETTE.length}`);
const out = {
  _note: "Sinh bởi tools/model/adjacency.mjs — đồ thị kề tính từ hình học muscles.glb, tô màu DSatur. Không sửa tay.",
  threshold: +D.toFixed(5), modelHeight: +height.toFixed(4), minContactPairs: 3,
  palette: PALETTE.slice(0, k),
  colors: Object.fromEntries(ids.map((i) => [i, color.get(i)])),
  edges: edges.map(([a, b, n]) => [a, b, n]),
};
writeFileSync("src/data/muscle-colors.json", JSON.stringify(out, null, 1));
const degs = ids.map((i) => adj.get(i).size);
console.log(JSON.stringify({ units: units.length, height: +height.toFixed(3), D: +D.toFixed(4), edges: edges.length, colors: k, maxDegree: Math.max(...degs), isolated: ids.filter((i) => adj.get(i).size === 0) }));
