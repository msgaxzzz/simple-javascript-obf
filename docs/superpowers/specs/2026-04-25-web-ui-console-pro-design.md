# Web UI Console Pro Design

**Goal**

Refresh the obfuscator web UI into a polished consumer-facing product page with dual themes, clearer hierarchy, and a centered full-screen processing overlay that guides the user from obfuscation to copy/download actions.

**Scope**

- Keep the current single-page web app and existing functionality.
- Preserve the left/right workspace layout.
- Rework visual design, hierarchy, motion, and result handling.
- Do not change backend API shape or obfuscation logic.

**Design Direction**

- Product type: consumer-facing utility tool
- Style: modern SaaS tool, approachable rather than reverse-engineering console
- Theme support: dark and light, default to dark
- Motion: concise, meaningful transitions with reduced-motion fallback
- Fonts: external web fonts allowed

**Approved Direction**

- Layout: left/right workspace
- Themes: dual theme, default dark
- Processing UX: click `Obfuscate` to show a centered screen overlay
- Completion UX: success state shows animated check plus `Download` and `Copy`

## Information Architecture

### Primary Layout

- Left column: source input, file identity, primary action area
- Right column: options, output, startup log
- Header: product framing, trust cues, theme toggle

### User Flow

1. User pastes or uploads source.
2. User adjusts options if needed.
3. User clicks `Obfuscate`.
4. Full-screen overlay fades in and visually suppresses the rest of the page.
5. While processing, overlay shows spinner, concise progress message, and subtle animated background treatment.
6. On success, spinner transitions into a checkmark state.
7. Overlay reveals `Download Result` and `Copy Output`.
8. User may dismiss overlay and continue editing.

## Visual System

### Tone

- Clean, premium, friendly utility
- Avoid terminal, hacker, or internal-tool aesthetics
- Avoid purple-heavy defaults

### Color

Dark theme:
- Background: deep charcoal/ink
- Panels: slightly lifted slate surfaces
- Accent: teal/cyan family for active states
- CTA: warm orange or bright contrasting accent for final action emphasis

Light theme:
- Background: cool off-white
- Panels: white with soft borders
- Accent family should match dark theme

### Typography

- Primary UI font: modern rounded/grotesk sans suitable for product tools
- Code/input/output font: monospace kept for source/result readability
- Titles should feel product-grade rather than console-grade

### Surfaces

- Softer radii than current page
- Stronger separation between background, panel, and interactive controls
- Subtle shadows or contrast lifts depending on theme

## Motion

### Processing Overlay

- Fade + scale-in entrance
- Spinner ring for active processing
- Success check morph or swap-in animation
- Action buttons appear with short delayed fade/slide

### General UI

- Buttons: 150-220ms hover/focus transitions
- Panels: slight lift or border glow on focus-heavy states
- Theme switch: smooth color transition without long animation

### Accessibility

- Respect `prefers-reduced-motion`
- Reduced-motion mode removes scaling and looping flourish, keeps state changes instant/fade-only

## Interaction Details

### Overlay States

Processing:
- Large centered card or glass panel
- Spinner
- Status text such as `Protecting your script...`
- Optional subtext noting that result will appear when complete

Success:
- Checkmark replaces spinner
- Headline confirms completion
- Primary actions: `Download Result`, `Copy Output`
- Secondary action: dismiss/close and return to workspace

Error:
- Clear failure message
- `Try Again` and dismiss actions

### Page Suppression During Overlay

- Main page remains mounted but visually de-emphasized
- Inputs/options should not be interactable while overlay is open
- Overlay should own focus

## Responsive Behavior

- Desktop keeps two-column workspace
- Tablet compresses spacing but preserves two-column layout when possible
- Mobile collapses to single-column sections with the overlay still centered and dominant

## Implementation Notes

- Keep implementation inside the existing `web/index.html`
- Prefer CSS variables for both themes
- Avoid introducing a framework
- Reuse existing DOM structure where reasonable, but improve hierarchy and grouping if needed
- Add a theme toggle in the top region
- Add overlay markup near the end of `body` for easy state control

## Risks To Avoid

- Making the page look like a reverse-engineering console
- Overly long animations that slow the core task
- Hiding essential result actions after success
- Breaking existing button and result logic while restyling
- Creating separate mobile/desktop content trees

## Verification

- Dark and light themes both render correctly
- Overlay blocks background interaction
- Success state exposes working `Download` and `Copy`
- Existing obfuscation flow still works
- Reduced-motion mode remains usable
