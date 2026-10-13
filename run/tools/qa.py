"""N9 QA độc lập trên bản build production (vite preview).
Dùng: python3 -I run/tools/qa.py http://localhost:4181
Kiểm tra C1 (console), C2 (bấm từng cơ trong app thật), C8 (luồng sử dụng), C9 (ghi công), C10 (ngân sách).
In JSON, thoát 1 nếu có mục fail.
"""
import json, sys, os, unicodedata
from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip("/")
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "run", "screenshots")
os.makedirs(OUT, exist_ok=True)
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
M = json.load(open(os.path.join(ROOT, "src/data/muscles.json"), encoding="utf-8"))["muscles"]
EX = json.load(open(os.path.join(ROOT, "src/data/exercises.json"), encoding="utf-8"))
EXD = {e["id"]: e for e in EX}
NAME = {m["id"]: m["nameVi"] for m in M}
ATTR = "BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan"
R, errors = {}, []

def rec(k, ok, **ev):
    R[k] = {"pass": bool(ok), **ev}

def page(b, vp):
    pg = b.new_page(viewport=vp)
    pg.on("console", lambda m: m.type == "error" and errors.append(m.text))
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.goto(BASE + "/", wait_until="networkidle")
    pg.wait_for_function("window.__mv && window.__app && window.__mvStats && window.__mvStats.loadMs > 0", timeout=90000)
    pg.wait_for_timeout(1500)
    return pg

def title(pg):
    el = pg.query_selector("#muscle-title")
    return el.inner_text().strip() if el else None

def list_ids(pg):
    return [e.get_attribute("data-ex") for e in pg.query_selector_all("section.tabpanel li.ex[data-ex]")]

