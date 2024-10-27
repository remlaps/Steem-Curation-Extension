/*
 * Overlay functions
 */
const bodyBackgroundColor = getComputedStyle(document.body).backgroundColor;
const bodyFontColor = getComputedStyle(document.body).color;

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
        overLayTitle.textContent = 'Overlay title';
        overLayTitle.classList.add('overlay-title');
        
        overlayHeader.appendChild(overLayTitle);

        // Create content section
        const overlayContent = document.createElement('div');
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

                botVoteCount = countBotVotes( result.active_votes );

                overlayContent.innerHTML = `
                <p>Author: ${author}</p>
                <p>PermLink: ${permlink}</p>
                <p>Vote count: ${result.net_votes}</p>
                <p>Bot vote count: ${botVoteCount};
                <!-- Add more information here as needed -->
                `;
                console.log(result);
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

            const summaryHeader = curatorOverlayAnchor.closest('.articles__summary-header');
            let link;
            if ( summaryHeader ) {
                console.debug("Got summary header.");
                const closest = curatorOverlayAnchor.closest('.articles__summary-header'); // Get the closest articles__summary-header
                if ( closest ) {
                    console.debug("Got closest");
                    link = closest.parentElement // Go up to the parent of articles__summary-header
                    .querySelector('.articles__content a.articles__link'); // Find the articles__link inside articles__content
                }
            }

            let result;
            if ( link && link.href ) {
                curatorOverlayAnchor.href=link.href;
                result = extractAuthorAndPermlink(curatorOverlayAnchor.href);
                console.log(result); // { author: 'AUTHOR', permlink: 'PERMLINK' }
            } else {
                console.debug(`Couldn't proces: ${result}, link: ${link}`);
                curatorOverlayAnchor.href="";
            }




            curatorOverlayAnchor.addEventListener('mouseover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const someInfo = result;
                showOverlay(someInfo, curatorOverlayAnchor, result );
            });

            curatorOverlayAnchor.addEventListener('mouseout', (e) => {
                e.preventDefault();
                e.stopPropagation();
            
                const overlay = document.querySelector('.custom-overlay-pane');
                if (overlay) {
                    overlay.remove(); // This will remove the overlay from the DOM
                }
            });

        }
    });
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
    const response = await fetch("https://api.steemit.com", {
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

/*
 * Example call of getContent()
 */
// getContent("remaps-lite", "what-info-would-you-want")
//     .then(result => console.log(result))
//     .catch(error => console.error("Error:", error));
