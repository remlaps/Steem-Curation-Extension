# Privacy Policy - Steem Curation Extension

This policy describes how the Steem Curation Extension handles data.

## Data the extension does NOT collect

The extension does not collect personal identifiers, passwords, private keys, browsing history, form data, or payment information. It never requests, stores, or handles Steem private keys or passwords. The optional "reblog with comment" feature delegates signing to the separate Steem Keychain extension, and every broadcast is approved by you directly in Steem Keychain.

## Data the extension does process

The extension reads public Steem blockchain data (account names, post authors and permlinks, vote lists, follower lists, and payout amounts). To retrieve it, the extension sends public identifiers (account names and post permlinks) to api.steemit.com and sds.steemworld.org, which are public Steem API and SteemWorld servers.

## Local storage

The extension caches public blockchain data and a local UI preference in chrome.storage.local (and localStorage) on your device. This data does not leave your device except as described above. It can be removed by uninstalling the extension or clearing extension/site storage.

## Third parties

The extension communicates only with api.steemit.com and sds.steemworld.org. It does not use analytics, tracking, or advertising, and does not sell or share data.

## Contact

Questions or concerns can be raised in the project's GitHub issues: https://github.com/remlaps/Steem-Curation-Extension/issues

## Changes

If this policy changes, the updated version will be linked from the Chrome Web Store listing.