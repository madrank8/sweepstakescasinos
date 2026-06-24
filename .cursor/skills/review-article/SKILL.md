---
name: review-article
description: |
  **Multimedia Review Article Generator**: Publish-ready interactive HTML review articles from a keyword, target website, author profile, and chosen image generator. Pipeline: web research → sitemap mining for internal links → LSI keywords → Playwright product screenshots → hero + infographics via the chosen generator (NanoBanana OR GPT Image 2, single pick applies to both) → interactive HTML with calculator, Review/FAQ schema, testimonials, and EEAT author bio.
  MANDATORY TRIGGERS: review article, product review, write a review, create review, tool review, software review, SaaS review, multimedia review, interactive review, review page, honest review, write review for, review of, build review page
  Use whenever the user wants an in-depth product/tool review as HTML — even casual phrases like "write a review of X" or "review page for Y" should trigger. Always asks for the author profile and image generator preference up front — never assumes defaults.
---

# Multimedia Review Article Generator

This skill creates a complete, publish-ready interactive HTML review article from four inputs collected up front: a **keyword**, a **target website URL**, an **author profile** (name, credentials, profile URL, avatar source), and an **image generator choice** (`nano-banana` for cheap-and-decorative or `gpt-image-2` for text-accurate). Everything else — research, screenshots, images, internal links, LSI keywords, schema markup — is handled automatically.

## Required Inputs

| Parameter | Required | Notes |
|-----------|----------|-------|
| `KEYWORD` | Yes | Target search keyword, e.g. "koala writer review" |
| `TARGET_SITE` | Yes | Domain whose sitemap is mined for internal links, e.g. "example.com" |
| `AUTHOR_NAME` | **Always ask** | Full display name for the EEAT byline |
| `AUTHOR_PROFILE_URL` | **Always ask** | LinkedIn, personal site, or other authoritative profile the bio links to |
| `AUTHOR_CREDENTIALS` | **Always ask** | One-line credibility statement (years of experience, role, notable wins) |
| `AUTHOR_AVATAR_SOURCE` | **Always ask** | One of: (a) direct image URL, (b) local file path, (c) public YouTube channel handle to scrape, or (d) "skip — no photo" |
| `IMAGE_GENERATOR` | **Always ask** | Either `nano-banana` (cheap, decorative-strong, hallucinates text) or `gpt-image-2` (more expensive, text-accurate). The choice applies to BOTH the featured hero AND the infographics — pick one and the whole article uses it. |
| `TESTING_PERIOD` | Optional | How long the author tested the product, used in the intro (default: "the past few weeks") |

### Pre-flight interview (do this BEFORE running any other step)

Never hardcode an author, and never assume an image generator. Even if a name or preference appears in surrounding memory or conversation, confirm it explicitly. Ask all questions in a single turn so the user can answer once and walk away:

> "A couple of things before I start:
> 1. **Display name** (e.g. 'Jane Doe')
> 2. **Profile URL** (LinkedIn or personal site this bio links to)
> 3. **One-line credentials** (e.g. '12 years in B2B SaaS, ex-HubSpot')
> 4. **Avatar source** — a direct image URL, a local file path, a public YouTube handle to scrape, or 'skip' for no photo
> 5. **Image generator** — `nano-banana` (cheaper, ~$0.04/image total, but hallucinates text on infographics) OR `gpt-image-2` (~$0.15/image total, renders text accurately). Whatever you pick is used for BOTH the featured hero and the infographics."

Persist the answers in a local `run-config.json` next to the article output so re-runs don't re-prompt:

```json
{
  "author": {
    "name": "...",
    "profile_url": "...",
    "credentials": "...",
    "avatar_source": "...",
    "testing_period": "..."
  },
  "image_generator": "nano-banana"
}
```

If the user supplies these values up front in their request, skip the interview and proceed.

## Pipeline Overview

The skill runs 7 steps in sequence. Steps 1-4 can largely happen in parallel via subagents to save time.

```
Step 0: Pre-flight interview — author profile + image generator choice
Step 1: Research the product (web search)
Step 2: Fetch target site sitemap for internal links
Step 3: Generate LSI keywords
Step 4: Capture real product screenshots (Playwright)
Step 5: Generate hero + infographics with the chosen generator (NanoBanana OR GPT Image 2)
Step 6: Build the HTML article
Step 7: Verify quality
```

---

## Step 1: Research the Product

Use WebSearch to gather comprehensive product data. Run multiple searches to cover different angles:

