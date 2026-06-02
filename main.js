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

// Cache for follow status (10 minute TTL)
const followCache = new Map();
const FOLLOW_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const NINETY_DAYS_SEC = 90 * 24 * 60 * 60;
const FOLLOW_STATS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const activeFollowerFetches = new Set();

let tooltipElement = null;

/**
 * Persistent cache helpers using chrome.storage.local to share data between tabs.
 */
async function getCachedData(key, ttl) {
    if (followCache.has(key)) {
        const entry = followCache.get(key);
        if (Date.now() - entry.timestamp < ttl) return entry;
    }
    try {
        const storageData = await chrome.storage.local.get(key);
        if (storageData[key]) {
            const entry = storageData[key];
            if (Date.now() - entry.timestamp < ttl) {
                followCache.set(key, entry);
                return entry;
            }
        }
    } catch (e) { console.debug("SCE: Cache read error:", e); }
    return null;
}

async function setCachedData(key, value) {
    const entry = { value, timestamp: Date.now() };
    followCache.set(key, entry);
    try {
        await chrome.storage.local.set({ [key]: entry });
    } catch (e) { console.debug("SCE: Cache write error:", e); }
}

/**
 * Listen for storage changes from other tabs to keep the local in-memory cache in sync.
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        for (let [key, { newValue }] of Object.entries(changes)) {
            if (newValue) {
                followCache.set(key, newValue);
                // If the updated key belongs to the user currently in the tooltip, refresh it
                if (tooltipElement && tooltipElement.style.display === 'block' && tooltipElement.dataset.user) {
                    const targetUser = tooltipElement.dataset.user;
                    if (key === `stats_${targetUser}` || key === `${targetUser}_follows_${getUsername()}`) {
                        const stats = followCache.get(`stats_${targetUser}`)?.value;
                        const follows = followCache.get(`${targetUser}_follows_${getUsername()}`)?.value;
                        updateFollowerTooltip(targetUser, follows !== undefined ? follows : null, stats);
                    }
                }
            }
        }
    }
});

/**
 * Injects CSS for the custom dynamic tooltip.
 */
function injectTooltipStyles() {
    if (document.getElementById('sce-tooltip-styles')) return;
    const style = document.createElement('style');
    style.id = 'sce-tooltip-styles';
    style.textContent = `
        .sce-custom-tooltip {
            position: fixed;
            background: rgba(40, 40, 40, 0.95);
            color: #fff;
            padding: 10px;
            border-radius: 6px;
            font-size: 13px;
            z-index: 10000;
            pointer-events: none;
            white-space: pre-line;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            border: 1px solid #555;
            font-family: sans-serif;
            line-height: 1.4;
        }
    `;
    document.head.appendChild(style);
}

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

/**
 * Checks if the target user follows the logged-in user via Steem API.
 * Results are cached to minimize network overhead.
 */
async function checkFollowsMe(targetUser, currentUser) {
    const cacheKey = `${targetUser}_follows_${currentUser}`;
    const cachedEntry = await getCachedData(cacheKey, FOLLOW_CACHE_TTL);
    if (cachedEntry) return cachedEntry.value;

    try {
        const data = await fetchProxy(steemApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_following',
                params: [targetUser, currentUser, 'blog', 1],
                id: 1
            })
        });
        const follows = data?.result?.[0]?.following === currentUser;
        await setCachedData(cacheKey, follows);
        return follows;
    } catch (e) { return null; }
}

/**
 * Attaches listeners to user links to display follow status on hover.
 */
function initFollowStatusHandlers() {
    const currentUser = getUsername();
    if (!currentUser) return;
    injectTooltipStyles();

    const userLinks = document.querySelectorAll('a[href^="/@"]:not([data-sce-follow])');
    userLinks.forEach(link => {
        const targetUser = link.getAttribute('href').split('/@')[1]?.split('/')[0];
        if (!targetUser) return;

        link.setAttribute('data-sce-follow', 'observed');

        link.addEventListener('mouseenter', (e) => {
            if (!tooltipElement) {
                tooltipElement = document.createElement('div');
                tooltipElement.className = 'sce-custom-tooltip';
                document.body.appendChild(tooltipElement);
            }
            tooltipElement.style.display = 'block';
            tooltipElement.dataset.user = targetUser;
            
            // Position initially
            updateTooltipPosition(e);

            // Kick off data retrieval
            handleTooltipData(link, targetUser, currentUser);
        });

        link.addEventListener('mousemove', updateTooltipPosition);

        link.addEventListener('mouseleave', () => {
            if (tooltipElement) tooltipElement.style.display = 'none';
        });
        
        // Clear native title to prevent conflict
        if (link.title) link.setAttribute('data-sce-old-title', link.title);
        link.title = ""; 
    });
}

