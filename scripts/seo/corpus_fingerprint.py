#!/usr/bin/env python3
"""
corpus_fingerprint.py - Corpus Fingerprint Layer (CFL) for the Algorithmic Authorship Gate (BATCH mode).

VENDORED from ~/.claude/skills/algorithmic-authorship-gate/scripts/corpus_fingerprint.py
(v1.3) so the gate runs inside this repo / CI without the global skills dir. Re-sync if the
canonical skill changes. Deterministic, stdlib-only.

Computes the Fingerprint Diffusion Score (FDS): D2 structural-skeleton isomorphism (R42),
D3 metadata-template uniformity (R43), D4 publish-velocity (R44), D1 paragraph sameness (R15,
only if shingles supplied). Higher FDS = healthier variance. Bands: >=80 HEALTHY, 60-79
DIFFUSION-RISK, <60 FINGERPRINTED.

Usage:
  python corpus_fingerprint.py --in pages.json [--capacity 8] [--baseline-days 30] \
      [--min-cluster 5] [--keep 0.10] [--out report.json]
"""

import argparse
import json
import re
import sys
from collections import Counter
from datetime import date, datetime
from statistics import mean, median, pstdev

YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")
NUM_RE = re.compile(r"\d+(?:[.,]\d+)?")
WORD_RE = re.compile(r"\{year\}|\{n\}|[a-z0-9]+(?:'[a-z]+)?")
TOK_RE = re.compile(r"\{year\}|\{n\}|[a-z0-9]+(?:'[a-z]+)?|[^\w\s]")


