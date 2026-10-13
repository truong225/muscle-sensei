#!/usr/bin/env node
// Cổng dữ liệu: C3 (đủ bài), C4 (dễ → khó), C5 (có nguồn), C6 (nhất quán).
// Dùng:
//   node scripts/check-data.mjs                         kiểm tra src/data/exercises.json + sources.json (bản gộp)
//   node scripts/check-data.mjs --draft gym-upper       kiểm tra một file nháp: src/data/draft/gym-upper.json
//                                                       (+ draft/sources-gym-upper.json), phủ cơ thuộc nửa "upper"
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = (f) => JSON.parse(readFileSync(path.join(root, f), "utf8"));
const args = process.argv.slice(2);
const draft = args.includes("--draft") ? args[args.indexOf("--draft") + 1] : null;
const MIN_PER_TAB = 3;

const { groups, muscles } = rd("src/data/muscles.json");
const muscleIds = new Set(muscles.map((m) => m.id));
const errs = [], warns = [];

let exercises, sources, types, scopeMuscles;
if (draft) {
  const [type, half] = draft.split("-");
  exercises = rd(`src/data/draft/${draft}.json`);
  sources = { ...rd("src/data/draft/sources-muscles.json"), ...rd(`src/data/draft/sources-${draft}.json`) };
  const part = rd("src/data/draft/partition.json")[half];
  if (!part) { console.error("partition không hợp lệ: " + half); process.exit(2); }
  types = [type === "cali" ? "calisthenics" : type];
  scopeMuscles = muscles.filter((m) => m.selectable && part.includes(m.group));
} else {
  exercises = rd("src/data/exercises.json");
  sources = rd("src/data/sources.json");
  types = ["gym", "calisthenics"];
  scopeMuscles = muscles.filter((m) => m.selectable);
}
const exceptionsFile = "src/data/coverage-exceptions.json";
const draftExFile = draft ? `src/data/draft/exceptions-${draft}.json` : null;
const exceptions = draftExFile
  ? (existsSync(path.join(root, draftExFile)) ? rd(draftExFile) : {})
  : (existsSync(path.join(root, exceptionsFile)) ? rd(exceptionsFile) : {});

// ---- schema + C5 + C6 cho từng bài
const isHttps = (u) => typeof u === "string" && /^https:\/\/[^\s]+$/.test(u);
const str = (v) => typeof v === "string" && v.trim().length > 0;
const ids = new Set();
const nameKey = new Map();
for (const e of exercises) {
  const t = `bài ${e.id}`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id || "")) errs.push(`${t}: id sai dạng`);
  if (ids.has(e.id)) errs.push(`${t}: trùng id`); ids.add(e.id);
  const nk = `${e.type}|${(e.nameEn || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  if (nameKey.has(nk)) errs.push(`${t}: trùng tên với ${nameKey.get(nk)}`); nameKey.set(nk, e.id);
  for (const f of ["nameVi", "nameEn", "difficultyBasis"]) if (!str(e[f])) errs.push(`${t}: thiếu ${f}`);
  if (!types.includes(e.type)) errs.push(`${t}: type ${e.type} không hợp lệ`);
  if (!Number.isInteger(e.difficulty) || e.difficulty < 1 || e.difficulty > 5) errs.push(`${t}: difficulty ${e.difficulty}`);
  if (!Array.isArray(e.equipment) || !e.equipment.length) errs.push(`${t}: thiếu equipment`);
  if (!Array.isArray(e.steps) || e.steps.length < 3 || !e.steps.every(str)) errs.push(`${t}: cần ≥3 bước`);
  if (!Array.isArray(e.safety) || !e.safety.length || !e.safety.every(str)) errs.push(`${t}: thiếu lưu ý an toàn`);
  if (!Array.isArray(e.primary) || !e.primary.length) errs.push(`${t}: thiếu cơ chính`);
  for (const m of [...(e.primary || []), ...(e.secondary || [])]) if (!muscleIds.has(m)) errs.push(`${t}: muscleId lạ "${m}"`);
  if ((e.primary || []).some((m) => (e.secondary || []).includes(m))) errs.push(`${t}: cơ vừa chính vừa phụ`);
  if (e.image !== null) errs.push(`${t}: image phải là null (quyết định N6: chỉ chữ)`);
  if (!Array.isArray(e.sources) || !e.sources.length) errs.push(`${t}: thiếu nguồn`);
  for (const u of e.sources || []) {
    if (!isHttps(u)) errs.push(`${t}: URL không hợp lệ ${u}`);
    else if (!sources[u]) errs.push(`${t}: URL chưa có trong sources: ${u}`);
  }
  if ((e.sources || []).length && (e.sources || []).every((u) => /free-exercise-db|wikipedia\.org/.test(u))) errs.push(`${t}: cần ≥1 nguồn kỹ thuật ngoài free-exercise-db/Wikipedia`);
}
for (const [u, s] of Object.entries(sources)) {
  if (!isHttps(u)) errs.push(`sources: URL không hợp lệ ${u}`);
  if (!str(s.title) || !str(s.checked)) errs.push(`sources: ${u} thiếu title/checked`);
}
// C5 cho cơ
if (!draft) for (const m of muscles) if (!m.sources?.length || !m.sources.every((u) => sources[u])) errs.push(`cơ ${m.id}: nguồn thiếu trong sources.json`);

// ---- C3 phủ + C4 thứ tự
const coverage = {};
for (const m of scopeMuscles) {
  coverage[m.id] = {};
  for (const ty of types) {
    const list = exercises.filter((e) => e.type === ty && e.primary.includes(m.id));
    coverage[m.id][ty] = list.length;
    if (list.length < MIN_PER_TAB) {
      const ex = exceptions?.[m.id]?.[ty];
      if (ex && str(ex.reason) && ex.sources?.length) warns.push(`ngoại lệ C3: ${m.id}/${ty} có ${list.length} bài — ${ex.reason}`);
      else errs.push(`C3: ${m.id}/${ty} chỉ có ${list.length} bài (cần ≥${MIN_PER_TAB})`);
    }
  }
}
// Thứ tự hiển thị = sắp ổn định theo (difficulty, order, id) — kiểm tra hàm sắp xếp dùng chung của UI
const { sortExercises } = await import(path.join(root, "src/data/sortExercises.js"));
for (const m of scopeMuscles) for (const ty of types) {
  const list = sortExercises(exercises.filter((e) => e.type === ty && e.primary.includes(m.id)));
  for (let i = 1; i < list.length; i++) if (list[i].difficulty < list[i - 1].difficulty) errs.push(`C4: ${m.id}/${ty} giảm độ khó tại ${list[i].id}`);
}

const total = exercises.length;
const byType = Object.fromEntries(types.map((t) => [t, exercises.filter((e) => e.type === t).length]));
console.log(JSON.stringify({ mode: draft || "merged", exercises: total, byType, musclesInScope: scopeMuscles.length, sources: Object.keys(sources).length, warnings: warns.length, errors: errs.length }));
if (warns.length) console.log(warns.join("\n"));
if (errs.length) { console.error("FAIL\n" + errs.slice(0, 40).join("\n") + (errs.length > 40 ? `\n… +${errs.length - 40}` : "")); process.exit(1); }
console.log(`PASS C3/C4/C5/C6 (${draft || "bản gộp"})`);
