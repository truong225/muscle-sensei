// Trạng thái trên URL: #co=<muscleId>&tab=gym|calisthenics  (thêm "nguon" khi mở trang Nguồn & giấy phép)
import { muscleById } from "./data.js";

export function readHash(hash = window.location.hash) {
  const p = new URLSearchParams(String(hash).replace(/^#/, ""));
  const co = p.get("co");
  const tab = p.get("tab");
  return {
    muscleId: co && muscleById.has(co) ? co : null,
    tab: tab === "calisthenics" ? "calisthenics" : "gym",
    sources: p.has("nguon"),
  };
}

export function buildHash({ muscleId, tab, sources }) {
  const parts = [];
  if (muscleId) {
    parts.push("co=" + encodeURIComponent(muscleId));
    parts.push("tab=" + (tab === "calisthenics" ? "calisthenics" : "gym"));
  }
  if (sources) parts.push("nguon");
  return parts.length ? "#" + parts.join("&") : "";
}

export function writeHash(state) {
  const h = buildHash(state);
  if (h === window.location.hash || (!h && !window.location.hash)) return;
  const url = window.location.pathname + window.location.search + h;
  window.history.replaceState(null, "", url);
}
