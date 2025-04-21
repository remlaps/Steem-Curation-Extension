# Chrome Web Store Pre-Submission Checklist

This checklist covers files and areas needing inspection before submitting the Steem Curation Extension to the Chrome Web Store.

---

## I. Core Configuration & Manifest

- [ ] **`manifest.json`**:
    - [ ] **`manifest_version`:** Confirm it is `3`.
    - [ ] **`version`:** Ensure it's updated (consider SemVer `X.Y.Z`).
    - [ ] **`name`:** Accurate, non-infringing name.
    - [ ] **`description`:** Present, clear, and concise description.
    - [ ] **`icons`:** All required icon sizes (16, 32, 48, 128) are present, referenced correctly, and exist as files.
    - [ ] **`content_scripts.matches`:** URLs are specific and minimal for required functionality.
    - [ ] **`permissions`:** List *only* necessary permissions (e.g., `storage` if `chrome.storage` is used). Justify each in store listing.
    - [ ] **`host_permissions`:** List *all* external domains the extension fetches data from (e.g., `*://*.steemworld.org/*`). Justify each in store listing.
    - [ ] **`action`:** Include if a toolbar button/popup is intended. Ensure `default_popup`, `default_icon`, `default_title` are correct.
    - [ ] **`background`:** Include if a service worker is needed. Ensure `service_worker` path is correct.
    - [ ] **`options_page` / `options_ui`:** Include if settings page exists. Ensure path is correct.
    - [ ] **`web_accessible_resources`:** Include *only* if web pages need to access extension resources directly (less common in MV3).

## II. JavaScript Files (`.js`)

- **General Checks (Apply to ALL `.js` files listed below):**
    - [ ] **API Calls (`fetch`, `XMLHttpRequest`):** Verify *all* target URLs. Ensure they are either same-origin (relative to `content_scripts.matches`) or listed in `host_permissions`.
    - [ ] **`chrome.*` API Usage:** Check for any usage (e.g., `chrome.storage`, `chrome.runtime`, `chrome.scripting`). Ensure corresponding `permissions` are declared in `manifest.json`.
    - [ ] **DOM Manipulation Safety:** Review all uses of `innerHTML`, `outerHTML`, `document.write()`. Ensure data inserted is trusted or properly sanitized to prevent XSS. Prefer `textContent`, `createElement` where possible.
    - [ ] **No Remote Code Execution:** Confirm no fetching and executing of external JavaScript code.
    - [ ] **No Forbidden Practices:** Ensure no use of `eval()`, `new Function()`, `setTimeout/setInterval` with string arguments.
    - [ ] **Error Handling:** Check for adequate error handling around API calls (`.catch`, `try...catch`) and critical operations.
    - [ ] **Privacy:** Confirm no unnecessary collection or transmission of user data (PII or browsing habits). If *any* data is collected/sent externally, a privacy policy is mandatory.
    - [ ] **Code Clarity:** Ensure code is reasonably readable (standard minification is okay, heavy obfuscation is not).

- [ ] **`main.js`**:
    - [ ] Review core logic, event listeners (`window.addEventListener`, `MutationObserver`), and initialization.
    - [ ] Check robustness of DOM selection (`querySelectorAll`) and manipulation (`highLight`).
    - [ ] Verify regex patterns (`regexMatch`) are correct and efficient.
    - [ ] General checks, as specified above.


- [ ] **`useful.js`**:
    - [ ] Review utility functions for correctness.
    - [ ] General checks, as specified above.

- [ ] **`post/author.js`**:
    - [ ] Verify logic for fetching/processing author-specific data (`getAuthorPayoutsInWeekBefore`, `getAuthorPostHistory`). Confirm API endpoints used.
    - [ ] General checks, as specified above.

- [ ] **`graph.js`**:
    - [ ] Review Chart.js integration and graph generation logic.
    - [ ] Check DOM creation/manipulation for canvas elements.
    - [ ] Verify event handling for clickable elements (`onClick`, `handleMouseUp`).
    - [ ] General checks, as specified above.

- [ ] **`post/loadPostData.js`**:
    - [ ] **Critical:** Review `innerHTML` usage in `loadPostVoteData` and `displayPostResteemData`. Ensure data is safe.
    - [ ] Verify logic for loading and displaying post data, graphs, and vote lists.
    - [ ] Confirm implementations and API endpoints for called functions (`Post.create`, `getResteems`, etc.).
    - [ ] General checks, as specified above.

- [ ] **`botNotifier.js`**:
    - [ ] Confirm accuracy of `botList` and `steemitList`.
    - [ ] General checks, as specified above.

- [ ] **`postMetrics.js`**:
    - [ ] Review text stripping and calculation logic (word count, reading time).
    - [ ] General checks, as specified above.

- [ ] **`overlay.js`**:
    - [ ] **Critical:** Review large `innerHTML` block. Ensure all variables are derived from trusted sources or sanitized.
    - [ ] Verify implementations and API endpoints for all data fetching functions (`getContent`, `getCommunitySubscribersFromAPI`, `getFollowerCountFromAPI`, `getAccountInfo`, etc.).
    - [ ] Review overlay display/hide logic (`showOverlay`, `clearAllOverlays`, event listeners).
    - [ ] General checks, as specified above.

- [ ] **`resteemControl.js`**:
    - [ ] **`localStorage` Usage:** Confirm this is the intended storage mechanism (vs. `chrome.storage`). Understand its limitations.
    - [ ] Verify `isFollowing` API call logic, caching mechanism, and error handling.
    - [ ] Check logic for showing/hiding resteems and the control checkbox.
    - [ ] General checks, as specified above.

- [ ] **`steemworld.js`** *(Assumed based on usage)*:
    - [ ] **Critical:** Verify *all* API calls target permitted domains (`sds.steemworld.org` or Steemit).
    - [ ] Review any data processing logic specific to Steemworld API responses.
    - [ ] General checks, as specified above.

- [ ] **`post/Post.js`** *(Assumed based on usage)*:
    - [ ] **Critical:** Verify API calls made within the `Post` class (e.g., in `Post.create` or methods). Ensure permitted origins/hosts.
    - [ ] General checks, as specified above.

## III. Libraries

- [ ] **`libs/chart.min.js`**:
    - [ ] **License:** Verify license (e.g., MIT) allows redistribution. Include license file in package if required.
    - [ ] **Security:** Check if this specific version has known vulnerabilities. Consider updating.
    - [ ] **Source:** Ensure it's a standard, reputable build of the library.

## IV. Stylesheets

- [ ] **`styles.css`**:
    - [ ] **Layout Impact:** Ensure CSS doesn't break target website layout or usability significantly.
    - [ ] **Deceptive UI:** Ensure CSS doesn't hide essential information or create misleading interface elements.
    - [ ] **Specificity:** Ensure selectors are specific enough to avoid unintended styling conflicts.

## V. Assets

- [ ] **Image Files (icons, etc.)**:
    - [ ] Verify all referenced image files exist in the correct paths.
    - [ ] Ensure icons meet Chrome Web Store dimension requirements.
    - [ ] Optimize images for size where possible.

## VI. Overall & Store Listing

- [ ] **Single Purpose:** Confirm the extension focuses on its core described functionality.
- [ ] **No Malware/Deception:** Ensure no malicious code, phishing, or deceptive practices.
- [ ] **Thorough Testing:** Test all features across different scenarios and target pages. Test edge cases and error conditions.