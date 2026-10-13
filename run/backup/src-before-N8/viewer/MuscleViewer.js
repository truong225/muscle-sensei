// MuscleViewer — trình xem cơ 3D bằng three.js thuần (không React).
//
// Hợp đồng (run/graph.md §2, nút N7):
//   new MuscleViewer(canvas, { reducedMotion = false, background = PALETTE.background })
//   await load(url)                     model đã vào scene và đã vẽ khung đầu tiên
//   setMuscleMeta(musclesJson)          id → { nameVi, view }
//   select(id|null, { focus = false })  tô cả hai bên của đơn vị cơ; focus xoay camera về mặt `view`
//   onSelect(cb(id|null, info)) / onHover(cb(id|null, info))   → trả về hàm huỷ đăng ký
//        info = { depth, side, nameVi, x, y }  (depth = thứ tự trong các cơ chọn được dọc tia bấm)
//        onSelect chỉ phát khi NGƯỜI DÙNG bấm (select() từ API không phát lại để tránh vòng lặp).
//   setView('front'|'back'), resetView(), zoomBy(d)   (zoomBy(+1) = lại gần)
//   screenPointOf(id, { view }) → { x, y, clicks, view } | null   (QA; có thể đổi góc nhìn ngay lập tức)
//   getSelected(), getHovered(), isIdle(), setReducedMotion(bool), dispose()
//   window.__mv = this; window.__mvStats = { drawCalls, triangles, loadMs }
//
// Bấm chọn:
//   - Bấm (di chuyển < 5 px giữa pointerdown/up) → tia xuyên qua MỌI lưới (chọn được + ngữ cảnh).
//   - Danh sách ứng viên = các đơn vị cơ chọn được theo thứ tự độ sâu dọc tia. Lưới ngữ cảnh mỏng nằm
//     sát phía trước (≤ 2,5 cm) bị bỏ qua; nhưng lưới ngữ cảnh/xương nằm trước rõ rệt sẽ CHE các cơ
//     phía sau (bấm vào xương bánh chè không chọn cơ đùi sau ở mặt kia).
//   - Bấm lại gần cùng chỗ (≤ 6 px) → chọn cơ KẾ TIẾP sâu hơn dọc tia, xoay vòng (click-through).
//   - Bấm vào nền trống (tia không trúng gì) → BỎ CHỌN (phát onSelect(null)). Bấm vào lưới ngữ cảnh
//     (xương, cơ không chọn được) mà không có cơ chọn được ngay sau → giữ nguyên lựa chọn.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { PALETTE } from "./palette.js";

