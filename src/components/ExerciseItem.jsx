import { useEffect, useRef, useState } from "react";
import { exName, exNameEn, exSteps, exSafety, levelLabel, videoFor } from "../lib/data.js";
import { useI18n } from "../i18n/lang.js";

export function DifficultyBadge({ level }) {
  const { lang, t } = useI18n();
  const label = levelLabel(level, lang);
  return (
    <span className={"diff diff--" + level} role="img" aria-label={t.levelAria(level, label)}>
      <span className="diff-dots" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} className={n <= level ? "on" : ""} />
        ))}
      </span>
      <span className="diff-text" aria-hidden="true">
        {t.level(level, label)}
      </span>
    </span>
  );
}

// Chỉ một video phát tại một thời điểm: khi một khung bắt đầu phát, các khung khác trở về ảnh xem trước.
const PLAY_EVENT = "cobap:video-play";

export const youtubeSearchUrl = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

function ExerciseVideo({ ex }) {
  const { t } = useI18n();
  const v = videoFor(ex.id);
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef(null);

  useEffect(() => {
    const on = (e) => {
      if (e.detail !== ex.id) setPlaying(false);
    };
    window.addEventListener(PLAY_EVENT, on);
    return () => window.removeEventListener(PLAY_EVENT, on);
  }, [ex.id]);

  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);

  if (!v || v.none || !v.youtubeId) {
    const q = (v && v.query) || exNameEn(ex);
    return (
      <a className="yt-search" href={youtubeSearchUrl(q)} target="_blank" rel="noopener" data-query={q}>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M13 13l4 4" />
        </svg>
        {t.searchYoutube}
        <span className="sr-only"> {t.newTab}</span>
      </a>
    );
  }

  const id = v.youtubeId;
  return (
    <figure className="vid" data-video={id}>
      <div className="vid-frame">
        {playing ? (
          <iframe
            ref={frameRef}
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={v.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="vid-facade"
            aria-label={t.playVideo(v.title)}
            onClick={() => {
              window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: ex.id }));
              setPlaying(true);
            }}
          >
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" width="480" height="360" />
            <span className="vid-play" aria-hidden="true">
              <svg viewBox="0 0 68 48">
                <path className="vid-play-bg" d="M66.5 7.7A8.5 8.5 0 0 0 60.5 1.7C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6c5.3 1.4 26.5 1.4 26.5 1.4s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" />
                <path className="vid-play-fg" d="M27 34.5 45 24 27 13.5z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      {v.channel && (
        <figcaption className="vid-credit">
          {t.videoBy}{" "}
          {v.channelUrl ? (
            <a href={v.channelUrl} target="_blank" rel="noopener">
              {v.channel}
            </a>
          ) : (
            v.channel
          )}
        </figcaption>
      )}
    </figure>
  );
}

export function ExerciseItem({ ex, expanded, onToggle }) {
  const { lang, t } = useI18n();
  const bodyId = "ex-body-" + ex.id;
  const steps = exSteps(ex, lang);
  const safety = exSafety(ex, lang);
  return (
    <li className={"ex" + (expanded ? " is-open" : "")} id={"ex-" + ex.id} data-ex={ex.id}>
      <h3 className="ex-h">
        <button type="button" className="ex-head" aria-expanded={expanded} aria-controls={bodyId} onClick={() => onToggle(ex.id)}>
          <span className="ex-name">{exName(ex, lang)}</span>
          <DifficultyBadge level={ex.difficulty} />
          <svg className="ex-chev" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 8l5 5 5-5" />
          </svg>
        </button>
      </h3>
      {expanded && (
        <div className="ex-body" id={bodyId}>
          <h4 className="sr-only">{t.stepsH}</h4>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <ExerciseVideo ex={ex} />
          {safety.length > 0 && (
            <p className="ex-safety">
              <span className="ex-safety-k">{t.safety}</span> {safety.join(" · ")}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
