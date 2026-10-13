#!/usr/bin/env node
// Cổng mô hình: C6 (ánh xạ 1–1 cơ ↔ node GLB) + C10 (ngân sách kích thước, tam giác, draw calls) + C9 (ghi công trong GLB).
import { readFileSync, statSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

await MeshoptDecoder.ready;
const GLB = "public/models/muscles.glb";
const M = JSON.parse(readFileSync("src/data/muscles.json", "utf8"));
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(GLB);
const errs = [];
const nodes = doc.getRoot().listNodes();
let tris = 0, prims = 0;
const found = new Map();
for (const n of nodes) {
  const mesh = n.getMesh();
  if (mesh) for (const p of mesh.listPrimitives()) { prims++; tris += (p.getIndices()?.getCount() ?? p.getAttribute("POSITION").getCount()) / 3; }
  const m = /^muscle:([a-z0-9-]+):(L|R|C)$/.exec(n.getName());
  if (m) {
    if (n.getExtras().muscleId !== m[1]) errs.push(`${n.getName()}: extras.muscleId sai`);
    found.set(`${m[1]}:${m[2]}`, n);
  } else if (!["context:muscles", "context:bones"].includes(n.getName())) errs.push(`node lạ: ${n.getName()}`);
}
const expected = new Set(M.muscles.flatMap((u) => ["L", "R", "C"].filter((s) => (u.fma[s] || []).length).map((s) => `${u.id}:${s}`)));
for (const k of expected) if (!found.has(k)) errs.push(`thiếu node muscle:${k}`);
for (const k of found.keys()) if (!expected.has(k)) errs.push(`node thừa muscle:${k}`);
for (const u of M.muscles) if (!found.has(`${u.id}:L`) && !found.has(`${u.id}:C`)) errs.push(`${u.id}: không có lưới để bấm`);
const bytes = statSync(GLB).size;
const attribution = doc.getRoot().getExtras().attribution || "";
if (!attribution.includes("BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan")) errs.push("GLB thiếu câu ghi công BodyParts3D");
if (bytes > 12 * 1024 * 1024) errs.push(`GLB ${bytes} B > 12 MB`);
if (tris > 600000) errs.push(`tam giác ${tris} > 600k`);
if (prims > 150) errs.push(`draw calls ước tính ${prims} > 150`);
console.log(JSON.stringify({ nodes: nodes.length, muscleNodes: found.size, expected: expected.size, triangles: tris, drawCallsEstimate: prims, bytes, errors: errs.length }));
if (errs.length) { console.error("FAIL model\n  " + errs.join("\n  ")); process.exit(1); }
console.log("PASS C6 (1–1 cơ ↔ lưới) + C10 (ngân sách) + ghi công trong GLB");
