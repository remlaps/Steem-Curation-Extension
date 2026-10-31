# Plan: Reuse Condenser's markdown engine in the reblog dialog (Option A)

> **Status — branch `feature/reblog-markdown-editor`:** implemented. In place are
> the branch, the `.github/workflows/update-remarkable.yml` workflow, the vendored
> `libs/remarkable.min.js` (Remarkable **2.0.1**, MIT, integrity-verified against
> the npm registry), the `manifest.json` wiring, the `reblogControl.js` /
> `reblogControl.css` refactor (Markdown toolbar, Write/Preview toggle,
> Remarkable-based excerpt and previews with sanitization), the editor labels for
> all 9 locales, and the `CHANGELOG.md` entry. Remaining: manual browser testing
> and release preparation.

## 1. Goal & scope

Replace the hand-rolled markdown handling in the reblog dialog with the **same
markdown engine Condenser's editor uses** (`remarkable`), so the comment box
gains a real toolbar and a faithful live preview.

This keeps the extension a plain **Manifest V3 browser extension**. The reblog
*broadcast* behavior does not change at all.

**In scope**
- Vendor `remarkable` into `libs/` and load it in the isolated world.
- Replace hand-written markdown parsing (`sceReblogStripMarkdown`,
  `sceReblogAppendLinkifiedText`, `sceReblogRenderInlineMarkdown`) with
  Remarkable.
- Add a markdown toolbar and a Write/Preview toggle to the comment field.

**Out of scope (unchanged)**
- The broadcast semantics: new root post (`parent_author: ''`), title, tags,
  `sce-reblog` marker, permlink generation, author beneficiary.
- The signing path (`reblogBridge.js` -> Steem Keychain).
- `sceReblogBuildBody()` output format (still Markdown).

## 2. Why this is the right "reuse"

Condenser's editor is a React/Redux component (`ReplyEditor`) whose parsing is
provided by the bundled `remarkable` library plus `sanitize-html`/`HtmlReady`.
None of those modules are exposed on `window`, and the extension runs in the
isolated world, so it cannot call into them. The reusable, portable part is the
**engine itself** — the exact same library Condenser uses. We vendor that
library and drive it from the extension's own dialog.

## 3. Guiding constraints

- **Stay a browser extension.** Content script, isolated world, MV3.
- **No remote code** (MV3 CSP): the library must be vendored locally, the same
  way `libs/chart.min.js` already is.
- **Never render untrusted HTML into the DOM.** The excerpt/comment can contain
  untrusted markup from the original post; keep the current conservative
  posture.
- **Never emit untrusted markup into the broadcast body.** The excerpt stays
  plain text inside the `>` blockquote.

## 4. Deliverables (file-by-file)

| File | Change |
| --- | --- |
| `libs/remarkable.min.js` | **New.** Vendored Remarkable UMD build (pinned version, provenance comment). |
| `manifest.json` | Add `libs/remarkable.min.js` to the isolated-world content script `js` array, **before** `reblogControl.js`. |
| `reblogControl.js` | Refactor markdown handling; add toolbar + Write/Preview toggle. |
| `reblogControl.css` | Styles for the toolbar, editor tabs, and rendered markdown (light + dark). |
| `language.js` | New labels in the English defaults of `getReblogLabelsInLang`; optional localized strings for the 8 locales already covered. |
| `CHANGELOG.md` | New entry under `## [Unreleased]`. |
| `README.md` / `STORE_LISTING.md` | Optional wording tweak (editor now supports Markdown). |
| `.github/workflows/update-remarkable.yml` | Optional: mirror `update-chartjs.yml` to keep the vendored lib current. |

> Packaging note: `scripts/package.ps1` packages exactly the files declared in
> `manifest.json`, so once the lib is declared it ships automatically. Markdown
> files (including this plan) are excluded from the `.zip`.

## 5. Detailed steps

### Step 1 — Vendor the library
- Add `libs/remarkable.min.js` (the UMD `dist` build), pinned to a specific
  version, with a short provenance header (source + version), matching the
  style of the existing `libs/chart.min.js`.
- The UMD build attaches the module to a global (in Remarkable's `dist` build
  this is `window.remarkable`, exposing `Remarkable`). **Confirm the exact
  global name after vendoring** and reference it defensively, e.g.
  `const Remarkable = (window.remarkable || {}).Remarkable;` with a graceful
  fallback if the global is missing.

### Step 2 — Wire it into `manifest.json`
- In the **second** (isolated-world) `content_scripts` entry, insert
  `"libs/remarkable.min.js"` into `js` **before** `"reblogControl.js"` so the
  global is defined when the dialog code runs. (Content scripts in one entry
  share the isolated-world scope, which is how `graph.js` already consumes the
  global `Chart` from `libs/chart.min.js`.)

### Step 3 — Create a single shared renderer instance
- In `reblogControl.js`, create one configured instance, mirroring Condenser's
  config but with raw HTML disabled for safety:
  `const sceReblogMarkdown = new Remarkable({ html: false, breaks: true });`
- Rationale for `html: false`: raw HTML in the source is escaped (rendered as
  text) rather than executed, which keeps the preview safe without pulling in
  `sanitize-html` and its dependencies. Remarkable's default link validation
  (`validateLink`) additionally blocks `javascript:`/`data:` link schemes.
