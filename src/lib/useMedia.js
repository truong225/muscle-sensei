import { useEffect, useState } from "react";

/** true khi media query khớp; cập nhật khi thay đổi. */
export function useMedia(query) {
  const get = () => {
    try {
      return !!window.matchMedia?.(query).matches;
    } catch {
      return false;
    }
  };
  const [match, setMatch] = useState(get);
  useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia?.(query);
    } catch {
      return undefined;
    }
    if (!mq) return undefined;
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [query]);
  return match;
}
