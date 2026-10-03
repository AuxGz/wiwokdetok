# Project: Web JHIC Landing Page Tailwind Migration

## Architecture
- **Framework & Runtime**: Astro 7.3.5, Vite 8.0.13, Node adapter 11.1.6, React 19 integration.
- **Styling Architecture**: Migrating from 3,626 lines of manual scoped `<style>` CSS across 16 files to Tailwind CSS v4 (`@tailwindcss/vite` v4.3.3).
- **Design Tokens**: Standardized `@theme` in `src/styles/global.css`:
  - Brand Red: `#ed1e28` (`primary`), Hover: `#dc2626` / `#c41d24`, Tint: `#fef2f2`
  - Deep Blue: `#1e3a8a` (`secondary`)
  - Typography: `font-poppins` (Headings/Numbers), `font-jakarta` (Body/UI), `font-inter` (Subtitles)
  - Responsive Breakpoints: `sm` (640px), `md` (768px), `tablet` (992px), `lg` (1024px), `xl` (1280px), `2xl` (1440px), `container` (1560px)
- **Client-Side Interactivity**: Preserved vanilla JavaScript bindings across 7 interactive components (Jurusan tabs, Stats counter, Alumni carousel, FAQ accordion, Mobile navigation, Chatbot popup, WhyUs intersection observer).
- **Visual Review Swarm**: Dual-tier verification harness using Puppeteer with Microsoft Edge headless and Selenium/Pillow for multi-viewport pixel diffing (1440px, 992px, 640px).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Tailwind CSS v4 Package | Install `tailwindcss` and `@tailwindcss/vite` | M0 | Survey 1 |
| 2 | Vite Plugin Integration | Register `tailwindcss()` inside `astro.config.mjs` | M0 | Survey 1 |
| 3 | Design Tokens & Theme | Define `@theme` tokens in `src/styles/global.css` | M0 | Survey 1 |
| 4 | Baseline Build & Test Check | Ensure `npm run build` & `npm test` exit with code 0 | M0 | Survey 1 |
| 5 | Containers & Wrappers Refactor | Migrate `Container.astro` and `Section.astro` to Tailwind | M1 | Survey 2 |
| 6 | Header Component Refactor | Migrate `Header.astro` desktop pill, nav links, dropdowns | M1 | Survey 2 |
| 7 | Header Mobile Drawer JS Preservation | Preserve `#mobile-toggle`, `#mobile-menu`, `hidden`, `aria-expanded` | M1 | Survey 3 |
| 8 | Hero Section Refactor | Migrate `HeroSection.astro` gradients, backdrop circle, student photo | M2 | Survey 2 |
| 9 | Stats Section Refactor | Migrate `StatsSection.astro` cards, tabular numbers, dividers | M2 | Survey 2 |
| 10 | Stats Counter Animation JS Preservation | Preserve `.stat-num`, `data-value`, `.counted`, IntersectionObserver | M2 | Survey 3 |
| 11 | About Section Refactor | Migrate `AboutSection.astro` grid, dot matrix, red accent card | M3 | Survey 2 |
| 12 | Sambutan Section Refactor | Migrate `SambutanSection.astro` halo arc, asymmetric card (140px/90px) | M3 | Survey 2 |
| 13 | WhyUs Section Refactor | Migrate `WhyUsSection.astro` bento grid, hover tilt, tactile cards | M3 | Survey 2 |
| 14 | WhyUs Motion JS Preservation | Preserve `.why-us-section`, `.has-motion`, `.is-visible` | M3 | Survey 3 |
| 15 | Kerjasama Section Refactor | Migrate `KerjasamaSection.astro` marquee track and gradient mask | M3 | Survey 2 |
| 16 | Jurusan Section Refactor | Migrate `JurusanSection.astro` tab bar, panels, student cutout frames | M4 | Survey 2 |
| 17 | Jurusan Tab Switcher JS Preservation | Preserve `.tab-btn`, `.major-panel`, `.active`, `#tabIndicator`, `data-major-code` | M4 | Survey 3 |
| 18 | PPDB CTA Section Refactor | Migrate `PpdbCtaSection.astro` banner, background rings, buttons | M4 | Survey 2 |
| 19 | Alumni Section Refactor | Migrate `AlumniSection.astro` testimonial cards, avatars, blue rings | M4 | Survey 2 |
| 20 | Alumni Carousel JS Preservation | Preserve `.carousel-next-btn`, `.alumni-grid` direct descendants | M4 | Survey 3 |
| 21 | Berita Section Refactor | Migrate `BeritaSection.astro` cards, category badge, image zoom | M5 | Survey 2 |
| 22 | FAQ Section Refactor | Migrate `FaqSection.astro` help card, triggers, plus/cross toggle | M5 | Survey 2 |
| 23 | FAQ Accordion JS Preservation | Preserve `.faq-item`, `.faq-trigger`, `.faq-content`, `.active`, `.toggle-icon` | M5 | Survey 3 |
| 24 | Chatbot Widget Refactor | Migrate `ChatbotWidget.astro` FAB trigger, pulse radar, popup dialog | M5 | Survey 2 |
| 25 | Chatbot Widget JS Preservation | Preserve `#chatbot-widget`, `#open-chat`, `#close-chat`, `#chatbot-popup`, `hidden` | M5 | Survey 3 |
| 26 | Footer Component Refactor | Migrate `Footer.astro` layout, col-heading underline, apps grid | M5 | Survey 2 |
| 27 | User Asset Safety Verification | Verify 100% preservation of all 35 images in `app/public/images/` | M6 | Survey 2 |
| 28 | Multi-Viewport Visual Review | Capture & compare screenshots at 1440px, 992px, 640px | M6 | Survey 3 |
| 29 | JS Functional E2E Validation | Run headless interaction suite verifying all 6 interactive workflows | M6 | Survey 3 |
| 30 | Forensic Integrity Audit | Verify genuine utility conversion without dummy facades or mock shortcuts | M6 | Survey 1,2,3 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Fase 0: Setup Tailwind CSS v4 & Tokens | Install `@tailwindcss/vite`, update `astro.config.mjs`, define `@theme` in `global.css`, verify build | none | DONE |
| M1 | Fase 1: Shell & Navigation Refactoring | `Container.astro`, `Section.astro`, `Header.astro` | M0 | DONE |
| M2 | Fase 2: Hero & Stats Cluster Refactoring | `HeroSection.astro`, `StatsSection.astro` | M1 | IN_PROGRESS |
| M3 | Fase 3: Institutional & Narrative Refactoring | `AboutSection.astro`, `SambutanSection.astro`, `WhyUsSection.astro`, `KerjasamaSection.astro` | M2 | PLANNED |
| M4 | Fase 4: Program & Conversion Refactoring | `JurusanSection.astro`, `PpdbCtaSection.astro`, `AlumniSection.astro` | M3 | PLANNED |
| M5 | Fase 5: Support, Content & Footer Refactoring | `BeritaSection.astro`, `FaqSection.astro`, `ChatbotWidget.astro`, `Footer.astro` | M4 | PLANNED |
| M6 | Fase 6: E2E Verification & Adversarial Visual Audit | Multi-viewport visual review (1440px, 992px, 640px), JS interactivity suite, forensic audit | M5 | PLANNED |

