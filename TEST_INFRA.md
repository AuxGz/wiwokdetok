# Test Infrastructure: Automated E2E Regression & Adversarial Visual Review Harness

## 1. Overview & Architecture

The Web JHIC automated verification harness provides multi-tier end-to-end (E2E) functional testing, boundary stress testing, and pixel-level visual regression auditing across the landing page of SMK Telkom Purwokerto.

The harness is engineered to support the phased migration from manual scoped CSS to Tailwind CSS v4, validating that:
1. Zero client-side JavaScript interactivity is broken.
2. Layout responsiveness remains stable across breakpoints (1440px desktop, 992px tablet, 640px mobile).
3. Visual fidelity is 100% preserved against pre-migration baseline captures.

```
+-----------------------------------------------------------------------------------------+
|                                WEB JHIC E2E TEST HARNESS                                |
+-----------------------------------------------------------------------------------------+
                                             |
     +-------------------+-------------------+-------------------+--------------------+
     |                   |                   |                   |                    |
     v                   v                   v                   v                    v
+--------------+   +--------------+   +----------------+   +-----------------+   +----------------+
|    TIER 1    |   |    TIER 2    |   |     TIER 3     |   |     TIER 4      |   |  VISUAL DIFF   |
| Core JS      |   | Boundaries & |   | Cross-Feature  |   | Visual Baseline |   |  Pillow Engine |
| Interactivity|   | Corner Cases |   |  Combinations  |   | Multi-Viewport  |   |  (Python PIL)  |
+--------------+   +--------------+   +----------------+   +-----------------+   +----------------+
- Jurusan Tabs     - Breakpoints      - 11 Section     - 13 Section      - Pixel Diff Map
- Stats Counter      (1440/992/640)     Anchor Jumps     Bounding Boxes  - RMSE Calculation
- Alumni Carousel  - Rapid Clicks     - Header Sticky  - 3 Full-Page View- - Threshold Filter
- FAQ Accordion    - Chatbot Escape     CSS Contract     ports (PNG)       (0.5% tolerance)
- Mobile Drawer    - Reduced Motion   - Footer Anchor  - 7 Component
- Chatbot Popup      Preservation       Integrity        State Captures
```

---

## 2. Technology Stack & Execution Environment

| Component | Technology | Version / Path |
|---|---|---|
| **Test Runner** | Node.js | v26.7.0 (`node scratch/test_e2e_suite.cjs`) |
| **Browser Engine** | Microsoft Edge Headless | `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` |
| **Automation Driver** | Puppeteer | MCP Server Bundled (`@modelcontextprotocol/server-puppeteer`) |
| **Visual Diff Engine** | Python 3 + Pillow (PIL) | Python 3.12.10, Pillow 12.3.0 (`scratch/visual_diff_tool.py`) |
| **Target Dev Server** | Astro Dev Server | `http://localhost:3000` |
| **Baseline Storage** | Disk Directory | `scratch/baseline_screenshots/` (23 high-res PNG artifacts) |
| **Test Results Output**| Structured JSON | `scratch/test_results.json` |

---

## 3. Four-Tier Test Suite Specification

### Tier 1: Core JS Functionality (7 Tests)
1. **Jurusan Tabs: Initial State (PG Active)**:
   - Validates that `.tab-btn[data-major-code="PG"]` possesses `.active` and `aria-selected="true"`.
   - Validates that `#panel-PG` has `.active` and all other 3 major panels (`#panel-RPL`, `#panel-TKJ`, `#panel-TJA`) do not.
2. **Jurusan Tabs: Sequential Switching & Slider Translation**:
   - Sequentially clicks `RPL`, `TKJ`, `TJA`, and returns to `PG`.
   - Confirms single active panel guarantee, `display: grid` computed visibility, and `#tabIndicator` inline translation update (`translateX(...)`).
3. **Stats Section: IntersectionObserver Count-Up Numbers**:
   - Pre-initializes counter targets (`910+`, `4`, `182+`, `150`).
   - Scrolls `#stats` into view to trigger `IntersectionObserver`.
   - Asserts each `.stat-num` gains the `.counted` class and counts up smoothly to match its `data-value`.
4. **Alumni Section: Carousel Next Card Order Cycle**:
   - Asserts `.alumni-grid` direct child elements cycle upon clicking `.carousel-next-btn`.
   - Confirms deterministic card rotation (`firstElementChild` shifts to last position).
5. **FAQ Section: Single-Open Accordion Toggling & State Rotation**:
   - Verifies default open state of Item 0.
   - Clicks Item 1: Item 0 collapses to `display: none`, Item 1 opens to `display: block` with `aria-expanded="true"`.
   - Re-clicks Item 1: Item 1 collapses cleanly. Re-opens Item 0 to restore baseline.
