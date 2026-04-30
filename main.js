console.log("The extension is up and running...");

var promotedPosts = {}; // contains all transactions for promoted posts with accounts, count, and whether self-promoted
const urlRequestTransfers = "https://sds.steemworld.org/transfers_api/getTransfersByTypeTo/transfer/null/time/DESC/250/0";
const urlRequestAccount = "https://sds.steemworld.org/accounts_api/getAccountExt/";
const steemApi = "https://api.steemit.com";
const sdsEndpoint = "https://sds.steemworld.org";
const curatorStringRegex = /(Curators|Curador|Curateurs|Curatori|キュレーター|큐레이터 |Kuratorzy|Кураторские|Кураториські|审查收入)/
const promotedCostStringRegex = /(?:Promotion Cost|Coste de promoción|Cout de la promotion|Costo della Promozione|プロモーションコスト|홍보 비용|Koszty promocji|Цена продвижения|Вартість просування|推广费)(?::)?\s*.*?\$.*/

let post_info = {"author":null, "permlink":null}
let isPostLoading = false;

let USER_LANGUAGE;

// Cache for voting power requests (5 minute TTL)
const vpCache = new Map();
const VP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/*
 *  The main logic is in highLight() and handleProfileDropdownClick()
 * o highlight()
 * - Add highlighting to posts with post promotion or @null beneficiaries.
 * - Add highlighting to the burn & promotion settings when post-> value item is clicked.
 * 
 * o handleProfileDropdownClick()
 * - Display the voting power of the logged in account when the dropdown menu is clicked.
 *
 */
function highLight() {
    const votingPanes = document.querySelectorAll('.Voting__pane');

    votingPanes.forEach(pane => {
        const text = pane.textContent;
        const postContainerInFeed = pane.closest('li'); // For feed view
        const articleContainer = pane.closest('.article'); // For post view
        const postFullFooter = pane.closest('.PostFull__footer'); // For post view

        if (text.match(curatorStringRegex)) {
            return; // This is a paid-out post, so we skip it entirely.
        }

        const listItems = pane.querySelectorAll('ul > li');
        let burnColor = "initial";
        let promoColor = "initial";

        listItems.forEach(li => {
            const liText = li.textContent;

            // Check for @null beneficiary
            if (liText.match('null: .*%')) {
                const nullPct = liText.substring(
                    liText.indexOf(" ") + 1,
                    liText.lastIndexOf("%")
                );
                burnColor = getColorBurnPost(nullPct);
                li.style.backgroundColor = burnColor;
            }
            // Check for /promoted post promotion
            else if (liText.match(promotedCostStringRegex)) {
                const indexEnd = (liText.indexOf("(") >= 0) ? liText.indexOf("(") - 1 : liText.length;
                const promoAmount = liText.substring(
                    liText.indexOf("$") + 1,
                    indexEnd
                );
                promoColor = getColorPromotedPost(promoAmount);
                li.style.backgroundColor = promoColor;
                addText(li);
            } else {
                li.style.backgroundColor = "initial";
            }
        });

        // Apply highlighting to the main post container in feed view
        if (postContainerInFeed && !articleContainer) { // Make sure we are in a feed view
            if (burnColor !== "initial" && promoColor !== "initial") {
                postContainerInFeed.style.backgroundColor = '#1E90FF'; // Both are present
            } else if (burnColor !== "initial") {
                postContainerInFeed.style.backgroundColor = burnColor;
            } else if (promoColor !== "initial") {
                postContainerInFeed.style.backgroundColor = promoColor;
            } else {
                postContainerInFeed.style.backgroundColor = "initial";
            }
        } else if (postFullFooter) {
            if (postFullFooter) {
                if (burnColor !== "initial" && promoColor !== "initial") {
                    postFullFooter.style.backgroundColor = hexToRgba('#1E90FF', 0.15); // Both are present
                } else if (burnColor !== "initial") {
                    postFullFooter.style.backgroundColor = hexToRgba(burnColor, 0.15);
                } else if (promoColor !== "initial") {
                    postFullFooter.style.backgroundColor = hexToRgba(promoColor, 0.15);
                } else {
                    postFullFooter.style.backgroundColor = "initial";
                }
            }
        } else {
            pane.style.backgroundColor = "initial";
        }
    });
};

