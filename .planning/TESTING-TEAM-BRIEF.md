# Sweepstakes Wiz — First-Party Testing Data Brief

**For:** Human testing team
**From:** Site owner / editorial
**Goal:** Collect real, first-hand test data for our sweepstakes-casino reviews so we can either *substantiate* the testing/payout claims already on the pages, or *correct/soften* them honestly.
**Do NOT:** invent results, reuse another site's numbers, or "round" a reviewer-reported figure into a measured one. If you didn't see it happen, it didn't happen.

---

## 1. Purpose & context (read this first)

SweepstakesWiz.com is an independent US sweepstakes-casino review site. Our pages currently read as if our team personally registered, played, and cashed out at each brand — phrases like *"we tested"*, *"14-day hands-on test"*, *"our test redemption cleared in 2 business days"*, and very specific payout-speed numbers (*"Skrill under 24hrs"*, *"debit payouts 15–20 minutes"*). Today most of that is **editorial analysis** (reading operator terms + aggregating public Trustpilot feedback), not first-hand testing. That mismatch is a problem for three reasons:

- **E-E-A-T (the "Experience" in Google's quality framework):** reviews that show genuine first-hand experience (real screenshots, real redemption timings) are trusted and ranked far higher than rehashed copy.
- **AEO / answer engines (ChatGPT, Google AI Overviews):** these only cite content that looks original and verifiable. Our recently added "direct answer" ledes assert payout speeds that an AI will repeat — so they have to be true.
- **Risk:** publishing "we tested" without test evidence is an overclaim (FTC/consumer-trust risk) and reads to Google as low-effort "scaled content." Our own SEO knowledge base flags *information gain* — "first-party data · original research" — as the single most important quality lever (see `obsidianvlt1/claude/concepts/information-gain.md`).

**Your data fixes all three at once.** Every real number, screenshot, and timestamp you return lets us make a page truthful AND more original than every competitor copying the same operator press release.

---

## 2. What counts as "evidence"

We can only publish a claim that maps to a real artifact. Acceptable proof, strongest first:

| Evidence type | Use it for |
|---|---|
| **Timestamped screenshot** (date/time visible or noted) | Every step — signup, bonus credit, cashier, KYC screen, redemption request, "paid" confirmation |
| **Redemption confirmation email / transaction ID** | Proof a payout actually happened + the clock start/stop |
| **Short screen recording** (optional) | Faucet/claim mechanics, redemption flow, support chat |
| **Dated tester notes** | Anything not screenshottable (phone support wait time, agent answer) |

**Not acceptable:** operator marketing screenshots, another review site's numbers, "I think it's usually about a day," or any AI-generated image presented as a real screenshot.

**File naming:** `<brand-slug>-<step>-<YYYYMMDD>.png` — e.g. `rolla-redeem-request-20260712.png`, `wow-vegas-payout-received-20260714.png`. Brand slugs are listed in the per-brand table (Section 4).

**Storage:** one folder per brand, named by slug (e.g. `/evidence/rolla/`). Put the filled data row (Section 7) in the same folder.

**Privacy — mandatory:** before sharing any screenshot, **redact**: full card/bank numbers (last 4 ok), Skrill/PayPal email, government-ID images, home address, date of birth, SSN. We need the *timings and amounts*, never the tester's identity or account credentials. Blur or black-box PII.

---

## 3. Standardized test protocol (same steps, every brand)

Do these in order and capture what's listed. Record **exact dates and times** (your local timezone, note which) so we can compute hours-to-payout.

1. **Register** — create a real account. Capture the signup screen. Record: date/time, state used, whether email verification was required, any promo code field.
2. **Claim welcome bonus** — note the *actual* GC (Gold Coins) and SC (Sweeps Coins) credited, and whether a code was needed. Screenshot the credited balance. (Compare to the claim in the table.)
3. **First-purchase offer (optional, only if budget allows)** — note real price + what you got. Screenshot the store/cashier.
4. **Play a session** — confirm games load, count is plausible, live dealer/app exists if claimed. A few screenshots of the lobby + any claimed standout feature (faucet, jackpot, sportsbook).
5. **Reach redemption threshold** — play/accumulate until you have enough SC to request the **minimum redemption**. Record the minimum the cashier *actually* enforces (and per method, if they differ).
6. **Request a redemption** — pick the method named in the table for that brand (Skrill, bank/ACH, PayPal, Venmo, gift card, crypto/USDC, debit, etc.). **Screenshot the request and note the exact timestamp = clock start.**
7. **Record KYC** — what docs were requested (ID? selfie? proof of address?), when submitted, when approved. Note turnaround time. Screenshot the KYC status screens (redact the documents themselves).
8. **Time the payout** — when funds actually arrive, screenshot the confirmation + note timestamp = clock stop. **Hours-to-payout = stop − start.** Record the method and amount.
9. **Log one support interaction** — open live chat (or email/phone if that's the channel). Ask one simple question. Record: channel, time opened, time first human replied, whether it resolved. Screenshot.

Units to use everywhere: **dates as YYYY-MM-DD, times with timezone, durations in hours, money in USD and in SC** (note the SC→USD rate the brand uses, usually 1 SC = $1).

---

## 4. Per-brand data-capture table

### 4a. Blank template (one row per brand — copy this)

| Field | Value |
|---|---|
| Brand / slug | |
| Date tested | |
| Tester state | |
| Could you test it? (Y / geo-blocked / KYC-failed / no-redemption) | |
| Welcome bonus actually credited (GC + SC) | |
| Promo code needed? | |
| Redemption method tested | |
| Minimum redemption enforced (per method) | |
| Redemption request timestamp (clock start) | |
| Payout received timestamp (clock stop) | |
| **Hours to payout (measured)** | |
| KYC docs requested | |
| KYC turnaround (hours) | |
| Support channel / first-response time / resolved? | |
| Games loaded OK? (count plausible? live dealer/app present?) | |
| State availability confirmed (could you sign up in your state?) | |
| Evidence files attached (list names) | |
| Honest notes / limitations / discrepancies vs our claim | |

### 4b. Per-brand list — the specific claim each review currently makes that you must verify or correct

> **★ = affiliate partner (prioritize).** **⚠ = page currently uses first-person "we tested / hands-on / tested & verified" language or a very specific documented-speed claim → highest evidence priority.**
> All claims below are quoted/paraphrased from the live review pages (`reviews/<slug>.html`). Conversion is 1 SC = $1 unless noted.

| # | Brand | Slug / file | Partner | Specific claim to verify or correct |
|---|---|---|---|---|
| 1 | **Rolla** ⚠ | `rolla` | — | "**14-day hands-on test**", "**Our test redemption #1 (Prizeout) cleared in 2 business days**", "Trustly bank 3 days", redemptions **1–3 business days**, "Skrill same/next day", **gift cards from 50 SC, cash from 100 SC**, 2.9% purchase fee. *Most overclaimed page on the site — needs real redemption evidence or full softening.* |
| 2 | **WOW Vegas** ⚠ | `wow-vegas` | — | "**Skrill under 24hrs**", "**Prizeout gift cards within 24hrs from 25 SC**", MassPay 1–2 days, Trustly 3–5 days, "Elite VIP same-day", min Skrill 50 SC, $10,000 daily limit. |
| 3 | **Crown Coins** ⚠ | `crown-coins` | ★ | "**Skrill payouts under 24hrs**", "**all five sources we verified**", Dynasty VIP 6% coinback. *(A capture checklist already exists: `.planning/crown-coins-handson-test-checklist.md` — follow it.)* |
| 4 | **Sweet Sweeps** ⚠ | `sweet-sweeps` | — | "**Debit (Visa/MC) payouts often 15–20 minutes**", "the fastest verified debit-card payouts we've documented", "USDC on Solana instant", bank 3–7 days, **min 60 SC**, "Veriff KYC clears in minutes". |
| 5 | **Splash Coins** ⚠ | `splash-coins` | — | Title says "**Payouts Tested**", "**Skrill often under 24hrs**", 1–3 business days cash, Push-to-Card/ACH 2–3 days, **min 100 SC**, "zero purchase fees". |
| 6 | **Sweepico** ⚠ | `sweepico` | — | "**Full hands-on expert review — everything tested and verified**", push-to-card payouts, VIP program. *Verify or remove "tested" framing.* |
| 7 | **Big Pirate** ⚠ | `big-pirate` | — | "**We tested the platform hands-on**", "**all five sources we verified**", 3-currency system, Claw Machine, 1,500+ games, payout speed. |
| 8 | **DexyPlay** ⚠ | `dexyplay` | — | "**We tested DexyPlay**" + title "Tested", "**PayPal / ACH / push-to-card all process in 3–4 business days**", **min $100 (100 SC)**, purchase required before first redemption, 24-level VIP. |
| 9 | **FreeSpin** ⚠ | `freespin` | — | "**We tested FreeSpin.com**", "**crypto redemptions under 24hrs**", Fun Zone daily pick-a-box up to 5 SC, "KYC friction explained honestly". |
| 10 | **Casino Click** ⚠ | `casino-click` | ★ | "**We tested Casino Click**", "**Bitcoin payouts**", daily scratch card up to 5 SC, Trustpilot 2.5/5. |
| 11 | **Acebet** ⚠ | `acebet` | — | "**Hands-on Acebet.cc review … tested and verified**", "**crypto payouts in 24–48hrs**", 7.5 SC mail-in, promo code ACEBET. |
| 12 | **High 5** ⚠ | `high5` | — | Title "…Tested", "**cash redemptions 3–10 business days**", **100 SC cash minimum**, three-currency (Diamonds), iOS/Android apps, operating since 2012. |
| 13 | **JackpotGo** ⚠ | `jackpot-go` | — | "**Venmo Fast Payment in minutes**", standard bank/Venmo "**within 3 business days**", free GC faucet every 10 min. *Verify the "within minutes" Venmo claim specifically.* |
| 14 | **SpinBlitz** ⚠ | `spinblitz` | ★ | "**Gift card payouts 24–48hrs from 10 SC**", Blitz Jackpot 50K SC, 1,500+ games, live dealer. |
| 15 | **McLuck** | `mcluck` | ★ | No-code 7,500 GC + 2.5 SC, "**Skrill e-wallet payouts**", 10 SC gift cards, McJackpots, iOS/Android. *Verify Skrill speed + min.* |
| 16 | **Pulsz** | `pulsz` | ★ | No-code 5,000 GC + 2.3 SC, "**Skrill / ACH / wire payouts**", 10 SC gift cards, Pulse 8, iOS/Android. *Verify speed + min per method.* |
| 17 | **HelloMillions** | `hello-millions` | ★ | No-code welcome, "**gift-card & cash payout speed**", 10 SC gift cards, **real phone support line**, 1,500+ games. *Verify payout speed + that phone support exists/works.* |
| 18 | **Legendz** | `legendz` | ★ | No-code 500 GC + 3 SC, "**Prizeout gift cards from 50 SC, Skrill/bank cash from 100 SC**", 500+ games + social sportsbook. *Verify mins + speed.* |
| 19 | **PlayFame** | `playfame` | ★ | 7,500 GC + 2.5 SC, "**10 SC gift cards, bank-transfer cash payouts**", dedicated iOS app. *Verify speed + min.* |
| 20 | **Spree** | `spree` | ★ | "**10 SC gift cards in 48hrs**", SpreePotz jackpots, Sit-and-Spin, 800+ games. *Verify the 48hr gift-card claim.* |
| 21 | **Thrillzz** | `thrillzz` | ★ | Social **sportsbook**, "**50 SC ($50) redemptions via bank/PayPal/Skrill in 1–3 days**", native iOS/Android apps. *Verify speed + min + apps.* |
| 22 | **Zula Casino** | `zula` | ★ | No-code up to 120,000 GC + 10 SC, "**Skrill & bank cash redemptions from 50 SC**", 2,000+ games, iOS/Android. *(Revshare partner.)* |
| 23 | **RoxyMoxy** | `roxymoxy` | ★ | No-code 50,000 GC + 2.5 SC, "**bank-transfer redemptions from 100 SC**", 40+ slots, browser-only. *Verify min + speed + that there's no app.* |
| 24 | **Card Crush** | `card-crush` | ★ | RPG card-battle, **Mystery Coins (1 MC = $1)**, "**cash from 75 MC, gift cards from 10 MC**", 1× playthrough, **available ONLY in CA & NY**, 21+. *Geo-test from CA/NY if possible.* |
| 25 | **Mega Bonanza** | `mega-bonanza` | — | "**Instant Prizeout from 10 SC**", code SWEEPSKINGS, 1,200+ games, 4.0/5 Trustpilot. *Verify "instant" Prizeout + min.* |
| 26 | **Spinfinite** | `spinfinite` | — | Power Pass 90 SC for $24/mo, "**instant gift cards from 10 SC**", 3 SC mail-in, Android app. *Verify "instant" + min.* |
| 27 | **Jackpota** | `jackpota` | — | "**Gift cards in 2 days from 10 SC**", 80K GC + 40 SC first-buy, 1,600+ games, live dealer. *Verify 2-day gift-card claim + min.* |
| 28 | **Lucky Bunny** | `lucky-bunny` | — | Code SWEEPSKINGS 550K FC + 5 SC, 4,000+ games, daily wheel up to 5 SC, 12-tier VIP. *Verify currency/bonus + any payout claim.* |

---

## 5. Priority order & batching

Test in this order — strongest commercial + highest overclaim risk first:

1. **Batch 1 (this week) — affiliate partners with a hard speed/min claim + overclaim flag:**
   Crown Coins, SpinBlitz, Casino Click *(these three are partners AND ⚠)*, then the partners with specific mins/methods: Thrillzz, Legendz, Zula, Pulsz, McLuck, PlayFame, Spree, RoxyMoxy, HelloMillions, Card Crush.
2. **Batch 2 — non-partner pages with the worst "we tested / X-day" language:**
   Rolla *(top priority — most egregious)*, WOW Vegas, Sweet Sweeps, Splash Coins, Sweepico, Big Pirate, DexyPlay, FreeSpin, Acebet, High 5, JackpotGo.
3. **Batch 3 — remaining non-partners with softer claims:**
   Mega Bonanza, Spinfinite, Jackpota, Lucky Bunny.

Realistic batching: a full register→play→redeem→KYC→payout cycle can span **3–10 days per brand** (most of that is waiting on the payout/KYC clock), but the *active* tester time is ~30–60 min/brand. Run several brands in parallel — kick off registrations and redemption requests for a batch on the same day, then just record timestamps as each payout lands. **Do one brand end-to-end first (suggest Crown Coins, since the checklist exists) to validate the workflow before scaling.**

Note on geo: many brands are restricted in CA, NY, MT, CT, NV, NJ, LA, MI, ID, WA (our site suppresses offers there). If a tester is physically in one of those states, they may not be able to register some brands — that's fine, just record it (see Section 6). Card Crush is the opposite: it works **only** in CA & NY.

---

## 6. Edge cases & honesty rules

If you can't complete a test, that's still useful data — record the truth so we can soften the claim rather than fake it. For each, set the "Could you test it?" field and add a note:

- **Geo-blocked** (brand won't accept your state): record "geo-blocked from `<state>`". We'll mark the page as not first-hand tested for now.
- **KYC failed / stuck**: record what was requested, when, and that it didn't clear within your test window. A stuck KYC is itself a real, publishable finding.
- **Never reached redemption** (couldn't accumulate the minimum SC without overspending): record how far you got. Do **not** guess the payout time.
- **Claim is wrong** (e.g. minimum is 100 SC, not 50; or Skrill took 3 days, not "<24h"): record the *actual* number in the notes — this is exactly what we need to correct the page.
- **Brand changed / dead** (offer gone, site down): record the date you observed it.

**Golden rule:** a truthful "we could not verify this" is more valuable to us than an impressive number you didn't measure. We will soften or remove any claim you can't back with evidence.

---

## 7. Return format

Hand the data back as a **single spreadsheet or CSV** (or one markdown table) with **one row per brand**, using exactly the fields from the Section 4a template, **plus** the evidence folder for each brand (screenshots/emails named per Section 2). 

CSV header to use:

```csv
brand_slug,date_tested,tester_state,could_test,welcome_credited,promo_code_needed,redemption_method,min_redemption,request_timestamp,payout_timestamp,hours_to_payout,kyc_docs,kyc_hours,support_channel,support_first_response,support_resolved,games_ok,state_availability_ok,evidence_files,notes
```

Deliver: the filled CSV/spreadsheet + the per-brand evidence folders, zipped, back to the site owner. The owner will hand this straight to the editorial process so each measured number and screenshot can be safely integrated into the matching review (and its schema), and every claim we can't back gets softened.

---

### Reference — what we currently tell the public (so your data can reconcile it)

- **`/how-we-rate/`** publicly claims a 7-criteria scoring system "produced by **hands-on testing** — we register a real account, claim the welcome bonus, play, request a redemption, and document every step," measuring redemption speed "**to the hour**," opening "**three real support tickets per review cycle**," and "**re-testing every 90 days**." This is the standard your data needs to make real.
- **`/editorial-policy/`** is the honest backstop: "Where a review includes first-party hands-on testing … it is explicitly labelled as hands-on and dated. Where it is an editorial analysis … that is stated plainly," and "**No fabricated reviews, screenshots, or 'verified player' quotes.**"
- **Compliance ribbon (every page):** "Sweepstakes play · no real-money gambling · 21+ · Reviewed by Ilija Milosevic."

Your job is to close the gap between the first bullet (what we say) and the second (what we can prove).
