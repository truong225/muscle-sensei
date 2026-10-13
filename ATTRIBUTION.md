# Ghi công và giấy phép

Tài liệu này liệt kê mọi nội dung của bên thứ ba dùng trong "Bản đồ cơ bắp 3D", giấy phép của từng phần, và phần nào do dự án tự viết.

## 1. Mô hình 3D: BodyParts3D

**Câu ghi công bắt buộc (giữ nguyên văn):**

> BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan

- **Giấy phép:** Creative Commons Attribution-ShareAlike 2.1 Japan (CC BY-SA 2.1 JP), https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en
- **Dữ liệu gốc:** BodyParts3D bản 3.0 (20110915), kho lưu trữ https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/ ; trang dự án http://lifesciencedb.jp/bp3d/
- **Nơi thực sự tải về:** bản sao GitHub https://github.com/Kevin-Mattheus-Moerman/BodyParts3D . Theo README của bản sao, dữ liệu được tải từ kho lưu trữ trên bằng `wget`, rồi người duy trì bản sao chuyển các tệp OBJ (`BodyParts3D_3.0_obj_95.zip`) sang STL nhị phân và giữ FMA ID làm tên tệp.
  - Lý do dùng bản sao: máy chủ gốc bị chặn từ môi trường dựng (HTTP 000).
  - Người dùng đã chấp nhận cách này ngày 2026-10-13 (quyết định D2 trong `run/graph.md`).
  - Giấy phép MIT trong kho bản sao chỉ áp dụng cho mã của họ, không áp dụng cho mô hình.
- **Trích dẫn (theo yêu cầu trong README của bản sao):**
  - Mitsuhashi N, Fujieda K, Tamura T, Kawamoto S, Takagi T, Okubo K. *BodyParts3D: 3D structure database for anatomical concepts.* Nucleic Acids Res. 2009;37(Database issue):D782-5. https://doi.org/10.1093/nar/gkn613
  - DOI kho dữ liệu: https://doi.org/10.18908/lsdba.nbdc00837-000
- **Dự án đã chỉnh sửa gì** (`public/models/muscles.glb` là bản phái sinh, dựng bằng `tools/model/build-model.mjs`):
  - chỉ lấy 674 tệp STL cần dùng;
  - gộp lưới theo đơn vị cơ tập luyện và theo bên trái/phải;
  - gộp cơ ngữ cảnh và xương thành hai node;
  - giảm lưới xuống khoảng 597 nghìn tam giác;
  - đổi hệ trục và đơn vị;
  - lượng tử hoá và nén meshopt thành một tệp GLB.
- **Giấy phép của bản phái sinh:** phát hành theo **cùng giấy phép CC BY-SA 2.1 JP**. Chi tiết trong [`public/models/LICENSE.txt`](public/models/LICENSE.txt). Câu ghi công cũng được nhúng trong `extras` của GLB và hiển thị nguyên văn trên trang "Nguồn & giấy phép" của site (QA C9: `exactSentence: true`).

## 2. Dữ liệu bài tập: free-exercise-db

- **Nguồn:** https://github.com/yuhonas/free-exercise-db, giấy phép **Unlicense**. Đây là bản đóng gói lại của https://github.com/wrkout/exercises.json, cũng dùng Unlicense.
- **Chỉ dùng các trường dữ kiện:** tên bài, nhóm cơ, dụng cụ, cấp độ (`level`).
  - Có 131/299 bài mang `fedbId` trỏ về bài tương ứng trong bộ này.
  - Nhóm cơ của free-exercise-db chỉ có 17 nhóm thô, nên việc gán cơ chi tiết là phán đoán của dự án và mỗi bài đều có nguồn riêng.
  - `level` chỉ dùng làm gợi ý cho thang độ khó (`src/data/difficulty-rubric.md`).
- **KHÔNG dùng ảnh.** Không sao chép, không hotlink, không hiển thị ảnh `exercises/<id>/*.jpg`. Lý do (chi tiết trong `run/decisions/images.md`, kiểm tra ngày 2026-10-12):
  - Tác giả gốc wrkout viết trong `CONTRIBUTING.md` (có từ commit đầu tiên `cb0394d`, 2020-08-22): *"Currently all exercises have two images, these have been scrapped off the internet, therefore l do not own the copy right for these images and would advise against using them in comercial projects."*
  - Nhãn Unlicense do người đóng gói lại đặt, không phải do tác giả ảnh. Người không giữ bản quyền thì không thể đưa ảnh vào public domain.
  - README của wrkout giới thiệu bộ dữ liệu trả phí "which can be used in commercial projects". Như vậy chính tác giả ngầm thừa nhận bộ miễn phí không dùng thương mại được.
