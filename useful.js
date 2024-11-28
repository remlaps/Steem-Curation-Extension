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