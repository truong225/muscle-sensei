# Cạnh sửa lỗi (lần 1/3) — Rà soát nguồn cho cơ chính của từng bài

## Vì sao có lần sửa này (bằng chứng)
Kiểm tra độc lập 40 URL ngẫu nhiên (`run/source-audit.json`): 33 đạt, **6 chỉ đạt một phần**, 1 bị chặn. Mẫu hình chung: nguồn mô tả đúng bài tập nhưng KHÔNG xác nhận cơ cụ thể được ghi là cơ chính (vd. cơ tròn lớn trong lat pulldown, đầu ức trong pec deck, cơ nâng vai trong side-lying neck raise, delta giữa trong push press), hoặc nguồn mô tả biến thể khác / không chứa bài. Tiêu chí C5: "mọi nhận định có nguồn" — nên phải rà toàn bộ, không chỉ 6 mục.

## Phạm vi: CHỈ sửa nút này
Dự án `/home/claude/co-bap-3d`. Đọc (không sửa): `src/data/exercises.json`, `src/data/sources.json` (sổ nguồn: url → title, publisher, checked, supports), `src/data/muscles.json`, `src/data/exceptions.json`, `run/source-audit.json`, `src/data/difficulty-rubric.md`, `run/specs/N3j-common.md` (schema bài mới), `run/specs/fix-partition.json` (danh sách bài của từng nút).

## Quy tắc kiểm cho MỖI bài trong phần của bạn
1. **Kỹ thuật:** có ≥1 nguồn mô tả cách thực hiện đúng bài đó (hoặc biến thể rất gần, nêu rõ).
2. **Cơ chính:** với MỖI id trong `primaryMuscles`, phải có ≥1 nguồn đã trích nêu cơ đó (với đơn vị tách phần như delta trước/giữa/sau, ngực trên/dưới, thang trên/giữa/dưới, vasti/rectus-femoris: nguồn phải nêu đúng phần đó; với đơn vị gộp như hip-adductors, rotator-cuff, forearm-flexors/extensors, hamstrings, erector-spinae, iliopsoas, rhomboids, splenius: nêu bất kỳ cơ thành viên nào là đủ) là cơ chính / cơ mục tiêu / cơ hoạt động mạnh (EMG cao) của bài.
   - Có thể dựa vào trường `supports` trong sổ nguồn NẾU nó nêu rõ điều đó; nếu không rõ, mở trang bằng WebFetch để xác minh.
   - Không đạt → hoặc thêm nguồn đáng tin xác nhận (mở thật, ghi vào sổ), hoặc **hạ cơ đó xuống cơ phụ** (`demote`).
3. **Nguồn sai/không liên quan** (trang không chứa bài, biến thể khác, trang lỗi) → `removeSources` và thay bằng nguồn đúng nếu cần để bài vẫn đạt (1).
4. Sau mọi thay đổi, mỗi đơn vị cơ vẫn phải đạt ≥3 bài Gym và ≥3 bài Calisthenics có nó là cơ chính, tính trên TOÀN BỘ dữ liệu (kể cả bài thuộc nút khác — giả định nút khác không hạ cơ đó). Nếu tụt dưới 3: thêm bài mới hợp lệ có nguồn (schema trong N3j-common.md) hoặc ghi ngoại lệ trung thực.

## Đầu ra: MỘT file patch `src/data/draft/fix-<X>.json` (X do prompt chỉ định)
```json
{
  "demote": { "<exerciseId>": ["<muscleId hạ xuống phụ>"] },
  "addSources": { "<exerciseId>": ["https://…"] },
  "removeSources": { "<exerciseId>": ["https://…"] },
  "sourcesRegistry": { "https://…": { "title": "…", "publisher": "…", "checked": "2026-10-12", "supports": "câu tiếng Việt cụ thể: nguồn chứng minh điều gì (nêu tên cơ nếu có)" } },
  "newExercises": [],
  "exceptions": {},
  "audit": { "<exerciseId>": "ok" | "sửa: <mô tả ngắn>" }
}
```
`audit` phải có đủ MỌI bài trong phần của bạn. Không bịa URL; mở thật mọi URL mới. Trang chặn bot thì chọn nguồn khác, không vượt chặn.

## Tự kiểm trước khi trả về
Script node trong `/tmp/claude-0/-home-claude/722044cc-0778-5f76-bacb-3212ac97b65c/scratchpad/` (không trong dự án): áp patch lên exercises.json trong bộ nhớ; kiểm tra audit đủ bài; không bài nào mất hết cơ chính; không bài nào mất hết nguồn; mọi URL thêm vào có trong sổ (cũ hoặc mới); số bài mỗi đơn vị cơ liên quan sau patch.
