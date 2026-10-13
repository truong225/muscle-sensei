// Chỉ mục dữ liệu dùng chung cho giao diện (không sửa dữ liệu gốc).
import musclesJson from "../data/muscles.json";
import exercisesJson from "../data/exercises.json";
import sourcesJson from "../data/sources.json";
import exceptionsJson from "../data/exceptions.json";
import videosJson from "../data/videos.json";
import rubricMd from "../data/difficulty-rubric.md?raw";
import { sortExercises } from "../data/sortExercises.js";

export const MUSCLES_JSON = musclesJson;
export const GROUPS = [...musclesJson.groups].sort((a, b) => a.order - b.order);
export const MUSCLES = musclesJson.muscles;
export const EXERCISES = exercisesJson;
export const SOURCES = sourcesJson;
export const EXCEPTIONS = exceptionsJson;
export const VIDEOS = videosJson;
export const TABS = [
  { id: "gym", label: "Gym" },
  { id: "calisthenics", label: "Calisthenics" },
];

export const muscleById = new Map(MUSCLES.map((m) => [m.id, m]));
export const groupById = new Map(GROUPS.map((g) => [g.id, g]));
export const exerciseById = new Map(EXERCISES.map((e) => [e.id, e]));

// Cơ theo nhóm, theo thứ tự nhóm; trong nhóm giữ thứ tự của muscles.json.
export const MUSCLES_BY_GROUP = GROUPS.map((g) => ({ group: g, muscles: MUSCLES.filter((m) => m.group === g.id) })).filter(
  (x) => x.muscles.length,
);

const listCache = new Map();
/** Bài có `muscleId` trong primaryMuscles, đúng loại, xếp dễ → khó bằng sortExercises. */
export function exercisesFor(muscleId, type) {
  const key = muscleId + "|" + type;
  if (!listCache.has(key)) {
    listCache.set(key, sortExercises(EXERCISES.filter((e) => e.type === type && e.primaryMuscles.includes(muscleId))));
  }
  return listCache.get(key);
}

export function exceptionFor(muscleId, type) {
  return EXCEPTIONS[muscleId]?.[type] || null;
}

// ---------- thang độ khó (đọc từ difficulty-rubric.md, có dự phòng)
const FALLBACK_RUBRIC = [
  { level: 1, label: "Nhập môn", desc: "", example: "" },
  { level: 2, label: "Cơ bản", desc: "", example: "" },
  { level: 3, label: "Trung cấp", desc: "", example: "" },
  { level: 4, label: "Nâng cao", desc: "", example: "" },
  { level: 5, label: "Chuyên sâu", desc: "", example: "" },
];
function parseRubric(md) {
  const rows = [];
  for (const line of String(md).split("\n")) {
    const m = line.match(/^\|\s*([1-5])\s*\|([^|]+)\|([^|]+)\|([^|]+)\|/);
    if (m) rows.push({ level: +m[1], label: m[2].trim(), desc: m[3].trim(), example: m[4].trim() });
  }
  return rows.length === 5 ? rows : FALLBACK_RUBRIC;
}
export const RUBRIC = parseRubric(rubricMd);

// ---------- dữ liệu tiếng Anh (tải động: người dùng tiếng Việt không phải tải)
let EN = null;
let enPromise = null;
export function enReady() {
  return !!EN;
}
export function loadEn() {
  if (EN) return Promise.resolve(EN);
  if (!enPromise) {
    enPromise = Promise.all([
      import("../data/i18n/en-meta.json"),
      import("../data/i18n/en-gym.json"),
      import("../data/i18n/en-calisthenics.json"),
    ])
      .then(([meta, gym, cali]) => {
        EN = { meta: meta.default, ex: { ...gym.default, ...cali.default } };
        return EN;
      })
      .catch((e) => {
        enPromise = null;
        throw e;
      });
  }
  return enPromise;
}
const isEn = (lang) => lang === "en" && EN;

