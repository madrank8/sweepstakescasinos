/**
 * Reader-report submission form (shared HTML builder).
 *
 * Rendered on the standalone /report/ page (brand <select>) and, when embedded
 * in a review, with the brand prefilled. The form POSTs to /api/reader-reports.
 * Self-contained: scoped styles + an idempotent init script that supports
 * multiple form instances on a page.
 */
import { TESTING_BRANDS } from '../data/testingBrands';

export const REDEMPTION_METHODS = [
  'Skrill',
  'PayPal',
  'Bank / ACH',
  'Trustly',
  'Gift card',
  'Crypto',
  'Debit card',
  'Other',
];

export const AMOUNT_BANDS = [
  'Under $50',
  '$50–$100',
  '$100–$250',
  '$250–$500',
  '$500–$1,000',
  'Over $1,000',
];

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface FormOptions {
  brandSlug?: string;
  brandName?: string;
}

export function renderReaderReportForm(opts: FormOptions = {}): string {
  const { brandSlug, brandName } = opts;

  const brandField = brandSlug
    ? `<input type="hidden" name="brand_slug" value="${esc(brandSlug)}">`
    : `<label class="rr-label">Which casino?
        <select name="brand_slug" required class="rr-input">
          <option value="">Select a brand…</option>
          ${TESTING_BRANDS.map((b) => `<option value="${esc(b.slug)}">${esc(b.name)}</option>`).join('')}
        </select>
      </label>`;

  const heading = brandName
    ? `Report your ${esc(brandName)} experience`
    : 'Report your experience';

  return `<form class="rr-form" novalidate>
  ${brandField}
  <h3 class="rr-h3">${heading}</h3>
  <p class="rr-note">Real player reports power our payout-speed data. Share what actually happened — <strong>no personal details</strong> (no email, phone, card or account numbers). We moderate every submission before it appears.</p>

  <div class="rr-grid">
    <label class="rr-label">Redemption method
      <select name="redemption_method" class="rr-input">
        <option value="">—</option>
        ${REDEMPTION_METHODS.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join('')}
      </select>
    </label>
    <label class="rr-label">Amount band
      <select name="amount_band" class="rr-input">
        <option value="">—</option>
        ${AMOUNT_BANDS.map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join('')}
      </select>
    </label>
    <label class="rr-label">Redemption requested
      <input type="date" name="request_date" class="rr-input">
    </label>
    <label class="rr-label">Payout received
      <input type="date" name="payout_date" class="rr-input">
    </label>
    <label class="rr-label">Your state (optional)
      <input type="text" name="us_state" maxlength="2" placeholder="TX" class="rr-input" style="text-transform:uppercase">
    </label>
    <label class="rr-label">Overall rating
      <select name="rating" class="rr-input">
        <option value="">—</option>
        <option value="5">★★★★★ (5)</option>
        <option value="4">★★★★ (4)</option>
        <option value="3">★★★ (3)</option>
        <option value="2">★★ (2)</option>
        <option value="1">★ (1)</option>
      </select>
    </label>
  </div>

  <label class="rr-label">KYC / verification experience (optional)
    <input type="text" name="kyc_experience" maxlength="200" placeholder="e.g. ID + selfie, approved next day" class="rr-input">
  </label>

  <label class="rr-label">What happened? (optional)
    <textarea name="comment" maxlength="1200" rows="4" class="rr-input" placeholder="Describe your redemption, payout timing, or support experience — no personal details please."></textarea>
  </label>

  <label class="rr-consent">
    <input type="checkbox" name="consent" value="true" required>
    <span>This is my genuine, first-hand experience and I consent to it being aggregated and quoted anonymously.</span>
  </label>

  <div class="rr-hp" aria-hidden="true">
    <label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
  </div>

  <button type="submit" class="rr-submit">Submit report</button>
  <p class="rr-msg" role="status" aria-live="polite"></p>
</form>

<style>
  .rr-form{max-width:640px;margin:18px 0;padding:20px;border:1px solid #e2e8f0;border-radius:14px;background:#fafcff;}
  .rr-form .rr-h3{margin:0 0 6px;font-size:1.1rem;font-weight:800;color:#0a1628;}
  .rr-note{font-size:.85rem;color:#475569;margin:0 0 14px;line-height:1.55;}
  .rr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:12px;}
  .rr-label{display:block;font-size:.8rem;font-weight:700;color:#0a1628;margin-bottom:12px;}
  .rr-input{display:block;width:100%;margin-top:5px;padding:9px 11px;border:1px solid #cbd5e1;border-radius:8px;font-size:.9rem;font-family:inherit;background:#fff;}
  .rr-consent{display:flex;gap:9px;align-items:flex-start;font-size:.82rem;color:#334155;margin:6px 0 14px;line-height:1.5;}
  .rr-consent input{margin-top:3px;flex-shrink:0;}
  .rr-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;}
  .rr-submit{background:linear-gradient(135deg,#1a56db,#0a1628);color:#fff;font-weight:800;font-size:.9rem;border:0;border-radius:9px;padding:11px 22px;cursor:pointer;}
  .rr-submit:disabled{opacity:.6;cursor:default;}
  .rr-msg{font-size:.85rem;font-weight:700;margin:12px 0 0;}
  .rr-msg.ok{color:#065f46;}
  .rr-msg.err{color:#b91c1c;}
</style>

<script>
  (function(){
    document.querySelectorAll('.rr-form').forEach(function(form){
      if (form.dataset.rrInit) return;
      form.dataset.rrInit = '1';
      var msg = form.querySelector('.rr-msg');
      var btn = form.querySelector('.rr-submit');
      form.addEventListener('submit', async function(e){
        e.preventDefault();
        if (!form.reportValidity()) return;
        btn.disabled = true; msg.className = 'rr-msg'; msg.textContent = 'Submitting…';
        try {
          var res = await fetch('/api/reader-reports', { method:'POST', body: new FormData(form) });
          var data = await res.json().catch(function(){ return {}; });
          if (res.ok && data.success) {
            form.reset();
            msg.className = 'rr-msg ok';
            msg.textContent = 'Thank you — your report was submitted and will appear after moderation.';
          } else {
            msg.className = 'rr-msg err';
            msg.textContent = data.error || 'Something went wrong. Please try again later.';
            btn.disabled = false;
          }
        } catch (err) {
          msg.className = 'rr-msg err';
          msg.textContent = 'Network error. Please try again later.';
          btn.disabled = false;
        }
      });
    });
  })();
</script>`;
}
