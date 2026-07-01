#!/usr/bin/env python3
"""
r45_provenance.py - deterministic R45 non-commodity provenance audit (canonical: SC-098).

VENDORED from ~/.claude/skills/algorithmic-authorship-gate/scripts/r45_provenance.py (v1.0)
so the check runs inside this repo / CI. Re-sync if the canonical skill changes.

Audits each page for the non-commodity payload its content_type implies. Status per page:
  COMMODITY-SUSPECT      no content_type signature present on the page at all
  PROVENANCE-UNVERIFIED  signature present, backing artifact not confirmed on file
  PROVENANCE-OK          signature present AND artifacts confirmed (or on-page-sufficient
                         for infrastructure/glossary pages)

stdlib-only.

Usage:
    python r45_provenance.py --in pages.json [--manifest manifest.json] [--out report.json]
"""

from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

CONTENT_TYPES = ("case_study", "original_data_study", "firsthand_review",
                 "contrarian_opinion", "infrastructure")


def _norm(text):
    return re.sub(r"\s+", " ", (text or "")).strip()

def _count(pattern, text, flags=re.I):
    return len(re.findall(pattern, text or "", flags))

def _has(pattern, text, flags=re.I):
    return re.search(pattern, text or "", flags) is not None

def _slug(url):
    s = re.sub(r"^https?://[^/]+", "", url or "").strip("/")
    return s.split("?")[0].split("#")[0]


_METRIC = r"(\$\s?\d[\d,\.]*|\d[\d,\.]*\s?(%|x\b|percent|kr|usd|eur|gbp)|\d[\d,\.]*\s?(million|billion|k\b|m\b))"
_CHANGE = r"\b(increased|decreased|grew|dropped|rose|fell|cut|reduced|doubled|tripled|boosted|improved|from\s+\d|to\s+\d|before|after)\b"
_TIMEFRAME = r"\b(in|over|within|after|across)\s+\d+\s+(day|days|week|weeks|month|months|year|years|quarter|quarters)\b|\b\d{4}\s*(-|to)\s*\d{4}\b"
_DATE = r"\b(20\d{2}|january|february|march|april|may|june|july|august|september|october|november|december)\b"
_N_SIZE = r"\bn\s*=\s*\d+\b|\b\d{2,}\s+(respondents|participants|websites|pages|samples|sites|users|customers|reviews)\b"
_METHOD = r"\b(methodology|we surveyed|we analy|we polled|we collected|we studied|sample of|our analysis of|dataset|data set|self-reported|margin of error)\b"
_FIRST_PERSON = r"\b(i|we|my|our|me|us)\b"
_ANECDOTE = r"\b(when i|i tested|i tried|i signed up|i deposited|i withdrew|i played|i used|i visited|i spoke|i contacted|in my experience|i found|i noticed|we tested|we tried)\b"
_OBS_COUNT = r"\b\d+\s+(callouts|tests|sessions|withdrawals|deposits|hands|spins|hours|trades|reviews|sites|brands|cases|clients|inspections|visits|calls)\b"
_CREDENTIAL = r"\b(licensed|board-certified|certified|accredited|nmls|registered|chartered|\d+\s+years?(\s+of)?\s+experience|since\s+(19|20)\d{2})\b"
_CONSENSUS = r"\b(conventional wisdom|most (people|experts|sites|guides)\s+(say|believe|recommend|claim)|everyone (says|thinks|believes)|common advice|received wisdom|popular belief)\b"
_COUNTER = r"\b(but |however|the truth is|in reality|actually|i disagree|the opposite|contrary to|myth)\b"
_PORTFOLIO = r"\b(in one case|for (a|one) client|we saw|we found|for example|case study|when we (ran|built|tested|managed)|one of (our|my))\b"
_FAILS = r"\b(only when|fails when|breaks down when|except when|unless|stops working when|the exception)\b"


def _sig_case_study(text, html):
    m = _count(_METRIC, text)
    return {
        "before_after_metric": m >= 2 and _has(_CHANGE, text),
        "timeframe": _has(_TIMEFRAME, text),
        "attribution": _has(r"\b(our|we|client|the team)\b", text) and m >= 1,
    }

def _sig_original_data_study(text, html):
    return {
        "methodology": _has(_METHOD, text),
        "n_size": _has(_N_SIZE, text),
        "collection_date": _has(_DATE, text),
        "original_chart": _has(r"<table|<img\b", html) or _has(r"\b(figure|table|chart)\s+\d\b|chart below|table below", text),
    }

def _sig_firsthand_review(text, html):
    fp = _count(_FIRST_PERSON, text)
    return {
        "first_person_anecdotes": _count(_ANECDOTE, text) >= 3 or fp >= 8,
        "observation_count": _has(_OBS_COUNT, text),
        "credentials": _has(_CREDENTIAL, text),
    }

def _sig_contrarian_opinion(text, html):
    return {
        "consensus_position": _has(_CONSENSUS, text),
        "counter_position": _has(_COUNTER, text),
        "portfolio_cases": _count(_PORTFOLIO, text) >= 2,
        "where_consensus_fails": _has(_FAILS, text),
    }

def _sig_infrastructure(text, html):
    internal = _count(r'href=["\']/(?!/)', html)
    return {
        "wikidata_sameas": _has(r"wikidata\.org|sameas|\"@id\"", html + " " + text),
        "internal_links_3plus": internal >= 3,
        "entity_scaffold": _has(r"\b(is a|is an|refers to|is defined as|definition|glossary)\b", text),
        "faq_or_dl": _has(r"<dl\b|<dt\b", html) or _count(r"<h[23][^>]*>\s*(what|how|why|when|who)\b", html) >= 3,
    }