// ---------- truy cập dữ liệu theo ngôn ngữ
export function muscleName(m, lang) {
  if (!m) return "";
  return isEn(lang) ? EN.meta.muscles[m.id]?.name || m.nameEn : m.nameVi;
}
export function muscleFunctions(m, lang) {
  return isEn(lang) ? EN.meta.muscles[m.id]?.function || [] : m.functionVi || [];
}
export function groupName(g, lang) {
  if (!g) return "";
  return isEn(lang) ? EN.meta.groups[g.id] || g.id : g.nameVi;
}
export function exName(ex, lang) {
  return isEn(lang) ? EN.ex[ex.id]?.name || ex.nameEn : ex.nameVi;
}
/** Tên tiếng Anh của bài (dùng làm từ khoá tìm YouTube ở cả hai ngôn ngữ). */
export function exNameEn(ex) {
  return EN?.ex[ex.id]?.name || ex.nameEn;
}
export function exSteps(ex, lang) {
  return isEn(lang) ? EN.ex[ex.id]?.steps || [] : ex.steps || [];
}
export function exSafety(ex, lang) {
  return isEn(lang) ? EN.ex[ex.id]?.safety || [] : ex.safety || [];
}
export function exceptionReason(muscleId, type, lang) {
  if (isEn(lang)) return EN.meta.exceptions[muscleId]?.[type] || "";
  return EXCEPTIONS[muscleId]?.[type]?.reason || "";
}
export function levelLabel(n, lang = "vi") {
  if (isEn(lang)) return EN.meta.levels[String(n)] || "";
  return RUBRIC.find((r) => r.level === n)?.label || "";
}
export function videoFor(exId) {
  return VIDEOS[exId] || null;
}

// ---------- nguồn
export function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
export function sourceInfo(url, checked) {
  const s = SOURCES[url] || {};
  return {
    url,
    title: s.title || hostnameOf(url),
    publisher: s.publisher || hostnameOf(url),
    checked: checked || s.checked || null,
    host: hostnameOf(url),
  };
}
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso || "";
}

// ---------- tìm kiếm không dấu
export function fold(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
const searchIndexes = {};
function searchIndexFor(lang) {
  const key = isEn(lang) ? "en" : "vi";
  if (!searchIndexes[key]) {
    searchIndexes[key] = new Map(
      MUSCLES.map((m) => {
        const g = groupById.get(m.group);
        const parts =
          key === "en"
            ? [muscleName(m, "en"), m.nameLa, groupName(g, "en"), m.id.replace(/-/g, " ")]
            : // tiếng Việt: tên Việt (có/không dấu), Latin, và cả tên tiếng Anh quen dùng trong phòng tập (lats, biceps…)
              [m.nameVi, m.nameLa, m.nameEn, g?.nameVi, m.id.replace(/-/g, " ")];
        return [m.id, fold(parts.join(" | "))];
      }),
    );
  }
  return searchIndexes[key];
}
export function searchMuscles(query, lang = "vi") {
  const tokens = fold(query).split(/[\s,.;:()–-]+/).filter(Boolean);
  if (!tokens.length) return MUSCLES_BY_GROUP;
  const index = searchIndexFor(lang);
  return MUSCLES_BY_GROUP.map(({ group, muscles }) => ({
    group,
    muscles: muscles.filter((m) => {
      const hay = index.get(m.id);
      return tokens.every((t) => hay.includes(t));
    }),
  })).filter((x) => x.muscles.length);
}

// ---------- thống kê cho trang nguồn
export const STATS = {
  muscles: MUSCLES.length,
  groups: GROUPS.length,
  gym: EXERCISES.filter((e) => e.type === "gym").length,
  calisthenics: EXERCISES.filter((e) => e.type === "calisthenics").length,
  sources: Object.keys(SOURCES).length,
};

export function sourcesByHost() {
  const map = new Map();
  for (const [url, s] of Object.entries(SOURCES)) {
    const host = hostnameOf(url);
    if (!map.has(host)) map.set(host, { host, publishers: new Map(), items: [] });
    const g = map.get(host);
    g.items.push({ url, title: s.title || url, checked: s.checked });
    if (s.publisher) g.publishers.set(s.publisher, (g.publishers.get(s.publisher) || 0) + 1);
  }
  return [...map.values()]
    .map((g) => ({
      host: g.host,
      publisher: [...g.publishers.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || g.host,
      items: g.items.sort((a, b) => a.title.localeCompare(b.title, "vi")),
    }))
    .sort((a, b) => b.items.length - a.items.length || a.publisher.localeCompare(b.publisher, "vi"));
}