1. **Product features and pricing**: `"[product name] review [current year] features pricing"`
2. **User testimonials**: `"[product name] review [current year] user testimonials reddit"`
3. **Official product page**: `"[product domain] features"`
4. **Pros, cons, limitations**: `"[product name] pros cons limitations [current year]"`

Then use WebFetch on key pages:
- The product's official pricing page
- Verified review platforms (Capterra, G2, Trustpilot) for real testimonials
- 2-3 high-quality existing reviews for competitive context

**What to extract:**
- Pricing tiers and plan details
- Core features and specifications
- Target audience
- Verified user testimonials (2025+ only, with reviewer name, role, date, and rating)
- Known pros and cons from real users
- Competitor names for the comparison section

**Important**: Only use verifiable data. Never fabricate testimonials, statistics, or quotes. If you can't find enough verified 2025 testimonials, use what you have and note the limitation.

---

## Step 2: Fetch the Target Site Sitemap

Fetch the target site's post sitemap to find contextually relevant internal link targets:

```
WebFetch: https://[TARGET_SITE]/post-sitemap.xml
```

If that fails, try `/sitemap.xml`, `/sitemap_index.xml`, or `/wp-sitemap-posts-post-1.xml`.

From the sitemap, identify **8-15 contextually relevant articles** to link to from within the review. Prioritize:
- Other reviews (especially competitor reviews)
- Guides related to the product category
- Tool comparisons
- How-to articles the reader would naturally want next

These links get woven into the article prose naturally — never as a link dump or "Related Articles" list.

---

## Step 3: Generate LSI Keywords

Based on the research, generate 15-20 LSI (Latent Semantic Indexing) keywords and entities related to the main keyword. These should include:

- Product name variations (e.g., "KoalaWriter", "Koala AI", "koala.sh")
- Feature-specific terms (e.g., "auto internal linking", "SERP analysis tool")
- Category terms (e.g., "AI writing tool", "AI content generator", "SEO content creation tool")
- Competitor names mentioned naturally
- Problem/solution phrases (e.g., "one-click article generator", "bulk AI content")
- Long-tail variations (e.g., "[product] free trial", "[product] pricing", "[product] alternatives")

Weave these throughout the article naturally — never sacrifice readability for keyword density.

---

## Step 4: Capture Real Product Screenshots (Playwright)

Use Playwright (headless Chromium) to capture real screenshots of the product. This adds authenticity and visual proof that you actually tested the product — and unlike third-party screenshot APIs, Playwright has no quota, no expiring URLs, and renders the page in a real browser engine so modern JS-heavy SaaS pages look correct.

**Why Playwright over a hosted screenshot API**: deterministic, free, runs in the same sandbox the skill already uses for other workflows, and gives full control over viewport size, wait conditions, and full-page capture.

**One-time install** (the script auto-bootstraps if missing):
```bash
pip install --break-system-packages playwright pillow
python -m playwright install chromium
```

**Capture at minimum 2 screenshots:**
1. The product homepage
2. The pricing page

(Add more if relevant — features page, dashboard preview, etc.)

**Playwright capture pattern** — save this as `capture_screenshots.py` in the article output directory and run it:
```python
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image

TARGETS = [
    {"url": "https://example.com/",         "out": "homepage"},
    {"url": "https://example.com/pricing",  "out": "pricing"},
]
OUT_DIR = Path(sys.argv[1] if len(sys.argv) > 1 else "./images")
OUT_DIR.mkdir(parents=True, exist_ok=True)

async def capture(page, url, out_stem):
    await page.goto(url, wait_until="networkidle", timeout=45000)
    # Give late-loading hero animations a beat
    await page.wait_for_timeout(2500)
    png_path = OUT_DIR / f"{out_stem}.png"
    # full_page=True grabs the whole scrollable area; set False for just the viewport
    await page.screenshot(path=str(png_path), full_page=True)
    # Convert to WebP for smaller embed size
    img = Image.open(png_path)
    img.save(OUT_DIR / f"{out_stem}.webp", "WEBP", quality=82, method=6)
    png_path.unlink()  # keep only the WebP

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,  # retina-quality output
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/124.0.0.0 Safari/537.36",
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
```

**Tips:**
- If a page has a cookie banner that covers the hero, dismiss it before screenshotting: `await page.click("text=Accept", timeout=3000)` wrapped in a try/except.
- For mobile-view screenshots use `playwright.devices["iPhone 13"]` as the context preset.
- If `networkidle` times out (some sites keep long-polling), fall back to `wait_until="load"` plus a longer `wait_for_timeout`.
- Authenticated SaaS pages: reuse a saved Playwright `storageState` JSON via `browser.new_context(storage_state="auth.json")` so the screenshot is taken while logged in.