function updateTooltipPosition(e) {
    if (!tooltipElement) return;
    const padding = 15;
    let x = e.clientX + padding;
    let y = e.clientY + padding;

    // Flip to left/top if overflow
    if (x + 200 > window.innerWidth) x = e.clientX - tooltipElement.offsetWidth - padding;
    if (y + 150 > window.innerHeight) y = e.clientY - tooltipElement.offsetHeight - padding;

    tooltipElement.style.left = `${x}px`;
    tooltipElement.style.top = `${y}px`;
}

/**
 * Coordinates fetching and refreshing the UI.
 */
async function handleTooltipData(link, targetUser, currentUser) {
    // 1. Initial State
    const cacheKey = `stats_${targetUser}`;
    const cachedEntry = await getCachedData(cacheKey, FOLLOW_STATS_CACHE_TTL);
    let stats = cachedEntry?.value;
    let follows = await checkFollowsMe(targetUser, currentUser);
    updateFollowerTooltip(targetUser, follows, stats);

    // 2. Start (or join) stats fetch
    // Passing targetUser allows the fetch loop to update the global tooltipElement 
    // if the user is still hovering over this specific account.
    await getFollowerExtendedStats(targetUser);
}

/**
 * Helper to build and set the tooltip title string.
 */
function updateFollowerTooltip(targetUser, follows, stats) {
    if (!tooltipElement || tooltipElement.dataset.user !== targetUser) return;

    const isSelf = targetUser === getUsername();
    const statusText = isSelf ? "" : (follows === null ? "" : (follows ? "follows you" : "does not follow you"));
    
    let content = `<strong>@${targetUser}</strong>\n${statusText ? `<span style="color: ${follows ? '#4caf50' : '#aaa'}">${statusText}</span>\n` : ''}`;
    
    if (stats) {
        content += `\nFollowers: ${stats.count.toLocaleString()}`;
        if (stats.processedCount !== undefined) {
            const isDone = stats.full;
            content += `\nActive (90d): ${stats.activeCount.toLocaleString()}${isDone ? '' : '...'}`;
            content += `\nMedian Rep: ${stats.medianRep.toFixed(1)}`;
            content += `\nActive Median Rep: ${stats.medianActiveRep.toFixed(1)}`;
            
            if (!isDone) {
                const pct = Math.round((stats.processedCount / stats.count) * 100);
                content += `\n\n<small style="color:#aaa">Analyzing: ${pct}%</small>`;
            }
        } else if (!stats.full) {
            content += `\n\n<small style="color:#aaa">Loading stats...</small>`;
        }
    }
    tooltipElement.innerHTML = content;
}

/**
 * Fetches extended follower statistics from Steemit API for the tooltip.
 */
