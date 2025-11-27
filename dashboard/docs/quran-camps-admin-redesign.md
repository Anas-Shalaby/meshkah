# Quran Camps Admin Redesign

## 1. Current Experience Audit

### List View (`dashboard/src/app/dashboard/quran-camps/page.tsx`)

- Reliance on a single long list with no search, filtering, or sorting makes it difficult to locate specific camps.
- KPI cards show aggregate counts only; they do not surface trends (e.g., enrollment changes) or critical states (e.g., overdue starts).
- Cards lack visual hierarchy: identical weight for title, status pill, and metadata forces extra scanning time.
- RTL layout inconsistencies (`space-x-*`, `mr-*` utilities) cause icon misalignment and spacing issues in Arabic.
- Destructive actions (delete) are exposed inline without affordances such as confirmation modals or disabled states when operations are in-flight.
- No responsive adaptation beyond stacking; on small screens, action buttons wrap unpredictably.

### Camp Details (`dashboard/src/app/dashboard/quran-camps/[id]/page.tsx`)

- Long scroll without in-page navigation; contextual sections (resources, analytics, Q&A) are hidden behind links that reset scroll state.
- Action buttons (start, pause, reopen) live at the top, so admins must scroll back up after reviewing metrics to take action. No sticky bar.
- Status feedback does not include timeline cues (e.g., when camp last changed state, start vs end milestones).
- Analytics section is text-heavy with limited comparison (no sparklines or mini charts) and lacks “what to do next” guidance.
- Tabs reuse the list view styling issues; no persistence indicator showing which subpage the admin is on when navigating away and back.

### Create/Edit Flow (`dashboard/src/app/dashboard/quran-camps/create/page.tsx`, `[id]/edit/page.tsx`)

- Monolithic form mixes camp metadata, scheduling, media, and task management without progressive disclosure.
- Step indicator is only active for “from scratch” mode and offers no context for what each step contains.
- Form validation feedback is limited to browser defaults; missing inline hints, async validation for duplicates, and required-field clarity.
- Task and group creation use raw inputs with no preview of how the final daily schedule will appear to campers.
- Template selection lacks filtering, thumbnails, or metadata making it hard to pick the right starting point.
- No autosave or draft state; losing progress is likely if the session expires.

### Daily Tasks Management (`dashboard/src/app/dashboard/quran-camps/[id]/tasks/page.tsx`)

- Accordion-less wall of forms: editing multiple days forces repetitive scrolling and manual tracking of day numbers.
- Group management is modal-free and relies on toggling forms inline, which becomes confusing when multiple panels are open.
- Task ordering controls require manual entry of `order_in_day` rather than drag-and-drop or quick reordering.
- Error handling is generic (`حدث خطأ`) with no guidance on recovery or which field failed.
- Bulk operations (duplicate task across days, mark optional, assign to group) are absent, increasing repetitive data entry.

### Global/Infrastructure

- `DashboardLayout` lacks quick shortcuts or global search, and the collapsible sidebar animation does not remember state.
- Theming relies on default Tailwind palette; brand differentiation is minimal, and contrast in dark mode is borderline for accessibility.
- Icon sizing and spacing are inconsistent; some actions use 16px icons, others 20px, with mixed padding values.
- Loading states use spinner-only affordances without contextual messaging, leading to perceived latency.

**Audit Summary:** The current admin experience optimizes for raw CRUD capability but not for operational efficiency. High cognitive load, weak affordances for prioritization, and lack of RTL-aware styling updates lead to frustration and errors, especially on the high-friction creation and task management flows.

## 2. Target UX Concepts

### 2.1 Camps Home (List View)

- **Hero KPI ribbon:** Four compact cards (Active Camps, Upcoming Starts, Enrollment Today, At-Risk Camps) with trend indicators and contextual CTA (e.g., “Review tasks”).
- **Segmented controls:** Pill-based status tabs (`الكل`, `نشط`, `قريبًا`, `مكتمل`) plus filter drawer (Surah, duration range, start date, tags) and search input pinned in a sticky toolbar.
- **Card layout:** Two-column grid on desktop, single column on mobile; each card combines banner thumbnail, key metadata, progress bar, and primary action `إدارة`.
- **Inline insights:** Alert badges for “يحتاج تحديث الموارد” or “انخفاض التفاعل” using pastel accent backgrounds.
- **Bulk actions:** Checkbox selection enabling batch status change or notification send.

