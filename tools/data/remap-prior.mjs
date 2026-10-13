#!/usr/bin/env node
// N3m (nút code): chuyển 279 bài của lần chạy 2026-10-11 sang danh mục cơ mới (muscles.json).
// Ánh xạ chắc chắn làm bằng code; id mơ hồ (deltoid, pectoralis-major, trapezius, quadriceps) để lại cho nút phán đoán N3j.
// Dùng: node tools/data/remap-prior.mjs
import { readFileSync, writeFileSync } from "node:fs";

const PRIOR = "run/backup/prior-run-2026-10-11/";
const ex = JSON.parse(readFileSync(PRIOR + "exercises.json", "utf8"));
const oldSources = JSON.parse(readFileSync(PRIOR + "sources.json", "utf8"));
const muscles = JSON.parse(readFileSync("src/data/muscles.json", "utf8"));
const NEW = new Set(muscles.muscles.map((m) => m.id));

const MAP = {
  "adductor-brevis": "hip-adductors", "adductor-longus": "hip-adductors", "adductor-magnus": "hip-adductors", gracilis: "hip-adductors",
  "biceps-femoris": "hamstrings", semimembranosus: "hamstrings", semitendinosus: "hamstrings",
  "extensor-carpi-radialis-brevis": "forearm-extensors", "extensor-carpi-radialis-longus": "forearm-extensors",
  "extensor-carpi-ulnaris": "forearm-extensors", "extensor-digitorum": "forearm-extensors",
  "flexor-carpi-radialis": "forearm-flexors", "finger-flexors": "forearm-flexors", "palmaris-longus": "forearm-flexors",
  "gluteus-medius": "gluteus-medius-minimus", "gluteus-minimus": "gluteus-medius-minimus",
  iliacus: "iliopsoas", "psoas-major": "iliopsoas",
  infraspinatus: "rotator-cuff", "teres-minor": "rotator-cuff", subscapularis: "rotator-cuff", supraspinatus: "rotator-cuff",
  "rhomboid-major": "rhomboids",
};
// Cơ chỉ còn là lưới ngữ cảnh (không chọn được) → bỏ khỏi danh sách cơ của bài.
const DROP = new Set(["fibularis-brevis", "fibularis-longus", "multifidus", "obturator-internus", "piriformis", "sartorius", "tibialis-posterior", "extensor-digitorum-longus"]);
const AMBIGUOUS = new Set(["deltoid", "pectoralis-major", "trapezius", "quadriceps"]);

const uniq = (a) => [...new Set(a)];
const report = { mapped: 0, needsJudgment: [], dropped: {}, unknown: {} };
const conv = (ids, e) => {
  const out = [];
  for (const id of ids) {
    if (NEW.has(id)) out.push(id);
    else if (MAP[id]) out.push(MAP[id]);
    else if (AMBIGUOUS.has(id)) out.push(id); // giữ tạm, N3j quyết định
    else if (DROP.has(id)) report.dropped[id] = (report.dropped[id] || 0) + 1;
    else report.unknown[id] = (report.unknown[id] || 0) + 1;
  }
  return uniq(out);
};

const outEx = ex.map((e) => {
  const primaryMuscles = conv(e.primary, e);
  const secondaryMuscles = conv(e.secondary, e).filter((m) => !primaryMuscles.includes(m));
  const amb = [...primaryMuscles, ...secondaryMuscles].filter((m) => AMBIGUOUS.has(m));
  if (amb.length || primaryMuscles.length === 0) report.needsJudgment.push({ id: e.id, ambiguous: amb, emptyPrimary: primaryMuscles.length === 0 });
  else report.mapped++;
  return {
    id: e.id, nameVi: e.nameVi, nameEn: e.nameEn, type: e.type, equipment: e.equipment,
    primaryMuscles, secondaryMuscles,
    difficulty: e.difficulty, order: e.order ?? 0, difficultyBasis: e.difficultyBasis,
    steps: e.steps, safety: e.safety,
    ...(e.progressionOf ? { progressionOf: e.progressionOf } : {}),
    ...(e.fedbId ? { fedbId: e.fedbId } : {}),
    sources: e.sources.map((url) => ({ url, checked: oldSources[url]?.checked ?? "2026-10-11" })),
  };
});
writeFileSync("src/data/draft/remapped.json", JSON.stringify(outEx, null, 1));
writeFileSync("src/data/draft/sources-prior.json", JSON.stringify(oldSources, null, 1));
writeFileSync("src/data/draft/remap-report.json", JSON.stringify(report, null, 1));
console.log(JSON.stringify({ total: outEx.length, mapped: report.mapped, needsJudgment: report.needsJudgment.length, dropped: report.dropped, unknown: report.unknown }));
