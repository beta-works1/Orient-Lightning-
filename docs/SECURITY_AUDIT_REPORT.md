# Orient Lighting — Full QA/QC + Security Audit Report

**Date:** 2026-07-26  
**Scope:** Public storefront + `/admin` (local + Orient Supabase `drywaizxvygxescnghjr`)  
**Method:** Code review, Supabase advisors, anon-key abuse probes, admin CRUD smoke test, local HTTP checks  
**Rule:** Probes ran against local/dev + project DB APIs — not production traffic abuse

---

## Summary

| Area | Result |
|------|--------|
| Auth / session | Pass (hardened) |
| RLS | Pass (hardened) |
| Injection / uploads / HTML | Pass (hardened) |
| Secrets | Pass |
| API / actions | Pass |
| Dependencies (`npm audit`) | Inconclusive (registry error) |
| Security headers | Pass (fixed) |
| Functional public QA | Pass (local) |
| Admin CRUD + cleanup | Pass |

**Public-facing changes to spot-check after deploy:** security headers (CSP/HSTS), HTML sanitization on product/page/blog/collection descriptions, newsletter now writes to Supabase (not a local JSON file), styled 404 page.

---

## 1. Authentication & Session Security

| Check | Result | Notes / fix |
|-------|--------|-------------|
| `/admin/*` except login unreachable when logged out | **Pass** | Local: `/admin/products`, `/catalogue`, `/featured`, `/products/new` → `307` → `/admin/login?next=…` |
| Session cookie `httpOnly`, `secure`, `sameSite` | **Pass (fixed)** | Was `@supabase/ssr` defaults (`httpOnly: false`). Login moved to server action; cookies set with `httpOnly: true`, `sameSite: 'lax'`, `secure` in production (`src/lib/supabase/cookieOptions.ts`) |
| Non-allowlisted email rejected | **Pass (hardened)** | Middleware + `requireAdmin` + login action rejects non-`ADMIN_EMAIL` with generic error / sign-out |
| Wrong password generic error | **Pass** | Always `"Invalid email or password."` |
| Logout invalidates server-side | **Pass (fixed)** | `signOut({ scope: "global" })` in `logout.ts` |
| No public sign-up route | **Pass** | No app `signUp` / register routes |
| No password-reset flow exposed | **Pass** | None in app; ensure Supabase Auth dashboard has signup/reset disabled for this project |
| Failed-login rate limiting | **Note** | Relies on Supabase Auth built-in rate limits. Not custom-app limited. Enable “Leaked password protection” in Auth settings (advisor WARN remaining) |

---

## 2. Authorization / RLS

| Check | Result | Notes / fix |
|-------|--------|-------------|
| RLS enabled on every public table | **Pass** | All 9 tables: `products`, `collections`, `product_collections`, `blog_posts`, `pages`, `newsletter_subscribers`, `dealers`, `admin_users`, `site_settings` |
| Public SELECT / admin writes | **Pass (fixed)** | Was: `products` public SELECT `true` (drafts readable via anon API). **Fixed:** public SELECT only `status = 'published'`; admin SELECT/writes for allowlisted JWT; admin policies on `site_settings` + `product_collections` |
| User-submitted data not publicly readable | **Pass (fixed)** | `newsletter_subscribers`: no anon SELECT; admin SELECT/DELETE only. Partner page is static CMS HTML — no submissions table |
| Anon INSERT/UPDATE/DELETE rejected | **Pass** | `scripts/security-anon-probe.ts` → **29/29 passed** |
| `SUPABASE_SERVICE_ROLE_KEY` server-only | **Pass** | Only `src/lib/supabase/admin.ts`, `src/lib/catalog.ts` (server), and scripts — not `NEXT_PUBLIC_*` |

**Also fixed:** revoked `EXECUTE` on `public.rls_auto_enable()` from `anon`/`authenticated`/`PUBLIC`; dropped broad storage listing SELECT policies on public buckets (object URLs still work).

**Advisor remaining:** Auth leaked-password protection disabled (dashboard toggle).

---

## 3. Injection & Input Validation

| Check | Result | Notes / fix |
|-------|--------|-------------|
| Parameterized DB access | **Pass** | App uses Supabase client / Drizzle schema; no string-concat SQL in app routes |
| HTML rendering sanitized | **Pass (fixed)** | Product/page/blog/collection HTML now through `sanitizeHtml` (DOMPurify). Admin save also sanitizes descriptions |
| Image upload MIME + size server-side | **Pass (fixed)** | Magic-byte detection (`fileMagic.ts`) + 5MB limit; PDF catalogues verified via `%PDF-` header + 25MB |
| Public forms server-validated | **Pass (fixed)** | Newsletter: server email regex, honeypot, IP rate limit, Supabase insert under RLS |

---

