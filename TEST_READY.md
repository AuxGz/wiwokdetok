# Test Readiness Report: E2E Test Suite & Visual Regression Baseline

**Status**: READY (100% Passing on Pre-Migration Baseline)  
**Date**: 2026-10-02  
**Target URL**: `http://localhost:3000`  
**Execution Entrypoint**: `node scratch/test_e2e_suite.cjs`  
**Visual Diff Entrypoint**: `python scratch/visual_diff_tool.py`

---

## 1. Executive Summary

The automated E2E test suite and visual regression baseline for Web JHIC has been constructed, validated, and published. The test runner executed against `http://localhost:3000` and achieved **100% pass rate across all 18 test cases spanning 4 tiers**.

| Tier | Tier Description | Tests Run | Passed | Failed | Status |
|---|---|---|---|---|---|
| **Tier 1** | Core JS Functionality | 7 | 7 | 0 | **PASS** |
| **Tier 2** | Boundary & Corner Cases | 4 | 4 | 0 | **PASS** |
| **Tier 3** | Cross-Feature Combinations | 3 | 3 | 0 | **PASS** |
| **Tier 4** | Visual Snapshot & Baseline Diff | 4 | 4 | 0 | **PASS** |
| **Total** | **Full Regression Suite** | **18** | **18** | **0** | **100% PASS** |

- **Total Execution Time**: 36.65 seconds
- **JSON Test Report**: `scratch/test_results.json`
- **Baseline Screenshot Artifacts**: 23 PNG files generated in `scratch/baseline_screenshots/`

---

## 2. Test Execution Breakdown

### Tier 1: Core JS Functionality (7/7 Passed)
- `✔ PASS` **Jurusan Tabs: Initial State (PG Active)** (49ms)
  - Verified default active tab is `PG` (`aria-selected="true"`), active panel is `#panel-PG`, and 3 inactive panels are hidden.
- `✔ PASS` **Jurusan Tabs: Sequential Switching & Slider Translation** (2,069ms)
  - Cycled through `RPL`, `TKJ`, `TJA`, and returned to `PG`. Verified single active panel constraint, `display: grid` visibility, and `#tabIndicator` inline translation update.
- `✔ PASS` **Stats Section: IntersectionObserver Count-Up Numbers** (3,027ms)
  - Scrolled `#stats` into view, verified `.counted` state class added, and counter values animated smoothly to `910+`, `4`, `182+`, `150`.
- `✔ PASS` **Alumni Section: Carousel Next Card Order Cycle** (783ms)
  - Clicked `.carousel-next-btn`, verified first card rotated to the end of `.alumni-grid` and 2nd card shifted to position 1. Verified second cycle.
- `✔ PASS` **FAQ Section: Single-Open Accordion Toggling & State Rotation** (974ms)
  - Verified Item 0 initially open. Clicked Item 1: Item 0 collapsed (`display: none`), Item 1 expanded (`display: block`, `aria-expanded="true"`). Verified collapse on re-click and restored Item 0.
- `✔ PASS` **Header Component: Mobile Menu Toggle & Auto-Close on Anchor Click** (1,272ms)
  - Emulated mobile viewport (640px). Opened `#mobile-menu` via `#mobile-toggle`, clicked anchor link, verified menu auto-closed with `hidden` attribute.
- `✔ PASS` **Chatbot Widget: Open, Close, and Outside-Click Dismissal** (1,144ms)
  - Verified `#open-chat` opens `#chatbot-popup`, `#close-chat` closes it, and clicking outside `#chatbot-widget` dismisses it.

### Tier 2: Boundary & Corner Cases (4/4 Passed)
- `✔ PASS` **Viewport Responsiveness: Desktop (1440px), Tablet (992px), Mobile (640px)** (1,285ms)
  - Verified zero document horizontal scroll overflow (`scrollWidth <= innerWidth`) across all 3 viewports. Verified desktop navigation hides and hamburger button displays at 992px and 640px.
- `✔ PASS` **Jurusan Tabs: Rapid High-Frequency Clicking (Stress & Race Safety)** (922ms)
  - Fired high-frequency burst clicks across 5 tab transitions in 200ms. Settle check confirmed exactly 1 tab and 1 panel active, indicator positioned properly, no race errors.
- `✔ PASS` **Chatbot Widget: Keyboard Escape Key Dismissal & Idempotency** (672ms)
  - Opened popup, pressed `Escape` key to close. Repeatedly pressed `Escape` when already closed, confirming idempotent clean handling without unhandled exceptions.
- `✔ PASS` **Accessibility: Reduced-Motion Mode Handling** (219ms)
  - Emulated `prefers-reduced-motion: reduce`. Confirmed Stats counters and WhyUs motion observers handle reduced motion gracefully without errors.

### Tier 3: Cross-Feature Combinations (3/3 Passed)
- `✔ PASS` **Section Anchors: All 11 Anchor IDs Exist & Are Scrollable** (46ms)
  - Verified presence and valid dimensions for `#hero`, `#stats`, `#about`, `#sambutan`, `#why-us`, `#kerjasama`, `#jurusan`, `#ppdb`, `#alumni`, `#berita`, `#faq`.
- `✔ PASS` **Header Component: Sticky Positioning Contract & Layout Audit** (2ms)
  - Verified `.site-header` computed CSS contract: `position: sticky`, `top: 16px` (`1rem`), `z-index: 100`.
