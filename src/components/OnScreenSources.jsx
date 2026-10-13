import { exercisesFor, exceptionFor, exName, muscleName, sourceInfo, videoFor } from "../lib/data.js";
import { useI18n } from "../i18n/lang.js";
import { showsException } from "./MusclePanel.jsx";

const L = { target: "_blank", rel: "noreferrer" };

function SourceList({ items }) {
  const { t } = useI18n();
  return (
    <ul className="cur-srcs">
      {items.map(({ url, checked }) => {
        const info = sourceInfo(url, checked);
        return (
          <li key={url}>
            <a href={url} {...L}>
              {info.title}
            </a>
            <span className="muted">
              {" "}
              — {info.publisher}
              {info.checked ? ` · ${t.checked(info.checked)}` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Nguồn của đúng những gì đang hiện: giải phẫu của cơ đang chọn, ghi chú ngoại lệ, từng bài trong tab hiện tại (kèm ghi công video). */
export function OnScreenSources({ muscle, tab }) {
  const { lang, t } = useI18n();
  if (!muscle) {
    return (
      <section className="cur" data-onscreen="none">
        <h3 className="src-h">{t.onScreenH}</h3>
        <p className="muted">{t.onScreenNone}</p>
      </section>
    );
  }
  const list = exercisesFor(muscle.id, tab);
  const exc = showsException(muscle.id, tab) ? exceptionFor(muscle.id, tab) : null;
  return (
    <section className="cur" data-onscreen={muscle.id}>
      <h3 className="src-h">{t.onScreenH}</h3>

      <div className="cur-block" data-src="anatomy">
        <h4 className="cur-h">
          <span className="ex-label">{t.anatomyH}</span> {muscleName(muscle, lang)}
        </h4>
        <SourceList items={muscle.sources} />
      </div>

      {exc && exc.sources?.length > 0 && (
        <div className="cur-block" data-src="exception">
          <h4 className="cur-h">
            <span className="ex-label">{t.exceptionH}</span>
          </h4>
          <SourceList items={exc.sources.map((url) => ({ url }))} />
        </div>
      )}

      {list.length > 0 && (
        <div className="cur-block" data-src="exercises">
          <h4 className="cur-h">
            <span className="ex-label">{t.exercisesH(t.tabs[tab])}</span>
          </h4>
          <ol className="cur-ex">
            {list.map((ex) => {
              const v = videoFor(ex.id);
              const hasVideo = v && !v.none && v.youtubeId;
              return (
                <li key={ex.id} data-ex={ex.id}>
                  <p className="cur-ex-name">{exName(ex, lang)}</p>
                  <SourceList items={ex.sources} />
                  <p className="cur-vid">
                    <span className="cur-vid-k">{t.videoCredit}</span>{" "}
                    {hasVideo ? (
                      <>
                        <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} {...L}>
                          {v.title}
                        </a>
                        {v.channel && (
                          <span className="muted">
                            {" "}
                            —{" "}
                            {v.channelUrl ? (
                              <a href={v.channelUrl} {...L}>
                                {v.channel}
                              </a>
                            ) : (
                              v.channel
                            )}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="muted">{t.videoNone}</span>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
