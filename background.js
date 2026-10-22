// Hosts the extension is allowed to fetch through the proxy. The content
// scripts only ever talk to the Steem condenser API and the SteemWorld SDS API.
const ALLOWED_FETCH_HOSTS = ['api.steemit.com', 'sds.steemworld.org'];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || request.type !== 'FETCH_PROXY') return;

    // Only serve this extension's own content scripts. Messages from any other
    // sender must never be able to drive the proxy.
    if (!sender || sender.id !== chrome.runtime.id) {
        console.warn('SCE: Rejected proxy request from an unauthorized sender.');
        sendResponse({ error: 'Unauthorized sender' });
        return false;
    }

    let target;
    try {
        target = new URL(request.url);
    } catch (error) {
        sendResponse({ error: 'Invalid request URL' });
        return false;
    }

    // Restrict the proxy to HTTPS requests to the known API hosts.
    if (target.protocol !== 'https:' || ALLOWED_FETCH_HOSTS.indexOf(target.hostname) === -1) {
        console.warn(`SCE: Blocked proxy request to ${target.origin}.`);
        sendResponse({ error: 'Blocked request host' });
        return false;
    }

    console.debug(`Proxying ${request.options?.method || 'GET'} request to: ${request.url}`);
    fetch(request.url, request.options)
        .then(async response => {
            const contentType = response.headers.get("content-type");
            if (response.ok && contentType && contentType.includes("application/json")) {
                const data = await response.json();
                sendResponse({ data });
            } else {
                // Handle non-JSON or error responses without crashing the JSON parser
                const text = await response.text();
                let errorMsg = `HTTP ${response.status}: `;
                try {
                    const errData = JSON.parse(text);
                    errorMsg += errData?.error?.message || "Unknown API Error";
                } catch (e) {
                    errorMsg += "Server returned HTML/Text instead of JSON";
                }
                throw new Error(errorMsg);
            }
        })
        .catch(error => {
            console.warn(`SCE: Fetch error for ${request.url}:`, error);
            sendResponse({ error: error.message });
        });
    return true; // Keeps the message channel open for the async response
});