// Ensure extension-made DOM changes don't re-trigger mutation handling
highLight = withSilentMutations(highLight);

async function handleProfileDropdownClick(event) {
    const titleElements = document.querySelectorAll('li.title');
    let accountElement;

    titleElements.forEach(async element => {
        if (element.textContent.trim() === element.childNodes[0].textContent.trim()) {
            accountElement = element;
        }
    });
    if (accountElement) {
        let elementText = accountElement.textContent.trim();
        const username = elementText.split(" ")[0] 
        const votingPower = await getVotingPower(username);
        accountElement.textContent = `${username} (VP: ${votingPower}%)`;
    }
}

/*
 * helper functions
 */

function getColorBurnPost(nullPct) {
    if (nullPct > 0 && nullPct < 25) {
        curatorBackgroundColor = "coral";
    } else if (nullPct < 50) {
        curatorBackgroundColor = "orange";
    } else if (nullPct < 75) {
        curatorBackgroundColor = "darkorange";
    } else if (nullPct > 0) {
        curatorBackgroundColor = "orangered";
    }
    return curatorBackgroundColor;
}

function getColorPromotedPost(promoAmount) {
    if (promoAmount > 0 && promoAmount < 0.26) {
        curatorBackgroundColor = "paleturquoise";
    } else if (promoAmount < 0.51) {
        curatorBackgroundColor = "aquamarine";
    } else if (promoAmount < 1.01) {
        curatorBackgroundColor = "turquoise";
    } else if (promoAmount > 0) {
        curatorBackgroundColor = "lightseagreen";
    }
    return curatorBackgroundColor;
}

function prepareData(data) {
    if (data) {
        const cols = data.result.cols;
        const rows = data.result.rows;
        rows.forEach(trf => {
            let trfData = getAuthorPost(trf[cols["memo"]]);
            if (trfData) {
                let from = trf[cols["from"]];
                let self = (from == trfData["author"]);
                let props = { "user": [from], "count": 1, "self": self };
                let key = trfData["post"];
                if (promotedPosts && key in promotedPosts) {
                    let oldProps = promotedPosts[key];
                    if (!(oldProps["user"].includes(from))) {
                        props["user"] = props["user"].concat(oldProps["user"]);
                        props["count"] += oldProps["count"];
                        props["self"] = props["self"] || oldProps["self"];
                    } else {
                        props = oldProps;
                    }
                }
                promotedPosts[key] = props;
            }
        });
    };
}

function getAuthorPost(memoStr) {
    const objMatch = regexMatch(true, memoStr);
    let result = (objMatch && objMatch.length == 3) ? {
        "post": objMatch.groups["author"] + "/" + objMatch.groups["permlink"],
        "author": objMatch.groups["author"]
    } : null;
    return result;
}

function addText(listItem) {
    var added = false;
    if (!listItem.textContent.includes('User')) {
        let address = getAddress(listItem);
        if (address !== null) {
            let key = getPost(address);
            if (promotedPosts[key]) {
                let newText = ' (by ' +
                    promotedPosts[key]["count"] +
                    (promotedPosts[key]["count"] == 1 ? ' User' : ' Users') +
                    (promotedPosts[key]["self"] ? ' incl. self)' : ')');
                let newTextNode = document.createTextNode(newText);
                listItem.firstChild.appendChild(newTextNode);
                added = true
            }
        }
    }
    if (added) {
        console.log("User added");
    }
}

// Wrap DOM-modifying helper to avoid retriggering the mutation observer
addText = withSilentMutations(addText);

