console.log("The extension is up and running");

var promotedPosts = {}; // contains all transactions for promoted posts with accounts, count, and whether self-promoted
const urlRequest = "https://sds.steemworld.org/transfers_api/getTransfersByTypeTo/transfer/null/time/DESC/250/0";
const steemApi = "https://api.steemyy.com";

const highLight = () => {
    var curatorBackgroundColor;
    const listItem = document.querySelectorAll('li');

    // Working from high to low (for outside to inside in document nesting)
    for (let i = listItem.length - 1; i >= 0; i--) {
        // Check for @null beneficiary and /promoted post promotion.
        if (listItem[i].textContent.match('null: .*%') && listItem[i].textContent.match('Promotion Cost .*\$')) {
            console.log("Found a /promoted post in #burnsteem25 (outer block)");
            curatorBackgroundColor = '#1E90FF';
            listItem[i].style['background-color'] = curatorBackgroundColor;

        // Check for just @null beneficiary
        } else if (listItem[i].textContent.match('null: .*%')) {
            console.log("Found #burnsteem25");
            var str = listItem[i].textContent;
            var nullPct = str.substring(
                str.indexOf(" ") + 1,
                str.lastIndexOf("%")
            );
            curatorBackgroundColor = getColorBurnPost(nullPct);
            listItem[i].style['background-color'] = curatorBackgroundColor;

        // Check for just /promoted post promotion
        } else if (listItem[i].textContent.match('Promotion Cost .*\$')) {
            console.log("Found a /promoted post");
            var str = listItem[i].textContent;
            var indexEnd = (str.indexOf("(") >= 0) ? str.indexOf("(") - 1 : str.length;
            var promoAmount = str.substring(
                str.indexOf("$") + 1,
                indexEnd
            );
            curatorBackgroundColor = getColorPromotedPost(promoAmount);

            // now edit the textContent
            addText(listItem[i]);
            listItem[i].style['background-color'] = curatorBackgroundColor;
        } else {
            listItem[i].style['background-color'] = "initial";
        }
    }
    modifyUserElement();
}

function getColorBurnPost(nullPct) {
    if (nullPct > 0 && nullPct < 25) {
        curatorBackgroundColor = "coral";
    } else if (nullPct < 50) {
        curatorBackgroundColor = "orange";
    } else if (nullPct < 75) {
        curatorBackgroundColor = "darkorange";
    } else if (nullPct > 0) {
        curatorBackgroundColor = "orangered";
    }
    return curatorBackgroundColor;
}

function getColorPromotedPost(promoAmount) {
    if (promoAmount > 0 && promoAmount < 0.26) {
        curatorBackgroundColor = "paleturquoise";
    } else if (promoAmount < 0.51) {
        curatorBackgroundColor = "aquamarine";
    } else if (promoAmount < 1.01) {
        curatorBackgroundColor = "turquoise";
    } else if (promoAmount > 0) {
        curatorBackgroundColor = "lightseagreen";
    }
    return curatorBackgroundColor;
}

fetch(urlRequest).then(function (response) {
    return response.json();
}).then(function (data) {
    prepareData(data);
    highLight();
}).catch(function (error) {
    console.log("error: " + error);
});

function prepareData(data) {
    if (data) {
        const cols = data.result.cols;
        const rows = data.result.rows;
        rows.forEach(trf => {
            let trfData = getAuthorPost(trf[cols["memo"]]);
            if (trfData) {
                let from = trf[cols["from"]];
                let self = (from == trfData["author"]);
                let props = { "user": [from], "count": 1, "self": self };
                let key = trfData["post"];
                if (promotedPosts && key in promotedPosts) {
                    let oldProps = promotedPosts[key];
                    if (!(oldProps["user"].includes(from))) {
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
    const objMatch = regexMatch(true, memoStr);
    let result = (objMatch && objMatch.length == 3) ? {
        "post": objMatch.groups["author"] + "/" + objMatch.groups["permlink"],
        "author": objMatch.groups["author"]
    } : null;
    return result;
}

function addText(listItem) {
    var added = false;
    if (!listItem.textContent.includes('User')) {
        let address = getAddress(listItem);
        if (address !== null) {
            let key = getPost(address);
            if (promotedPosts[key]) {
                let newText = ' (by ' +
                    promotedPosts[key]["count"] +
                    (promotedPosts[key]["count"] == 1 ? ' User' : ' Users') +
                    (promotedPosts[key]["self"] ? ' incl. self)' : ')');
                let newTextNode = document.createTextNode(newText);
                listItem.firstChild.appendChild(newTextNode);
                added = true
            }
        }
    }
    if (added) {
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
    while (elem.parentElement && elem.parentElement.nodeName.toLowerCase() != 'body') {
        elem = elem.parentElement;
        if (elem.nodeName.toLowerCase() == 'div' && elem.className.includes('articles__content-block--text')) {
            let titleElemList = elem.getElementsByClassName('entry-title');
            link = titleElemList[0].firstChild.href;
            break;
        }
    }
    return link ? link : null;
}

document.addEventListener('DOMContentLoaded', () => {
    highLight();
});

window.addEventListener('scroll', () => {
    highLight();
});
window.addEventListener('load', () => {
    highLight();
});
window.addEventListener('click', () => {
    highLight();
});

console.log("The extension is done.");

// Function to get voting power
async function getVotingPower(username) {
    const response = await fetch(`${steemApi}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'condenser_api.get_accounts',
            params: [[username]],
            id: 1
        })
    });

    const data = await response.json();
    return data.result[0]?.voting_power;
}

// Function to create and show tooltip
// function showTooltip(element, text) {
//     const tooltip = document.createElement('div');
//     tooltip.textContent = text;
//     tooltip.style.cssText = `
//       position: absolute;
//       background: #333;
//       color: white;
//       padding: 5px;
//       border-radius: 3px;
//       font-size: 12px;
//       z-index: 1000;
//     `;

//     const rect = element.getBoundingClientRect();
//     tooltip.style.left = `${rect.left}px`;
//     tooltip.style.top = `${rect.bottom + 5}px`;

//     document.body.appendChild(tooltip);
//     return tooltip;
// }

// Functions to find and modify the specific element and handle the tool tip
let activeTooltip = null;

function modifyUserElement() {
    const elements = document.querySelectorAll('li.title');
    console.dir(elements);
    elements.forEach(element => {
        if (element.textContent.trim() === element.childNodes[0].textContent.trim()) {
            element.addEventListener('mouseenter', handleMouseEnter);
            element.addEventListener('mouseleave', handleMouseLeave);
        }
    });

    // Add click event listener to the document
    document.addEventListener('click', handleDocumentClick, true);
}

async function handleMouseEnter(event) {
    const element = event.target;
    const username = element.textContent.trim();
    const votingPower = await getVotingPower(username);
    
    if (votingPower !== undefined) {
        // Remove any existing tooltip
        removeTooltip();
        
        activeTooltip = showTooltip(element, `Voting power: ${votingPower / 100}%`);
    }
}

function handleMouseLeave() {
    removeTooltip();
}

function handleDocumentClick(event) {
    // Always remove the tooltip on any click
    removeTooltip();
}

function removeTooltip() {
    if (activeTooltip && document.body.contains(activeTooltip)) {
        document.body.removeChild(activeTooltip);
        activeTooltip = null;
    }
}

function showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: fixed;
        background: #333;
        color: white;
        padding: 5px;
        border-radius: 3px;
        font-size: 12px;
        z-index: 1000;
    `;

    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left - 120}px`;
    tooltip.style.top = `${rect.top + 10 }px`;

    document.body.appendChild(tooltip);
    return tooltip;
}