with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    pg = page(b, {"width": 1440, "height": 900})
    pg.screenshot(path=os.path.join(OUT, "qa-desktop-empty.png"), timeout=120000)
    stats = pg.evaluate("window.__mvStats")

    # ---- C2: bấm từng cơ trong app thật (không gọi select qua API)
    units = {}
    for m in M:
        mid = m["id"]
        pg.evaluate("window.__app.selectMuscle(null)"); pg.wait_for_timeout(150)
        pt = pg.evaluate(f"window.__mv.screenPointOf('{mid}')")
        if not pt:
            units[mid] = {"ok": False, "why": "không có điểm chiếu"}; continue
        pg.wait_for_timeout(250)
        for _ in range(int(pt.get("clicks", 1))):
            pg.mouse.click(pt["x"], pt["y"]); pg.wait_for_timeout(220)
        sel, t = pg.evaluate("window.__app.getSelected()"), title(pg)
        units[mid] = {"ok": sel == mid and t == NAME[mid], "selected": sel, "title": t, "clicks": pt.get("clicks", 1), "view": pt.get("view")}
    bad = [k for k, v in units.items() if not v["ok"]]
    rec("C2_app_click_every_muscle", not bad, passed=len(units) - len(bad), total=len(units), failed={k: units[k] for k in bad})

    # ---- C8: luồng sử dụng
    pg.evaluate("window.__app.selectMuscle(null)"); pg.wait_for_timeout(200)
    pt = pg.evaluate("window.__mv.screenPointOf('biceps-brachii')")
    for _ in range(int(pt.get("clicks", 1))):
        pg.mouse.click(pt["x"], pt["y"]); pg.wait_for_timeout(250)
    tab0 = pg.evaluate("window.__app.getTab()")
    gym = list_ids(pg)
    want_gym = [e["id"] for e in EX if e["type"] == "gym" and "biceps-brachii" in e["primaryMuscles"]]
    sorted_gym = [EXD[i]["difficulty"] for i in gym] == sorted(EXD[i]["difficulty"] for i in gym)
    pg.screenshot(path=os.path.join(OUT, "qa-desktop-selected.png"), timeout=120000)
    pg.get_by_role("tab", name="Calisthenics").click(); pg.wait_for_timeout(600)
    cali = list_ids(pg)
    want_cali = [e["id"] for e in EX if e["type"] == "calisthenics" and "biceps-brachii" in e["primaryMuscles"]]
    sorted_cali = [EXD[i]["difficulty"] for i in cali] == sorted(EXD[i]["difficulty"] for i in cali)
    # mở chi tiết bài đầu tiên có cơ phụ, bấm chip cơ phụ
    target = next(i for i in cali if EXD[i]["secondaryMuscles"])
    sec = EXD[target]["secondaryMuscles"][0]
    pg.click(f'li.ex[data-ex="{target}"] button.ex-head')
    pg.wait_for_timeout(700)
    detail_text = pg.inner_text(f'li.ex[data-ex="{target}"]')
    has_steps = all(s[:25] in detail_text for s in EXD[target]["steps"][:2])
    pg.screenshot(path=os.path.join(OUT, "qa-desktop-detail.png"), timeout=120000)
    pg.click(f'li.ex[data-ex="{target}"] [data-muscle="{sec}"]'); pg.wait_for_timeout(1200)
    chip_ok = pg.evaluate("window.__app.getSelected()") == sec and title(pg) == NAME[sec] and pg.evaluate("window.__mv._selected") == sec
    # bàn phím: mở bộ chọn, gõ không dấu, Enter
    pg.get_by_role("button", name="Chọn cơ").first.click(); pg.wait_for_timeout(600)
    pg.keyboard.type("co tam dau"); pg.wait_for_timeout(500)
    pg.keyboard.press("ArrowDown"); pg.keyboard.press("Enter"); pg.wait_for_timeout(1200)
    kb_sel = pg.evaluate("window.__app.getSelected()")
    # ngoại lệ C3 hiển thị lý do
    pg.evaluate("window.__app.selectMuscle('pectoralis-minor')"); pg.wait_for_timeout(800)
    exc_shown = pg.query_selector(".exc-note") is not None
    rec("C8_flows", tab0 == "gym" and sorted(gym) == sorted(want_gym) and len(gym) == len(set(gym)) and sorted_gym and sorted(cali) == sorted(want_cali) and len(cali) == len(set(cali)) and sorted_cali and has_steps and chip_ok and kb_sel == "triceps-brachii" and exc_shown,
        defaultTab=tab0, gymIds=len(gym), gymMatchesData=sorted(gym) == sorted(want_gym), gymSorted=sorted_gym, caliIds=len(cali), caliMatchesData=sorted(cali) == sorted(want_cali), caliSorted=sorted_cali,
        detail={"exercise": target, "stepsShown": has_steps, "chip": sec, "chipSelects": chip_ok}, keyboardSelected=kb_sel, exceptionNoteShown=exc_shown)

    # ---- C9: trang Nguồn & giấy phép
    pg.get_by_role("button", name="Nguồn & giấy phép").first.click()
    pg.wait_for_selector("dialog.dlg--sources[open]"); pg.wait_for_timeout(500)
    stext = pg.inner_text("dialog.dlg--sources[open]")
    norm = lambda s: unicodedata.normalize("NFC", " ".join(s.split()))
    pg.screenshot(path=os.path.join(OUT, "qa-sources.png"), timeout=120000)
    rec("C9_attribution", norm(ATTR) in norm(stext) and "Kevin-Mattheus-Moerman" in stext and "CC BY-SA 2.1" in stext,
        exactSentence=norm(ATTR) in norm(stext), mirrorNamed="Kevin-Mattheus-Moerman" in stext)
    pg.keyboard.press("Escape")
    pg.close()

    # ---- C8 mobile
    pg = page(b, {"width": 390, "height": 844})
    pg.evaluate("window.__app.selectMuscle('latissimus-dorsi')"); pg.wait_for_timeout(1500)
    ov = pg.evaluate("document.documentElement.scrollWidth > window.innerWidth")
    order = pg.evaluate("(()=>{const c=document.querySelector('canvas').getBoundingClientRect(),t=document.querySelector('#muscle-title').getBoundingClientRect();return c.top < t.top})()")
    pg.screenshot(path=os.path.join(OUT, "qa-mobile-selected.png"), full_page=True, timeout=120000)
    rec("C8_mobile", not ov and order and title(pg) == NAME["latissimus-dorsi"], horizontalOverflow=ov, modelAbovePanel=order)
    pg.close()
    b.close()

glb = os.path.getsize(os.path.join(ROOT, "public/models/muscles.glb"))
rec("C10_budget", glb <= 12 * 1024 * 1024 and stats["triangles"] <= 600000 and stats["drawCalls"] <= 150,
    glbBytes=glb, triangles=stats["triangles"], drawCalls=stats["drawCalls"], loadMs=stats["loadMs"], note="đo trong container SwiftShader; FPS máy thật chưa đo")
rec("C1_console", not errors, errors=errors[:10])
R["allPass"] = all(v["pass"] for v in R.values() if isinstance(v, dict))
print(json.dumps(R, ensure_ascii=False, indent=1))
sys.exit(0 if R["allPass"] else 1)