function getPost(address) {
    const objMatch = regexMatch(false, address);
    return (objMatch && objMatch.length == 3) ? objMatch.groups["author"] + "/" + objMatch.groups["permlink"] : null;
}

function regexMatch(fromBegin, textStr) {
    re = fromBegin ? /^@(?<author>[\w-.]+)[\/](?<permlink>[\w-\|]+)$/ : /@(?<author>[\w-.]+)[\/](?<permlink>[\w-\|]+)$/;
    return textStr.match(re);
}

function getAddress(elem) {
    var link;
    while (elem.parentElement && elem.parentElement.nodeName.toLowerCase() != 'body') {
        elem = elem.parentElement;
        if (elem.nodeName.toLowerCase() == 'div' && elem.className.includes('articles__content-block--text')) {
            let titleElemList = elem.getElementsByClassName('entry-title');
            link = titleElemList[0].firstChild.href;
            break;
        }
    }
    return link ? link : null;
}

/*
 * Network queries
 */

const getUsername = () =>{
    const titleElements = document.querySelectorAll('li.title');
    titleElements.forEach(element => {
        if (element.textContent.trim() === element.childNodes[0].textContent.trim()) {
            accountElement = element;
        }
    });
    if (accountElement) {
        let elementText = accountElement.textContent.trim();
        const username = elementText.split(" ")[0]
        return username;
    }

    // Selector for the user's profile link in the dropdown menu
    let userLink = document.querySelector('.Header__usermenu ul a[href^="/@"]');
    if (userLink) {
        // Extract username from the href attribute
        const href = userLink.getAttribute('href');
        const username = href.substring(2); // Remove '/@'
        return username;
    }
    // Fallback for older structures if needed
    const legacyUser = document.querySelector('.Header__user-link .Header__user-name');
    if (legacyUser) {
        return legacyUser.textContent.trim();
    }
}

