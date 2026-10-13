# Bản đồ cơ bắp 3D

<!-- stats: muscles=40 groups=16 exercises=299 gym=144 calisthenics=155 sources=441 -->

Website tiếng Việt có mô hình 3D giải phẫu cơ người. Bấm vào một cơ trên mô hình (hoặc tìm theo tên) để xem:

- tên tiếng Việt, tên Latin, tên tiếng Anh và chức năng của cơ, kèm nguồn giải phẫu;
- hai danh sách bài tập lấy cơ đó làm **cơ chính**:
  - **Gym:** tạ đòn, tạ đơn, tạ ấm, thanh EZ, cáp, máy.
  - **Calisthenics:** trọng lượng cơ thể, xà đơn, xà kép, vòng.
- mỗi danh sách xếp **từ dễ đến khó** theo thang 1–5 (`src/data/difficulty-rubric.md`);
- mỗi bài có các bước thực hiện, lưu ý an toàn, căn cứ độ khó, cơ phụ (bấm để chuyển sang cơ đó) và nguồn tham khảo;
- trang "Nguồn & giấy phép" liệt kê toàn bộ nguồn, thang độ khó và ghi công mô hình.

Thao tác với mô hình:

- xoay, phóng to/thu nhỏ, chuyển Mặt trước/Mặt sau, đặt lại góc nhìn;
- bấm lần nữa cùng chỗ để chọn cơ nằm sâu hơn;
- trạng thái nằm trên URL (`#co=<muscleId>&tab=gym|calisthenics`).

Trang chỉ dùng chữ, không có ảnh minh hoạ bài tập (lý do ở [ATTRIBUTION.md](ATTRIBUTION.md)).

> **Lưu ý sức khoẻ.** Nội dung chỉ mang tính tham khảo, không thay thế hướng dẫn của huấn luyện viên hay bác sĩ. Dừng tập nếu thấy đau.

## Bản bổ sung v2 (2026-10-14)

- **Tô màu đồ thị chống bấm nhầm:** mặc định mô hình màu đất sét xám sáng (`#d9d5ce`). Rê chuột lên một cơ → cơ đó và mọi cơ chạm nó mang màu khác nhau. Đồ thị kề tính từ hình học thật của `muscles.glb` (hai cơ kề khi có ≥ 3 cặp đỉnh cách nhau ≤ 5,9 mm, cùng bên cơ thể), tô bằng DSatur → 144 cạnh, 6 màu (bảng Okabe–Ito, các màu cách nhau ΔE00 ≥ 21,7). Cơ đang chọn màu hồng tím `#d01c8b`. Trên màn hình cảm ứng, chọn một cơ sẽ tô các cơ kề nó. Dựng lại: `node tools/model/adjacency.mjs` → `src/data/muscle-colors.json`.
- **Song ngữ VI / EN:** nút ở góc trên bên phải; nhớ lựa chọn (localStorage) và nhận `?lang=vi|en`. Nội dung tiếng Anh: `src/data/i18n/en-{meta,gym,calisthenics}.json` (dịch sát bản Việt, cùng số bước), chỉ tải khi chọn EN.
- **Thẻ bài học tối giản:** tên, nhãn mức, các bước, video, một dòng an toàn.
- **Video:** nhúng YouTube (youtube-nocookie, chỉ tải khi bấm). 222/299 bài có video đã xác minh qua oEmbed (tiêu đề, kênh, cho phép nhúng), từ 133 kênh. 77 bài còn lại **chưa được tìm** (hết hạn mức tìm kiếm của phiên) và tạm hiện nút "Tìm video trên YouTube"; tìm tiếp → ghi `src/data/videos/follow-up-*.json` → `node tools/data/merge-videos.mjs`.
- **Nguồn được ẩn:** không còn trong thẻ bài/đầu bảng; một nút "Nguồn"/"Sources" nhỏ ở chân trang mở danh sách nguồn của nội dung đang xem + ghi công chung.

## Số liệu

