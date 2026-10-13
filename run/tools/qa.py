"""N9 QA độc lập trên bản build production (vite preview).
Dùng: python3 -I run/tools/qa.py http://localhost:4181
Kiểm tra C1 (console), C2 (bấm từng cơ trong app thật), C8 (luồng sử dụng), C9 (ghi công), C10 (ngân sách).
In JSON, thoát 1 nếu có mục fail.
"""
import json, sys, os, re, unicodedata
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
R, errors, failed_urls = {}, [], []

def rec(k, ok, **ev):
    R[k] = {"pass": bool(ok), **ev}

def page(b, vp, lang="vi"):
    pg = b.new_page(viewport=vp)
    pg.on("console", lambda m: m.type == "error" and errors.append(m.text))
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.on("requestfailed", lambda r: failed_urls.append(r.url))
    # Container không ra được YouTube (proxy chặn): CHỈ hai tên miền này được thay bằng bản giả lập; mọi lỗi khác vẫn tính.
    pg.route(re.compile(r"^https://(i\.ytimg\.com|www\.youtube-nocookie\.com)/"), lambda route: route.fulfill(status=200, content_type="image/svg+xml" if "ytimg" in route.request.url else "text/html", body="<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'/>" if "ytimg" in route.request.url else "<!doctype html><title>stub</title>"))
    pg.goto(BASE + "/?lang=" + lang, wait_until="networkidle")
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
    # mở chi tiết bài; thẻ tối giản (v2): tên, mức, bước, video, 1 dòng an toàn — không nguồn, không chip, không lý do mức
    VIDS = json.load(open(os.path.join(ROOT, "src/data/videos.json"), encoding="utf-8"))
    target = next(i for i in cali if not VIDS[i].get("none"))
    pg.click(f'li.ex[data-ex="{target}"] button.ex-head')
    pg.wait_for_timeout(700)
    card = f'li.ex[data-ex="{target}"]'
    detail_text = pg.inner_text(card)
    has_steps = all(s[:25] in detail_text for s in EXD[target]["steps"][:2])
    minimal = {
        "noChips": pg.query_selector(f"{card} [data-muscle]") is None,
        "noBasis": EXD[target]["difficultyBasis"][:30] not in detail_text,
        "noSourceLinks": all(any(c in (a.get_attribute("class") or "") for c in ("yt-search",)) or a.evaluate("e=>!!e.closest('.vid-credit')") for a in pg.query_selector_all(f"{card} a[href^='http']")),
        "safetyLine": (EXD[target]["safety"] or [""])[0][:20] in detail_text,
    }
    pg.screenshot(path=os.path.join(OUT, "qa-desktop-detail.png"), timeout=120000)
    pg.click(f"{card} .vid-facade"); pg.wait_for_timeout(800)
    iframe_src = pg.evaluate(f"document.querySelector('{card} iframe')?.src || ''")
    video_ok = f"youtube-nocookie.com/embed/{VIDS[target]['youtubeId']}" in iframe_src
    # bài chưa có video → nút tìm YouTube đúng từ khoá
    pend = next(e for e in EX if VIDS[e["id"]].get("none") and e["primaryMuscles"])
    pg.evaluate(f"window.__app.selectMuscle('{pend['primaryMuscles'][0]}')"); pg.wait_for_timeout(600)
    pg.evaluate(f"window.__app.setTab('{pend['type']}')"); pg.wait_for_timeout(500)
    pg.click(f'li.ex[data-ex="{pend["id"]}"] button.ex-head'); pg.wait_for_timeout(500)
    href = pg.evaluate(f"document.querySelector('li.ex[data-ex=\"{pend['id']}\"] a.yt-search')?.href || ''")
    import urllib.parse as up
    search_ok = href.startswith("https://www.youtube.com/results?search_query=") and up.unquote_plus(href.split("=",1)[1]) == VIDS[pend["id"]]["query"]
    chip_ok = all(minimal.values()) and video_ok and search_ok
    sec = None
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
        detail={"exercise": target, "stepsShown": has_steps, "minimalCard": minimal, "iframeSrc": iframe_src, "videoOk": video_ok, "pendingExercise": pend["id"], "searchHref": href, "searchOk": search_ok}, keyboardSelected=kb_sel, exceptionNoteShown=exc_shown)

    # ---- C9: trang Nguồn & giấy phép
    pg.evaluate("window.__app.selectMuscle('biceps-brachii')"); pg.wait_for_timeout(500)
    header_src_btn = pg.evaluate("!![...document.querySelectorAll('header button, header a')].find(e=>/Nguồn|Sources/.test(e.textContent))")
    pg.click("footer .foot-src")
    pg.wait_for_selector("dialog.dlg--sources[open]"); pg.wait_for_timeout(500)
    stext = pg.inner_text("dialog.dlg--sources[open]")
    norm = lambda s: unicodedata.normalize("NFC", " ".join(s.split()))
    pg.screenshot(path=os.path.join(OUT, "qa-sources.png"), timeout=120000)
    anat = [x["url"] for x in next(m for m in json.load(open(os.path.join(ROOT,"src/data/muscles.json"),encoding="utf-8"))["muscles"] if m["id"]=="biceps-brachii")["sources"]]
    links = pg.evaluate("[...document.querySelectorAll('dialog.dlg--sources[open] a')].map(a=>a.href)")
    rec("C9_attribution", not header_src_btn and all(any(u.rstrip('/') in l for l in links) for u in anat) and norm(ATTR) in norm(stext) and "Kevin-Mattheus-Moerman" in stext and "CC BY-SA 2.1" in stext, headerHasSourcesButton=header_src_btn, currentMuscleSourcesListed=all(any(u.rstrip('/') in l for l in links) for u in anat),
        exactSentence=norm(ATTR) in norm(stext), mirrorNamed="Kevin-Mattheus-Moerman" in stext)
    pg.keyboard.press("Escape")
    pg.close()


    # ---- V2: ngôn ngữ EN thuần, nút đổi ngôn ngữ nhớ lựa chọn, tô màu đồ thị khi rê chuột
    VI_RE = re.compile("[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)
    pg = page(b, {"width": 1440, "height": 900}, lang="en")
    leaks = []
    for mid in ["biceps-brachii", "pectoralis-minor", "latissimus-dorsi", "gastrocnemius"]:
        pg.evaluate(f"window.__app.selectMuscle('{mid}')"); pg.wait_for_timeout(400)
        for tab in ["gym", "calisthenics"]:
            pg.evaluate(f"window.__app.setTab('{tab}')"); pg.wait_for_timeout(300)
            first = pg.query_selector("section.tabpanel li.ex button.ex-head")
            if first: first.click(); pg.wait_for_timeout(300)
            txt = pg.inner_text("body")
            leaks += [f"{mid}/{tab}: {m.group(0)} …{txt[max(0,m.start()-25):m.start()+25]!r}" for m in list(VI_RE.finditer(txt))[:2]]
    pg.screenshot(path=os.path.join(OUT, "qa-en.png"), timeout=120000)
    en_html_lang = pg.evaluate("document.documentElement.lang")
    pg.click("button[aria-label='Tiếng Việt']"); pg.wait_for_timeout(800)
    vi_live = pg.evaluate("document.documentElement.lang") == "vi" and "Chọn cơ" in pg.inner_text("header")
    pg.reload(wait_until="networkidle"); pg.wait_for_function("window.__app", timeout=60000); pg.wait_for_timeout(800)
    vi_persist = pg.evaluate("window.__app.getLang()") == "vi"
    rec("V2_language", not leaks and en_html_lang == "en" and vi_live and vi_persist, enVietnameseLeaks=leaks[:6], enHtmlLang=en_html_lang, switchedLiveToVi=vi_live, persistedAfterReload=vi_persist)
    # tô màu đồ thị: độc lập với script của nút V4 — tính kỳ vọng từ muscle-colors.json + palette.js
    COL = json.load(open(os.path.join(ROOT, "src/data/muscle-colors.json"), encoding="utf-8"))
    pal_src = open(os.path.join(ROOT, "src/viewer/palette.js"), encoding="utf-8").read()
    clay = re.search(r'clay:\s*"(#[0-9a-fA-F]{6})"', pal_src).group(1).lower()
    nb = {}
    for a2, b2, _n in COL["edges"]: nb.setdefault(a2, set()).add(b2); nb.setdefault(b2, set()).add(a2)
    pg.evaluate("window.__app.selectMuscle(null)"); pg.mouse.move(5, 5); pg.wait_for_timeout(600)
    default_clay = all(pg.evaluate(f"window.__mv.getUnitColor('{m['id']}')").lower() == clay for m in M)
    hov = {}
    for mid in ["deltoid-lateral", "vasti", "erector-spinae", "external-oblique"]:
        pt2 = pg.evaluate(f"window.__mv.screenPointOf('{mid}')")
        pg.mouse.move(5, 5); pg.wait_for_timeout(300)
        pg.mouse.move(pt2["x"], pt2["y"]); pg.wait_for_timeout(700)
        got = pg.evaluate("window.__mv.getHovered ? window.__mv.getHovered() : null")
        if got != mid:
            hov[mid] = {"ok": False, "hovered": got}; continue
        bad2 = []
        for m in M:
            want = COL["palette"][COL["colors"][m["id"]]].lower() if (m["id"] == mid or m["id"] in nb.get(mid, ())) else clay
            have = pg.evaluate(f"window.__mv.getUnitColor('{m['id']}')").lower()
            if have != want: bad2.append((m["id"], have, want))
        hov[mid] = {"ok": not bad2, "lit": 1 + len(nb.get(mid, ())), "wrong": bad2[:4]}
    pg.mouse.move(5, 5); pg.wait_for_timeout(500)
    back_clay = all(pg.evaluate(f"window.__mv.getUnitColor('{m['id']}')").lower() == clay for m in M)
    rec("V2_graph_colouring", default_clay and back_clay and all(v["ok"] for v in hov.values()), defaultAllClay=default_clay, hover=hov, backToClayAfterLeave=back_clay)
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
rec("C1_console", not errors and not failed_urls, errors=errors[:10], failedRequests=failed_urls[:10], note="i.ytimg.com và youtube-nocookie.com được giả lập vì container bị chặn mạng; phát video thật cần kiểm trên máy có mạng")
R["allPass"] = all(v["pass"] for v in R.values() if isinstance(v, dict))
print(json.dumps(R, ensure_ascii=False, indent=1))
sys.exit(0 if R["allPass"] else 1)