---

## Step 5: Generate Images (single chosen generator)

The user picked one tool in the pre-flight interview — use it for ALL three images. Do NOT mix generators mid-run; consistency matters for the visual look of the article.

| Generator | Strengths | Weaknesses | Approx. cost (3 images) |
|---|---|---|---|
| `nano-banana` | Cheap, fast, strong on decorative/abstract visuals | Hallucinates text — numbers and labels on infographics will often be garbled or misspelled | ~$0.12 |
| `gpt-image-2` | Renders text accurately, sharp typography, reliable for stat cards | More expensive, slower per image | ~$0.45 (3× 2K @ $0.05 plus margin) |

Read the chosen sibling SKILL.md for full API details:
- `nano-banana` → script at `NANO_BANANA_SKILL_DIR/scripts/nanobanana_api.py`
- `gpt-image-2` → script at `GPT_IMAGE_2_SKILL_DIR/scripts/gpt_image_2_api.py`

Generate **3 images minimum**: featured hero, stats infographic, competitor comparison infographic.

---

### Path A — `IMAGE_GENERATOR = "nano-banana"`

NanoBanana hallucinates text, so write prompts that DON'T require specific numbers, names, or headline text to render correctly. Lean into the decorative direction.

**1. Featured Hero (16:9)**
```bash
python NANO_BANANA_SKILL_DIR/scripts/nanobanana_api.py generate \
  "Professional blog featured image for [PRODUCT_NAME] Review. Modern flat design showing [product-relevant visual elements]. Dark navy blue background with electric blue and orange accent colors, subtle data visualization elements, clean and professional, suitable as article hero banner. No text overlay needed." \
  --size 16:9 --output OUTPUT_DIR/images/featured-[SLUG] --webp
```

**2. Stats Infographic (4:3) — abstract version**
Don't ask NanoBanana to render exact numbers; ask for the LOOK of a stats card.
```bash
python NANO_BANANA_SKILL_DIR/scripts/nanobanana_api.py generate \
  "Abstract statistics dashboard graphic for [PRODUCT_NAME] review. Six glowing data tiles in a 2x3 grid suggesting large numeric values and short labels, but the text is intentionally blurred/illegible — viewed as ambient data art, not readable. Dark navy (#0F1B3A) background, cream and light-blue glows. Clean modern editorial mood. No specific text the viewer needs to read." \
  --size 4:3 --output OUTPUT_DIR/images/stats-[SLUG] --webp
```
Then overlay the real stats with HTML/CSS on top of the image when building Step 6 — that way the numbers are crisp, accessible, and indexable.

**3. Competitor Comparison (4:3) — abstract bars**
```bash
python NANO_BANANA_SKILL_DIR/scripts/nanobanana_api.py generate \
  "Abstract horizontal bar chart graphic, 4 bars at different lengths, top bar highlighted in coral (#F25F4C), other bars in muted slate. Dark navy background, no readable text labels (text is intentionally blurred), clean editorial data-visualization mood." \
  --size 4:3 --output OUTPUT_DIR/images/comparison-[SLUG] --webp
```
Same pattern: render the real competitor names and values as an HTML table next to the image in Step 6.

---

### Path B — `IMAGE_GENERATOR = "gpt-image-2"`

GPT Image 2 renders text correctly, so you can bake the headline + numbers directly into each image — no HTML overlay needed.

**1. Featured Hero (16:9, 2K)**
```bash
python GPT_IMAGE_2_SKILL_DIR/scripts/gpt_image_2_api.py generate \
  "Editorial blog hero banner, 16:9 format. Large coral serif headline reading '[PRODUCT_NAME] Review' centred-left, small cream kicker label above it reading '[CATEGORY] · [YEAR]'. Dark navy (#0F1B3A) background, thin coral (#F25F4C) accent line at the top edge, subtle abstract data-visualization shapes on the right side in muted blue. Clean modern editorial typography. Sharp text rendering. No people, no photography." \
  --aspect-ratio 16:9 --resolution 2K \
  --output OUTPUT_DIR/images/featured-[SLUG] --webp
```

