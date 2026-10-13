"""Kiểm tra giao diện cho nút V5 (ui): ngôn ngữ VI/EN, thẻ bài tối giản, video, nguồn ở chân trang, tô màu khi rê.

python3 -I run/tools/v5_verify.py [http://localhost:5197/] [run/screenshots]
In ra từng mục PASS/FAIL kèm số liệu; mã thoát 1 nếu có mục FAIL.

Ghi chú: máy kiểm thử không ra được i.ytimg.com / youtube-nocookie.com (proxy chặn), nên ảnh xem trước và
trình phát được thay bằng bản giả cục bộ qua page.route — kiểm tra vẫn đọc đúng URL mà trang yêu cầu.
"""
import json
import os
import re
import sys
from urllib.parse import quote

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5197/"
OUT = sys.argv[2] if len(sys.argv) > 2 else "run/screenshots"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
ATTR = "BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan"
VI_RE = re.compile("[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


M = load("src/data/muscles.json")
MUSCLES = M["muscles"]
MBY = {m["id"]: m for m in MUSCLES}
EX = load("src/data/exercises.json")
EXBY = {e["id"]: e for e in EX}
VID = load("src/data/videos.json")
SRC = load("src/data/sources.json")
COL = load("src/data/muscle-colors.json")
ENM = load("src/data/i18n/en-meta.json")
ENX = {**load("src/data/i18n/en-gym.json"), **load("src/data/i18n/en-calisthenics.json")}
with open(os.path.join(ROOT, "src/viewer/palette.js"), encoding="utf-8") as f:
    _pal = f.read()
CLAY = re.search(r'\bclay:\s*"(#[0-9a-fA-F]{6})"', _pal).group(1).lower()
PAL = [c.lower() for c in COL["palette"]]
NBRS = {}
for a, b, *_ in COL["edges"]:
    NBRS.setdefault(a, set()).add(b)
    NBRS.setdefault(b, set()).add(a)


def ex_list(mid, tab):
    lst = [e for e in EX if e["type"] == tab and mid in e["primaryMuscles"]]
    return lst


def enc(s):  # encodeURIComponent
    return quote(s, safe="-_.!~*'()")


# chuỗi giao diện đặc trưng của từng ngôn ngữ
# nhãn mục viết hoa bằng CSS (text-transform) nên innerText trả về chữ hoa
VI_UI = ["Mặt trước", "Mặt sau", "Chọn được", "Đang chọn", "CHỨC NĂNG", "Tất cả cơ", "Lưu ý sức khoẻ.", "Nguồn", "AN TOÀN", "Mức "]
# (không dùng "Front"/"Back": tên bài tiếng Việt có kèm tên gốc trong ngoặc, ví dụ "(front lever)")
EN_ONLY = ["Search YouTube", "Selectable", "Reset view", "FUNCTION", "All muscles", "Health note", "Sources", "Level ",
           "SAFETY", "Video by", "Hover a muscle", "Tap a muscle", "sorted from easy to hard", "Find a muscle"]
EN_UI = ["Front", "Back", "Selectable", "Selected", "FUNCTION", "All muscles", "Health note.", "Sources", "SAFETY", "Level "]

results = []
console_errors = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""), flush=True)


THUMB_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">'
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a3d35"/>'
    '<stop offset="1" stop-color="#1f1915"/></linearGradient></defs><rect width="480" height="360" fill="url(#g)"/>'
    '<text x="240" y="300" fill="#b9ada3" font-family="sans-serif" font-size="16" text-anchor="middle">'
    'thumbnail (offline stub)</text></svg>'
)


def stub_routes(ctx):
    ctx.route("https://i.ytimg.com/**", lambda r: r.fulfill(status=200, content_type="image/svg+xml", body=THUMB_SVG))
    ctx.route(
        "https://www.youtube-nocookie.com/**",
        lambda r: r.fulfill(status=200, content_type="text/html",
                            body="<body style='margin:0;background:#000;color:#ccc;font:14px sans-serif;display:grid;place-items:center;height:100vh'>YouTube embed (offline stub)</body>"),
    )


