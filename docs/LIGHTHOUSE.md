# Lighthouse results

Lighthouse audits for performance, accessibility, best practices and SEO. Newest results at the top.

## How to measure
Always audit a **production build**, not the development server:

```bash
npm run build
npm run preview   # serves the production build on http://localhost:4173
```

Run Lighthouse in an **incognito window** (no browser extensions), Chrome DevTools → *Lighthouse* → Mode *Navigation*, Device *Mobile* and *Desktop*.

The development server (`npm run dev`) serves unbundled, unminified code with development tooling, so its Performance and Best Practices scores are not representative.

---

## 2026-11-16 – Phase 1, milestone B (app shell)

**Page:** `/week` · **Build:** production (`vite build` + `vite preview`, local) · **Tool:** Lighthouse 12.8.2, headless Chrome, incognito, default throttling

| Category | Mobile | Desktop |
|---|---|---|
| Performance | **94** | **100** |
| Accessibility | **100** | **100** |
| Best Practices | **100** | **100** |
| SEO | **91** | **91** |

**Core metrics (mobile, simulated slow 4G + mid-range phone):**

| Metric | Mobile | Desktop |
|---|---|---|
| First Contentful Paint | 2.3 s | 0.5 s |
| Largest Contentful Paint | 2.5 s | 0.5 s |
| Total Blocking Time | 110 ms | 0 ms |
| Cumulative Layout Shift | 0.006 | 0 |
| Speed Index | 2.3 s | 0.5 s |

Total page weight: 231 KiB.

**For comparison – development server** (measured by the product owner): Performance 40, Accessibility 100, Best Practices 96, SEO 91. The gap in Performance and Best Practices comes from development-mode code, not the app itself.

**Remaining findings:**
- **SEO – `robots.txt` missing.** The single-page-app fallback returns the HTML page for `/robots.txt`, which Lighthouse reports as invalid. Fix: add a `robots.txt` (pending product-owner decision on whether search engines may index the app).
- **Performance – unused JavaScript (~84 KiB).** All screens are in one bundle. Can be addressed by loading screens on demand when the app grows.

**Notes:** Scores were measured locally; results on real hosting (phase 7, Vercel with HTTPS, compression and CDN) will differ and should be re-measured then.
