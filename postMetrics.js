function stripHtmlAndMarkdown(text) {
    // Remove HTML tags
    const noHtml = text.replace(/<\/?[^>]+(>|$)/g, "");
    // Remove Markdown symbols
    const cleanText = noHtml.replace(/[#_*`~\[\](){}>|!\\-]+/g, "");
    return cleanText;
}

function getWordCount(text) {
    const cleanText = stripHtmlAndMarkdown(text);
    const words = cleanText.trim().split(/\s+/).filter(Boolean); // Split by whitespace
    return words.length;
}

function getReadingTime(wordCount, wordsPerMinute = 200) {
    return Math.ceil(wordCount / wordsPerMinute);
}

