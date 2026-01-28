const loadPost = async (p_info, language) => {
    const postClass = document.querySelector('.Post');

    if (postClass) {
        let url = window.location.pathname;
        url = url.split('@')[1];
        const author = url.split('/')[0];
        const permlink = url.split('/')[1];
        const post = await Post.create(author, permlink);

        if (post) {
            const samePost = (p_info && p_info.author === author && p_info.permlink === permlink);
            
            // Check if extension elements exist (they might have been removed by React re-render)
            const wordCountInfo = document.querySelector('.word-count-info');
            const needsReinit = !samePost || !wordCountInfo;

            if (needsReinit) {
                _sceVoterTipsBound = false;
                displayWordCountAndReadingTime("PostFull__time_author_category_large", post.details.wordCount, post.details.readingTimeMinutes, language)
                loadPostValueGraph(post, language);
                loadPostVoteGraph(post, language);
                const payouts = await loadAuthorWeeklyEarningsGraph(post, language);
                if (payouts) {
                    loadAuthorWeeklyEarningsBarGraph(payouts, language);
                }
                loadPostVoteData(post);
                displayPostResteemData(post, ".RightShare__Menu");
                tips = attachVoterHoverTooltips(post, language, 7);
            } else {
                return p_info
            }

        } else {
            console.log('There was a problem loading the post data!');
        }
        return { "author": author, "permlink": permlink }
    } else {
        return { "author": null, "permlink": null }
    }
};

/**
 * Display word count and reading time in the specified container.
 * @param {string} containerClass - The class where the info will be appended.
 * @param {number} wordCount - The total word count of the content.
 * @param {number} readingTimeMinutes - The reading time in minutes.
 * @param {string} user_lang - The user's language code.
 */
const displayWordCountAndReadingTime = (containerClass, wordCount, readingTimeMinutes, user_lang = 'en') => {
    console.log("entered function");
    const container = document.querySelector(`.${containerClass}`);
    if (!container) {
        console.log(`Container with class "${containerClass}" not found.`);
        return;
    }

    // Remove existing word count and reading time (if any) to avoid duplication
    const existingInfo = container.querySelector('.word-count-info');
    if (existingInfo) {
        existingInfo.remove();
    }

    const timeMetrics = getWordTimeMetricsInLang(user_lang);

    // Create a wrapper for the info
    const infoWrapper = document.createElement('div');
    infoWrapper.className = 'word-count-info';
    infoWrapper.style.display = 'flex';
    infoWrapper.style.alignItems = 'center';
    infoWrapper.style.gap = '10px'; // Reduce the gap between sections
    infoWrapper.style.marginTop = '5px'; // Slightly smaller margin

    // Create word count section
    const wordCountSection = document.createElement('div');
    wordCountSection.style.display = 'flex';
    wordCountSection.style.alignItems = 'center';
    wordCountSection.style.gap = '3px'; // Reduce gap between icon and text

    const wordIcon = document.createElement('span');
    wordIcon.innerHTML = '📄'; // Replace with your desired icon
    wordIcon.style.fontSize = '14px'; // Slightly smaller icon size

    const wordCountText = document.createElement('span');
    wordCountText.textContent = `${wordCount.toLocaleString()} ${timeMetrics.words}`;
    wordCountText.style.fontSize = '12px'; // Reduce font size for better fit

    wordCountSection.appendChild(wordIcon);
    wordCountSection.appendChild(wordCountText);

    // Create reading time section
    const readingTimeSection = document.createElement('div');
    readingTimeSection.style.display = 'flex';
    readingTimeSection.style.alignItems = 'center';
    readingTimeSection.style.gap = '3px'; // Reduce gap between icon and text

    const clockIcon = document.createElement('span');
    clockIcon.innerHTML = '⏱️'; // Replace with your desired icon
    clockIcon.style.fontSize = '14px'; // Slightly smaller icon size

    const readingTimeText = document.createElement('span');
    readingTimeText.textContent = `${readingTimeMinutes} ${timeMetrics.minRead}`;
    readingTimeText.style.fontSize = '12px'; // Reduce font size for better fit

    readingTimeSection.appendChild(clockIcon);
    readingTimeSection.appendChild(readingTimeText);

    // Append both sections to the wrapper
    infoWrapper.appendChild(wordCountSection);
    infoWrapper.appendChild(readingTimeSection);

    // Append the wrapper to the container
    container.appendChild(infoWrapper);
};


