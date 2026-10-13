import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Viewer } from "./components/Viewer.jsx";
import { MusclePanel } from "./components/MusclePanel.jsx";
import { EmptyState } from "./components/EmptyState.jsx";
import { MusclePicker } from "./components/MusclePicker.jsx";
import { Dialog } from "./components/Dialog.jsx";
import { SourcesContent } from "./components/SourcesContent.jsx";
import { OnScreenSources } from "./components/OnScreenSources.jsx";
import { muscleById, exercisesFor, loadEn } from "./lib/data.js";
import { readHash, writeHash } from "./lib/hash.js";
import { STRINGS, LANGS, LANG_NAMES } from "./i18n/strings.js";
import { I18nContext, applyDocumentLang, saveLang } from "./i18n/lang.js";

function LangToggle({ lang, onChange, label }) {
  return (
    <div className="lang" role="group" aria-label={label}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          data-lang={l}
          aria-pressed={lang === l}
          aria-label={LANG_NAMES[l]}
          title={LANG_NAMES[l]}
          onClick={() => onChange(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function initialState() {
  const h = readHash();
  return { muscleId: h.muscleId, tab: h.tab, expanded: new Set(), sources: h.sources };
}

export function App({ initialLang = "vi" }) {
  const [lang, setLangState] = useState(initialLang === "en" ? "en" : "vi");
  const langRef = useRef(lang);
  langRef.current = lang;
  const t = STRINGS[lang];
  const i18n = useMemo(() => ({ lang, t: STRINGS[lang] }), [lang]);
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

  // Đổi ngôn ngữ: tải dữ liệu tiếng Anh trước (nếu cần) rồi mới đổi, để giao diện không lẫn hai thứ tiếng.
  const setLang = useCallback(async (l) => {
    const next = l === "en" ? "en" : "vi";
    if (next === "en") await loadEn();
    saveLang(next);
    flushSync(() => setLangState(next));
    return langRef.current;
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

  useLayoutEffect(() => {
    applyDocumentLang(lang);
  }, [lang]);

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
      getLang: () => langRef.current,
      setLang: (l) => setLang(l),
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
  }, [selectMuscle, setTab, setLang]);

  const onViewerSelect = useCallback((id, origin = "viewer") => selectMuscle(id, origin), [selectMuscle]);
  const pickFromDialog = (id) => {
    setPickerOpen(false);
    selectMuscle(id, "ui");
  };

  return (
    <I18nContext.Provider value={i18n}>
      <div className="app">
        <a className="skip" href="#panel">
          {t.skip}
        </a>
        <header className="site-head">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <h1 className="brand-title">
              {t.brand} <span>3D</span>
            </h1>
          </div>
          <nav className="site-nav" aria-label={t.nav}>
            <button type="button" className="btn btn--ghost" onClick={() => setPickerOpen(true)} aria-haspopup="dialog">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="M13 13l4 4" />
              </svg>
              <span className="pick-lbl">{t.pickMuscle}</span>
            </button>
            <LangToggle lang={lang} onChange={setLang} label={t.langGroup} />
          </nav>
        </header>

        <main className="layout">
          <Viewer selectedId={state.muscleId} onUserSelect={onViewerSelect} viewerRef={viewerRef} onStatus={setViewerStatus} />
          <section className="panel" id="panel" ref={panelRef} aria-label={t.panel} tabIndex={-1}>
            <div className="panel-inner">
              {muscle ? (
                <MusclePanel
                  muscle={muscle}
                  tab={state.tab}
                  setTab={setTab}
                  expanded={state.expanded}
                  onToggle={toggle}
                  onClear={() => selectMuscle(null, "ui")}
                  headingRef={headingRef}
                />
              ) : (
                <EmptyState onPick={(id) => selectMuscle(id, "ui")} webglOk={viewerStatus !== "nowebgl"} />
              )}
            </div>
            <footer className="panel-foot">
              <p className="disclaimer">
                <strong>{t.healthNote}</strong> {t.disclaimer}
              </p>
            </footer>
          </section>
        </main>

        <footer className="site-foot">
          <p className="disclaimer">{t.disclaimer}</p>
          <p className="credit">
            <span>{t.modelCredit}</span>
            <span aria-hidden="true"> · </span>
            <button
              type="button"
              className="foot-src"
              onClick={() => setSourcesOpen(true)}
              aria-haspopup="dialog"
              data-sources-button=""
            >
              {t.sourcesBtn}
            </button>
          </p>
        </footer>

        <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} title={t.pickMuscle} labelId="picker-title" className="dlg--picker">
          <MusclePicker selectedId={state.muscleId} onPick={pickFromDialog} autoFocus compact />
        </Dialog>
        <Dialog
          open={state.sources}
          onClose={() => setSourcesOpen(false)}
          title={t.sourcesTitle}
          labelId="sources-title"
          className="dlg--sources"
        >
          <OnScreenSources muscle={muscle} tab={state.tab} />
          <h3 className="sources-general-h">{t.generalH}</h3>
          <SourcesContent />
        </Dialog>
      </div>
    </I18nContext.Provider>
  );
}
