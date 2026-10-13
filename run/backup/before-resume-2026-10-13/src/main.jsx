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

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
