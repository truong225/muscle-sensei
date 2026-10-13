// Bảng màu cho trình xem cơ.
// Mặc định kiểu "đất sét" (clay) như phần mềm 3D: mọi cơ chọn được cùng một màu xám sáng trung tính,
// cơ ngữ cảnh và xương lệch tông nhẹ để hình vẫn đọc được nhờ ánh sáng/đổ bóng; không có tông đỏ mặc định.
// Khi rê chuột vào cơ X, X và các cơ kề X mang màu bảng (src/data/muscle-colors.json, tô màu đồ thị),
// nên màu chọn và màu đất sét phải khác xa mọi màu bảng (kiểm bằng scripts/check-colors.mjs, ΔE00).
// Tách riêng để giao diện có thể dùng cùng màu cho chú thích.
export const PALETTE = {
  background: "#f1ede6", // nền trung tính ấm
  clay: "#d9d5ce", // cơ chọn được: đất sét xám sáng (ΔE00 ≥ 26 với mọi màu bảng)
  muscle: "#d9d5ce", // bí danh cũ của clay (chú thích "Chọn được" trong giao diện)
  muscleHover: "#ece9e4", // rê chuột khi chưa có muscle-colors.json: đất sét sáng hơn
  muscleHoverEmissive: "#3a3833",
  muscleDim: "#d9d5ce", // giữ cho tương thích; các cơ khác không còn bị làm mờ khi chọn
  selected: "#d01c8b", // cơ đang chọn: hồng tím đậm (ΔE00 ≥ 41 với mọi màu bảng, 44 với đất sét)
  selectedEmissive: "#5c0a3c",
  outline: "#24211e", // viền tối quanh cơ đang rê (sẽ bấm trúng)
  contextMuscle: "#b9b5ae", // cơ ngữ cảnh (không chọn được): xám đậm hơn một bậc
  bone: "#ece8df", // xương: trắng ngà nhạt
};
