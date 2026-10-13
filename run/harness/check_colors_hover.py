#!/usr/bin/env python3
"""Kiểm thử tô màu đất sét + hover theo đồ thị kề (nút V4, cổng V-C3).

Cần Vite dev server: `npx vite --port 5195 --strictPort` (từ thư mục gốc dự án).
Chạy: python3 -I run/harness/check_colors_hover.py [--url URL]
In JSON ra stdout; thoát mã khác 0 nếu có kiểm tra thất bại.

(a) mới tải: mọi cơ chọn được màu PALETTE.clay
(b) rê vào X (≥ 8 cơ khắp cơ thể): X + mọi cơ kề = palette[colors[id]], cơ khác vẫn đất sét,
    hai cơ kề nhau trong vùng hiển thị khác màu
(c) bấm chọn → màu PALETTE.selected; rê cơ kề của cơ đang chọn → cơ đang chọn vẫn giữ màu chọn
(d) rời canvas → đất sét (cơ đang chọn giữ màu chọn)
(e) thiết bị cảm ứng (has_touch/is_mobile): chạm chọn → cơ chọn màu chọn + láng giềng màu bảng
(f) không lỗi console
"""
import json
import os
import re
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
URL = "http://localhost:5195/run/harness/viewer.html"
if "--url" in sys.argv:
    URL = sys.argv[sys.argv.index("--url") + 1]
ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
CLIP = {"x": 0, "y": 0, "width": 1100, "height": 800}
AWAY = (1250, 700)  # ngoài canvas

with open(os.path.join(ROOT, "src", "data", "muscle-colors.json"), encoding="utf-8") as f:
    COLORS = json.load(f)
with open(os.path.join(ROOT, "src", "data", "muscles.json"), encoding="utf-8") as f:
    MUSCLES = [m["id"] for m in json.load(f)["muscles"]]
with open(os.path.join(ROOT, "src", "viewer", "palette.js"), encoding="utf-8") as f:
    _pal = f.read()
CLAY = re.search(r'\bclay:\s*"(#[0-9a-fA-F]{6})"', _pal).group(1).lower()
SELECTED = re.search(r'\bselected:\s*"(#[0-9a-fA-F]{6})"', _pal).group(1).lower()

PALETTE = [c.lower() for c in COLORS["palette"]]
NBRS = {}
for a, b, *_ in COLORS["edges"]:
    NBRS.setdefault(a, set()).add(b)
    NBRS.setdefault(b, set()).add(a)
EDGES = {frozenset((a, b)) for a, b, *_ in COLORS["edges"]}


def pal_of(mid):
    return PALETTE[COLORS["colors"][mid]]


HOVER_SET = [
    "biceps-brachii", "rectus-abdominis", "gastrocnemius", "latissimus-dorsi", "deltoid-lateral",
    "pectoralis-major-sternal", "gluteus-maximus", "rectus-femoris", "trapezius-upper",
    "external-oblique", "tibialis-anterior", "hamstrings", "forearm-flexors", "sternocleidomastoid",
]