| Mục | Số lượng |
|---|---|
| Cơ chọn được (đơn vị cơ tập luyện) | **40** cơ, trong **16** nhóm |
| Bài tập | **299** bài: **144** Gym, **155** Calisthenics |
| Nguồn tham khảo (`src/data/sources.json`) | **441** URL, 108 tên miền |

Các nhóm cơ: Ngực, Vai, Lưng trên, Lưng xô, Cánh tay trước, Cánh tay sau, Cẳng tay, Bụng, Lưng dưới, Mông và hông ngoài, Gấp hông, Đùi trong (nhóm cơ khép), Đùi trước, Đùi sau, Cẳng chân, Cổ.

Hướng nhìn của 40 cơ: 20 mặt trước, 18 mặt sau, 2 cả hai mặt.

Phân bố độ khó:

| Mức | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Gym | 71 | 38 | 30 | 5 | 0 |
| Calisthenics | 42 | 47 | 36 | 24 | 6 |

Mô hình `public/models/muscles.glb`:

- 5.017.708 B;
- 82 node, trong đó 80 node cơ chọn được (`muscle:<id>:<L|R|C>`) cộng 1 node cơ ngữ cảnh và 1 node xương;
- 597.451 tam giác theo `check-model` (trình xem đếm 597.453);
- 83 draw call.

Lưới gốc gồm 674 tệp STL của BodyParts3D; riêng phần ngữ cảnh có 266 lưới cơ và 242 lưới xương.

## Chạy

Cần Node.js; dự án đã chạy với Node 22.22.0. Mọi lệnh chạy từ thư mục gốc dự án.

```bash
npm ci            # cài đúng phiên bản trong package-lock.json
npm run dev       # máy chủ phát triển Vite (cổng mặc định 5173, lắng nghe 0.0.0.0)
npm run build     # bản production vào dist/
npm run preview   # phục vụ dist/ (cổng mặc định 4173)
```

Dữ liệu (`src/data/*.json`) và mô hình (`public/models/muscles.glb`) đã có sẵn trong mã nguồn, nên không cần tải gì thêm để chạy site.

## Dựng lại dữ liệu và mô hình từ đầu

### Dữ liệu bài tập

```bash
bash tools/data/fetch-data.sh      # [đích=tools/data/cache]
node tools/data/merge.mjs
```

- `fetch-data.sh` tải `exercises.json`, `README.md` và `LICENSE` của free-exercise-db vào `tools/data/cache/` (thư mục này bị `.gitignore`).
  - Bộ này chỉ dùng để tra trường dữ kiện: tên, cơ, dụng cụ, cấp độ.
  - Lần chạy thử ở N9 ra 876 bài, khớp từng byte với cache.
- `merge.mjs` **không đọc** cache trên.
  - Đầu vào: các bản nháp trong `src/data/draft/` (`remapped.json`, `judgment-{A,B,C,D}.json`, `fix-{A,B,C,D,E}.json`, `sources-prior.json`) và `src/data/muscles.json`.
  - Đầu ra: ghi đè `src/data/exercises.json`, `sources.json` và `exceptions.json`.
  - Đã kiểm tra ngày 2026-10-13 trên một bản sao thư mục: cả ba tệp tái lập giống hệt từng byte.
- Các bản nháp là sản phẩm của các nút phán đoán (tra nguồn, viết tiếng Việt), không sinh lại được bằng code. `remapped.json` do `node tools/data/remap-prior.mjs` sinh từ `run/backup/prior-run-2026-10-11/`.
- Quy tắc: mọi sửa dữ liệu đi qua một bản vá trong `src/data/draft/` và `merge.mjs`. Không sửa tay `exercises.json` (L2 trong `run/graph.md`).

### Mô hình 3D

Cần `git` hỗ trợ partial clone và sparse-checkout (đã dùng git 2.43).