## 4. Secrets & Environment

| Check | Result | Notes / fix |
|-------|--------|-------------|
| `.env.local` gitignored | **Pass** | `.gitignore` `.env*`; never committed as content |
| `.env.example` placeholders only | **Pass** | Placeholder values only |
| History scan for committed keys | **Pass** | No `.env.local` history; example only |
| Vercel env matches Orient project | **Manual** | CLI logged into MarvelX team, not beta-works — confirm in Vercel dashboard that production points at `drywaizxvygxescnghjr` only |

---

## 5. API Route Security

| Check | Result | Notes / fix |
|-------|--------|-------------|
| Admin mutations check session in action | **Pass** | Every mutating action calls `requireAdmin()` (email + `admin_users` row) before service-role writes |
| Public endpoints abuse protection | **Pass (fixed)** | Newsletter: honeypot + in-memory rate limit + RLS. No partner/contact API |

---

## 6. Dependencies

| Check | Result | Notes / fix |
|-------|--------|-------------|
| `npm audit` high/critical | **Inconclusive** | npm advisory bulk endpoint returned invalid JSON in this environment. Re-run `npm audit` locally after deploy |
| Notably outdated packages | **Note** | Stack is Next 15.5.20 / React 19 — recent. Added `isomorphic-dompurify` |

---

## 7. Security Headers

| Check | Result | Notes / fix |
|-------|--------|-------------|
| CSP, XCTO, XFO/frame-ancestors, HSTS | **Pass (fixed)** | Previously only on `/admin` via middleware. Now site-wide via `next.config.ts` `headers()`. Verified on local `/` |

---

## 8. Functional QA — Public Site

| Check | Result | Notes / fix |
|-------|--------|-------------|
| Crawl homepage internal links | **Pass** | 33 unique paths from `/`; `broken_count=0` locally |
| Newsletter valid/invalid | **Pass** | Invalid email rejected by action; valid insert via anon RLS tested then deleted |
| Partner form | **N/A** | Static page `/pages/become-our-partner` — no submission endpoint |
| Styled 404 | **Pass (fixed)** | Added `src/app/not-found.tsx` — returns 404 + “Page not found” |
| Supabase unreachable degrade | **Partial** | Catalog throws on hard failures; no global error boundary polish — acceptable but could soft-fail later |
| Mobile responsiveness | **Spot-check** | Existing responsive Tailwind layouts; full device matrix not automated this run |
| Lighthouse | **Not run** | Skipped (time/tooling). Recommend Chrome DevTools Lighthouse on staging after deploy |

---

## 9. Admin Workflow QA (dummy data)

| Step | Result |
|------|--------|
| Create `TEST_DELETE_ME — QA Audit Product` | **Pass** (`scripts/security-admin-crud-qa.ts`) |
| Visible to anon when published | **Pass** |
| Price edit visible immediately (API) | **Pass** |
| Draft hidden from anon | **Pass** |
| Delete + gone from anon | **Pass** |
| Image upload invalid type/size | **Pass (code)** | Magic-byte + size enforced in `uploadProductImage` (UI loop not repeated after magic-byte fix) |

Interactive browser login with real password was not automated (credentials stay out of logs). Middleware gate + action `requireAdmin` cover the auth boundary.

---

## 10. Cleanup

| Check | Result |
|-------|--------|
| Zero `TEST_DELETE_ME` products | **Pass** (`leftover_products=0`) |
| Zero `qa-audit-delete-me-%` newsletter rows | **Pass** (`leftover_nl=0`) |
| No QA images in storage | **Pass** |
| Storefront free of test data | **Pass** |

---

## Fixes applied (code + DB)

1. DB migration `security_hardening_rls` + `drizzle/0005_security_hardening.sql`
2. Server-side admin login + httpOnly/secure cookies
3. Global logout scope
4. Site-wide security headers
5. DOMPurify sanitization for CMS/product HTML
6. Magic-byte upload validation
7. Newsletter → Supabase + honeypot + rate limit
8. Custom `not-found.tsx`
9. Probe scripts: `scripts/security-anon-probe.ts`, `scripts/security-admin-crud-qa.ts`

---

## Recommended follow-ups (not blocking)

1. Enable **Leaked password protection** in Supabase Auth  
2. Disable public Auth signups / recovery in dashboard (single-admin)  
3. Re-run `npm audit` when registry works; run Lighthouse on staging  
4. Confirm Vercel production env vars on **beta-works / orient-lightning**  
5. Optional: admin UI to list/delete newsletter subscribers  

---

## How to re-verify

```bash
npx tsx --env-file=.env.local scripts/security-anon-probe.ts
npx tsx --env-file=.env.local scripts/security-admin-crud-qa.ts
# logged out:
curl -sI http://localhost:3000/admin/products   # expect 307 → login
```