/**
 * Load a graph displaying total payouts with post numbers on the X-axis.
 * Clicking a dot navigates to the corresponding post.
 * @param {Array} payouts - Array of Post class objects, already sorted from oldest to newest.
 * @param {string} user_lang - The user's language code.
 */
const loadAuthorWeeklyEarningsGraph = async (post, user_lang = 'en') => {
    console.log(`Fetching payouts for ${post.details.author}`);
    const payouts = await getAuthorPayoutsInWeekBefore(post.details.author, post.details.created);

    if (payouts.length === 1) {
        console.log("Only 1 payout in last week");
        return payouts;
    } else if (payouts.length === 0) {
        return null
    }

    // Prepare data for the graph
    const timeLabels = payouts.map((_, index) => `${index + 1}`); // Post 1, Post 2, etc.
    const payoutValues = payouts.map(payout => payout.details.total_payout_value); // Use total_value for Y-axis
    console.log(payoutValues)

    // Create the graph
    const graphContainerClass = 'c-sidebr-market';
    const canvasId = 'authorPayoutGraph';
    const graphTitles = getGraphTitlesInLang(user_lang);
    const graphLabels = getGraphLabelsInLang(user_lang);
    const graphTitle = graphTitles.previousWeekPayouts;
    const yAxisLabel = `${graphLabels.payout} ($)`;

    createLineGraphWithClickableDots(
        graphContainerClass,
        canvasId,
        graphTitle,
        timeLabels,
        payoutValues,
        yAxisLabel,
        payouts,
        user_lang
    );

    return payouts
};

/**
 * Load a bar graph displaying the sums of total, organic, and burn values for the last week.
 * @param {Array} payouts - Array of Post class objects with `total_value`, `organic_payout_value`, and `burn_payout_value`.
 * @param {string} user_lang - The user's language code.
 */
const loadAuthorWeeklyEarningsBarGraph = (payouts, user_lang = 'en') => {
    if (payouts.length === 0) {
        console.warn("No payouts to display in the bar graph.");
        return;
    }

    // Calculate the sums
    const totalSum = payouts.reduce((sum, payout) => sum + payout.details.total_payout_value, 0);
    const organicSum = payouts.reduce((sum, payout) => sum + (payout.details.organic_payout_value || 0), 0);
    const burnSum = payouts.reduce((sum, payout) => sum + (payout.details.burn_payout_value || 0), 0);

    console.log({ totalSum, organicSum, burnSum });

    if (totalSum === 0) {
        console.log("Total Value 0")
        return
    }

    const graphTitles = getGraphTitlesInLang(user_lang);
    const graphLabels = getGraphLabelsInLang(user_lang);

    const xAxisLabels = [graphTitles.totalValue];
    const dataValues = [totalSum];
    const colors = ['rgba(22, 216, 174, 0.4)']; // Steemit green/cyan to match efficiency scatter
    if (organicSum > 0) {
        xAxisLabels.push(graphTitles.organicValue);
        dataValues.push(organicSum);
        colors.push('rgba(34, 197, 94, 0.4)') // Vibrant green for organic plants
    }
    if (burnSum > 0) {
        xAxisLabels.push(graphTitles.burnValue)
        dataValues.push(burnSum)
        colors.push('rgba(239, 68, 68, 0.4)') // Vibrant red for burning
    }


    // Create the graph
    const graphContainerClass = 'c-sidebr-market';
    const canvasId = 'weeklyEarningsBarGraph';
    const graphTitle = graphTitles.weekPayoutSummary;
    const yAxisLabel = `${graphLabels.payout} ($)`;

    createBarGraph(graphContainerClass, canvasId, graphTitle, xAxisLabels, dataValues, yAxisLabel, colors, user_lang);
};


