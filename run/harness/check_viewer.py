#!/usr/bin/env python3
"""Kiểm thử trình xem cơ (nút N7, cổng C2).

Cần Vite dev server: `npx vite --port 5191 --strictPort` (từ thư mục gốc dự án).
Chạy: python3 -I run/harness/check_viewer.py [--url URL]
In JSON ra stdout; thoát mã khác 0 nếu có kiểm tra thất bại.
"""
import json
import math
import os
import sys
import time

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
URL = "http://localhost:5191/run/harness/viewer.html"
if "--url" in sys.argv:
    URL = sys.argv[sys.argv.index("--url") + 1]
ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
CLIP = {"x": 0, "y": 0, "width": 1100, "height": 800}
AWAY = (1250, 700)  # ngoài canvas, để bỏ hover trước khi chụp

with open(os.path.join(ROOT, "src", "data", "muscles.json"), encoding="utf-8") as f:
    MUSCLES = json.load(f)["muscles"]


def main():
    out = {"url": URL, "checks": {}, "units": {}, "errors": []}
    ok_all = True

    def check(name, ok, **detail):
        nonlocal ok_all
        out["checks"][name] = {"ok": bool(ok), **detail}
        if not ok:
            ok_all = False

    with sync_playwright() as p:
        browser = p.chromium.launch(args=ARGS)
        page = browser.new_page(viewport={"width": 1400, "height": 820})
        page.on("console", lambda m: out["errors"].append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: out["errors"].append(f"pageerror: {e}"))

        t0 = time.time()
        page.goto(URL)
        page.wait_for_function("window.__harness && (window.__harness.ready || window.__harness.error)", timeout=240000)
        err = page.evaluate("window.__harness.error || null")
        if err:
            out["errors"].append("load: " + err)
            print(json.dumps(out, ensure_ascii=False, indent=1))
            sys.exit(1)
        out["pageLoadSec"] = round(time.time() - t0, 2)
        page.wait_for_timeout(600)

        def cam():
            return page.evaluate(
                "(()=>{const c=window.__mv.camera.position,t=window.__mv.controls.target;"
                "return {x:c.x,y:c.y,z:c.z,d:c.distanceTo(t)}})()"
            )

        def settle(ms=300):
            # chờ hết hoạt cảnh/quán tính (SwiftShader chậm nên không dùng thời gian cố định)
            page.wait_for_timeout(ms)
            page.wait_for_function("window.__mv.isIdle()", timeout=30000, polling=100)

        def shot(name):
            page.mouse.move(*AWAY)
            settle()
            path = os.path.join(HERE, name)
            page.screenshot(path=path, clip=CLIP)
            out.setdefault("screenshots", []).append(os.path.relpath(path, ROOT))

        # ---- 5. thống kê
        stats = page.evaluate("JSON.parse(JSON.stringify(window.__mvStats))")
        out["stats"] = stats
        check("5_budget", stats["drawCalls"] <= 150 and stats["triangles"] <= 600000, **stats)

        shot("viewer-front.png")

        # ---- 2. kéo xoay, đặt lại, thu phóng, mặt sau
        home = cam()
        page.mouse.move(550, 420)
        page.mouse.down()
        for i in range(1, 11):
            page.mouse.move(550 + i * 22, 420, steps=1)
            page.wait_for_timeout(30)
        page.mouse.up()
        settle()
        dragged = cam()
        rotated = math.hypot(dragged["x"] - home["x"], dragged["z"] - home["z"]) > 0.3
        sel_after_drag = page.evaluate("window.__mv.getSelected()")
        page.evaluate("window.__mv.resetView()")
        settle()
        back_home = cam()
        restored = all(abs(back_home[k] - home[k]) < 0.02 for k in "xyz")
        page.evaluate("window.__mv.zoomBy(1)")
        settle()
        zoomed = cam()
        page.evaluate("window.__mv.resetView()")
        settle()
        page.evaluate("window.__mv.setView('back')")
        settle()
        back = cam()
        check(
            "2_camera",
            rotated and restored and zoomed["d"] < home["d"] - 0.05 and back["z"] < 0 and sel_after_drag is None,
            rotated=rotated, dragDidNotSelect=sel_after_drag is None, restored=restored,
            homeDist=round(home["d"], 3), zoomDist=round(zoomed["d"], 3), backCamZ=round(back["z"], 3),
        )
        shot("viewer-back.png")

        # ---- 3. rê chuột
        page.evaluate("window.__mv.resetView()")
        settle()
        hp = page.evaluate("window.__mv.screenPointOf('rectus-abdominis')")
        page.mouse.move(hp["x"] - 3, hp["y"])
        page.mouse.move(hp["x"], hp["y"])
        settle(500)
        hov = page.evaluate("[window.__harness.hover, window.__mv.getHovered(), getComputedStyle(document.getElementById('c')).cursor]")
        page.mouse.move(*AWAY)
        settle(300)
        hov_off = page.evaluate("window.__mv.getHovered()")
        check("3_hover", hov[0] == "rectus-abdominis" and hov[1] == "rectus-abdominis" and hov[2] == "pointer" and hov_off is None,
              hovered=hov[0], cursor=hov[2], afterLeave=hov_off)

        # ---- 4. focus về mặt sau
        page.evaluate("window.__mv.resetView()")
        settle()
        page.evaluate("window.__mv.select('latissimus-dorsi', {focus: true})")
        settle()
        fc = cam()
        check("4_focus_back", fc["z"] < 0 and page.evaluate("window.__mv.getSelected()") == "latissimus-dorsi", camZ=round(fc["z"], 3))
        shot("viewer-selected-back.png")

        page.evaluate("window.__mv.resetView(); window.__mv.select('pectoralis-major-sternal')")
        settle()
        shot("viewer-selected-front.png")

        # ---- click-through tới cơ ngang bụng (bấm nhiều lần cùng một chỗ)
        page.evaluate("window.__mv.select(null); window.__mv.resetView()")
        settle()
        deep = page.evaluate(
            """(()=>{const mv=window.__mv; const r=mv.canvas.getBoundingClientRect(); let best=null;
            for(let y=300;y<=420;y+=3) for(let x=470;x<=630;x+=3){
              const l=mv._pickAt(r.left+x,r.top+y).list.map(h=>h.unit); const i=l.indexOf('transversus-abdominis');
              if(i>=2 && (!best || Math.abs(x-550)<Math.abs(best.x-550))) best={x:r.left+x,y:r.top+y,clicks:i+1,list:l.slice(0,i+1)};
            } mv._lastClick=null; return best;})()"""
        )
        deep_ok = False
        if deep:
            page.evaluate("window.__harness.events.length = 0")
            for _ in range(deep["clicks"]):
                page.mouse.click(deep["x"], deep["y"])
                page.wait_for_timeout(250)
            ev = page.evaluate("window.__harness.events")
            seq = [e["id"] for e in ev]
            deep_ok = page.evaluate("window.__mv.getSelected()") == "transversus-abdominis" and seq == deep["list"] and ev[-1]["depth"] == deep["clicks"] - 1
            check("clickthrough_transversus", deep_ok, point=[deep["x"], deep["y"]], sequence=seq, depths=[e["depth"] for e in ev])
        else:
            check("clickthrough_transversus", False, reason="không tìm thấy điểm có cơ ngang bụng ở độ sâu ≥ 2")
        settle(300)
        page.mouse.move(*AWAY)
        settle(300)
        page.screenshot(path=os.path.join(HERE, "viewer-deep.png"), clip=CLIP)
        out.setdefault("screenshots", []).append("run/harness/viewer-deep.png")

        # ---- 1. bấm chọn TỪNG cơ
        page.evaluate("window.__mv.select(null); window.__mv.resetView()")
        settle()
        passed = 0
        for m in MUSCLES:
            mid = m["id"]
            pt = page.evaluate("id => window.__mv.screenPointOf(id)", mid)
            if not pt:
                out["units"][mid] = {"clicks": None, "view": None, "ok": False}
                continue
            settle(250)
            for _ in range(pt["clicks"]):
                page.mouse.click(pt["x"], pt["y"])
                page.wait_for_timeout(180)
            got = page.evaluate("window.__mv.getSelected()")
            ok = got == mid
            passed += ok
            out["units"][mid] = {"clicks": pt["clicks"], "view": pt["view"], "ok": ok, **({} if ok else {"got": got, "at": [pt["x"], pt["y"]]})}
        clicks = [u["clicks"] for u in out["units"].values() if u["clicks"]]
        out["unitSummary"] = {
            "passed": passed,
            "total": len(MUSCLES),
            "maxClicks": max(clicks) if clicks else None,
            "needing3plus": [k for k, u in out["units"].items() if (u["clicks"] or 0) >= 3],
            "needing2": [k for k, u in out["units"].items() if u["clicks"] == 2],
            "backView": [k for k, u in out["units"].items() if u["view"] == "back"],
        }
        check("1_every_unit_clickable", passed == len(MUSCLES), passed=passed, total=len(MUSCLES))

        # ---- bấm nền trống bỏ chọn
        page.mouse.click(60, 60)
        page.wait_for_timeout(200)
        check("background_click_clears", page.evaluate("window.__mv.getSelected()") is None)

        out["stats"] = page.evaluate("JSON.parse(JSON.stringify(window.__mvStats))")
        browser.close()

    errs = [e for e in out["errors"] if "GPU stall" not in e and "GL Driver Message" not in e]
    out["errors"] = errs
    check("6_no_errors", not errs, count=len(errs))
    out["ok"] = ok_all
    print(json.dumps(out, ensure_ascii=False, indent=1))
    sys.exit(0 if ok_all else 1)


if __name__ == "__main__":
    main()
