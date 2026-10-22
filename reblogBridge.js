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
 */
(function () {
    const REQUEST_TYPE = 'SCE_REBLOG_REQUEST';
    const RESPONSE_TYPE = 'SCE_REBLOG_RESPONSE';

    const isKeychainAvailable = () => typeof window.steem_keychain !== 'undefined';

    function respond(nonce, payload) {
        window.postMessage(Object.assign({ type: RESPONSE_TYPE, nonce }, payload), '*');
    }

    window.addEventListener('message', (event) => {
        // Only handle messages posted into this same window.
        if (event.source !== window) return;

        const data = event.data;
        if (!data || data.type !== REQUEST_TYPE || !data.nonce) return;

        // Availability check: lets the isolated world know whether Keychain is
        // installed before it tries to broadcast.
        if (data.action === 'ping') {
            respond(data.nonce, { action: 'ping', available: isKeychainAvailable() });
            return;
        }

        if (data.action === 'broadcast') {
            if (!isKeychainAvailable()) {
                respond(data.nonce, {
                    action: 'broadcast',
                    response: { success: false, message: 'Steem Keychain is not installed.' }
                });
                return;
            }

            try {
                window.steem_keychain.requestBroadcast(
                    data.username,
                    data.operations,
                    data.keyType || 'Posting',
                    (response) => respond(data.nonce, { action: 'broadcast', response })
                );
            } catch (error) {
                respond(data.nonce, {
                    action: 'broadcast',
                    response: {
                        success: false,
                        message: String(error && error.message ? error.message : error)
                    }
                });
            }
        }
    });
})();
