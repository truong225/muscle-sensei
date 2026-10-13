import { useEffect, useRef, useState } from "react";
import { MuscleViewer } from "../viewer/MuscleViewer.js";
import { PALETTE } from "../viewer/palette.js";
import { MUSCLES_JSON, muscleById, muscleName } from "../lib/data.js";
import colorsJson from "../data/muscle-colors.json";
import { useI18n } from "../i18n/lang.js";
import { useMedia } from "../lib/useMedia.js";

const MUSCLE_VIEW = new Map(MUSCLES_JSON.muscles.map((m) => [m.id, m.view]));
const MODEL_URL = `${import.meta.env.BASE_URL}models/muscles.glb`;

function hasWebGL2() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGL2RenderingContext && c.getContext("webgl2"));
  } catch {
    return false;
  }
}

const reducedQuery = () => window.matchMedia?.("(prefers-reduced-motion: reduce)");

export function Viewer({ selectedId, onUserSelect, viewerRef, onStatus }) {
  const { lang, t } = useI18n();
  const noHover = useMedia("(hover: none)");
  const canvasLabelRef = useRef(t.canvasLabel);
  canvasLabelRef.current = t.canvasLabel;
  const hostRef = useRef(null);
  const tipRef = useRef(null);
  const onUserSelectRef = useRef(onUserSelect);
  onUserSelectRef.current = onUserSelect;
  const [status, setStatus] = useState("loading"); // loading | ready | error | nowebgl
  const [errMsg, setErrMsg] = useState("");
  const [hover, setHover] = useState(null);
  const [view, setView] = useState("front");

  // Tạo trình xem khi gắn, huỷ khi gỡ (an toàn với StrictMode: mỗi lần gắn một canvas mới).
  useEffect(() => {
    const host = hostRef.current;
    if (!hasWebGL2()) {
      setStatus("nowebgl");
      return undefined;
    }
    const canvas = document.createElement("canvas");
    canvas.className = "viewer-canvas";
    canvas.setAttribute("aria-label", canvasLabelRef.current);
    canvas.setAttribute("role", "img");
    host.prepend(canvas);
    let mv;
    let cancelled = false;
    const mq = reducedQuery();
    try {
      mv = new MuscleViewer(canvas, { reducedMotion: !!mq?.matches, background: PALETTE.background });
    } catch (e) {
      canvas.remove();
      setStatus("nowebgl");
      setErrMsg(String(e?.message || e));
      return undefined;
    }
    mv.setMuscleMeta(MUSCLES_JSON);
    // Tô màu đồ thị: rê vào một cơ → cơ đó và các cơ kề mang màu bảng khác nhau.
    mv.setColorMeta(colorsJson);
    // select() của MuscleViewer không phát onSelect (tránh vòng lặp). Để mọi lệnh gọi từ bên ngoài
    // (window.__mv.select trong QA/console) cũng cập nhật bảng thông tin, bọc phương thức trên CHÍNH thể hiện này:
    // lệnh gọi ngoài → báo cho App (nguồn sự thật) → App đổi state → hiệu ứng đồng bộ bên dưới gọi bản gốc.
    const rawSelect = mv.select.bind(mv);
    mv.selectRaw = rawSelect;
    mv.select = (id, opts) => {
      rawSelect(id, opts);
      const now = mv.getSelected();
      onUserSelectRef.current?.(now, "api");
    };
    viewerRef.current = mv;
    setStatus("loading");
    const offSel = mv.onSelect((id) => onUserSelectRef.current?.(id, "viewer"));
    const offHov = mv.onHover((id, info) => {
      if (id) {
        setHover(id);
        if (tipRef.current && info && info.x != null) {
          tipRef.current.style.transform = `translate(${info.x + 14}px, ${info.y + 16}px)`;
        }
      } else setHover(null);
    });
    const onMq = (e) => mv.setReducedMotion(e.matches);
    mq?.addEventListener?.("change", onMq);
    mv.load(MODEL_URL)
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("[Viewer] không tải được mô hình", e);
        setErrMsg(String(e?.message || e));
        setStatus("error");
      });
    return () => {
      cancelled = true;
      offSel();
      offHov();
      mq?.removeEventListener?.("change", onMq);
      if (viewerRef.current === mv) viewerRef.current = null;
      mv.dispose();
      canvas.remove();
    };
  }, [viewerRef]);

  useEffect(() => {
    onStatus?.(status);
  }, [status, onStatus]);

  useEffect(() => {
    hostRef.current?.querySelector(".viewer-canvas")?.setAttribute("aria-label", t.canvasLabel);
  }, [t.canvasLabel, status]);

  // Đồng bộ lựa chọn từ giao diện → trình xem (không phát lại onSelect).
  useEffect(() => {
    const mv = viewerRef.current;
    if (!mv || status !== "ready") return;
    if (mv.getSelected() !== (selectedId || null)) {
      (mv.selectRaw || mv.select)(selectedId || null, { focus: !!selectedId });
      // select({focus}) xoay camera về mặt chứa cơ → cập nhật nút Mặt trước/Mặt sau cho khớp
      const v = selectedId ? MUSCLE_VIEW.get(selectedId) : null;
      if (v === "front" || v === "back") setView(v);
    }
  }, [selectedId, status, viewerRef]);

  // Chú thích theo con trỏ.
  const onPointerMove = (e) => {
    if (!hover || !tipRef.current || !hostRef.current) return;
    const r = hostRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const flip = x > r.width - 220;
    tipRef.current.style.transform = `translate(${flip ? x - 14 : x + 14}px, ${y + 16}px) translateX(${flip ? "-100%" : "0"})`;
  };

  const mv = () => viewerRef.current;
  const ready = status === "ready";
  const doView = (v) => {
    setView(v);
    mv()?.setView(v);
  };

  const hoverName = hover ? muscleName(muscleById.get(hover), lang) || hover : "";
  const palette = Array.isArray(colorsJson.palette) ? colorsJson.palette : [];

  return (
    <section className="viewer" aria-label={t.viewer}>
      <div className="viewer-stage" ref={hostRef} onPointerMove={onPointerMove}>
        <div ref={tipRef} className={"viewer-tip" + (hover ? " is-on" : "")} aria-hidden="true">
          {hoverName}
        </div>

        {status === "loading" && (
          <div className="viewer-overlay" role="status" aria-live="polite">
            <div className="loader" aria-hidden="true">
              <span />
            </div>
            <p>{t.loading}</p>
            <p className="muted small">{t.loadingSize}</p>
          </div>
        )}
        {(status === "nowebgl" || status === "error") && (
          <div className="viewer-overlay viewer-overlay--msg" role="status">
            <p className="serif viewer-msg-title">{status === "nowebgl" ? t.noWebglTitle : t.errorTitle}</p>
            <p className="muted">
              {status === "nowebgl" ? t.noWebglMsg : t.errorMsg} {t.stillPick}
            </p>
            {errMsg && <p className="muted small">{errMsg}</p>}
          </div>
        )}
      </div>

      {ready && (
        <>
          <div className="viewer-top">
            <div className="seg" role="group" aria-label={t.viewGroup}>
              <button type="button" aria-pressed={view === "front"} onClick={() => doView("front")}>
                {t.front}
              </button>
              <button type="button" aria-pressed={view === "back"} onClick={() => doView("back")}>
                {t.back}
              </button>
            </div>
            <div className="legend" role="group" aria-label={t.legend}>
              <ul className="legend-keys">
                <li>
                  <i style={{ background: PALETTE.clay }} /> {t.legendSelectable}
                </li>
                <li>
                  <i style={{ background: PALETTE.selected }} /> {t.legendSelected}
                </li>
              </ul>
              <p className="legend-hint">
                <span className="legend-pal" aria-hidden="true">
                  {palette.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
                <span>{noHover ? t.legendTouch : t.legendHover}</span>
              </p>
            </div>
          </div>
          <div className="viewer-zoom" role="group" aria-label={t.camera}>
            <button type="button" className="icon-btn" aria-label={t.zoomIn} title={t.zoomIn} onClick={() => mv()?.zoomBy(1)}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 4v12M4 10h12" />
              </svg>
            </button>
            <button type="button" className="icon-btn" aria-label={t.zoomOut} title={t.zoomOut} onClick={() => mv()?.zoomBy(-1)}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 10h12" />
              </svg>
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--text"
              title={t.resetView}
              onClick={() => {
                setView("front");
                mv()?.resetView();
              }}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4.5 9.5a5.5 5.5 0 1 1 1.6 3.9M4.5 15v-4h4" />
              </svg>
              <span>{t.resetView}</span>
            </button>
          </div>
          <p className="viewer-hint">{noHover ? t.hintTouch : t.hintMouse}</p>
        </>
      )}
    </section>
  );
}
