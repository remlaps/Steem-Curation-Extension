# Chrome Web Store Submission Checklist

This checklist outlines the steps performed in the Chrome Web Store Developer Dashboard *after* the final extension `.zip` package has been created (following the `VERSIONING_CHECKLIST.md`).

**Prerequisite:** You have successfully created the final `.zip` package for the release version from the tagged commit on your main/master branch.

Prepared store-listing copy lives in `STORE_LISTING.md` and the privacy policy text lives in `PRIVACY_POLICY.md`; paste from those files rather than retyping.

---

- [ ] **1. Upload New Package:**
    - [ ] Navigate to your extension in the Chrome Web Store Developer Dashboard.
    - [ ] Go to the "Package" section.
    - [ ] Upload the newly created `.zip` file.
    - [ ] Wait for the upload and initial processing to complete. Verify the correct version number is displayed.

- [ ] **2. Update Store Listing Details:**
    - [ ] Go to the "Store listing" section.
    - [ ] **Description / short description:** Paste the prepared copy from `STORE_LISTING.md` (sections 1 and 2).
    - [ ] **Icons:** Upload the required store icons (if not already present or needing update).
    - [ ] **Screenshots / Video:** Upload high-quality screenshots and/or a promotional video demonstrating current functionality.
    - [ ] **Promotional Tile (Optional):** Upload if using this feature.
    - [ ] **Category:** Confirm the selected category is still appropriate.
    - [ ] **Website (Optional):** Add or verify the link to the extension's website or repository (e.g., GitHub).
    - [ ] **Contact Email:** Ensure a valid contact email is provided.

- [ ] **3. Configure Privacy Practices:**
    - [ ] Go to the "Privacy practices" section.
    - [ ] **Single Purpose:** Paste the justification from `STORE_LISTING.md` (section 3).
    - [ ] **Permission Justifications:** For *each* permission listed (pulled from your uploaded manifest), paste the prepared justification from `STORE_LISTING.md` (section 4).
    - [ ] **Data Usage:** Paste the declarations from `STORE_LISTING.md` (section 5).
    - [ ] **Privacy Policy:** Policy text is maintained in `PRIVACY_POLICY.md`; provide a URL only if the dashboard requires one for the declared data usage.

- [ ] **4. Distribution Settings (Review):**
    - [ ] Go to the "Distribution" section.
    - [ ] Review visibility settings (Public/Private/Unlisted).
    - [ ] Review geographic distribution settings.
    - [ ] Confirm pricing (should be "Free").

- [ ] **5. Save and Submit for Review:**
    - [ ] Save all changes made in the dashboard sections.
    - [ ] Click the "Submit for review" button.

- [ ] **6. Monitor Review Status:**
    - [ ] Keep an eye on your email and the Developer Dashboard for updates on the review status (approval, rejection, or requests for more information).