#!/usr/bin/env node
// C4 (phần thang điểm): difficulty khớp quy tắc nguồn trong src/data/difficulty-rubric.md.
// - Bài có fedbId: beginner → 1–2, intermediate → 3, expert → 4–5; lệch tối đa 1 mức và phải có lý do (difficultyBasis không chỉ nhắc lại level).
// - difficultyBasis bắt đầu bằng "Mức N – <Nhãn>" đúng mức và nhãn trong rubric; không tham chiếu điểm không được định nghĩa (vd. "T = n").
// - Chuỗi tiến cấp (progressionOf): mức ≥ bài đứng trước.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ex = JSON.parse(readFileSync(path.join(root, "src/data/exercises.json"), "utf8"));
const fedb = JSON.parse(readFileSync(path.join(root, "tools/data/cache/exercises.json"), "utf8"));
const level = Object.fromEntries(fedb.map((f) => [f.id, f.level]));
const LABEL = { 1: "Nhập môn", 2: "Cơ bản", 3: "Trung cấp", 4: "Nâng cao", 5: "Chuyên sâu" };
const RANGE = { beginner: [1, 2], intermediate: [3, 3], expert: [4, 5] };
const byId = new Map(ex.map((e) => [e.id, e]));
const errs = [], deviations = [];
for (const e of ex) {
  const m = e.difficultyBasis.match(/^Mức (\d) – ([^:(]+?)\s*(\([^)]*\))?:/);
  if (!m || Number(m[1]) !== e.difficulty || m[2].trim() !== LABEL[e.difficulty]) errs.push(`${e.id}: difficultyBasis không mở đầu bằng "Mức ${e.difficulty} – ${LABEL[e.difficulty]}:"`);
  if (/\bT\s*=\s*\d/.test(e.difficultyBasis)) errs.push(`${e.id}: tham chiếu điểm T không có trong rubric`);
  if (e.fedbId) {
    const lv = level[e.fedbId];
    if (!lv) { errs.push(`${e.id}: fedbId ${e.fedbId} không có trong free-exercise-db`); continue; }
    const [lo, hi] = RANGE[lv];
    const dev = e.difficulty < lo ? lo - e.difficulty : e.difficulty > hi ? e.difficulty - hi : 0;
    if (dev > 1) errs.push(`${e.id}: mức ${e.difficulty} lệch ${dev} mức so với '${lv}'`);
    else if (dev === 1) {
      deviations.push(`${e.id} (${lv} → ${e.difficulty})`);
      const reason = e.difficultyBasis.replace(/^Mức \d – [^:]+:/, "").replace(/free-exercise-db xếp '\w+'/, "").trim();
      if (reason.length < 25) errs.push(`${e.id}: lệch 1 mức so với '${lv}' nhưng không ghi lý do`);
    }
  }
  if (e.progressionOf) {
    const prev = byId.get(e.progressionOf);
    if (!prev) errs.push(`${e.id}: progressionOf ${e.progressionOf} không tồn tại`);
    else if (e.difficulty < prev.difficulty) errs.push(`${e.id}: mức ${e.difficulty} < bài trước ${prev.id} (${prev.difficulty})`);
  }
}
console.log(JSON.stringify({ exercises: ex.length, withFedb: ex.filter((e) => e.fedbId).length, deviationsOneLevel: deviations.length, errors: errs.length }));
if (deviations.length) console.log("Lệch 1 mức (có lý do): " + deviations.join(", "));
if (errs.length) { console.error("FAIL C4-rubric\n" + errs.slice(0, 25).join("\n") + (errs.length > 25 ? `\n… và ${errs.length - 25} lỗi khác` : "")); process.exit(1); }
console.log("PASS C4-rubric: độ khó khớp quy tắc nguồn và nhãn trong difficulty-rubric.md");
