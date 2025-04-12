async function getAuthorPayoutsInWeekBefore(author, postCreationDate) {
    // Calculate the target time range
    const endTime = Math.floor((postCreationDate.getTime() - 7 * 24 * 60 * 60 * 1000) / 1000); // One week before post creation in seconds
    const startTime = Math.floor((endTime - 7 * 24 * 60 * 60)); // Two weeks before post creation in seconds


    const payouts = await getAuthorPostHistory(author, startTime, endTime, 1000)
    return payouts
}