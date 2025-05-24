## I. Core Configuration & Manifest

- [X] **`manifest.json`**:
    - [X] **`manifest_version`:** Confirm it is `3`.
    - [X] **`version`:** Ensure it's updated: 0.5.1.
    - [X] **`name`:** Accurate, non-infringing name: 0.5.1-beta
    - [X] **`description`:** Present, clear, and concise description.
    - [X] **`icons`:** All required icon sizes (16, 32, 48, 128) are present, referenced correctly, and exist as files.
    - [X] **`content_scripts.matches`:** URLs are specific and minimal for required functionality.
    - [X] **`content_scripts.[js|css]`:** Character case in file names matches the actual character case.
    - [X] **`permissions`:** List *only* necessary permissions (e.g., `storage` if `chrome.storage` is used). Justify each in store listing. <!-- Assuming `storage` is used and listed. -->
    - [X] **`host_permissions`:** List *all* external domains the extension fetches data from (e.g., `*://*.steemworld.org/*`). Justify each in store listing.
    - [X] **`action`:** Include if a toolbar button/popup is intended. Ensure `default_popup`, `default_icon`, `default_title` are correct. <!-- Assuming a browser action/popup is used. -->
    - [n/a] **`background`:** Include if a service worker is needed. Ensure `service_worker` path is correct.
    - [n/a] **`options_page` / `options_ui`:** Include if settings page exists. Ensure path is correct.
    - [n/a] **`web_accessible_resources`:** Include *only* if web pages need to access extension resources directly (less common in MV3).

## II. JavaScript Files (`.js`)

- **General Checks (Apply to ALL `.js` files listed below):**
    - [X] **API Calls (`fetch`, `XMLHttpRequest`):** Verify *all* target URLs. Ensure they are either same-origin (relative to `content_scripts.matches`) or listed in `host_permissions`.
    - [X] **`chrome.*` API Usage:** Check for any usage (e.g., `chrome.storage`, `chrome.runtime`, `chrome.scripting`). Ensure corresponding `permissions` are declared in `manifest.json`.
    - [X] **DOM Manipulation Safety:** Review all uses of `innerHTML`, `outerHTML`, `document.write()`. Ensure data inserted is trusted or properly sanitized to prevent XSS. Prefer `textContent`, `createElement` where possible. <!-- Critical: Manual verification of data sources for innerHTML is essential. -->
    - [X] **No Remote Code Execution:** Confirm no fetching and executing of external JavaScript code.
    - [X] **No Forbidden Practices:** Ensure no use of `eval()`, `new Function()`, `setTimeout/setInterval` with string arguments.
    - [X] **Error Handling:** Check for adequate error handling around API calls (`.catch`, `try...catch`) and critical operations.
    - [X] **Privacy:** Confirm no unnecessary collection or transmission of user data (PII or browsing habits). If *any* data is collected/sent externally, a privacy policy is mandatory. <!-- If external data transmission occurs, ensure privacy policy is present and accurate. -->
    - [X] **Code Clarity:** Ensure code is reasonably readable (standard minification is okay, heavy obfuscation is not).

- [X] **`main.js`**:
    - [X] Review core logic, event listeners (`window.addEventListener`, `MutationObserver`), and initialization.
    - [X] Check robustness of DOM selection (`querySelectorAll`) and manipulation (`highLight`).
    - [X] Verify regex patterns (`regexMatch`) are correct and efficient.
    - [X] General checks, as specified above.


- [X] **`useful.js`**:
    - [X] Review utility functions for correctness.
    - [X] General checks, as specified above.

- [X] **`post/author.js`**:
    - [X] Verify logic for fetching/processing author-specific data (`getAuthorPayoutsInWeekBefore`, `getAuthorPostHistory`). Confirm API endpoints used.
    - [X] General checks, as specified above.

- [X] **`graph.js`**:
    - [X] Review Chart.js integration and graph generation logic.
    - [X] Check DOM creation/manipulation for canvas elements.
    - [X] Verify event handling for clickable elements (`onClick`, `handleMouseUp`).
    - [X] General checks, as specified above.

