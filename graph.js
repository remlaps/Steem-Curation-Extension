/**
 * Sort votes in ascending order by time.
 * @param {Array} activeVotes - The list of active votes.
 * @returns {Array} - The sorted list of active votes.
 */
const sortVotesByTime = (activeVotes) => {
    return activeVotes.sort((a, b) => new Date(a.time) - new Date(b.time));
};

/**
 * Determine the appropriate time unit (minutes, hours, or days) for the X-axis.
 * @param {Date} postCreationTime - The creation time of the post.
 * @param {Array} activeVotes - The list of active votes.
 * @returns {string} - The time unit ('minutes', 'hours', or 'days').
 */
const getTimeUnit = (postCreationTime, activeVotes) => {
    const latestVoteTime = activeVotes.reduce((latest, vote) => {
        const voteTime = new Date(vote.time).getTime();
        return voteTime > latest ? voteTime : latest;
    }, postCreationTime.getTime());

    const elapsedMs = latestVoteTime - postCreationTime.getTime();

    if (elapsedMs < 2 * 60 * 60 * 1000) return 'minutes'; // Less than 2 hours
    if (elapsedMs < 2 * 24 * 60 * 60 * 1000) return 'hours'; // Less than 2 days
    return 'days'; // 2 days or more
};

/**
 * Format the elapsed time based on the given time unit.
 * @param {number} elapsedMs - The elapsed time in milliseconds since post creation.
 * @param {string} timeUnit - The time unit ('minutes', 'hours', or 'days').
 * @returns {string} - The formatted time label.
 */
const formatTimeLabel = (elapsedMs, timeUnit) => {
    if (timeUnit === 'minutes') return `${Math.floor(elapsedMs / (60 * 1000))} min`;
    if (timeUnit === 'hours') return `${(elapsedMs / (60 * 60 * 1000)).toFixed(1)} hr`;
    return `${(elapsedMs / (24 * 60 * 60 * 1000)).toFixed(1)} d`;
};


/**
 * Create a graph with Chart.js.
 * @param {string} containerClass - The class of the container where the graph will be appended.
 * @param {string} canvasId - The ID for the canvas element.
 * @param {string} title - The title of the graph.
 * @param {Array} labels - The labels for the X-axis.
 * @param {Array} data - The data for the Y-axis.
 * @param {string} yAxisLabel - The label for the Y-axis.
 */
const createLineGraph = (containerClass, canvasId, title, labels, datasets, yAxisLabel) => {
    const graphContainer = document.querySelector(`.${containerClass}`);

    if (graphContainer) {
        // Create a wrapper div for the graph
        const wrapper = document.createElement('div');
        wrapper.className = `${canvasId}-wrapper chart-container`;
        wrapper.style.marginTop = '20px';

        // Create a new canvas element for the graph
        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvas.style.width = '100%';
        canvas.style.height = '300px';

        // Append the canvas to the wrapper and the wrapper to the container
        wrapper.appendChild(canvas);
        graphContainer.appendChild(wrapper);

        // Determine whether to show data point dots based on the number of data points
        const showDots = datasets[0].data.length <= 20;

        // Generate a graph using Chart.js
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets.map((dataset) => ({
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: dataset.color.replace('1)', '0.2)'), // Transparent fill
                    borderColor: dataset.color,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: showDots ? 3 : 0,
                })),
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#AAA',
                        },
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 18,
                            weight: 'bold',
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                return `$${tooltipItem.raw.toFixed(2)}`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time',
                            font: {
                                size: 14,
                                weight: 'bold',
                            },
                        },
                        ticks: {
                            color: '#AAA', // Neutral dark gray for tick marks
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisLabel,
                            font: {
                                size: 14,
                                weight: 'bold',
                            },
                        },
                        ticks: {
                            color: '#AAA', // Neutral dark gray for tick marks
                        },
                    },
                },
            },
        });
    } else {
        console.error(`Element with class "${containerClass}" not found!`);
    }
};


/**
 * Format the elapsed time for evenly scaled intervals.
 * @param {number} elapsedMs - The elapsed time in milliseconds since post creation.
 * @param {number} maxElapsedMs - The maximum elapsed time in milliseconds.
 * @returns {string} - The formatted time label.
 */
