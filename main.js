console.log("The extension is up and running");
var promotedPosts = {}; // contains all transactions for promoted posts with accounts, count and whether self promoted
const urlRequest = "https://sds.steemworld.org/transfers_api/getTransfersByTypeTo/transfer/null/time/DESC/250/0";

const highLight = () => {

    var curatorBackgroundColor;
    const listItem = document.querySelectorAll('li');

    for (let i=listItem.length-1; i>=0; i--) {
        if ( listItem[i].textContent.match('null: .*%' ) && listItem[i].textContent.match('Promotion Cost .*\$') ) {
            console.log("Found a /promoted post in #burnsteem25 (outer block)");
			console.log("Word count: ", listItem[i].body.str(" ").length());
            curatorBackgroundColor = '#1E90FF';
            listItem[i].style['background-color'] = curatorBackgroundColor;
        } else if ( listItem[i].textContent.match('null: .*%' )) {
            console.log("#burnsteem25 outer match: ");
            if ( listItem[i].textContent.match('^null:.*\%') ) {
                console.log("Found #burnsteem25");
                var str = listItem[i].textContent;
                var nullPct = str.substring(
                    str.indexOf(" ") + 1,
                    str.lastIndexOf("%")
                );
                if ( nullPct > 0 && nullPct < 25 ) {
                    curatorBackgroundColor = "coral";
                } else if ( nullPct < 50 ) {
                    curatorBackgroundColor = "orange";
                } else if ( nullPct < 75 ) {
                    curatorBackgroundColor = "darkorange";
                } else if ( nullPct > 0 ) {
                    curatorBackgroundColor = "orangered";
                }
            }       
            listItem[i].style['background-color'] = curatorBackgroundColor;
        } else if ( listItem[i].textContent.match('Promotion Cost .*\$') ) {
            console.log("Found a /promoted post (outer block)");

            if ( listItem[i].textContent.match('^Promotion Cost .*\$$') ) {
                console.log("Found a /promoted post");
                var str = listItem[i].textContent;
                var indexEnd = (str.indexOf("(") >= 0) ? str.indexOf("(") - 1 : str.length;
                var promoAmount = str.substring(
                    str.indexOf("$") + 1,
                    indexEnd
                );
                console.log ("Promotion amount: " + promoAmount);

                if ( promoAmount > 0 && promoAmount < 0.26 ) {
                    curatorBackgroundColor = "paleturquoise";
                } else if ( promoAmount < 0.51 ) {
                    curatorBackgroundColor = "aquamarine";
                } else if ( promoAmount < 1.01 ) {
                    curatorBackgroundColor = "turquoise";
                } else if ( promoAmount > 0 ) {
                    curatorBackgroundColor = "lightseagreen";
                }

                // now edit the textContent
                addText(listItem[i]);
            }
            listItem[i].style['background-color'] = curatorBackgroundColor;
        } else {
            listItem[i].style['background-color'] = "initial";
        }
    }
}

// load transfers to null and prepare promotedPosts for further use
fetch (urlRequest).then (function (response) {
    return response.json();
}).then (function (data) {
    prepareData(data);
    // execute hihgLight after providing the data
    highLight();
}).catch (function (error) {
    console.log ("error: " + error);
});

function prepareData(data) {
    if (data) {
        const cols = data.result.cols;
        const rows = data.result.rows;
        rows.forEach(trf => {
            let trfData = getAuthorPost(trf[cols["memo"]]);
            if (trfData) {
                let from = trf[cols["from"]];
                let self = (from == trfData["author"])
                let props = {"user": [from], "count": 1, "self": self};
                let key = trfData["post"];
                if (promotedPosts && key in promotedPosts) {
                    let oldProps = promotedPosts[key];
                    if ( !(oldProps["user"].includes(from)) ) {
                        props["user"] = props["user"].concat(oldProps["user"]);
                        props["count"] += oldProps["count"];
                        props["self"] = props["self"] || oldProps["self"];
                    } else {
                        props = oldProps;
                    }
                }
                promotedPosts[key] = props;
            }
        }); 
    };
}

function getAuthorPost(memoStr) {
    // const re = /^@(?<author>[\w-.]+)[\/](?<permlink>[\w-\|]+)$/;
    // const objMatch = memoStr.match(re);
    const objMatch = regexMatch(true, memoStr);
    let result = (objMatch && objMatch.length == 3) ? {
        "post": objMatch.groups["author"] + "/" + objMatch.groups["permlink"],
        "author": objMatch.groups["author"]
        } : null ;
    return result;
}

function addText(listItem) {
    var added = false;
    // console.log("include User? " + listItem.textContent.includes('User'));
    if ( !listItem.textContent.includes('User') ) {
    // get the postid
        let address = getAddress(listItem);
        // console.log("Address: " + address);
        if ( address !== null ) {
            let key = getPost(address);
            // console.log("Key: " + key);
            // console.log("Promoted: " + promotedPosts[key]);
            if ( promotedPosts[key] ) {
                let newText = ' (by ' + 
                    promotedPosts[key]["count"] + 
                    ( promotedPosts[key]["count"] == 1 ? ' User' : ' Users' ) + 
                    ( promotedPosts[key]["self"] ? ' incl. self)' : ')' );
                let newTextNode = document.createTextNode(newText);
                listItem.firstChild.appendChild(newTextNode);
                added = true
            }
        }        
    }
    if ( added ) {
        console.log("User added");
    } else {
        console.log("Adding User went wrong");
    }
}

function getPost(address) {
    const objMatch = regexMatch(false, address);
    return (objMatch && objMatch.length == 3) ? objMatch.groups["author"] + "/" + objMatch.groups["permlink"] : null;
}

function regexMatch(fromBegin, textStr) {
    re = fromBegin ? /^@(?<author>[\w-.]+)[\/](?<permlink>[\w-\|]+)$/ : /@(?<author>[\w-.]+)[\/](?<permlink>[\w-\|]+)$/;
    return textStr.match(re);
}

function getAddress(elem) {
    var link;
    while ( elem.parentElement && elem.parentElement.nodeName.toLowerCase() != 'body' ) {
        elem = elem.parentElement;
        if ( elem.nodeName.toLowerCase() == 'div' && elem.className.includes('articles__content-block--text') ) {
            let titleElemList = elem.getElementsByClassName('entry-title');
            link = titleElemList[0].firstChild.href;
            break;
        }
    }
    return link ? link : null;
}

highLight();
window.addEventListener('scroll', () => {
    highLight();
});
window.addEventListener('load', () => {
    highLight();
});

window.addEventListener('click', () => {
	console.log("Load event observed");
	highLight();
});
window.addEventListener('DOMContentLoaded', 
() => {
	console.log("Load event observed");
	highLight();
});

console.log("The extension is done.");