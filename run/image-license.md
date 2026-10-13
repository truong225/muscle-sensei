# N6 — Giấy phép ảnh free-exercise-db

## Câu hỏi
Một website công khai có được dùng lại ảnh bài tập của free-exercise-db (https://github.com/yuhonas/free-exercise-db, ảnh tại `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<id>/0.jpg`) không? Cần xác định NGUỒN GỐC và GIẤY PHÉP của riêng ẢNH, không chỉ của JSON.

Quy tắc quyết định: chỉ được dùng ảnh khi có bằng chứng rõ ràng rằng TÁC GIẢ ảnh đã phát hành ảnh theo một giấy phép cho phép dùng lại (public domain/CC0/CC BY…) và biết rõ cần ghi công cho ai. Nhãn "Unlicense" cấp repo do người đóng gói lại đặt vào thì KHÔNG đủ.

## Bằng chứng (kiểm tra ngày 2026-10-11)

1. **free-exercise-db chỉ đóng gói lại dữ liệu của wrkout/exercises.json.**
   https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/README.md
   > "I stumbled upon [exercises.json](https://github.com/wrkout/exercises.json) which was amazing though the data wasn't structured the way I wanted it ... so I restructured the data and built a simple frontend to it"

   README không nói ai chụp/tạo ảnh. Phần TODO chỉ ghi: "There are also a small number of duplicate images".

2. **free-exercise-db gắn Unlicense ở cấp repo (mẫu chữ dành cho "software").**
   https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/LICENSE.md
   > "This is free and unencumbered software released into the public domain. ... the author or authors of this software dedicate any and all copyright interest in the software to the public domain."

   Người đóng gói lại chỉ có thể từ bỏ quyền mà chính họ sở hữu. Không có câu nào nói ảnh do họ tạo ra. (Không có file `UNLICENSE` hay `LICENSE`: cả hai trả về HTTP 404.)

3. **Nguồn upstream (wrkout) nói thẳng là ảnh được cào từ internet và họ KHÔNG giữ bản quyền ảnh. Đây là bằng chứng quyết định.**
   https://raw.githubusercontent.com/wrkout/exercises.json/master/CONTRIBUTING.md
   > "#### Exercise Images
   > **NB:** Any help in creating digital copyright free images for each exercise would be extremely helpful.
   > Currently all exercises have two images, these have been scrapped off the internet, therefore l do not own the copy right for these images and would advise against using them in comercial projects."

   Ảnh của free-exercise-db chính là bộ ảnh này: mỗi bài có 2 ảnh `0.jpg`/`1.jpg`, giống cấu trúc upstream. Ví dụ `https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Alternate_Incline_Dumbbell_Curl/images/0.jpg` trả về HTTP 200.

4. **wrkout cũng dùng Unlicense ở cấp repo, nhưng điều đó mâu thuẫn với lời tự nhận ở trên.**
   https://raw.githubusercontent.com/wrkout/exercises.json/master/LICENSE.md (cùng văn bản Unlicense "free and unencumbered software").
   README của wrkout còn hướng người dùng thương mại sang sản phẩm trả phí:
   https://raw.githubusercontent.com/wrkout/exercises.json/master/README.md
   > "If you are looking for a complete dataset with over 2,500+ exercises, 10,000+ images ... which can be used in commerical projects: https://wrkout.xyz/"

   Như vậy chính upstream ngầm thừa nhận bộ ảnh miễn phí KHÔNG dùng được cho mục đích thương mại.

5. **Nguồn gốc khả dĩ nhất là Bodybuilding.com (một bên thương mại, không phải tác giả tự tạo).**
   Hướng dẫn trong dataset trùng nguyên văn với trang Bodybuilding.com, kể cả lỗi đánh máy thiếu dấu cách "torso.This":
   - Dataset: https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/Alternate_Incline_Dumbbell_Curl/exercise.json
     > "Sit down on an incline bench with a dumbbell in each hand being held at arms length. Tip: Keep the elbows close to the torso.This will be your starting position."
   - Bodybuilding.com: https://bodybuilding.com/exercises/alternate-incline-dumbbell-curl
     > "Sit down on an incline bench with a dumbbell in each hand being held at arms length." / "Tip: Keep the elbows close to the torso.This will be your starting position."

   Trang này hiện dùng ảnh mới hơn (`/images/2020/xdb/...`). Kiểu ảnh 2 khung (tư thế bắt đầu/kết thúc) cùng ID dạng `Alternate_Incline_Dumbbell_Curl` khớp với cơ sở dữ liệu bài tập cũ của Bodybuilding.com. Kết luận "ảnh gốc từ Bodybuilding.com" là suy luận có cơ sở mạnh nhưng chưa được xác nhận trực tiếp. Dù vậy, câu "scrapped off the internet" ở mục 3 đã đủ để loại trừ việc ảnh do chính tác giả repo tạo ra.

6. **Không tìm thấy bằng chứng nào cho thấy tác giả ảnh đã cấp phép.**
   Không thấy tuyên bố CC0/CC BY hay public domain nào từ người chụp ảnh hoặc từ Bodybuilding.com. Hạn chế: không truy cập được trang issues trên GitHub (bị robots/403 chặn), cũng không đọc được trang điều khoản của bodybuilding.com. Tuy nhiên điều đó không thay đổi kết luận, vì lời tự nhận của upstream đã mang tính quyết định.

## Kết luận: **CHỈ CHỮ**

Ảnh trong free-exercise-db KHÔNG đáp ứng quy tắc quyết định:
- Upstream đã tự nhận "scrapped off the internet ... I do not own the copy right for these images".
- Nhãn Unlicense ở cả hai repo do người đóng gói lại đặt, không phải do tác giả ảnh, nên không có hiệu lực với ảnh.
- Không xác định được tác giả hay giấy phép gốc của ảnh, nên không thể ghi công hợp lệ.

→ Website công khai **không được dùng, hotlink hay sao chép ảnh** (`.../exercises/<id>/*.jpg`). Chỉ dùng chữ/metadata.

**Lưu ý thêm về phần chữ (ngoài phạm vi N6, chỉ để tham khảo):** phần `instructions` cũng có vẻ chép nguyên văn từ Bodybuilding.com (mục 5). Vì vậy an toàn nhất là chỉ dùng các trường dữ kiện như tên, nhóm cơ, dụng cụ, cấp độ, rồi tự viết lại hướng dẫn, thay vì chép nguyên văn `instructions`.

Không cần ghi công cho ảnh vì không dùng ảnh. Không có ảnh nào được tải hay sao chép vào dự án.
