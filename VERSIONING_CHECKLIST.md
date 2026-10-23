# Extension Versioning & Release Checklist

This checklist outlines the steps for updating the extension version, changelog, managing checklists, and packaging the extension before submission.

**Branching Strategy:**
*   Release preparation steps (Section I) are performed on your **working/feature branch** *just before* merging.
*   Merging, tagging, and packaging (Section II) are performed on the **main/master branch** *after* the merge.
*   Store submission steps (referenced in Section III) are performed in the **Chrome Web Store Developer Dashboard** *after* packaging, following the separate `SUBMISSION_CHECKLIST.md`.

**Checklist Handling:**
*   Versioned checklist copies live in the `checklists/` directory, which is listed in `.gitignore`. They are **local working documents** and are *not* committed; the release-preparation commit and the merge commit are the authoritative record that a release was prepared.
*   The original template files (`PRE_SUBMISSION_CHECKLIST.md`, `VERSIONING_CHECKLIST.md`, `SUBMISSION_CHECKLIST.md`) stay clean in the `main` branch.
*   Versioned copies are named `<TEMPLATE_NAME>-<version>.md`, where `<version>` matches the git tag without its leading `v` (e.g. `PRE_SUBMISSION_CHECKLIST-0.9.0-beta.md`).
*   Section III serves only as a pointer to the submission process guide.

---

## I. Release Preparation (Working Branch)

- [ ] **1. Decide on the New Version Number**
    - [ ] Review changes since the last release (Git history, `CHANGELOG.md`).
    - [ ] Determine SemVer increment (`MAJOR.MINOR.PATCH`).

- [ ] **2. Prepare Pre-Submission Checklist Copy**
    - [ ] Copy `PRE_SUBMISSION_CHECKLIST.md` into the (gitignored) `checklists/` directory as `PRE_SUBMISSION_CHECKLIST-<version>.md`, using the version from Step 1.
        ```bash
        # Example (version = tag without the leading "v"):
        cp PRE_SUBMISSION_CHECKLIST.md checklists/PRE_SUBMISSION_CHECKLIST-0.9.0-beta.md
        ```
    - *Note: The original template must remain unmodified. The copy lives under `checklists/`, which is gitignored, so it stays local.*

- [ ] **3. Complete Pre-Submission Checklist**
    - [ ] Thoroughly review code/assets using the *copied* checklist (`checklists/PRE_SUBMISSION_CHECKLIST-<version>.md`).
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
    - [ ] Stage `CHANGELOG.md`, `manifest.json`, and `package.json` (if applicable). Do **not** stage the versioned checklists — they live in the gitignored `checklists/` directory and are not committed.
    - [ ] *Optional:* Copy and complete this `VERSIONING_CHECKLIST.md` itself as `checklists/VERSIONING_CHECKLIST-<version>.md` (local only; not committed).
    - [ ] Commit with a clear message (e.g., `chore(release): Prepare release vX.Y.Z`).
        ```bash
        # Example:
        git add CHANGELOG.md manifest.json
        # git add package.json # If applicable
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
    - [ ] Create the `.zip` archive containing *only* necessary extension files. **Exclude** `.git`, `node_modules`, the `checklists/` directory, all Markdown files (`*.md`), etc.
        ```bash
        # Example (PowerShell): packages exactly the files declared in manifest.json
        powershell -ExecutionPolicy Bypass -File scripts/package.ps1
        ```

- [ ] **11. Create the GitHub Release**
    - [ ] Open the "new release" page for the tag. (Pushing a tag does **not** create a Release — GitHub only lists tags under the **Tags** tab.)
        ```text
        https://github.com/<owner>/<repo>/releases/new?tag=vX.Y.Z
        ```
    - [ ] Set the title (e.g., `vX.Y.Z: <summary>`) and the release notes (paste the finalized `CHANGELOG.md` section for this version, or use GitHub's "Generate release notes").
    - [ ] Attach the packaged `.zip` from Step 10 as a release asset.
    - [ ] Publish the release, then confirm it appears on the repository's **Releases** page as the latest release.

---

## III. Chrome Web Store Submission

- [ ] **12. Submit to Chrome Web Store:**
    - [ ] After completing Section II and creating the `.zip` package, follow the steps outlined in the **`SUBMISSION_CHECKLIST.md`** file to upload and submit your extension via the Chrome Web Store Developer Dashboard.