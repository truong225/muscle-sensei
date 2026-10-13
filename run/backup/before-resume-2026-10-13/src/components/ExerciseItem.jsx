import { exerciseById, levelLabel, muscleById, sourceInfo, formatDate } from "../lib/data.js";

export function DifficultyBadge({ level }) {
  return (
    <span className={"diff diff--" + level} aria-label={`Độ khó mức ${level} trên 5 · ${levelLabel(level)}`}>
      <span className="diff-dots" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} className={n <= level ? "on" : ""} />
        ))}
      </span>
      <span className="diff-text" aria-hidden="true">
        Mức {level} · {levelLabel(level)}
      </span>
    </span>
  );
}

function MuscleChips({ ids, current, onPickMuscle, kind }) {
  if (!ids?.length) return <p className="muted small">—</p>;
  return (
    <ul className="chips">
      {ids.map((id) => {
        const m = muscleById.get(id);
        const isCur = id === current;
        return (
          <li key={id}>
            <button
              type="button"
              className={"chip chip--" + kind + (isCur ? " is-current" : "")}
              data-muscle={id}
              aria-current={isCur ? "true" : undefined}
              onClick={() => onPickMuscle(id)}
              title={isCur ? "Cơ đang xem" : "Xem cơ này trên mô hình"}
            >
              {m?.nameVi || id}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ExerciseItem({ ex, index, expanded, onToggle, onPickMuscle, currentMuscleId, inList, onJumpTo }) {
  const bodyId = "ex-body-" + ex.id;
  const base = ex.progressionOf ? exerciseById.get(ex.progressionOf) : null;
  return (
    <li className={"ex" + (expanded ? " is-open" : "")} id={"ex-" + ex.id} data-ex={ex.id}>
      <h3 className="ex-h">
        <button type="button" className="ex-head" aria-expanded={expanded} aria-controls={bodyId} onClick={() => onToggle(ex.id)}>
          <span className="ex-num" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="ex-titles">
            <span className="ex-name">{ex.nameVi}</span>
            <span className="ex-en">{ex.nameEn}</span>
            <span className="ex-equip">
              <span className="sr-only">Dụng cụ: </span>
              {ex.equipment.join(" · ")}
            </span>
          </span>
          <span className="ex-side">
            <DifficultyBadge level={ex.difficulty} />
            <svg className="ex-chev" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 8l5 5 5-5" />
            </svg>
          </span>
        </button>
      </h3>
      {expanded && (
        <div className="ex-body" id={bodyId}>
          <p className="ex-basis">
            <span className="ex-label">Vì sao mức {ex.difficulty}</span>
            {ex.difficultyBasis}
          </p>

          <div className="ex-muscles">
            <div>
              <h4 className="ex-label">Cơ chính</h4>
              <MuscleChips ids={ex.primaryMuscles} current={currentMuscleId} onPickMuscle={onPickMuscle} kind="primary" />
            </div>
            <div>
              <h4 className="ex-label">Cơ phụ</h4>
              <MuscleChips ids={ex.secondaryMuscles} current={currentMuscleId} onPickMuscle={onPickMuscle} kind="secondary" />
            </div>
          </div>

          {base && (
            <p className="ex-prog">
              <span className="ex-label">Bài nền trước đó</span>
              {inList(base.id) ? (
                <button type="button" className="linkish" onClick={() => onJumpTo(base.id)}>
                  {base.nameVi}
                </button>
              ) : (
                <span>{base.nameVi}</span>
              )}
            </p>
          )}

          <h4 className="ex-label">Cách thực hiện</h4>
          <ol className="steps">
            {ex.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>

          {ex.safety?.length > 0 && (
            <div className="safety">
              <h4 className="ex-label">Lưu ý an toàn</h4>
              <ul>
                {ex.safety.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <h4 className="ex-label">Nguồn</h4>
          <ul className="srcs">
            {ex.sources.map((s) => {
              const info = sourceInfo(s.url, s.checked);
              return (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {info.title}
                  </a>
                  <span className="muted">
                    {" "}
                    — {info.publisher}
                    {info.checked ? `, kiểm tra ngày ${formatDate(info.checked)}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}
