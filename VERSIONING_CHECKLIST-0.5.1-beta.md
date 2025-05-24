# Extension Versioning & Release Checklist

This checklist outlines the steps for updating the extension version, changelog, managing checklists, and packaging the extension before submission.

**Branching Strategy:**
*   Release preparation steps (Section I) are performed on your **working/feature branch** *just before* merging.
*   Merging, tagging, and packaging (Section II) are performed on the **main/master branch** *after* the merge.
*   Store submission steps (referenced in Section III) are performed in the **Chrome Web Store Developer Dashboard** *after* packaging, following the separate `SUBMISSION_CHECKLIST.md`.

**Checklist Handling:**
*   This workflow uses the "Copy and Commit" method for Section I. The original template files (`PRE_SUBMISSION_CHECKLIST.md`, `VERSIONING_CHECKLIST.md`) should remain clean in the `main` branch.
*   Section III serves only as a pointer to the submission process guide.

**Note on Self-Reference:** If you choose to commit a versioned copy of this `VERSIONING_CHECKLIST.md` (as per the optional part of Step 7), that committed file will naturally show its own Step 7 (and subsequent steps like 8, 9, etc.) as incomplete (`[ ]`). This is expected. The Git commit for Step 7 and the merge commit for Step 8 serve as the definitive record of their completion. The committed checklist primarily documents the completion of preparatory steps (1-6) and the items staged for the release commit.

---

## I. Release Preparation (Working Branch)

- [X] **1. Decide on the New Version Number**
    - [X] Review changes since the last release (Git history, `CHANGELOG.md`).
    - [X] Determine SemVer increment (`MAJOR.MINOR.PATCH`).

- [X] **2. Prepare Pre-Submission Checklist Copy**
    - [X] Copy `PRE_SUBMISSION_CHECKLIST.md` to `PRE_SUBMISSION_CHECKLIST_vX.Y.Z.md` (using version from Step 1).
        ```bash
        # Example:
        cp PRE_SUBMISSION_CHECKLIST.md PRE_SUBMISSION_CHECKLIST_vX.Y.Z.md
        ```
    - *Note: Ensure original template remains unmodified.*

- [X] **3. Complete Pre-Submission Checklist**
    - [X] Thoroughly review code/assets using the *copied* checklist (`PRE_SUBMISSION_CHECKLIST_vX.Y.Z.md`).
    - [X] Check off items as verified/completed.
    - [X] Address any issues identified *before* proceeding.

- [X] **4. Finalize `CHANGELOG.md`**
    - [X] Change `## [Unreleased]` heading to `## [X.Y.Z] - YYYY-MM-DD`.
    - [X] Ensure all notable changes are listed correctly.
    - [X] Add a new `## [Unreleased]` section at the top.
    - [X] Verify links (if any).

- [X] **5. Update `manifest.json`**
    - [X] Change `"version"` to the new version number (matching `CHANGELOG.md`).

- [X] **6. Update `package.json` (if applicable)**
    - [X] Change `"version"` to match the new version number.

- [SR] **7. Commit Release Preparation**
    - [X] Stage `CHANGELOG.md`, `manifest.json`, `package.json` (if applicable), and the *completed* `PRE_SUBMISSION_CHECKLIST_vX.Y.Z.md`.
    - [X] *Optional:* Copy, complete, and stage this `VERSIONING_CHECKLIST.md` itself (e.g., `VERSIONING_CHECKLIST_vX.Y.Z.md`).
    - [SR] Commit with a clear message (e.g., `chore(release): Prepare release vX.Y.Z`).
        ```bash
        # Example:
        git add CHANGELOG.md manifest.json PRE_SUBMISSION_CHECKLIST_vX.Y.Z.md
        # git add package.json # If applicable
        # git add VERSIONING_CHECKLIST_vX.Y.Z.md # If applicable
        git commit -m "chore(release): Prepare release vX.Y.Z"
        ```

---

## II. Merge, Tag, and Package (Main/Master Branch)

- [SR] **8. Merge to Main/Master Branch**
    - [SR] Merge the completed working branch into `main`/`master`. Resolve conflicts.

- [SR] **9. Tag the Release Commit**
    - [SR] Ensure you are on `main`/`master` and have pulled latest changes.
    - [SR] Create Git tag (e.g., `vX.Y.Z` or `X.Y.Z`) pointing to the merge commit.
        ```bash
        # Example:
        git tag vX.Y.Z
        ```
    - [SR] Push the tag to the remote repository.
        ```bash
        # Example:
        git push origin vX.Y.Z
        # Or push all tags:
        git push origin --tags
        ```

- [SR] **10. Package the Extension**
    - [SR] Ensure you are on the tagged commit (`git checkout vX.Y.Z`).
    - [SR] Create the `.zip` archive containing *only* necessary extension files. **Exclude** `.git`, `node_modules`, test files, *all* checklist files (`*.md`), etc.

---

## III. Chrome Web Store Submission

- [SR] **11. Submit to Chrome Web Store:**
    - [SR] After completing Section II and creating the `.zip` package, follow the steps outlined in the **`SUBMISSION_CHECKLIST.md`** file to upload and submit your extension via the Chrome Web Store Developer Dashboard.