6. **Header Component: Mobile Menu Toggle & Auto-Close on Anchor Click**:
   - Simulates mobile viewport (640px).
   - Toggles `#mobile-toggle`, asserting `#mobile-menu` removes `hidden` attribute.
   - Clicks anchor navigation link inside drawer, confirming drawer automatically re-applies `hidden`.
7. **Chatbot Widget: Open, Close, and Outside-Click Dismissal**:
   - Tests `#open-chat` opening `#chatbot-popup` (removes `hidden`).
   - Tests `#close-chat` closing `#chatbot-popup` (applies `hidden`).
   - Re-opens and clicks outside `#chatbot-widget`, validating click-outside dismissal.

### Tier 2: Boundary & Corner Cases (4 Tests)
1. **Viewport Responsiveness (1440px, 992px, 640px)**:
   - Asserts no horizontal document overflow (`document.documentElement.scrollWidth <= window.innerWidth`) at all 3 standard breakpoints.
   - Verifies desktop navbar vs mobile toggle visibility switches at `992px`.
2. **Jurusan Tabs: Rapid High-Frequency Clicking (Stress & Race Safety)**:
   - Fires high-frequency burst clicks across `PG` -> `TKJ` -> `RPL` -> `TJA` -> `PG` at 40ms intervals.
   - Confirms state consistency: exactly 1 button active, exactly 1 panel active, finite indicator coordinate.
3. **Chatbot Widget: Keyboard Escape Key Dismissal & Idempotency**:
   - Opens popup, presses `Escape` key, asserts popup closes.
   - Repeatedly presses `Escape` while closed to verify no unhandled exception.
4. **Accessibility: Reduced-Motion Mode Handling**:
   - Emulates `prefers-reduced-motion: reduce`.
   - Verifies Stats and WhyUs components handle reduced-motion media queries without runtime failure.

### Tier 3: Cross-Feature Combinations (3 Tests)
1. **Section Anchors: All 11 Anchor IDs Exist & Are Scrollable**:
   - Validates existence, visibility, and non-zero bounding geometry for `#hero`, `#stats`, `#about`, `#sambutan`, `#why-us`, `#kerjasama`, `#jurusan`, `#ppdb`, `#alumni`, `#berita`, `#faq`.
2. **Header Component: Sticky Positioning Contract & Layout Audit**:
   - Verifies computed CSS `position: sticky`, `top: 16px` (`1rem`), and `z-index >= 50`.
   - Documents root ancestor overflow constraints for Milestone M1 implementation.
3. **Footer Component: Anchor Target Integrity & Secure External Links**:
   - Verifies 100% of internal anchor links in `.site-footer` correspond to existing DOM elements.
   - Verifies all outbound external links specify `rel="noopener"`.

### Tier 4: Real-World Visual Snapshot & Baseline Comparison (4 Tests)
1. **13 Per-Section Bounding Snapshots (1440px)**:
   - Captures high-resolution cropped bounding box PNGs for all 13 sections.
2. **Multi-Viewport Full-Page Snapshots**:
   - Captures full scrollable page PNGs at 1440px desktop, 992px tablet, and 640px mobile.
3. **Interactive Component State Snapshots**:
   - Captures snapshots for each major tab (`PG`, `RPL`, `TKJ`, `TJA`), accordion open state, mobile drawer open, and chatbot popup open.
4. **Visual Diff Harness Self-Verification**:
   - Executes Python visual diff tool against the generated baseline suite, confirming 0.00% pixel mismatch on identity comparison.

---

## 4. Master DOM Selector Registry to PRESERVE

During all Tailwind CSS refactoring milestones, the following 35 selectors and attributes **MUST NEVER BE REMOVED**:

