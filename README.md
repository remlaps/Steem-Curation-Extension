# Steem Curation Extension

This browser extension highlights certain posts on Steem-based websites, such as Steemit.com and other sites running the Condenser front end. Specifically, it highlights posts that are promoted by burning Steem Dollars (SBD) or those that burn STEEM, SBD, and SP beneficiary rewards by directing them to the @null account.

## Features

- Highlights posts that were promoted by burning SBD tokens.
- Highlights posts that have beneficiary rewards set to direct rewards to the @null account.
- Color gradients in the highlighting help to identify promotion costs and beneficiary settings at a glance.
- Works on Steemit.com and other Steem-based sites using the Condenser front end.

This functionality helps web site visitors to identify posts that may have received artificial promotion or where rewards are being deliberately burned.

### Currently Supported Sites
- `https://steemit.com/*`
- `https://steemitdev.com/*`
- `https://condenser-1077810928621.us-east5.run.app/*`
- `https://steemit.steemnet.org/*`

## Installation Instructions

### Prerequisites

- A compatible browser (Brave, Chrome, or Edge).
- The ability to enable Developer Mode in your browser.

### Downloading the Extension

1. Visit the [GitHub repository](https://github.com/remlaps/Steem-Curation-Extension.git).
2. Click on the green "Code" button and select "Download ZIP".
3. Extract the downloaded ZIP file to a location on your computer.

### Installing in Brave, Chrome, and Edge Browsers

#### Brave Browser

1. **Open the Extensions Page:**
   - Navigate to `brave://extensions/`
   - Or, click on the menu (three horizontal lines) in the top-right corner, go to "Settings", then "Extensions".

2. **Enable Developer Mode:**
   - Toggle the switch in the top-right corner to enable Developer Mode.

3. **Load the Extension:**
   - Click on the "Load unpacked" button and select the folder where you extracted the ZIP file.
   - Alternatively, you can drag and drop the extracted folder onto the `brave://extensions/` page.

4. **Disable Developer Mode:**
   - After installing, you can disable Developer Mode by toggling the switch off.

#### Chrome Browser

1. **Open the Extensions Page:**
   - Navigate to `chrome://extensions/`
   - Or, click on the menu (three vertical dots) in the top-right corner, go to "More tools", then "Extensions".

2. **Enable Developer Mode:**
   - Toggle the switch in the top-right corner to enable Developer Mode.

3. **Load the Extension:**
   - Click on the "Load unpacked" button and select the folder where you extracted the ZIP file.
   - Alternatively, you can drag and drop the extracted folder onto the `chrome://extensions/` page.

4. **Disable Developer Mode:**
   - After installing, you can disable Developer Mode by toggling the switch off.

#### Edge Browser

1. **Open the Extensions Page:**
   - Navigate to `edge://extensions/`
   - Or, click on the menu (three horizontal dots) in the top-right corner, go to "Extensions", then click on "Manage extensions".

2. **Enable Developer Mode:**
   - Toggle the switch in the bottom-left corner to enable Developer Mode.

3. **Load the Extension:**
   - Click on the "Load unpacked" button and select the folder where you extracted the ZIP file.
   - Alternatively, you can drag and drop the extracted folder onto the `edge://extensions/` page.

4. **Disable Developer Mode:**
   - After installing, you can disable Developer Mode by toggling the switch off.

**Note:** Installing extensions in developer mode might come with security risks. Only proceed if you trust the source of the code (i.e., this repository). Disabling developer mode after installation is recommended for improved security.

## Usage

Once installed, the extension will automatically highlight the relevant posts on Steem-based websites that you visit. No further configuration is needed.

## Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request. For major changes, please open an issue to discuss what you would like to change.

## Contact

For any questions or suggestions, feel free to open an issue on the GitHub repository or contact the repository owner directly.

### Disclaimer

This extension is provided as-is without warranty of any kind. The developer is not responsible for any issues that may arise from using this extension.

### References
- 20220529 - [Programming Diary #6: A barebones browser extension for Steem curation](https://steemit.com/programming/@remlaps/programming-diary-6-a-barebones-browser-extension-for-steem-curation)
- 20220530 - [Programming Diary #7: Browser extension updates to activate when scrolling and show color gradients](https://steemit.com/hive-192037/@remlaps/programming-diary-7-browser-extension-updates-to-activate-when-scrolling-and-show-color-gradients)
- 20220815 - [Upgrade Browser Extension for promoted/burnsteem Posts](https://steemit.com/hive-192037/@moecki/upgrade-browser-extension-for-promoted-burnsteem-posts)
