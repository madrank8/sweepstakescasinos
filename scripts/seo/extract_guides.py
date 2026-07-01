#!/usr/bin/env python3
"""
extract_guides.py - build pages.json for the SEO scorers from BUILT guide HTML.

Reads dist/client/guides/*/index.html (run `npm run build` first) and emits the
page-object list corpus_fingerprint.py + r45_provenance.py consume:
  url, title, meta_description, heading_sequence, intro_wordcount,
  paragraph_count, section_count, publish_date, text, html

stdlib-only. Output: .seo/pages.json
"""
import json
import os
import re
import sys
from glob import glob

ROOT = os.getcwd()
GUIDES = sorted(glob(os.path.join(ROOT, "dist", "client", "guides", "*", "index.html")))


def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s or "")).strip()


def first(pattern, text, group=1, flags=re.S | re.I):
    m = re.search(pattern, text or "", flags)
    return m.group(group) if m else ""


def extract(path):
    html = open(path, "r", encoding="utf-8").read()
    slug = os.path.basename(os.path.dirname(path))
    main = first(r"<main[^>]*>(.*?)</main>", html) or html

    headings = re.findall(r"<(h[23])[^>]*>(.*?)</\1>", main, re.S | re.I)
    heading_sequence = ["%s:%s" % (tag.upper(), strip_tags(inner)[:60]) for tag, inner in headings]

    paragraphs = re.findall(r"<p[^>]*>(.*?)</p>", main, re.S | re.I)
    para_texts = [strip_tags(p) for p in paragraphs]
    para_texts = [p for p in para_texts if p]
    intro_wordcount = len(para_texts[0].split()) if para_texts else 0

    date = first(r'"dateModified":"([0-9]{4}-[0-9]{2}-[0-9]{2})"', html) or \
        first(r'"datePublished":"([0-9]{4}-[0-9]{2}-[0-9]{2})"', html)

    return {
        "url": first(r'<link rel="canonical" href="([^"]+)"', html) or ("/guides/%s/" % slug),
        "title": strip_tags(first(r"<title[^>]*>(.*?)</title>", html)),
        "meta_description": first(r'<meta name="description" content="([^"]*)"', html),
        "heading_sequence": heading_sequence,
        "intro_wordcount": intro_wordcount,
        "paragraph_count": len(para_texts),
        "section_count": sum(1 for h in heading_sequence if h.startswith("H2")),
        "publish_date": date or None,
        "text": strip_tags(main),
        "html": html,
    }


def main():
    if not GUIDES:
        sys.exit("No built guides found. Run `npm run build` first (dist/client/guides/*/index.html).")
    pages = [extract(p) for p in GUIDES]
    os.makedirs(os.path.join(ROOT, ".seo"), exist_ok=True)
    out = os.path.join(ROOT, ".seo", "pages.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(pages, fh, ensure_ascii=False, indent=2)
    print("wrote %s (%d guide pages)" % (out, len(pages)))


if __name__ == "__main__":
    main()
