// Mọi chuỗi giao diện, theo từng ngôn ngữ. Giao diện hoặc thuần tiếng Việt, hoặc thuần tiếng Anh.
// Dữ liệu (tên cơ, bài, bước, an toàn, ngoại lệ, nhãn mức) lấy từ dữ liệu theo ngôn ngữ trong src/lib/data.js.

export const LANGS = ["vi", "en"];

// Tên ngôn ngữ luôn viết bằng chính ngôn ngữ đó (quy ước cho nút chọn ngôn ngữ).
export const LANG_NAMES = { vi: "Tiếng Việt", en: "English" };

const vi = {
  docTitle: "Bản đồ cơ bắp 3D",
  metaDesc: "Chọn một cơ trên mô hình 3D để xem các bài tập Gym và Calisthenics, xếp từ dễ đến khó, kèm video hướng dẫn.",
  brand: "Bản đồ cơ bắp",
  skip: "Bỏ qua mô hình, tới danh sách",
  nav: "Điều hướng",
  pickMuscle: "Chọn cơ",
  langGroup: "Ngôn ngữ",

  // trình xem
  viewer: "Mô hình 3D",
  canvasLabel: "Mô hình 3D cơ thể người. Bấm vào một cơ để chọn.",
  loading: "Đang tải mô hình 3D…",
  loadingSize: "Khoảng 5 MB, lần đầu có thể mất vài giây.",
  noWebglTitle: "Trình duyệt không hiển thị được mô hình 3D",
  errorTitle: "Không tải được mô hình 3D",
  noWebglMsg: "Thiết bị hoặc trình duyệt này chưa bật WebGL 2.",
  errorMsg: "Có lỗi khi tải tệp mô hình.",
  stillPick: "Bạn vẫn có thể chọn cơ trong danh sách bên cạnh để xem bài tập.",
  viewGroup: "Hướng nhìn",
  front: "Mặt trước",
  back: "Mặt sau",
  legend: "Chú giải màu",
  legendSelectable: "Chọn được",
  legendSelected: "Đang chọn",
  legendHover: "Rê chuột lên cơ để thấy các cơ kề nhau được tô màu khác nhau",
  legendTouch: "Chạm chọn một cơ: các cơ kề nó được tô màu khác nhau",
  camera: "Điều khiển camera",
  zoomIn: "Phóng to",
  zoomOut: "Thu nhỏ",
  resetView: "Đặt lại góc nhìn",
  hintMouse: "Kéo để xoay · cuộn để phóng to · bấm lần nữa cùng chỗ để chọn cơ nằm sâu hơn",
  hintTouch: "Kéo để xoay · chụm hai ngón để phóng to · chạm lần nữa cùng chỗ để chọn cơ nằm sâu hơn",

  // bảng
  panel: "Thông tin cơ và bài tập",
  allMuscles: "← Tất cả cơ",
  functionH: "Chức năng",
  tabsLabel: "Loại bài tập",
  tabs: { gym: "Gym", calisthenics: "Calisthenics" },
  listCaption: (n, tab) => `${n} bài ${tab} lấy cơ này làm cơ chính, xếp từ dễ đến khó.`,
  listEmpty: (tab) => `Chưa có bài ${tab} nào lấy cơ này làm cơ chính.`,
  excLabel: "Ghi chú về số lượng bài",
  excNone: "Vì sao không có bài nào ở đây",
  excFew: "Vì sao chỉ có ít bài ở đây",

  // thẻ bài
  level: (n, label) => `Mức ${n} · ${label}`,
  levelAria: (n, label) => `Độ khó mức ${n} trên 5 · ${label}`,
  stepsH: "Cách thực hiện",
  safety: "An toàn",
  playVideo: (title) => `Phát video: ${title}`,
  videoBy: "Video:",
  searchYoutube: "Tìm video trên YouTube",
  newTab: "(mở trong thẻ mới)",

  // trạng thái trống
  eyebrow: "Atlas tập luyện",
  emptyTitle: "Chọn một cơ để xem bài tập dành cho nó",
  emptyLede: (muscles, exercises) =>
    `${muscles} cơ và nhóm cơ, ${exercises} bài Gym và Calisthenics. Mỗi danh sách xếp từ dễ đến khó, kèm các bước thực hiện, video hướng dẫn và lưu ý an toàn.`,
  how1b: "Bấm vào một cơ",
  how1: (webglOk) => ` trên mô hình${webglOk ? "" : " (nếu thiết bị hiển thị được 3D)"}, hoặc tìm trong danh sách bên dưới.`,
  how2b: "Bấm lần nữa cùng chỗ",
  how2: " để chọn cơ nằm sâu hơn ở lớp dưới.",
  how3b: "Mở một bài",
  how3: " để xem độ khó, từng bước, video và lưu ý an toàn.",

  // bộ chọn cơ
  searchLabel: "Tìm cơ",
  searchPlaceholder: "Ví dụ: lưng xô, nhi dau, biceps…",
  searchHelp: "Gõ có dấu hoặc không dấu, tên Latin hay tiếng Anh. Nhấn ↓ để vào danh sách, Enter để chọn.",
  matches: (n) => `${n} cơ phù hợp`,
  noMatch: (q) => `Không tìm thấy cơ nào khớp “${q}”.`,
  muscleList: "Danh sách cơ",
  exCount: (n) => `${n} bài`,

  // hộp thoại, chân trang
  close: "Đóng",
  healthNote: "Lưu ý sức khoẻ.",
  disclaimer:
    "Nội dung chỉ mang tính tham khảo, không thay thế hướng dẫn của huấn luyện viên hay bác sĩ. Dừng tập nếu thấy đau.",
  modelCredit: "Mô hình: BodyParts3D © DBCLS, CC BY-SA 2.1 JP (đã chỉnh sửa)",
  sourcesBtn: "Nguồn",
  sourcesTitle: "Nguồn & giấy phép",

  // nguồn cho nội dung đang xem
  onScreenH: "Nguồn cho nội dung đang xem",
  onScreenNone: "Chưa chọn cơ nào. Chọn một cơ để xem nguồn của phần giải phẫu và của từng bài tập.",
  anatomyH: "Giải phẫu",
  exceptionH: "Ghi chú về số lượng bài",
  exercisesH: (tab) => `Bài ${tab}`,
  checked: (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return "kiểm tra ngày " + (m ? `${m[3]}/${m[2]}/${m[1]}` : iso);
  },
  videoCredit: "Video",
  videoNone: "Chưa có video đã xác minh",
  generalH: "Ghi công chung",

  // trang nguồn chung
  src: {
    modelH: "Mô hình 3D",
    exH: "Dữ liệu bài tập",
    videoH: "Video",
    rubricH: "Thang độ khó",
    rubricIntro:
      "Mỗi bài được chấm theo kỹ thuật, độ ổn định, sức mạnh tối thiểu và rủi ro khi sai kỹ thuật. Danh sách luôn xếp từ dễ đến khó.",
    example: "Ví dụ:",
    statsH: "Số liệu",
    statMuscles: "Cơ chọn được",
    statGroups: (n) => `trong ${n} nhóm`,
    statGym: "Bài Gym",
    statCali: "Bài Calisthenics",
    statSources: "Nguồn tham khảo",
    statHosts: (n) => `từ ${n} trang`,
    allH: "Toàn bộ nguồn",
    allHint: "Nhóm theo trang web; bấm để mở danh sách.",
  },
};