def new_page(browser, url, **ctx_opts):
    ctx = browser.new_context(reduced_motion="reduce", **ctx_opts)
    stub_routes(ctx)
    pg = ctx.new_page()
    tag = url.replace(BASE, "/")

    def on_console(m):
        if m.type == "error":
            console_errors.append(f"{tag}: {m.text}")

    pg.on("console", on_console)
    pg.on("pageerror", lambda e: console_errors.append(f"{tag}: pageerror {e}"))
    pg.goto(url)
    wait_ready(pg)
    return ctx, pg


def wait_ready(pg):
    pg.wait_for_function("window.__mv && window.__mv.model && window.__app", timeout=180000)
    pg.wait_for_selector(".viewer-zoom", timeout=60000)
    pg.wait_for_timeout(500)


def body_text(pg):
    return pg.evaluate("document.body.innerText")


def select(pg, mid, tab="gym"):
    pg.evaluate(f"window.__app.selectMuscle({json.dumps(mid)})")
    pg.evaluate(f"window.__app.setTab({json.dumps(tab)})")
    pg.wait_for_timeout(60)


def expand_all(pg):
    pg.evaluate("document.querySelectorAll('.ex-head[aria-expanded=\"false\"]').forEach(b => b.click())")
    pg.wait_for_timeout(60)


def open_ex(pg, ex_id):
    pg.click(f'li.ex[data-ex="{ex_id}"] .ex-head')
    pg.wait_for_selector(f'li.ex[data-ex="{ex_id}"] .ex-body')


def card_report(pg, ex_id):
    return pg.evaluate(
        """id => {
        const li = document.querySelector(`li.ex[data-ex="${id}"]`);
        if (!li) return null;
        const q = s => li.querySelector(s);
        return {
          name: q('.ex-name')?.textContent.trim() || '',
          badge: q('.diff-text')?.textContent.trim() || '',
          steps: li.querySelectorAll('.steps li').length,
          facade: !!q('.vid-facade'), iframe: !!q('.vid-frame iframe'), search: q('a.yt-search')?.href || null,
          safety: q('.ex-safety')?.textContent.trim() || '',
          links: [...li.querySelectorAll('a')].map(a => a.href),
          chips: li.querySelectorAll('[data-muscle], .chip, .chips').length,
          extra: li.querySelectorAll('.ex-basis, .ex-equip, .ex-en, .srcs, .ex-muscles').length,
          text: li.innerText,
        };
    }""",
        ex_id,
    )


