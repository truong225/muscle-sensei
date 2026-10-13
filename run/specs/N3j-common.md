# N3j — Spec chung cho các nút phán đoán bài tập

Dự án: `/home/claude/co-bap-3d` — website tiếng Việt "Bản đồ cơ bắp 3D". Bấm một cơ trên mô hình 3D → danh sách bài Gym và Calisthenics có cơ đó trong `primaryMuscles`, xếp dễ → khó.

## Đầu vào (chỉ đọc)
- `src/data/muscles.json` — danh mục cơ MỚI (40 đơn vị). Chỉ dùng các `id` trong file này.
- `src/data/draft/remapped.json` — 279 bài từ lần chạy trước, đã đổi cơ chắc chắn sang id mới. Một số bài vẫn còn id CŨ mơ hồ: `deltoid`, `pectoralis-major`, `trapezius`, `quadriceps`.
- `src/data/draft/remap-report.json` — danh sách (bài, id mơ hồ) cần phán đoán.
- `src/data/draft/sources-prior.json` — sổ nguồn cũ (url → title, publisher, checked, supports).
- `src/data/difficulty-rubric.md` — thang độ khó 1–5 (nhãn: 1 Nhập môn, 2 Cơ bản, 3 Trung cấp, 4 Nâng cao, 5 Chuyên sâu).
- `run/decisions/images.md` — quyết định CHỈ CHỮ (không ảnh).
- `tools/data/cache/free-exercise-db/dist/exercises.json` — dữ kiện bài (tên, cơ thô, dụng cụ, level). KHÔNG dịch sát phần `instructions` (trùng văn bản có bản quyền của bodybuilding.com); bước thực hiện phải tự viết.

## Đầu ra: MỘT file patch của riêng nút (đường dẫn ghi trong prompt của nút)
```json
{
  "replace": { "<exerciseId>": { "<idCũ>": { "primary": ["<idMới>"], "secondary": ["<idMới>"] } } },
  "addSources": { "<exerciseId>": [ { "url": "https://…", "checked": "2026-10-12" } ] },
  "newExercises": [ { …bài đầy đủ theo schema dưới… } ],
  "sourcesRegistry": { "https://…": { "title": "…", "publisher": "…", "checked": "2026-10-12", "supports": "câu tiếng Việt: nguồn này chứng minh điều gì" } },
  "exceptions": { "<muscleId>": { "gym|calisthenics": { "reason": "tiếng Việt", "sources": ["https://…"] } } }
}
```
- `replace`: với MỖI cặp (bài, id cũ) thuộc phần của nút, cho biết id cũ thay bằng những id mới nào. Nếu id cũ nằm trong primary của bài thì đặt các đơn vị chịu tác động CHÍNH vào `primary`, đơn vị phụ vào `secondary`. Không được để bài rơi vào trạng thái không còn cơ chính.
- Mỗi lựa chọn bó/phần cơ (vd. "lateral raise → delta giữa", "face pull → delta sau + thang giữa/dưới", "back squat → vasti; rectus-femoris phụ") phải có ít nhất 1 nguồn đáng tin hỗ trợ việc cơ đó được kích hoạt (EMG/nghiên cứu, ExRx.net, ACE, NSCA, StatPearls, sách/trang huấn luyện uy tín). Một nguồn tổng quát dùng được cho nhiều bài nếu thật sự bao trùm. Thêm nguồn vào `addSources` của bài và vào `sourcesRegistry`.
- `newExercises`: bài mới để mỗi đơn vị cơ của nút đạt ≥ 3 bài Gym VÀ ≥ 3 bài Calisthenics có đơn vị đó trong `primaryMuscles` (đếm cả bài cũ sau khi thay và bài mới). Không trùng bài đã có (so `id` và `nameEn`, kể cả biến thể gần như giống hệt).
- `exceptions`: chỉ khi thật sự không có đủ bài hợp lệ có nguồn (ví dụ cơ ngực bé: không bài gym nào lấy nó làm cơ chính). Không bịa bài để đủ số.

## Schema bài mới
```json
{ "id": "kebab-case-duy-nhat", "nameVi": "Tên Việt (tên Anh)", "nameEn": "…", "type": "gym|calisthenics",
  "equipment": ["tiếng Việt"], "primaryMuscles": ["id"], "secondaryMuscles": ["id"],
  "difficulty": 1-5, "order": 0, "difficultyBasis": "Mức N – Nhãn: lý do theo rubric (+ level free-exercise-db nếu có)",
  "steps": ["3–6 bước, tự viết, ngắn gọn"], "safety": ["1–3 lưu ý"],
  "progressionOf": "id bài đứng trước (tuỳ chọn, calisthenics)", "fedbId": "id free-exercise-db (tuỳ chọn)",
  "sources": [ { "url": "https://…", "checked": "2026-10-12" } ] }
```
- Gym = tạ đòn, tạ đơn, tạ ấm, thanh EZ, cáp, máy. Calisthenics = trọng lượng cơ thể, xà đơn, xà kép, vòng (dây kháng lực KHÔNG tính là calisthenics).
- Mỗi bài mới có ≥ 1 nguồn cho cách thực hiện VÀ cơ tác động (có thể cùng 1 URL nếu trang nói cả hai).

## Nguồn
Mở thật mọi URL mới bằng WebFetch trước khi ghi. Không bịa URL. Nếu trang chặn bot, chọn nguồn khác. Ngày kiểm tra: 2026-10-12.

## Tự kiểm tra trước khi trả về
Viết script node trong `/tmp/claude-0/-home-claude/722044cc-0778-5f76-bacb-3212ac97b65c/scratchpad/` (KHÔNG trong dự án), áp patch của mình lên `remapped.json` trong bộ nhớ rồi kiểm tra: JSON hợp lệ; mọi cặp (bài, id cũ) thuộc phần của nút đều có trong `replace`; mọi id mới tồn tại trong muscles.json; không bài nào thiếu cơ chính; mọi đơn vị của nút đạt ≥3/≥3 hoặc có exception; bài mới đủ trường, không trùng; mọi URL dùng đều có trong sourcesRegistry hoặc sources-prior.json.

## Không được
Sửa bất kỳ file nào khác ngoài file patch của nút.