const en = {
  docTitle: "3D Muscle Map",
  metaDesc: "Pick a muscle on a 3D model to see Gym and Calisthenics exercises for it, sorted from easy to hard, with video demos.",
  brand: "Muscle Map",
  skip: "Skip the model, go to the list",
  nav: "Navigation",
  pickMuscle: "Find a muscle",
  langGroup: "Language",

  viewer: "3D model",
  canvasLabel: "3D model of the human body. Click a muscle to select it.",
  loading: "Loading the 3D model…",
  loadingSize: "About 5 MB; the first load can take a few seconds.",
  noWebglTitle: "This browser cannot show the 3D model",
  errorTitle: "The 3D model could not be loaded",
  noWebglMsg: "WebGL 2 is not available on this device or browser.",
  errorMsg: "Something went wrong while loading the model file.",
  stillPick: "You can still pick a muscle from the list to see its exercises.",
  viewGroup: "View",
  front: "Front",
  back: "Back",
  legend: "Colour key",
  legendSelectable: "Selectable",
  legendSelected: "Selected",
  legendHover: "Hover a muscle: neighbouring muscles get different colours",
  legendTouch: "Tap a muscle: its neighbours get different colours",
  camera: "Camera controls",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  resetView: "Reset view",
  hintMouse: "Drag to rotate · scroll to zoom · click the same spot again to pick a deeper muscle",
  hintTouch: "Drag to rotate · pinch to zoom · tap the same spot again to pick a deeper muscle",

  panel: "Muscle and exercises",
  allMuscles: "← All muscles",
  functionH: "Function",
  tabsLabel: "Exercise type",
  tabs: { gym: "Gym", calisthenics: "Calisthenics" },
  listCaption: (n, tab) =>
    `${n} ${tab} ${n === 1 ? "exercise targets" : "exercises target"} this muscle as a primary mover, sorted from easy to hard.`,
  listEmpty: (tab) => `No ${tab} exercise targets this muscle as a primary mover yet.`,
  excLabel: "Note on the number of exercises",
  excNone: "Why there are no exercises here",
  excFew: "Why there are only a few exercises here",

  level: (n, label) => `Level ${n} · ${label}`,
  levelAria: (n, label) => `Difficulty level ${n} of 5 · ${label}`,
  stepsH: "How to do it",
  safety: "Safety",
  playVideo: (title) => `Play video: ${title}`,
  videoBy: "Video by",
  searchYoutube: "Search YouTube for a video",
  newTab: "(opens in a new tab)",

  eyebrow: "Training atlas",
  emptyTitle: "Pick a muscle to see the exercises for it",
  emptyLede: (muscles, exercises) =>
    `${muscles} muscles and muscle groups, ${exercises} Gym and Calisthenics exercises. Every list is sorted from easy to hard, with step-by-step instructions, a video demo and safety notes.`,
  how1b: "Click a muscle",
  how1: (webglOk) => ` on the model${webglOk ? "" : " (if your device can show 3D)"}, or search the list below.`,
  how2b: "Click the same spot again",
  how2: " to pick a deeper muscle underneath.",
  how3b: "Open an exercise",
  how3: " to see its level, steps, video and safety notes.",

  searchLabel: "Search muscles",
  searchPlaceholder: "e.g. lats, biceps, gluteus…",
  searchHelp: "Type an English or Latin name. Press ↓ to move into the list, Enter to choose.",
  matches: (n) => `${n} ${n === 1 ? "muscle matches" : "muscles match"}`,
  noMatch: (q) => `No muscle matches “${q}”.`,
  muscleList: "Muscle list",
  exCount: (n) => `${n} ${n === 1 ? "exercise" : "exercises"}`,

  close: "Close",
  healthNote: "Health note.",
  disclaimer: "For general information only; not a substitute for advice from a coach or doctor. Stop if you feel pain.",
  modelCredit: "Model: BodyParts3D © DBCLS, CC BY-SA 2.1 JP (modified)",
  sourcesBtn: "Sources",
  sourcesTitle: "Sources & licences",

  onScreenH: "Sources for what is on screen",
  onScreenNone: "No muscle selected. Pick a muscle to see the sources for its anatomy and for each exercise.",
  anatomyH: "Anatomy",
  exceptionH: "Note on the number of exercises",
  exercisesH: (tab) => `${tab} exercises`,
  checked: (iso) => "checked " + iso,
  videoCredit: "Video",
  videoNone: "No verified video yet",
  generalH: "General attribution",

  src: {
    modelH: "3D model",
    exH: "Exercise data",
    videoH: "Videos",
    rubricH: "Difficulty scale",
    rubricIntro:
      "Each exercise is rated on technique, stability, minimum strength and the risk of poor form. Lists are always sorted from easy to hard.",
    example: "Examples:",
    statsH: "Numbers",
    statMuscles: "Selectable muscles",
    statGroups: (n) => `in ${n} groups`,
    statGym: "Gym exercises",
    statCali: "Calisthenics exercises",
    statSources: "References",
    statHosts: (n) => `from ${n} websites`,
    allH: "All sources",
    allHint: "Grouped by website; click to expand.",
  },
};

// Mô tả thang độ khó bằng tiếng Anh (bản tiếng Việt đọc từ src/data/difficulty-rubric.md).
export const RUBRIC_EN = {
  1: {
    desc: "A single joint or a machine with a fixed path; the load can be set very low; beginners get it right straight away",
    example: "Machine leg extension; wall push-up",
  },
  2: {
    desc: "Simple free weights or foundational bodyweight moves; you need to keep the trunk stable",
    example: "Dumbbell curl; knee push-up; glute bridge",
  },
  3: {
    desc: "Multi-joint free-weight lifts that need technique practice, or bodyweight moves that need substantial relative strength",
    example: "Back squat; Romanian deadlift; pull-up; dip",
  },
  4: {
    desc: "High load, complex technique or one-sided work; needs a solid strength base",
    example: "Front squat; pistol squat; archer pull-up",
  },
  5: {
    desc: "Skills or maximal loads that take months or years of training",
    example: "Front lever; planche; one-arm pull-up; snatch",
  },
};

export const STRINGS = { vi, en };
