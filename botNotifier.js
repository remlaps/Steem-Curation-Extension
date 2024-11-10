botList = ['upex', 'upmewhale', 'upvu', 'shy-fox', 'avle', 'nixiee', 'h4lab', 'justyy', 'oppps', 'support-kr', 'upvu.whitness',
    'uco.bnb-d', 'uco.intern', 'vfund', 'suntr', 'abb-curation'];

function countBotVotes (active_votes) {
    const botVotesCount = active_votes.filter(vote => botList.includes(vote.voter)).length;
    return botVotesCount;
}

function calculateBotRsharePercentage(active_votes) {
    // Using BigInt to avoid overflowing with really big numbers or rshares.
    let totalRshares = BigInt(0);
    let botRshares = BigInt(0);

    active_votes.forEach(vote => {
        const rshares = BigInt(vote.rshares); // Convert rshares to BigInt

        totalRshares += rshares;
        if (botList.includes(vote.voter)) {
            botRshares += rshares;
        }
    });

    // Calculate bot rshare percentage
    if (totalRshares === BigInt(0)) {
        return 0; // Avoid division by zero
    }

    // Multiply by 100n to avoid fractions with BigInt and get the integer percentage
    const botPercentage = (botRshares * BigInt(100)) / totalRshares;
    return Number(botPercentage); // Convert to regular number for ease of use/display
}