import { useId, useMemo, useRef, useState } from "react";
import { searchMuscles, exercisesFor } from "../lib/data.js";

/** Ô tìm + danh sách cơ theo nhóm. Bàn phím: ↓ từ ô tìm vào danh sách, ↑/↓/Home/End di chuyển, Enter chọn. */
export function MusclePicker({ selectedId, onPick, autoFocus = false, compact = false }) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const inputRef = useRef(null);
  const optRefs = useRef([]);

  const groups = useMemo(() => searchMuscles(query), [query]);
  const flat = useMemo(() => groups.flatMap((g) => g.muscles), [groups]);
  const total = flat.length;
  const rovingIndex = active >= 0 && active < total ? active : Math.max(0, flat.findIndex((m) => m.id === selectedId));

  const focusOpt = (i) => {
    const n = Math.max(0, Math.min(total - 1, i));
    setActive(n);
    optRefs.current[n]?.focus();
    optRefs.current[n]?.scrollIntoView?.({ block: "nearest" });
  };

  const pick = (id) => {
    onPick(id);
  };

  const onInputKey = (e) => {
    if (e.key === "ArrowDown") {
      if (total) {
        e.preventDefault();
        focusOpt(0);
      }
    } else if (e.key === "Enter") {
      if (total) {
        e.preventDefault();
        pick(flat[0].id);
      }
    } else if (e.key === "Escape" && query) {
      e.preventDefault();
      e.stopPropagation();
      setQuery("");
      setActive(-1);
    }
  };

  const onOptKey = (e, i) => {
    const k = e.key;
    if (k === "ArrowDown") {
      e.preventDefault();
      focusOpt(i + 1);
    } else if (k === "ArrowUp") {
      e.preventDefault();
      if (i === 0) inputRef.current?.focus();
      else focusOpt(i - 1);
    } else if (k === "Home") {
      e.preventDefault();
      focusOpt(0);
    } else if (k === "End") {
      e.preventDefault();
      focusOpt(total - 1);
    } else if (k === "Enter" || k === " ") {
      e.preventDefault();
      pick(flat[i].id);
    } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setQuery((q) => q + k);
      setActive(-1);
      inputRef.current?.focus();
    } else if (k === "Backspace") {
      e.preventDefault();
      setQuery((q) => q.slice(0, -1));
      inputRef.current?.focus();
    }
  };

  let idx = -1;
  optRefs.current = [];
  return (
    <div className={"picker" + (compact ? " picker--compact" : "")}>
      <label className="picker-label" htmlFor={uid + "-q"}>
        Tìm cơ
      </label>
      <div className="picker-search">
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M13 13l4 4" />
        </svg>
        <input
          ref={inputRef}
          id={uid + "-q"}
          type="search"
          autoComplete="off"
          spellCheck="false"
          autoFocus={autoFocus}
          placeholder="Ví dụ: lưng xô, nhi dau, biceps…"
          value={query}
          aria-controls={uid + "-list"}
          aria-describedby={uid + "-help"}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
          }}
          onKeyDown={onInputKey}
        />
      </div>
      <p id={uid + "-help"} className="picker-help">
        Gõ có dấu hoặc không dấu, tên Latin hay tiếng Anh. Nhấn ↓ để vào danh sách, Enter để chọn.
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {query ? `${total} cơ phù hợp` : ""}
      </p>
      {total === 0 ? (
        <p className="picker-empty">Không tìm thấy cơ nào khớp “{query}”.</p>
      ) : (
        <div id={uid + "-list"} role="listbox" aria-label="Danh sách cơ" className="picker-list">
          {groups.map(({ group, muscles }) => (
            <div role="group" aria-labelledby={uid + "-g-" + group.id} key={group.id} className="picker-group">
              <div role="presentation" id={uid + "-g-" + group.id} className="picker-group-title">
                {group.nameVi}
              </div>
              {muscles.map((m) => {
                idx += 1;
                const i = idx;
                const n = exercisesFor(m.id, "gym").length + exercisesFor(m.id, "calisthenics").length;
                const sel = m.id === selectedId;
                return (
                  <div
                    key={m.id}
                    ref={(el) => (optRefs.current[i] = el)}
                    role="option"
                    id={uid + "-o-" + m.id}
                    data-muscle={m.id}
                    aria-selected={sel}
                    tabIndex={i === rovingIndex ? 0 : -1}
                    className={"picker-opt" + (sel ? " is-selected" : "")}
                    onClick={() => pick(m.id)}
                    onKeyDown={(e) => onOptKey(e, i)}
                    onFocus={() => setActive(i)}
                  >
                    <span className="picker-opt-name">{m.nameVi}</span>
                    <span className="picker-opt-en">{m.nameEn}</span>
                    <span className="picker-opt-count" aria-label={`${n} bài`}>
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
