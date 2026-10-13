// Chọn, nhớ và áp dụng ngôn ngữ giao diện.
// Thứ tự: ?lang=vi|en trên URL → lựa chọn đã lưu → navigator.language bắt đầu bằng "vi" → tiếng Anh.
import { createContext, useContext } from "react";
import { STRINGS } from "./strings.js";

const KEY = "co-bap-3d.lang";
const valid = (l) => (l === "vi" || l === "en" ? l : null);

export function langFromUrl() {
  try {
    return valid(new URLSearchParams(window.location.search).get("lang"));
  } catch {
    return null;
  }
}

export function savedLang() {
  try {
    return valid(window.localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function detectLang() {
  const fromUrl = langFromUrl();
  if (fromUrl) return fromUrl;
  const saved = savedLang();
  if (saved) return saved;
  try {
    const nav = String((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
    return nav.startsWith("vi") ? "vi" : "en";
  } catch {
    return "en";
  }
}

export function saveLang(lang) {
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    /* bộ nhớ bị chặn: vẫn đổi ngôn ngữ trong phiên này */
  }
  // Nếu URL đang ghim ?lang=…, cập nhật để tải lại trang vẫn đúng lựa chọn mới.
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.set("lang", lang);
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  } catch {
    /* bỏ qua */
  }
}

export function applyDocumentLang(lang) {
  const t = STRINGS[lang];
  document.documentElement.lang = lang;
  document.title = t.docTitle;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", t.metaDesc);
}

export const I18nContext = createContext({ lang: "vi", t: STRINGS.vi });
export const useI18n = () => useContext(I18nContext);
