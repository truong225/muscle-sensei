import { useMemo } from "react";
import { RUBRIC, STATS, sourcesByHost, levelLabel } from "../lib/data.js";
import { useI18n } from "../i18n/lang.js";
import { RUBRIC_EN } from "../i18n/strings.js";

// Câu ghi công bắt buộc của BodyParts3D: giữ nguyên văn ở cả hai ngôn ngữ.
export const BP3D_ATTRIBUTION =
  "BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan";

const L = { target: "_blank", rel: "noreferrer" };

function ModelVi() {
  return (
    <>
      <p>
        Mô hình trong trang này được <strong>chỉnh sửa</strong> từ BodyParts3D: gộp các lưới theo đơn vị cơ tập luyện, giản
        lược số tam giác, xoay lại hướng cho đứng thẳng và chuyển từ STL sang một tệp GLB duy nhất. Bản đã chỉnh sửa được phân
        phối lại theo cùng giấy phép{" "}
        <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" {...L}>
          CC BY-SA 2.1 JP
        </a>
        .
      </p>
      <p>
        Tệp gốc lấy từ bản sao trên GitHub{" "}
        <a href="https://github.com/Kevin-Mattheus-Moerman/BodyParts3D" {...L}>
          Kevin-Mattheus-Moerman/BodyParts3D
        </a>{" "}
        (bản phát hành 3.0, ngày 20110915; người duy trì bản sao đã chuyển các tệp từ OBJ sang STL), vì máy chủ gốc không truy
        cập được lúc dựng mô hình. Trang gốc của dự án:{" "}
        <a href="http://lifesciencedb.jp/bp3d/" {...L}>
          BodyParts3D (lifesciencedb.jp/bp3d)
        </a>{" "}
        và{" "}
        <a href="http://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" {...L}>
          trang giấy phép trên dbarchive.biosciencedbc.jp
        </a>
        .
      </p>
    </>
  );
}

function ModelEn() {
  return (
    <>
      <p>
        The model on this site is <strong>modified</strong> from BodyParts3D: meshes were merged into trainable muscle units,
        decimated, re-oriented to stand upright and converted from STL into a single GLB file. The modified version is
        redistributed under the same licence,{" "}
        <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" {...L}>
          CC BY-SA 2.1 JP
        </a>
        .
      </p>
      <p>
        The original files come from the GitHub mirror{" "}
        <a href="https://github.com/Kevin-Mattheus-Moerman/BodyParts3D" {...L}>
          Kevin-Mattheus-Moerman/BodyParts3D
        </a>{" "}
        (release 3.0, dated 20110915; the mirror maintainer converted the files from OBJ to STL), because the original server
        was unreachable when the model was built. Project home page:{" "}
        <a href="http://lifesciencedb.jp/bp3d/" {...L}>
          BodyParts3D (lifesciencedb.jp/bp3d)
        </a>{" "}
        and the{" "}
        <a href="http://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" {...L}>
          licence page on dbarchive.biosciencedbc.jp
        </a>
        .
      </p>
    </>
  );
}

function ExerciseDataVi() {
  return (
    <>
      <p>
        <a href="https://github.com/yuhonas/free-exercise-db" {...L}>
          free-exercise-db
        </a>{" "}
        (giấy phép Unlicense) chỉ được dùng để tra <em>dữ kiện</em> của bài: tên, nhóm cơ (làm điểm khởi đầu; cơ chính và cơ
        phụ chi tiết được xác minh bằng nguồn riêng), dụng cụ, cấp độ. Phần hướng dẫn thực hiện và lưu ý an toàn được viết độc
        lập, đối chiếu với các nguồn ghi ở từng bài (xem mục “Nguồn cho nội dung đang xem” ở trên).
      </p>
      <p>
        Trang không dùng ảnh minh hoạ bài tập, vì không xác minh được giấy phép của bộ ảnh đi kèm các bộ dữ liệu mở (chính tác
        giả gốc cho biết ảnh được thu thập từ internet). Hình duy nhất là mô hình 3D.
      </p>
    </>
  );
}

