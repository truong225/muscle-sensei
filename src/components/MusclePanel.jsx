import { useRef } from "react";
import { TABS, groupById, exercisesFor, exceptionReason, muscleName, muscleFunctions, groupName } from "../lib/data.js";
import { useI18n } from "../i18n/lang.js";
import { ExerciseItem } from "./ExerciseItem.jsx";

function Tabs({ muscleId, tab, setTab }) {
  const { t } = useI18n();
  const refs = useRef({});
  const onKey = (e) => {
    const i = TABS.findIndex((x) => x.id === tab);
    let n = null;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = TABS.length - 1;
    if (n == null) return;
    e.preventDefault();
    setTab(TABS[n].id);
    refs.current[TABS[n].id]?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label={t.tabsLabel} onKeyDown={onKey}>
      {TABS.map((x) => {
        const n = exercisesFor(muscleId, x.id).length;
        const sel = x.id === tab;
        return (
          <button
            key={x.id}
            ref={(el) => (refs.current[x.id] = el)}
            type="button"
            role="tab"
            id={"tab-" + x.id}
            data-tab={x.id}
            aria-selected={sel}
            aria-controls={"tabpanel-" + x.id}
            tabIndex={sel ? 0 : -1}
            className={"tab" + (sel ? " is-active" : "")}
            onClick={() => setTab(x.id)}
          >
            {t.tabs[x.id]}
            <span className="tab-count">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Có hiện ghi chú ngoại lệ cho (cơ, tab) này không — dùng chung với hộp thoại Nguồn. */
export function showsException(muscleId, tab) {
  return exercisesFor(muscleId, tab).length < 3 && !!exceptionReason(muscleId, tab, "vi");
}

function ExceptionNote({ muscleId, tab, count }) {
  const { lang, t } = useI18n();
  return (
    <aside className="exc-note" aria-label={t.excLabel}>
      <p className="exc-title">{count === 0 ? t.excNone : t.excFew}</p>
      <p>{exceptionReason(muscleId, tab, lang)}</p>
    </aside>
  );
}

export function MusclePanel({ muscle, tab, setTab, expanded, onToggle, onClear, headingRef }) {
  const { lang, t } = useI18n();
  const group = groupById.get(muscle.group);
  const list = exercisesFor(muscle.id, tab);
  const tabLabel = t.tabs[tab];

  return (
    <article className="muscle" aria-labelledby="muscle-title">
      <header className="muscle-head">
        <div className="muscle-eyebrow">
          <span>{groupName(group, lang)}</span>
          <button type="button" className="text-btn" onClick={onClear}>
            {t.allMuscles}
          </button>
        </div>
        <h2 id="muscle-title" className="muscle-title" tabIndex={-1} ref={headingRef}>
          {muscleName(muscle, lang)}
        </h2>
        <p className="muscle-la" lang="la">
          {muscle.nameLa}
        </p>
      </header>

      <section className="muscle-fn" aria-labelledby="fn-title">
        <h3 id="fn-title" className="section-label">
          {t.functionH}
        </h3>
        <ul>
          {muscleFunctions(muscle, lang).map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </section>

      <div className="tabs-wrap">
        <Tabs muscleId={muscle.id} tab={tab} setTab={setTab} />
      </div>

      <section className="tabpanel" role="tabpanel" id={"tabpanel-" + tab} aria-labelledby={"tab-" + tab}>
        <p className="list-caption">{list.length > 0 ? t.listCaption(list.length, tabLabel) : t.listEmpty(tabLabel)}</p>
        {showsException(muscle.id, tab) && <ExceptionNote muscleId={muscle.id} tab={tab} count={list.length} />}
        {list.length > 0 && (
          <ol className="ex-list" data-list={tab}>
            {list.map((ex) => (
              <ExerciseItem key={ex.id} ex={ex} expanded={expanded.has(ex.id)} onToggle={onToggle} />
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