- **KHÔNG dùng phần chữ hướng dẫn (`instructions`).** Phần này trùng nguyên văn với bodybuilding.com:
  - Bài "Air Bike" trùng cả 6 bước.
  - Bài "Alternate Incline Dumbbell Curl" trùng cả lỗi đánh máy "torso.This".
  - Điều khoản của bodybuilding.com cấm trích xuất và dùng lại nội dung khi chưa có văn bản đồng ý (bằng chứng E4, E5 trong `run/decisions/images.md`; `run/image-license.md`).
  - Vì vậy dự án không dịch cũng không diễn giải sát phần chữ này.

## 3. Nội dung tiếng Việt do dự án tự viết

Các phần sau được viết độc lập bằng tiếng Việt, đối chiếu với nguồn ghi ở từng mục:

- tên tiếng Việt;
- chức năng cơ;
- các bước thực hiện;
- lưu ý an toàn;
- căn cứ độ khó (`difficultyBasis`);
- lý do của các ngoại lệ.

Không phần nào được dịch từ văn bản hướng dẫn của free-exercise-db. Câu chữ đã sửa theo nguồn (ví dụ bản vá `src/data/draft/fix-E.json`) đều đi qua `tools/data/merge.mjs` nên tái lập được.

Kiểm tra ngẫu nhiên nguồn (`run/checks.md`, dòng N3/N5):

| Đợt kiểm tra | URL | Khớp (yes) | Khớp một phần (partial) | Không khớp (no) | Khác |
|---|---|---|---|---|---|
| `run/source-audit.json` | 40 | 33 | 6 | 0 | 1 bị chặn |
| `run/source-audit-2.json` | 44 | 31 | 5 | 0 | 8 chưa kiểm |

Thêm 6 bài do trưởng nhóm tự kiểm: 3 khớp, 3 khớp một phần, 0 không khớp.

## 4. Nguồn tham khảo

`src/data/sources.json` có **441 URL** thuộc **108 tên miền**.

- Đây đúng là hợp của mọi URL được dùng trong `exercises.json`, `muscles.json` và `exceptions.json`. Không có URL thừa, không thiếu URL nào.
- Mọi URL đều là `https`.
- Cách đếm: tên miền tính theo hostname, bỏ tiền tố `www.`. Tên miền con được đếm riêng, ví dụ `us.physitrack.com` và `physitrack.com` là hai tên miền.

| Dùng ở | URL | Tên miền |
|---|---|---|
| Bài tập (`exercises.json`) | 415 | 106 |
| Danh mục cơ (`muscles.json`) | 26 | 4 |
| Lý do ngoại lệ (`exceptions.json`) | 17 | 14 |

Các dòng có thể trùng nhau: một URL có thể được dùng ở nhiều nơi.

Phân loại theo loại nguồn. Đây là phân loại của dự án theo tên miền; danh sách tên miền của từng loại nằm ngay dưới bảng.

| Loại nguồn | URL | Tên miền | Ví dụ |
|---|---|---|---|
| Thư viện bài tập, huấn luyện viên, tổ chức huấn luyện | 298 | 41 | strengthlog.com (172 URL), akuaku.org / SARCO+ (44), nasm.org, acefitness.org, nsca.com |
| Giải phẫu, vật lý trị liệu, thông tin y tế | 84 | 28 | physio-pedia.com (21), teachmeanatomy.info (14), kenhub.com (12), các trang NHS |
| Bài báo khoa học, kho lưu trữ học thuật | 49 | 36 | pmc.ncbi.nlm.nih.gov, journals.sagepub.com, mdpi.com, frontiersin.org |
| Wiki cộng đồng (r/bodyweightfitness và bản mirror) | 9 | 2 | reddit.com, twt.omada.cafe |
| Bộ dữ liệu | 1 | 1 | github.com/yuhonas/free-exercise-db |
| **Tổng** | **441** | **108** | |

<details>
<summary>Tên miền theo từng loại</summary>

