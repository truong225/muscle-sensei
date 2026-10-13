import { useMemo } from "react";
import { RUBRIC, STATS, sourcesByHost, formatDate } from "../lib/data.js";

export const BP3D_ATTRIBUTION =
  "BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan";

export function SourcesContent() {
  const hosts = useMemo(() => sourcesByHost(), []);
  return (
    <div className="sources">
      <section>
        <h3 className="src-h">Mô hình 3D</h3>
        <blockquote className="attribution" lang="en">
          {BP3D_ATTRIBUTION}
        </blockquote>
        <p>
          Mô hình trong trang này được <strong>chỉnh sửa</strong> từ BodyParts3D: gộp các lưới theo đơn vị cơ tập luyện,
          giản lược số tam giác, xoay lại hướng cho đứng thẳng và chuyển từ STL sang một tệp GLB duy nhất. Bản đã chỉnh sửa được phân phối lại theo cùng giấy phép{" "}
          <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" target="_blank" rel="noreferrer">
            CC BY-SA 2.1 JP
          </a>
          .
        </p>
        <p>
          Tệp gốc lấy từ bản sao trên GitHub{" "}
          <a href="https://github.com/Kevin-Mattheus-Moerman/BodyParts3D" target="_blank" rel="noreferrer">
            Kevin-Mattheus-Moerman/BodyParts3D
          </a>{" "}
          (bản phát hành 3.0, ngày 20110915; người duy trì bản sao đã chuyển các tệp từ OBJ sang STL), vì máy chủ gốc không truy cập được lúc dựng mô hình. Trang gốc của dự án:{" "}
          <a href="http://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">
            BodyParts3D (lifesciencedb.jp/bp3d)
          </a>{" "}
          và{" "}
          <a href="http://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">
            trang giấy phép trên dbarchive.biosciencedbc.jp
          </a>
          .
        </p>
      </section>

      <section>
        <h3 className="src-h">Dữ liệu bài tập</h3>
        <p>
          <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">
            free-exercise-db
          </a>{" "}
          (giấy phép Unlicense) chỉ được dùng để tra <em>dữ kiện</em> của bài: tên, nhóm cơ (làm điểm khởi đầu; cơ chính và cơ phụ chi tiết được xác minh bằng nguồn riêng), dụng cụ, cấp độ. Phần hướng dẫn thực hiện
          và lưu ý an toàn được viết độc lập bằng tiếng Việt, đối chiếu với các nguồn ghi ở từng bài.
        </p>
        <p>
          Trang không dùng ảnh minh hoạ bài tập, vì không xác minh được giấy phép của bộ ảnh đi kèm các bộ dữ liệu mở (chính
          tác giả gốc cho biết ảnh được thu thập từ internet). Hình duy nhất là mô hình 3D ở trên.
        </p>
      </section>

      <section>
        <h3 className="src-h">Thang độ khó</h3>
        <p>
          Mỗi bài được chấm theo kỹ thuật, độ ổn định, sức mạnh tối thiểu và rủi ro khi sai kỹ thuật. Danh sách luôn xếp từ
          dễ đến khó.
        </p>
        <ol className="rubric">
          {RUBRIC.map((r) => (
            <li key={r.level}>
              <span className="rubric-lv">
                <span className="diff-dots" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <i key={n} className={n <= r.level ? "on" : ""} />
                  ))}
                </span>
                Mức {r.level} · {r.label}
              </span>
              <span className="rubric-desc">
                {r.desc}
                {r.example && <span className="muted"> Ví dụ: {r.example}.</span>}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="src-h">Số liệu</h3>
        <dl className="stats">
          <div>
            <dt>Cơ chọn được</dt>
            <dd>{STATS.muscles}</dd>
            <dd className="stats-sub">trong {STATS.groups} nhóm</dd>
          </div>
          <div>
            <dt>Bài Gym</dt>
            <dd>{STATS.gym}</dd>
          </div>
          <div>
            <dt>Bài Calisthenics</dt>
            <dd>{STATS.calisthenics}</dd>
          </div>
          <div>
            <dt>Nguồn tham khảo</dt>
            <dd>{STATS.sources}</dd>
            <dd className="stats-sub">từ {hosts.length} trang</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="src-h">Toàn bộ nguồn</h3>
        <p className="muted small">Nhóm theo trang web; bấm để mở danh sách.</p>
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
                    <a href={it.url} target="_blank" rel="noreferrer">
                      {it.title}
                    </a>
                    {it.checked && <span className="muted"> · kiểm tra ngày {formatDate(it.checked)}</span>}
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
