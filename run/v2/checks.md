# checks.md — v2
node | requirement | verdict | evidence
---|---|---|---
V0 | build + sao lưu | pass | npm run build OK (366 KB gzip); run/backup/before-v2/src
V1 | đồ thị kề + DSatur: mọi cạnh khác màu, mọi cơ có màu | pass | `node tools/model/adjacency.mjs` → 144 cạnh, 6 màu; check-colors phần cạnh: 0 lỗi; láng giềng hợp lý (nhị đầu ↔ cánh tay, delta, ngực; bụng chân ↔ dép, đùi sau)
V1 | bảng màu ΔE00 ≥ 20 từng đôi | pass | minPaletteDeltaE 21,7
V1→V4 | PALETTE.clay chưa có; PALETTE.selected #ff6a1a quá gần #D55E00 (ΔE 8,9) | fail → giao V4 | `node scripts/check-colors.mjs`
V2a | en-meta.json + en-gym.json (144 bài, 40 cơ, 16 nhóm, 5 ngoại lệ, 5 nhãn mức) | pass | `node scripts/check-i18n.mjs` PASS (chạy lại ở cổng); subagent tự đối chiếu 10 bài, sửa 2 câu
V2b | en-calisthenics.json (155 bài) | pass | check-i18n PASS; tự đối chiếu 10 bài, sửa 1 câu
V4 | viewer: đất sét mặc định, rê → X + láng giềng màu bảng, màu chọn mới, cảm ứng tô láng giềng của cơ đã chọn | pass | check-colors PASS (clay #d9d5ce ΔE≥26.1; selected #d01c8b ΔE≥41.5); check_viewer.py 8/8 (40/40 bấm); check_colors_hover.py 10/10 (14/14 hover đúng); run/harness/v2-*.png (xem bằng mắt)
V4 | ngân sách khi rê + chọn | note | ~605k tam giác khi vừa rê vừa chọn (lớp phủ), lúc nghỉ 597k
V3a–d | video YouTube xác minh oEmbed | partial | 222/299 có video (74,2%); 77 "pending" = CHƯA TÌM do hết hạn mức 200 lượt WebSearch/lượt trả lời (dùng chung mọi nút) — không phải không có video
V3c | 22 ID lấy từ trí nhớ subagent rồi xác minh oEmbed | pass có ghi chú | tiêu đề/kênh oEmbed khớp bài; được kiểm lại trong mẫu ngẫu nhiên bên dưới
V3m | gộp → videos.json; chuẩn hoá khoảng trắng; vá ghi chú dùng chung dead-bug | pass sau sửa (1/3) | tools/data/merge-videos.mjs; `node scripts/check-videos.mjs` PASS (lần 1 fail: dead-bug dùng chung không ghi chú)
V3 | trưởng nhóm kiểm lại ngẫu nhiên ≥10% (23/222, seed 20261014) qua oEmbed | pass | 23/23 tiêu đề + kênh khớp đúng; tiêu đề đều đúng bài/biến thể đã ghi
V5 | UI: song ngữ, thẻ tối giản, video facade, nguồn ẩn → nút chân trang, chú thích màu | pass | build OK; 7 script dữ liệu PASS; subagent run/tools/v5_verify.py 27/27; ảnh run/screenshots/v5-*.png (xem bằng mắt)

## Checklist hoàn tất v2 — QA độc lập trên bản build production (`python3 -I run/tools/qa.py`, run/qa-report.json)
check | yêu cầu | verdict | evidence
---|---|---|---
V-C1 | build, 0 lỗi console, kiểm tra cũ vẫn pass | pass | qa-report allPass: C1, C2 (40/40), C8, C8 mobile, C9, C10; check-data/rubric/model/manifest PASS. Lần 1: 4 lỗi ERR_TUNNEL_CONNECTION_FAILED = ảnh i.ytimg.com (đã xác định URL) do container chặn mạng → QA giả lập riêng 2 tên miền YouTube, mọi lỗi khác vẫn tính
V-C2 | cơ kề khác màu, ΔE00 bảng/đất sét/màu chọn | pass | check-colors PASS (144 cạnh, 6 màu, ΔE ≥ 21,7 / 26,1 / 41,5)
V-C3 | mặc định đất sét; rê X → X + láng giềng đúng màu, còn lại đất sét; rời → đất sét | pass | qa-report V2_graph_colouring: deltoid-lateral 8, vasti 7, erector-spinae 15, external-oblique 11 cơ sáng, 0 sai; kỳ vọng tính độc lập từ muscle-colors.json + palette.js
V-C4 | EN thuần, VI thuần, đổi trực tiếp, nhớ lựa chọn | pass | check-i18n PASS; qa-report V2_language: 0 ký tự Việt ở EN (4 cơ × 2 tab, mở bài), html lang đúng, đổi sang VI tức thì, giữ sau reload
V-C5 | video | partial | 222/299 xác minh oEmbed (74,2%), kiểm lại 23/23; iframe đúng youtube-nocookie.com/embed/<id>; bài chờ có nút tìm đúng từ khoá. Còn 77 bài pending (hết hạn mức tìm kiếm). Phát thật chưa kiểm được (mạng chặn)
V-C6 | thẻ tối giản; nguồn chỉ ở nút chân trang | pass | qa-report: không chip, không lý do mức, không link nguồn trong thẻ, có dòng an toàn; header không còn nút nguồn; hộp nguồn liệt kê đủ nguồn giải phẫu của cơ đang chọn + câu ghi công BodyParts3D nguyên văn
V7 | README, ATTRIBUTION (video, bản dịch), manifest | pass | check-manifest PASS