```bash
# 1. Sinh danh sách tệp STL cần tải (fetch-model.sh bắt buộc có tệp này)
mkdir -p tools/model/cache
node -e 'const M=require("./src/data/muscles.json");const s=new Set([...M.muscles.flatMap(m=>Object.values(m.fma).flat()),...M.context.muscles,...M.context.bones]);console.log([...s].sort().map(f=>"/assets/BodyParts3D_data/stl/"+f+".stl").join("\n"))' > tools/model/cache/needed.txt

# 2. Tải đúng các tệp đó từ bản sao GitHub của BodyParts3D
bash tools/model/fetch-model.sh    # [đích=tools/model/cache/bp3d] [danh-sách=tools/model/cache/needed.txt]

# 3. Dựng GLB
node --max-old-space-size=8192 tools/model/build-model.mjs
```

1. Kho không có script sinh `needed.txt`; lệnh ở bước 1 là cách dựng lại. Đã kiểm tra ngày 2026-10-13: lệnh này cho ra đúng 674 dòng, giống hệt từng byte tệp `needed.txt` đã dùng.
2. `fetch-model.sh` clone `https://github.com/Kevin-Mattheus-Moerman/BodyParts3D` (blobless, depth 1) rồi sparse-checkout `README.md`, `LICENSE`, `LICENSE_content` và các STL trong danh sách. Lần chạy thử ở N9 cho 3 STL khớp từng byte với cache.
3. `build-model.mjs` đọc `src/data/muscles.json` và các STL, rồi ghi:
   - `public/models/muscles.glb`;
   - `tools/model/build-report.json` (lần dựng gần nhất mất 55 giây).

   `npm run model` chạy cùng script nhưng **không** có cờ `--max-old-space-size`. Vì vậy nên dùng lệnh đầy đủ ở trên.

## Kiểm tra

```bash
node scripts/check-data.mjs       # C3 (đủ bài), C4 (dễ → khó), C5 (có nguồn https), C6 (tham chiếu nhất quán, không trùng)
node scripts/check-model.mjs      # C6 (ánh xạ 1–1 cơ ↔ node GLB), C10 (kích thước, tam giác, draw call), ghi công trong GLB
node scripts/check-rubric.mjs     # C4 (thang điểm): mức khớp quy tắc nguồn trong difficulty-rubric.md, lệch free-exercise-db tối đa 1 mức có lý do
node scripts/check-colors.mjs     # v2: cơ kề khác màu; bảng màu, màu đất sét, màu chọn đủ khác nhau (ΔE00)
node scripts/check-i18n.mjs       # v2: bản tiếng Anh đủ, đúng số bước, không còn tiếng Việt
node scripts/check-videos.mjs     # v2: mỗi bài có video đã xác minh hoặc mục chờ/none có lý do + từ khoá
node scripts/check-manifest.mjs   # C7 (đủ file trong run/manifest.json, không rỗng; dòng stats của README khớp dữ liệu)
npm run check                     # chạy cả ba
```

Hai bộ kiểm thử trình duyệt cần Python Playwright và Chromium. Chúng chạy WebGL bằng SwiftShader.

**Kiểm thử trình xem (`run/harness/check_viewer.py`, C2).** Cần máy chủ dev ở cổng 5191, vì trang kiểm thử là `run/harness/viewer.html`:

```bash
npx vite --port 5191 --strictPort &
python3 -I run/harness/check_viewer.py          # mặc định http://localhost:5191/run/harness/viewer.html; đổi bằng --url URL
```

**QA độc lập trên bản production (`run/tools/qa.py`, C1, C2, C8, C9, C10).** Cần URL gốc làm tham số bắt buộc. Kết quả lần gần nhất nằm ở `run/qa-report.json`; ảnh chụp được ghi vào `run/screenshots/`.

```bash
npm run build
npx vite preview --port 4181 --strictPort &
python3 -I run/tools/qa.py http://localhost:4181
```