def parse_dt(value):
    if not value:
        return None
    if isinstance(value, (int, float)):
        try:
            return datetime.utcfromtimestamp(value).date()
        except Exception:
            return None
    s = str(value).strip()
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            return None
    for fmt in ("%Y/%m/%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(s[:10], fmt).date()
        except ValueError:
            continue
    return None


def prenorm(text):
    t = YEAR_RE.sub(" {year} ", text or "")
    t = NUM_RE.sub(" {n} ", t)
    return t.lower()


def build_df(texts):
    df = Counter()
    for t in texts:
        df.update(set(WORD_RE.findall(prenorm(t))))
    return df


def template_skeleton(text, df, n_docs, keep):
    if not text:
        return ""
    threshold = max(2, keep * n_docs)
    out = []
    for tok in TOK_RE.findall(prenorm(text)):
        if tok in ("{year}", "{n}"):
            out.append(tok)
        elif WORD_RE.fullmatch(tok):
            out.append(tok if df.get(tok, 0) >= threshold else "{var}")
        else:
            out.append(tok)
    skel = []
    for tok in out:
        if tok == "{var}" and skel and skel[-1] == "{var}":
            continue
        skel.append(tok)
    return " ".join(skel).strip()


def heading_archetype(seq):
    if isinstance(seq, str):
        return seq.strip().lower()
    if not isinstance(seq, list) or not seq:
        return ""
    levels = []
    for item in seq:
        m = re.match(r"h([1-6])", str(item).strip().lower())
        levels.append(int(m.group(1)) if m else 2)
    out, i, n = [], 0, len(levels)
    while i < n:
        if levels[i] <= 2:
            children, j = 0, i + 1
            while j < n and levels[j] > 2:
                children += 1
                j += 1
            out.append("h2(%s)" % ("h " * children).strip())
            i = j
        else:
            out.append("h%d" % levels[i])
            i += 1
    return " ".join(out)


def section_count_of(page):
    if isinstance(page.get("section_count"), int):
        return page["section_count"]
    seq = page.get("heading_sequence")
    if isinstance(seq, list):
        return sum(1 for x in seq if str(x).strip().lower().startswith("h2"))
    return None


def cov(values):
    vals = [v for v in values if isinstance(v, (int, float))]
    if len(vals) < 2:
        return None
    m = mean(vals)
    return 0.0 if m == 0 else pstdev(vals) / m


def cluster_metrics(labels, min_cluster):
    labels = [l for l in labels if l]
    total = len(labels)
    if total == 0:
        return 0.0, 0, []
    counts = Counter(labels)
    max_share = max(counts.values()) / total
    top = [
        {"skeleton": (lab if len(lab) <= 160 else lab[:157] + "..."), "pages": c,
         "share": round(c / total, 4)}
        for lab, c in counts.most_common(8) if c >= min_cluster
    ]
    return round(max_share, 4), len(counts), top


def cov_penalty(avg_cov, knee=0.20):
    if avg_cov is None:
        return 0.0
    return max(0.0, min(1.0, (knee - avg_cov) / knee)) * 100


def _r(x):
    return round(x, 3) if isinstance(x, (int, float)) else None


def band(fds):
    if fds is None:
        return "UNSCORED"
    return "HEALTHY" if fds >= 80 else ("DIFFUSION-RISK" if fds >= 60 else "FINGERPRINTED")


def score_structural(pages, min_cluster):
    archetypes = [heading_archetype(p.get("heading_sequence")) for p in pages]
    have = sum(1 for a in archetypes if a)
    max_share, distinct, top = cluster_metrics(archetypes, min_cluster)
    cov_intro = cov([p.get("intro_wordcount") for p in pages])
    cov_paras = cov([p.get("paragraph_count") for p in pages])
    cov_secs = cov([section_count_of(p) for p in pages])
    cov_vals = [c for c in (cov_intro, cov_paras, cov_secs) if c is not None]
    avg_cov = mean(cov_vals) if cov_vals else None
    penalty = 0.70 * (max_share * 100) + 0.30 * cov_penalty(avg_cov) if have else 0.0
    return {
        "score": round(max(0.0, 100.0 - penalty), 1),
        "rule": "R42",
        "signal": ["contentEffort", "NSR template detection"],
        "pages_with_headings": have,
        "distinct_skeletons": distinct,
        "max_identical_skeleton_share": max_share,
        "length_cov": {"intro_wordcount": _r(cov_intro), "paragraph_count": _r(cov_paras),
                       "section_count": _r(cov_secs), "avg": _r(avg_cov)},
        "top_skeleton_clusters": top,
    }, archetypes


def score_metadata(pages, min_cluster, keep):
    titles = [p.get("title", "") for p in pages]
    metas = [p.get("meta_description", "") for p in pages]
    t_df, m_df = build_df(titles), build_df(metas)
    n = len(pages)
    title_sk = [template_skeleton(t, t_df, n, keep) for t in titles]
    meta_sk = [template_skeleton(m, m_df, n, keep) for m in metas]
    t_max, t_distinct, t_top = cluster_metrics(title_sk, min_cluster)
    m_max, m_distinct, m_top = cluster_metrics(meta_sk, min_cluster)
    penalty = 0.5 * (t_max * 100) + 0.5 * (m_max * 100)
    return {
        "score": round(max(0.0, 100.0 - penalty), 1),
        "rule": "R43",
        "signal": ["contentEffort", "NSR", "QRG thin/templated"],
        "title": {"max_template_share": t_max, "distinct_templates": t_distinct, "top_templates": t_top},
        "meta_description": {"max_template_share": m_max, "distinct_templates": m_distinct, "top_templates": m_top},
    }, title_sk, meta_sk


def score_velocity(pages, capacity, baseline_days):
    dts = sorted(d for d in (parse_dt(p.get("publish_date")) for p in pages) if d)
    if len(dts) < 3:
        return {"score": None, "rule": "R44", "signal": ["SpamBrain velocity-spike"],
                "note": "insufficient publish dates (<3) - D4 skipped"}, {}
    span_days = max(1, (dts[-1] - dts[0]).days + 1)
    per_day = Counter(d.isoformat() for d in dts)
    daily = list(per_day.values())
    max_burst = max(daily)
    med_daily = median(daily)
    spike_ratio = (max_burst / med_daily) if med_daily else float(max_burst)

    flags, cap_pen = [], 0.0
    if capacity:
        over = {d: c for d, c in per_day.items() if c > capacity}
        if over:
            worst = max(over.values())
            cap_pen = min(1.0, worst / capacity - 1.0) * 100
            flags.append("%d day(s) exceed declared capacity %d/day (worst %d)" % (len(over), capacity, worst))
    spike_pen = max(0.0, min(1.0, (spike_ratio - 3.0) / 7.0)) * 100
    if spike_ratio >= 5:
        flags.append("max single-day burst is %.1fx the median daily rate" % spike_ratio)
    ramp_pen, density = 0.0, len(dts) / span_days
    if span_days <= 120 and len(dts) >= 100 and density > 3:
        ramp_pen = min(1.0, (density - 3) / 12) * 100
        flags.append("new-corpus ramp: %d pages over %d days (%.1f/day)" % (len(dts), span_days, density))

    penalty = max(spike_pen, cap_pen, ramp_pen)
    return {
        "score": round(max(0.0, 100.0 - penalty), 1),
        "rule": "R44",
        "signal": ["SpamBrain velocity-spike", "scaled-content-abuse volume"],
        "span_days": span_days, "active_days": len(per_day), "max_single_day": max_burst,
        "median_daily": med_daily, "mean_daily": round(len(dts) / span_days, 3),
        "spike_ratio_vs_median": round(spike_ratio, 2),
        "capacity_per_day": capacity, "baseline_days": baseline_days, "flags": flags,
    }, per_day


def score_paragraph(pages, min_cluster):
    have = [p for p in pages if isinstance(p.get("paragraph_shingles"), list) and p["paragraph_shingles"]]
    if len(have) < 3:
        return {"score": None, "rule": "R15", "signal": ["rhubarb", "siteQualityStddev"],
                "note": "no paragraph_shingles supplied - D1 deferred to gate R15 corpus pass"}
    sig = [Counter(p["paragraph_shingles"]).most_common(1)[0][0] for p in have]
    max_share, distinct, _ = cluster_metrics(sig, min_cluster)
    return {"score": round(max(0.0, 100.0 - max_share * 100), 1), "rule": "R15",
            "signal": ["rhubarb", "siteQualityStddev"], "max_shared_shingle_share": max_share,
            "distinct_lead_shingles": distinct,
            "note": "lightweight proxy; full shingling is the gate's dedicated R15 step"}


def main():
    ap = argparse.ArgumentParser(description="Corpus Fingerprint Layer (CFL) for the Algorithmic Authorship Gate.")
    ap.add_argument("--in", dest="infile", required=True, help="pages.json (list of page objects)")
    ap.add_argument("--capacity", type=int, default=None, help="declared sustainable pages/day")
    ap.add_argument("--baseline-days", type=int, default=30, help="trailing window for velocity baseline (advisory)")
    ap.add_argument("--min-cluster", type=int, default=5, help="min identical-skeleton pages to list as a cluster")
    ap.add_argument("--keep", type=float, default=0.10, help="scaffold DF threshold (token in >= keep*N docs is kept)")
    ap.add_argument("--out", default=None, help="write report JSON here (default: stdout)")
    args = ap.parse_args()

    with open(args.infile, "r", encoding="utf-8") as fh:
        pages = json.load(fh)
    if not isinstance(pages, list) or not pages:
        sys.exit("input must be a non-empty JSON list of page objects")

    d2, archetypes = score_structural(pages, args.min_cluster)
    d3, title_sk, meta_sk = score_metadata(pages, args.min_cluster, args.keep)
    d4, _ = score_velocity(pages, args.capacity, args.baseline_days)
    d1 = score_paragraph(pages, args.min_cluster)

    scored = [d["score"] for d in (d1, d2, d3, d4) if d.get("score") is not None]
    fds = round(mean(scored), 1) if scored else None

    arch_cnt, t_cnt, m_cnt = Counter(archetypes), Counter(title_sk), Counter(meta_sk)
    per_page = [{
        "url": p.get("url"),
        "skeleton_cluster_size": arch_cnt.get(archetypes[i], 0) if archetypes[i] else 0,
        "title_template_cluster_size": t_cnt.get(title_sk[i], 0) if title_sk[i] else 0,
        "meta_template_cluster_size": m_cnt.get(meta_sk[i], 0) if meta_sk[i] else 0,
    } for i, p in enumerate(pages)]

    report = {
        "layer": "corpus-fingerprint", "gate": "algorithmic-authorship-gate", "version": "1.3",
        "corpus_size": len(pages), "fingerprint_diffusion_score": fds, "verdict": band(fds),
        "bands": {"HEALTHY": ">=80", "DIFFUSION-RISK": "60-79", "FINGERPRINTED": "<60"},
        "dimensions": {"D1_paragraph_R15": d1, "D2_structural_R42": d2,
                       "D3_metadata_R43": d3, "D4_velocity_R44": d4},
        "per_page": per_page,
        "note": "Corpus-level layer; per-document 9-category scoring is unchanged (rules.md). "
                "Diversify uniform clusters and throttle velocity before adding pages.",
    }
    out = json.dumps(report, indent=2, ensure_ascii=False)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(out)
        print("wrote %s (FDS=%s, verdict=%s)" % (args.out, fds, band(fds)))
    else:
        print(out)


if __name__ == "__main__":
    main()
