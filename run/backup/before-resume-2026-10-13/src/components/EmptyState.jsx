import { STATS } from "../lib/data.js";
import { MusclePicker } from "./MusclePicker.jsx";

export function EmptyState({ onPick, webglOk }) {
  return (
    <div className="empty">
      <p className="eyebrow">Atlas tập luyện</p>
      <h2 className="empty-title">Chọn một cơ để xem bài tập dành cho nó</h2>
      <p className="empty-lede">
        {STATS.muscles} cơ và nhóm cơ, {STATS.gym + STATS.calisthenics} bài Gym và Calisthenics. Mỗi danh sách xếp từ dễ đến
        khó, kèm cách thực hiện, lưu ý an toàn và nguồn tham khảo.
      </p>
      <ol className="howto">
        <li>
          <b>Bấm vào một cơ</b> trên mô hình{webglOk ? "" : " (nếu thiết bị hiển thị được 3D)"}, hoặc tìm trong danh sách
          bên dưới.
        </li>
        <li>
          <b>Bấm lần nữa cùng chỗ</b> để chọn cơ nằm sâu hơn ở lớp dưới.
        </li>
        <li>
          <b>Mở một bài</b> để xem độ khó, cơ chính, cơ phụ và từng bước.
        </li>
      </ol>
      <MusclePicker selectedId={null} onPick={onPick} />
    </div>
  );
}