def main():
    os.makedirs(OUT, exist_ok=True)
    # bài mẫu: bài đầu tiên (dễ nhất) có video của cơ nhị đầu; bài "pending" đầu tiên trong dữ liệu
    vid_mid = "biceps-brachii"
    vid_ex = next(e for e in ex_list(vid_mid, "gym") if not VID[e["id"]].get("none"))
    pend_id = next(k for k, v in VID.items() if v.get("none"))
    pend_ex = EXBY[pend_id]
    pend_mid, pend_tab = pend_ex["primaryMuscles"][0], pend_ex["type"]

    with sync_playwright() as p:
        browser = p.chromium.launch(args=GL)

        # ------------------------------------------------------------------ (a) EN thuần
        ctx, pg = new_page(browser, BASE + "?lang=en", viewport={"width": 1440, "height": 900}, locale="en-US")
        t0 = body_text(pg)
        doc = pg.evaluate("({lang: document.documentElement.lang, title: document.title, desc: document.querySelector('meta[name=description]').content})")
        check("a0_en_document", doc["lang"] == "en" and doc["title"] == "3D Muscle Map" and not VI_RE.search(doc["desc"]), json.dumps(doc))
        check("a1_en_empty_state_no_vi", not VI_RE.search(t0), (VI_RE.findall(t0)[:5], t0[:80]))
        # bộ chọn cơ (EN): tìm theo tên Anh và Latin
        pg.click(".site-nav .btn--ghost")
        pg.wait_for_selector("dialog.dlg--picker[open] input[type=search]")
        tp = body_text(pg)
        pg.fill("dialog.dlg--picker[open] input[type=search]", "upper chest")
        hits_en = pg.eval_on_selector_all("dialog.dlg--picker[open] .picker-opt", "els => els.map(e => e.dataset.muscle)")
        pg.fill("dialog.dlg--picker[open] input[type=search]", "musculi pectoralis")
        hits_la = pg.eval_on_selector_all("dialog.dlg--picker[open] .picker-opt", "els => els.map(e => e.dataset.muscle)")
        pg.fill("dialog.dlg--picker[open] input[type=search]", "nhi dau")
        hits_vi = pg.eval_on_selector_all("dialog.dlg--picker[open] .picker-opt", "els => els.map(e => e.dataset.muscle)")
        tp2 = body_text(pg)
        pg.keyboard.press("Escape")
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(100)
        check("a2_en_picker", not VI_RE.search(tp) and not VI_RE.search(tp2) and "pectoralis-major-clavicular" in hits_en
              and len(hits_la) >= 2 and hits_vi == [],
              f"upper chest→{hits_en}; latin→{len(hits_la)}; 'nhi dau'→{hits_vi}")
        # chọn cơ bằng cách bấm trên mô hình, mở bài có video
        pt = pg.evaluate(f"window.__mv.screenPointOf('{vid_mid}')")
        for _ in range(pt["clicks"]):
            pg.mouse.click(pt["x"], pt["y"])
            pg.wait_for_timeout(250)
        sel = pg.evaluate("window.__app.getSelected()")
        open_ex(pg, vid_ex["id"])
        pg.mouse.move(5, 300)
        pg.wait_for_timeout(200)
        t1 = body_text(pg)
        pg.evaluate(f"document.getElementById('ex-{vid_ex['id']}').scrollIntoView({{block: 'start'}})")
        heading = pg.inner_text("#muscle-title")
        check("a3_en_selected_open_no_vi", sel == vid_mid and heading == ENM["muscles"][vid_mid]["name"] and not VI_RE.search(t1),
              f"sel={sel} heading={heading!r} vi={VI_RE.findall(t1)[:5]}")
        check("a4_en_ui_strings", all(s in t1 for s in EN_UI), [s for s in EN_UI if s not in t1])
        pg.screenshot(path=os.path.join(OUT, "v5-desktop-en.png"))
        # quét toàn bộ 40 cơ × 2 tab, mở hết các bài
        bad = []
        n_states = n_cards = 0
        for m in MUSCLES:
            for tab in ("gym", "calisthenics"):
                select(pg, m["id"], tab)
                expand_all(pg)
                n_states += 1
                n_cards += pg.evaluate("document.querySelectorAll('li.ex.is-open').length")
                tx = body_text(pg)
                if VI_RE.search(tx):
                    i = VI_RE.search(tx).start()
                    bad.append((m["id"], tab, tx[max(0, i - 40): i + 20]))
        want_cards = sum(len(ex_list(m["id"], t)) for m in MUSCLES for t in ("gym", "calisthenics"))
        check("a5_en_sweep_all_muscles_tabs_no_vi", not bad and n_cards == want_cards, f"states={n_states} openCards={n_cards}/{want_cards} (299 bài, tính lặp khi nhiều cơ chính) bad={bad[:3]}")

        # ------------------------------------------------------------------ (d)(e) thẻ bài + video (EN)
        select(pg, vid_mid, "gym")
        open_ex(pg, vid_ex["id"])
        c = card_report(pg, vid_ex["id"])
        v = VID[vid_ex["id"]]
        allowed = {v.get("channelUrl")}
        src_urls = {s["url"] for s in vid_ex["sources"]}
        check("d1_card_minimal_en",
              c["name"] == ENX[vid_ex["id"]]["name"] and re.match(r"^Level [1-5] · \S", c["badge"]) and c["steps"] == len(ENX[vid_ex["id"]]["steps"])
              and c["facade"] and c["safety"].upper().startswith("SAFETY") and " · ".join(ENX[vid_ex["id"]]["safety"]) in c["safety"]
              and set(c["links"]) <= allowed and not (set(c["links"]) & src_urls) and c["chips"] == 0 and c["extra"] == 0
              and "why" not in c["text"].lower(),
              {k: c[k] for k in ("name", "badge", "steps", "facade", "links", "chips", "extra")})
        fac = pg.eval_on_selector(f'li.ex[data-ex="{vid_ex["id"]}"] .vid-facade',
                                  "b => ({label: b.getAttribute('aria-label'), img: b.querySelector('img').src, lazy: b.querySelector('img').loading})")
        credit = pg.eval_on_selector(f'li.ex[data-ex="{vid_ex["id"]}"] .vid-credit a', "a => ({t: a.textContent, href: a.href, rel: a.rel})")
        pg.click(f'li.ex[data-ex="{vid_ex["id"]}"] .vid-facade')
        pg.wait_for_selector(f'li.ex[data-ex="{vid_ex["id"]}"] .vid-frame iframe')
        ifr = pg.eval_on_selector(f'li.ex[data-ex="{vid_ex["id"]}"] .vid-frame iframe',
                                  "f => ({src: f.src, title: f.title, allow: f.getAttribute('allow'), fs: f.hasAttribute('allowfullscreen'), w: f.getBoundingClientRect().width, h: f.getBoundingClientRect().height})")
        yid = v["youtubeId"]
        check("e1_facade_then_iframe",
              fac["img"] == f"https://i.ytimg.com/vi/{yid}/hqdefault.jpg" and fac["lazy"] == "lazy" and v["title"] in fac["label"]
              and f"youtube-nocookie.com/embed/{yid}" in ifr["src"] and "autoplay=1" in ifr["src"] and "rel=0" in ifr["src"]
              and ifr["title"] == v["title"] and ifr["allow"] == "autoplay; encrypted-media; picture-in-picture" and ifr["fs"]
              and abs(ifr["w"] / ifr["h"] - 16 / 9) < 0.02
              and credit["t"] == v["channel"] and credit["href"].rstrip("/") == v["channelUrl"].rstrip("/") and "noopener" in credit["rel"],
              f"id={yid} src={ifr['src']} ratio={ifr['w'] / ifr['h']:.3f} credit={credit['t']}")
        # chỉ một trình phát: mở bài có video thứ hai, bấm phát → trình phát thứ nhất trở về ảnh
        other = next((e for e in ex_list(vid_mid, "gym") if e["id"] != vid_ex["id"] and not VID[e["id"]].get("none")), None)
        if other:
            open_ex(pg, other["id"])
            pg.click(f'li.ex[data-ex="{other["id"]}"] .vid-facade')
            pg.wait_for_timeout(150)
            n_ifr = pg.evaluate("document.querySelectorAll('.vid-frame iframe').length")
            check("e2_single_player", n_ifr == 1, f"iframes={n_ifr}")

        # ------------------------------------------------------------------ (f) bài chưa có video
        select(pg, pend_mid, pend_tab)
        open_ex(pg, pend_id)
        c2 = card_report(pg, pend_id)
        want_q = VID[pend_id].get("query") or ENX[pend_id]["name"]
        want = "https://www.youtube.com/results?search_query=" + enc(want_q)
        attrs = pg.eval_on_selector(f'li.ex[data-ex="{pend_id}"] a.yt-search', "a => ({t: a.textContent, target: a.target, rel: a.rel})")
        check("f1_pending_search_link", c2["search"] == want and not c2["facade"] and attrs["target"] == "_blank"
              and "Search YouTube for a video" in attrs["t"] and "noopener" in attrs["rel"],
              f"{pend_id}: {c2['search']}")

        # ------------------------------------------------------------------ (h) rê chuột tô màu trong ứng dụng
        pg.evaluate("window.__app.selectMuscle(null)")
        hov_ok = []
        for hid in ("biceps-brachii", "rectus-abdominis", "gluteus-maximus"):
            pt = pg.evaluate(f"window.__mv.screenPointOf('{hid}')")
            if not pt or pt["clicks"] != 1:
                continue
            pg.mouse.move(pt["x"] - 3, pt["y"])
            pg.mouse.move(pt["x"], pt["y"])
            try:
                pg.wait_for_function(f"window.__mv.getHovered() === '{hid}'", timeout=8000)
            except Exception:
                pass
            got = pg.evaluate("window.__mv.getHovered()")
            ids = [m["id"] for m in MUSCLES]
            cur = pg.evaluate("ids => Object.fromEntries(ids.map(id => [id, (window.__mv.getUnitColor(id) || '').toLowerCase()]))", ids)
            hood = {hid} | NBRS.get(hid, set())
            wrong = [k for k in hood if cur[k] != PAL[COL["colors"][k]]]
            stray = [k for k in ids if k not in hood and cur[k] != CLAY]
            tip = pg.evaluate("document.querySelector('.viewer-tip.is-on')?.textContent || ''")
            hov_ok.append((hid, got == hid and not wrong and not stray and tip == ENM["muscles"][hid]["name"], len(hood), wrong[:3], stray[:3], tip))
            pg.mouse.move(5, 300)
            pg.wait_for_timeout(200)
        check("h1_hover_colours_neighbours", len(hov_ok) >= 2 and all(x[1] for x in hov_ok), hov_ok)
        leg = pg.evaluate("""(() => { const l = document.querySelector('.legend'); return l ? {t: l.innerText,
            sw: [...l.querySelectorAll('.legend-keys i')].map(i => getComputedStyle(i).backgroundColor)} : null })()""")
        check("h2_legend", leg and "Selectable" in leg["t"] and "Selected" in leg["t"] and "Hover a muscle" in leg["t"]
              and leg["sw"] == ["rgb(217, 213, 206)", "rgb(208, 28, 139)"], leg)

        # ------------------------------------------------------------------ (g) nguồn (EN)
        select(pg, vid_mid, "gym")
        open_ex(pg, vid_ex["id"])
        head_btns = pg.eval_on_selector_all(".site-head button, .site-head a", "els => els.map(e => (e.innerText + ' ' + (e.getAttribute('aria-label') || '')).trim())")
        check("g1_header_no_sources_button", not any(re.search(r"source|nguồn", b, re.I) for b in head_btns), head_btns)
        last_btn = pg.evaluate("(() => { const all = [...document.querySelectorAll('button, a[href]')].filter(e => e.offsetParent && !e.closest('dialog')); return all[all.length - 1]?.textContent.trim() })()")
        pg.click("footer.site-foot .foot-src")
        pg.wait_for_selector("dialog.dlg--sources[open] .cur")
        dtext = pg.inner_text("dialog.dlg--sources[open]")
        anat = [s["url"] for s in MBY[vid_mid]["sources"]]
        dl = pg.eval_on_selector_all("dialog.dlg--sources[open] .cur a", "els => els.map(a => a.href)")
        ex_urls = {s["url"] for e in ex_list(vid_mid, "gym") for s in e["sources"]}
        n_vid_rows = pg.eval_on_selector_all("dialog.dlg--sources[open] .cur-ex > li", "els => els.length")
        check("g2_sources_dialog_en",
              last_btn == "Sources" and ATTR in dtext and all(u in dl for u in anat) and ex_urls <= set(dl)
              and f"https://www.youtube.com/watch?v={yid}" in dl and v["channel"] in dtext and n_vid_rows == len(ex_list(vid_mid, "gym"))
              and "Videos are embedded from YouTube" in dtext and "Sources for what is on screen" in dtext,
              f"last={last_btn!r} anat={sum(u in dl for u in anat)}/{len(anat)} exSrc={len(ex_urls & set(dl))}/{len(ex_urls)} rows={n_vid_rows}")
        pg.screenshot(path=os.path.join(OUT, "v5-sources-en.png"))
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(150)
        # nguồn ngoại lệ hiện khi có ghi chú
        exc_mid = next(mid for mid, v2 in load("src/data/exceptions.json").items() if "gym" in v2 and len(ex_list(mid, "gym")) < 3)
        select(pg, exc_mid, "gym")
        exc_note = pg.evaluate("document.querySelector('.exc-note')?.innerText || ''")
        pg.click("footer.site-foot .foot-src")
        pg.wait_for_selector("dialog.dlg--sources[open] .cur")
        dl2 = pg.eval_on_selector_all("dialog.dlg--sources[open] [data-src=exception] a", "els => els.map(a => a.href)")
        exc_src = load("src/data/exceptions.json")[exc_mid]["gym"]["sources"]
        check("g3_exception_text_en_sources_in_dialog",
              ENM["exceptions"][exc_mid]["gym"][:60] in exc_note and not VI_RE.search(exc_note) and len(exc_note) > 0
              and all(u in dl2 for u in exc_src) and pg.evaluate("document.querySelectorAll('.exc-note a').length") == 0,
              f"{exc_mid}: {sum(u in dl2 for u in exc_src)}/{len(exc_src)}")
        pg.keyboard.press("Escape")
        ctx.close()

        # ------------------------------------------------------------------ (b) VI thuần
        ctx, pg = new_page(browser, BASE + "?lang=vi", viewport={"width": 1440, "height": 900}, locale="en-US")
        doc = pg.evaluate("({lang: document.documentElement.lang, title: document.title})")
        t0 = body_text(pg)
        check("b0_vi_document", doc["lang"] == "vi" and doc["title"] == "Bản đồ cơ bắp 3D" and "Chọn một cơ" in t0, json.dumps(doc, ensure_ascii=False))
        pg.click(".site-nav .btn--ghost")
        pg.wait_for_selector("dialog.dlg--picker[open] input[type=search]")
        pg.fill("dialog.dlg--picker[open] input[type=search]", "nhi dau")
        hits_vi = pg.eval_on_selector_all("dialog.dlg--picker[open] .picker-opt", "els => els.map(e => e.dataset.muscle)")
        pg.fill("dialog.dlg--picker[open] input[type=search]", "upper chest")
        hits_en_in_vi = pg.eval_on_selector_all("dialog.dlg--picker[open] .picker-opt", "els => els.map(e => e.dataset.muscle)")
        pg.keyboard.press("Escape")
        pg.keyboard.press("Escape")
        check("b1_vi_picker_no_diacritics", "biceps-brachii" in hits_vi, f"'nhi dau'→{hits_vi}; 'upper chest'→{hits_en_in_vi}")
        select(pg, vid_mid, "gym")
        open_ex(pg, vid_ex["id"])
        pg.mouse.move(5, 300)
        t1 = body_text(pg)
        check("b2_vi_ui_strings", all(s in t1 for s in VI_UI) and pg.inner_text("#muscle-title") == MBY[vid_mid]["nameVi"],
              [s for s in VI_UI if s not in t1])
        bad = []
        for m in MUSCLES:
            for tab in ("gym", "calisthenics"):
                select(pg, m["id"], tab)
                expand_all(pg)
                tx = body_text(pg)
                hit = [s for s in EN_ONLY if s in tx]
                if hit:
                    bad.append((m["id"], tab, hit))
                if m["nameEn"] in tx and m["nameEn"] not in m["nameVi"]:
                    bad.append((m["id"], tab, "nameEn shown"))
        check("b3_vi_sweep_no_en_ui", not bad, bad[:4])
        select(pg, vid_mid, "gym")
        open_ex(pg, vid_ex["id"])
        c = card_report(pg, vid_ex["id"])
        check("d2_card_minimal_vi",
              c["name"] == vid_ex["nameVi"] and re.match(r"^Mức [1-5] · \S", c["badge"]) and c["steps"] == len(vid_ex["steps"]) and c["facade"]
              and c["safety"].upper().startswith("AN TOÀN") and " · ".join(vid_ex["safety"]) in c["safety"] and c["chips"] == 0 and c["extra"] == 0
              and not (set(c["links"]) & {s["url"] for s in vid_ex["sources"]}) and "Vì sao mức" not in c["text"] and "Video:" in c["text"],
              {k: c[k] for k in ("name", "badge", "steps", "links", "chips", "extra")})
        pg.mouse.move(5, 300)
        pg.evaluate(f"document.getElementById('ex-{vid_ex['id']}').scrollIntoView({{block: 'start'}})")
        pg.wait_for_timeout(150)
        pg.screenshot(path=os.path.join(OUT, "v5-desktop-vi.png"))
        select(pg, pend_mid, pend_tab)
        open_ex(pg, pend_id)
        st = pg.inner_text(f'li.ex[data-ex="{pend_id}"] a.yt-search')
        check("f2_pending_vi_label", "Tìm video trên YouTube" in st, st)
        head_btns = pg.eval_on_selector_all(".site-head button, .site-head a", "els => els.map(e => (e.innerText + ' ' + (e.getAttribute('aria-label') || '')).trim())")
        pg.click("footer.site-foot .foot-src")
        pg.wait_for_selector("dialog.dlg--sources[open] .cur")
        dtext = pg.inner_text("dialog.dlg--sources[open]")
        dl = pg.eval_on_selector_all("dialog.dlg--sources[open] .cur a", "els => els.map(a => a.href)")
        anat = [s["url"] for s in MBY[pend_mid]["sources"]]
        check("g4_sources_dialog_vi", not any(re.search(r"source|nguồn", b, re.I) for b in head_btns) and ATTR in dtext
              and all(u in dl for u in anat) and "Nguồn cho nội dung đang xem" in dtext and "nhúng từ YouTube" in dtext
              and "Chưa có video đã xác minh" in dtext and pg.inner_text("dialog.dlg--sources[open] .dlg-title") == "Nguồn & giấy phép",
              f"anat={sum(u in dl for u in anat)}/{len(anat)} head={head_btns}")
        pg.keyboard.press("Escape")
        ctx.close()

        # ------------------------------------------------------------------ (c) nút đổi ngôn ngữ + nhớ
        ctx, pg = new_page(browser, BASE, viewport={"width": 1280, "height": 800}, locale="en-US")
        l0 = pg.evaluate("window.__app.getLang()")
        select(pg, vid_mid, "gym")
        h_en = pg.inner_text("#muscle-title")
        pg.click('.lang button[data-lang="vi"]')
        pg.wait_for_function("document.documentElement.lang === 'vi'")
        h_vi = pg.inner_text("#muscle-title")
        tvi = body_text(pg)
        pressed = pg.eval_on_selector_all(".lang button", "els => els.map(e => e.dataset.lang + ':' + e.getAttribute('aria-pressed'))")
        pg.reload()
        wait_ready(pg)
        l1 = pg.evaluate("window.__app.getLang()")
        h_vi2 = pg.inner_text("#muscle-title")
        pg.click('.lang button[data-lang="en"]')
        pg.wait_for_function("document.documentElement.lang === 'en'")
        tl = body_text(pg)
        pg.reload()
        wait_ready(pg)
        l2 = pg.evaluate("window.__app.getLang()")
        # ?lang trên URL thắng lựa chọn đã lưu; bấm nút thì cập nhật cả tham số URL
        pg.goto(BASE + "?lang=vi#co=" + vid_mid)
        wait_ready(pg)
        l3 = pg.evaluate("window.__app.getLang()")
        pg.click('.lang button[data-lang="en"]')
        pg.wait_for_function("document.documentElement.lang === 'en'")
        url_after = pg.url
        r_api = pg.evaluate("window.__app.setLang('vi')")
        check("c1_toggle_live_and_persist",
              l0 == "en" and h_en == ENM["muscles"][vid_mid]["name"] and h_vi == MBY[vid_mid]["nameVi"] and "Mặt trước" in tvi
              and pressed == ["vi:true", "en:false"] and l1 == "vi" and h_vi2 == MBY[vid_mid]["nameVi"] and not VI_RE.search(tl)
              and l2 == "en" and l3 == "vi" and "lang=en" in url_after and r_api == "vi",
              f"default={l0} afterReload={l1}/{l2} urlParam={l3} url={url_after} api={r_api}")
        ctx.close()

        # ------------------------------------------------------------------ (i) điện thoại 390×844
        ctx, pg = new_page(browser, BASE + "?lang=en", viewport={"width": 390, "height": 844}, device_scale_factor=2,
                           is_mobile=True, has_touch=True, locale="en-US")
        ov0 = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        tog = pg.eval_on_selector(".lang", "e => { const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, t: r.top, b: r.bottom, vis: getComputedStyle(e).visibility} }")
        hint = pg.inner_text(".viewer-hint")
        leg_m = pg.evaluate("(() => { const l = document.querySelector('.legend'); const r = l.getBoundingClientRect(); return {t: l.innerText, vis: r.width > 0 && r.right <= window.innerWidth} })()")
        select(pg, vid_mid, "gym")
        open_ex(pg, vid_ex["id"])
        ov1 = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        wide = pg.evaluate("[...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > window.innerWidth + 1 || r.left < -1) && !e.closest('dialog') && getComputedStyle(e).position !== 'absolute' }).slice(0, 5).map(e => e.className)")
        order = pg.evaluate("document.querySelector('.viewer').getBoundingClientRect().bottom <= document.querySelector('.panel').getBoundingClientRect().top + 1")
        tm = body_text(pg)
        check("i1_mobile_layout", ov0 <= 0 and ov1 <= 0 and tog["r"] <= 390 and tog["l"] >= 0 and tog["b"] <= 60 and order and not wide
              and "pinch" in hint and leg_m["vis"] and "Tap a muscle" in leg_m["t"] and not VI_RE.search(tm),
              f"overflow={ov0}/{ov1} toggle={tog} modelAbovePanel={order} wide={wide} hint={hint!r} legend={leg_m}")
        pg.evaluate(f"document.getElementById('ex-{vid_ex['id']}').scrollIntoView({{block: 'start'}}); window.scrollBy(0, -110)")
        pg.wait_for_timeout(200)
        pg.screenshot(path=os.path.join(OUT, "v5-mobile-en.png"))
        pg.click("footer.site-foot .foot-src")
        pg.wait_for_selector("dialog.dlg--sources[open] .cur")
        ov2 = pg.evaluate("(() => { const d = document.querySelector('dialog[open] .dlg-body'); return d.scrollWidth - d.clientWidth })()")
        check("i2_mobile_sources_dialog_fits", ov2 <= 0, f"dialogOverflow={ov2}")
        pg.keyboard.press("Escape")
        ctx.close()

        # ------------------------------------------------------------------ (k) bàn phím: tab, mở bài, phát video
        ctx, pg = new_page(browser, BASE + "?lang=en#co=" + vid_mid + "&tab=gym", viewport={"width": 1280, "height": 800}, locale="en-US")
        pg.focus(f'li.ex[data-ex="{vid_ex["id"]}"] .ex-head')
        pg.keyboard.press("Enter")
        pg.wait_for_selector(f'li.ex[data-ex="{vid_ex["id"]}"] .vid-facade')
        pg.focus(f'li.ex[data-ex="{vid_ex["id"]}"] .vid-facade')
        pg.keyboard.press("Enter")
        pg.wait_for_selector(f'li.ex[data-ex="{vid_ex["id"]}"] iframe')
        pg.focus("#tab-gym")
        pg.keyboard.press("ArrowRight")
        kb_tab = pg.evaluate("window.__app.getTab()")
        check("k1_keyboard", kb_tab == "calisthenics", f"tab={kb_tab}")
        ctx.close()

        browser.close()

    check("j1_console_errors_zero", not console_errors, console_errors[:5])
    n_fail = sum(1 for _, ok, _ in results if not ok)
    print(f"\n{len(results) - n_fail}/{len(results)} PASS", flush=True)
    sys.exit(1 if n_fail else 0)


if __name__ == "__main__":
    main()
