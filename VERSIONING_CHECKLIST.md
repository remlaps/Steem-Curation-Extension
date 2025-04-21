# Extension Versioning & Release Checklist

This checklist outlines the steps for updating the extension version, changelog, managing checklists, and packaging the extension before submission.

**Branching Strategy:**
*   Release preparation steps (Section I) are performed on your **working/feature branch** *just before* merging.
*   Merging, tagging, and packaging (Section II) are performed on the **main/master branch** *after* the merge.
*   Store submission steps (referenced in Section III) are performed in the **Chrome Web Store Developer Dashboard** *after* packaging, following the separate `SUBMISSION_CHECKLIST.md`.

**Checklist Handling:**
*   This workflow uses the "Copy and Commit" method for Section I. The original template files (`PRE_SUBMISSION_CHECKLIST.md`, `VERSIONING_CHECKLIST.md`) should remain clean in the `main` branch.
*   Section III serves only as a pointer to the submission process guide.

---

## I. Release Preparation (Working Branch)

- [ ] **1. Decide on the New Version Number**
    - [ ] Review changes since the last release (Git history, `CHANGELOG.md`).
    - [ ] Determine SemVer increment (`MAJOR.MINOR.PATCH`).
    - *Note: Strongly consider using SemVer (`X.Y.Z`) instead of date format.*

- [ ] **2. Prepare Pre-Submission Checklist Copy**
    - [ ] Copy `PRE_SUBMISSION_CHECKLIST.md` to `PRE_SUBMISSION_CHECKLIST_vX.Y.Z.md` (using version from Step 1).
        ```bash
        # Example:
        cp PRE_SUBMISSION_CHECKLIST.md PRE_SUBMISSION_CHECKLIST_vX.Y.Z.md
        ```
    - *Note: Ensure original template remains unmodified.*

- [ ] **3. Complete Pre-Submission Checklist**
    - [ ] Thoroughly review code/assets using the *copied* checklist (`PRE_SUBMISSION_CHECKLIST_vX.Y.Z.md`).
    - [ ] Check off items as verified/completed.
    - [ ] Address any issues identified *before* proceeding.

- [ ] **4. Finalize `CHANGELOG.md`**
    - [ ] Change `## [Unreleased]` heading to `## [X.Y.Z] - YYYY-MM-DD`.
    - [ ] Ensure all notable changes are listed correctly.
    - [ ] Add a new `## [Unreleased]` section at the top.
    - [ ] Verify links (if any).

- [ ] **5. Update `manifest.json`**
    - [ ] Change `"version"` to the new version number (matching `CHANGELOG.md`).

- [ ] **6. Update `package.json` (if applicable)**
    - [ ] Change `"version"` to match the new version number.

- [ ] **7. Commit Release Preparation**
    - [ ] Stage `CHANGELOG.md`, `manifest.json`, `package.json` (if applicable), and the *completed* `PRE_SUBMISSION_CHECKLIST_vX.Y.Z.md`.
    - [ ] *Optional:* Copy, complete, and stage this `VERSIONING_CHECKLIST.md` itself (e.g., `VERSIONING_CHECKLIST_vX.Y.Z.md`).
    - [ ] Commit with a clear message (e.g., `chore(release): Prepare release vX.Y.Z`).
        ```bash
        # Example:
        git add CHANGELOG.md manifest.json PRE_SUBMISSION_CHECKLIST_vX.Y.Z.md
        # git add package.json # If applicable
        # git add VERSIONING_CHECKLIST_vX.Y.Z.md # If applicable
        git commit -m "chore(release): Prepare release vX.Y.Z"
        ```

---

## II. Merge, Tag, and Package (Main/Master Branch)

- [ ] **8. Merge to Main/Master Branch**
    - [ ] Merge the completed working branch into `main`/`master`. Resolve conflicts.

- [ ] **9. Tag the Release Commit**
    - [ ] Ensure you are on `main`/`master` and have pulled latest changes.
    - [ ] Create Git tag (e.g., `vX.Y.Z` or `X.Y.Z`) pointing to the merge commit.
        ```bash
        # Example:
        git tag vX.Y.Z
        ```
    - [ ] Push the tag to the remote repository.
        ```bash
        # Example:
        git push origin vX.Y.Z
        # Or push all tags:
        git push origin --tags
        ```

- [ ] **10. Package the Extension**
    - [ ] Ensure you are on the tagged commit (`git checkout vX.Y.Z`).
    - [ ] Create the `.zip` archive containing *only* necessary extension files. **Exclude** `.git`, `node_modules`, test files, *all* checklist files (`*.md`), etc.

---

## III. Chrome Web Store Submission

- [ ] **11. Submit to Chrome Web Store:**
    - [ ] After completing Section II and creating the `.zip` package, follow the steps outlined in the **`SUBMISSION_CHECKLIST.md`** file to upload and submit your extension via the Chrome Web Store Developer Dashboard.

