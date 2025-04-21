# Chrome Web Store Submission Checklist

This checklist outlines the steps performed in the Chrome Web Store Developer Dashboard *after* the final extension `.zip` package has been created (following the `VERSIONING_CHECKLIST.md`).

**Prerequisite:** You have successfully created the final `.zip` package for the release version from the tagged commit on your main/master branch.

---

- [ ] **1. Upload New Package:**
    - [ ] Navigate to your extension in the Chrome Web Store Developer Dashboard.
    - [ ] Go to the "Package" section.
    - [ ] Upload the newly created `.zip` file.
    - [ ] Wait for the upload and initial processing to complete. Verify the correct version number is displayed.

- [ ] **2. Update Store Listing Details:**
    - [ ] Go to the "Store listing" section.
    - [ ] **Description:** Ensure the description accurately reflects the current version's features. (Text likely prepared during pre-submission checks).
    - [ ] **Icons:** Upload the required store icons (if not already present or needing update). (Icons created during pre-submission checks).
    - [ ] **Screenshots / Video:** Upload high-quality screenshots and/or a promotional video demonstrating current functionality. (Assets likely prepared during pre-submission checks).
    - [ ] **Promotional Tile (Optional):** Upload if using this feature. (Asset likely prepared during pre-submission checks).
    - [ ] **Category:** Confirm the selected category is still appropriate.
    - [ ] **Website (Optional):** Add or verify the link to the extension's website or repository (e.g., GitHub).
    - [ ] **Contact Email:** Ensure a valid contact email is provided.

- [ ] **3. Configure Privacy Practices:**
    - [ ] Go to the "Privacy practices" section.
    - [ ] **Single Purpose:** Confirm adherence and provide justification if needed.
    - [ ] **Permission Justifications:** For *each* permission listed (pulled from your uploaded manifest):
        - [ ] Write a clear, concise, and user-understandable justification explaining *why* the extension needs this specific permission to function. (Text likely prepared during pre-submission checks).
    - [ ] **Data Usage:** Accurately declare if and how you collect user data (even anonymized data or data sent to required APIs like Steemworld).
    - [ ] **Privacy Policy URL:** If collecting *any* user data, provide a valid link to your hosted privacy policy. (Policy hosted and URL ready from pre-submission checks).

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