async function getFollowerExtendedStats(targetUser) {
    const cacheKey = `stats_${targetUser}`;
    const cachedEntry = await getCachedData(cacheKey, FOLLOW_STATS_CACHE_TTL);
    if (cachedEntry?.value?.full) return cachedEntry.value;
    if (activeFollowerFetches.has(targetUser)) return cachedEntry?.value;

    activeFollowerFetches.add(targetUser);

    try {
        const currentUser = getUsername();
        const follows = await checkFollowsMe(targetUser, currentUser);

        // 1. Get follower count (Fast)
        const countResp = await fetchProxy(steemApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_follow_count',
                params: [targetUser],
                id: 1
            })
        });
        const totalCount = countResp?.result?.follower_count || 0;

        // Cache partial data immediately so the first hover can at least show the count
        let runningStats = { count: totalCount, processedCount: 0, activeCount: 0, medianRep: 25, medianActiveRep: 25, full: false };
        await setCachedData(cacheKey, runningStats);
        updateFollowerTooltip(targetUser, follows, runningStats);

        if (totalCount === 0) return runningStats;

        let activeCount = 0;
        const reputations = [];
        const activeReputations = [];
        let startFollower = "";
        const limit = 100; // condenser_api batch size
        const now = Date.now() / 1000;

        const calcMedian = (arr) => {
            if (arr.length === 0) return 25;
            const sorted = [...arr].sort((a, b) => a - b);
            const rawMedian = sorted[Math.floor(sorted.length / 2)];
            return rawMedian > 0 ? (Math.log10(rawMedian) - 9) * 9 + 25 : 25;
        };

        // 2. Iterate through follower list (Slow)
        while (true) {
            const followersResp = await fetchProxy(steemApi, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'condenser_api.get_followers',
                    params: [targetUser, startFollower, 'blog', limit],
                    id: 1
                })
            });

            const page = followersResp?.result || [];
            if (page.length === 0) break;

            // condenser_api includes the start account in the results, so we slice it off on subsequent pages
            const names = (startFollower === "" ? page : page.slice(1)).map(f => f.follower);
            if (names.length === 0) break;

            // 3. Fetch account details for the batch to get reputation and last activity
            const accountsResp = await fetchProxy(steemApi, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'condenser_api.get_accounts',
                    params: [names],
                    id: 1
                })
            });

            const accounts = accountsResp?.result || [];
            accounts.forEach(acc => {
                const rep = parseFloat(acc.reputation);
                const lastRoot = new Date(acc.last_root_post + 'Z').getTime() / 1000;
                const lastVote = new Date(acc.last_vote_time + 'Z').getTime() / 1000;
                const lastActive = Math.max(lastRoot, lastVote);

                if (rep > 0) reputations.push(rep);
                if (now - lastActive < NINETY_DAYS_SEC) {
                    activeCount++;
                    if (rep > 0) activeReputations.push(rep);
                }
            });

            // Update running stats for real-time refresh
            runningStats.processedCount += page.length;
            runningStats.activeCount = activeCount;
            runningStats.medianRep = calcMedian(reputations);
            runningStats.medianActiveRep = calcMedian(activeReputations);
            
            // Throttle storage writes to avoid rate limits (write every 500 or on completion)
            if (runningStats.processedCount % 500 === 0) {
                await setCachedData(cacheKey, runningStats);
            }
            updateFollowerTooltip(targetUser, follows, runningStats);

            startFollower = page[page.length - 1].follower;
            if (page.length < limit) break;
        }

        runningStats.full = true;
        await setCachedData(cacheKey, runningStats);
        updateFollowerTooltip(targetUser, follows, runningStats);

        return runningStats;
    } catch (e) {
        return null;
    } finally {
        activeFollowerFetches.delete(targetUser);
    }
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

function setupFeedNavigation() {
    const feedsNav = document.getElementById('FeedsNavigation');
    if (feedsNav && !feedsNav.dataset.sceObserved) {
        feedsNav.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                // When switching feeds, clear our custom DOM markers so that
                // repurposed DOM nodes are correctly re-processed.
                document.querySelectorAll('#past_payout').forEach(el => el.removeAttribute('id'));
                document.querySelectorAll('#beneficiary-item').forEach(el => el.remove());
            }
        });
        feedsNav.dataset.sceObserved = 'true';
    }
}

setupFeedNavigation = withSilentMutations(setupFeedNavigation);

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
        setupFeedNavigation();
        highLight();
        removeCondenserResteemToggle();
        updateResteemVisibility();

        const newLang = detectUserLanguage();
        if (newLang && newLang !== USER_LANGUAGE) USER_LANGUAGE = newLang;

        if (typeof updatePayoutValue === 'function') {
            updatePayoutValue();
        }

        initFollowStatusHandlers();
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
        // Clear custom DOM markers on URL change to prevent data bleed-through 
        // between different feeds sharing the same DOM structure.
        document.querySelectorAll('#past_payout').forEach(el => el.removeAttribute('id'));
        document.querySelectorAll('#beneficiary-item').forEach(el => el.remove());
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