Kết quả lần gần nhất (chi tiết trong `run/checks.md`):

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| C1 | pass | 0 lỗi console |
| C2 | pass | bấm trúng 40/40 cơ |
| C3 | pass | có 5 ngoại lệ, xem bên dưới |
| C4 | pass | |
| C5 | pass | riêng kiểm tra HTTP mọi URL là unresolved |
| C6 | pass | |
| C8 | pass | |
| C9 | pass | |
| C10 | pass | FPS máy thật là unresolved |

Kiểm tra ngẫu nhiên nguồn: 84 URL trong `run/source-audit.json` và `run/source-audit-2.json`, cộng 6 bài do trưởng nhóm tự kiểm. Không có mục nào "no".

## Cấu trúc

```
index.html, vite.config.mjs, package.json
src/
  main.jsx, App.jsx, styles.css
  components/   Viewer, MusclePanel, ExerciseItem, MusclePicker, SourcesContent, EmptyState, Dialog
  viewer/       MuscleViewer.js (three.js: tải GLB, chọn/hover, xoay, mặt trước/sau), palette.js
  lib/          data.js (nạp + sắp xếp dữ liệu, nhóm nguồn), hash.js (trạng thái trên URL)
  data/         muscles.json, exercises.json, sources.json, exceptions.json,
                difficulty-rubric.md, sortExercises.js, draft/ (bản nháp + bản vá cho merge.mjs)
public/models/  muscles.glb, LICENSE.txt
tools/model/    fetch-model.sh, build-model.mjs, bp3d-muscles.json, fma-inventory.tsv, build-report.json
tools/data/     fetch-data.sh, merge.mjs, remap-prior.mjs
scripts/        check-data.mjs, check-rubric.mjs, check-model.mjs, check-manifest.mjs
run/            graph.md (quyết định D1–D6), checks.md (kết quả cổng), progress.md, manifest.json,
                qa-report.json, decisions/images.md, harness/, tools/, screenshots/
ATTRIBUTION.md  ghi công và giấy phép
```

## Hạn chế đã biết và việc còn mở

- v2: 77/299 bài chưa có video (chưa tìm, không phải không có). Việc phát video thật và ảnh thu nhỏ chưa kiểm được trong container (mạng tới YouTube bị chặn; QA giả lập hai tên miền i.ytimg.com và youtube-nocookie.com) → cần mở thử trên máy có mạng. Video chỉ được chọn theo tiêu đề + kênh (oEmbed), chưa ai xem nội dung từng video.
- v2: JS chính 397 KB gzip (+ 3 khối tiếng Anh ~46 KB tải khi cần).

- Thang độ khó: bản rubric chấm điểm "T" (6 tiêu chí) của phiên 2026-10-11 đã bị thay và không còn lưu. Ở cổng N10 (2026-10-13), cụm "T = n" được bỏ khỏi `difficultyBasis` (bản vá `src/data/draft/fix-F.json`), muscle-up hạ từ mức 5 xuống 4 theo quy tắc lệch tối đa 1 mức; `check-rubric.mjs` xác nhận 299 bài khớp rubric hiện hành. Mức độ là đánh giá tương đối, chưa qua huấn luyện viên thẩm định.

Các mục unresolved trong `run/checks.md`:

1. **C3: năm ngoại lệ thiếu bài.** Mỗi ngoại lệ có lý do và nguồn trong `src/data/exceptions.json`, và được hiển thị trong giao diện.
   - `pectoralis-minor` (cơ ngực bé): Gym 0, Calisthenics 0.
   - `pectoralis-major-clavicular` (ngực lớn, phần đòn): Calisthenics 1.
   - `tensor-fasciae-latae` (cơ căng mạc đùi): Calisthenics 2.
   - `levator-scapulae` (cơ nâng vai): Calisthenics 2.
2. **C5: chưa kiểm tra HTTP cho mọi URL.**
   - Container chặn mạng ngoài: `curl` trả 000 với strengthlog, kenhub, pubmed.
   - Thay vào đó đã kiểm tra mẫu qua công cụ đọc web: 84 URL cộng 6 bài, 0 "no".