- **Thư viện bài tập, huấn luyện (41):** strengthlog.com, akuaku.org, fitnessvolt.com, caliverse.app, liftosaur.com, motra.com, nasm.org, breakingmuscle.com, dieringe.com, preview.dieringe.com, doctoryessis.com, tomsguide.com, acefitness.org, trainwell.net, antranik.org, catalystathletics.com, julielohre.com, loadmuscle.com, adamkempfitness.com, barbellmedicine.com, muscleandstrength.com, barbend.com, bibleofcalisthenics.substack.com, blog.dynamofitness.com.au, fit-pro.com, fitbod.me, gmb.io, learn.athleanx.com, muscleevo.net, nfpt.com, oliverfinlay.com, rowingstronger.substack.com, us.humankinetics.com, 12minuteathlete.com, apexfitness.com, artofmanliness.com, bodbot.com, garagegymreviews.com, masterclass.com, nsca.com, puregym.com.
- **Giải phẫu, vật lý trị liệu, y tế (28):** physio-pedia.com, teachmeanatomy.info, kenhub.com, e3rehab.com, physitrack.com, us.physitrack.com, au.physitrack.com, ca.physitrack.com, brookbushinstitute.com, theprehabguys.com, en.wikipedia.org, wikimsk.org, musculoskeletalkey.com, physicaltherapyfirst.com, physiorehab-com.treepl.co, world.physio, physiotutors.com, sportsinjuryclinic.net, stoneclinic.com, theclimbingdoctor.com, healthline.com, healthlinkbc.ca, racgp.org.au, ucalgary.ca, leicspart.nhs.uk, northcheshireandmersey.nhs.uk, royalberkshire.nhs.uk, uhcw.nhs.uk.
- **Bài báo khoa học, kho học thuật (36):** pmc.ncbi.nlm.nih.gov, ncbi.nlm.nih.gov, pubmed.ncbi.nlm.nih.gov, doaj.org, frontiersin.org, journals.sagepub.com, link.springer.com, jssm.org, mdpi.com, bjsm.bmj.com, journals.plos.org, peerj.com, jses.net, jhk.termedia.pl, ijspt.scholasticahq.com, koreascience.or.kr, ovid.com, qxmd.com, researchsquare.com, da.lib.kobe-u.ac.jp, digitalcommons.memphis.edu, iris.unipa.it, libra.unine.ch, nih.brage.unit.no, ojs.ub.uni-konstanz.de, profiles.wustl.edu, research-repository.rmit.edu.au, research.birmingham.ac.uk, research.vu.nl, scholars.csus.edu, utsouthwestern.elsevierpure.com, stmarys.ac.uk, sussex.ac.uk. Nhóm này còn gồm 3 tên miền lưu bản PDF của bài báo: lookgreatnaked.com, blogcontent.summit-education.com, ctsq.qc.ca.
- **Wiki cộng đồng (2):** reddit.com, twt.omada.cafe.
- **Bộ dữ liệu (1):** github.com.

</details>

Trang "Nguồn & giấy phép" trong site nhóm nguồn theo cùng quy tắc tên miền (`hostnameOf()` trong `src/lib/data.js`: hostname bỏ `www.`), nên cũng ra 108 trang.

## 5. Phông chữ và thư viện

Giấy phép đọc từ trường `license` trong `node_modules/<gói>/package.json` (phiên bản khoá trong `package.json`).

**Đi kèm bản build** (phân phối cho người xem):

| Gói | Phiên bản | Giấy phép |
|---|---|---|
| @fontsource/be-vietnam-pro (phông Be Vietnam Pro) | 5.2.5 | OFL-1.1 |
| @fontsource/noto-serif (phông Noto Serif) | 5.2.5 | OFL-1.1 |
| react | 19.2.0 | MIT |
| react-dom | 19.2.0 | MIT |
| scheduler (phụ thuộc của react-dom) | 0.27.0 | MIT |
| three (kể cả `meshopt_decoder` trong `three/examples`) | 0.186.1 | MIT |

**Chỉ dùng khi dựng** (không đi kèm bản build):

| Gói | Phiên bản | Giấy phép |
|---|---|---|
| vite | 6.4.2 | MIT |
| @vitejs/plugin-react | 5.0.4 | MIT |
| @gltf-transform/core, /extensions, /functions | 4.2.1 | MIT |
| meshoptimizer | 0.25.0 | MIT |

Bảng trên chỉ gồm các phụ thuộc trực tiếp (cộng `scheduler`). Phụ thuộc bắc cầu của công cụ dựng không được liệt kê.

## 6. Lưu ý sức khoẻ

Nội dung chỉ mang tính tham khảo, không thay thế hướng dẫn của huấn luyện viên hay bác sĩ. Dừng tập nếu thấy đau.

Độ khó là đánh giá tương đối cho người tập khỏe mạnh bình thường, không phải chỉ định cá nhân. Người có bệnh lý, chấn thương, đang mang thai hoặc mới bắt đầu nên hỏi ý kiến chuyên gia trước khi tập.

## Video hướng dẫn (v2)

Video được **nhúng** từ YouTube qua trình phát chính thức (youtube-nocookie.com), không tải về hay lưu lại. Bản quyền thuộc kênh đăng tải; mỗi video ghi tên kênh kèm liên kết ngay dưới khung phát và trong hộp "Nguồn". Danh sách: `src/data/videos.json` (222 video từ 133 kênh, kiểm tra oEmbed ngày 2026-10-14). Video là tài liệu tham khảo bên ngoài; cách thực hiện trong website là phần viết riêng có nguồn.

## Bản tiếng Anh (v2)

`src/data/i18n/*.json` là bản dịch của chính phần mô tả tiếng Việt (tự viết, có nguồn) — không dịch hay sao chép văn bản của nguồn bên ngoài.