const CLICK_MOVE_PX = 5;
const CLICK_THROUGH_PX = 6;
const CONTEXT_SKIP_M = 0.025; // lưới ngữ cảnh mỏng hơn khoảng này phía trước cơ thì không che
const DEFAULT_ELEVATION = 0.1; // rad, camera hơi cao hơn tâm cơ thể
const THIN_SHEET_M = 0.0045;
const THICK_M = 0.006;
const THIN_LOOKAHEAD_M = 0.015;
const ANIM_MS = 650;
const LEAF = 8;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class MuscleViewer {
  constructor(canvas, { reducedMotion = false, background = PALETTE.background } = {}) {
    this.canvas = canvas;
    this.reducedMotion = !!reducedMotion;
    this._selectCbs = new Set();
    this._hoverCbs = new Set();
    this._meta = new Map();
    this._selected = null;
    this._hovered = null;
    this._units = new Map(); // muscleId → [mesh]
    this._meshes = [];
    this._bvh = null;
    this._raf = 0;
    this._dirty = true;
    this._tween = null;
    this._pointerDown = null;
    this._activePointers = new Set();
    this._hoverPos = null;
    this._hoverPending = false;
    this._lastClick = null;
    this._disposed = false;
    this._stats = { drawCalls: 0, triangles: 0, loadMs: null };
    this._loadT0 = null;
    this._frame = this._frame.bind(this);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: background == null,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    if (background != null) renderer.setClearColor(new THREE.Color(background), 1);
    else renderer.setClearColor(0x000000, 0);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    camera.position.set(0, 1.2, 4);
    scene.add(camera);
    this.camera = camera;

    // Ánh sáng 3 điểm gắn theo camera → mặt nào đang nhìn cũng được chiếu đều, mềm.
    scene.add(new THREE.HemisphereLight(0xfff8ef, 0xb8a897, 0.7));
    const addDir = (color, intensity, x, y, z) => {
      const l = new THREE.DirectionalLight(color, intensity);
      l.position.set(x, y, z);
      l.target.position.set(0, 0, -3);
      camera.add(l);
      camera.add(l.target);
      return l;
    };
    this._lights = [
      addDir(0xfff3e4, 2.6, -2.0, 2.4, 1.0), // chính: trên-trái
      addDir(0xe9f0ff, 0.55, 2.4, 0.4, 0.6), // phụ: phải, hơi lạnh
      addDir(0xffffff, 1.1, 0.8, 1.6, -4.0), // viền: phía sau
    ];

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = !this.reducedMotion;
    controls.dampingFactor = 0.09;
    controls.rotateSpeed = 0.75;
    controls.zoomSpeed = 0.9;
    controls.panSpeed = 0.7;
    controls.screenSpacePanning = true;
    controls.minDistance = 0.45;
    controls.maxDistance = 8;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 2.2;
    controls.target.set(0, 0.88, 0);
    this.controls = controls;
    this._targetMin = new THREE.Vector3(-0.25, 0.08, -0.06);
    this._targetMax = new THREE.Vector3(0.25, 1.62, 0.06);
    this._home = { target: new THREE.Vector3(0, 0.88, 0), radius: 4 };

    this._onControlsChange = () => this._requestFrame(true);
    this._onControlsStart = () => {
      this._tween = null;
      this.canvas.style.cursor = "grabbing";
    };
    this._onControlsEnd = () => this._updateCursor();
    controls.addEventListener("change", this._onControlsChange);
    controls.addEventListener("start", this._onControlsStart);
    controls.addEventListener("end", this._onControlsEnd);

    this._onPointerDown = (e) => this._handlePointerDown(e);
    this._onPointerUp = (e) => this._handlePointerUp(e);
    this._onPointerMove = (e) => this._handlePointerMove(e);
    this._onPointerLeave = () => this._handlePointerLeave();
    this._onPointerCancel = (e) => this._activePointers.delete(e.pointerId);
    canvas.addEventListener("pointerdown", this._onPointerDown);
    canvas.addEventListener("pointerup", this._onPointerUp);
    canvas.addEventListener("pointermove", this._onPointerMove);
    canvas.addEventListener("pointerleave", this._onPointerLeave);
    canvas.addEventListener("pointercancel", this._onPointerCancel);

    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(canvas);
    this._resize();

    window.__mv = this;
    window.__mvStats = this._stats;
  }

  // ---------------------------------------------------------------- tải mô hình
  async load(url) {
    this._loadT0 = performance.now();
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    if (this._disposed) return;
    const model = gltf.scene;
    this.model = model;

    const mat = {
      muscle: new THREE.MeshStandardMaterial({ color: PALETTE.muscle, roughness: 0.62, metalness: 0 }),
      context: new THREE.MeshStandardMaterial({ color: PALETTE.contextMuscle, roughness: 0.8, metalness: 0 }),
      bone: new THREE.MeshStandardMaterial({ color: PALETTE.bone, roughness: 0.78, metalness: 0 }),
    };
    this._baseMaterials = mat;

    model.updateMatrixWorld(true);
    model.traverse((obj) => {
      if (!obj.isMesh) return;
      let ud = {};
      for (let o = obj; o && o !== model; o = o.parent) {
        if (o.userData && (o.userData.muscleId || o.userData.context)) {
          ud = o.userData;
          break;
        }
      }
      const old = obj.material;
      let info;
      if (ud.muscleId) {
        info = { unit: ud.muscleId, side: ud.side || "C", kind: "muscle" };
        obj.material = mat.muscle.clone();
      } else if (ud.context === "bones") {
        info = { unit: null, side: null, kind: "bone" };
        obj.material = mat.bone;
      } else {
        info = { unit: null, side: null, kind: "context" };
        obj.material = mat.context;
      }
      if (old && old !== obj.material) old.dispose?.();
      obj.userData.mv = info;
      obj.userData.mvIndex = this._meshes.length;
      this._meshes.push(obj);
      if (info.unit) {
        if (!this._units.has(info.unit)) this._units.set(info.unit, []);
        this._units.get(info.unit).push(obj);
      }
    });
    this.scene.add(model);

    // Lớp "xuyên thấu": vẽ phần BỊ CHE của cơ đang chọn/rê (depthFunc Greater) để cơ sâu vẫn thấy rõ.
    const ovSel = new THREE.MeshBasicMaterial({
      color: PALETTE.selected, transparent: true, opacity: 0.42, depthWrite: false,
      depthFunc: THREE.GreaterDepth, toneMapped: false,
    });
    const ovHov = ovSel.clone();
    ovHov.color.set(PALETTE.muscleHover);
    ovHov.opacity = 0.3;
    this._overlayMats = { sel: ovSel, hov: ovHov };
    for (const meshes of this._units.values()) {
      for (const m of meshes) {
        const ov = new THREE.Mesh(m.geometry, ovSel);
        ov.visible = false;
        ov.renderOrder = 10;
        ov.raycast = () => {};
        m.add(ov);
        m.userData.overlay = ov;
      }
    }

    // Khung hình: ôm trọn cơ thể đứng.
    const box = new THREE.Box3().setFromObject(model);
    this._bbox = box;
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    this._home.target.set(c.x, c.y, c.z);
    this._targetMin.set(c.x - 0.25, box.min.y + 0.08, c.z - 0.06);
    this._targetMax.set(c.x + 0.25, box.max.y - 0.08, c.z + 0.06);
    this._addGroundShadow(c, size, box.min.y);
    this._resize();
    this._applyHome(true);
    this._applyMaterials();

    // Khung đầu tiên đồng bộ để đo loadMs.
    this._render();
    this._stats.loadMs = Math.round(performance.now() - this._loadT0);
    // Dựng BVH để bấm/rê chuột nhanh — sau khung đầu, không chặn hiển thị.
    setTimeout(() => this._ensureBVH(), 0);
    return this;
  }

  _addGroundShadow(c, size, y0) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(60,40,30,0.30)");
    grad.addColorStop(0.55, "rgba(60,40,30,0.12)");
    grad.addColorStop(1, "rgba(60,40,30,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.scale.set(Math.max(size.x, 0.5) * 1.3, Math.max(size.z, 0.3) * 2.6, 1);
    m.position.set(c.x, y0 + 0.002, c.z);
    m.renderOrder = -1;
    this._ground = m;
    this.scene.add(m);
  }

  // ---------------------------------------------------------------- dữ liệu cơ
  setMuscleMeta(json) {
    this._meta.clear();
    const list = Array.isArray(json) ? json : json && Array.isArray(json.muscles) ? json.muscles : null;
    if (list) for (const m of list) this._meta.set(m.id, { nameVi: m.nameVi, view: m.view || "both" });
    else if (json) for (const [id, m] of Object.entries(json)) this._meta.set(id, { nameVi: m.nameVi, view: m.view || "both" });
  }

  // ---------------------------------------------------------------- chọn / rê
  onSelect(cb) {
    this._selectCbs.add(cb);
    return () => this._selectCbs.delete(cb);
  }
  onHover(cb) {
    this._hoverCbs.add(cb);
    return () => this._hoverCbs.delete(cb);
  }
  getSelected() {
    return this._selected;
  }
  getHovered() {
    return this._hovered;
  }
  // true khi không còn hoạt cảnh/quán tính nào đang chạy (tiện cho QA).
  isIdle() {
    return !this._raf && !this._tween;
  }

  select(id, { focus = false } = {}) {
    if (id != null && !this._units.has(id) && this.model) {
      console.warn(`[MuscleViewer] không có cơ "${id}" trong mô hình`);
      id = null;
    }
    this._selected = id ?? null;
    this._applyMaterials();
    if (focus && id) {
      const view = this._meta.get(id)?.view;
      if (view === "front" || view === "back") {
        const want = view === "front" ? 0 : Math.PI;
        const cur = this._spherical().theta;
        if (Math.abs(wrapAngle(cur - want)) > Math.PI / 4) this._animateTo({ theta: want });
      }
    }
    this._requestFrame(true);
  }

  _setSelectedByUser(id, info) {
    this._selected = id;
    this._applyMaterials();
    this._requestFrame(true);
    for (const cb of this._selectCbs) cb(id, info);
  }

  _setHovered(id, info) {
    if (id === this._hovered) return;
    this._hovered = id;
    this._applyMaterials();
    this._updateCursor();
    this._requestFrame(true);
    for (const cb of this._hoverCbs) cb(id, info);
  }

  _updateCursor() {
    this.canvas.style.cursor = this._hovered ? "pointer" : "grab";
  }

  _applyMaterials() {
    const C = this._colors || (this._colors = {
      base: new THREE.Color(PALETTE.muscle),
      hover: new THREE.Color(PALETTE.muscleHover),
      hoverE: new THREE.Color(PALETTE.muscleHoverEmissive),
      dim: new THREE.Color(PALETTE.muscleDim),
      sel: new THREE.Color(PALETTE.selected),
      selE: new THREE.Color(PALETTE.selectedEmissive),
      black: new THREE.Color(0, 0, 0),
    });
    const sel = this._selected;
    const hov = this._hovered;
    for (const [unit, meshes] of this._units) {
      for (const m of meshes) {
        const mt = m.material;
        const ov = m.userData.overlay;
        if (ov) {
          ov.visible = unit === sel || unit === hov;
          ov.material = unit === sel ? this._overlayMats.sel : this._overlayMats.hov;
        }
        if (unit === sel) {
          mt.color.copy(C.sel);
          mt.emissive.copy(C.selE);
          mt.emissiveIntensity = unit === hov ? 0.42 : 0.3;
          mt.roughness = 0.5;
        } else if (unit === hov) {
          mt.color.copy(C.hover);
          mt.emissive.copy(C.hoverE);
          mt.emissiveIntensity = 0.5;
          mt.roughness = 0.6;
        } else {
          mt.color.copy(sel ? C.dim : C.base);
          mt.emissive.copy(C.black);
          mt.emissiveIntensity = 0;
          mt.roughness = 0.62;
        }
      }
    }
  }

  // ---------------------------------------------------------------- camera
  _spherical() {
    const off = this.camera.position.clone().sub(this.controls.target);
    return new THREE.Spherical().setFromVector3(off);
  }

  _fitRadius() {
    if (!this._bbox) return 4;
    const size = this._bbox.getSize(new THREE.Vector3());
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const aspect = this.camera.aspect || 1;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const dV = (size.y * 1.07) / 2 / Math.tan(vfov / 2);
    const dH = (size.x * 1.15) / 2 / Math.tan(hfov / 2);
    return Math.max(dV, dH) + size.z / 2;
  }

  _applyHome(instant, theta = 0) {
    const r = this._fitRadius();
    this._home.radius = r;
    this.controls.maxDistance = r * 1.6;
    this._animateTo({ theta, phi: Math.PI / 2 - DEFAULT_ELEVATION, radius: r, target: this._home.target }, instant);
  }

  setView(view) {
    const theta = view === "back" ? Math.PI : 0;
    this._animateTo({ theta, phi: Math.PI / 2 - DEFAULT_ELEVATION });
  }

  resetView() {
    this._applyHome(false);
  }

  zoomBy(d = 1) {
    const cur = this._tween ? this._tween.to.radius : this._spherical().radius;
    const r = clamp(cur * Math.pow(0.8, d), this.controls.minDistance, this.controls.maxDistance);
    this._animateTo({ radius: r });
  }

  setReducedMotion(v) {
    this.reducedMotion = !!v;
    this.controls.enableDamping = !this.reducedMotion;
  }

  _flushControls() {
    // Bỏ quán tính đang dở để không cộng dồn với hoạt cảnh.
    const d = this.controls.enableDamping;
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enableDamping = d;
  }

  _animateTo(to, instant = this.reducedMotion) {
    this._flushControls();
    const s = this._spherical();
    const from = { theta: s.theta, phi: s.phi, radius: s.radius, target: this.controls.target.clone() };
    const dest = {
      theta: to.theta ?? from.theta,
      phi: to.phi ?? from.phi,
      radius: to.radius ?? from.radius,
      target: to.target ? to.target.clone() : from.target.clone(),
    };
    dest.theta = from.theta + wrapAngle(dest.theta - from.theta);
    if (instant) {
      this._tween = null;
      this._setCamera(dest);
      this._requestFrame(true);
      return;
    }
    this._tween = { from, to: dest, t0: performance.now(), dur: ANIM_MS };
    this._requestFrame(true);
  }

  _setCamera({ theta, phi, radius, target }) {
    this.controls.target.copy(target);
    const off = new THREE.Vector3().setFromSpherical(new THREE.Spherical(radius, phi, theta));
    this.camera.position.copy(target).add(off);
    this.camera.lookAt(target);
    this.camera.updateMatrixWorld();
    this.controls.update();
  }

  _stepTween(now) {
    const tw = this._tween;
    const k = easeInOut(clamp((now - tw.t0) / tw.dur, 0, 1));
    const f = tw.from;
    const t = tw.to;
    this._setCamera({
      theta: f.theta + (t.theta - f.theta) * k,
      phi: f.phi + (t.phi - f.phi) * k,
      radius: f.radius + (t.radius - f.radius) * k,
      target: f.target.clone().lerp(t.target, k),
    });
    if (k >= 1) this._tween = null;
  }

  _clampTarget() {
    const t = this.controls.target;
    const c = t.clone().clamp(this._targetMin, this._targetMax);
    if (!c.equals(t)) {
      const d = c.sub(t);
      t.add(d);
      this.camera.position.add(d);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- vòng vẽ
  _requestFrame(dirty = false) {
    if (dirty) this._dirty = true;
    if (!this._raf && !this._disposed) this._raf = requestAnimationFrame(this._frame);
  }

  _frame(now) {
    this._raf = 0;
    if (this._disposed) return;
    let active = false;
    if (this._tween) {
      this._stepTween(now);
      active = true;
    }
    // Quán tính theo thời gian thực: khi khung hình chậm, chạy nhiều bước giảm chấn (60 Hz) trong một khung.
    const continuing = this._wasActive && this._lastFrameT != null;
    const steps = continuing ? clamp(Math.round((now - this._lastFrameT) / 16.67), 1, 60) : 1;
    this._lastFrameT = now;
    for (let i = 0; i < steps; i++) if (this.controls.update()) active = true;
    if (this._clampTarget()) active = true;
    if (this._hoverPending) {
      this._hoverPending = false;
      this._doHover();
    }
    if (active || this._dirty) this._render();
    this._wasActive = active;
    if (active || this._tween) this._requestFrame();
  }

  _render() {
    this._dirty = false;
    this.renderer.render(this.scene, this.camera);
    const r = this.renderer.info.render;
    this._stats.drawCalls = r.calls;
    this._stats.triangles = r.triangles;
  }

  _resize() {
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this._bbox) {
      const r = this._fitRadius();
      this._home.radius = r;
      this.controls.maxDistance = r * 1.6;
    }
    this._requestFrame(true);
  }

  // ---------------------------------------------------------------- con trỏ
  _handlePointerDown(e) {
    this._activePointers.add(e.pointerId);
    if (e.isPrimary) this._pointerDown = { x: e.clientX, y: e.clientY, id: e.pointerId, multi: false };
    if (this._activePointers.size > 1 && this._pointerDown) this._pointerDown.multi = true;
  }

  _handlePointerUp(e) {
    this._activePointers.delete(e.pointerId);
    const pd = this._pointerDown;
    if (!pd || pd.id !== e.pointerId) return;
    this._pointerDown = null;
    if (pd.multi || e.button > 0) return;
    if (Math.hypot(e.clientX - pd.x, e.clientY - pd.y) >= CLICK_MOVE_PX) return;
    this._click(e.clientX, e.clientY);
  }

  _click(cx, cy) {
    const { list, anyHit } = this._pickAt(cx, cy);
    const near = this._lastClick && Math.hypot(cx - this._lastClick.x, cy - this._lastClick.y) <= CLICK_THROUGH_PX;
    if (!list.length) {
      this._lastClick = null;
      if (!anyHit && this._selected != null) this._setSelectedByUser(null, { depth: -1 });
      return;
    }
    let depth = 0;
    if (near && this._selected != null) {
      const i = list.findIndex((h) => h.unit === this._selected);
      if (i >= 0) depth = (i + 1) % list.length;
    }
    this._lastClick = { x: cx, y: cy };
    const h = list[depth];
    const rect = this.canvas.getBoundingClientRect();
    this._setSelectedByUser(h.unit, {
      depth,
      side: h.side,
      nameVi: this._meta.get(h.unit)?.nameVi,
      x: cx - rect.left,
      y: cy - rect.top,
    });
  }

  _handlePointerMove(e) {
    if (e.pointerType === "touch") return;
    if (e.buttons) return; // đang kéo xoay
    this._hoverPos = { x: e.clientX, y: e.clientY };
    this._hoverPending = true;
    this._requestFrame();
  }

  _handlePointerLeave() {
    this._hoverPos = null;
    this._hoverPending = false;
    this._setHovered(null, { depth: -1 });
  }

  _doHover() {
    if (!this._hoverPos || !this.model) return;
    const { x, y } = this._hoverPos;
    const { list } = this._pickAt(x, y);
    const h = list[0];
    const rect = this.canvas.getBoundingClientRect();
    if (h) this._setHovered(h.unit, { depth: 0, side: h.side, nameVi: this._meta.get(h.unit)?.nameVi, x: x - rect.left, y: y - rect.top });
    else this._setHovered(null, { depth: -1 });
  }

  // ---------------------------------------------------------------- tia chọn
  _rayFromClient(cx, cy) {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    this.camera.updateMatrixWorld();
    const rc = this._raycaster || (this._raycaster = new THREE.Raycaster());
    rc.setFromCamera(ndc, this.camera);
    return rc.ray;
  }

  // → { list: [{unit, side, t}], anyHit }
  _pickAt(cx, cy) {
    if (!this.model) return { list: [], anyHit: false };
    const ray = this._rayFromClient(cx, cy);
    const hits = this._intersectAll(ray); // [{mesh, t}] mỗi lưới một lần, gần nhất trước
    const list = [];
    const seen = new Set();
    let blockT = Infinity;
    for (const h of hits) {
      const info = this._meshes[h.mesh].userData.mv;
      if (!info.unit) {
        if (blockT === Infinity) blockT = h.t;
        continue;
      }
      if (h.t > blockT + CONTEXT_SKIP_M) break;
      if (seen.has(info.unit)) continue;
      seen.add(info.unit);
      list.push({ unit: info.unit, side: info.side, t: h.t, thick: h.thick });
    }
    // Lớp màng mỏng (cân cơ chéo bụng phủ cơ thẳng bụng trong BodyParts3D) không được "giành" cú bấm đầu:
    // lớp < 4,5 mm nằm ngay trước (≤ 1,5 cm) một cơ dày rõ rệt thì xếp ra sau cơ dày đó.
    const demoted = list.map((c, i) =>
      c.thick < THIN_SHEET_M &&
      list.some((d, j) => j > i && d.t - c.t <= THIN_LOOKAHEAD_M && d.thick >= THICK_M && d.thick >= 2 * c.thick)
    );
    const ordered = [];
    let buf = [];
    list.forEach((c, i) => {
      if (demoted[i]) buf.push(c);
      else {
        ordered.push(c, ...buf);
        buf = [];
      }
    });
    ordered.push(...buf);
    return { list: ordered, anyHit: hits.length > 0 };
  }

  // BVH tự viết (không thêm phụ thuộc): toạ độ thế giới, cây nhị phân chia trung vị theo trục dài nhất.
  _ensureBVH() {
    if (this._bvh || !this.model || this._disposed) return this._bvh;
    const meshes = this._meshes;
    let vCount = 0;
    let tCount = 0;
    for (const m of meshes) {
      const g = m.geometry;
      vCount += g.attributes.position.count;
      tCount += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
    const P = new Float32Array(vCount * 3);
    const I = new Uint32Array(tCount * 3);
    const TM = new Uint16Array(tCount);
    const v = new THREE.Vector3();
    let vb = 0;
    let tb = 0;
    meshes.forEach((m, mi) => {
      m.updateWorldMatrix(true, false);
      const g = m.geometry;
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        P[(vb + i) * 3] = v.x;
        P[(vb + i) * 3 + 1] = v.y;
        P[(vb + i) * 3 + 2] = v.z;
      }
      const n = g.index ? g.index.count : pos.count;
      for (let i = 0; i < n; i++) I[tb * 3 + i] = vb + (g.index ? g.index.getX(i) : i);
      for (let i = 0; i < n / 3; i++) TM[tb + i] = mi;
      vb += pos.count;
      tb += n / 3;
    });
    // tâm tam giác
    const C = new Float32Array(tCount * 3);
    for (let t = 0; t < tCount; t++) {
      const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
      C[t * 3] = (P[a] + P[b] + P[c]) / 3;
      C[t * 3 + 1] = (P[a + 1] + P[b + 1] + P[c + 1]) / 3;
      C[t * 3 + 2] = (P[a + 2] + P[b + 2] + P[c + 2]) / 3;
    }
    const order = new Uint32Array(tCount);
    for (let i = 0; i < tCount; i++) order[i] = i;
    const maxNodes = Math.max(1, 2 * Math.ceil(tCount / (LEAF / 2)));
    const nodeA = new Uint32Array(maxNodes * 2); // [start|left, count] (count 0 = nút trong)
    const nodeB = new Float32Array(maxNodes * 6);
    let nodeCount = 1;
    const stack = [[0, 0, tCount]];
    const select = (lo, hi, k, axis) => {
      // quickselect trên order[lo..hi) theo C[axis]
      hi -= 1;
      while (hi > lo) {
        const pv = C[order[(lo + hi) >> 1] * 3 + axis];
        let i = lo, j = hi;
        while (i <= j) {
          while (C[order[i] * 3 + axis] < pv) i++;
          while (C[order[j] * 3 + axis] > pv) j--;
          if (i <= j) {
            const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
            i++; j--;
          }
        }
        if (k <= j) hi = j;
        else if (k >= i) lo = i;
        else return;
      }
    };
    while (stack.length) {
      const [node, s, e] = stack.pop();
      const cnt = e - s;
      if (cnt <= LEAF) {
        nodeA[node * 2] = s;
        nodeA[node * 2 + 1] = cnt;
        continue;
      }
      let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
      for (let i = s; i < e; i++) {
        const o = order[i] * 3;
        const x = C[o], y = C[o + 1], z = C[o + 2];
        if (x < mnx) mnx = x; if (x > mxx) mxx = x;
        if (y < mny) mny = y; if (y > mxy) mxy = y;
        if (z < mnz) mnz = z; if (z > mxz) mxz = z;
      }
      const ex = mxx - mnx, ey = mxy - mny, ez = mxz - mnz;
      const axis = ex >= ey && ex >= ez ? 0 : ey >= ez ? 1 : 2;
      const mid = (s + e) >> 1;
      select(s, e, mid, axis);
      const left = nodeCount;
      nodeCount += 2;
      nodeA[node * 2] = left;
      nodeA[node * 2 + 1] = 0;
      stack.push([left, s, mid], [left + 1, mid, e]);
    }
    // hộp bao từ dưới lên (con luôn có chỉ số lớn hơn cha)
    for (let n = nodeCount - 1; n >= 0; n--) {
      const o = n * 6;
      if (nodeA[n * 2 + 1] > 0) {
        let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
        const s = nodeA[n * 2], e = s + nodeA[n * 2 + 1];
        for (let i = s; i < e; i++) {
          const t = order[i] * 3;
          for (let k = 0; k < 3; k++) {
            const p = I[t + k] * 3;
            const x = P[p], y = P[p + 1], z = P[p + 2];
            if (x < mnx) mnx = x; if (x > mxx) mxx = x;
            if (y < mny) mny = y; if (y > mxy) mxy = y;
            if (z < mnz) mnz = z; if (z > mxz) mxz = z;
          }
        }
        nodeB[o] = mnx; nodeB[o + 1] = mny; nodeB[o + 2] = mnz;
        nodeB[o + 3] = mxx; nodeB[o + 4] = mxy; nodeB[o + 5] = mxz;
      } else {
        const a = nodeA[n * 2] * 6, b = a + 6;
        for (let k = 0; k < 3; k++) {
          nodeB[o + k] = Math.min(nodeB[a + k], nodeB[b + k]);
          nodeB[o + 3 + k] = Math.max(nodeB[a + 3 + k], nodeB[b + 3 + k]);
        }
      }
    }
    this._bvh = { P, I, TM, order, nodeA, nodeB, nodeCount, tCount };
    return this._bvh;
  }

  // Tất cả giao điểm (hai mặt), gộp theo lưới: [{ mesh, t, thick }] tăng dần theo t.
  _intersectAll(ray) {
    const bvh = this._ensureBVH();
    if (!bvh) return [];
    const { P, I, TM, order, nodeA, nodeB } = bvh;
    const ox = ray.origin.x, oy = ray.origin.y, oz = ray.origin.z;
    const dx = ray.direction.x, dy = ray.direction.y, dz = ray.direction.z;
    const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz;
    const best = new Map(); // mesh → [t…]
    const stack = [0];
    while (stack.length) {
      const n = stack.pop();
      const o = n * 6;
      let t1 = (nodeB[o] - ox) * ix, t2 = (nodeB[o + 3] - ox) * ix;
      let tmin = Math.min(t1, t2), tmax = Math.max(t1, t2);
      t1 = (nodeB[o + 1] - oy) * iy; t2 = (nodeB[o + 4] - oy) * iy;
      tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
      t1 = (nodeB[o + 2] - oz) * iz; t2 = (nodeB[o + 5] - oz) * iz;
      tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
      if (!(tmax >= Math.max(tmin, 0))) continue;
      const cnt = nodeA[n * 2 + 1];
      if (cnt === 0) {
        stack.push(nodeA[n * 2], nodeA[n * 2] + 1);
        continue;
      }
      const s = nodeA[n * 2];
      for (let i = s; i < s + cnt; i++) {
        const tri = order[i];
        const a = I[tri * 3] * 3, b = I[tri * 3 + 1] * 3, c = I[tri * 3 + 2] * 3;
        // Möller–Trumbore, hai mặt
        const e1x = P[b] - P[a], e1y = P[b + 1] - P[a + 1], e1z = P[b + 2] - P[a + 2];
        const e2x = P[c] - P[a], e2y = P[c + 1] - P[a + 1], e2z = P[c + 2] - P[a + 2];
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
        const det = e1x * px + e1y * py + e1z * pz;
        if (det > -1e-12 && det < 1e-12) continue;
        const inv = 1 / det;
        const tx = ox - P[a], ty = oy - P[a + 1], tz = oz - P[a + 2];
        const u = (tx * px + ty * py + tz * pz) * inv;
        if (u < 0 || u > 1) continue;
        const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
        const w = (dx * qx + dy * qy + dz * qz) * inv;
        if (w < 0 || u + w > 1) continue;
        const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
        if (t <= 0) continue;
        const m = TM[tri];
        const arr = best.get(m);
        if (arr) arr.push(t);
        else best.set(m, [t]);
      }
    }
    const out = [];
    for (const [mesh, ts] of best) {
      ts.sort((p, q) => p - q);
      // độ dày dọc tia: từ điểm vào tới điểm ra đầu tiên (bỏ các mặt trùng nhau < 0,2 mm)
      let exit = Infinity;
      for (let k = 1; k < ts.length; k++) if (ts[k] - ts[0] > 0.0002) { exit = ts[k]; break; }
      out.push({ mesh, t: ts[0], thick: exit - ts[0] });
    }
    return out.sort((p, q) => p.t - q.t);
  }

  // ---------------------------------------------------------------- QA
  // Điểm (toạ độ client) trên canvas mà bấm `clicks` lần sẽ chọn được `id`, sau khi đặt góc nhìn `view`.
  // Đổi góc nhìn NGAY LẬP TỨC (không hoạt cảnh) và xoá bộ nhớ click-through.
  screenPointOf(id, opts = {}) {
    if (!this.model || !this._units.has(id)) return null;
    const bvh = this._ensureBVH();
    const meshIdx = new Set(this._units.get(id).map((m) => m.userData.mvIndex));
    const tris = [];
    for (let t = 0; t < bvh.tCount; t++) if (meshIdx.has(bvh.TM[t])) tris.push(t);
    const pref = this._meta.get(id)?.view || "both";
    const views = opts.view ? [opts.view] : pref === "back" ? ["back", "front"] : ["front", "back"];
    const rect = this.canvas.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    const v = new THREE.Vector3();
    const N = opts.samples || 260;
    let fallback = null;
    let applied = null;
    for (const view of views) {
      this._applyHome(true, view === "back" ? Math.PI : 0);
      applied = view;
      this._render();
      this.camera.updateMatrixWorld();
      const cands = [];
      const stride = Math.max(1, Math.floor(tris.length / N));
      for (let k = 0; k < tris.length; k += stride) {
        const t = tris[k];
        const { P, I } = bvh;
        const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
        v.set((P[a] + P[b] + P[c]) / 3, (P[a + 1] + P[b + 1] + P[c + 1]) / 3, (P[a + 2] + P[b + 2] + P[c + 2]) / 3);
        v.project(this.camera);
        if (v.z > 1 || v.z < -1) continue;
        const px = Math.round(((v.x + 1) / 2) * W);
        const py = Math.round(((1 - v.y) / 2) * H);
        if (px < 4 || py < 4 || px > W - 4 || py > H - 4) continue;
        cands.push([px, py]);
      }
      let best = null;
      const scored = [];
      const seenPx = new Set();
      for (const [px, py] of cands) {
        const key = px * 10000 + py;
        if (seenPx.has(key)) continue;
        seenPx.add(key);
        const { list } = this._pickAt(rect.left + px, rect.top + py);
        const idx = list.findIndex((h) => h.unit === id);
        if (idx < 0) continue;
        scored.push({ px, py, idx, prefix: list.slice(0, idx + 1).map((h) => h.unit).join("|") });
      }
      scored.sort((p, q) => p.idx - q.idx);
      // ưu tiên ít lần bấm nhất, rồi điểm "vững" (lân cận ±2 px cho cùng kết quả)
      for (const s of scored) {
        if (best && s.idx > best.idx) break;
        let stable = 0;
        for (const [ddx, ddy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2]]) {
          const { list } = this._pickAt(rect.left + s.px + ddx, rect.top + s.py + ddy);
          if (list.slice(0, s.idx + 1).map((h) => h.unit).join("|") === s.prefix) stable++;
        }
        if (!best || stable > best.stable) best = { ...s, stable };
        if (stable === 6) break;
      }
      if (best) {
        const res = { x: Math.round(rect.left + best.px), y: Math.round(rect.top + best.py), clicks: best.idx + 1, view };
        if (!fallback || res.clicks < fallback.clicks) fallback = res;
        if (best.idx === 0 || opts.view) break;
      }
    }
    if (fallback && fallback.view !== applied) this._applyHome(true, fallback.view === "back" ? Math.PI : 0);
    this._lastClick = null;
    this._requestFrame(true);
    return fallback;
  }

  // ---------------------------------------------------------------- dọn dẹp
  dispose() {
    this._disposed = true;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._resizeObserver.disconnect();
    const c = this.canvas;
    c.removeEventListener("pointerdown", this._onPointerDown);
    c.removeEventListener("pointerup", this._onPointerUp);
    c.removeEventListener("pointermove", this._onPointerMove);
    c.removeEventListener("pointerleave", this._onPointerLeave);
    c.removeEventListener("pointercancel", this._onPointerCancel);
    this.controls.removeEventListener("change", this._onControlsChange);
    this.controls.removeEventListener("start", this._onControlsStart);
    this.controls.removeEventListener("end", this._onControlsEnd);
    this.controls.dispose();
    const mats = new Set();
    this.scene.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose();
        mats.add(o.material);
      }
    });
    for (const m of mats) {
      m.map?.dispose();
      m.dispose();
    }
    if (this._baseMaterials) for (const m of Object.values(this._baseMaterials)) m.dispose();
    if (this._overlayMats) for (const m of Object.values(this._overlayMats)) m.dispose();
    this.renderer.dispose();
    this._bvh = null;
    this._selectCbs.clear();
    this._hoverCbs.clear();
    if (window.__mv === this) delete window.__mv;
  }
}

export default MuscleViewer;
