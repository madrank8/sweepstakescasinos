export const prerender = false;

import type { APIRoute } from 'astro';

/**
 * Self-contained embed widget. Publishers drop:
 *   <script src="https://sweepstakeswiz.com/sweepstakes-tracker/embed/legality.js" data-state="NY" async></script>
 * It renders a small, branded status card with a canonical attribution link.
 * Built with safe DOM methods (textContent) — no innerHTML.
 */
export const GET: APIRoute = () => {
  const js = `(function () {
  var s = document.currentScript;
  if (!s) return;
  var origin = "https://sweepstakeswiz.com";
  var code = (s.getAttribute("data-state") || "").toUpperCase();
  var colors = { legal_unregulated: "#34d399", gray: "#fbbf24", restricted: "#fb923c", pending_ban: "#e879f9", banned: "#f43f5e" };
  var labels = { legal_unregulated: "Legal / unregulated", gray: "Gray market", restricted: "Restricted", pending_ban: "Pending ban", banned: "Banned" };
  function card() {
    var el = document.createElement("div");
    el.style.cssText = "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:320px;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;background:#fff;color:#0a1628;box-shadow:0 3px 12px rgba(10,22,40,.08)";
    return el;
  }
  function attribution(el, slug) {
    var a = document.createElement("a");
    a.href = origin + "/sweepstakes-tracker/" + (slug ? "" : "");
    a.textContent = "Source: Sweepstakes Wiz Legality Tracker \\u2192";
    a.style.cssText = "display:block;margin-top:10px;font-size:.75rem;color:#1d4ed8;text-decoration:none";
    a.target = "_blank"; a.rel = "noopener";
    el.appendChild(a);
  }
  var box = card();
  var loading = document.createElement("p");
  loading.textContent = "Loading legality status\\u2026";
  loading.style.cssText = "margin:0;font-size:.85rem;color:#64748b";
  box.appendChild(loading);
  if (s.parentNode) s.parentNode.insertBefore(box, s.nextSibling);
  if (!code) { loading.textContent = "Set data-state to a 2-letter US state code."; return; }
  fetch(origin + "/sweepstakes-tracker/api/states/" + code + ".json")
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (d) {
      while (box.firstChild) box.removeChild(box.firstChild);
      var name = document.createElement("p");
      name.textContent = d.state_name;
      name.style.cssText = "margin:0;font-weight:700;font-size:1.05rem";
      box.appendChild(name);
      var pill = document.createElement("span");
      pill.textContent = labels[d.status] || d.status;
      var c = colors[d.status] || "#64748b";
      pill.style.cssText = "display:inline-block;margin:8px 0 4px;padding:3px 12px;border-radius:999px;font-size:.8rem;font-weight:600;border:1px solid " + c + ";background:" + c + "22";
      box.appendChild(pill);
      var meta = document.createElement("p");
      var reviewed = d.last_reviewed_at ? new Date(d.last_reviewed_at).toLocaleDateString() : "";
      meta.textContent = "Confidence: " + (d.confidence || "n/a") + (reviewed ? " \\u00b7 Reviewed " + reviewed : "");
      meta.style.cssText = "margin:2px 0 0;font-size:.75rem;color:#64748b";
      box.appendChild(meta);
      attribution(box, d.state_slug);
    })
    .catch(function () { loading.textContent = "Legality status unavailable for " + code + "."; });
})();`;

  return new Response(js, {
    status: 200,
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
};