**2. Stats Infographic (4:3, 2K)**
```bash
python GPT_IMAGE_2_SKILL_DIR/scripts/gpt_image_2_api.py generate \
  "Editorial statistics infographic poster, 4:3 format. Title at top: '[PRODUCT_NAME] — Key Metrics [YEAR]'. Six data cards in a 2x3 grid, each card shows a large bold number on the left and a short label on the right. Cards contain exactly these values: [LIST 5-6 KEY STATS FROM RESEARCH, EACH AS 'NUMBER — LABEL']. Color scheme: dark navy (#0F1B3A) background, cream (#FAF4E6) numbers, light blue (#6FA8FF) accent on labels. Clean modern sans-serif. Sharp text rendering. No photography, no decorative imagery — pure editorial data design." \
  --aspect-ratio 4:3 --resolution 2K \
  --output OUTPUT_DIR/images/stats-[SLUG] --webp
```

**3. Competitor Comparison (4:3, 2K)**
```bash
python GPT_IMAGE_2_SKILL_DIR/scripts/gpt_image_2_api.py generate \
  "Editorial comparison bar chart infographic, 4:3 format. Title: '[PRODUCT] vs [COMPETITORS] — [METRIC]'. Horizontal bar chart with [2-4 COMPETITORS] rows, each labeled with the competitor name on the left and the numeric value at the end of the bar. Highlighted bar for [PRODUCT] in coral (#F25F4C); other bars in muted slate. Dark navy background, cream text. Clean axis at the bottom with tick labels. No photography, no people, professional data visualization style." \
  --aspect-ratio 4:3 --resolution 2K \
  --output OUTPUT_DIR/images/comparison-[SLUG] --webp
```

---

### Mandatory visual verification (BOTH paths)

After images return, **open each PNG via the `Read` tool** and confirm:
- **Path A (NanoBanana):** the image fits the decorative role asked for; no accidental legible-but-wrong text that contradicts the article (e.g. a fake competitor name baked into a bar). NanoBanana sometimes inserts garbage text even when told not to — if it did, regenerate.
- **Path B (GPT Image 2):** numbers match the values you asked for (no dropped digits), product/competitor names spelled correctly, no garbled letters or duplicated words, title text matches the prompt.

If anything's wrong, regenerate that specific image. Never ship a bad infographic — readers will see broken text and bounce.

All images must be generated BEFORE building the HTML, because they get embedded as base64 data URIs for a self-contained file.

---

## Step 6: Build the HTML Article

### Embedding Images

Convert all WebP images to base64 and embed them directly in the HTML:
```python
import base64
with open("image.webp", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()
# Use in HTML: src="data:image/webp;base64,{b64}"
```

This makes the HTML file completely self-contained — no broken images regardless of where it's opened.

### Author Avatar

Resolve the avatar based on what the user answered for `AUTHOR_AVATAR_SOURCE`:

- **Direct image URL** → `curl` it down, convert to WebP, embed as base64. Warn the user once that ephemeral hosts (LinkedIn CDN, Twitter, etc.) can expire — recommend a stable URL or local file for production.
- **Local file path** → read it directly, convert to WebP, embed as base64. Most reliable.
- **Public YouTube channel handle** (e.g. `@somecreator`) → scrape the public avatar (YouTube CDN URLs are stable):
  ```bash
  curl -s "https://www.youtube.com/[HANDLE]" -H "User-Agent: Mozilla/5.0" \
    | grep -oP 'https://yt3\.googleusercontent\.com/[^"]+' | head -1
  ```
  Append `=s200-c-k-c0x00ffffff-no-rj` for a 200px crop. Convert to WebP and embed as base64.
- **"skip"** → render the EEAT bio box without a photo. Use the author's initials in a styled circle as a fallback, or omit the avatar element entirely.

Never embed an operator-specific default. The avatar must come from what the user supplied this run.

### Article Structure

Follow this exact 12-section outline. The section names are fixed, but adapt the content language for the product type (software tool vs physical product vs service):

```
1.  Introduction & First Impressions
    - Hook: key verdict in the first paragraph
    - Product context: what it is, who it's for
    - Your credentials: brief EEAT mention
    - Testing period: how long you tested

2.  Product Overview & Specifications
    - What's included: features, tools, components
    - Key specs: technical details buyers care about
    - Price point: current pricing summary
    - Target audience

3.  Design & Interface (or Build Quality for physical)
    - Visual appeal: how the UI/product looks
    - Usability: how easy it is to use
    - Screenshots of the actual product

4.  Performance Analysis
    4.1 Core functionality testing results
    4.2 Key performance metrics (with data table)
    4.3 Category-specific performance areas
    - Include a CSS bar chart for visual scoring

5.  User Experience
    - Setup process
    - Daily usage workflow
    - Learning curve
    - Support quality

6.  Comparative Analysis
    - Feature comparison table (vs 2-3 competitors)
    - Price comparison
    - When to choose this vs alternatives
    - Competitor comparison infographic

7.  Pros and Cons
    - Side-by-side grid layout
    - Green box for pros, red box for cons
    - Specific, evidence-based points

8.  Evolution & Updates (current year)
    - What's new this year
    - Model/version updates
    - Roadmap if known

9.  Purchase Recommendations
    - Best For: specific user types (bulleted)
    - Skip If: deal-breakers (bulleted)
    - Alternatives to Consider: with links

10. Where to Buy & Best Deals
    - Official purchase link
    - Pricing tips and discount strategies
    - Refund policy

11. Final Verdict
    - Numerical score in a styled verdict box
    - Summary justification
    - Clear recommendation

12. Evidence & Proof
    - Verified user testimonials (2025+ only)
    - Stats infographic
    - Data/measurement summary
```

