#!/usr/bin/env node
// Cổng V-C4 (dữ liệu): bản tiếng Anh đầy đủ và thuần tiếng Anh.
// Dùng: node scripts/check-i18n.mjs [--only gym|calisthenics|meta]
import { readFileSync, existsSync } from "node:fs";

const rd = (p) => JSON.parse(readFileSync(p, "utf8"));
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const EX = rd("src/data/exercises.json"), M = rd("src/data/muscles.json"), X = rd("src/data/exceptions.json");
// Ký tự chỉ có trong tiếng Việt (chữ có dấu, đ). Tên riêng Latin/Anh không chứa các ký tự này.
const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const errs = [];
const str = (v, where) => {
  if (typeof v !== "string" || !v.trim()) errs.push(`${where}: rỗng`);
  else if (VI.test(v)) errs.push(`${where}: còn tiếng Việt → "${v.slice(0, 60)}"`);
};
const arr = (en, vi, where) => {
  if (!Array.isArray(en)) { errs.push(`${where}: không phải mảng`); return; }
  if (en.length !== vi.length) errs.push(`${where}: ${en.length} mục, bản Việt có ${vi.length}`);
  en.forEach((s, i) => str(s, `${where}[${i}]`));
};

for (const type of ["gym", "calisthenics"]) {
  if (only && only !== type) continue;
  const f = `src/data/i18n/en-${type}.json`;
  if (!existsSync(f)) { errs.push(`thiếu ${f}`); continue; }
  const en = rd(f);
  const want = EX.filter((e) => e.type === type);
  for (const e of want) {
    const t = en[e.id];
    if (!t) { errs.push(`${f}: thiếu ${e.id}`); continue; }
    str(t.name, `${e.id}.name`);
    arr(t.steps, e.steps, `${e.id}.steps`);
    arr(t.safety, e.safety || [], `${e.id}.safety`);
    arr(t.equipment, e.equipment || [], `${e.id}.equipment`);
  }
  for (const id of Object.keys(en)) if (!want.some((e) => e.id === id)) errs.push(`${f}: id lạ ${id}`);
}
if (!only || only === "meta") {
  const f = "src/data/i18n/en-meta.json";
  if (!existsSync(f)) errs.push(`thiếu ${f}`);
  else {
    const en = rd(f);
    for (const g of M.groups) str(en.groups?.[g.id], `group ${g.id}`);
    for (const m of M.muscles) {
      const t = en.muscles?.[m.id];
      if (!t) { errs.push(`thiếu muscle ${m.id}`); continue; }
      str(t.name, `muscle ${m.id}.name`);
      arr(t.function, m.functionVi, `muscle ${m.id}.function`);
    }
    for (const [mid, tabs] of Object.entries(X)) for (const tab of Object.keys(tabs)) str(en.exceptions?.[mid]?.[tab], `exception ${mid}.${tab}`);
    for (const l of [1, 2, 3, 4, 5]) str(en.levels?.[l], `level ${l}`);
  }
}
console.log(JSON.stringify({ only: only || "all", errors: errs.length }));
if (errs.length) { console.error("FAIL i18n\n" + errs.slice(0, 40).join("\n") + (errs.length > 40 ? `\n… và ${errs.length - 40} lỗi khác` : "")); process.exit(1); }
console.log("PASS i18n: bản tiếng Anh đủ mục, đúng số bước, không còn tiếng Việt");
