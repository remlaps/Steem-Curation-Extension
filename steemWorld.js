const getExtendedStats = async (accountName) => {
    sdsUrl = `${sdsEndpoint}/accounts_api/getAccountExt/${accountName}`;
    const response = await fetch(sdsUrl);
    const data = await response.json();
    return data.result;
};

async function getResteems(author, permlink) {
    sdsUrl = `${sdsEndpoint}/post_resteems_api/getResteems/${author}/${permlink}`;
    const response = await fetch(sdsUrl);
    const data = await response.json();
    return data;
}

const getAuthorPostHistory = async (author, fromTime, toTime, limit=1000) => {
    let currentTime = fromTime;
    let response;
    let data;
    let rows;
    let info;
    const posts = [];
    const permlinks = [];
    let keepRunning = true;
    while (currentTime < toTime && keepRunning){
        sdsUrl = `${sdsEndpoint}/account_history_api/getHistoryByOpTypesTime/${author}/comment/${fromTime}-${toTime}/${limit}`;
        response = await fetch(sdsUrl);
        data = await response.json();
        rows = data.result.rows;
        if (rows.length < limit) keepRunning = false
        for (let i=0; i < rows.length; i++){
            let row = rows[i]
            info = row[6][1]
            currentTime = row[1]
            if (info.parent_author === "" && currentTime >= fromTime && currentTime <= toTime && !permlinks.find(p => p === info.permlink)){
                post = await Post.create(info.author, info.permlink)
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