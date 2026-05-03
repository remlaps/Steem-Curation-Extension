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

// Prevent observer recursion when we update anchor colors
checkAndUpdateAnchorColors = withSilentMutations(checkAndUpdateAnchorColors);

async function showOverlay(postInfo, curatorOverlayAnchor, user_lang = 'en') {
    clearAllOverlays();

    // Create new overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-overlay-pane';
    overlay.style.backgroundColor = bodyBackgroundColor;
    overlay.style.color = bodyFontColor;
    overlay.innerHTML = '<div class="overlay-content">Loading...</div>';
    
    curatorOverlayAnchor.parentElement.appendChild(overlay);
    overlay.style.display = 'block';
    currentOverlay = overlay;

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

    let pending_payout_value = 0, total_paid = 0, totalValue = 0, botVoteCount = 0, botVotePct = 0, steemitVoteCount = 0, steemitVotePct = 0,
        organicValue = 0, formattedOrganicValue = "0.00", wordCount = 0, readingTime = 0, 
        category = "", imageLength = 0, linksLength = 0, tagsLength = 0, tagString = "", depth = -1;

    let result;
    try {
        result = await getContent(author, permlink);
        if (!result) throw new Error("Content not found");

        pending_payout_value = parseFloat(result.pending_payout_value);
        total_paid = 2 * parseFloat(result.curator_payout_value);
        totalValue = pending_payout_value + total_paid;

        botVoteCount = countVotes(result.active_votes);
        botVotePct = calculateRsharePercentage(result.active_votes);
        steemitVoteCount = countVotes(result.active_votes, steemitList);
        steemitVotePct = calculateRsharePercentage(result.active_votes, steemitList);
        organicValue = totalValue * (1 - 0.01 * botVotePct);
        formattedOrganicValue = organicValue.toFixed(2);
        wordCount = getWordCount(result.body);
        readingTime = getReadingTime(wordCount);
        category = result.category || "";
        const postMetaData = result.json_metadata ? JSON.parse(result.json_metadata) : {};
        const links = postMetaData.links;
        const tags = postMetaData.tags;
        const images = postMetaData.image;
        imageLength = images ? images.length : 0;
        linksLength = links ? links.length : 0;
        const uniqueTags = [...new Set([category, ...(tags || [])])].filter(Boolean).sort();
        tagsLength = uniqueTags.length;
        tagString = uniqueTags.slice(0, 10).join(", ");
        depth = result.depth;
    } catch (error) {
        console.warn("Error:", error);
    }

    let resteemers = [], resteemLength = 0;
    try {
        const sdsResponse = await getResteems(author, permlink);
        if (sdsResponse?.result?.rows) {
            resteemers = sdsResponse.result.rows.map(row => row[1]);
            resteemLength = resteemers.length;
        }
        console.debug(resteemers);
    } catch (error) {
        console.warn(error);
    }

    // Execute network calls in parallel
    const uniqueReachSet = new Set();

    let accountInfo, communitySubscribers = [], authorFollowers = [], 
        commentCount = 0, postCount = 1, replyCount = 0;

    try {
        const statsPromise = getPostAndCommentCountsForAccount(author);
        const results = await Promise.allSettled([
            getAccountInfo(steemApi, author),
            (category && category.startsWith("hive-")) ? getCommunitySubscriberNamesSDS(category) : Promise.resolve([]),
            getFollowerNamesSDS(author),
            statsPromise
        ]);

        accountInfo = results[0].status === 'fulfilled' ? results[0].value : null;
        communitySubscribers = results[1].status === 'fulfilled' ? results[1].value : [];
        authorFollowers = results[2].status === 'fulfilled' ? results[2].value : [];
        
        if (results[3].status === 'fulfilled') {
            const stats = results[3].value;
            commentCount = stats.commentCount;
            postCount = stats.postCount || 1;
            replyCount = stats.replyCount;
        }
    } catch (e) {
        console.warn("Overlay network aggregation failed:", e);
    }

    authorFollowers.forEach(name => uniqueReachSet.add(name));
    communitySubscribers.forEach(name => uniqueReachSet.add(name));

    if (depth === 0) {
        try {
            await calculateResteemReach(resteemers, author, uniqueReachSet);
        } catch (e) {
            console.warn("Could not calculate complete resteem reach due to network error:", e);
        }
    }

    // Use loose equality or Number cast to handle cases where API returns depth as a string
    const feedReach = ( Number(depth) === 0 ) ? uniqueReachSet.size : 0;
    const dollarsPerFeed = ( feedReach === 0 ) ? "---" : (totalValue / feedReach).toFixed(5);

    /** Wallet information */
    const vestingDetails = accountInfo ? getVestingDetails(accountInfo) : null;
    const ownVests = vestingDetails?.vesting_shares || 0;
    const effectiveVests = ownVests - (vestingDetails?.delegated_vesting_shares || 0) + (vestingDetails?.received_vesting_shares || 0);
    const pendingWithdrawals = ((vestingDetails?.to_withdraw || 0) - (vestingDetails?.withdrawn || 0));
    const ownLevel = getVestingLevel(ownVests);
    const effectiveLevel = getVestingLevel(effectiveVests);
    const classDisplay = formatVestingLevels ( ownLevel, effectiveLevel );
    const powerdownPct = getPowerdownPercentage(pendingWithdrawals, ownVests);

    // Comments & replies per week of account life
    const created = accountInfo?.result?.[0]?.created || new Date().toISOString();
    const ageInDays=accountAge(created) / (1000 * 60 * 60 * 24);  // age in weeks (approx.)
    const commentsPerWeek = commentCount / (7 * ageInDays);
    const repliesPerWeek = replyCount / (7 * ageInDays);

    const curationLabels = getCurationOverlayInLang(user_lang);
    const steemitVoteLabel = steemitVoteCount === 1 ? curationLabels.vote : curationLabels.votes;

    overlay.innerHTML = '';
    overlayContent.innerHTML = `
        <table>
            <tr>
                <th colspan="2"><b>${curationLabels.postInfo}</b></th>
            </tr>
            <tr>
                <td colspan="2">
                    <ul>
                        <li><b>${curationLabels.wordCountReadingTime}</b> ${wordCount} / ${readingTime} ${curationLabels.min}</li>
                        <li><b>${curationLabels.imagesLinksTags}</b> [${imageLength} / ${linksLength} / ${tagsLength}]</li>
                        <li><b>${curationLabels.tags}</b> ${tagString}</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <th><b>${curationLabels.audienceVotesValues}</b></th>
            </tr>
            <tr>
                <td>
                    <ul>
                        <li><b>${curationLabels.resteems}</b> ${resteemLength}</li>
                        <li><b>${curationLabels.feedReach}</b> ${feedReach}</li>
                        <li><b>${curationLabels.dollarsPerFeed}</b> ${dollarsPerFeed}</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li><b>${curationLabels.bots}</b> ${botVoteCount} / ${botVotePct}%</li>
                        <li><b>${curationLabels.steemit}</b> ${steemitVoteCount} ${steemitVoteLabel} / ${steemitVotePct}%</li>
                        <li><b>${curationLabels.organicValue}:</b> ${formattedOrganicValue} SBD</li>
                    </ul>
                </td>
            </tr>
            <tr>
                <th><b>${curationLabels.authorInfo}</b></th>
                <th><b>${curationLabels.walletInfo}</b></th>
            </tr>
            <tr>
                <td>
                    <ul>
                        <li><b>${curationLabels.posts}</b> ${postCount.toFixed(0)}</li>
                        <li><b>${curationLabels.commentsPost}</b> ${(commentCount / postCount).toFixed(2)}</li>
                        <li><b>${curationLabels.repliesPost}</b> ${(replyCount / ( postCount + commentCount )).toFixed(2)}</li>
                    </ul>
                </td>
                <td>
                    <ul>
                        <li><b>${classDisplay}</b> </li>
                        <li><b>${curationLabels.powerdown}</b> ${powerdownPct.toFixed(2)} </li>
                    </ul>
                </td>
            </tr>
        </table>
    `;

    overlay.appendChild(overlayContent);
    return overlay;
}

