#!/usr/bin/env node
// Cổng dữ liệu: C3 (đủ bài), C4 (dễ → khó), C5 (có nguồn), C6 (tham chiếu nhất quán, không trùng).
import { readFileSync } from "node:fs";
import { sortExercises } from "../src/data/sortExercises.js";

const rd = (p) => JSON.parse(readFileSync(p, "utf8"));
const M = rd("src/data/muscles.json");
const EX = rd("src/data/exercises.json");
const SRC = rd("src/data/sources.json");
const EXC = rd("src/data/exceptions.json");
const inv = new Set(readFileSync("tools/model/fma-inventory.tsv", "utf8").split("\n").slice(1).map((l) => l.split("\t")[0]).filter(Boolean));
const err = { C3: [], C4: [], C5: [], C6: [] };
const https = (u) => typeof u === "string" && /^https:\/\/[^\s]+\.[^\s]+/.test(u);
const date = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "");
const str = (s) => typeof s === "string" && s.trim().length > 0;

// ---------- muscles.json (C5, C6)
const mids = new Set(), gids = new Set(M.groups.map((g) => g.id)), seenFma = new Map();
if (M.muscles.length < 38 || M.muscles.length > 45) err.C6.push(`số cơ chọn được ${M.muscles.length} ngoài 38–45`);
for (const m of M.muscles) {
  if (mids.has(m.id)) err.C6.push(`trùng muscle id ${m.id}`); mids.add(m.id);
  if (!gids.has(m.group)) err.C6.push(`${m.id}: nhóm ${m.group} không tồn tại`);
  for (const f of ["nameVi", "nameLa", "nameEn"]) if (!str(m[f])) err.C6.push(`${m.id}: thiếu ${f}`);
  if (!Array.isArray(m.functionVi) || !m.functionVi.length) err.C5.push(`${m.id}: thiếu chức năng`);
  const fmas = [...(m.fma.L || []), ...(m.fma.R || []), ...(m.fma.C || [])];
  if (!fmas.length) err.C6.push(`${m.id}: không có lưới`);
  for (const f of fmas) {
    if (!inv.has(f)) err.C6.push(`${m.id}: ${f} không có trong kho lưới`);
    if (seenFma.has(f)) err.C6.push(`${f} dùng ở cả ${seenFma.get(f)} và ${m.id}`); seenFma.set(f, m.id);
  }
  if (!m.sources?.length || !m.sources.every((s) => https(s.url) && date(s.checked))) err.C5.push(`${m.id}: nguồn thiếu/sai`);
}
for (const f of [...M.context.muscles, ...M.context.bones]) {
  if (!inv.has(f)) err.C6.push(`context ${f} không có trong kho lưới`);
  if (seenFma.has(f)) err.C6.push(`${f} vừa chọn được vừa là ngữ cảnh`);
}

