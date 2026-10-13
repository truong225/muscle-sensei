// Harness cho N7: tải GLB vào MuscleViewer, nạp muscles.json, ghi trạng thái lên window cho Playwright.
import { MuscleViewer } from "/src/viewer/MuscleViewer.js";
import muscles from "/src/data/muscles.json";

const params = new URLSearchParams(location.search);
const canvas = document.getElementById("c");
const label = document.getElementById("label");
const mv = new MuscleViewer(canvas, { reducedMotion: params.has("reduced") });
mv.setMuscleMeta(muscles);
window.__harness = { ready: false, events: [], hover: null };
const name = (id) => muscles.muscles.find((m) => m.id === id)?.nameVi ?? "—";
mv.onSelect((id, info) => {
  window.__harness.events.push({ type: "select", id, depth: info?.depth });
  label.textContent = id ? `Đã chọn: ${name(id)} (độ sâu ${info.depth})` : "Chưa chọn cơ nào";
});
mv.onHover((id) => {
  window.__harness.hover = id;
});
mv.load("/models/muscles.glb")
  .then(() => {
    window.__harness.ready = true;
    label.textContent = "Đã tải xong";
  })
  .catch((e) => {
    window.__harness.error = String(e);
    label.textContent = "Lỗi tải mô hình: " + e;
    console.error(e);
  });
