/*
 * Overlay functions
 */
let bodyBackgroundColor = getComputedStyle(document.body).backgroundColor;
let bodyFontColor = getComputedStyle(document.body).color;

function checkAndUpdateAnchorColors() {
    let localBackgroundColor = getComputedStyle(document.body).backgroundColor;
    let localBodyFontColor = getComputedStyle(document.body).color;
    console.debug("Inside: checkAndUpdateAnchorColors()");
    if (localBackgroundColor !== bodyBackgroundColor) {
        // Update all curator anchors
        console.debug("Changing colors");
        document.querySelectorAll('.curator-custom-anchor').forEach(anchor => {
            anchor.style.color = localBodyFontColor;
        });
        bodyBackgroundColor = localBackgroundColor;
    }
}

function showOverlay(postInfo, curatorOverlayAnchor ) {
    // Get existing overlay or create new one
    let overlay = curatorOverlayAnchor.parentElement.querySelector('.custom-overlay-pane');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'custom-overlay-pane';
        overlay.style.backgroundColor = bodyBackgroundColor;
        overlay.style.color = bodyFontColor;

        // Create header section
        const overlayHeader = document.createElement('div');
        overlayHeader.className = 'overlay-header';
        
        const overLayTitle = document.createElement('p');
        overLayTitle.textContent = 'Info4Curators';
        overLayTitle.classList.add('overlay-title');
        
        overlayHeader.appendChild(overLayTitle);

        // Create content section
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

        getContent(author, permlink)
            .then(result => {
                // this should probably be a function.  It's getting lengthy.
                const pending_payout_value = parseFloat(result.pending_payout_value);
                const total_paid = 2 * parseFloat(result.curator_payout_value);

                const botVoteCount = countBotVotes( result.active_votes );
                const botVotePct = calculateBotRsharePercentage(result.active_votes);
                const organicValue = ( pending_payout_value  + total_paid ) * ( 1 - 0.01 * botVotePct);
                const formattedOrganicValue = organicValue.toFixed(2);
                const wordCount = getWordCount(result.body);
                const readingTime = getReadingTime(wordCount);

                    // <p>Author: ${author}</p>
                    // <p>PermLink: ${permlink}</p>
                overlayContent.innerHTML = `
                    <p><b></i>Post Information</i></b></p>
                    <ul>
                    <li><b>Word count / Reading time:</b> ${wordCount} / ${readingTime} minutes</li>
                    </ul>
                    <p></p><p><b><i>Vote and Value Information</i></b></p>
                    <ul>
                    <li><b>Bot count / Paid pct:</b> ${botVoteCount} / ${botVotePct}%</li>
                    <li><b>Organic value</b>: ${formattedOrganicValue} SBD</li>
                    </ul>
                    <!-- Add more information here as needed -->
                `;
            })
            .catch(error => {
                console.error("Error:", error)
            });

        overlay.appendChild(overlayHeader);
        overlay.appendChild(overlayContent);
        
        // Add overlay to the anchor's container
        curatorOverlayAnchor.parentElement.appendChild(overlay);
    }

    overlay.style.display = 'block';
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

            curatorOverlayAnchor.addEventListener('mouseover', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Get fresh data on each mouseover
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

                let result;
                if (link && link.href) {
                    curatorOverlayAnchor.href = link.href;
                    result = extractAuthorAndPermlink(curatorOverlayAnchor.href);
                    showOverlay(result, curatorOverlayAnchor, result);
                } else {
                    console.debug(`Couldn't process: link not found`);
                    curatorOverlayAnchor.href = "";
                }
            });

            curatorOverlayAnchor.addEventListener('mouseout', (e) => {
                e.preventDefault();
                e.stopPropagation();
            
                const overlay = document.querySelector('.custom-overlay-pane');
                if (overlay) {
                    overlay.remove();
                }
            });
        }
    });
    checkAndUpdateAnchorColors();
}

function extractAuthorAndPermlink(url) {
    const regex = /\/@([^\/]+)\/([^\/]+)$/; // Matches "@username/permlink" at the end
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
    return data.result;  // Equivalent to `jq -S .result`
}
