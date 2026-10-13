"""Chụp nhanh giao diện để rà N8. python3 -I run/tools/peek.py <base> <outdir>"""
import sys, os, json
from playwright.sync_api import sync_playwright
BASE, OUT = sys.argv[1], sys.argv[2]
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=GL)
    for name, vp in [("desktop", {"width": 1440, "height": 900}), ("mobile", {"width": 390, "height": 844})]:
        pg = b.new_page(viewport=vp)
        pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE, wait_until="networkidle"); pg.wait_for_timeout(6000)
        pg.screenshot(path=os.path.join(OUT, f"peek-{name}-0.png"), full_page=(name == "mobile"))
        ok = pg.evaluate("!!window.__mv")
        if ok:
            pg.evaluate("window.__mv.select('biceps-brachii')"); pg.wait_for_timeout(2500)
            pg.screenshot(path=os.path.join(OUT, f"peek-{name}-biceps.png"), full_page=(name == "mobile"))
        print(name, "mv", ok, "overflow", pg.evaluate("document.documentElement.scrollWidth > innerWidth"))
        pg.close()
    b.close()
print("errors", errs[:5])