| Component | Target Selector / Attribute | Mechanism | Critical Role |
|---|---|---|---|
| **JurusanSection** | `.tab-btn` | `document.querySelectorAll(".tab-btn")` | Click listeners for tab switching |
| **JurusanSection** | `.major-panel` | `document.querySelectorAll(".major-panel")` | Target panels toggled by tabs |
| **JurusanSection** | `.active` | Class toggle | Controls visible state (`display: grid`) |
| **JurusanSection** | `#tabIndicator` | `document.getElementById("tabIndicator")` | Red sliding indicator element |
| **JurusanSection** | `data-major-code` | Attribute (`PG`, `RPL`, `TKJ`, `TJA`) | Maps tab button to panel ID |
| **JurusanSection** | `#panel-${code}` | Element ID | Major panels container |
| **JurusanSection** | `.tab-bar` | Parent element | Coordinate anchor for slider translation |
| **JurusanSection** | `#jurusan` | Section ID | Scroll anchor & test target |
| **StatsSection** | `.stat-num` | `document.querySelectorAll(".stat-num")` | Counter query target |
| **StatsSection** | `data-value` | Attribute | Counter target numbers (`910+`, `4`, `182+`, `150`) |
| **StatsSection** | `.counted` | State class | Guard preventing infinite re-triggering |
| **StatsSection** | `#stats` | Section ID | IntersectionObserver & scroll anchor |
| **AlumniSection** | `.carousel-next-btn` | `document.querySelector(".carousel-next-btn")` | Carousel next button listener |
| **AlumniSection** | `.alumni-grid` | Direct parent | Cards must remain direct children for DOM cycling |
| **AlumniSection** | `#alumni` | Section ID | Scroll anchor |
| **FaqSection** | `.faq-item` | `document.querySelectorAll(".faq-item")` | Accordion items container |
| **FaqSection** | `.faq-trigger` | Button selector | Click trigger for toggle |
| **FaqSection** | `.faq-content` | Content drawer | Target for `style.display` toggle |
| **FaqSection** | `.active` | State class on `.faq-item` | Triggers 45deg plus/cross icon rotation |
| **FaqSection** | `aria-expanded` | Attribute | Accessibility state |
| **FaqSection** | `#faq` | Section ID | Scroll anchor |
| **Header** | `#mobile-toggle` | `document.getElementById("mobile-toggle")` | Hamburger button click listener |
| **Header** | `#mobile-menu` | `document.getElementById("mobile-menu")` | Drawer element toggling `hidden` |
| **Header** | `hidden` | HTML attribute | Governs visibility without CSS specificity clashes |
| **Header** | `aria-expanded` | Attribute | Accessibility state |
| **Header** | `.desktop-nav` | Class | Hidden below 992px breakpoint |
| **Header** | `.mobile-toggle` | Class | Displayed below 992px breakpoint |
| **ChatbotWidget** | `#chatbot-widget` | `document.getElementById("chatbot-widget")` | Root widget for outside click detection |
| **ChatbotWidget** | `#open-chat` | Button ID | Floating avatar trigger |
| **ChatbotWidget** | `#close-chat` | Button ID | Popup close button |
| **ChatbotWidget** | `#chatbot-popup` | Container ID | Chat popup toggling `hidden` |
| **WhyUsSection** | `.why-us-section` | Target container | Target of motion IntersectionObserver |
| **WhyUsSection** | `.has-motion` | State class | Sets initial entrance state |
| **WhyUsSection** | `.is-visible` | State class | Triggers card reveal animation |
| **Section Anchors** | `#hero`, `#about`, `#sambutan`, `#why-us`, `#kerjasama`, `#jurusan`, `#ppdb`, `#alumni`, `#berita`, `#faq` | Element IDs | Page smooth scroll anchors |

---

## 5. Execution Commands

### Running the Full E2E Test Suite
Ensure the dev server is active on `http://localhost:3000`:
```powershell
node scratch/test_e2e_suite.cjs
```
- **Exit Code**: `0` on 100% pass, `1` on any failure.
- **Output Artifacts**:
  - Console colored summary
  - `scratch/test_results.json`
  - `scratch/baseline_screenshots/*.png` (23 images)

### Running the Python Visual Diff Tool
To compare candidate refactored images against the baseline:
```powershell
python scratch/visual_diff_tool.py --baseline-dir scratch/baseline_screenshots --candidate-dir scratch/candidate_screenshots --diff-dir scratch/visual_diffs --threshold 0.5
```
- **Threshold**: Defaults to 0.5% (0.005) pixel mismatch tolerance.
- **Output Artifacts**:
  - `scratch/visual_diffs/diff_*.png` (Red-highlighted mismatch overlay images)
  - `scratch/visual_diffs/diff_report.json`

---

## 6. Implementation Guidance & Architectural Considerations

1. **Header Sticky Behavior (Milestone M1)**:
   In `global.css`, `html { overflow-x: hidden; }` and `body { overflow-x: hidden; }` currently cause `overflow-y` to compute to `auto`, which prevents `position: sticky` on `.site-header` from sticking relative to window viewport scrolling.
   During Milestone M1 refactoring, move overflow containment from root `html`/`body` to individual container sections or apply `overflow-clip` to allow full viewport sticky adherence.
2. **Animation Media Queries**:
   All animation and transition refactoring must continue to support `prefers-reduced-motion: reduce` guards cleanly.
