# Chrome Web Store Pre-Submission Checklist

This checklist covers files and areas needing inspection before submitting the Steem Curation Extension to the Chrome Web Store.

---

## I. Core Configuration & Manifest

- [ ] **`manifest.json`**:
    - [X] **`manifest_version`:** Confirm it is `3`.
    - [X] **`version`:** Ensure it's updated (consider SemVer `X.Y.Z`).
    - [X] **`name`:** Accurate, non-infringing name.
    - [X] **`description`:** Present, clear, and concise description.
    - [X] **`icons`:** All required icon sizes (16, 32, 48, 128) are present, referenced correctly, and exist as files.
    - [X] **`content_scripts.matches`:** URLs are specific and minimal for required functionality.
    - [X] **`permissions`:** List *only* necessary permissions (e.g., `storage` if `chrome.storage` is used). Justify each in store listing.
    - [X] **`host_permissions`:** List *all* external domains the extension fetches data from (e.g., `*://*.steemworld.org/*`). Justify each in store listing.
    - [n/a] **`action`:** Include if a toolbar button/popup is intended. Ensure `default_popup`, `default_icon`, `default_title` are correct.
    - [n/a] **`background`:** Include if a service worker is needed. Ensure `service_worker` path is correct.
    - [n/a] **`options_page` / `options_ui`:** Include if settings page exists. Ensure path is correct.
    - [n/a] **`web_accessible_resources`:** Include *only* if web pages need to access extension resources directly (less common in MV3).

## II. JavaScript Files (`.js`)

- **General Checks (Apply to ALL `.js` files listed below):**
    - [X] **API Calls (`fetch`, `XMLHttpRequest`):** Verify *all* target URLs. Ensure they are either same-origin (relative to `content_scripts.matches`) or listed in `host_permissions`.
    - [X] **`chrome.*` API Usage:** Check for any usage (e.g., `chrome.storage`, `chrome.runtime`, `chrome.scripting`). Ensure corresponding `permissions` are declared in `manifest.json`.
    - [X] **DOM Manipulation Safety:** Review all uses of `innerHTML`, `outerHTML`, `document.write()`. Ensure data inserted is trusted or properly sanitized to prevent XSS. Prefer `textContent`, `createElement` where possible.
    - [X] **No Remote Code Execution:** Confirm no fetching and executing of external JavaScript code.
    - [X] **No Forbidden Practices:** Ensure no use of `eval()`, `new Function()`, `setTimeout/setInterval` with string arguments.
    - [X] **Error Handling:** Check for adequate error handling around API calls (`.catch`, `try...catch`) and critical operations.
    - [X] **Privacy:** Confirm no unnecessary collection or transmission of user data (PII or browsing habits). If *any* data is collected/sent externally, a privacy policy is mandatory.
    - [X] **Code Clarity:** Ensure code is reasonably readable (standard minification is okay, heavy obfuscation is not).
    - [X] **Required permissions** Ensure that required permissions, host_permissions, background, and action parameters are in manifest.json.

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

- [X] **`graph.js`**: (Verified by Gemini)
    - [X] Review Chart.js integration and graph generation logic.
    - [X] Check DOM creation/manipulation for canvas elements.
    - [X] Verify event handling for clickable elements (`onClick`, `handleMouseUp`).
    - [X] General checks, as specified above.

- [X] **`post/loadPostData.js`**:
    - [X] **Critical:** Review `innerHTML` usage in `loadPostVoteData` and `displayPostResteemData`. Ensure data is safe.
    - [X] Verify logic for loading and displaying post data, graphs, and vote lists.
    - [X] Confirm implementations and API endpoints for called functions (`Post.create`, `getResteems`, etc.).
    - [X] General checks, as specified above.

- [X] **`botNotifier.js`**:
    - [X] Confirm accuracy of `botList` and `steemitList`.
    - [X] General checks, as specified above. (checked by Gemini)

- [X] **`postMetrics.js`**: (Verified by Gemini)
    - [X] Review text stripping and calculation logic (word count, reading time).
    - [X] General checks, as specified above.

- [X] **`overlay.js`**: (reviewed by Gemini)
    - [X] **Critical:** Review large `innerHTML` block. Ensure all variables are derived from trusted sources or sanitized.
    - [X] Verify implementations and API endpoints for all data fetching functions (`getContent`, `getCommunitySubscribersFromAPI`, `getFollowerCountFromAPI`, `getAccountInfo`, etc.).
    - [X] Review overlay display/hide logic (`showOverlay`, `clearAllOverlays`, event listeners).
    - [X] General checks, as specified above.

- [ ] **`resteemControl.js`**: (Verified by Gemini)
    - [X] **`localStorage` Usage:** Confirm this is the intended storage mechanism (vs. `chrome.storage`). Understand its limitations.
    - [X] Verify `isFollowing` API call logic, caching mechanism, and error handling.
    - [X] Check logic for showing/hiding resteems and the control checkbox.
    - [X] General checks, as specified above.

- [X] **`steemworld.js`** *(Assumed based on usage)*:
    - [X] **Critical:** Verify *all* API calls target permitted domains (`sds.steemworld.org` or Steemit).
    - [X] Review any data processing logic specific to Steemworld API responses.
    - [X] General checks, as specified above. (Verified by Gemini)

- [X] **`post/Post.js`** *(Assumed based on usage)*: (Verified by Gemini)
    - [X] **Critical:** Verify API calls made within the `Post` class (e.g., in `Post.create` or methods). Ensure permitted origins/hosts.
    - [X] General checks, as specified above.

## III. Libraries

- [X] **`libs/chart.min.js`**:
    - [X] **License:** Verify license (e.g., MIT) allows redistribution. Include license file in package if required.
    - [X] **Security:** Check if this specific version has known vulnerabilities. Consider updating.
    - [X] **Source:** Ensure it's a standard, reputable build of the library.

## IV. Stylesheets

- [ X **`styles.css`**:
    - [X] **Layout Impact:** Ensure CSS doesn't break target website layout or usability significantly.
    - [X] **Deceptive UI:** Ensure CSS doesn't hide essential information or create misleading interface elements.
    - [X]] **Specificity:** Ensure selectors are specific enough to avoid unintended styling conflicts.

## V. Assets

- [X] **Image Files (icons, etc.)**: (Created by Gemini)
    - [X] Verify all referenced image files exist in the correct paths.
    - [X] Ensure icons meet Chrome Web Store dimension requirements.
    - [n/a] Optimize images for size where possible.

## VI. Overall & Store Listing

- [X] **Single Purpose:** Confirm the extension focuses on its core described functionality.
- [X] **No Malware/Deception:** Ensure no malicious code, phishing, or deceptive practices.
- [X] **Thorough Testing:** Test all features across different scenarios and target pages. Test edge cases and error conditions.
- [n/a] **Privacy Policy (if applicable):** If *any* user data is collected or transmitted, ensure a clear privacy policy is hosted and linked in the store listing.