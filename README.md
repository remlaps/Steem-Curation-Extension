# Steem Curation Extension

This browser extension enhances the experience on condenser-based web sites by providing post highlighting and other information to help the curator decide where to spend their time, attention, and voting power.

Specifically, it highlights posts that are promoted by burning Steem Dollars (SBD) or those that burn STEEM, SBD, and SP beneficiary rewards by directing them to the @null account.  The extension also lets the curator control the visibility of resteemed posts in any Steem account's feed and blog pages, and it provides a collection of other information that can help with reader and curator decisions about where to spend attention and voting power.

## Features

- Highlights posts that were promoted by burning SBD tokens.
- Highlights posts that have beneficiary rewards set to direct rewards to the @null account.
- Color gradients in the highlighting help to identify promotion costs and beneficiary settings at a glance.
- Enables toggling of resteem visibility
- Displays voting power in the Profile menu
- Provides a curator overlay in Steem feeds with information about a post, author, and the author's follower network.
- Provides additional detailed information and visuals inside the Steem post page
- Works on Steemit.com and other Steem-based sites using the Condenser front end.

This functionality helps web site visitors to identify posts that may have received artificial promotion or where rewards are being deliberately burned.

## Currently Supported Sites
- `https://steemit.com/*`
- `https://steemitdev.com/*`
- `https://steemit.steemnet.org/*`
- `https://steemit.moecki.online/*`

## Installation Instructions

### Prerequisites

- A compatible browser (Brave, Chrome, or Edge).

### Installing from the Chrome Web Store

- Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/edkgjcmgiagpagmikifiecjgglccmome) and install it from there.

### Installing from the GitHub Repository

#### Additional Prerequisite

- The ability to enable Developer Mode in your browser.

#### Downloading the Extension

1. Visit the [GitHub repository](https://github.com/remlaps/Steem-Curation-Extension).
2. Click on the green "Code" button and select "Download ZIP".
3. Extract the downloaded ZIP file to a location on your computer.

#### Installing in Brave, Chrome, and Edge Browsers

##### Brave Browser

1. **Open the Extensions Page:**
   - Navigate to `brave://extensions/`
   - Or, click on the menu (three horizontal lines) in the top-right corner, go to "Settings", then "Extensions".

2. **Enable Developer Mode:**
   - Toggle the switch in the top-right corner to enable Developer Mode.

3. **Load the Extension:**
   - Click on the "Load unpacked" button and select the main extension folder (e.g., Steem-Curation-Extension-main) that was created when you extracted the ZIP file..
   - Alternatively, you can drag and drop the extracted folder onto the `brave://extensions/` page.

4. **Disable Developer Mode:**
   - After installing, you can disable Developer Mode by toggling the switch off.

##### Chrome Browser

1. **Open the Extensions Page:**
   - Navigate to `chrome://extensions/`
   - Or, click on the menu (three vertical dots) in the top-right corner, go to "More tools", then "Extensions".

2. **Enable Developer Mode:**
   - Toggle the switch in the top-right corner to enable Developer Mode.

3. **Load the Extension:**
   - Click on the "Load unpacked" button and select the main extension folder (e.g., Steem-Curation-Extension-main) that was created when you extracted the ZIP file.
   - Alternatively, you can drag and drop the extracted folder onto the `chrome://extensions/` page.

4. **Disable Developer Mode:**
   - After installing, you can disable Developer Mode by toggling the switch off.

##### Edge Browser

1. **Open the Extensions Page:**
   - Navigate to `edge://extensions/`
   - Or, click on the menu (three horizontal dots) in the top-right corner, go to "Extensions", then click on "Manage extensions".

2. **Enable Developer Mode:**
   - Toggle the switch in the bottom-left corner to enable Developer Mode.

3. **Load the Extension:**
   - Click on the "Load unpacked" button and select the main extension folder (e.g., Steem-Curation-Extension-main) that was created when you extracted the ZIP file.
   - Alternatively, you can drag and drop the extracted folder onto the `edge://extensions/` page.

4. **Disable Developer Mode:**
   - After installing, you can disable Developer Mode by toggling the switch off.

**Note:** Installing extensions in developer mode might come with security risks. Only proceed if you trust the source of the code (i.e., this repository). Disabling developer mode after installation is recommended for improved security.

## Usage

Once installed, the extension will automatically highlight the relevant posts on Steem-based websites that you visit. No further configuration is needed.

- Look for the toggle option near the top/center-left of the page to control resteem visibility.
- Your available voting power will appear in the profile dropdown menu near the top-right of the page.
- Hover over the "Curation Info" label in feeds to see the curator overlay.

## Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request. For major changes, please open an issue to discuss what you would like to change.

## Contact

For any questions or suggestions, feel free to open an issue on the GitHub repository or contact the repository owner directly.

## Caution

- It is not recommended to enable untrusted browser extensions on any page that has access to your Steem master password or your Steem active/owner keys.  Beware that browser extensions can steal your keys.
- You can review this extension's code in the associated github repo.
- This extension does not require, request, or use any keys or passwords.
- This extension is not intended for use with any pages that have access to your Steem active/owner keys or your Steem master password.
- It is recommended to login to condenser with your posting key - not with your active/owner key or your master password.

## Disclaimer

This extension is provided as-is without warranty of any kind. The developer is not responsible for any issues that may arise from using this extension.

## References
- 20220529 - [Programming Diary #6: A barebones browser extension for Steem curation](https://steemit.com/programming/@remlaps/programming-diary-6-a-barebones-browser-extension-for-steem-curation)
- 20220530 - [Programming Diary #7: Browser extension updates to activate when scrolling and show color gradients](https://steemit.com/steemit-dev-group/@remlaps/programming-diary-7-browser-extension-updates-to-activate-when-scrolling-and-show-color-gradients)
- 20220815 - [Upgrade Browser Extension for promoted/burnsteem Posts](https://steemit.com/steemit-dev-group/@moecki/upgrade-browser-extension-for-promoted-burnsteem-posts)
- 20250425 - [[Announcement] Steem Curation Extension graduates to beta: Find it now in the official Chrome Web Store](https://steemit.com/steem-dev/@remlaps/announcement-steem-curation-extension-graduates)
