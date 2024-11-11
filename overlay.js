/*
 * Overlay functions
 */
let bodyBackgroundColor = getComputedStyle(document.body).backgroundColor;
let bodyFontColor = getComputedStyle(document.body).color;
let overlayPromise = null;
let clearPromise = null;
let currentOverlay = null;
let overlayTimeout = null;

function checkAndUpdateAnchorColors() {
    let localBackgroundColor = getComputedStyle(document.body).backgroundColor;
    let localBodyFontColor = getComputedStyle(document.body).color;
    if (localBackgroundColor !== bodyBackgroundColor) {
        // Update all curator anchors
        document.querySelectorAll('.curator-custom-anchor').forEach(anchor => {
            anchor.style.color = localBodyFontColor;
        });
        bodyBackgroundColor = localBackgroundColor;
        bodyFontColor = localBodyFontColor;
    }
}

async function showOverlay(postInfo, curatorOverlayAnchor) {
    // Clear any existing overlay first
    if (currentOverlay) {
        currentOverlay.remove();
        currentOverlay = null;
    }

    // Create new overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-overlay-pane';
    overlay.style.backgroundColor = bodyBackgroundColor;
    overlay.style.color = bodyFontColor;

    const overlayContent = document.createElement('div');
    overlayContent.classList.add('overlay-content');
    let author;
    let permlink;
    if (postInfo) {
        author = postInfo.author;
        permlink = postInfo.permlink;
    } else {
        author = "";
        permlink = "";
        console.debug(`postInfo not set: ${postInfo}`);
    }

    let pending_payout_value, total_paid, botVoteCount, botVotePct, organicValue, formattedOrganicValue,
        wordCount, readingTime, category, postMetaData, links, tags, images, imageLength, linksLength,
        tagsLength, uniqueTags, tagString, depth=-1;

    try {
        result = await getContent(author, permlink);
        pending_payout_value = parseFloat(result.pending_payout_value);
        total_paid = 2 * parseFloat(result.curator_payout_value);

        botVoteCount = countBotVotes(result.active_votes);
        botVotePct = calculateBotRsharePercentage(result.active_votes);
        organicValue = (pending_payout_value + total_paid) * (1 - 0.01 * botVotePct);
        formattedOrganicValue = organicValue.toFixed(2);
        wordCount = getWordCount(result.body);
        readingTime = getReadingTime(wordCount);
        category = result.category;
        postMetaData = JSON.parse(result.json_metadata);
        links = postMetaData.links;
        tags = postMetaData.tags;
        images = postMetaData.image;
        imageLength = images ? images.length : 0;
        linksLength = links ? links.length : 0;
        uniqueTags = [...new Set([category, ...(tags || [])])].sort();
        tagsLength = uniqueTags.length;
        tagString = uniqueTags.slice(0, 10).join(", ");
        depth = result.depth;
    } catch (error) {
        console.warn("Error:", error);
    }

    let resteemers, resteemLength;
    try {
        sdsResponse = await getResteems(author, permlink);
        resteemers = sdsResponse.result.rows.map(row => row[1]);
        resteemLength = resteemers ? resteemers.length : 0;
        console.debug(resteemers);
    } catch (error) {
        console.warn(error);
    }

    // Execute network calls in parallel
    const [
        accountInfo,
        subscriberCount, 
        followerCount, 
        resteemReach, 
        {commentCount, postCount, replyCount}
    ] = await Promise.all([
        getAccountInfo(steemApi, author),
        category.match("hive-*") ? getCommunitySubscribersFromAPI(steemApi, category, "") : 0,
        getFollowerCountFromAPI(steemApi, author),
        calculateResteemReach(steemApi, resteemers, author),
        getPostAndCommentCountsForAccount(author)
    ]);
    
    const feedReach = ( depth === 0 ) ? subscriberCount + followerCount + resteemReach : 0;

    /** Wallet information */
    const vestingDetails = getVestingDetails(accountInfo);
    const ownVests = vestingDetails.vesting_shares;
    const effectiveVests = vestingDetails.vesting_shares - vestingDetails.delegated_vesting_shares + vestingDetails.received_vesting_shares;
    const pendingWithdrawals = (vestingDetails.to_withdraw - vestingDetails.withdrawn);
    const ownLevel = getVestingLevel(ownVests);
    const effectiveLevel = getVestingLevel(effectiveVests);
    const classDisplay = formatVestingLevels ( ownLevel, effectiveLevel );
    const powerdownPct = getPowerdownPercentage(pendingWithdrawals, ownVests);

    // Comments & replies per week of account life
    const created=accountInfo.result[0].created;
    const ageInDays=accountAge(created) / (1000 * 60 * 60 * 24);  // age in weeks (approx.)
    const commentsPerWeek = commentCount / (7 * ageInDays);
    const repliesPerWeek = replyCount / (7 * ageInDays);

    overlayContent.innerHTML = `
        <table>
            <tr>
                <th colspan="2"><b>Post Info</b></th>
            </tr>
            <tr>
                <td colspan="2">
                    <ul>
                        <li><b>Word count / Reading time:</b> ${wordCount} / ${readingTime} min.</li>
                        <li><b>[#images / #links / #tags]:</b> [${imageLength} / ${linksLength} / ${tagsLength}]</li>
                        <li><b>Tags:</b> ${tagString}</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <th><b>Audience</b></th>
                <th><b>Vote and Values</b></th>
            </tr>
            <tr>
                <td>
                    <ul>
                        <li><b># Resteems:</b> ${resteemLength}</li>
                        <li><b>Feed-reach:</b> ${feedReach}</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li><b># bots / % bots:</b> ${botVoteCount} / ${botVotePct}%</li>
                        <li><b>Organic value</b>:</b> ${formattedOrganicValue} SBD</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <th><b>Author Info</b></th>
                <th><b>Wallet Info</b></th>
            </tr>
            <tr>
                <td>
                    <ul>
                        <li><b>Posts:</b> ${postCount.toFixed(0)}</li>
                        <li><b>Comments / Post:</b> ${(commentCount / postCount).toFixed(2)}</li>
                        <li><b>Replies / Post:</b> ${(replyCount / postCount).toFixed(2)}</li>
                        <li><b>Age (days):</b> ${ageInDays.toFixed(0)}</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li><b>${classDisplay}</b> </li>
                        <li><b>Powerdown %:</b> ${powerdownPct.toFixed(2)} </li>
                    </ul>
                </td>
            </tr>
        </table>
    `;

    overlay.appendChild(overlayContent);

    // Track the new overlay
    currentOverlay = overlay;
    curatorOverlayAnchor.parentElement.appendChild(overlay);
    overlay.style.display = 'block';
    return overlay;
}

