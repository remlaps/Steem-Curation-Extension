const botList = ["abb-curation", "avle", "bot-api", "boomerang", "coin-doubler",
    "cur8", "gotogether", "h4lab", "heroism", "justyy", "nixiee", "nutbox.mine",
    "oppps", "robiniaswap", "shy-fox", "steem-punks", "steem.botto", "steem.stack",
    "steembasicincome", "steemegg", "successgr.with", "suntr", "support-kr",
    "templar-kr", "tipu", "uco.bnb-d", "uco.intern", "upex", "upmewhale",
    "upvu", "upvu.witness", "vfund", "vote.steem-aaa", "xiguang"];

const steemitList = ["steemcurator01", "steemcurator02", "steemcurator03", "steemcurator04",
    "steemcurator05", "steemcurator06", "steemcurator07", "steemcurator08", "steemcurator09",
    "booming01", "booming02", "booming03", "booming04"];

function countVotes(active_votes, targetList = botList) {
    const targetVotesCount = active_votes.filter(vote => targetList.includes(vote.voter)).length;
    return targetVotesCount;
}

function calculateRsharePercentage(active_votes, targetList = botList) {
    // Using BigInt to avoid overflowing with really big numbers or rshares.
    let totalRshares = BigInt(0);
    let targetRshares = BigInt(0);

    active_votes.forEach(vote => {
        const rshares = BigInt(vote.rshares); // Convert rshares to BigInt

        totalRshares += rshares;
        if (targetList.includes(vote.voter)) {
            targetRshares += rshares;
        }
    });

    // Calculate target rshare percentage
    if (totalRshares === BigInt(0)) {
        return 0; // Avoid division by zero
    }

    // Multiply by 100n to avoid fractions with BigInt and get the integer percentage
    const targetPercentage = (targetRshares * BigInt(100)) / totalRshares;
    return Number(targetPercentage); // Convert to regular number for ease of use/display
}