3. **C10: chưa đo FPS ≥30 trên máy có GPU thật.** Container chỉ có SwiftShader, nên người dùng cần tự đo.
4. **Thời gian tải mô hình chỉ đo cục bộ:** 260 ms trong `checks.md` và 309 ms trong `qa-report.json`, cả hai qua preview cục bộ.

Các vấn đề quan sát được khi bàn giao. Chúng chưa có dòng riêng trong `checks.md`, nhưng đã được kiểm lại ngày 2026-10-13:

5. **JS bundle khoảng 366 KB gzip.**
   - `dist/assets/index-*.js` nặng 1.495.044 B; gzip mặc định cho 366.551 B.
   - Nguyên nhân: dữ liệu JSON được nhúng vào bundle (riêng `exercises.json` + `sources.json` khoảng 114 KB gzip), và three.js cũng nằm trong cùng một tệp.
   - Mốc ban đầu ở N0 là 60.838 B gzip.
6. **Trên mobile, dòng gợi ý "Kéo để xoay · cuộn để phóng to · bấm lần nữa cùng chỗ…" đè lên bàn chân của mô hình.** Xem `run/screenshots/qa-mobile-selected.png` và `n8-mobile-empty.png`.
7. **Kéo xoay mô hình không cập nhật nút Mặt trước/Mặt sau.**
   - Trong `src/components/Viewer.jsx`, trạng thái `view` chỉ đổi khi bấm nút, khi chọn cơ hoặc khi đặt lại.
   - Không có gì lắng nghe thay đổi camera do kéo, nên xoay tay ra sau lưng thì nút vẫn ghi "Mặt trước".

## Bước tiếp theo

- Đo FPS trên máy thật có GPU (desktop và điện thoại tầm trung), rồi ghi kết quả vào dòng C10 của `run/checks.md`.
- Chạy kiểm tra HTTP cho toàn bộ 441 URL từ một máy có mạng mở, sửa hoặc thay các liên kết hỏng.
- Giảm bundle:
  - tách `exercises.json` và `sources.json` ra tệp tải theo nhu cầu (`fetch` hoặc dynamic `import()`);
  - tách three.js thành chunk riêng.
- Dời dòng gợi ý trên mobile khỏi vùng mô hình (hoặc ẩn sau lần tương tác đầu).
- Đồng bộ nút Mặt trước/Mặt sau theo hướng camera, ví dụ lắng nghe sự kiện `change` của OrbitControls và so góc phương vị.
- Tiếp tục tìm nguồn cho các cơ trong `exceptions.json`. Chỉ thêm bài khi có nguồn ghi rõ cơ đó là cơ chính.
- Thêm script sinh `tools/model/cache/needed.txt` vào kho, thay cho lệnh một dòng ở trên.

## Giấy phép

- Mô hình 3D: CC BY-SA 2.1 JP (bản phái sinh từ BodyParts3D), xem [`public/models/LICENSE.txt`](public/models/LICENSE.txt).
- Dữ liệu, nguồn và giấy phép thư viện: xem [ATTRIBUTION.md](ATTRIBUTION.md).

## Triển khai lên Cloudflare (Workers Builds)

Repo có sẵn `wrangler.jsonc` trỏ `assets.directory` vào `./dist/` (thư mục Vite build ra), bật `not_found_handling: "single-page-application"`.
Trên dashboard: Build command `npm run build`, Deploy command `npx wrangler deploy`, Path `/`.
Trường `name` trong `wrangler.jsonc` phải trùng tên Worker trên dashboard.
Nếu thiếu file này, `wrangler deploy` sẽ tự đoán cấu hình và có thể phục vụ thư mục mã nguồn → trang trắng (`/src/main.jsx` không chạy được trên trình duyệt).
Đã kiểm tra: `npx wrangler deploy --dry-run` đọc 35 file từ `dist`; `wrangler dev` hiển thị trang, tải mô hình 3D, 0 lỗi console.