const displayPostResteemData = async (post, anchorClassSelector) => {
    const res = await getResteems(post.author, post.permlink)
    const resteems = res.result.rows
    if (resteems.length === 0) {
        return
    }

    const anchorElement = document.querySelector(anchorClassSelector);
    if (!anchorElement) {
        console.warn(`Element with class "${anchorClassSelector}" not found.`);
        return;
    }

    const existingDropdown = anchorElement.querySelector('.sce-resteem-dropdown-container');
    if (existingDropdown) {
        console.log("SCE: Resteem dropdown already exists for this post (relative positioning).");
        return;
    }

    // Create the dropdown container
    const dropdownContainer = document.createElement('span');
    dropdownContainer.className = 'DropdownMenu';
    dropdownContainer.style.display = 'inline-block';
    // dropdownContainer.style.position = 'relative';
    // dropdownContainer.style.left = '55%'; // Adjust '335px' as needed (positive value moves right) - TODO: anchor location to resteem button.
    // dropdownContainer.style.top = '0';
    // dropdownContainer.style.marginLeft = 0;

    // Create the dropdown trigger as an anchor element
    const dropdownTrigger = document.createElement('a');
    dropdownTrigger.href = '#'; // Set href to "#" to emulate an anchor
    dropdownTrigger.className = 'resteem-dropdown-trigger';
    dropdownTrigger.style.display = 'flex';
    dropdownTrigger.style.alignItems = 'center';

    // Add an event listener to the dropdown menu to prevent snap-back to the top
    dropdownTrigger.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default anchor behavior
        dropdownMenu.classList.toggle('visible');
    });

    // Create an SVG element for the triangle icon
    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgIcon.setAttribute("width", "16"); // Set the width of the icon
    svgIcon.setAttribute("height", "16"); // Set the height of the icon
    svgIcon.setAttribute("viewBox", "8 8 512 512"); // Set the view box for the SVG
    svgIcon.classList.add('triangle-icon'); // Add a class for styling

    // Create the polygon element for the triangle
    const triangle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    triangle.setAttribute("points", "128,90 256,218 384,90");
    triangle.setAttribute("fill", "currentColor"); // Use current color for the fill

    // Append the triangle to the SVG
    svgIcon.appendChild(triangle);

    // Create a text node for the resteem count
    // const resteemCountText = document.createTextNode(`${resteems.length} Resteems `);
    const resteemCountText = document.createElement('span');
    resteemCountText.textContent = `${resteems.length} Resteems `;
    resteemCountText.classList.add('resteem-count-text'); // Add a class for styling

    // Append the text and the SVG icon to the dropdown trigger
    dropdownTrigger.appendChild(resteemCountText);
    dropdownTrigger.appendChild(svgIcon);

    // Create the dropdown menu
    const isDarkMode = document.body.classList.contains('theme-dark');
    const resteemDropdownBgColor = isDarkMode ? '#1C252B' : '#F4F4F4';
    const dropdownMenu = document.createElement('ul');
    dropdownMenu.className = 'resteem-dropdown-menu';
    // Set the background color of the dropdown menu, depending on dark/light mode
    dropdownMenu.style.backgroundColor = resteemDropdownBgColor;

    console.log("Resteems data:", resteems);
    // Populate the dropdown menu with resteemers
    resteems.forEach(resteem => {
        const resteemer = resteem[1];
        const listItem = document.createElement('li');
        listItem.className = 'resteem-dropdown-item';
        const link = document.createElement('a');
        link.href = `/@${resteemer}`;
        link.textContent = resteemer;
        // link.className = 'resteem-dropdown-link';
        link.className = 'vote-username';

        listItem.appendChild(link);
        dropdownMenu.appendChild(listItem);
    });

    // Prevent clicks inside the dropdown menu from closing it
    dropdownMenu.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!dropdownWrapper.contains(event.target)) {
            dropdownMenu.classList.remove('visible');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!dropdownContainer.contains(event.target)) {
            dropdownMenu.classList.remove('visible');
        }
    });

    // Create a wrapper for the dropdown
    const dropdownWrapper = document.createElement('span');
    dropdownWrapper.style.display = 'inline-block';
    dropdownWrapper.style.marginLeft = '0px';
    dropdownWrapper.style.verticalAlign = 'middle';
    dropdownWrapper.style.marginBottom = '10px';
    dropdownWrapper.className = 'resteem-dropdown-wrapper';

    // Append the dropdown components to the wrapper
    dropdownContainer.appendChild(dropdownMenu);
    dropdownContainer.appendChild(dropdownTrigger);

    // Append the dropdown container to the Reshare container element
    const targetElement = anchorElement.querySelector('.Reblog__button');
    if (targetElement) {
        targetElement.parentNode.insertBefore(dropdownWrapper, targetElement.nextSibling);
        // const lineBreak = document.createElement('br');
        // targetElement.parentNode.insertBefore(lineBreak, dropdownWrapper.nextSibling);
    } else {
        anchorElement.appendChild(dropdownWrapper);
    }
    dropdownWrapper.appendChild(dropdownContainer);
}