function clearAllOverlays() {
    // Remove all overlay panes, not just the tracked one
    const overlayElements = document.querySelectorAll('.custom-overlay-pane');
    overlayElements.forEach(overlay => {
        if (overlay) {
            overlay.remove();
        }
    });
    currentOverlay = null;
}

function addButtonsToSummaries() {
    const headers = document.querySelectorAll('div.articles__summary-header');

    headers.forEach(header => {
        if (!header.querySelector('.curator-custom-anchor')) {
            const overlayContainer = document.createElement('div');
            overlayContainer.className = 'overlay-container';

            const curatorOverlayAnchor = document.createElement('a');
            curatorOverlayAnchor.className = 'curator-custom-anchor';
            curatorOverlayAnchor.textContent = 'CURATION INFO';
            curatorOverlayAnchor.style.color = bodyFontColor;

            overlayContainer.appendChild(curatorOverlayAnchor);
            header.appendChild(overlayContainer);

            curatorOverlayAnchor.addEventListener('mouseenter', async () => {
                if (clearPromise) {
                    await clearPromise;
                    clearPromise = null;
                }

                clearTimeout(overlayTimeout);

                const summaryHeader = curatorOverlayAnchor.closest('.articles__summary-header');
                let link;

                if (summaryHeader) {
                    const postItem = summaryHeader.closest('li');
                    if (postItem) {
                        link = postItem.querySelector(
                            '.articles__content h2 > a, .articles__content .PostSummary__body.entry-content > a'
                        );
                    }
                }

                if (link && link.href) {
                    curatorOverlayAnchor.href = link.href;
                    const result = extractAuthorAndPermlink(curatorOverlayAnchor.href);
                    overlayTimeout = setTimeout(async () => {
                        overlayPromise = showOverlay(result, curatorOverlayAnchor);
                        await overlayPromise;
                    }, 150);
                }
            });

            curatorOverlayAnchor.addEventListener('mouseleave', async () => {
                if (overlayPromise) {
                    await overlayPromise;
                    overlayPromise = null;
                }

                clearTimeout(overlayTimeout);

                clearPromise = new Promise((resolve) => {
                    setTimeout(() => {
                        clearAllOverlays();
                        resolve();
                    }, 75);
                });
                await clearPromise;
            });
        }
    });
    checkAndUpdateAnchorColors();
}

function extractAuthorAndPermlink(url) {
    const regex = /\/@([^\/]+)\/([^\/]+)$/;
    const match = url.match(regex);

    if (match) {
        const author = match[1];
        const permlink = match[2];
        return { author, permlink };
    } else {
        console.log(`${url} did not match.`);
        return null;
    }
}

async function getContent(author, permlink) {
    const response = await fetch(steemApi, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "condenser_api.get_content",
            params: [author, permlink],
            id: 1
        })
    });

    const data = await response.json();
    return data.result;
}

