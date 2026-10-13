import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/latin-500.css";
import "@fontsource/be-vietnam-pro/vietnamese-500.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/latin-700.css";
import "@fontsource/be-vietnam-pro/vietnamese-700.css";
import "@fontsource/noto-serif/latin-400.css";
import "@fontsource/noto-serif/vietnamese-400.css";
import "@fontsource/noto-serif/latin-400-italic.css";
import "@fontsource/noto-serif/vietnamese-400-italic.css";
import "@fontsource/noto-serif/latin-600.css";
import "@fontsource/noto-serif/vietnamese-600.css";
import "./styles.css";
import { App } from "./App.jsx";
import { detectLang, applyDocumentLang } from "./i18n/lang.js";
import { loadEn } from "./lib/data.js";

function start(lang) {
  applyDocumentLang(lang);
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App initialLang={lang} />
    </React.StrictMode>,
  );
}

// Dữ liệu tiếng Anh nằm ở tệp riêng (tải động); chỉ tải khi cần, trước lần vẽ đầu để giao diện không lẫn hai thứ tiếng.
const lang = detectLang();
if (lang === "en") {
  loadEn().then(
    () => start("en"),
    (e) => {
      console.warn("[i18n] không tải được dữ liệu tiếng Anh", e);
      start("vi");
    },
  );
} else {
  start(lang);
}
