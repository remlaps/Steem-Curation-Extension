# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## [0.5.1-beta] - 2025-04-25]
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