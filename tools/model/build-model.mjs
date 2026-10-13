#!/usr/bin/env node
// N2 (nút code): BodyParts3D STL → public/models/muscles.glb
// - Mỗi đơn vị cơ chọn được: 1 node / bên, tên `muscle:<id>:<L|R|C>`, extras.muscleId
// - Cơ ngữ cảnh gộp 1 node `context:muscles`; xương gộp 1 node `context:bones`
// - Hàn đỉnh, giảm lưới (meshoptimizer), pháp tuyến mượt, lượng tử hoá + EXT_meshopt_compression
// Dùng: node --max-old-space-size=8192 tools/model/build-model.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { Document, NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { quantize } from "@gltf-transform/functions";
import { MeshoptSimplifier, MeshoptEncoder } from "meshoptimizer";

const STL_DIR = "tools/model/cache/bp3d/assets/BodyParts3D_data/stl/";
const OUT = "public/models/muscles.glb";
// Ngân sách tam giác (C10: tổng ≤ 600k)
const BUDGET = { selectable: 320000, contextMuscles: 105000, bones: 100000 };
const M = JSON.parse(readFileSync("src/data/muscles.json", "utf8"));

function readStl(fma) {
  const p = STL_DIR + fma + ".stl";
  if (!existsSync(p)) throw new Error("thiếu lưới " + p);
  const b = readFileSync(p);
  const n = b.readUInt32LE(80);
  if (84 + n * 50 !== b.length) throw new Error(`${fma}: không phải STL nhị phân hợp lệ`);
  // Hàn đỉnh trùng toạ độ
  const map = new Map(), pos = [], idx = new Uint32Array(n * 3);
  for (let t = 0; t < n; t++) {
    const o = 84 + t * 50 + 12;
    for (let v = 0; v < 3; v++) {
      const x = b.readFloatLE(o + v * 12), y = b.readFloatLE(o + v * 12 + 4), z = b.readFloatLE(o + v * 12 + 8);
      const k = x + "," + y + "," + z;
      let i = map.get(k);
      if (i === undefined) { i = pos.length / 3; pos.push(x, y, z); map.set(k, i); }
      idx[t * 3 + v] = i;
    }
  }
  return { pos: new Float32Array(pos), idx, tris: n };
}

function simplify(mesh, ratio) {
  const target = Math.max(3 * 60, Math.floor((mesh.idx.length * ratio) / 3) * 3);
  if (target >= mesh.idx.length) return mesh;
  let [idx] = MeshoptSimplifier.simplify(mesh.idx, mesh.pos, 3, target, 0.02, ["LockBorder"]);
  if (idx.length > target * 1.3) [idx] = MeshoptSimplifier.simplifySloppy(mesh.idx, mesh.pos, 3, null, target, 0.05);
  // Bỏ đỉnh không dùng
  const remap = new Int32Array(mesh.pos.length / 3).fill(-1), pos = [];
  const out = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) {
    let r = remap[idx[i]];
    if (r < 0) { r = remap[idx[i]] = pos.length / 3; pos.push(mesh.pos[idx[i] * 3], mesh.pos[idx[i] * 3 + 1], mesh.pos[idx[i] * 3 + 2]); }
    out[i] = r;
  }
  return { pos: new Float32Array(pos), idx: out, tris: out.length / 3 };
}

function concat(meshes) {
  const nv = meshes.reduce((s, m) => s + m.pos.length, 0), ni = meshes.reduce((s, m) => s + m.idx.length, 0);
  const pos = new Float32Array(nv), idx = new Uint32Array(ni);
  let pv = 0, pi = 0;
  for (const m of meshes) { pos.set(m.pos, pv); for (let i = 0; i < m.idx.length; i++) idx[pi + i] = m.idx[i] + pv / 3; pv += m.pos.length; pi += m.idx.length; }
  return { pos, idx, tris: ni / 3 };
}

// BodyParts3D: đơn vị mm, trục Z hướng lên, Y hướng ra sau → three.js: Y lên, Z hướng ra trước (mặt trước nhìn về +Z), đơn vị mét.
let T = null; // {cx, cy, zmin} tính từ xương
function toThree(pos) {
  const out = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    out[i] = (pos[i] - T.cx) * 0.001;
    out[i + 1] = (pos[i + 2] - T.zmin) * 0.001;
    out[i + 2] = -(pos[i + 1] - T.cy) * 0.001;
  }
  return out;
}
function normals(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const k of [a, b, c]) { n[k] += nx; n[k + 1] += ny; n[k + 2] += nz; }
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
const t0 = Date.now();

