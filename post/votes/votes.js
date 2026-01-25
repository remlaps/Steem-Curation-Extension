let _sceVoterTipsBound = false;

const attachVoterHoverTooltips = (post, language, days = 7) => {
    const votersUL = document.querySelector('.Voting__voters_list ul.VerticalMenu.menu.vertical');
    if (!votersUL) return;

    const postCache = new Map();
    const keyFor = (a, p) => `${a}/${p}`

    const getPostCached = (author, permlink, time) => {
        const key = keyFor(author, permlink);
        if (!postCache.has(key)){
            postCache.set(key, (async () => {
                const p = new Post(author, permlink);
                await p.fetchDetails();
                await p.getVoteData();
                await p.getTotalVests(time);

                return p;
            })());
        }
        return postCache.get(key);
    };

    const voteItems = votersUL.querySelectorAll('li.vote-item');
    const tips = [];
    const tipByLi = new WeakMap();



    for (let i = 0; i < voteItems.length; i++) {
        const item = voteItems[i];
        const usernameEl = item.querySelector('.vote-username');
        if (!usernameEl) return;

        const username = usernameEl.textContent.trim();
        const vote = post.details.active_votes.find((v) => v.voter === username);
        if (!vote) return;

        const tip = new VoterTip({
            li: item, 
            post: post, 
            getPostCached: getPostCached, 
            language: language,
            vote: vote,
            days: days
        });
        tipByLi.set(item, tip);
        tips.push(tip);

    };

    if (_sceVoterTipsBound) return tips;
    _sceVoterTipsBound = true;

    let currentLi = null;
    let activeDownloadTip = null;
    let downloadTimeout = null;

    votersUL.addEventListener('mouseover', (e) => {
        if (e.target.closest('.voter-tooltip')) return;
        console.log('moused over!')

        const li = e.target.closest('li.vote-item');
        if (!li || li === currentLi || !votersUL.contains(li)) return;
        
        const tip = tipByLi.get(li);
        if (!tip) return;
        
        // Clear any pending download timeout
        if (downloadTimeout) {
            clearTimeout(downloadTimeout);
            downloadTimeout = null;
        }
        
        // If hovering over a different voter than the one currently downloading
        if (activeDownloadTip && activeDownloadTip !== tip) {
            // Cancel the previous download
            activeDownloadTip.cancelDownload();
        }
        
        if (currentLi) tipByLi.get(currentLi)?.hide();
        currentLi = li;
        tip.show();
        
        // Start download after 100ms delay (1/10 of a second)
        // Start download if this is a different tip, or if the current tip's download was cancelled
        if (activeDownloadTip !== tip || (activeDownloadTip === tip && tip.isCancelled)) {
            tip.resetCancellation();
            downloadTimeout = setTimeout(() => {
                // Start download (non-blocking - don't await)
                tip.prefetchEfficiencyData().catch(err => {
                    console.error('Error downloading efficiency data:', err);
                });
                activeDownloadTip = tip;
                downloadTimeout = null;
            }, 100);
        }

    });

    votersUL.addEventListener('mouseout', (e) => {
        if (e.relatedTarget && (e.currentTarget.contains(e.relatedTarget) ||
            e.relatedTarget.closest?.('.voter-tooltip'))
        ) {
                return;
        };
        const li = e.target.closest('li.vote-item');
        if (!li || li !== currentLi) return;
        const toEl = e.relatedTarget;
        if (!toEl || !li.contains(toEl)) {
            // Clear any pending download timeout if user moves away before delay completes
            if (downloadTimeout) {
                clearTimeout(downloadTimeout);
                downloadTimeout = null;
            }
            // Only hide the tooltip, don't cancel the download
            tipByLi.get(li)?.hide();
            currentLi = null;
        }
    });
    return tips;
};

const getTipEfficiency = async(tips) => {
    for (const tip of tips){
        await tip.prefetchEfficiencyData();
    }
}

const getHistoricCurationRewards = async (voter, post, days) => {
    const created = new Date(post.details.created);

    const createdMs = created.getTime();

    const oneDay = 24 * 60 * 60 * 1000
    const timeSpan = days * oneDay

    const dayBeforeMs = createdMs - oneDay;
    const weekBeforeDayBeforeMs = dayBeforeMs - timeSpan;

    const upperDay = Math.floor(dayBeforeMs / 1000);
    const lowerDay = Math.floor(weekBeforeDayBeforeMs / 1000);

    try {
        const url = `https://sds.steemworld.org/rewards_api/getRewards/curation_reward/${voter}/${lowerDay}-${upperDay}`;

        // Make the request
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        // Parse JSON response
        const data = await response.json();
        return data.result;

    } catch (error) {
        console.error("Error fetching curation rewards:", error);
    return null;
  }
}

const loadPostVoteData = (post) => {
    const votingClass = document.getElementsByClassName('Voting__voters_list');

    if (votingClass.length > 0) {
        // Access the first element with the class 'Voting__voters_list'
        const votingElement = votingClass[0]; // Index may change in future updates!

        // Find the <ul> with the specified classes inside the 'Voting' element
        const voters_list = votingElement.querySelector('ul.VerticalMenu.menu.vertical');

        if (voters_list) {
            const listItems = voters_list.querySelectorAll('li');

            if (listItems) {
                listItems.forEach((item) => {

                    // Extract the username from the textContent (assumes format "+ username")
                    const username = item.textContent.split(' ')[1].trim()

                    // Find the corresponding vote in the activeVotes list
                    const vote = post.details.active_votes.find(v => v.voter === username);

                    if (vote) {
                        // Reformat the text content
                        const first_digit = item.textContent.split(' ')[0];
                        const percent = (vote.percent / 100).toFixed(0);

                        // Add a custom class to style the list items
                        item.classList.add('vote-item');

                        // Format and update the text content with a clickable link for the username
                        if (vote.value > 0) {
                            item.innerHTML = `
                                        <span class="vote-value">$${vote.value.toFixed(2)}</span>
                                        <span class="vote-percentage">(${vote.percentage}%)</span>
                                        <a href="/@${username}" class="vote-username">${username}</a>
                                        <span class="vote-weight">(${percent}% weight)</span>
                                    `;
                        } else {
                            item.innerHTML = `
                                        <a href="/@${username}" class="vote-username">${username}</a>
                                        <span class="vote-weight">(${percent}% weight)</span>
                                    `;
                        }

                    }
                });
            }
        } else {
            console.log('SCE: Unordered list not found within votingClass element.');
        }
    } else {
        console.log('SCE: Element with class "Voting__voters_list" not found.');
    }
}

