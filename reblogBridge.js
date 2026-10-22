/*
 * Reblog bridge (runs in the page's MAIN world).
 *
 * Extensions such as Steem Keychain expose their APIs on the page's `window`
 * object. That object is NOT reachable from the isolated world where the rest
 * of this extension runs, so this thin bridge relays broadcast requests from
 * the isolated-world content script (reblogControl.js) to
 * `window.steem_keychain` and posts the result back via `window.postMessage`.
 *
 * This file must be declared in manifest.json with `"world": "MAIN"`.
 *
 * SECURITY: any script running in this world (the page's own scripts, an XSS,
 * or a compromised mirror site) can post the same messages the content script
 * does, so nothing about a broadcast is taken on trust. This bridge only ever
 * signs `comment` + `comment_options` operations with the Posting key, and it
 * rebuilds the payload from validated fields before handing it to Keychain.
 */
(function () {
    const REQUEST_TYPE = 'SCE_REBLOG_REQUEST';
    const RESPONSE_TYPE = 'SCE_REBLOG_RESPONSE';

    // This extension only ever signs reblogs, and only with the Posting key.
    const REQUIRED_KEY_TYPE = 'Posting';
    const ACCOUNT_NAME_REGEX = /^[a-z][a-z0-9.-]{1,14}[a-z0-9]$/;
    const PERMLINK_REGEX = /^[a-z0-9-]{1,256}$/;
    const TAG_REGEX = /^[a-z0-9-]{1,24}$/;
    const MAX_TITLE_LENGTH = 256;
    const MAX_BODY_LENGTH = 65536;
    const MAX_METADATA_LENGTH = 8192;

    // Origins the extension is injected into (see manifest.json). Messages from
    // any other origin are ignored.
    const ALLOWED_ORIGINS = [
        'https://steemit.com',
        'https://www.steemit.com',
        'https://steemit.moecki.online',
        'https://steemit.steemapps.com',
        'https://steemit.steemnet.org',
        'https://steemitdev.com',
        'https://www.steemitdev.com'
    ];

    const isKeychainAvailable = () => typeof window.steem_keychain !== 'undefined';

    function respond(nonce, payload) {
        window.postMessage(Object.assign({ type: RESPONSE_TYPE, nonce }, payload), window.location.origin);
    }

    function isAllowedOrigin(origin) {
        return ALLOWED_ORIGINS.indexOf(origin) !== -1;
    }

    function isBoundedString(value, maxLength) {
        return typeof value === 'string' && value.length <= maxLength;
    }

    function respondWithError(nonce, message) {
        respond(nonce, { action: 'broadcast', response: { success: false, message } });
    }

    /**
     * Rebuilds a validated [comment, comment_options] operation pair from the
     * request, dropping every unexpected field and rejecting anything that is
     * not exactly the shape this extension produces. Returns null when the
     * payload cannot be trusted (for example a transfer, vote or any other
     * operation a hostile page script might try to smuggle through).
     */
    function sanitizeOperations(username, operations) {
        if (!Array.isArray(operations) || operations.length < 1 || operations.length > 2) return null;

        const comment = operations[0];
        if (!Array.isArray(comment) || comment.length !== 2 || comment[0] !== 'comment') return null;

        const commentData = comment[1];
        if (!commentData || typeof commentData !== 'object') return null;
        if (commentData.author !== username) return null;
        if (commentData.parent_author !== '') return null;
        if (!TAG_REGEX.test(String(commentData.parent_permlink || ''))) return null;
        if (!PERMLINK_REGEX.test(String(commentData.permlink || ''))) return null;
        if (!isBoundedString(commentData.title, MAX_TITLE_LENGTH)) return null;
        if (!isBoundedString(commentData.body, MAX_BODY_LENGTH)) return null;
        if (!isBoundedString(commentData.json_metadata, MAX_METADATA_LENGTH)) return null;
        try {
            JSON.parse(commentData.json_metadata);
        } catch (error) {
            return null;
        }

        const sanitized = [
            ['comment', {
                parent_author: '',
                parent_permlink: commentData.parent_permlink,
                author: username,
                permlink: commentData.permlink,
                title: commentData.title,
                body: commentData.body,
                json_metadata: commentData.json_metadata
            }]
        ];

        if (operations.length !== 2) return sanitized;

        const options = operations[1];
        if (!Array.isArray(options) || options.length !== 2 || options[0] !== 'comment_options') return null;

        const optionsData = options[1];
        if (!optionsData || typeof optionsData !== 'object') return null;
        if (optionsData.author !== username) return null;
        if (optionsData.permlink !== commentData.permlink) return null;

        const extensions = [];
        if (Array.isArray(optionsData.extensions)) {
            optionsData.extensions.forEach((extension) => {
                if (!Array.isArray(extension) || extension.length !== 2 || extension[0] !== 0) return;
                const payload = extension[1];
                if (!payload || !Array.isArray(payload.beneficiaries)) return;

                const beneficiaries = [];
                payload.beneficiaries.forEach((beneficiary) => {
                    if (!beneficiary || typeof beneficiary !== 'object') return;
                    if (typeof beneficiary.account !== 'string' || !ACCOUNT_NAME_REGEX.test(beneficiary.account)) return;
                    if (!Number.isInteger(beneficiary.weight) || beneficiary.weight < 0 || beneficiary.weight > 10000) return;
                    beneficiaries.push({ account: beneficiary.account, weight: beneficiary.weight });
                });

                if (beneficiaries.length) extensions.push([0, { beneficiaries }]);
            });
        }

        sanitized.push(['comment_options', {
            author: username,
            permlink: commentData.permlink,
            max_accepted_payout: '1000000.000 SBD',
            percent_steem_dollars: 10000,
            allow_votes: true,
            allow_curation_rewards: true,
            extensions: extensions
        }]);

        return sanitized;
    }

    window.addEventListener('message', (event) => {
        // Only handle messages posted into this same window by an allowed origin.
        if (event.source !== window) return;
        if (!isAllowedOrigin(event.origin)) return;

        const data = event.data;
        if (!data || data.type !== REQUEST_TYPE || !data.nonce) return;

        // Availability check: lets the isolated world know whether Keychain is
        // installed before it tries to broadcast.
        if (data.action === 'ping') {
            respond(data.nonce, { action: 'ping', available: isKeychainAvailable() });
            return;
        }

        if (data.action !== 'broadcast') return;

        if (!isKeychainAvailable()) {
            respondWithError(data.nonce, 'Steem Keychain is not installed.');
            return;
        }

        // Never honour a key type requested by the message: only Posting is allowed.
        if (data.keyType && data.keyType !== REQUIRED_KEY_TYPE) {
            respondWithError(data.nonce, 'Unsupported key type.');
            return;
        }

        const username = typeof data.username === 'string' ? data.username : '';
        if (!ACCOUNT_NAME_REGEX.test(username)) {
            respondWithError(data.nonce, 'Invalid account name.');
            return;
        }

        const operations = sanitizeOperations(username, data.operations);
        if (!operations) {
            respondWithError(data.nonce, 'Unsupported operation.');
            return;
        }

        try {
            window.steem_keychain.requestBroadcast(
                username,
                operations,
                REQUIRED_KEY_TYPE,
                (response) => respond(data.nonce, { action: 'broadcast', response })
            );
        } catch (error) {
            respondWithError(data.nonce, String(error && error.message ? error.message : error));
        }
    });
})();