_DETECTORS = {
    "case_study": _sig_case_study,
    "original_data_study": _sig_original_data_study,
    "firsthand_review": _sig_firsthand_review,
    "contrarian_opinion": _sig_contrarian_opinion,
    "infrastructure": _sig_infrastructure,
}

_MINIMUM = {
    "case_study": lambda a: a["before_after_metric"] and (a["timeframe"] or a["attribution"]),
    "original_data_study": lambda a: a["methodology"] and a["n_size"],
    "firsthand_review": lambda a: a["first_person_anecdotes"] and (a["observation_count"] or a["credentials"]),
    "contrarian_opinion": lambda a: a["consensus_position"] and a["counter_position"] and a["portfolio_cases"],
    "infrastructure": lambda a: (a["wikidata_sameas"] or a["internal_links_3plus"]) and a["entity_scaffold"],
}

_ONPAGE_SUFFICIENT = {"infrastructure"}

_OFFPAGE_NEEDS = {
    "case_study": ["dataset", "proof_record"],
    "original_data_study": ["dataset", "methodology"],
    "firsthand_review": ["anecdote_source", "proof_record"],
    "contrarian_opinion": ["portfolio", "proof_record"],
    "infrastructure": [],
}

_ACTION = {
    "PROVENANCE-OK": "none - non-commodity payload is backed",
    "PROVENANCE-UNVERIFIED": "locate and log the artifact (Source Ledger / digital-fingerprint-stack), or drop the unsupported claim",
    "COMMODITY-SUSPECT": "retro-brief via content-brief-generator (declare content_type + forcing inputs) or prune/merge - not a REWRITE",
}


def _score_type(ct, text, html):
    artifacts = _DETECTORS[ct](text, html)
    return {
        "artifacts": artifacts,
        "matched": bool(_MINIMUM[ct](artifacts)),
        "present": [k for k, v in artifacts.items() if v],
        "missing": [k for k, v in artifacts.items() if not v],
    }

def _infer_type(text, html):
    scored = {ct: _score_type(ct, text, html) for ct in CONTENT_TYPES}
    ranked = sorted(scored.items(),
                    key=lambda kv: (1 if kv[1]["matched"] else 0, len(kv[1]["present"])),
                    reverse=True)
    top_ct, top = ranked[0]
    return (top_ct, top) if top["matched"] else ("", top)

def _offpage_ok(ct, url, manifest):
    if ct in _ONPAGE_SUFFICIENT:
        return True
    if not manifest:
        return False
    rec = manifest.get(url) or manifest.get(_slug(url))
    if not rec:
        return False
    arts = rec.get("artifacts", {})
    needs = _OFFPAGE_NEEDS.get(ct, [])
    return any(arts.get(a) for a in needs) if needs else True


def audit_page(page, manifest):
    url = page.get("url", "")
    text = _norm(page.get("text", ""))
    html = page.get("html", "") or ""
    declared = (page.get("content_type") or "").strip().lower()

    if declared in CONTENT_TYPES:
        ct, scored, ct_source = declared, _score_type(declared, text, html), "declared"
    else:
        ct, scored = _infer_type(text, html)
        ct_source = "inferred" if ct else "none"

    on_page = bool(ct) and scored["matched"]
    if not on_page:
        status, off = "COMMODITY-SUSPECT", None
    else:
        off = _offpage_ok(ct, url, manifest)
        status = "PROVENANCE-OK" if off else "PROVENANCE-UNVERIFIED"

    return {
        "url": url,
        "content_type": ct or None,
        "content_type_source": ct_source,
        "status": status,
        "on_page_signature": {
            "present": scored["present"] if ct else [],
            "missing": scored["missing"] if ct else [],
        },
        "off_page_verified": off,
        "action": _ACTION[status],
    }


def main():
    ap = argparse.ArgumentParser(description="R45 non-commodity provenance audit (SC-098).")
    ap.add_argument("--in", dest="infile", required=True, help="pages.json (list of page objects)")
    ap.add_argument("--manifest", dest="manifest", default=None,
                    help="optional brief-archive/fingerprint manifest for off-page verification")
    ap.add_argument("--out", dest="outfile", default=None, help="write JSON report here")
    args = ap.parse_args()

    pages = json.loads(Path(args.infile).read_text(encoding="utf-8-sig"))
    if isinstance(pages, dict):
        pages = pages.get("pages", [])
    manifest = {}
    if args.manifest:
        manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8-sig")) or {}

    results = [audit_page(p, manifest) for p in pages]
    summary = {
        "provenance_ok": sum(r["status"] == "PROVENANCE-OK" for r in results),
        "provenance_unverified": sum(r["status"] == "PROVENANCE-UNVERIFIED" for r in results),
        "commodity_suspect": sum(r["status"] == "COMMODITY-SUSPECT" for r in results),
        "total": len(results),
    }
    report = {
        "tool": "r45_provenance", "version": "1.0", "canonical": "SC-098",
        "manifest_provided": bool(manifest), "summary": summary, "pages": results,
    }
    out = json.dumps(report, indent=2, ensure_ascii=False)
    if args.outfile:
        Path(args.outfile).write_text(out, encoding="utf-8")
        print("R45 provenance: " + json.dumps(summary) + " -> " + args.outfile)
    else:
        print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