### Required Interactive Element

Every review MUST include an interactive widget. The most common is a **cost calculator** where the user inputs their needs and gets a plan recommendation. Other options depending on the product:
- Feature comparison selector
- ROI calculator
- Needs assessment quiz

Use vanilla JS only. Provide sensible defaults. Make it mobile responsive.

### SEO Requirements

1. **Main keyword in the first 50 words** of the article body
2. **Main keyword in at least one H2**
3. **LSI keywords** woven naturally throughout — aim for 15+ unique LSI terms
4. **8-15 internal links** to the target site, woven into prose paragraphs (never as link lists)
5. **8-10 external links** to sources, official product pages, and review platforms
6. **EEAT author bio box** near the top with photo, name, credentials, and link to the author's professional profile
7. **Review schema** (JSON-LD) with rating, author, publisher, datePublished
8. **FAQPage schema** (JSON-LD) for the FAQ section
9. **7+ FAQ items** using `<details>/<summary>` accordion pattern
10. **No H1 tags** — use H2 as the highest heading (WordPress provides its own H1)
11. **No footer element** in the HTML
12. **Mobile responsive** with at least 2 media query breakpoints
13. **Open Graph and Twitter Card meta tags**

### CSS Approach

Write clean, original CSS. Do NOT use patterns from other skills (no Arvow, no Ahrefs, no linkable-asset patterns). Keep the design system simple with CSS custom properties:

```css
:root {
  --blue: #2563EB;
  --orange: #F59E0B;
  --green: #10B981;
  --red: #EF4444;
  --dark: #1E293B;
  --gray: #64748B;
  --light: #F8FAFC;
  --border: #E2E8F0;
}
```

Key components to style: author box, hero rating box, screenshot container, data tables, callout boxes, bar chart, pros/cons grid, calculator widget, verdict box, FAQ accordion, testimonial cards.

**Critical**: No blank lines inside `<style>` blocks (WordPress's wpautop filter breaks them).

### Writing Voice

- **Readability**: Aim for Flesch-Kincaid 6th grade level
- **Tone**: Confident expert sharing honest findings — not salesy, not academic
- **Personal**: Include first-person testing stories and specific examples
- **Jargon**: Explain technical terms or avoid them
- **No fluff**: Every sentence should contain information, data, or analysis

---

## Step 7: Verify Quality

Run a verification script that checks all critical requirements:

| Check | Must Pass |
|-------|-----------|
| No `<h1>` tags in the article body | Yes |
| Main keyword appears in first 50 words | Yes |
| 8+ internal links to target site | Yes |
| 5+ external links | Yes |
| Author EEAT link present | Yes |
| No blank lines inside `<style>` blocks | Yes |
| Review JSON-LD schema present | Yes |
| FAQPage JSON-LD schema present | Yes |
| 3+ embedded WebP images (base64) | Yes |
| 5+ FAQ accordion items | Yes |
| Interactive calculator/widget works | Yes |
| No `<footer>` element | Yes |
| Mobile responsive (media queries exist) | Yes |

If any check fails, fix it before delivering.

---

## Output

Save the final article to:
```
[OUTPUT_DIR]/[slug]/[slug].html
```

Along with the raw image files in:
```
[OUTPUT_DIR]/[slug]/images/
```

The HTML file is fully self-contained (all images base64-embedded) and can be opened in any browser or published to WordPress.

---

## Sibling Skills

- **nano-banana**: Cheap, fast image generation — strong on decorative/abstract visuals, hallucinates text. Read its SKILL.md for API details if `IMAGE_GENERATOR = "nano-banana"`.
- **gpt-image-2**: Text-accurate image generation — reliable for stat cards, headlines, and any image where labels must be readable. Read its SKILL.md before generating if `IMAGE_GENERATOR = "gpt-image-2"`.
