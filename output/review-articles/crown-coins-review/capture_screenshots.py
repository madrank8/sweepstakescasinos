import asyncio
import sys
from pathlib import Path

from PIL import Image
from playwright.async_api import async_playwright

TARGETS = [
    {"url": "https://crowncoinscasino.com/", "out": "homepage"},
    {"url": "https://crowncoinscasino.com/promotions", "out": "promotions"},
]
OUT_DIR = Path(sys.argv[1] if len(sys.argv) > 1 else "./images")
OUT_DIR.mkdir(parents=True, exist_ok=True)


async def capture(page, url, out_stem):
    await page.goto(url, wait_until="load", timeout=60000)
    await page.wait_for_timeout(3000)
    for label in ("Accept", "Accept All", "I Agree", "Got it"):
        try:
            await page.click(f"text={label}", timeout=2000)
            break
        except Exception:
            pass
    await page.wait_for_timeout(1500)
    png_path = OUT_DIR / f"{out_stem}.png"
    await page.screenshot(path=str(png_path), full_page=False)
    img = Image.open(png_path)
    img.save(OUT_DIR / f"{out_stem}.webp", "WEBP", quality=82, method=6)
    png_path.unlink()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        page = await ctx.new_page()
        for t in TARGETS:
            try:
                await capture(page, t["url"], t["out"])
                print(f"OK  {t['out']}")
            except Exception as e:
                print(f"ERR {t['out']}: {e}")
        await browser.close()


asyncio.run(main())
