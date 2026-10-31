# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- The reblog dialog's comment editor now supports full Markdown: a formatting toolbar (bold, italic, strikethrough, heading, quote, inline code, code block, bulleted and numbered lists, link, image) and a Write/Preview toggle with a rendered preview.
- The reblog dialog's live previews (the user's own comment and the full reblogged post) are now rendered with Remarkable — the same Markdown engine Condenser's editor uses — instead of the previous hand-rolled renderer.

### Changed
- The excerpt from the original post is now derived with Remarkable (rendered to HTML, then reduced to plain text) instead of a regex-based Markdown stripper, so headings, lists, tables and code are converted to text more faithfully.
- Vendored Remarkable 2.0.1 as `libs/remarkable.min.js` and added `.github/workflows/update-remarkable.yml`, which keeps the vendored copy current (mirroring the existing Chart.js workflow).

### Security
- Markdown rendered in the reblog dialog is sanitized before it is inserted into the page: raw HTML in the source is escaped (Remarkable runs with `html: false`), only an allowlist of tags is kept, and link and image URLs are restricted to plain `http(s)` (or same-site relative) URLs.

## [0.9.1-beta] - 2026-10-27
### Added
- Added `STORE_LISTING.md`, containing prepared Chrome Web Store listing copy (description, single-purpose and permission justifications, and data-usage declarations).
- Added `PRIVACY_POLICY.md`, containing the extension's privacy policy as a standalone repository file.

### Changed
- Updated the `manifest.json` description to disclose the optional "reblog with comment" feature and that broadcast signing is delegated to Steem Keychain (the extension never handles keys).
- Consolidated `SUBMISSION_CHECKLIST.md` to reference `STORE_LISTING.md` and `PRIVACY_POLICY.md` instead of duplicating listing copy, and cross-linked `STORE_LISTING.md` from `PRE_SUBMISSION_CHECKLIST.md`.

## [0.9.0-beta] - 2026-10-23
### Added
- The reblog dialog now includes an "Include image" checkbox (checked by default) that lets you omit the thumbnail image — and its wrapping `<div class="pull-right">` — from the reblogged post body and from `json_metadata.image`, so the image need not appear in your feed.
- The reblog dialog now offers an author-beneficiary dropdown (25%, 50%, 75%, or 100%) in place of the fixed 50%, and the beneficiary note shown in the dialog, the post preview, and the broadcast body reflects the selected percentage. The dropdown is hidden for self-reblogs (where no beneficiary is assigned).
- Before broadcasting, the reblog dialog now shows a confirmation warning when the first tag is a community tag (`hive-####`), explaining that the post will be published in that community and showing the community's name alongside the tag (e.g. `hive-109160 — Popular STEM`) when it can be resolved.
- The reblog dialog also warns before broadcasting when the user's own comment is empty or under 100 words, and requires confirmation to proceed. When both conditions apply, the warnings are shown together in a single confirmation dialog.
- Added `scripts/package.ps1`, which builds the Chrome Web Store `.zip` containing exactly the files declared in `manifest.json` (and nothing else), so the packaging step is deterministic.

### Changed
- The short-comment confirmation warning now distinguishes an empty comment from a short one, and focus returns to the comment field when the confirmation is cancelled.
- `manifest.json`'s `version_name` now uses the same hyphenated format as the git tag (e.g. `0.8.1-beta`).

### Fixed
- Reblogging a reply now inherits the title of the top-level (root) post instead of falling back to `Reblog: @author/permlink`, and its default title is prefixed with `Reblog-reply:` (localized) rather than `Reblog:`. The root post's title is read from the reply's `root_title` (with a fallback fetch of the root post), and it is used for the dialog's default title, the live post preview, and the broadcast body.
- Reblogging a reply now also inherits the image and tags from the root post: the root post's first image is used as the thumbnail when the reply has none, and the root post's tags are used, with the `sce-reblog` marker still swapped in as the 5th tag (or the last tag when there are fewer than five).
- Removed the duplicate reblog icon that appeared next to the native Reblog (resteem) button on the expanded top post of feeds and blog pages. The icon is still shown next to the Reblog button on the dedicated full-post page.
- Removing the `sce-reblog` tag in the reblog dialog is now respected: the marker tag is no longer silently re-added when the reblog is broadcast.
- Reblog titles and bodies are now capped to the bridge's limits (256 and 65,536 characters respectively), and the title and comment fields have matching input limits, so an over-long title (a near-maximum original title plus the `Reblog:` prefix) can no longer make the broadcast fail with an opaque "Unsupported operation" error.

