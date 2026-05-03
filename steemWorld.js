const fetchProxy = (url, options = {}) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'FETCH_PROXY', url, options }, (response) => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
            if (response?.error) return reject(new Error(response.error));
            resolve(response.data);
        });
    });
};

const getExtendedStats = async (accountName) => {
    const sdsUrl = `${sdsEndpoint}/accounts_api/getAccountExt/${accountName}`;
    const data = await fetchProxy(sdsUrl);
    return data.result;
};

async function getResteems(author, permlink) {
    const sdsUrl = `${sdsEndpoint}/post_resteems_api/getResteems/${author}/${permlink}`;
    const data = await fetchProxy(sdsUrl);
    return data;
}

const getFollowerNamesSDS = async (accountName) => {
    const url = `${sdsEndpoint}/followers_api/getFollowers/${accountName}`;
    const data = await fetchProxy(url);
    if (Array.isArray(data?.result)) {
        return data.result;
    }
    return [];
};

const getCommunitySubscriberNamesSDS = async (communityName) => {
    const url = `${sdsEndpoint}/communities_api/getCommunitySubscribers/${communityName}`;
    const data = await fetchProxy(url);
    if (Array.isArray(data?.result)) {
        return data.result;
    }
    return [];
};

const getAuthorPostHistory = async (author, fromTime, toTime, limit=1000) => {
    let currentTime = fromTime;
    let data;
    const posts = [];
    const permlinks = [];
    let keepRunning = true;
    while (currentTime < toTime && keepRunning){
        const sdsUrl = `${sdsEndpoint}/account_history_api/getHistoryByOpTypesTime/${author}/comment/${fromTime}-${toTime}/${limit}`;
        data = await fetchProxy(sdsUrl);
        const rows = data.result.rows;
        if (rows.length < limit) keepRunning = false
        for (let i=0; i < rows.length; i++){
            const row = rows[i];
            const info = row[6][1];
            currentTime = row[1]
            if (info.parent_author === "" && currentTime >= fromTime && currentTime <= toTime && !permlinks.find(p => p === info.permlink)){
                const post = await Post.create(info.author, info.permlink);
                if (post){
                    posts.push(post)
                    permlinks.push(info.permlink)
                }
            } else if (currentTime <= fromTime) {
                return posts
            }
        }
        if (currentTime < toTime){
            fromTime = currentTime;
        }
    }
    return posts
}