function ExerciseDataEn() {
  return (
    <>
      <p>
        <a href="https://github.com/yuhonas/free-exercise-db" {...L}>
          free-exercise-db
        </a>{" "}
        (Unlicense) is used only to look up <em>facts</em> about exercises: name, muscle group (as a starting point; primary
        and secondary muscles were verified against separate sources), equipment and level. The instructions and safety notes
        were written independently and checked against the sources listed for each exercise (see “Sources for what is on
        screen” above).
      </p>
      <p>
        The site uses no exercise photos, because the licence of the image sets bundled with open exercise datasets could not
        be verified (their original author says the images were collected from the internet). The only image is the 3D model.
      </p>
    </>
  );
}

export function SourcesContent() {
  const { lang, t } = useI18n();
  const s = t.src;
  const hosts = useMemo(() => sourcesByHost(), []);
  const en = lang === "en";
  return (
    <div className="sources">
      <section>
        <h3 className="src-h">{s.modelH}</h3>
        <blockquote className="attribution" lang="en">
          {BP3D_ATTRIBUTION}
        </blockquote>
        {en ? <ModelEn /> : <ModelVi />}
      </section>

      <section>
        <h3 className="src-h">{s.videoH}</h3>
        {en ? (
          <p>
            Videos are embedded from YouTube and belong to their channels; each video is credited under the player and in the
            list above. The player uses YouTube’s privacy-enhanced mode (youtube-nocookie.com) and only loads when you press
            play. Exercises without a checked video show a YouTube search button instead.
          </p>
        ) : (
          <p>
            Video được nhúng từ YouTube và thuộc về các kênh đăng tải; tên kênh ghi ngay dưới mỗi video và trong danh sách ở
            trên. Trình phát dùng chế độ tăng cường quyền riêng tư của YouTube (youtube-nocookie.com) và chỉ tải khi bạn bấm
            phát. Bài chưa có video đã kiểm tra sẽ hiện nút tìm trên YouTube.
          </p>
        )}
      </section>

      <section>
        <h3 className="src-h">{s.exH}</h3>
        {en ? <ExerciseDataEn /> : <ExerciseDataVi />}
      </section>

      <section>
        <h3 className="src-h">{s.rubricH}</h3>
        <p>{s.rubricIntro}</p>
        <ol className="rubric">
          {RUBRIC.map((r) => {
            const desc = en ? RUBRIC_EN[r.level]?.desc : r.desc;
            const example = en ? RUBRIC_EN[r.level]?.example : r.example;
            return (
              <li key={r.level}>
                <span className="rubric-lv">
                  <span className="diff-dots" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <i key={n} className={n <= r.level ? "on" : ""} />
                    ))}
                  </span>
                  {t.level(r.level, levelLabel(r.level, lang))}
                </span>
                <span className="rubric-desc">
                  {desc}
                  {desc && !/[.!]$/.test(desc) ? "." : ""}
                  {example && (
                    <span className="muted">
                      {" "}
                      {s.example} {example}.
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h3 className="src-h">{s.statsH}</h3>
        <dl className="stats">
          <div>
            <dt>{s.statMuscles}</dt>
            <dd>{STATS.muscles}</dd>
            <dd className="stats-sub">{s.statGroups(STATS.groups)}</dd>
          </div>
          <div>
            <dt>{s.statGym}</dt>
            <dd>{STATS.gym}</dd>
          </div>
          <div>
            <dt>{s.statCali}</dt>
            <dd>{STATS.calisthenics}</dd>
          </div>
          <div>
            <dt>{s.statSources}</dt>
            <dd>{STATS.sources}</dd>
            <dd className="stats-sub">{s.statHosts(hosts.length)}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="src-h">{s.allH}</h3>
        <p className="muted small">{s.allHint}</p>
        <div className="src-groups">
          {hosts.map((h) => (
            <details key={h.host} className="src-group">
              <summary>
                <span className="src-pub">{h.publisher}</span>
                <span className="src-host">{h.host}</span>
                <span className="src-n">{h.items.length}</span>
              </summary>
              <ul>
                {h.items.map((it) => (
                  <li key={it.url}>
                    <a href={it.url} {...L}>
                      {it.title}
                    </a>
                    {it.checked && <span className="muted"> · {t.checked(it.checked)}</span>}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