### 2.2 Camp Detail Overview

- **Sticky action bar:** Persistent top bar with status dropdown, primary CTA, secondary actions (Share, Duplicate, Edit) and last-updated timestamp.
- **Overview snapshot:** Metric tiles (Enrollment, Completion, Average Progress, Active Discussions) with DELTA vs previous period.
- **Timeline panel:** Horizontal progress timeline (Draft → تسجيل مبكر → نشط → مكتمل) with actual dates, upcoming reminders, and ability to schedule announcements.
- **Engagement modules:** Cards for Resources, Q&A, Participants with quick counts and “Manage” buttons; empty states show contextual prompts.
- **Right rail:** Collapsible notes, audit log, and quick links to frequently used subpages.

### 2.3 Camp Creation & Edit Wizard

- **Stepper:** Four steps—1) الأساسية، 2) الجدول الزمني، 3) المهام، 4) النشر—displayed horizontally with status states (complete, current, upcoming). Autosave indicator near header.
- **Basics step:** Split layout with form (name, surah, description, tags, banner preview) and real-time summary card.
- **Schedule step:** Calendar selector with duration slider, recommended start dates, and timezone awareness.
- **Tasks step:** Day-based accordion showing timeline on the left and editable task list on the right; drag-and-drop reordering, bulk duplication, optional toggles.
- **Publishing step:** Checklist for readiness (banner uploaded, tasks assigned, resources attached), preview of participant view, and notification scheduling.
- **Template gallery:** Grid with preview thumbnails, tags, duration, and expected difficulty; filtering by audience type.

### 2.4 Daily Tasks Management

- **Day timeline view:** Sticky day selector (chips 1..N) with scroll-synced panels; each day shows tasks as cards with reorder handles.
- **Group management drawer:** Right-side panel listing groups, allowing quick assignment via drag-and-drop or multi-select.
- **Inline editing:** Expanding task card reveals key fields; advanced settings housed in modal with tabs (Content, Media, Scoring).
- **Bulk utilities:** Action bar for duplicating tasks to other days, converting to optional, or assigning groups en masse.
- **Validation feedback:** Toasts contextualize success (“تم حفظ مهمة يوم ٥”) and inline errors highlight inputs.

### 2.5 Cross-Cutting Interaction Patterns

- Sticky filter/step bars for persistent context.
- Progressive disclosure for advanced fields, defaulting to essential inputs.
- Keyboard-friendly navigation with focus outlines, especially in forms and drag areas via `@dnd-kit` or similar.
- RTL-aware spacing utilities (swap `space-x` for logical `gap-x` or directional classes).
- Motion usage limited to subtle fades/slide for clarity, avoiding distraction.

## 3. Visual Language & Component System

### 3.1 Typography

- **Primary heading:** `Tajawal` (700/600 weights) for hero titles and section headers (`text-3xl/2xl`).
- **Body text:** `IBM Plex Sans Arabic` (400/500) for paragraphs, form labels, and inputs.
- **Monospaced accents:** `Inconsolata` for IDs or code-like labels inside analytics.
- Tailwind config updates:
  ```ts
  fontFamily: {
    display: ["Tajawal", "var(--font-sans)"],
    arabic: ["IBM Plex Sans Arabic", "var(--font-sans)"],
    mono: ["Inconsolata", "ui-monospace", "SFMono-Regular"],
  }
  ```

### 3.2 Color Palette

- **Base neutrals:** `sand-50..900` (warm gray, e.g., `#F8F5F1` to `#3F3A36`) to replace default gray.
- **Primary accent:** Deep teal `#0F5C5C` with lighter `#D6F2EF` background for pills.
- **Secondary accent:** Muted blue `#1D5BA5` for links and stats.
- **Success:** Emerald `#1B9C74`; **Warning:** Amber `#E6A041`; **Error:** Cranberry `#C5415A`.
- Provide dark-mode equivalents with adjusted luminance (e.g., teal lighten to `#18A3A3`).
- Gradient for hero ribbons: `linear-gradient(135deg, #0F5C5C 0%, #1D5BA5 100%)`.