- `✔ PASS` **Footer Component: Anchor Target Integrity & Secure External Links** (3ms)
  - Verified 100% of internal anchor links in `.site-footer` target valid elements in the DOM. Verified outbound external links include `rel="noopener"`.

### Tier 4: Visual Snapshot & Baseline Comparison (4/4 Passed)
- `✔ PASS` **Baseline Capture: 13 Per-Section Bounding Snapshots (1440px)** (7,316ms)
  - Captured and validated individual PNGs for all 13 sections.
- `✔ PASS` **Baseline Capture: Multi-Viewport Full Page (1440px, 992px, 640px)** (6,672ms)
  - Captured and validated full-page high-resolution PNGs across all 3 viewports.
- `✔ PASS` **Baseline Capture: Interactive Component States (Tabs, Accordion, Popup)** (4,530ms)
  - Captured interactive states: 4 major tabs, opened FAQ accordion, opened mobile menu drawer, and opened chatbot popup.
- `✔ PASS` **Visual Diff Harness: Pillow Pixel Comparison Self-Check (0.00% Error)** (1,758ms)
  - Executed `scratch/visual_diff_tool.py` against baseline directory in self-check mode, confirming identity match with 0.00% difference and exit code 0.

---

## 3. Baseline Artifacts Registry

All 23 baseline image files have been stored in `scratch/baseline_screenshots/`:

| Artifact Name | Scope | Resolution / Target | Size |
|---|---|---|---|
| `01_header.png` | Header Section | `.site-header` (1440px) | 24,263 bytes |
| `02_hero.png` | Hero Section | `#hero` (1440px) | 517,322 bytes |
| `03_stats.png` | Stats Section | `#stats` (1440px) | 15,780 bytes |
| `04_about.png` | About Section | `#about` (1440px) | 288,731 bytes |
| `05_sambutan.png` | Sambutan Section | `#sambutan` (1440px) | 351,706 bytes |
| `06_why_us.png` | Why Us Section | `#why-us` (1440px) | 167,134 bytes |
| `07_kerjasama.png` | Kerjasama Section | `#kerjasama` (1440px) | 37,678 bytes |
| `08_jurusan.png` | Jurusan Section | `#jurusan` (1440px) | 348,541 bytes |
| `09_ppdb.png` | PPDB CTA Section | `#ppdb` (1440px) | 241,466 bytes |
| `10_alumni.png` | Alumni Section | `#alumni` (1440px) | 112,704 bytes |
| `11_berita.png` | Berita Section | `#berita` (1440px) | 531,571 bytes |
| `12_faq.png` | FAQ Section | `#faq` (1440px) | 94,133 bytes |
| `13_footer.png` | Footer Section | `.site-footer` (1440px) | 83,514 bytes |
| `fullpage_desktop_1440.png` | Entire Page | Desktop 1440x900 full-scroll | 2,776,293 bytes |
| `fullpage_tablet_992.png` | Entire Page | Tablet 992x800 full-scroll | 2,744,356 bytes |
| `fullpage_mobile_640.png` | Entire Page | Mobile 640x900 full-scroll | 2,265,276 bytes |
| `jurusan_tab_PG.png` | Tab State | `#jurusan` on PG active | 346,307 bytes |
| `jurusan_tab_RPL.png` | Tab State | `#jurusan` on RPL active | 357,887 bytes |
| `jurusan_tab_TKJ.png` | Tab State | `#jurusan` on TKJ active | 413,538 bytes |
| `jurusan_tab_TJA.png` | Tab State | `#jurusan` on TJA active | 342,626 bytes |
| `faq_item_1_open.png` | Accordion State | `#faq` with Item 1 opened | 91,022 bytes |
| `mobile_menu_open.png` | Drawer State | `.site-header` with mobile menu open | 45,810 bytes |
| `chatbot_popup_open.png` | Popup State | `#chatbot-widget` with popup open | 3,714 bytes |

---

## 4. How Implementing Agents Should Run Tests

After completing any component refactoring in Milestones M1 through M5:

1. **Verify Backend Tests**:
   ```powershell
   cmd /c npm test
   ```
2. **Execute Full Automated E2E Regression Suite**:
   ```powershell
   node scratch/test_e2e_suite.cjs
   ```
   *Expect*: Exit code 0, all 18 tests passing.
3. **Run Adversarial Visual Diffing Against Baseline**:
   Capture refactored screenshots into `scratch/candidate_screenshots/`, then run:
   ```powershell
   python scratch/visual_diff_tool.py --baseline-dir scratch/baseline_screenshots --candidate-dir scratch/candidate_screenshots --diff-dir scratch/visual_diffs --threshold 0.5
   ```
   *Expect*: Exit code 0, 0 diff images generated in `scratch/visual_diffs/`.

---

## 5. Escalated Finding for Milestone M1

- **Root Overflow Constraint on Sticky Header**:
  In `global.css`, `html { overflow-x: hidden; }` and `body { overflow-x: hidden; }` are declared. Under CSS specification, ancestor `overflow-x: hidden` causes computed `overflow-y` to become `auto`, which interferes with descendant `position: sticky` staying pinned relative to the viewport window scroll.
  **Recommendation for Milestone M1**: Relocate horizontal overflow containment from root `html`/`body` to individual container sections or apply `overflow-clip` to allow full viewport sticky adherence.
