chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_PROXY') {
        console.log(`Proxying ${request.options?.method || 'GET'} request to: ${request.url}`);
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
                console.error(`Fetch error for ${request.url}:`, error);
                sendResponse({ error: error.message });
            });
        return true; // Keeps the message channel open for the async response
    }
});