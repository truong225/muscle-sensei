# graph.md — Bản đồ cơ bắp 3D

Trạng thái: **HOÀN TẤT 2026-10-13**. C1–C10 pass; unresolved có lý do: 5 ngoại lệ C3, quét HTTP C5 (mạng bị chặn), FPS máy thật C10, 3 lỗi P3.

## 0. Định nghĩa "xong"
C1–C10 trong `checks.md` đều `pass`, hoặc `unresolved` có lý do rõ (ví dụ FPS máy thật, cơ không đủ bài calisthenics có nguồn).

## 1. Quyết định
| # | Quyết định | Lý do |
|---|---|---|
| D1 | `three` 0.186.1 thuần + React 19 + Vite 6 | Giống dự án Địa Cầu, ít phụ thuộc |
| D2 | Mô hình lấy từ **bản sao GitHub của BodyParts3D** (`Kevin-Mattheus-Moerman/BodyParts3D`, bản 3.0 ngày 20110915, STL nhị phân, CC BY-SA 2.1 JP) | Máy chủ gốc dbarchive.biosciencedbc.jp bị chặn từ container (HTTP 000). Cùng bộ dữ liệu, cùng giấy phép, chỉ khác nơi lưu; FMA ID và tên trùng khớp. Ghi rõ trong ATTRIBUTION. |
| D3 | Đơn vị chọn được = "cơ tập luyện" (40–45 mục), có thể gồm nhiều lưới FMA (vd. 3 phần cơ thang tách riêng; nhóm chóp xoay gộp) | Khớp cách người tập nghĩ; tránh 255 lưới lẻ không có bài tập |
| D4 | Lưới không chọn được (cơ mặt, bàn tay/chân, cơ sâu cột sống) + xương hiển thị mờ làm ngữ cảnh | Giữ hình người hoàn chỉnh, không gây nhiễu |
| D5 | Danh sách bài của một cơ = bài có cơ đó trong `primaryMuscles` | Đúng trọng tâm; cơ phụ hiển thị trong chi tiết |
| D6 | Gym = tạ đòn, tạ đơn, tạ ấm, thanh EZ, cáp, máy. Calisthenics = trọng lượng cơ thể, xà đơn, xà kép, vòng | Theo mô tả của ngài |

## 2. Hợp đồng giao tiếp
**muscles.json**
```
{ groups: [{ id, nameVi, order }],
  muscles: [{ id, nameVi, nameLa, nameEn, group, view: "front"|"back"|"both",
              functionVi: [string], fma: { L: ["FMA…"], R: ["FMA…"], C: ["FMA…"] },
              sources: [{ url, supports: "name"|"function"|"anatomy", checked: "YYYY-MM-DD" }] }],
  context: { muscles: ["FMA…"], bones: ["FMA…"] } }      // lưới không chọn được
```
**Bài tập (draft/gym.json, draft/calisthenics.json → exercises.json)**
```
[{ id, nameVi, nameEn, type: "gym"|"calisthenics", equipment: [string vi],
   primaryMuscles: [muscleId], secondaryMuscles: [muscleId],
   difficulty: 1..5, difficultyBasis: string vi, steps: [string vi], safety: [string vi],
   progressionOf?: exerciseId, fedbId?: string,
   sources: [{ url, supports: "execution"|"muscles"|"difficulty", checked }] }]
```
**GLB**: node `muscle:<muscleId>:<L|R|C>` (chọn được), `context:muscle:<FMA>` và `context:bone`; kèm `extras.muscleId`.
**Viewer API** (`src/viewer/MuscleViewer.js`): `new MuscleViewer(canvas, {reducedMotion})`, `load(url)`, `select(id|null)`, `hover`, `onSelect(cb)`, `onHover(cb)`, `setView("front"|"back")`, `resetView()`, `zoomBy(d)`, `screenPointOf(id)` (QA), `dispose()`, `window.__mv`.

## 3. Nút
| Nút | Loại | Đầu ra | Cổng | Phụ thuộc |
|---|---|---|---|---|
| N0 scaffold | code | khung Vite/React, build baseline | build OK | — |
| N1 muscle-catalog | judgment (subagent, tra web) | src/data/muscles.json | check-data (phần cơ) + đối chiếu FMA có STL | — |
| N4 rubric | judgment | src/data/difficulty-rubric.md | đọc duyệt | — |
| N6 image-license | judgment | quyết định ảnh trong run/decisions/images.md | nguồn gốc ảnh xác minh được | — |
| N2 model-pipeline | code | tools/model/build-model.mjs → public/models/muscles.glb | check-model (1–1, ngân sách C10) | N1 |
| N3a gym, N3b calisthenics | judgment (2 subagent song song) | src/data/draft/{gym,calisthenics}.json | check-data trên bản nháp | N1, N4 |
| N5 merge-validate | code | src/data/exercises.json, sources.json, scripts/check-data.mjs, check-manifest.mjs | C3–C7 | N3a, N3b |
| N7 viewer | judgment (subagent) | src/viewer/* + harness bấm từng cơ | C2 | N2 |
| N8 ui | judgment (subagent) | App.jsx, CSS, trang nguồn | build + E2E nhanh | N5, N6, N7 |
| N9 qa | code | run/tools/qa.py, ảnh | C1–C10 | N8 |
| N10 docs | judgment | README, ATTRIBUTION, LICENSE | đối chiếu checks.md | N9 |

## 4. Các đợt
```
Đợt 0: N0
Đợt 1: N1 ‖ N4 ‖ N6
Đợt 2: N2 ‖ N3a ‖ N3b
Đợt 3: N5 ‖ N7
Đợt 4: N8
Đợt 5: N9
Đợt 6: N10
```
Nút code: N0, N2, N5, N9.

## 5. Rủi ro
- R1: container không GPU → FPS máy thật `unresolved`.
- R2: free-exercise-db chỉ có 17 nhóm cơ thô; ánh xạ sang cơ chi tiết là phán đoán → bắt buộc nguồn "muscles".
- R3: ảnh của free-exercise-db có thể có nguồn gốc không rõ giấy phép → N6.

## 6. Nhật ký quyết định
- 2026-10-12: N0 xong (build baseline 60,97 KB gzip). D2: dùng bản sao GitHub vì máy chủ gốc bị chặn (lúc này CHƯA hỏi người dùng).
- 2026-10-12 ~14:25 UTC: phiên bị ngắt giữa N8; progress/checks chỉ ghi tới Đợt 1.
- 2026-10-13: phiên tiếp tục. Người dùng chấp nhận D2. Chạy lại cổng N2, N3/N5, N7 (pass). Correction edge fix-E (3 câu). Tiếp tục N8.
- 2026-10-13: N8 hoàn thiện (subagent, 3 lỗi). N9 thêm fetch-model.sh, fetch-data.sh, check-manifest.mjs, qa.py. N10 phát hiện rubric bị thay sau cổng → fix-F + check-rubric.mjs. Hoàn tất.

## 7. Quy tắc rút ra
- L1: Cập nhật progress.md/checks.md NGAY sau mỗi cổng, không dồn cuối đợt — phiên bị ngắt sẽ để lại sản phẩm không có hồ sơ.
- L3: Tài liệu gốc mà dữ liệu tham chiếu (rubric) phải được khoá lại bằng script kiểm tra; sửa tài liệu sau cổng thì phải chạy lại cổng.
- L2: Mọi sửa dữ liệu đi qua bản vá trong src/data/draft/ + merge.mjs để tái lập được; không sửa tay exercises.json.
