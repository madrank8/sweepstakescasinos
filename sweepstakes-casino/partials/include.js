/* ═══════════════════════════════════════════════════════════════════
   SHARED INCLUDES LOADER — /sweepstakes-casino/partials/include.js
   ───────────────────────────────────────────────────────────────────
   Loads shared nav.html and footer.html into every page.
   To add it to a page, place these placeholders where you want them:
       <div data-include="/sweepstakes-casino/partials/nav.html"></div>
       <div data-include="/sweepstakes-casino/partials/footer.html"></div>
   Then load this script in <head> with `defer`:
       <script src="/sweepstakes-casino/partials/include.js" defer></script>
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  function loadIncludes() {
    var nodes = document.querySelectorAll('[data-include]');
    if (!nodes.length) return;
    nodes.forEach(function (node) {
      var url = node.getAttribute('data-include');
      if (!url) return;
      fetch(url, { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('Failed to load ' + url + ' (' + r.status + ')');
          return r.text();
        })
        .then(function (html) {
          // Replace the placeholder div with the actual partial markup so
          // the page DOM stays clean and CSS selectors targeting <nav> / <footer> still work.
          var wrap = document.createElement('div');
          wrap.innerHTML = html.trim();
          var frag = document.createDocumentFragment();
          while (wrap.firstChild) frag.appendChild(wrap.firstChild);
          node.parentNode.replaceChild(frag, node);
        })
        .catch(function (err) {
          console.error('[include]', err);
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadIncludes);
  } else {
    loadIncludes();
  }
})();
