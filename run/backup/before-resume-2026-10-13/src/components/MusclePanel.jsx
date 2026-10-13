import { useRef } from "react";
import { TABS, groupById, exercisesFor, exceptionFor, sourceInfo } from "../lib/data.js";
import { ExerciseItem } from "./ExerciseItem.jsx";

function Tabs({ muscleId, tab, setTab }) {
  const refs = useRef({});
  const onKey = (e) => {
    const i = TABS.findIndex((t) => t.id === tab);
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
    <div className="tabs" role="tablist" aria-label="Loại bài tập" onKeyDown={onKey}>
      {TABS.map((t) => {
        const n = exercisesFor(muscleId, t.id).length;
        const sel = t.id === tab;
        return (
          <button
            key={t.id}
            ref={(el) => (refs.current[t.id] = el)}
            type="button"
            role="tab"
            id={"tab-" + t.id}
            data-tab={t.id}
            aria-selected={sel}
            aria-controls={"tabpanel-" + t.id}
            tabIndex={sel ? 0 : -1}
            className={"tab" + (sel ? " is-active" : "")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="tab-count">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

function ExceptionNote({ exc, count }) {
  return (
    <aside className="exc-note" aria-label="Ghi chú về số lượng bài">
      <p className="exc-title">{count === 0 ? "Vì sao không có bài nào ở đây" : "Vì sao chỉ có ít bài ở đây"}</p>
      <p>{exc.reason}</p>
      <ul className="srcs srcs--inline">
        {exc.sources.map((u) => (
          <li key={u}>
            <a href={u} target="_blank" rel="noreferrer">
              {sourceInfo(u).title}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function MusclePanel({ muscle, tab, setTab, expanded, onToggle, onPickMuscle, onClear, headingRef, onJumpTo }) {
  const group = groupById.get(muscle.group);
  const list = exercisesFor(muscle.id, tab);
  const exc = exceptionFor(muscle.id, tab);
  const ids = new Set(list.map((e) => e.id));
  const tabLabel = TABS.find((t) => t.id === tab)?.label;

  return (
    <article className="muscle" aria-labelledby="muscle-title">
      <header className="muscle-head">
        <div className="muscle-eyebrow">
          <span>{group?.nameVi}</span>
          <button type="button" className="text-btn" onClick={onClear}>
            ← Tất cả cơ
          </button>
        </div>
        <h2 id="muscle-title" className="muscle-title" tabIndex={-1} ref={headingRef}>
          {muscle.nameVi}
        </h2>
        <p className="muscle-la" lang="la">
          {muscle.nameLa}
        </p>
        <p className="muscle-en" lang="en">
          {muscle.nameEn}
        </p>
      </header>

      <section className="muscle-fn" aria-labelledby="fn-title">
        <h3 id="fn-title" className="section-label">
          Chức năng
        </h3>
        <ul>
          {muscle.functionVi.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
        <p className="anat-src">
          <span>Nguồn giải phẫu:</span>{" "}
          {muscle.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noreferrer" title={sourceInfo(s.url).title}>
                {sourceInfo(s.url).publisher}
              </a>
            </span>
          ))}
        </p>
      </section>

      <div className="tabs-wrap">
        <Tabs muscleId={muscle.id} tab={tab} setTab={setTab} />
      </div>

      <section className="tabpanel" role="tabpanel" id={"tabpanel-" + tab} aria-labelledby={"tab-" + tab}>
        <p className="list-caption">
          {list.length > 0
            ? `${list.length} bài ${tabLabel} lấy cơ này làm cơ chính, xếp từ dễ đến khó.`
            : `Chưa có bài ${tabLabel} nào lấy cơ này làm cơ chính.`}
        </p>
        {list.length < 3 && exc && <ExceptionNote exc={exc} count={list.length} />}
        {list.length > 0 && (
          <ol className="ex-list" data-list={tab}>
            {list.map((ex, i) => (
              <ExerciseItem
                key={ex.id}
                ex={ex}
                index={i}
                expanded={expanded.has(ex.id)}
                onToggle={onToggle}
                onPickMuscle={onPickMuscle}
                currentMuscleId={muscle.id}
                inList={(id) => ids.has(id)}
                onJumpTo={onJumpTo}
              />
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
