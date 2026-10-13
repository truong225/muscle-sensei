# checks.md

node | requirement | verdict | evidence
---|---|---|---
N0 | khung dự án build được | pass | `npm run build` OK; run/baseline-bundle.txt (60.838 B gzip)
N0 | truy cập nguồn dữ liệu | unresolved | BodyParts3D dbarchive HTTP 000 (bị chặn) → hỏi người dùng (D3); free-exercise-db raw HTTP 200
N1 | muscles.json: 59 cơ khớp 1–1 dữ liệu BP3D, 47 chọn được, 17 nhóm, đủ trường, có nguồn | pass | kiểm tra ở cổng (node): 0 lỗi; kiểm tra ngẫu nhiên 2/17 URL (deltoid, gluteus-minimus) bằng WebFetch → khớp
N4 | rubric 1–5, 6 tiêu chí, quy đổi gym/calisthenics, tie-break, mẫu câu | pass | src/data/difficulty-rubric.md (111 dòng); nguồn reddit gốc bị chặn → xác minh qua bản sao + liftosaur (ghi trong file)
N6 | giấy phép ảnh free-exercise-db | pass → quyết định CHỈ CHỮ | run/image-license.md; wrkout CONTRIBUTING.md: "scrapped off the internet … I do not own the copy right"
N6 | phát hiện phụ: hướng dẫn trong free-exercise-db trùng nguyên văn bodybuilding.com | pass → ràng buộc N3 | chỉ dùng trường dữ kiện (tên, cơ, dụng cụ, level); bước thực hiện tự viết + nguồn kỹ thuật riêng