// --- đọc và đếm tam giác gốc
const load = (ids) => ids.map((f) => ({ f, m: readStl(f) }));
const bones = load(M.context.bones);
{ // khung toạ độ từ xương: tâm theo X/Y, chân chạm đất
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity, minz = Infinity;
  for (const { m } of bones) for (let i = 0; i < m.pos.length; i += 3) {
    minx = Math.min(minx, m.pos[i]); maxx = Math.max(maxx, m.pos[i]);
    miny = Math.min(miny, m.pos[i + 1]); maxy = Math.max(maxy, m.pos[i + 1]); minz = Math.min(minz, m.pos[i + 2]);
  }
  T = { cx: (minx + maxx) / 2, cy: (miny + maxy) / 2, zmin: minz };
}
const ctxMus = load(M.context.muscles);
const sel = M.muscles.flatMap((u) => ["L", "R", "C"].flatMap((side) => (u.fma[side] || []).length ? [{ id: u.id, side, parts: load(u.fma[side]) }] : []));
const sum = (arr) => arr.reduce((s, x) => s + x.m.tris, 0);
const raw = { selectable: sel.reduce((s, g) => s + sum(g.parts), 0), contextMuscles: sum(ctxMus), bones: sum(bones) };
const ratio = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Math.min(1, BUDGET[k] / v)]));

// --- tài liệu glTF
const doc = new Document();
const buf = doc.createBuffer();
const scene = doc.createScene("body");
const mats = {
  muscle: doc.createMaterial("muscle").setBaseColorFactor([0.72, 0.26, 0.22, 1]).setRoughnessFactor(0.6).setMetallicFactor(0),
  ctx: doc.createMaterial("context-muscle").setBaseColorFactor([0.55, 0.36, 0.33, 1]).setRoughnessFactor(0.75).setMetallicFactor(0),
  bone: doc.createMaterial("bone").setBaseColorFactor([0.9, 0.87, 0.8, 1]).setRoughnessFactor(0.8).setMetallicFactor(0),
};
const addNode = (name, mesh, mat, extras) => {
  const p = toThree(mesh.pos);
  const prim = doc.createPrimitive()
    .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(p).setBuffer(buf))
    .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(normals(p, mesh.idx)).setBuffer(buf))
    .setIndices(doc.createAccessor().setType("SCALAR").setArray(mesh.idx).setBuffer(buf))
    .setMaterial(mat);
  const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)).setExtras(extras || {});
  scene.addChild(node);
  return mesh.tris;
};
const final = { selectable: 0, contextMuscles: 0, bones: 0, nodes: [] };
for (const g of sel) {
  const mesh = concat(g.parts.map((x) => simplify(x.m, ratio.selectable)));
  final.selectable += addNode(`muscle:${g.id}:${g.side}`, mesh, mats.muscle, { muscleId: g.id, side: g.side, fma: g.parts.map((x) => x.f) });
  final.nodes.push(`muscle:${g.id}:${g.side}`);
}
final.contextMuscles = addNode("context:muscles", concat(ctxMus.map((x) => simplify(x.m, ratio.contextMuscles))), mats.ctx, { context: "muscles" });
final.bones = addNode("context:bones", concat(bones.map((x) => simplify(x.m, ratio.bones))), mats.bone, { context: "bones" });
doc.getRoot().setExtras({
  source: "BodyParts3D 3.0 (20110915), bản sao GitHub Kevin-Mattheus-Moerman/BodyParts3D",
  license: "CC BY-SA 2.1 JP",
  attribution: "BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan",
  modified: "Đã gộp lưới theo đơn vị cơ, giảm lưới, đổi hệ trục và đơn vị (dự án Bản đồ cơ bắp 3D, 2026-10-12)",
});

doc.createExtension(KHRMeshQuantization).setRequired(true);
await doc.transform(quantize({ quantizePosition: 14, quantizeNormal: 10 }));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
mkdirSync("public/models", { recursive: true });
const glb = await io.writeBinary(doc);
writeFileSync(OUT, glb);
const report = { rawTriangles: raw, ratio, finalTriangles: { selectable: final.selectable, contextMuscles: final.contextMuscles, bones: final.bones, total: final.selectable + final.contextMuscles + final.bones }, nodes: final.nodes.length + 2, bytes: glb.length, seconds: (Date.now() - t0) / 1000 };
writeFileSync("tools/model/build-report.json", JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