const formatScaledTimeLabel = (elapsedMs, maxElapsedMs) => {
    if (maxElapsedMs < 2 * 60 * 60 * 1000) {
        // If the total time is less than 2 hours, show in minutes
        return `${Math.floor(elapsedMs / (60 * 1000))} min`;
    } else if (maxElapsedMs < 2 * 24 * 60 * 60 * 1000) {
        // If the total time is less than 2 days, show in hours
        return `${(elapsedMs / (60 * 60 * 1000)).toFixed(1)} hr`;
    } else {
        // If the total time is more than 2 days, show in days
        return `${(elapsedMs / (24 * 60 * 60 * 1000)).toFixed(1)} d`;
    }
};

/**
 * Create a line graph with clickable dots using Chart.js.
 * Clicking a dot navigates to the corresponding post.
 * @param {string} containerClass - The class of the container where the graph will be appended.
 * @param {string} canvasId - The ID for the canvas element.
 * @param {string} title - The title of the graph.
 * @param {Array} labels - The labels for the X-axis (e.g., Post numbers).
 * @param {Array} data - The data for the Y-axis (e.g., payout values).
 * @param {string} yAxisLabel - The label for the Y-axis.
 * @param {Array} posts - Array of Post objects to map clickable dots to their URLs.
 */
const createLineGraphWithClickableDots = (containerClass, canvasId, title, labels, data, yAxisLabel, posts) => {
    const graphContainer = document.querySelector(`.${containerClass}`);
    if (!graphContainer) {
        console.error(`Graph container not found: ${containerClass}`);
        return;
    }

    // Remove existing chart if it exists
    const existingCanvas = document.getElementById(canvasId);
    if (existingCanvas) {
        existingCanvas.remove();
    }

    // Create a new canvas element for the graph
    const canvas = document.createElement('canvas');
    canvas.id = canvasId;

    // Wrap the canvas in a styled container
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('chart-container');
    containerDiv.style.border = '1px solid #444';
    containerDiv.style.padding = '10px';
    containerDiv.style.borderRadius = '5px';
    containerDiv.style.marginBottom = '20px';
    containerDiv.style.backgroundColor = 'transparent';
    containerDiv.appendChild(canvas);
    graphContainer.appendChild(containerDiv);

    // Generate the graph using Chart.js
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: title,
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                    position: 'top',
                    labels: {
                        color: '#333',
                    },
                },
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 18,
                        weight: 'bold',
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const postIndex = tooltipItem.dataIndex;
                            return `Payout: $${data[postIndex].toFixed(2)}`;
                        },
                    },
                    bodyFont: {
                        size: 14,
                    },
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Post Number',
                        font: {
                            size: 14,
                            weight: 'bold',
                        },
                    },
                    ticks: {
                        color: '#AAA',
                        maxRotation: 45,
                        minRotation: 0,
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel,
                        font: {
                            size: 14,
                            weight: 'bold',
                        },
                    },
                    ticks: {
                        color: '#AAA',
                    },
                },
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const elementIndex = elements[0].index;
                    const post = posts[elementIndex];
                    const postUrl = `/@${post.details.author}/${post.details.permlink}`;
                    window.location.href = postUrl;
                }
            },
        },
    });
};



const createBarGraph = (containerClass, canvasId, title, labels, data, yAxisLabel, colors) => {
    const graphContainer = document.querySelector(`.${containerClass}`);
    if (!graphContainer) {
        console.error(`Graph container not found: ${containerClass}`);
        return;
    }

    // Remove existing chart if it exists
    const existingCanvas = document.getElementById(canvasId);
    if (existingCanvas) {
        existingCanvas.remove();
    }

    // Create a new canvas element for the graph
    const canvas = document.createElement('canvas');
    canvas.id = canvasId;

    // Wrap the canvas in a styled container
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('chart-container');
    containerDiv.style.marginTop = '20px';
    containerDiv.appendChild(canvas);
    graphContainer.appendChild(containerDiv);

    // Generate the graph using Chart.js
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: title,
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color.replace('0.7', '1.0')),
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 18,
                        weight: 'bold',
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return `$${tooltipItem.raw.toFixed(2)}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Category',
                        font: {
                            size: 14,
                            weight: 'bold',
                        },
                    },
                    ticks: {
                        color: '#AAA',
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel,
                        font: {
                            size: 14,
                            weight: 'bold',
                        },
                    },
                    ticks: {
                        color: '#AAA',
                    },
                },
            },
        },
    });
};