async function getResteems(author, permlink) {
    sdsUrl = `${sdsEndpoint}/post_resteems_api/getResteems/${author}/${permlink}`;
    console.debug(sdsUrl);
    const response = await fetch(sdsUrl);
    const data = await response.json();
    return data;
}

async function getCommunityInfo(apiEndpoint, community, observer = "") {
    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'bridge.get_community',
            params: {
                name: community,
                observer: observer
            },
            id: 1
        })
    });

    const result = await response.json();
    return result.result;
}

/** Get subscriber count from communityInfo returned by getCommunityInfo() */
function getCommunitySubscribers(communityInfo) {
    return communityInfo.subscribers;
}

/** Get subscriber count by calling getCommunityInfo() */
async function getCommunitySubscribersFromAPI(apiEndpoint, community, observer = "") {
    const result = await getCommunityInfo(apiEndpoint, community, observer);
    return result.subscribers;
}

async function getFollowCount(apiEndpoint, account) {
    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_follow_count',
            params: [account],
            id: 1
        })
    });

    const result = await response.json();
    return result.result;
}

function getFollowerCount(followCountResult) {
    return followCountResult.follower_count;
}

async function getFollowerCountFromAPI(apiEndpoint, account) {
    const followCountResult = await getFollowCount(apiEndpoint, account);
    return followCountResult.follower_count;
}

async function calculateResteemReach(steemApi, resteemerList, author, initialFeedReach = 0) {
    let feedReach = initialFeedReach;

    const promises = resteemerList.map(async (resteemer) => {
        if ( resteemer != author ) {
            const resteemFeed = await getFollowerCountFromAPI(steemApi, resteemer);
            console.debug(`Resteemer: ${resteemer}, feedReach: ${feedReach}, resteemFeed: ${resteemFeed}`);
            feedReach += resteemFeed;
        } else {
            console.debug (`Skipping ${author}`);
        }
    });

    await Promise.all(promises);
    return feedReach;
}

const getExtendedStats = async (accountName) => {
    sdsUrl = `${sdsEndpoint}/accounts_api/getAccountExt/${accountName}`;
    const response = await fetch(sdsUrl);
    const data = await response.json();
    return data.result;
};

const getPostAndCommentCountsForAccount = async (accountName) => {
    const extendedStats = await getExtendedStats(accountName);
    return getPostAndCommentCounts(extendedStats);
};

const getPostAndCommentCounts = (extendedStats) => {
    return {
        commentCount: extendedStats.count_comments,
        postCount: extendedStats.count_root_posts,
        replyCount: extendedStats.count_replies
    };
};

async function getAccountInfo(steemApi, username) {
    try {
        const response = await fetch(steemApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_accounts',
                params: [[username]],
                id: 1
            })
        });
 
        return await response.json();
    } catch (error) {
        console.error('Error fetching account info:', error);
        throw error;
    }
 }
 
 function getVestingDetails(accountInfo) {
    if (!accountInfo?.result?.[0]) {
        throw new Error('Invalid account info object');
    }
 
    const account = accountInfo.result[0];
    return {
        vesting_shares: parseFloat(account.vesting_shares.split(' ')[0]),
        delegated_vesting_shares: parseFloat(account.delegated_vesting_shares.split(' ')[0]),
        received_vesting_shares: parseFloat(account.received_vesting_shares.split(' ')[0]),
        vesting_withdraw_rate: parseFloat(account.vesting_withdraw_rate.split(' ')[0]),
        to_withdraw: parseFloat(account.to_withdraw) / 1000000,
        withdrawn: parseFloat(account.withdrawn) / 1000000
    };
 }
 
 function getVestingLevel(vests) {
    const levels = [
        'nanoplankton',  // < 10K      (log10 < 4)
        'plankton',      // 10K-100K   (log10 < 5)
        'redfish',       // 100K-1M    (log10 < 6)
        'minnow',        // 1M-10M     (log10 < 7)
        'dolphin',       // 10M-100M   (log10 < 8)
        'orca',          // 100M-1B    (log10 < 9)
        'whale',         // 1B-10B     (log10 < 10)
        'blue whale'     // > 10B      (log10 >= 10)
    ];
    
    const index = Math.min(Math.floor(Math.log10(vests) - 3), 7);
    return levels[Math.max(0, index)];
}

function formatVestingLevels(ownLevel, effectiveLevel) {
    return ownLevel === effectiveLevel ? ownLevel : `${ownLevel} -> ${effectiveLevel}`;
 }

 function getPowerdownPercentage(pendingWithdrawals, vestingShares) {
    if (vestingShares === 0) return 0;
    return (pendingWithdrawals / vestingShares) * 100;
 }

 function accountAge(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    return diff;
  }
  