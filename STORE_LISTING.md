# Chrome Web Store Listing - Draft Copy

Prepared text for the Chrome Web Store listing and Privacy practices sections of the Steem Curation Extension. Copy each section into the corresponding field in the Developer Dashboard.

## 1. Detailed description

Steem Curation Extension adds supplemental information to Steem/Condenser-based sites to help curators decide where to spend their attention and voting power. It highlights posts promoted by burning Steem Dollars (SBD) and posts that burn rewards through @null beneficiaries, and shows payout details, voting power, follower-network analysis tooltips, and payout/vote charts.

It also includes an optional "reblog with comment" feature: clicking the reblog icon publishes a new post containing your comment, an excerpt of the original post, and a link back to it. This feature requires the separate Steem Keychain extension, which signs the broadcast using your Posting key. Steem Curation Extension never requests, stores, or handles any keys or passwords; every broadcast is approved by you directly in Steem Keychain.

Works on steemit.com and other Condenser-based Steem front ends.

## 2. Short description / summary (max 132 characters)

Supplemental curation information for Steem/Condenser sites, plus optional reblogs signed via Steem Keychain.

## 3. Single purpose justification

Every feature serves one purpose: helping Steem curators and readers evaluate posts and manage their curation activity. Post highlighting, payout and voting displays, follower analysis, and the optional reblog feature all operate on the same platform (Condenser-based Steem sites) toward that same goal.

## 4. Permission justification

- storage - Used only to cache public Steem blockchain data (follower lists, account info) locally and to share that cache across open tabs, reducing API calls and speeding up the interface. No personal data is stored.

## 5. Data usage declarations (Privacy practices tab)

- Does the extension collect or transmit user data? Yes - public blockchain identifiers only.
- What is collected/transmitted: public Steem account names and post permlinks, sent to api.steemit.com and sds.steemworld.org to look up public blockchain data. No browsing history, passwords, or private keys are read or sent.
- The extension does not use the data for advertising or tracking, and does not sell data.
- Privacy policy: see `PRIVACY_POLICY.md` in this repository.

## 6. Privacy policy

The privacy policy is maintained in its own file, `PRIVACY_POLICY.md`.