## [0.8.1-beta] - 2026-10-22
### Security
- Hardened the Steem Keychain bridge (`reblogBridge.js`) so it no longer trusts the contents of the messages it receives. It now only signs `comment` + `comment_options` operations with the Posting key, rebuilds the payload from validated fields (rejecting any other operation, key type, or malformed value), and ignores messages that do not come from one of the extension's own origins. This prevents a script running on a matched page (an XSS, or a compromised mirror site) from using the bridge to request arbitrary Keychain signatures.
- Escaped the thumbnail URL and link text when building the reblog body, and restricted embedded image URLs to plain `http(s)` URLs, closing a stored-XSS vector where a crafted original post could inject markup into a reblog that is broadcast to the chain.
- Restricted the background fetch proxy (`background.js`) to this extension's own content scripts and to HTTPS requests to `api.steemit.com` and `sds.steemworld.org`, and URL-encoded the account/post identifiers interpolated into SteemWorld SDS request URLs.
- Replaced the remaining `innerHTML` usage in the voter list (`post/votes/votes.js`) with DOM construction, and limited clickable links in the reblog preview to `http(s)`/relative URLs.
- The Chart.js update workflow now downloads the package from the npm registry and verifies it against the published integrity hash before committing it.

### Changed
- Updated the vendored Chart.js library (`libs/chart.min.js`) from 4.5.1 to 4.6.1. The build was taken from the npm registry tarball and verified against the integrity hash published for that version before being committed.

## [0.8.0-beta] - 2026-10-22
### Added
- Added a "reblog with comment" icon to every post container (feeds, blog pages, and the full post view). Clicking it broadcasts a new root post that contains the user's own comment, a quoted excerpt from the beginning of the original post, and an `Original post by @author: [Post Title](/@author/permlink)` link (relative, so it resolves on any Condenser front end), and assigns 50% of the post's author rewards to the original author. The new post reuses the original's first image as its thumbnail — embedded at the top of the post body inside a right-floated `pull-right` section and linked to the original post (so front ends like steemit.com, which derive the feed thumbnail from the body, display one) and also recorded in `json_metadata.image` — omits the `@`-mention for self-reblogs, and includes an attribution note (`Reblogged using the Steem Curation Extension` … `Steem Keychain is required`) together with a disclosure of the 50% beneficiary. Signing is delegated to the [Steem Keychain](https://chromewebstore.google.com/detail/steem-keychain/lkcjlnjfpbikmcmbachjpdbijejflpcm) browser extension through a main-world bridge (`reblogBridge.js`); the extension itself never requests, stores, or uses any keys.
- The reblog dialog's tags are editable (defaulting to the original post's tags), and every reblog includes the `sce-reblog` tag so reblogs can be aggregated through a single tag feed.
- The reblog dialog shows a full, live, rendered preview of the post that will be broadcast, with bare URLs and Markdown links in the comment shown as clickable links.
- The "Show Resteems" toggle (now "Show Resteems & Reblogs") also hides reblog posts created by this extension: on the following feed they remain visible when the original author is followed; on blog/profile pages they are hidden along with resteems.

## [0.7.5-beta] - 2026-08-06
### Changed
- Removed `host_permissions` from `manifest.json`; the extension no longer requires explicit host permission declarations.

### Fixed
- Fixed a missing link at the "CURATION INFO" label: the label was previously rendered as a non-link `<span>` placeholder with no associated link; it is now a real hyperlink (`<a>`) pointing to the associated post.

## [0.7.3-beta] - 2026-06-04
### Fixed
- Hardened XSS protection in the curation overlay by sanitizing user-defined tags before rendering.
- Fixed a formatting typo in the v0.5.1 changelog entry.