---

## Interface Contracts

### Global Theme Tokens ↔ Components
- Standard utility classes available everywhere:
  - Colors: `bg-primary`, `text-primary`, `hover:bg-primary-dark`, `bg-primary-light`, `bg-secondary`
  - Fonts: `font-poppins`, `font-jakarta`, `font-inter`
  - Breakpoints: `sm:` (640px), `md:` (768px), `tablet:` (992px), `lg:` (1024px), `xl:` (1280px), `2xl:` (1440px)
  - Transitions: `transition-all duration-200`, `transition-transform duration-300`

### Component HTML ↔ Client JavaScript Selectors
- **Header**: `#mobile-toggle` and `#mobile-menu` must exist. `hidden` attribute governs visibility.
- **Stats**: `.stat-num` elements must retain `data-value="<number>"`. Initial rendering displays `0+` / `0%`.
- **Jurusan**: `.tab-btn[data-major-code]` and `.major-panel#panel-<code\>` must exist. Active state toggles `.active`. Indicator `#tabIndicator` sits inside `.tab-bar`.
- **Alumni**: `.carousel-next-btn` cycles immediate child cards of `.alumni-grid`.
- **FAQ**: `.faq-item` contains `.faq-trigger` and `.faq-content`. Active state toggles `.active` on `.faq-item`, displaying content and rotating `.toggle-icon` by 45deg.
- **Chatbot**: Root is `#chatbot-widget`. Buttons are `#open-chat` and `#close-chat`. Popup is `#chatbot-popup[hidden]`.
- **WhyUs**: Section is `.why-us-section`. Observer adds `.has-motion` and `.is-visible`.

---

## Code Layout
- Target application directory: `app/`
- Configuration:
  - `app/astro.config.mjs`
  - `app/package.json`
  - `app/src/styles/global.css`
- Core Layouts & Wrappers:
  - `app/src/layouts/BaseLayout.astro`
  - `app/src/components/Container.astro`
  - `app/src/components/Section.astro`
  - `app/src/components/Header.astro`
  - `app/src/components/Footer.astro`
- Landing Sections (`app/src/components/landing/`):
  - `HeroSection.astro`
  - `StatsSection.astro`
  - `AboutSection.astro`
  - `SambutanSection.astro`
  - `WhyUsSection.astro`
  - `KerjasamaSection.astro`
  - `JurusanSection.astro`
  - `PpdbCtaSection.astro`
  - `AlumniSection.astro`
  - `BeritaSection.astro`
  - `FaqSection.astro`
  - `ChatbotWidget.astro`
- Assets (READ-ONLY, DO NOT ALTER):
  - `app/public/images/*` (35 image assets)
