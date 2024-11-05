function createToggleControl() {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'sce-control';

    const titleLink = document.createElement('a');
    titleLink.href = 'https://github.com/remlaps/Steem-Curation-Extension';
    titleLink.textContent = 'Steem Curation Extension';
    titleLink.target = '_blank';
    titleLink.className = 'sce-title-link';

    const controlRow = document.createElement('div');
    controlRow.className = 'sce-control-row';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'resteem-toggle';
    // Get saved state, default to true if not set
    checkbox.checked = localStorage.getItem('showResteems') !== 'false';

    const label = document.createElement('label');
    label.htmlFor = 'resteem-toggle';
    label.textContent = 'Show Resteems';
    
    const computedStyle = window.getComputedStyle(document.body);
    label.style.fontFamily = computedStyle.fontFamily;
    titleLink.style.fontFamily = computedStyle.fontFamily;
    label.style.color = computedStyle.color;

    controlRow.appendChild(checkbox);
    controlRow.appendChild(label);
    controlDiv.appendChild(titleLink);
    controlDiv.appendChild(controlRow);
    document.body.appendChild(controlDiv);

    checkbox.addEventListener('change', function() {
        // Save state when changed
        localStorage.setItem('showResteems', this.checked);
        updateResteemVisibility();
    });

    // Apply initial state
    updateResteemVisibility();
}

function updateResteemVisibility() {
    const checkbox = document.getElementById('resteem-toggle');
    if (checkbox) {
        const summaries = document.querySelectorAll('.articles__summary');
        summaries.forEach(summary => {
            const hasResteem = summary.querySelector('.articles__resteem') !== null;
            if (hasResteem) {
                const parentLi = summary.closest('li');
                if (parentLi) {
                    parentLi.style.display = checkbox.checked ? 'block' : 'none';
                }
            }
        });
    }
}