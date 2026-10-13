# Quyết định: ảnh minh hoạ bài tập (node N6 – image-license)

Ngày kiểm tra: 2026-10-12

## QUYẾT ĐỊNH: **CHỈ CHỮ**

Không dùng ảnh `exercises/<id>/0.jpg, 1.jpg` của free-exercise-db (và của wrkout/exercises.json).
Có **bằng chứng ngược chiều**: chính tác giả gốc tuyên bố ảnh được cào từ internet, ông không giữ bản quyền và khuyên không dùng cho dự án thương mại.
Dòng Unlicense ở cấp repo **không** áp dụng được cho ảnh, vì người phát hành không phải chủ bản quyền nên không có quyền đưa ảnh vào public domain.

Lưu ý thêm: phần **chữ** (`instructions`) của dataset cũng trùng nguyên văn với bodybuilding.com (xem E4).
Node này chỉ xét ảnh, nhưng nếu dự án định dùng lại nguyên văn hướng dẫn tiếng Anh hoặc bản dịch sát của chúng thì cũng có rủi ro tương tự.
Nên tự viết mô tả tiếng Việt thay vì dịch nguyên văn. Việc này cần một node khác xác nhận.

## Bằng chứng

| # | Nguồn (đã mở) | Nội dung cho thấy |
|---|---|---|
| E1 | Bản clone local `tools/data/cache/free-exercise-db/README.md`, `LICENSE.md`; `git log` | LICENSE là Unlicense. README tự gọi là "Open Public Domain Exercise Dataset" và nói dữ liệu cùng ảnh lấy từ wrkout/exercises.json rồi "restructured". README không nói ai chụp ảnh. Bản clone là shallow, chỉ có 1 commit (`f00c92c`, 2026-09-27), nên không có lịch sử nguồn gốc. Không có CONTRIBUTING hay ghi chú nào về ảnh. Ảnh JPEG không có EXIF hay credit; phần lớn có kích thước 850×567. |
| E2 | https://github.com/wrkout/exercises.json/blob/master/CONTRIBUTING.md (đã mở bằng WebFetch; đối chiếu với bản clone blobless của repo, file `CONTRIBUTING.md` tại HEAD và tại commit đầu `cb0394d` ngày 2020-08-22) | **Bằng chứng quyết định.** Mục "Exercise Images": *"Currently all exercises have two images, these have been scrapped off the internet, therefore l do not own the copy right for these images and would advise against using them in comercial projects."* Câu này có ngay từ commit đầu tiên và vẫn còn ở HEAD. |
| E3 | https://github.com/wrkout/exercises.json (README + LICENSE.md, đọc qua WebFetch và bản clone) | Repo cũng dùng Unlicense, tự gọi là "Open Public Domain". README hiện tại (commit `5994bea`, 2025-02-16) quảng cáo bộ dữ liệu trả phí wrkout.xyz "which can be used in commercial projects". Như vậy chính tác giả ngầm thừa nhận bộ miễn phí không dùng thương mại được. README không nói nguồn ảnh. |
| E4 | https://bodybuilding.com/exercises/air-bike | Hướng dẫn bài "Air Bike" trên bodybuilding.com trùng **nguyên văn** cả 6 bước với `exercises/Air_Bike.json` trong dataset ("Lie flat on the floor with your lower back pressed to the ground…"). Trang có 2 ảnh, đúng số lượng 2 ảnh/bài của dataset. Đây là dấu hiệu mạnh rằng nguồn bị cào là cơ sở dữ liệu bài tập của bodybuilding.com. Tôi **không** so sánh từng pixel để chứng minh ảnh trùng (WebFetch không xem được nội dung ảnh). |
| E5 | https://support.bodybuilding.com/en-US/eu-conditions-of-use-525530 | Điều khoản của BBcom: nội dung (text, graphics, images) là tài sản của BBcom hoặc bên cấp phép. Cấm "extract and/or re-utilise parts of the content" khi chưa có văn bản đồng ý. Cấm dựng cơ sở dữ liệu từ phần đáng kể của dịch vụ. Chỉ cho dùng cá nhân, phi thương mại. |
| E6 | https://github.com/wrkout/exercises.json/issues/5 | Đây là issue truyền cảm hứng cho free-exercise-db. Issue không có thông tin nào về nguồn hay giấy phép của ảnh, nên không làm thay đổi kết luận. |

