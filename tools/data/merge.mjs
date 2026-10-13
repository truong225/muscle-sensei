#!/usr/bin/env node
// N5 (nút code): gộp remapped.json + các bản vá judgment-{A,B,C,D} → src/data/exercises.json, sources.json, exceptions.json.
// Dùng: node tools/data/merge.mjs
import { readFileSync, writeFileSync } from "node:fs";

const rd = (p) => JSON.parse(readFileSync(p, "utf8"));
const D = "src/data/draft/";
let ex = rd(D + "remapped.json");
const muscles = rd("src/data/muscles.json");
const patches = ["A", "B", "C"].map((p) => rd(`${D}judgment-${p}.json`));
const lead = rd(D + "judgment-D.json");
const prior = rd(D + "sources-prior.json");
const today = "2026-10-12";
const uniq = (a) => [...new Set(a)];
const log = { removed: [], replaced: 0, promoted: [], added: 0, addPrimary: 0 };

// 1. Xoá bài
const remove = new Set(patches.flatMap((p) => p.remove || []));
ex = ex.filter((e) => (remove.has(e.id) ? (log.removed.push(e.id), false) : true));
const byId = new Map(ex.map((e) => [e.id, e]));

// 2. Thay id cũ
for (const p of patches) {
  for (const [eid, reps] of Object.entries(p.replace || {})) {
    const e = byId.get(eid);
    if (!e) throw new Error(`replace: không có bài ${eid}`);
    for (const [oldId, rep] of Object.entries(reps)) {
      const inP = e.primaryMuscles.includes(oldId), inS = e.secondaryMuscles.includes(oldId);
      if (!inP && !inS) throw new Error(`replace: ${eid} không chứa ${oldId}`);
      e.primaryMuscles = e.primaryMuscles.filter((m) => m !== oldId);
      e.secondaryMuscles = e.secondaryMuscles.filter((m) => m !== oldId);
      // Thêm đúng như bản vá chỉ định; kể cả khi id cũ chỉ là cơ phụ (thăng cấp có nguồn, ghi log)
      if (!inP && (rep.primary || []).length) log.promoted.push(`${eid}:${rep.primary.join("+")}`);
      e.primaryMuscles = uniq([...e.primaryMuscles, ...(rep.primary || [])]);
      e.secondaryMuscles = uniq([...e.secondaryMuscles, ...(rep.secondary || [])]);
      log.replaced++;
    }
  }
}
// 3. Bản vá trưởng nhóm: thêm cơ chính
for (const [eid, ids] of Object.entries(lead.addPrimary)) {
  const e = byId.get(eid);
  if (!e) throw new Error(`addPrimary: không có bài ${eid}`);
  e.primaryMuscles = uniq([...e.primaryMuscles, ...ids]);
  log.addPrimary++;
}
// 4. Thêm nguồn
const addSrc = (eid, urls) => {
  const e = byId.get(eid);
  if (!e) throw new Error(`addSources: không có bài ${eid}`);
  for (const u of urls) {
    const url = typeof u === "string" ? u : u.url;
    if (!e.sources.some((s) => s.url === url)) e.sources.push({ url, checked: (typeof u === "object" && u.checked) || today });
  }
};
for (const p of patches) for (const [eid, urls] of Object.entries(p.addSources || {})) addSrc(eid, urls);
for (const [eid, urls] of Object.entries(lead.addSources)) addSrc(eid, urls);
// 5. Bài mới
for (const p of patches) for (const n of p.newExercises || []) {
  if (byId.has(n.id)) throw new Error(`bài mới trùng id ${n.id}`);
  const e = { order: 0, ...n, sources: n.sources.map((s) => (typeof s === "string" ? { url: s, checked: today } : s)) };
  ex.push(e); byId.set(e.id, e); log.added++;
}
// 5b. Cạnh sửa lỗi lần 1: fix-{A,B,C,D} (rà nguồn cho cơ chính)
const fixes = ["A", "B", "C", "D"].map((x) => rd(`${D}fix-${x}.json`));
log.demoted = 0; log.srcRemoved = 0; log.srcAdded = 0;
for (const f of fixes) {
  for (const [eid, ids] of Object.entries(f.demote || {})) {
    const e = byId.get(eid); if (!e) throw new Error(`demote: không có bài ${eid}`);
    for (const m of ids) { if (!e.primaryMuscles.includes(m)) throw new Error(`demote: ${eid} không có cơ chính ${m}`); e.primaryMuscles = e.primaryMuscles.filter((x) => x !== m); e.secondaryMuscles = uniq([...e.secondaryMuscles, m]); log.demoted++; }
    if (!e.primaryMuscles.length) throw new Error(`demote làm ${eid} mất hết cơ chính`);
  }
  for (const [eid, urls] of Object.entries(f.removeSources || {})) {
    const e = byId.get(eid); if (!e) throw new Error(`removeSources: không có bài ${eid}`);
    const before = e.sources.length; e.sources = e.sources.filter((s) => !urls.includes(s.url)); log.srcRemoved += before - e.sources.length;
  }
  for (const [eid, urls] of Object.entries(f.addSources || {})) { const n = byId.get(eid)?.sources.length ?? 0; addSrc(eid, urls); log.srcAdded += (byId.get(eid).sources.length - n); }
  for (const n of f.newExercises || []) {
    if (byId.has(n.id)) throw new Error(`bài mới trùng id ${n.id}`);
    const e = { order: 0, ...n, sources: n.sources.map((s) => (typeof s === "string" ? { url: s, checked: today } : s)) };
    ex.push(e); byId.set(e.id, e); log.added++;
  }
}
for (const e of ex) if (!e.sources.length) throw new Error(`bài ${e.id} mất hết nguồn`);

