botList = ['upex', 'upmewhale', 'upvu', 'shy-fox', 'avle', 'nixiee', 'h4lab'];

function countBotVotes (active_votes) {
    const botVotesCount = active_votes.filter(vote => botList.includes(vote.voter)).length;
    return botVotesCount;
}