// ---------- exercises.json
const eids = new Map(), names = new Set();
const CALI_BAN = /tạ|máy|cáp|dây kháng lực|dây chun|thanh ez|kettlebell/i;
for (const e of EX) {
  const t = `bài ${e.id}`;
  if (eids.has(e.id)) err.C6.push(`trùng id ${e.id}`); eids.set(e.id, e);
  const nk = `${e.type}|${(e.nameEn || "").toLowerCase().trim()}`;
  if (names.has(nk)) err.C6.push(`${t}: trùng nameEn trong cùng tab`); names.add(nk);
  for (const f of ["nameVi", "nameEn", "difficultyBasis"]) if (!str(e[f])) err.C6.push(`${t}: thiếu ${f}`);
  if (!["gym", "calisthenics"].includes(e.type)) err.C6.push(`${t}: type sai`);
  if (!Number.isInteger(e.difficulty) || e.difficulty < 1 || e.difficulty > 5) err.C4.push(`${t}: difficulty ${e.difficulty}`);
  if (!Array.isArray(e.steps) || e.steps.length < 2 || !e.steps.every(str)) err.C6.push(`${t}: bước thực hiện thiếu`);
  if (!Array.isArray(e.safety) || !e.safety.length) err.C6.push(`${t}: thiếu lưu ý an toàn`);
  if (!e.primaryMuscles?.length) err.C6.push(`${t}: không có cơ chính`);
  for (const m of [...(e.primaryMuscles || []), ...(e.secondaryMuscles || [])]) if (!mids.has(m)) err.C6.push(`${t}: cơ ${m} không có trong muscles.json`);
  if (e.type === "calisthenics" && e.equipment.some((q) => CALI_BAN.test(q))) err.C6.push(`${t}: calisthenics dùng dụng cụ tải ngoài (${e.equipment})`);
  if (!e.sources?.length) err.C5.push(`${t}: không có nguồn`);
  for (const s of e.sources || []) {
    if (!https(s.url) || !date(s.checked)) err.C5.push(`${t}: nguồn sai định dạng ${s.url}`);
    else if (!SRC[s.url]) err.C5.push(`${t}: ${s.url} không có trong sources.json`);
  }
}
for (const e of EX) if (e.progressionOf) {
  const p = eids.get(e.progressionOf);
  if (!p) err.C6.push(`bài ${e.id}: progressionOf ${e.progressionOf} không tồn tại`);
  else if (p.difficulty > e.difficulty) err.C4.push(`bài ${e.id} (mức ${e.difficulty}) dễ hơn bài trước nó ${p.id} (mức ${p.difficulty})`);
}
for (const [u, s] of Object.entries(SRC)) if (!https(u) || !date(s.checked) || !str(s.supports)) err.C5.push(`sources.json: ${u} thiếu checked/supports`);

// ---------- C3 + C4 theo từng cơ và tab
const stats = {};
for (const m of M.muscles) for (const tab of ["gym", "calisthenics"]) {
  const list = sortExercises(EX.filter((e) => e.type === tab && e.primaryMuscles.includes(m.id)));
  (stats[m.id] ||= {})[tab] = list.length;
  for (let i = 1; i < list.length; i++) if (list[i].difficulty < list[i - 1].difficulty) err.C4.push(`${m.id}/${tab}: thứ tự giảm tại ${list[i].id}`);
  // Trong cùng mức, bài đứng trước trong chuỗi tiến cấp phải đứng trước
  const pos = new Map(list.map((e, i) => [e.id, i]));
  for (const e of list) if (e.progressionOf && pos.has(e.progressionOf) && pos.get(e.progressionOf) > pos.get(e.id)) err.C4.push(`${m.id}/${tab}: ${e.id} đứng trước bài tiền đề ${e.progressionOf}`);
  if (list.length < 3) {
    const x = EXC[m.id]?.[tab];
    if (!x || !str(x.reason) || !x.sources?.length) err.C3.push(`${m.id}/${tab}: chỉ ${list.length} bài và không có ngoại lệ hợp lệ`);
  }
}
const exceptionsList = Object.entries(EXC).flatMap(([m, t]) => Object.keys(t).map((k) => `${m}/${k} (${stats[m]?.[k] ?? "?"} bài)`));
const summary = { muscles: M.muscles.length, groups: M.groups.length, exercises: EX.length, gym: EX.filter((e) => e.type === "gym").length, calisthenics: EX.filter((e) => e.type === "calisthenics").length, sources: Object.keys(SRC).length, exceptions: exceptionsList, errors: Object.fromEntries(Object.entries(err).map(([k, v]) => [k, v.length])) };
console.log(JSON.stringify(summary, null, 1));
if (process.argv.includes("--stats")) console.log(JSON.stringify(stats));
let fail = false;
for (const [k, v] of Object.entries(err)) if (v.length) { fail = true; console.error(`FAIL ${k}\n  ` + v.slice(0, 25).join("\n  ")); }
if (fail) process.exit(1);
console.log("PASS C3 C4 C5 C6 (dữ liệu)");
