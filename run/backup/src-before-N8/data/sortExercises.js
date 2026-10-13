// Thứ tự hiển thị dùng chung cho UI và script kiểm tra C4: dễ → khó.
// Cùng mức: theo trường "order" (nếu nút dữ liệu đặt theo luật tie-break của rubric), rồi theo id.
export function sortExercises(list) {
  return [...list].sort(
    (a, b) => a.difficulty - b.difficulty || (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id),
  );
}