// 6. Chuẩn hoá
for (const e of ex) {
  e.secondaryMuscles = e.secondaryMuscles.filter((m) => !e.primaryMuscles.includes(m));
  if (e.order == null) e.order = 0;
}
// Bài trong chuỗi tiến cấp cùng mức phải xếp sau bài tiền đề (order lớn hơn); lặp tới khi ổn định.
for (let changed = true, guard = 0; changed && guard < 50; guard++) {
  changed = false;
  for (const e of ex) {
    const p = e.progressionOf && byId.get(e.progressionOf);
    if (p && p.difficulty === e.difficulty && e.order <= p.order) { e.order = p.order + 1; changed = true; log.reordered = (log.reordered || 0) + 1; }
  }
}
ex.sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));

// 7. Sổ nguồn: chỉ giữ URL thực sự dùng (bài + cơ)
const reg = { ...prior };
for (const p of patches) Object.assign(reg, p.sourcesRegistry || {});
for (const f of fixes) Object.assign(reg, f.sourcesRegistry || {}); // bản sửa được ghi đè mô tả supports
const used = new Set([...ex.flatMap((e) => e.sources.map((s) => s.url)), ...muscles.muscles.flatMap((m) => m.sources.map((s) => s.url))]);
const exceptions = {};
for (const p of [...patches, ...fixes]) for (const [mid, tabs] of Object.entries(p.exceptions || {})) for (const [tab, v] of Object.entries(tabs)) {
  if ((lead.dropExceptions[mid] || []).includes(tab)) continue;
  (exceptions[mid] ||= {})[tab] = v;
  v.sources.forEach((u) => used.add(u));
}
for (const [mid, tabs] of Object.entries(lead.exceptionText || {})) for (const [tab, reason] of Object.entries(tabs)) if (exceptions[mid]?.[tab]) exceptions[mid][tab].reason = reason;
const sources = {};
const missing = [];
for (const u of [...used].sort()) {
  if (reg[u]) sources[u] = reg[u];
  else {
    const m = muscles.muscles.flatMap((x) => x.sources).find((s) => s.url === u);
    if (m) sources[u] = { title: null, publisher: new URL(u).hostname, checked: m.checked, supports: `Nguồn giải phẫu cho danh mục cơ (${m.supports})` };
    else missing.push(u);
  }
}
// 6. Cạnh sửa lỗi lần 2 (2026-10-13): fix-E sửa câu chữ bước thực hiện cho khớp nguồn
{
  const fe = rd(`${D}fix-E.json`);
  for (const [eid, edits] of Object.entries(fe.editSteps || {})) {
    const e = ex.find((x) => x.id === eid); if (!e) throw new Error(`editSteps: không có bài ${eid}`);
    for (const [i, text] of Object.entries(edits)) { if (!(Number(i) < e.steps.length)) throw new Error(`editSteps: ${eid} không có bước ${i}`); e.steps[Number(i)] = text; }
  }
}
// 7. Cạnh sửa lỗi lần 3 (2026-10-13): fix-F bỏ điểm T không còn định nghĩa trong difficultyBasis
{
  const ff = rd(`${D}fix-F.json`);
  for (const e of ex) for (const r of ff.basisRegex) e.difficultyBasis = e.difficultyBasis.replace(new RegExp(r.find, "g"), r.replace);
  for (const [eid, v] of Object.entries(ff.setDifficulty || {})) {
    const e = ex.find((x) => x.id === eid); if (!e) throw new Error(`setDifficulty: không có bài ${eid}`);
    e.difficulty = v.difficulty; e.difficultyBasis = v.difficultyBasis;
  }
}
writeFileSync("src/data/exercises.json", JSON.stringify(ex, null, 1));
writeFileSync("src/data/sources.json", JSON.stringify(sources, null, 1));
writeFileSync("src/data/exceptions.json", JSON.stringify(exceptions, null, 1));
console.log(JSON.stringify({ exercises: ex.length, gym: ex.filter((e) => e.type === "gym").length, calisthenics: ex.filter((e) => e.type === "calisthenics").length, sources: Object.keys(sources).length, missingRegistry: missing, ...log, promoted: log.promoted.length }, null, 1));
