import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Viewer } from "./components/Viewer.jsx";
import { MusclePanel } from "./components/MusclePanel.jsx";
import { EmptyState } from "./components/EmptyState.jsx";
import { MusclePicker } from "./components/MusclePicker.jsx";
import { Dialog } from "./components/Dialog.jsx";
import { SourcesContent } from "./components/SourcesContent.jsx";
import { muscleById, exercisesFor } from "./lib/data.js";
import { readHash, writeHash } from "./lib/hash.js";

export const DISCLAIMER =
  "Nội dung chỉ mang tính tham khảo, không thay thế hướng dẫn của huấn luyện viên hay bác sĩ. Dừng tập nếu thấy đau.";

function initialState() {
  const h = readHash();
  return { muscleId: h.muscleId, tab: h.tab, expanded: new Set(), sources: h.sources };
}

export function App() {
  const [state, setState] = useState(initialState);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [viewerStatus, setViewerStatus] = useState("loading");
  const viewerRef = useRef(null);
  const headingRef = useRef(null);
  const panelRef = useRef(null);
  const pendingFocus = useRef(null); // "heading" | "top" | null
  const stateRef = useRef(state);
  stateRef.current = state;

  const muscle = state.muscleId ? muscleById.get(state.muscleId) : null;

  // ----- hành động
  // Nguồn sự thật duy nhất cho "cơ đang chọn": state.muscleId của App.
  // Mọi đường chọn (bấm trên mô hình, danh sách/tìm kiếm, chip cơ trong bài, window.__mv.select, window.__app,
  // URL hash) đều đi qua hàm này; Viewer chỉ phản chiếu state ra mô hình 3D.
  const selectMuscle = useCallback((id, origin = "ui") => {
    const valid = id && muscleById.has(id) ? id : null;
    if (valid === stateRef.current.muscleId) return; // cùng cơ: giữ nguyên tab và bài đang mở
    pendingFocus.current = origin === "viewer" || origin === "api" ? "top" : valid ? "heading" : "top";
    const next = { ...stateRef.current, muscleId: valid, tab: "gym", expanded: new Set() };
    stateRef.current = next; // để các lệnh gọi liên tiếp trong cùng một lượt thấy giá trị mới
    setState((s) => ({ ...s, muscleId: valid, tab: "gym", expanded: new Set() }));
  }, []);

  const setTab = useCallback((tab) => {
    setState((s) => (s.tab === tab ? s : { ...s, tab: tab === "calisthenics" ? "calisthenics" : "gym" }));
  }, []);

  const toggle = useCallback((exId) => {
    setState((s) => {
      const ex = new Set(s.expanded);
      if (ex.has(exId)) ex.delete(exId);
      else ex.add(exId);
      return { ...s, expanded: ex };
    });
  }, []);

  const jumpTo = useCallback((exId) => {
    flushSync(() =>
      setState((s) => {
        const ex = new Set(s.expanded);
        ex.add(exId);
        return { ...s, expanded: ex };
      }),
    );
    const el = document.getElementById("ex-" + exId);
    el?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    el?.querySelector(".ex-head")?.focus({ preventScroll: true });
  }, []);

  const setSourcesOpen = useCallback((open) => setState((s) => (s.sources === open ? s : { ...s, sources: open })), []);

  // ----- cuộn/tiêu điểm sau khi đổi cơ
  useLayoutEffect(() => {
    const p = pendingFocus.current;
    pendingFocus.current = null;
    if (!p) return;
    if (panelRef.current) panelRef.current.scrollTop = 0;
    if (p === "heading" && headingRef.current) {
      headingRef.current.focus({ preventScroll: true });
      const r = headingRef.current.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight - 80) headingRef.current.scrollIntoView({ block: "start" });
    }
  }, [state.muscleId]);

  // ----- URL hash
  useEffect(() => {
    writeHash({ muscleId: state.muscleId, tab: state.tab, sources: state.sources });
  }, [state.muscleId, state.tab, state.sources]);

  useEffect(() => {
    const onHash = () => {
      const h = readHash();
      const s = stateRef.current;
      if (h.muscleId !== s.muscleId || h.tab !== s.tab || h.sources !== s.sources) {
        setState((cur) => ({
          ...cur,
          muscleId: h.muscleId,
          tab: h.tab,
          sources: h.sources,
          expanded: h.muscleId === cur.muscleId ? cur.expanded : new Set(),
        }));
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // ----- móc kiểm thử
  useEffect(() => {
    window.__app = {
      selectMuscle: (id) => {
        flushSync(() => selectMuscle(id, "ui"));
        return stateRef.current.muscleId;
      },
      getSelected: () => stateRef.current.muscleId,
      getTab: () => stateRef.current.tab,
      setTab: (tab) => {
        flushSync(() => setTab(tab));
        return stateRef.current.tab;
      },
      getState: () => {
        const s = stateRef.current;
        const list = s.muscleId ? exercisesFor(s.muscleId, s.tab) : [];
        return {
          muscleId: s.muscleId,
          tab: s.tab,
          listIds: list.map((e) => e.id),
          expanded: list.filter((e) => s.expanded.has(e.id)).map((e) => e.id),
          sourcesOpen: s.sources,
        };
      },
    };
    return () => {
      delete window.__app;
    };
  }, [selectMuscle, setTab]);

  const onViewerSelect = useCallback((id, origin = "viewer") => selectMuscle(id, origin), [selectMuscle]);
  const pickFromDialog = (id) => {
    setPickerOpen(false);
    selectMuscle(id, "ui");
  };

  return (
    <div className="app">
      <a className="skip" href="#panel">
        Bỏ qua mô hình, tới danh sách
      </a>
      <header className="site-head">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <h1 className="brand-title">
            Bản đồ cơ bắp <span>3D</span>
          </h1>
        </div>
        <nav className="site-nav" aria-label="Điều hướng">
          <button type="button" className="btn btn--ghost" onClick={() => setPickerOpen(true)} aria-haspopup="dialog">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="M13 13l4 4" />
            </svg>
            Chọn cơ
          </button>
          <button
            type="button"
            className="btn btn--link"
            onClick={() => setSourcesOpen(true)}
            aria-haspopup="dialog"
            aria-label="Nguồn & giấy phép"
          >
            <span className="lbl-long">Nguồn & giấy phép</span>
            <span className="lbl-short" aria-hidden="true">
              Nguồn
            </span>
          </button>
        </nav>
      </header>

      <main className="layout">
        <Viewer selectedId={state.muscleId} onUserSelect={onViewerSelect} viewerRef={viewerRef} onStatus={setViewerStatus} />
        <section className="panel" id="panel" ref={panelRef} aria-label="Thông tin cơ và bài tập" tabIndex={-1}>
          <div className="panel-inner">
            {muscle ? (
              <MusclePanel
                muscle={muscle}
                tab={state.tab}
                setTab={setTab}
                expanded={state.expanded}
                onToggle={toggle}
                onPickMuscle={(id) => selectMuscle(id, "ui")}
                onClear={() => selectMuscle(null, "ui")}
                headingRef={headingRef}
                onJumpTo={jumpTo}
              />
            ) : (
              <EmptyState onPick={(id) => selectMuscle(id, "ui")} webglOk={viewerStatus !== "nowebgl"} />
            )}
          </div>
          <footer className="panel-foot">
            <p className="disclaimer">
              <strong>Lưu ý sức khoẻ.</strong> {DISCLAIMER}
            </p>
          </footer>
        </section>
      </main>

      <footer className="site-foot">
        <p className="disclaimer">{DISCLAIMER}</p>
        <p className="credit">
          Mô hình: BodyParts3D © DBCLS, CC BY-SA 2.1 JP (đã chỉnh sửa) ·{" "}
          <a
            href="#nguon"
            onClick={(e) => {
              e.preventDefault();
              setSourcesOpen(true);
            }}
          >
            Nguồn & giấy phép
          </a>
        </p>
      </footer>

      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} title="Chọn cơ" labelId="picker-title" className="dlg--picker">
        <MusclePicker selectedId={state.muscleId} onPick={pickFromDialog} autoFocus compact />
      </Dialog>
      <Dialog
        open={state.sources}
        onClose={() => setSourcesOpen(false)}
        title="Nguồn & giấy phép"
        labelId="sources-title"
        className="dlg--sources"
      >
        <SourcesContent />
      </Dialog>
    </div>
  );
}
