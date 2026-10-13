# checks.md

node | requirement | verdict | evidence
---|---|---|---
N0 | khung dự án build được | pass | `npm run build` OK; run/baseline-bundle.txt (60.838 B gzip)
N0 | truy cập nguồn dữ liệu | unresolved | BodyParts3D dbarchive HTTP 000 (bị chặn) → hỏi người dùng (D3); free-exercise-db raw HTTP 200
N1 | muscles.json: 59 cơ khớp 1–1 dữ liệu BP3D, 47 chọn được, 17 nhóm, đủ trường, có nguồn | pass | kiểm tra ở cổng (node): 0 lỗi; kiểm tra ngẫu nhiên 2/17 URL (deltoid, gluteus-minimus) bằng WebFetch → khớp
N4 | rubric 1–5, 6 tiêu chí, quy đổi gym/calisthenics, tie-break, mẫu câu | pass | src/data/difficulty-rubric.md (111 dòng); nguồn reddit gốc bị chặn → xác minh qua bản sao + liftosaur (ghi trong file)
N6 | giấy phép ảnh free-exercise-db | pass → quyết định CHỈ CHỮ | run/image-license.md; wrkout CONTRIBUTING.md: "scrapped off the internet … I do not own the copy right"
N6 | phát hiện phụ: hướng dẫn trong free-exercise-db trùng nguyên văn bodybuilding.com | pass → ràng buộc N3 | chỉ dùng trường dữ kiện (tên, cơ, dụng cụ, level); bước thực hiện tự viết + nguồn kỹ thuật riêng

## Phiên tiếp tục 2026-10-13 — chạy lại cổng cho sản phẩm có sẵn chưa được ghi
node | requirement | verdict | evidence
---|---|---|---
D2 | nguồn mô hình: bản sao GitHub BodyParts3D 3.0 (Kevin-Mattheus-Moerman/BodyParts3D) | pass | người dùng chấp nhận ngày 2026-10-13 (hỏi trực tiếp); README bản sao: wget từ dbarchive 20110915, OBJ→STL, CC BY-SA 2.1 JP
N2 | GLB: 82 node, 80 lưới cơ khớp 1–1, ghi công trong GLB | pass | `node scripts/check-model.mjs` → PASS; 5.017.708 B; 597.451 tam giác
N3/N5 | dữ liệu: 40 cơ, 16 nhóm, 299 bài (144 gym, 155 calisthenics), C3–C6 | pass | `node scripts/check-data.mjs` → PASS C3 C4 C5 C6; merge.mjs tái lập giống hệt exercises.json
N3/N5 | kiểm tra nguồn ngẫu nhiên ≥10% | pass | run/source-audit.json (40 URL: 33 yes, 6 partial, 0 no, 1 blocked) + run/source-audit-2.json (44: 31 yes, 5 partial, 0 no, 8 unchecked) = 84 URL / ~340 mục; trưởng nhóm tự kiểm thêm 6 bài ngẫu nhiên (seed 20261013): 3 yes, 3 partial, 0 no
N3/N5 | chi tiết không được nguồn xác nhận | pass sau sửa (1/3) | correction edge: src/data/draft/fix-E.json sửa 3 câu (skull crusher bước 1–2, duỗi tam đầu tự trọng bước 0) cho khớp strengthlog.com; merge.mjs thêm bước 6
N3 | ngoại lệ C3 | unresolved (có lý do + nguồn) | src/data/exceptions.json: pectoralis-minor gym 0 & calisthenics 0; pectoralis-major-clavicular cali 1; tensor-fasciae-latae cali 2; levator-scapulae cali 2
N6 | ảnh minh hoạ | pass → CHỈ CHỮ | run/decisions/images.md (tác giả wrkout: ảnh cào từ internet, không giữ bản quyền)
N7 | viewer: bấm trúng từng cơ 40/40, camera, hover, mặt sau, bấm xuyên lớp, ngân sách, 0 lỗi | pass | `python3 -I run/harness/check_viewer.py` (chạy lại ở cổng): 40/40; 83 draw calls; 597.453 tam giác; tải 570 ms
N8 | UI: 3 lỗi đã biết (danh sách hướng dẫn vỡ chữ, tên trang bị cắt trên mobile, __mv.select không cập nhật bảng) + yêu cầu a–j | pass | subagent run/tools/n8_verify.py 26/26; cổng: `npm run build` OK, check-data/check-model PASS; ảnh run/screenshots/n8-*.png (xem bằng mắt)
N9 | bổ sung pipeline tải dữ liệu còn thiếu | pass | tools/model/fetch-model.sh (sparse checkout bản sao BP3D) + tools/data/fetch-data.sh; chạy thử: 3 STL và exercises.json (876 bài) khớp từng byte với cache