### 3.3 Iconography & Imagery

- Use 20px icons by default with consistent padding (`p-2` max). Wrap inside circular background for primary actions.
- Banner thumbnails adopt 4:1 aspect (e.g., 1200×300) with subtle overlay and blur fallback if missing.
- Provide empty state illustrations styled with line art matching palette.

### 3.4 Spacing & Layout Tokens

- Establish spacing scale additions: `gap-7 (28px)` for card grids, `gap-9 (36px)` for section separation.
- Define container widths: `max-w-dashboard` (~1240px) for main content, `max-w-wizard` (~880px) for forms.
- RTL-friendly logical utilities using Tailwind plugin (`margin-inline-start`, `padding-inline-end`) to avoid hardcoded `mr/ml`.

### 3.5 Reusable Primitives

- **StatCard:** Props for icon, label, value, delta; supports `variant="neutral|positive|attention"`.
- **ActionToolbar:** Sticky bar with slot for breadcrumbs, actions, metadata; handles responsive collapse.
- **FilterDrawer:** Right-side sheet with checkboxes, date pickers, tag selector, and apply/reset buttons.
- **TimelineStepper:** Visual status tracker with icons and date badges.
- **TaskCard:** Drag handle, title, meta chips, quick actions; expands to show details.
- **ChipPill:** Soft background with optional icon and count; used for status, filters, tags.

### 3.6 Tailwind & Theme Implementation

- Extend `tailwind.config.ts` with new color scales and shadow tokens (`shadow-card`, `shadow-toolbar`).
- Introduce CSS variables in `globals.css` for light/dark theme bridging.
- Implement font loading via Next.js font optimization (`@next/font/google`) to ensure Arabic character support.
- Document component usage and tokens in `dashboard/docs/ui-kit.md` (future work) and consider Storybook integration for visual regression.

## 4. Implementation & Rollout Roadmap

### 4.1 Engineering Milestones

1. **Foundation Sprint**
   - Integrate new fonts and color tokens in `tailwind.config.ts` and global styles.
   - Scaffold shared primitives (`StatCard`, `ActionToolbar`, `ChipPill`) with Storybook stories/tests.
   - Add global RTL spacing utilities plugin and migrate existing pages incrementally.
2. **List View Revamp**
   - Build filter toolbar, segmented tabs, and card grid.
   - Implement `useCampsFilters` hook for state management; add API params for search/filter.
   - Add bulk selection logic and confirmation modals.
3. **Camp Detail Enhancements**
   - Introduce sticky action bar and timeline module.
   - Refactor overview metrics to use `StatCard`.
   - Add right-rail components (notes, quick links) with feature flags for gradual rollout.
4. **Wizard & Tasks Overhaul**
   - Replace existing create/edit page with stepper-based layout; implement autosave via debounced PATCH.
   - Integrate drag-and-drop tasks using `@dnd-kit` with accessible keyboard support.
   - Introduce template gallery data fetching and caching.
5. **Hardening & Polish**
   - Cross-browser/RTL testing, responsive QA, dark-mode tuning.
   - Performance checks (React Profiler) to avoid unnecessary re-renders.

### 4.2 QA & Testing Strategy

- **Automated:** Add React Testing Library suites for filter logic, wizard validation, and task reordering. Snapshot tests for shared components.
- **Manual scripts:** Golden-path scenarios (create camp, edit tasks, reopen camp) documented in Notion/runbook.
- **Accessibility:** Axe audits, keyboard navigation tests, contrast verification for light/dark themes, screen reader labels in Arabic.
- **Localization:** Validate Arabic copy with linguist; ensure fallback for English where translations missing.

### 4.3 Rollout & Monitoring

- Feature flag major modules (`camps_list_v2`, `camp_wizard_v2`) to allow staged release.
- Capture telemetry (Mixpanel or internal analytics) for time-to-complete creation, filter usage, and task edits.
- Schedule pilot with a small admin cohort, collect feedback via embedded survey.
- Prepare release notes, video walkthrough, and quick-reference PDF.
- Define rollback steps (toggle feature flags, retain legacy pages for two release cycles).
