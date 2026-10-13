# graph.md — Bản đồ cơ bắp 3D · Đợt bổ sung v2 (2026-10-14)

Trạng thái: **HOÀN TẤT 2026-10-14**, trừ V-C5 partial (77 video chưa tìm — hết hạn mức tìm kiếm của phiên).

## Yêu cầu (người dùng, 2026-10-14)
1. Tô màu đồ thị để phân biệt các cơ nằm gần nhau, tránh bấm nhầm. Mặc định mô hình trắng/xám như phần mềm 3D; khi rê chuột vào một cơ thì cơ đó và các cơ kề nó hiện màu phân biệt.
2. Ẩn nguồn khỏi bài học; gom vào một nút ở cuối giao diện.
3. Thêm video hướng dẫn: nhúng YouTube đã xác minh; bài chưa có video phù hợp → nút "Tìm video trên YouTube".
4. Giao diện thuần tiếng Anh hoặc thuần tiếng Việt, nút đổi qua lại.
5. Tối giản thẻ bài học: tên + nhãn mức + các bước + video + một dòng an toàn.

## Định nghĩa "xong" (C-v2)
- V-C1 build + 0 lỗi console; mọi kiểm tra cũ (check-data, check-rubric, check-model, check-manifest, qa.py) vẫn pass.
- V-C2 `scripts/check-colors.mjs` PASS: mọi cạnh kề khác màu; bảng màu ΔE00 ≥ 20 từng đôi, ≥ 20 với màu đất sét, ≥ 15 với màu chọn.
- V-C3 trong trình duyệt: mặc định mọi cơ màu đất sét; rê vào cơ X → X và mọi cơ kề X mang đúng màu bảng của chúng, cơ không kề vẫn đất sét; bấm chọn 40/40 vẫn đúng.
- V-C4 `scripts/check-i18n.mjs` PASS: đủ bản tiếng Anh cho 299 bài (tên, bước, an toàn, dụng cụ), 40 cơ, 16 nhóm, ngoại lệ; số bước khớp bản Việt; không còn ký tự tiếng Việt trong bản Anh. Trong trình duyệt: chế độ EN không còn chữ có dấu tiếng Việt trên giao diện (trừ tên riêng nguồn), chế độ VI không còn chuỗi giao diện tiếng Anh; nút đổi ngôn ngữ nhớ lựa chọn.
- V-C5 `scripts/check-videos.mjs` PASS: 299 bài đều có mục video (có video đã xác minh oEmbed, hoặc "none" kèm lý do + từ khoá tìm); tỉ lệ có video báo cáo thật; trưởng nhóm kiểm lại ngẫu nhiên ≥ 10% bằng oEmbed.
- V-C6 thẻ bài học chỉ gồm: tên, nhãn mức, bước, video (tải khi bấm), một dòng an toàn; không có nguồn/cơ phụ/lý do mức trong thẻ; nút "Nguồn" ở chân trang mở danh sách nguồn của cơ/bài đang xem + ghi công chung.

## Hợp đồng
- `src/data/muscle-colors.json` (V1): `{palette:[hex], colors:{muscleId: idx}, edges:[[a,b,n]], threshold}`.
- `src/data/i18n/en-meta.json` (V2a): `{groups:{id:name}, muscles:{id:{name, function:[..]}}, exceptions:{muscleId:{gym?:reason, calisthenics?:reason}}, levels:{1..5:label}}`.
- `src/data/i18n/en-gym.json` (V2a), `en-calisthenics.json` (V2b): `{exerciseId:{name, equipment:[..], steps:[..], safety:[..]}}` cùng độ dài mảng với bản Việt.
- `src/data/videos/part-{1..4}.json` (V3a–d): `{exerciseId: {youtubeId, title, channel, channelUrl, checked, note} | {none:true, reason, query}}` → V3m gộp thành `src/data/videos.json`.
- Viewer (V4): `PALETTE.clay`, `PALETTE.selected` mới; `setColorMeta(json)`; hover tô X + láng giềng; móc QA `__mv.getUnitColor(id)`, `__mv.getNeighbors(id)`.

## Nút và đợt
| Nút | Loại | Đầu ra | Cổng | Phụ thuộc |
|---|---|---|---|---|
| V0 baseline | code | run/backup/before-v2, build | build OK | — |
| V1 coloring | code | tools/model/adjacency.mjs → muscle-colors.json; scripts/check-colors.mjs | phần đồ thị của check-colors | V0 |
| V2a en-meta+gym | judgment | en-meta.json, en-gym.json | check-i18n | V0 |
| V2b en-cali | judgment | en-calisthenics.json | check-i18n | V0 |
| V3a–d videos | judgment ×4 | videos/part-N.json | check-videos + kiểm lại 10% | V0 |
| V4 viewer | judgment | src/viewer/*, harness | check-colors + harness hover | V1 |
| V2m, V3m | code | scripts/check-i18n.mjs, check-videos.mjs, videos.json | V-C4, V-C5 | V2a/b, V3a–d |
| V5 ui | judgment | App/components/styles, i18n UI | build + E2E | V2m, V3m, V4 |
| V6 qa | code | run/tools/qa.py mở rộng | V-C1…C6 | V5 |
| V7 docs | judgment | README, ATTRIBUTION (video), checks | check-manifest | V6 |

Đợt 1: V2a ‖ V2b ‖ V3a ‖ V3b ‖ V3c ‖ V3d ‖ V4 (V1 đã xong). Đợt 2: V2m ‖ V3m. Đợt 3: V5. Đợt 4: V6. Đợt 5: V7.
Không hai nút sửa cùng file.

## Nhật ký
- 2026-10-14: V0 xong (build 366 KB gzip, sao lưu src). V1 xong: 80 lưới, ngưỡng 5,9 mm (0,4% chiều cao), 144 cạnh, DSatur 6 màu (Okabe–Ito), không cơ cô lập.
- 2026-10-14: Đợt 1 xong (V2a/b pass; V4 pass; V3 222/299 do hết 200 lượt WebSearch dùng chung). V3m gộp + vá 1 ghi chú. V5 pass. V6 QA thêm 2 kiểm tra độc lập (ngôn ngữ, tô màu); giả lập 2 tên miền YouTube vì mạng chặn. V7 trưởng nhóm tự làm (tài liệu ngắn, đủ ngữ cảnh) thay vì subagent.

## Quy tắc rút ra
- L1: Hạn mức 200 lượt WebSearch/lượt trả lời dùng chung cho mọi subagent → nút tra cứu lớn phải chia ngân sách trước (vd. ≤ 45 lượt/nút) hoặc trải qua nhiều lượt.
- L2: Subagent chạy song song cần thư mục scratch riêng (đã có va chạm file tạm).
- L3: Viết script cổng TRƯỚC khi giao việc giúp các nút tự kiểm đúng tiêu chí (0 lần sửa ở V2a/V2b).