def main():
    out = {"url": URL, "clay": CLAY, "selected": SELECTED, "checks": {}, "hover": {}, "errors": []}
    ok_all = True

    def check(name, ok, **detail):
        nonlocal ok_all
        out["checks"][name] = {"ok": bool(ok), **detail}
        if not ok:
            ok_all = False

    with sync_playwright() as p:
        browser = p.chromium.launch(args=ARGS)

        def open_page(ctx):
            page = ctx.new_page()
            page.on("console", lambda m: out["errors"].append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
            page.on("pageerror", lambda e: out["errors"].append(f"pageerror: {e}"))
            page.goto(URL)
            page.wait_for_function("window.__harness && (window.__harness.ready || window.__harness.error)", timeout=240000)
            err = page.evaluate("window.__harness.error || null")
            if err:
                out["errors"].append("load: " + err)
                print(json.dumps(out, ensure_ascii=False, indent=1))
                sys.exit(1)
            page.wait_for_timeout(500)
            return page

        ctx = browser.new_context(viewport={"width": 1400, "height": 820})
        page = open_page(ctx)

        def settle(ms=300):
            page.wait_for_timeout(ms)
            page.wait_for_function("window.__mv.isIdle()", timeout=30000, polling=100)

        def colors():
            return page.evaluate("ids => Object.fromEntries(ids.map(id => [id, window.__mv.getUnitColor(id)]))", MUSCLES)

        def shot(name):
            path = os.path.join(HERE, name)
            page.screenshot(path=path, clip=CLIP)
            out.setdefault("screenshots", []).append(os.path.relpath(path, ROOT))

        def expect_hood(cur, centres, selected=None):
            """Sai khác so với kỳ vọng: centres + láng giềng màu bảng, cơ chọn màu chọn, còn lại đất sét."""
            hood = set()
            for c in centres:
                hood |= {c} | NBRS.get(c, set())
            bad = {}
            for mid in MUSCLES:
                want = SELECTED if mid == selected else (pal_of(mid) if mid in hood else CLAY)
                if (cur.get(mid) or "").lower() != want:
                    bad[mid] = {"got": cur.get(mid), "want": want}
            vis = [m for m in hood if m != selected]
            same = [f"{a}~{b}" for i, a in enumerate(vis) for b in vis[i + 1:]
                    if frozenset((a, b)) in EDGES and cur.get(a) == cur.get(b)]
            return hood, bad, same

        # ---- API hooks
        api = page.evaluate(
            "(()=>{const mv=window.__mv; return {fns:['setColorMeta','getUnitColor','getNeighbors','select','screenPointOf','setView','resetView','zoomBy','onSelect','onHover'].filter(k=>typeof mv[k]!=='function'),"
            "nb: mv.getNeighbors('biceps-brachii').sort(), draw: window.__mvStats.drawCalls}})()"
        )
        check("api", not api["fns"] and api["nb"] == sorted(NBRS["biceps-brachii"]),
              missing=api["fns"], bicepsNeighbours=len(api["nb"]))

        # ---- (a) mặc định đất sét
        page.mouse.move(*AWAY)
        settle()
        cur = colors()
        not_clay = {k: v for k, v in cur.items() if (v or "").lower() != CLAY}
        check("a_default_clay", not not_clay, units=len(cur), notClay=not_clay)
        shot("v2-clay.png")

        # ---- (b) rê chuột
        n_ok = 0
        max_draw = page.evaluate("window.__mvStats.drawCalls")
        for mid in HOVER_SET:
            pt = page.evaluate("id => window.__mv.screenPointOf(id)", mid)
            if not pt:
                out["hover"][mid] = {"ok": False, "reason": "no point"}
                continue
            settle(200)
            page.mouse.move(pt["x"] - 3, pt["y"])
            page.mouse.move(pt["x"], pt["y"])
            try:
                page.wait_for_function("id => window.__mv.getHovered() === id", arg=mid, timeout=15000, polling=100)
            except Exception:
                pass
            settle(250)
            hovered = page.evaluate("window.__mv.getHovered()")
            cur = colors()
            hood, bad, same = expect_hood(cur, [hovered] if hovered else [])
            ok = hovered == mid and not bad and not same and len(hood) >= 2
            n_ok += ok
            max_draw = max(max_draw, page.evaluate("window.__mvStats.drawCalls"))
            out["hover"][mid] = {"ok": ok, "view": pt["view"], "clicks": pt["clicks"], "hovered": hovered,
                                 "lit": len(hood), "wrong": bad or None, "sameColourAdjacent": same or None}
            if mid == "biceps-brachii":
                shot("v2-hover-biceps.png")
            if mid == "latissimus-dorsi":
                shot("v2-hover-back.png")
            page.mouse.move(*AWAY)
            settle(150)
        check("b_hover_neighbourhood", n_ok == len(HOVER_SET), passed=n_ok, total=len(HOVER_SET))
        check("budget_draw_calls", max_draw <= 150, maxDrawCalls=max_draw)

        # ---- (c) bấm chọn → màu chọn; rê cơ kề → cơ chọn giữ màu chọn
        sel = "biceps-brachii"
        page.evaluate("window.__mv.resetView()")
        settle()
        pt = page.evaluate("id => window.__mv.screenPointOf(id)", sel)
        settle(200)
        for _ in range(pt["clicks"]):
            page.mouse.click(pt["x"], pt["y"])
            page.wait_for_timeout(200)
        settle(250)
        got = page.evaluate("window.__mv.getSelected()")
        cur = colors()
        hov = page.evaluate("window.__mv.getHovered()")
        _, bad, _ = expect_hood(cur, [hov] if hov else [], selected=sel)
        check("c_click_selects_accent", got == sel and (cur[sel] or "").lower() == SELECTED and not bad,
              selected=got, colour=cur[sel], hovered=hov, wrong=bad or None)
        nb = "brachialis"
        npt = page.evaluate("id => window.__mv.screenPointOf(id, {view: 'front'})", nb)
        settle(200)
        page.mouse.move(npt["x"] - 3, npt["y"])
        page.mouse.move(npt["x"], npt["y"])
        try:
            page.wait_for_function("id => window.__mv.getHovered() === id", arg=nb, timeout=15000, polling=100)
        except Exception:
            pass
        settle(250)
        hov = page.evaluate("window.__mv.getHovered()")
        cur = colors()
        _, bad, same = expect_hood(cur, [hov] if hov else [], selected=sel)
        check("c_selected_keeps_accent_in_neighbourhood",
              hov == nb and sel in NBRS[nb] and (cur[sel] or "").lower() == SELECTED and not bad and not same,
              hovered=hov, selectedColour=cur[sel], wrong=bad or None)

        # ---- (d) rời canvas
        page.mouse.move(*AWAY)
        settle(300)
        cur = colors()
        _, bad, _ = expect_hood(cur, [], selected=sel)
        check("d_leave_back_to_clay", page.evaluate("window.__mv.getHovered()") is None and not bad, wrong=bad or None)
        page.evaluate("window.__mv.select(null)")
        settle()
        cur = colors()
        check("d_deselect_all_clay", all((v or "").lower() == CLAY for v in cur.values()))
        ctx.close()

        # ---- (e) cảm ứng / không rê được
        tctx = browser.new_context(viewport={"width": 1400, "height": 820}, has_touch=True, is_mobile=True, device_scale_factor=1)
        page = open_page(tctx)
        no_hover = page.evaluate("matchMedia('(hover: none)').matches")
        touch_res = {}
        t_ok = 0
        for mid in ["rectus-abdominis", "vasti", "deltoid-anterior"]:
            pt = page.evaluate("id => window.__mv.screenPointOf(id, {view: 'front'})", mid)
            settle(200)
            for _ in range(pt["clicks"]):
                page.touchscreen.tap(pt["x"], pt["y"])
                page.wait_for_timeout(250)
            settle(250)
            got = page.evaluate("window.__mv.getSelected()")
            cur = colors()
            _, bad, same = expect_hood(cur, [got] if got else [], selected=got)
            ok = got == mid and not bad and not same
            t_ok += ok
            touch_res[mid] = {"ok": ok, "selected": got, "neighbours": len(NBRS.get(mid, ())), "wrong": bad or None}
            if mid == "rectus-abdominis":
                shot("v2-touch-selected.png")
        # API select() trên thiết bị không rê cũng tô láng giềng
        page.evaluate("window.__mv.select('gastrocnemius', {focus: true})")
        settle()
        cur = colors()
        _, bad, _ = expect_hood(cur, ["gastrocnemius"], selected="gastrocnemius")
        api_touch_ok = not bad if no_hover else True
        check("e_touch_select_colours_neighbours", t_ok == 3 and api_touch_ok, hoverNone=no_hover, taps=touch_res,
              apiSelectWrong=(bad or None) if no_hover else "skipped (hover:none not emulated)")
        tctx.close()
        browser.close()

    errs = [e for e in out["errors"] if "GPU stall" not in e and "GL Driver Message" not in e]
    out["errors"] = errs
    check("f_no_console_errors", not errs, count=len(errs))
    out["ok"] = ok_all
    print(json.dumps(out, ensure_ascii=False, indent=1))
    sys.exit(0 if ok_all else 1)


if __name__ == "__main__":
    main()
