# Vision app source

**UI source of truth:** All frontend UI is derived from Stitch design files in `stitch-extracted/stitch/*/code.html`. See `.cursor/rules/stitch-ui.mdc`.

- **pages/** — Route-level screens (Landing, Login, Establishment Selector, Dashboard, Session, Review). Each must match the corresponding Stitch `code.html`.
- **components/** — Reusable UI components.
- **styles/** — Extra global CSS and design-system overrides. Main entry is `src/index.css` (Tailwind + gold-glow).
- **lib/** — Auth, API client, session state, utilities.
- **templates/** — JSON exam templates (Shoulder/Scar) and schema; populated in later phases.
