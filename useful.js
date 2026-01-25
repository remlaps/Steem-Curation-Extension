let SCE_SILENT = 0;

// Wrap sync code
function withSilentMutations(fn) {
  return function (...args) {
    SCE_SILENT++;
    try { return fn.apply(this, args); }
    finally { SCE_SILENT--; }
  };
}

// Wrap async code
function withSilentMutationsAsync(fn) {
  return async function (...args) {
    SCE_SILENT++;
    try { return await fn.apply(this, args); }
    finally { SCE_SILENT--; }
  };
}

function roundMinutes(date) {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes).toFixed(0); // Round the minutes to the nearest integer
    date.setMinutes(roundedMinutes, 0, 0); // Set the rounded minutes, resetting seconds and milliseconds
    console.log(date)
    return date;
}

function formatDateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(Math.floor(date.getSeconds())).padStart(2, '0'); // Ensure no decimals

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Converts a hex color code or color name to an RGBA string with a specified alpha.
 * @param {string} color - The color string (e.g., '#1E90FF' or 'coral').
 * @param {number} alpha - The alpha transparency value (0.0 to 1.0).
 * @returns {string} The RGBA color string.
 */
function hexToRgba(color, alpha) {
    // Create a temporary element to resolve the color name/hex to RGB
    const tempElem = document.createElement('div');
    tempElem.style.color = color;
    document.body.appendChild(tempElem);

    const computedColor = window.getComputedStyle(tempElem).color;
    document.body.removeChild(tempElem);

    const rgb = computedColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
        return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    }
    return color; // Fallback to original color if conversion fails
}