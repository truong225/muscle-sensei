import { useEffect, useRef } from "react";

/** Hộp thoại dạng modal dùng <dialog> gốc (bẫy tiêu điểm, Esc để đóng). */
export function Dialog({ open, onClose, title, labelId, className = "", children }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      const prev = document.activeElement;
      d.showModal();
      d._prevFocus = prev;
      // autoFocus của React chạy trước showModal() nên bị mất; đặt tiêu điểm lại sau khi mở.
      const want = d.querySelector("[data-autofocus]");
      if (want) want.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    const handle = () => {
      const prev = d._prevFocus;
      d._prevFocus = null;
      onCloseRef.current?.();
      if (prev && document.contains(prev)) prev.focus?.();
    };
    d.addEventListener("close", handle);
    return () => d.removeEventListener("close", handle);
  }, []);

  return (
    <dialog
      ref={ref}
      className={"dlg " + className}
      aria-labelledby={labelId}
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <div className="dlg-inner">
        <div className="dlg-bar">
          <h2 id={labelId} className="dlg-title">
            {title}
          </h2>
          <button type="button" className="icon-btn" aria-label="Đóng" onClick={() => ref.current?.close()}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <div className="dlg-body">{open ? children : null}</div>
      </div>
    </dialog>
  );
}
