# Chrome Web Store Pre-Submission Checklist

This checklist covers files and areas needing inspection before submitting the Steem Curation Extension to the Chrome Web Store.

---

## I. Core Configuration & Manifest

- [x] **`manifest.json`**:
    - [x] **`manifest_version`:** Confirm it is `3`.
    - [x] **`version`:** Ensure it's updated (consider SemVer `X.Y.Z`).
    - [x] **`name`:** Accurate, non-infringing name.
    - [x] **`description`:** Present, clear, and concise description.
    - [x] **`icons`:** All required icon sizes (16, 32, 48, 128) are present, referenced correctly, and exist as files.
    - [x] **`content_scripts.matches`:** URLs are specific and minimal for required functionality.
    - [x] **`content_scripts.[js|css]`:** Character case in file names matches the actual character case (Test on linux, if possible).
    - [x] **`permissions`:** List *only* necessary permissions (e.g., `storage` if `chrome.storage` is used). Justify each in store listing.
    - [x] **`host_permissions`:** List *all* external domains the extension fetches data from (e.g., `*://*.steemworld.org/*`). Justify each in store listing.
    - [x] **`action`:** Include if a toolbar button/popup is intended. Ensure `default_popup`, `default_icon`, `default_title` are correct.
    - [x] **`background`:** Include if a service worker is needed. Ensure `service_worker` path is correct.
    - [x] **`options_page` / `options_ui`:** Include if settings page exists. Ensure path is correct.
    - [x] **`web_accessible_resources`:** Include *only* if web pages need to access extension resources directly (less common in MV3).

## II. JavaScript Files (`.js`)

- **General Checks (Apply to ALL `.js` files listed below):**
    - [x] **API Calls (`fetch`, `XMLHttpRequest`):** Verify *all* target URLs. Ensure they are either same-origin (relative to `content_scripts.matches`) or listed in `host_permissions`.
    - [x] **`chrome.*` API Usage:** Check for any usage (e.g., `chrome.storage`, `chrome.runtime`, `chrome.scripting`). Ensure corresponding `permissions` are declared in `manifest.json`.
    - [x] **DOM Manipulation Safety:** Review all uses of `innerHTML`, `outerHTML`, `document.write()`. Ensure data inserted is trusted or properly sanitized to prevent XSS. Prefer `textContent`, `createElement` where possible.
    - [x] **No Remote Code Execution:** Confirm no fetching and executing of external JavaScript code.
    - [x] **No Forbidden Practices:** Ensure no use of `eval()`, `new Function()`, `setTimeout/setInterval` with string arguments.
    - [x] **Error Handling:** Check for adequate error handling around API calls (`.catch`, `try...catch`) and critical operations.
    - [x] **Privacy:** Confirm no unnecessary collection or transmission of user data (PII or browsing habits). If *any* data is collected/sent externally, a privacy policy is mandatory.
    - [x] **Code Clarity:** Ensure code is reasonably readable (standard minification is okay, heavy obfuscation is not).

- [x] **`main.js`**:
    - [x] Review core logic, event listeners (`window.addEventListener`, `MutationObserver`), and initialization.
    - [x] Check robustness of DOM selection (`querySelectorAll`) and manipulation (`highLight`).
    - [x] Verify regex patterns (`regexMatch`) are correct and efficient.
    - [x] General checks, as specified above.


- [x] **`useful.js`**:
    - [x] Review utility functions for correctness.
    - [x] General checks, as specified above.

- [x] **`post/author.js`**:
    - [x] Verify logic for fetching/processing author-specific data (`getAuthorPayoutsInWeekBefore`, `getAuthorPostHistory`). Confirm API endpoints used.
    - [x] General checks, as specified above.

- [x] **`graph.js`**:
    - [x] Review Chart.js integration and graph generation logic.
    - [x] Check DOM creation/manipulation for canvas elements.
    - [x] Verify event handling for clickable elements (`onClick`, `handleMouseUp`).
    - [x] General checks, as specified above.

- [x] **`post/loadPostData.js`**:
    - [x] **Critical:** Review `innerHTML` usage in `loadPostVoteData` and `displayPostResteemData`. Ensure data is safe.
    - [x] Verify logic for loading and displaying post data, graphs, and vote lists.
    - [x] Confirm implementations and API endpoints for called functions (`Post.create`, `getResteems`, etc.).
    - [x] General checks, as specified above.

- [x] **`botNotifier.js`**:
    - [x] Confirm accuracy of `botList` and `steemitList`.
    - [x] General checks, as specified above.

- [x] **`postMetrics.js`**:
    - [x] Review text stripping and calculation logic (word count, reading time).
    - [x] General checks, as specified above.

- [x] **`overlay.js`**:
    - [x] **Critical:** Review large `innerHTML` block. Ensure all variables are derived from trusted sources or sanitized.
    - [x] Verify implementations and API endpoints for all data fetching functions (`getContent`, `getCommunitySubscribersFromAPI`, `getFollowerCountFromAPI`, `getAccountInfo`, etc.).
    - [x] Review overlay display/hide logic (`showOverlay`, `clearAllOverlays`, event listeners).
    - [x] General checks, as specified above.

- [x] **`resteemControl.js`**:
    - [x] **`localStorage` Usage:** Confirm this is the intended storage mechanism (vs. `chrome.storage`). Understand its limitations.
    - [x] Verify `isFollowing` API call logic, caching mechanism, and error handling.
    - [x] Check logic for showing/hiding resteems and the control checkbox.
    - [x] General checks, as specified above.

- [x] **`steemWorld.js`** *(Assumed based on usage)*:
    - [x] **Critical:** Verify *all* API calls target permitted domains (`sds.steemworld.org` or Steemit).
    - [x] Review any data processing logic specific to Steemworld API responses.
    - [x] General checks, as specified above.

- [x] **`post/Post.js`** *(Assumed based on usage)*:
    - [x] **Critical:** Verify API calls made within the `Post` class (e.g., in `Post.create` or methods). Ensure permitted origins/hosts.
    - [x] General checks, as specified above.

## III. Libraries

- [x] **`libs/chart.min.js`**:
    - [x] **License:** Verify license (e.g., MIT) allows redistribution. Include license file in package if required.
    - [x] **Security:** Check if this specific version has known vulnerabilities. Consider updating.
    - [x] **Source:** Ensure it's a standard, reputable build of the library.

## IV. Stylesheets

- [x] **`styles.css`**:
    - [x] **Layout Impact:** Ensure CSS doesn't break target website layout or usability significantly.
    - [x] **Deceptive UI:** Ensure CSS doesn't hide essential information or create misleading interface elements.
    - [x] **Specificity:** Ensure selectors are specific enough to avoid unintended styling conflicts.

## V. Assets

- [x] **Image Files (icons, etc.)**:
    - [x] Verify all referenced image files exist in the correct paths.
    - [x] Ensure icons meet Chrome Web Store dimension requirements.
    - [x] Optimize images for size where possible.
    - [x] Ensure that character case matches file system case

## VI. Compatibility
    - [x] Test all languages in condenser (where possible)
    - [n/a] Test startup in linux

## VII. Overall & Store Listing

- [x] **Single Purpose:** Confirm the extension focuses on its core described functionality.
- [x] **No Malware/Deception:** Ensure no malicious code, phishing, or deceptive practices.
- [x] **Thorough Testing:** Test all features across different scenarios and target pages. Test edge cases and error conditions.