## [0.7.2-beta] - 2026-06-03
### Fixed
- Resolved a data "stale-ness" issue where tooltips displayed incorrect author information when navigating between feeds. This was caused by the Single Page Application (SPA) reusing DOM nodes; handlers now dynamically retrieve identities from current element attributes.
- Expanded follower analysis tooltip support to include user links in resteem notifications within feeds.
### Changed
- Minimized developer console noise by demoting informational logs to `debug` level and converting caught non-critical exceptions from `error` to `warn` across the entire codebase.

## [0.7.1-beta] - 2026-06-02
### Fixed
- Resolved an issue where the follower analysis tooltip could become "stuck" and remain visible after the mouse moved away from the link.
- Improved tooltip overflow logic by using dynamic dimensions instead of hardcoded values, ensuring better placement at screen edges.

### Changed
- Refined tooltip targeting: now specifically triggers on post authors, comment authors, and "@-mentions" in post bodies, preventing the overlay from appearing on non-essential account links (like voter lists or sidebars).

## [0.7.0-beta] - 2026-06-01
### Added
- Enhanced follower analysis tooltips: Hovering over any user link now shows total followers, 90-day active count, median reputation, and median reputation of active followers.
- Real-time analysis progress indicator for accounts with large follower lists.
- Persistent cross-tab caching: Statistics are now shared across all open tabs and persist after page reloads using `chrome.storage.local`.
- Support for viewing follower statistics on your own account.
- 24-hour caching for all follow-related data to improve performance and reduce API load.

### Changed
- Replaced native browser tooltips with a custom dynamic HTML overlay to support real-time data updates while hovering.
- Migrated follower data fetching from SDS to the official Steemit API (`condenser_api`).

## [0.6.0-beta] - 2026-05-31
### Added
- Follow status tooltips: Hovering over any user link now shows if they follow the logged-in user.
- 10-minute caching for follow status to optimize performance.

## [0.5.5-beta] - 2026-05-02
### Fixed
- Eliminated duplicate accounts from "feed reach" and "price per feed" calculations using unique account sets and SDS API.
- Fixed data bleed-through issue where post-payout data persisted on repurposed DOM nodes when navigating between feeds.

## [0.5.4-beta] - 2026-04-25

### Changed
- Added steemit.steemapps.com to the manifest.json.

### Fixed
- Runaway memory consumption when editing a preexisting post
- Debounced chart refresh activity when viewing/editing a post
- Possible fix of problem with posts not getting highlighted correctly after certain click sequences(?)

## [0.5.3-beta] - 2026-01-25
- Added voter efficiency graphs and stats in the voter dropdown list of a post.
- Refactored vote-related functions into votes.js file.
- Add footer highlighting inside of posts for burnposts & promoted posts.
- Updated total value display to include beneficiary rewards after payout.
- Changed output to display some text based on language settings.

## [0.5.2-beta] - 2025-10-17
- Updated payout display to include beneficiary payouts
- Added circle display around profile picture representing user current voting power
- Added mutation safeguard to avoid recursive loop from vp display updates to interface

## [0.5.1-beta] - 2025-04-25
### Added

- Promoted post language handling for all locales in condenser (Issue 16)
- Updated chart.js version to version 4.4.9 (https://www.jsdelivr.com/package/npm/chart.js?path=dist)

### Fixed

- Character case typo in file naming that effected non-Windows platforms (Issue 17)

## [0.5.0-beta] - 2025-04-21
### Added

- Workflow checklists
- Preparation for Chrome webstore review & publication

### Changed

- Versioning info

### Fixed

- n/a

## [0.4.0-alpha] - 2025-04-12

### Added
- Individual post metrics: word count, enhanced voter info, resteem list, vote & payout charts

### Changed
- n/a

### Fixed
- Redundant buttons to show/hide resteems

## [20240516] - 2024-05-16

### Added
- Curation info overlay pane triggered on hover over new 'CURATION INFO' link.
- Resteem visibility toggle control in header for feed/blog pages.
- Voting power display in user dropdown menu.

### Changed
- Improved performance of DOM manipulation in `main.js`.

### Fixed
- Corrected calculation for organic value in overlay.
- Ensured resteem dropdown menu appears correctly in dark mode.

## [20240412] - 2024-04-12

### Added
- Initial release.
- Highlighting for promoted posts and posts with @null beneficiaries.
- Fetching promotion data from Steemworld.