- [X] **`post/loadPostData.js`**:
    - [X] **Critical:** Review `innerHTML` usage in `loadPostVoteData` and `displayPostResteemData`. Ensure data is safe. <!-- Covered by general check; re-emphasize manual data source validation. -->
    - [X] Verify logic for loading and displaying post data, graphs, and vote lists.
    - [X] Confirm implementations and API endpoints for called functions (`Post.create`, `getResteems`, etc.).
    - [X] General checks, as specified above.

- [X] **`botNotifier.js`**:
    - [X] Confirm accuracy of `botList` and `steemitList`.
    - [X] General checks, as specified above.

- [X] **`postMetrics.js`**:
    - [X] Review text stripping and calculation logic (word count, reading time).
    - [X] General checks, as specified above.

- [X] **`overlay.js`**:
    - [X] Review large `innerHTML` block. Ensure all variables are derived from trusted sources or sanitized.
    - [X] Verify implementations and API endpoints for all data fetching functions (`getContent`, `getCommunitySubscribersFromAPI`, `getFollowerCountFromAPI`, `getAccountInfo`, etc.).
    - [X] Review overlay display/hide logic (`showOverlay`, `clearAllOverlays`, event listeners).
    - [X] General checks, as specified above.

- [X] **`resteemControl.js`**:
    - [X] **`localStorage` Usage:** Confirm this is the intended storage mechanism (vs. `chrome.storage`). Understand its limitations. <!-- GEMINI: Usage confirmed; `chrome.storage.local` is generally preferred for extensions. -->
    - [X] Verify `isFollowing` API call logic, caching mechanism, and error handling.
    - [X] Check logic for showing/hiding resteems and the control checkbox.
    - [X] General checks, as specified above.

- [X] **`steemWorld.js`** *(Assumed based on usage)*:
    - [X] **Critical:** Verify *all* API calls target permitted domains (`sds.steemworld.org` or Steemit).
    - [X] Review any data processing logic specific to Steemworld API responses.
    - [X] General checks, as specified above.

- [X] **`post/Post.js`** *(Assumed based on usage)*:
    - [X] **Critical:** Verify API calls made within the `Post` class (e.g., in `Post.create` or methods). Ensure permitted origins/hosts.
    - [X] General checks, as specified above.

## III. Libraries

- [X] **`libs/chart.min.js`**:
    - [X] **License:** Verify license (e.g., MIT) allows redistribution. Include license file in package if required. <!-- Assuming MIT license and inclusion of license file. -->
    - [X] **Security:** Check if this specific version has known vulnerabilities. Consider updating.
       - chart.js updated to 4.4.9 from here: https://www.jsdelivr.com/package/npm/chart.js?path=dist
    - [X] **Source:** Ensure it's a standard, reputable build of the library.

## IV. Stylesheets

- [X] **`styles.css`**:
    - [X] **Layout Impact:** Ensure CSS doesn't break target website layout or usability significantly. <!-- Requires manual testing on target sites (steemit.com, etc.). -->
    - [X] **Deceptive UI:** Ensure CSS doesn't hide essential information or create misleading interface elements.
    - [X] **Specificity:** Ensure selectors are specific enough to avoid unintended styling conflicts.

## V. Assets

- [X] **Image Files (icons, etc.)**:
    - [X] Verify all referenced image files exist in the correct paths.
    - [X] Ensure icons meet Chrome Web Store dimension requirements.
    - [n/a] Optimize images for size where possible.
    - [X] Ensure that character case matches file system case

## VI. Compatibility
    - [X] Test all languages in condenser (where possible)
    - [X] Test startup in linux

## VII. Overall & Store Listing

    - [X] **Single Purpose:** Confirm the extension focuses on its core described functionality.
    - [X] **No Malware/Deception:** Ensure no malicious code, phishing, or deceptive practices.
    - [X] **Thorough Testing:** Test all features across different scenarios and target pages. Test edge cases and error conditions.
