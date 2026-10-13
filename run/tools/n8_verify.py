"""Kiểm tra nhanh giao diện cho nút N8 (ui).

python3 -I run/tools/n8_verify.py http://localhost:5193/ run/screenshots
In ra từng mục PASS/FAIL kèm số liệu; mã thoát 1 nếu có mục FAIL.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

BASE, OUT = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
ATTR = "BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan"

M = json.load(open(os.path.join(ROOT, "src/data/muscles.json"), encoding="utf-8"))
EX = {e["id"]: e for e in json.load(open(os.path.join(ROOT, "src/data/exercises.json"), encoding="utf-8"))}
EXC = json.load(open(os.path.join(ROOT, "src/data/exceptions.json"), encoding="utf-8"))
NAME = {m["id"]: m["nameVi"] for m in M["muscles"]}

results = []
errors = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""), flush=True)


def wait_ready(pg):
    pg.wait_for_function("window.__mv && window.__mv.model && window.__app", timeout=120000)
    pg.wait_for_selector(".viewer-zoom", timeout=60000)
    pg.wait_for_timeout(800)


def wait_idle(pg, ms=15000):
    try:
        pg.wait_for_function("window.__mv && window.__mv.isIdle()", timeout=ms)
    except Exception:
        pass


def heading(pg):
    el = pg.query_selector("#muscle-title")
    return el.inner_text().strip() if el else None


def list_check(pg, tab):
    """DOM list == app list, difficulties non-decreasing, all have the muscle as primary, right type."""
    st = pg.evaluate("window.__app.getState()")
    dom = pg.eval_on_selector_all(f'.ex-list[data-list="{tab}"] > li.ex', "els => els.map(e => e.dataset.ex)")
    diffs = [EX[i]["difficulty"] for i in dom]
    badges = pg.eval_on_selector_all(
        f'.ex-list[data-list="{tab}"] .diff', "els => els.map(e => +e.className.match(/diff--(\\d)/)[1])"
    )
    labels_ok = pg.eval_on_selector_all(
        f'.ex-list[data-list="{tab}"] .diff-text', "els => els.every(e => /^Mức [1-5] · \\S/.test(e.textContent.trim()))"
    )
    mid = st["muscleId"]
    expected = sorted(
        [e for e in EX.values() if e["type"] == tab and mid in e["primaryMuscles"]],
        key=lambda e: (e["difficulty"], e.get("order", 0)),
    )
    count_txt = pg.inner_text(f'[role=tab][data-tab="{tab}"] .tab-count').strip()
    ok = (
        dom == st["listIds"]
        and diffs == sorted(diffs)
        and badges == diffs
        and labels_ok
        and set(dom) == {e["id"] for e in expected}
        and count_txt == str(len(dom))
    )
    return ok, f"n={len(dom)} diffs={diffs} count={count_txt}"


with sync_playwright() as p:
    b = p.chromium.launch(args=GL)

    # ------------------------------------------------------------ desktop
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("console", lambda m: m.type == "error" and errors.append(m.text))
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE, wait_until="networkidle")
    wait_ready(pg)

    # 1) empty state
    widths = pg.eval_on_selector_all(".howto li > span", "els => els.map(e => Math.round(e.getBoundingClientRect().width))")
    check("empty state how-to items wide", len(widths) == 3 and min(widths) > 150, f"widths={widths}")
    lay = pg.evaluate(
        """() => { const v = document.querySelector('.viewer').getBoundingClientRect();
                  const p = document.querySelector('.panel').getBoundingClientRect();
                  const pe = document.querySelector('.panel');
                  return { vx: v.left, vw: v.width, px: p.left, pw: p.width,
                           panelScroll: pe.scrollHeight > pe.clientHeight && getComputedStyle(pe).overflowY === 'auto',
                           docScroll: document.documentElement.scrollHeight - innerHeight }; }"""
    )
    check(
        "desktop layout model left / panel right, panel scrolls alone",
        lay["vx"] < lay["px"] and lay["vw"] > lay["pw"] and lay["panelScroll"] and lay["docScroll"] <= 0,
        json.dumps(lay),
    )
    pg.screenshot(path=os.path.join(OUT, "n8-desktop-empty.png"))

    # 2) canvas click
    target = "biceps-brachii"
    pt = pg.evaluate(f"window.__mv.screenPointOf('{target}')")
    pg.wait_for_timeout(300)
    for _ in range(pt["clicks"] if pt else 0):
        pg.mouse.click(pt["x"], pt["y"])
        pg.wait_for_timeout(250)
    pg.wait_for_timeout(500)
    sel_mv = pg.evaluate("window.__mv.getSelected()")
    check(
        "canvas click selects muscle → panel heading",
        pt and sel_mv == target and heading(pg) == NAME[target] and pg.evaluate("window.__app.getSelected()") == target,
        f"pt={pt} mv={sel_mv} h={heading(pg)!r}",
    )

    # 3) gym default + sorted
    check("Gym tab default", pg.evaluate("window.__app.getTab()") == "gym"
          and pg.get_attribute('[role=tab][data-tab="gym"]', "aria-selected") == "true")
    ok, d = list_check(pg, "gym")
    check("Gym list sorted easy→hard", ok, d)

    # 4) calisthenics
    pg.click('[role=tab][data-tab="calisthenics"]')
    pg.wait_for_timeout(200)
    ok, d = list_check(pg, "calisthenics")
    check("Calisthenics list sorted easy→hard", ok and pg.evaluate("window.__app.getTab()") == "calisthenics", d)

    # 5) panel info (names, group, function, sources)
    m = next(x for x in M["muscles"] if x["id"] == target)
    txt = pg.inner_text(".muscle")
    links = pg.eval_on_selector_all(".anat-src a", "els => els.map(a => a.href)")
    check(
        "panel shows nameVi/La/En/group/function/sources",
        all(s in txt for s in [m["nameVi"], m["nameLa"], m["nameEn"], m["functionVi"][0]])
        and set(links) == {s["url"] for s in m["sources"]},
        f"links={len(links)}",
    )

    # 6) new muscle → Gym default again; detail; secondary chip
    pg.evaluate("window.__app.selectMuscle('latissimus-dorsi')")
    pg.wait_for_timeout(200)
    check("new muscle resets to Gym", pg.evaluate("window.__app.getTab()") == "gym")
    ex_id = pg.evaluate(
        """() => { const st = window.__app.getState(); return st.listIds; }"""
    )
    ex_id = next(i for i in ex_id if any(s != "latissimus-dorsi" for s in EX[i]["secondaryMuscles"]))
    pg.click(f'li.ex[data-ex="{ex_id}"] .ex-head')
    pg.wait_for_timeout(300)
    body = pg.inner_text(f'li.ex[data-ex="{ex_id}"] .ex-body')
    e = EX[ex_id]
    src_n = pg.eval_on_selector_all(f'li.ex[data-ex="{ex_id}"] .srcs a', "els => els.length")
    imgs = pg.eval_on_selector_all(f'li.ex[data-ex="{ex_id}"] img', "els => els.length")
    check(
        "exercise detail: steps, equipment, chips, safety, basis, sources, no images",
        e["steps"][0] in body
        and e["difficultyBasis"][:40] in body
        and (not e["safety"] or e["safety"][0] in body)
        and src_n == len(e["sources"])
        and imgs == 0
        and all(pg.query_selector(f'li.ex[data-ex="{ex_id}"] .chip--primary[data-muscle="{x}"]') for x in e["primaryMuscles"]),
        f"ex={ex_id} sources={src_n}",
    )
    sec = next(s for s in e["secondaryMuscles"] if s != "latissimus-dorsi")
    pg.screenshot(path=os.path.join(OUT, "n8-desktop-detail.png"))
    pg.click(f'li.ex[data-ex="{ex_id}"] .chip--secondary[data-muscle="{sec}"]')
    pg.wait_for_timeout(800)
    check(
        "secondary chip → viewer + panel",
        pg.evaluate("window.__mv.getSelected()") == sec and heading(pg) == NAME[sec] and pg.evaluate("window.__app.getTab()") == "gym",
        f"chip={sec} mv={pg.evaluate('window.__mv.getSelected()')} h={heading(pg)!r}",
    )

    # 7) viewer API → panel (bug 3)
    pg.evaluate("window.__mv.select('gluteus-maximus')")
    pg.wait_for_timeout(300)
    check(
        "window.__mv.select → panel",
        heading(pg) == NAME["gluteus-maximus"] and pg.evaluate("window.__app.getSelected()") == "gluteus-maximus",
        f"h={heading(pg)!r}",
    )
    pg.evaluate("window.__app.selectMuscle('triceps-brachii')")
    pg.wait_for_timeout(300)
    check("window.__app.selectMuscle → viewer", pg.evaluate("window.__mv.getSelected()") == "triceps-brachii")
    pg.evaluate("window.__app.setTab('calisthenics')")
    check("window.__app.setTab/getTab", pg.evaluate("window.__app.getTab()") == "calisthenics")

    # 8) keyboard via search (no diacritics, Latin)
    pg.click(".site-nav .btn--ghost")
    pg.wait_for_selector("dialog.dlg--picker[open] input[type=search]")
    pg.keyboard.type("nhi dau canh tay")
    pg.wait_for_timeout(150)
    first = pg.eval_on_selector_all("dialog[open] [role=option]", "els => els.map(e => e.dataset.muscle)")
    pg.keyboard.press("ArrowDown")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(400)
    s1 = pg.evaluate("window.__app.getSelected()")
    pg.click(".site-nav .btn--ghost")
    pg.wait_for_selector("dialog.dlg--picker[open] input[type=search]")
    pg.keyboard.type("latissimus")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(400)
    s2 = pg.evaluate("window.__app.getSelected()")
    pg.click(".site-nav .btn--ghost")
    pg.wait_for_selector("dialog.dlg--picker[open] input[type=search]")
    pg.keyboard.type("hamstrings")
    en = pg.eval_on_selector_all("dialog[open] [role=option]", "els => els.map(e => e.dataset.muscle)")
    pg.keyboard.press("Escape")  # clear query
    pg.keyboard.press("Escape")  # close dialog
    pg.wait_for_timeout(300)
    check(
        "keyboard search (no diacritics, Latin, English) selects",
        s1 == "biceps-brachii" and s2 == "latissimus-dorsi" and pg.evaluate("window.__mv.getSelected()") == s2 and len(en) > 0,
        f"nodiacritics={first} → {s1}; latin → {s2}; 'hamstrings' → {en}",
    )
    check("picker dialog closed after Esc", not pg.query_selector("dialog.dlg--picker[open]"))

    # 9) exceptions
    pg.evaluate("window.__app.selectMuscle('pectoralis-minor')")
    pg.wait_for_timeout(300)
    oks = []
    for tab in ["gym", "calisthenics"]:
        pg.click(f'[role=tab][data-tab="{tab}"]')
        pg.wait_for_timeout(200)
        exc = EXC["pectoralis-minor"].get(tab)
        n = len(pg.evaluate("window.__app.getState().listIds"))
        if exc and n < 3:
            note = pg.query_selector(".exc-note")
            t = note.inner_text() if note else ""
            ln = pg.eval_on_selector_all(".exc-note a", "els => els.map(a => a.href)") if note else []
            oks.append(bool(note) and exc["reason"][:50] in t and set(ln) == set(exc["sources"]))
            print(f"   {tab}: n={n} note={bool(note)} links={len(ln)}/{len(exc['sources'])}")
        else:
            oks.append(True)
    check("pectoralis-minor shows exception reasons + sources", all(oks), str(oks))

    # 10) view controls
    def cam():
        return pg.evaluate("window.__mv.camera.position.toArray().map(v => +v.toFixed(3))")

    c0 = cam()
    pg.click(".seg button:nth-child(2)")
    wait_idle(pg)
    c1 = cam()
    pg.click('.viewer-zoom button[aria-label="Phóng to"]')
    wait_idle(pg)
    c2 = cam()
    pg.click(".viewer-zoom .icon-btn--text")
    wait_idle(pg)
    c3 = cam()
    check(
        "front/back, zoom, reset change camera",
        c1[2] * c0[2] < 0 or abs(c1[0] - c0[0]) > 0.1 or abs(c1[2] - c0[2]) > 0.1,
        f"front={c0} back={c1} zoom={c2} reset={c3}",
    )
    check("zoom & reset", c2 != c1 and c3 != c2)

    # 11) sources dialog
    pg.click(".site-nav .btn--link")
    pg.wait_for_selector("dialog.dlg--sources[open]")
    stxt = pg.inner_text("dialog.dlg--sources")
    need = ["Kevin-Mattheus-Moerman/BodyParts3D", "3.0", "CC BY-SA 2.1 JP", "free-exercise-db", "Unlicense", "STL", "GLB"]
    check(
        "sources dialog: exact attribution + notes",
        ATTR in stxt and all(n in stxt for n in need),
        "missing=" + str([n for n in need if n not in stxt]),
    )
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(200)

    # final desktop screenshot: selected muscle with detail open
    pg.evaluate("window.__app.selectMuscle('biceps-brachii')")
    pg.wait_for_timeout(200)
    first_ex = pg.evaluate("window.__app.getState().listIds[0]")
    pg.click(f'li.ex[data-ex="{first_ex}"] .ex-head')
    wait_idle(pg)
    pg.wait_for_timeout(600)
    pg.screenshot(path=os.path.join(OUT, "n8-desktop-selected-detail.png"))
    disc = pg.inner_text(".site-foot .disclaimer")
    check("health disclaimer visible", "không thay thế" in disc and pg.is_visible(".site-foot .disclaimer"))
    pg.close()

    # ------------------------------------------------------------ mobile
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg.on("console", lambda m: m.type == "error" and errors.append(m.text))
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE, wait_until="networkidle")
    wait_ready(pg)
    widths = pg.eval_on_selector_all(".howto li > span", "els => els.map(e => Math.round(e.getBoundingClientRect().width))")
    pg.screenshot(path=os.path.join(OUT, "n8-mobile-empty.png"))
    hdr = pg.evaluate(
        """() => { const t = document.querySelector('.brand-title'); const n = document.querySelector('.site-nav');
                  const nb = n.getBoundingClientRect(), tb = t.getBoundingClientRect();
                  return { sw: t.scrollWidth, cw: t.clientWidth, titleRight: Math.round(tb.right), navLeft: Math.round(nb.left),
                           navRight: Math.round(nb.right), text: t.innerText,
                           docSW: document.documentElement.scrollWidth, docCW: document.documentElement.clientWidth }; }"""
    )
    check(
        "mobile brand not truncated, header fits",
        hdr["sw"] <= hdr["cw"] and hdr["titleRight"] <= hdr["navLeft"] and hdr["navRight"] <= 390 and "3D" in hdr["text"],
        json.dumps(hdr, ensure_ascii=False),
    )
    check("mobile empty how-to readable", min(widths) > 150, f"widths={widths}")
    pg.evaluate("window.__mv.select('biceps-brachii')")
    pg.wait_for_timeout(500)
    first_ex = pg.evaluate("window.__app.getState().listIds[0]")
    pg.click(f'li.ex[data-ex="{first_ex}"] .ex-head')
    pg.wait_for_timeout(400)
    wait_idle(pg)
    lay = pg.evaluate(
        """() => { const v = document.querySelector('.viewer').getBoundingClientRect();
                  const p = document.querySelector('.panel').getBoundingClientRect();
                  return { viewerBottom: Math.round(v.bottom + scrollY), panelTop: Math.round(p.top + scrollY),
                           docSW: document.documentElement.scrollWidth, docCW: document.documentElement.clientWidth,
                           wide: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length }; }"""
    )
    check(
        "mobile: model on top, panel below, no horizontal overflow",
        heading(pg) == NAME["biceps-brachii"] and lay["viewerBottom"] <= lay["panelTop"] + 1 and lay["docSW"] <= lay["docCW"] and lay["wide"] == 0,
        json.dumps(lay),
    )
    pg.evaluate("scrollTo(0, document.querySelector('.tabs-wrap').getBoundingClientRect().top + scrollY - 260)")
    pg.wait_for_timeout(400)
    vis = pg.evaluate("(() => { const d = document.querySelector('.panel-foot .disclaimer'); return !!d && d.offsetParent !== null; })()")
    check("mobile health disclaimer present", vis)
    pg.screenshot(path=os.path.join(OUT, "n8-mobile-selected.png"))
    pg.click(".site-nav .btn--link")
    pg.wait_for_selector("dialog.dlg--sources[open]")
    sw = pg.evaluate("(() => { const d = document.querySelector('dialog.dlg--sources'); return [d.scrollWidth, d.clientWidth]; })()")
    check("mobile sources dialog no overflow", sw[0] <= sw[1], str(sw))
    pg.screenshot(path=os.path.join(OUT, "n8-mobile-sources.png"))
    pg.close()
    b.close()

check("0 console errors", not errors, " | ".join(errors[:5]))
fails = [r for r in results if not r[1]]
print(f"\n{len(results) - len(fails)}/{len(results)} PASS")
sys.exit(1 if fails else 0)