// Wrap async overlay creation to silence mutations during its DOM work
showOverlay = withSilentMutationsAsync(showOverlay);

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

// Clearing overlays touches the DOM; silence mutations while doing so
clearAllOverlays = withSilentMutations(clearAllOverlays);

function addButtonsToSummaries() {
    const headers = document.querySelectorAll('div.articles__summary-header');
    const user_lang = detectUserLanguage() || 'en';
    const curationLabels = getCurationOverlayInLang(user_lang);

    headers.forEach(header => {
        if (!header.querySelector('.curator-custom-anchor')) {
            const overlayContainer = document.createElement('div');
            overlayContainer.className = 'overlay-container';

            const curatorOverlayAnchor = document.createElement('span');
            curatorOverlayAnchor.className = 'curator-custom-anchor';
            curatorOverlayAnchor.textContent = curationLabels.curationInfo;
            curatorOverlayAnchor.style.color = bodyFontColor;
            curatorOverlayAnchor.style.cursor = 'pointer';
            curatorOverlayAnchor.style.textDecoration = 'underline';

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
                    const result = extractAuthorAndPermlink(link.href);
                    const currentLang = detectUserLanguage() || 'en';
                    overlayTimeout = setTimeout(async () => {
                        overlayPromise = showOverlay(result, curatorOverlayAnchor, currentLang);
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
// Creating buttons/anchors modifies the page; wrap to avoid re-triggering observer
addButtonsToSummaries = withSilentMutations(addButtonsToSummaries);

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
    const data = await fetchProxy(steemApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "condenser_api.get_content",
            params: [author, permlink],
            id: 1
        })
    });

    return data.result;
}

async function getCommunityInfo(apiEndpoint, community, observer = "") {
    const result = await fetchProxy(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const result = await fetchProxy(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_follow_count',
            params: [account],
            id: 1
        })
    });

    return result.result;
}

function getFollowerCount(followCountResult) {
    return followCountResult.follower_count;
}

async function getFollowerCountFromAPI(apiEndpoint, account) {
    const followCountResult = await getFollowCount(apiEndpoint, account);
    return followCountResult.follower_count;
}

async function calculateResteemReach(resteemerList, author, uniqueReachSet) {
    if (!resteemerList || !Array.isArray(resteemerList)) return;
    const promises = resteemerList.map(async (resteemer) => {
        if ( resteemer != author ) {
            const followers = await getFollowerNamesSDS(resteemer);
            followers.forEach(name => uniqueReachSet.add(name));
        } else {
            console.debug (`Skipping ${author}`);
        }
    });

    await Promise.all(promises);
}

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
        return await fetchProxy(steemApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'condenser_api.get_accounts',
                params: [[username]],
                id: 1
            })
        });
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
  