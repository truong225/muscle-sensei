import { STATS } from "../lib/data.js";
import { useI18n } from "../i18n/lang.js";
import { MusclePicker } from "./MusclePicker.jsx";

export function EmptyState({ onPick, webglOk }) {
  const { t } = useI18n();
  return (
    <div className="empty">
      <p className="eyebrow">{t.eyebrow}</p>
      <h2 className="empty-title">{t.emptyTitle}</h2>
      <p className="empty-lede">{t.emptyLede(STATS.muscles, STATS.gym + STATS.calisthenics)}</p>
      <ol className="howto">
        <li>
          <span>
            <b>{t.how1b}</b>
            {t.how1(webglOk)}
          </span>
        </li>
        <li>
          <span>
            <b>{t.how2b}</b>
            {t.how2}
          </span>
        </li>
        <li>
          <span>
            <b>{t.how3b}</b>
            {t.how3}
          </span>
        </li>
      </ol>
      <MusclePicker selectedId={null} onPick={onPick} />
    </div>
  );
}