// Function to get voting power with retry logic and caching
async function getVotingPower(username, maxRetries = 3) {
    // Check cache first
    const cached = vpCache.get(username);
    if (cached && Date.now() - cached.timestamp < VP_CACHE_TTL) {
        return cached.value;
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const urlRequestAccountFull = `${urlRequestAccount}${username}/null/upvote_mana_percent`;
            const response = await fetch(urlRequestAccountFull);
            if (!response.ok) {
                if (attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 1000; // exponential backoff: 1s, 2s, 4s
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                console.warn(`Failed to fetch voting power for ${username}: ${response.statusText}`);
                return null;
            }
            const data = await response.json();
            const vpValue = data.result?.upvote_mana_percent;
            
            // Cache successful result
            vpCache.set(username, { value: vpValue, timestamp: Date.now() });
            return vpValue;
        } catch (error) {
            if (attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000; // exponential backoff: 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            console.warn(`Error fetching voting power for ${username}:`, error.message);
            return null;
        }
    }
}

// Should this be repeated with a timer?
fetch(urlRequestTransfers).then(function (response) {
    return response.json();
}).then(function (data) {
    prepareData(data);
    highLight();
}).catch(function (error) {
    console.log("error: fetching transfers:", error);
});

/*
 * Execution and event handling
 */

// Event handler when the dropdown menu is clicked.  Calls: handleProfileDropdownClick for modifications.
function modifyUserElement() {
    const usermenuDropdown = document.querySelector('.DropdownMenu.Header__usermenu');
    if ( usermenuDropdown ) {
        usermenuDropdown.addEventListener('click', handleProfileDropdownClick);
    }
}

// Wrapping the event handler that adds elements/listeners
modifyUserElement = withSilentMutations(modifyUserElement);

const runOncePerBatch = () => {
    // Bail out if we are in the post editor to prevent memory leaks and unnecessary processing
    if (window.location.pathname.includes('/edit') || document.querySelector('[class*="ReplyEditor"]')) return;

    SCE_SILENT++;
    try {
        addButtonsToSummaries();
        modifyUserElement();
        highLight();
        removeCondenserResteemToggle();
        updateResteemVisibility();

        const newLang = detectUserLanguage();
        if (newLang && newLang !== USER_LANGUAGE) USER_LANGUAGE = newLang;

        if (typeof updatePayoutValue === 'function') {
            updatePayoutValue();
        }

        addUserVpRing_silent();

        // Re-initialize post features when on a post page (handles React re-renders from language/theme changes)
        const postClass = document.querySelector('.Post:not(:has([class*="ReplyEditor"]))');
        if (postClass && typeof loadPost === 'function' && !isPostLoading) {
            // Use async IIFE to handle async loadPost without blocking
            (async () => {
                isPostLoading = true;
                try {
                    const result = await loadPost(post_info, USER_LANGUAGE || detectUserLanguage() || 'en');
                    if (result) post_info = result;
                } catch (error) {
                    console.error("Error loading post data in mutation observer:", error);
                } finally {
                    isPostLoading = false;
                }
            })();
        }
    } catch (error) {
        console.error("Error in mutation observer handling:", error);
    } finally {
        SCE_SILENT--;
    }
}

// Mutation observer to detect logout -> login and other page changes.
const sceMutationObserver = () => {
  const root = document.documentElement || document.body;
  const config = { childList: true, subtree: true };
  
  let timeoutId = null;
  let lastRunTime = 0;
  const DEBOUNCE_DELAY = 250;
  const MAX_WAIT = 1000; // Force run every 1s if mutations are continuous
  let lastUrl = window.location.href;

  const observer = new MutationObserver((mutations) => {
    // Ignore mutations triggered by our own script execution
    if (SCE_SILENT > 0) return;

    // Ignore mutations caused by tooltips and similar transient UI elements.
    // This prevents heavy routines from re-running repeatedly during hovers and interactions.
    const onlyTransientUI = mutations?.length > 0 && mutations.every((m) => {
      const t = m.target;
      const el = t && t.nodeType === 1 ? t : t?.parentElement; // Element or nearest parent Element
      return !!(el && el.closest && (el.closest('.voter-tooltip') || el.closest('[role="tooltip"]') || el.closest('.tooltip')));
    });
    if (onlyTransientUI) return;

    const now = Date.now();
    const urlChanged = window.location.href !== lastUrl;

    // Immediate response for URL changes, or forced run if debounce is being stalled by constant mutations
    if (urlChanged || (now - lastRunTime > MAX_WAIT)) {
        lastUrl = window.location.href;
        lastRunTime = now;
        clearTimeout(timeoutId);
        timeoutId = null;
        runOncePerBatch();
        return;
    }

    // Standard debounce for other mutations
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      lastRunTime = Date.now();
      runOncePerBatch();
    }, DEBOUNCE_DELAY); 
  });

  observer.observe(root, config);
}

window.addEventListener('load', async () => {
    if (document.querySelector('[class*="ReplyEditor"]')) return;
    runOncePerBatch();
    post_info = await loadPost({"author":null, "permlink":null}, USER_LANGUAGE); // Call your function
});

window.addEventListener('popstate', () => {
    runOncePerBatch();
});

window.addEventListener('click', async () => {
    if (document.querySelector('[class*="ReplyEditor"]')) return;

    runOncePerBatch();
    
    if (!isPostLoading && document.querySelector('.Post')) {
        isPostLoading = true;
        try {
            const result = await loadPost(post_info, USER_LANGUAGE || detectUserLanguage() || 'en');
            if (result) post_info = result;
        } finally {
            isPostLoading = false;
        }
    }
});

window.addEventListener('scroll', async () => {
})

addButtonsToSummaries();        // New for curation info buttons
sceMutationObserver();          // Mutation observer for new dropdown menu after login.
createResteemToggleControl();   // Resteem checkbox

console.log("The extension is done.");