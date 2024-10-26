/*
 * Overlay functions
 */

function showOverlay(postInfo, buttonElement) {
    // Get existing overlay or create new one
    let overlay = buttonElement.parentElement.querySelector('.custom-overlay');
    const bodyBackgroundColor = getComputedStyle(document.body).backgroundColor;
    const bodyFontColor = getComputedStyle(document.body).color;

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'custom-overlay';
        overlay.style.backgroundColor = bodyBackgroundColor; // This would be better in styles.css
        overlay.style.color = bodyFontColor;                 // This would be better in styles.css

        // Create header section
        const header = document.createElement('div');
        header.className = 'overlay-header';
        
        const overLayTitle = document.createElement('p');
        overLayTitle.textContent = 'Overlay title';
        overLayTitle.classList.add('small-font');
        
        header.appendChild(overLayTitle);

        // Create content section
        const content = document.createElement('div');
        content.className = 'overlay-content';
        content.innerHTML = `
            <p>Info field: ${postInfo}</p>
            <!-- Add more information here as needed -->
        `;

        overlay.appendChild(header);
        overlay.appendChild(content);
        
        // Add overlay to the button's container
        buttonElement.parentElement.appendChild(overlay);
    }

    overlay.style.display = 'block';
}

function hideOverlay(buttonElement) {
    const overlay = buttonElement.parentElement.querySelector('.custom-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function addButtonsToSummaries() {
    const headers = document.querySelectorAll('div.articles__summary-header');
    
    headers.forEach(header => {
        if (!header.querySelector('.custom-action-button')) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            const button = document.createElement('button');
            button.className = 'custom-action-button';
            button.textContent = 'Curator Info';
            
            // Replace click handler with mouseover/mouseout
            button.addEventListener('mouseover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const someInfo = "Info about post";
                showOverlay("someInfo", button);
            });

            button.addEventListener('mouseout', (e) => {
                e.preventDefault();
                e.stopPropagation();
            
                // Assuming the overlay is created inside showOverlay
                const overlay = document.querySelector('.custom-overlay');
                if (overlay) {
                    overlay.remove(); // This will remove the overlay from the DOM
                }
            });

            buttonContainer.appendChild(button);
            header.appendChild(buttonContainer);
        }
    });
}