Các tìm kiếm không cho kết quả: tìm "free-exercise-db images copyright bodybuilding.com" trên web không thấy thảo luận liên quan.
Không liệt kê được issue của hai repo: trang `/issues` bị robots chặn, và GitHub API không được bật cho session này.
Vì vậy tôi chưa xem hết các issue kiểu "image copyright". Tuy vậy, E2 đã đủ để kết luận.

## Câu hỏi chưa giải quyết

1. Toàn bộ ảnh có lấy từ bodybuilding.com không, hay một phần từ nơi khác? Chưa so pixel; E4 chỉ là trùng văn bản cộng trùng số lượng ảnh. Câu hỏi này không ảnh hưởng quyết định, vì E2 đã loại ảnh bất kể nguồn cụ thể là gì.
2. Có issue hoặc PR nào trên yuhonas/free-exercise-db nói về bản quyền ảnh không? Chưa liệt kê được do bị chặn truy cập. Nếu có, nhiều khả năng chỉ xác nhận lại E2.
3. Phần chữ hướng dẫn cũng có vẻ chép từ bodybuilding.com (E4). Cần quyết định riêng về việc dùng hay dịch nội dung chữ.

## Phương án thay thế (chưa tải gì)

- **wger** (https://github.com/wger-project/wger, https://wger.readthedocs.io/):
  - README ghi "Exercise/Ingredient Data: Creative Commons (see individual entries)"; tài liệu ghi dữ liệu ban đầu dùng CC-BY-SA 3.0.
  - Theo issue https://github.com/wger-project/wger/issues/2196, maintainer thừa nhận nhiều ảnh do cộng đồng gửi "probably don't meet" chuẩn CC-BY-SA, cần rà bằng reverse image search, và nhiều bài còn thiếu ảnh.
  - Không mở được API `wger.de/api/v2/exerciseimage` (robots và proxy đều chặn), nên chưa xác minh được trường giấy phép theo từng ảnh hay số lượng ảnh.
  - **Đánh giá:** chỉ khả thi một phần cho khoảng 200 bài. Phải lọc từng ảnh có tác giả và giấy phép rõ, vẫn mang rủi ro ảnh do cộng đồng tải lên, và CC-BY-SA buộc ghi công cùng share-alike. Phạm vi phủ có lẽ thấp.
- **Wikimedia Commons**: có giấy phép theo từng file, rõ ràng. Tuy nhiên tôi không mở được trang hay API của Commons từ môi trường này (bị chặn). Theo hiểu biết chung, Commons không có một bộ minh hoạ nhất quán cho khoảng 200 bài gym, nên phong cách sẽ lộn xộn và phải tra giấy phép thủ công từng file. **Không thực tế** để làm nguồn chính; chỉ dùng được cho vài bài lẻ.
- **Tự vẽ hoặc tự dựng** (ví dụ dùng chính mô hình 3D cơ bắp của dự án để tô vùng cơ chính và phụ): không có rủi ro bản quyền và đồng bộ phong cách. Đây là cách phù hợp nhất với một site "cơ bắp 3D".

## Khuyến nghị

1. Áp dụng **CHỈ CHỮ** cho bản phát hành: không copy, hotlink (kể cả `raw.githubusercontent.com/yuhonas/...`) hay hiển thị ảnh của free-exercise-db hoặc wrkout.
2. Nếu pipeline đã lỡ chép ảnh vào thư mục build hoặc public thì loại ra. Bản cache dùng cho nghiên cứu nội bộ có thể giữ, nhưng không được phát hành.
3. Có thể dùng metadata dạng sự kiện (tên bài, nhóm cơ chính/phụ, dụng cụ, cấp độ) làm tham chiếu. Mô tả cách tập nên **tự viết bằng tiếng Việt**, không dịch nguyên văn.
4. Thay ảnh bằng hình tô vùng cơ trên mô hình 3D của chính dự án. Nếu sau này cần ảnh tư thế, cân nhắc lọc wger theo từng ảnh có giấy phép CC và ghi công đầy đủ, hoặc tự sản xuất.
