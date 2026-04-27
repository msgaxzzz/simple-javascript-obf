# Web UI Console Pro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the obfuscator web UI into a polished dual-theme product page with a centered processing overlay and success actions for download/copy.

**Architecture:** Keep the current single-file `web/index.html` app, but reorganize its visual hierarchy and add a lightweight client-side state layer for theme and processing overlay behavior. Use a small static regression test to lock down the new markup/hooks without introducing a frontend framework.

**Tech Stack:** Plain HTML, CSS, browser JavaScript, Node.js `assert`

---

### Task 1: Add Static UI Regression Coverage

**Files:**
- Create: `test/web-ui.js`
- Modify: `web/index.html`

- [ ] **Step 1: Write the failing test**

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "web", "index.html"), "utf8");

assert(html.includes('id="themeToggle"'), "expected theme toggle control");
assert(html.includes('id="overlay"'), "expected processing overlay");
assert(html.includes('id="overlayDownloadBtn"'), "expected overlay download action");
assert(html.includes('id="overlayCopyBtn"'), "expected overlay copy action");
assert(html.includes("function setOverlayState"), "expected overlay state controller");

console.log("web-ui: ok");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/web-ui.js`
Expected: FAIL with a missing theme toggle or overlay assertion

- [ ] **Step 3: Create the test file with the assertions above**

Create `test/web-ui.js` with the exact code from Step 1.

- [ ] **Step 4: Re-run the test to verify it still fails before implementation**

Run: `node test/web-ui.js`
Expected: FAIL because `web/index.html` does not yet contain the required markup/hooks

- [ ] **Step 5: Commit checkpoint**

```bash
git add test/web-ui.js
git commit -m "test: add web ui console pro coverage"
```

### Task 2: Implement Dual-Theme Product Visual Refresh

**Files:**
- Modify: `web/index.html`
- Test: `test/web-ui.js`

- [ ] **Step 1: Add top-level theme control and product-oriented shell**

Add a header action area with a theme toggle, update hero copy/trust cues, and introduce CSS variables for dark/light themes using a root attribute such as `data-theme`.

- [ ] **Step 2: Refresh layout and component styling**

Update the page to use a polished product-tool visual system:
- stronger background atmosphere
- softer card hierarchy
- better button styles
- cleaner typography
- improved spacing and responsive behavior

- [ ] **Step 3: Run the static test to verify the new hooks are present**

Run: `node test/web-ui.js`
Expected: PASS for any markup added so far, or fail only on overlay/controller hooks not yet implemented

- [ ] **Step 4: Commit checkpoint**

```bash
git add web/index.html test/web-ui.js
git commit -m "feat: refresh web ui visual system"
```

### Task 3: Add Centered Processing Overlay And Success Actions

**Files:**
- Modify: `web/index.html`
- Test: `test/web-ui.js`

- [ ] **Step 1: Add the overlay markup**

Add a full-screen overlay with:
- loading spinner state
- success check state
- error state
- `overlayDownloadBtn`
- `overlayCopyBtn`
- dismiss action

- [ ] **Step 2: Add the overlay state controller**

Implement minimal client-side helpers in `web/index.html`:
- `setOverlayState(state, details)`
- `openOverlay()`
- `closeOverlay()`
- theme persistence helper for the new toggle

- [ ] **Step 3: Wire the obfuscation flow into the overlay**

Update `runObfuscation()` so it:
- opens overlay on start
- shows processing state during request
- transitions to success with download/copy actions when result arrives
- transitions to error state if obfuscation fails

- [ ] **Step 4: Reuse existing download/copy logic from both page and overlay actions**

Keep existing result handling intact while exposing the same actions inside the overlay.

- [ ] **Step 5: Run focused verification**

Run:
- `node test/web-ui.js`

Expected:
- PASS

- [ ] **Step 6: Commit checkpoint**

```bash
git add web/index.html test/web-ui.js
git commit -m "feat: add web ui processing overlay"
```

### Task 4: Final Verification

**Files:**
- Modify: `web/index.html`
- Test: `test/web-ui.js`
- Test: `test/web-cli-args.js`

- [ ] **Step 1: Run regression tests**

Run:
- `node test/web-ui.js`
- `node test/web-cli-args.js`

Expected:
- both commands PASS

- [ ] **Step 2: Review final HTML for reduced-motion and responsive safeguards**

Confirm:
- there is a `prefers-reduced-motion` fallback
- overlay remains usable on narrow screens
- theme toggle defaults to dark but supports light mode

- [ ] **Step 3: Commit completion**

```bash
git add web/index.html test/web-ui.js docs/superpowers/specs/2026-04-25-web-ui-console-pro-design.md docs/superpowers/plans/2026-04-25-web-ui-console-pro.md
git commit -m "feat: redesign obfuscator web ui"
```
