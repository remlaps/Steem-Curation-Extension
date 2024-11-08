/*
 * Overlay functions
 */
let bodyBackgroundColor = getComputedStyle(document.body).backgroundColor;
let bodyFontColor = getComputedStyle(document.body).color;

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

async function showOverlay(postInfo, curatorOverlayAnchor ) {
    // Get existing overlay or create new one
    let overlay = curatorOverlayAnchor.parentElement.querySelector('.custom-overlay-pane');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'custom-overlay-pane';
        overlay.style.backgroundColor = bodyBackgroundColor;
        overlay.style.color = bodyFontColor;

        // Create header section
        // const overlayHeader = document.createElement('div');
        // overlayHeader.className = 'overlay-header';
        
        // const overLayTitle = document.createElement('p');
        // overLayTitle.textContent = 'Info4Curators';
        // overLayTitle.classList.add('overlay-title');
        
        // overlayHeader.appendChild(overLayTitle);

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

        let pending_payout_value, total_paid, botVoteCount, botVotePct, organicValue, formattedOrganicValue,
            wordCount, readingTime, category, postMetaData, links, tags, images, imageLength, linksLength,
            tagsLength, uniqueTags, tagString;

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
            tagsLength = Array.isArray(tags) && tags.length || (tags ? 1 : 0); // Include "category" as a tag
            uniqueTags = [...new Set([category, ...(tags || [])])].sort();
            tagString = uniqueTags.slice(0, 6).join(", ");
        } catch (error) {
            console.warn("Error:", error);
        }

        let resteemers, resteemLength;
        try {
            sdsResponse = await getResteems(author, permlink);
            resteemers = sdsResponse.result.rows.map(row => row[1]);
            resteemLength = resteemers ? resteemers.length : 0;
        } catch (error ) {
            console.warn(error);
        }

        overlayContent.innerHTML = `
            <p><b></i>Post Information</i></b></p>
            <ul>
            <li><b>Word count / Reading time:</b> ${wordCount} / ${readingTime} min.</li>
            <li><b>#images:</b> ${imageLength} / <b>#links</b>: ${linksLength} / <b>#tags:</b> ${tagsLength}</li>
            <li><b>Tags:</b> ${tagString}</li>
            </ul>
            <p></p><p><b><i>Influence and Audience</i></b></p>
            <ul>
            <li><b># Resteems:</b> ${resteemLength}</li>
            </ul>
            <p></p><p><b><i>Vote and Value Information</i></b></p>
            <ul>
            <li><b>Bot count / Paid pct:</b> ${botVoteCount} / ${botVotePct}%</li>
            <li><b>Organic value</b>: ${formattedOrganicValue} SBD</li>
            </ul>
            <!-- Add more information here as needed -->
        `;

        // overlay.appendChild(overlayHeader);
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

async function getResteems(author, permlink) {
    sdsUrl=`${sdsEndpoint}/post_resteems_api/getResteems/${author}/${permlink}`;
    console.debug(sdsUrl);
    const response = await fetch (sdsUrl);

    const data = await response.json();
    return data;
}