## Checklist hoàn tất (Layer 7) — N9 QA độc lập trên bản build production (`python3 -I run/tools/qa.py`, báo cáo run/qa-report.json)
check | yêu cầu | verdict | evidence
---|---|---|---
C1 | build không lỗi, 0 lỗi console | pass | `npm run build` OK; qa-report C1_console: 0 lỗi suốt các luồng
C2 | xoay/zoom/mặt trước-sau/đặt lại; bấm từng cơ 100% | pass | check_viewer.py: camera, hover, mặt sau, bấm xuyên lớp; qa-report C2: 40/40 cơ bấm trên app thật → đúng muscleId và tiêu đề bảng
C3 | ≥3 bài Gym và ≥3 Calisthenics mỗi cơ | pass, 5 ngoại lệ unresolved có lý do | `node scripts/check-data.mjs` PASS; exceptions.json: pectoralis-minor (gym 0, cali 0), pectoralis-major-clavicular (cali 1), tensor-fasciae-latae (cali 2), levator-scapulae (cali 2) — mỗi ngoại lệ có lý do + nguồn, hiển thị trong UI
C4 | dễ → khó, mỗi bài có difficulty + difficultyBasis | pass | check-data C4 PASS; qa-report: danh sách biceps gym/cali hiển thị không giảm dần
C5 | mọi cơ và bài có nguồn https đã truy cập | pass | check-data C5 PASS (0 mục thiếu nguồn); 84 URL kiểm tra ngẫu nhiên + 6 bài trưởng nhóm tự kiểm; 0 "no"
C5 | kiểm tra HTTP mọi URL | unresolved | container chặn mạng ngoài (curl → 000 với strengthlog, kenhub, pubmed); thay bằng kiểm tra qua công cụ đọc web
C6 | dữ liệu nhất quán, GLB 1–1 | pass | check-data C6 PASS; check-model PASS (80/80 lưới)
C7 | đủ file + thống kê README khớp | xem dòng N10 | `node scripts/check-manifest.mjs`
C8 | luồng sử dụng desktop + mobile | pass | qa-report: Gym mặc định; danh sách = dữ liệu (8 gym/7 cali biceps), không trùng, đã sắp; mở chi tiết thấy các bước; chip cơ phụ → chọn brachioradialis ở cả viewer và bảng; gõ "co tam dau"↓Enter → triceps; pectoralis-minor hiện lý do ngoại lệ; mobile 390×844: không cuộn ngang, mô hình trên bảng
C9 | ghi công đúng nguyên văn, mô hình CC BY-SA, ảnh chỉ khi có giấy phép | pass (UI) | qa-report C9: câu ghi công đúng nguyên văn + nêu bản sao Kevin-Mattheus-Moerman; quyết định chỉ chữ (run/decisions/images.md); ATTRIBUTION.md + LICENSE.txt → N10
C10 | GLB ≤12 MB, tam giác ≤600k, draw calls ≤150, thời gian tải | pass | 5.017.708 B; 597.453 tam giác; 83 draw calls; tải mô hình 260 ms (preview cục bộ)
C10 | FPS ≥30 trên máy có GPU | unresolved | container chỉ có SwiftShader → người dùng tự đo
N10 | README, ATTRIBUTION.md, public/models/LICENSE.txt | pass | `node scripts/check-manifest.mjs` → PASS C7 (47 file; stats muscles=40 groups=16 exercises=299 gym=144 calisthenics=155 sources=441)
C7 | đủ file + thống kê README khớp | pass | như trên
C9 | ATTRIBUTION.md + LICENSE.txt mô hình CC BY-SA 2.1 JP | pass | public/models/LICENSE.txt (câu ghi công nguyên văn, DOI, bản sao GitHub, phát hành lại CC BY-SA 2.1 JP); ATTRIBUTION.md
N10→N4 | rubric hiện hành (4 tiêu chí K/Ổ/S/R) khác bản đã qua cổng 2026-10-11 (6 tiêu chí, điểm T) — bản cũ không còn lưu | pass sau sửa (1/3) | 179 difficultyBasis tham chiếu "T = n" không định nghĩa → fix-F.json bỏ cụm T; muscle-up 5→4 (lệch 2 mức so với 'intermediate'; strengthlog: "advanced"); `node scripts/check-rubric.mjs` PASS (16 bài lệch 1 mức đều có lý do)
N10 | trang Nguồn: free-exercise-db dùng cho cả nhóm cơ (điểm khởi đầu) | pass | SourcesContent.jsx sửa 1 câu cho khớp ATTRIBUTION; QA chạy lại allPass
QA | chạy lại toàn bộ sau các bản sửa | pass | run/qa-report.json allPass: C1, C2 (40/40), C8, C8 mobile, C9, C10
UI | hạn chế quan sát lúc bàn giao | unresolved (P3) | JS 366 KB gzip (three + dữ liệu đóng gói chung); dòng gợi ý của viewer đè chân mô hình trên mobile; kéo xoay không đồng bộ nút Mặt trước/Mặt sau
Cloudflare | trang trắng khi deploy bằng Workers Builds (không có wrangler config) | pass sau sửa | thêm wrangler.jsonc (assets ./dist/, SPA); wrangler deploy --dry-run đọc 35 file; wrangler dev: #root có nội dung, mô hình tải (83 dc), 0 lỗi; run/screenshots/wrangler-dev.png
