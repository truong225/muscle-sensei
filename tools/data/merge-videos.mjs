#!/usr/bin/env node
// V3m (nút code): gộp src/data/videos/part-{1..4}.json (+ follow-up-*.json nếu có) → src/data/videos.json theo thứ tự exercises.json.
// - Mục "none" do hết lượt tìm kiếm (lý do chứa "not searched"/"pending"/"budget") được gắn pending:true → UI hiện nút tìm YouTube, lần chạy sau tìm tiếp.
// - Chuẩn hoá khoảng trắng trong title/channel (oEmbed trả về có xuống dòng/khoảng trắng kép).
// - Bản vá ghi chú (NOTE_PATCH) cho video dùng chung giữa các phần.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";

const rd = (p) => JSON.parse(readFileSync(p, "utf8"));
const EX = rd("src/data/exercises.json");
const files = [1, 2, 3, 4].map((n) => `src/data/videos/part-${n}.json`)
  .concat(readdirSync("src/data/videos").filter((f) => /^follow-up-.*\.json$/.test(f)).sort().map((f) => `src/data/videos/${f}`));
const NOTE_PATCH = {
  "dead-bug": " (shared with dumbbell-dead-bug, which uses this bodyweight version as a variant)",
};
const out = {};
for (const f of files) {
  if (!existsSync(f)) continue;
  for (const [id, v] of Object.entries(rd(f))) {
    // follow-up chỉ ghi đè mục còn pending
    if (out[id] && !out[id].pending && f.includes("follow-up")) continue;
    if (v.none && /not searched|pending|budget/i.test(v.reason)) out[id] = { ...v, pending: true };
    else if (v.none) out[id] = v;
    else out[id] = { ...v, title: v.title.replace(/\s+/g, " ").trim(), channel: v.channel.trim(), note: v.note + (NOTE_PATCH[id] || "") };
  }
}
const ordered = Object.fromEntries(EX.map((e) => [e.id, out[e.id]]));
writeFileSync("src/data/videos.json", JSON.stringify(ordered, null, 1));
const vals = Object.values(ordered);
console.log(JSON.stringify({ files: files.filter(existsSync).length, total: vals.length, withVideo: vals.filter((v) => v && !v.none).length, pending: vals.filter((v) => v?.pending).length, none: vals.filter((v) => v?.none && !v.pending).length }));