- Add a tiny allowlist pass over Remarkable's output before it touches the DOM:
  parse into a detached element, walk the tree, keep only expected tags
  (`p, a, strong, em, del, blockquote, code, pre, ul, ol, li, h1..h6, hr, br,
  img, table, thead, tbody, tr, th, td`), drop unknown tags/attributes, and
  re-validate `a[href]` / `img[src]` with the existing
  `SCE_REBLOG_SAFE_IMAGE_URL_REGEX` / http(s) check. This matches the existing
  defensive style in the file.

### Step 4 — Refactor excerpt derivation (robust, lossless-to-text)
- Replace `sceReblogStripMarkdown()` (lines ~196-209) with a Remarkable-based
  helper that renders the original body to HTML, reads `.textContent` from a
  detached element to obtain plain text, then collapses whitespace.
- Keep `sceReblogBuildExcerpt()`'s truncation/ellipsis logic unchanged. The
  excerpt remains **plain text** and is still wrapped in `> ` when the body is
  built — so the broadcast body is unchanged.

### Step 5 — Refactor the live preview
- Replace `sceReblogAppendLinkifiedText()`, `sceReblogRenderInlineMarkdown()`,
  and the inline-markdown parts of `sceReblogRenderPreview()` with Remarkable
  rendering (through the sanitizer from Step 3).
- Keep the preview's overall structure (thumbnail, comment, excerpt
  blockquote, link-back line, attribution/beneficiary notes) so users see the
  same thing, but with the comment now rendered as full Markdown.
- The excerpt stays rendered as a `<blockquote>` with `textContent` (plain
  text), which is what actually gets posted.

### Step 6 — Add the editor toolbar + Write/Preview toggle
- Extend `sceReblogBuildModal()` with a toolbar above the comment `textarea`
  and a Write/Preview toggle, using localized tooltips.
- Toolbar actions (all dependency-free, operating on the textarea selection and
  dispatching an `input` event so the preview updates):
  bold `**`, italic `*`, strikethrough `~~`, heading `## `, quote `> `,
  inline code, code block, bullet list, numbered list, link `[text](url)`,
  image `![](url)`.
- Implement one helper, e.g.
  `sceReblogApplyMarkdown(textarea, kind)`, that wraps/inserts at the current
  selection and preserves focus/caret.
- Keep the textarea as the source of truth; the broadcast body continues to use
  the raw Markdown the user typed (so preview and result now agree).

### Step 7 — Styles
- Add to `reblogControl.css`: `.sce-reblog-toolbar`,
  `.sce-reblog-toolbar-button`, `.sce-reblog-editor-tabs` / `.sce-reblog-tab`,
  and a `.sce-reblog-markdown` content block (sensible spacing for `p`,
  `blockquote`, `pre/code`, lists, headings, and `img { max-width: 100% }`).
- Add `body.theme-dark` variants, matching the existing dark-theme section.

### Step 8 — Labels (`language.js`)
- Add new keys to the English defaults in `getReblogLabelsInLang` (e.g.
  `toolbarBold`, `toolbarItalic`, `toolbarStrikethrough`, `toolbarHeading`,
  `toolbarQuote`, `toolbarCode`, `toolbarCodeBlock`, `toolbarBulletList`,
  `toolbarNumberedList`, `toolbarLink`, `toolbarImage`, `writeTab`,
  `previewTab`, and a `markdownHint`).
- Locales that don't override a key automatically fall back to the English
  default. Optionally add translations for the 8 locales already covered
  (`fr, it, ja, ko, pl, ru, es, uk`) in a follow-up.

### Step 9 — Docs & versioning
- Add a `## [Unreleased]` entry in `CHANGELOG.md` describing the new editor.
- Bump `manifest.json` `version` only during release preparation, per
  `VERSIONING_CHECKLIST.md` (not on the feature branch).
- Optional: note the editor's Markdown support in `README.md` / `STORE_LISTING.md`.

## 6. Validation

1. Load unpacked in Chrome (`chrome://extensions` -> Load unpacked) and confirm
   **no console errors** on a matched site.
2. Open the reblog dialog on a post with rich formatting (headings, lists,
   links, images, code) and confirm the excerpt is sensible plain text.
3. Type Markdown in the comment box; confirm the toolbar buttons wrap/insert
   correctly and the live preview matches.
4. Confirm the **broadcast payload is structurally unchanged** (compare
   `sceReblogBuildOperations` output against the pre-change version).
5. Verify the Write/Preview toggle, keyboard focus/caret behavior, and Escape
   handling still work.
6. Check dark theme rendering of the toolbar and rendered preview.
7. Spot-check a non-English locale (e.g. `fr`) to confirm labels fall back
   correctly for the new keys.
8. Attempt a "hostile" preview input (raw `<script>` / `javascript:` link) and
   confirm it is escaped/stripped.
9. Run `scripts/package.ps1` and confirm the `.zip` includes
   `libs/remarkable.min.js`.

## 7. Risks & mitigations

- **Remarkable version drift vs. Condenser.** Pin the vendored version and
  record it; optionally add the update workflow (Step 9) like Chart.js has.
- **Sanitizer correctness.** Keep the allowlist tight and re-validate URLs;
  prefer `html: false` so raw HTML is never emitted.
- **Bundle size.** The Remarkable `dist` build is small (~tens of KB); no build
  step is required.
- **Global name assumption.** Confirm the UMD global after vendoring and guard
  against a missing global so the dialog degrades gracefully.

## 8. Branching

Per the repo's git-safety rule: do the work on a feature branch
(e.g. `feature/reblog-markdown-editor`) and open a PR. Do not commit directly to
`main`/`master`.
