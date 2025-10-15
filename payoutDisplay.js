CURATION_INDEX = -1
AUTHOR_INDEX = -2
PAST_PAY_INDEX = -3

const parseValue = (valString) => {
    let value = '';
    let decimalSymbol;
    let currencySymbol;
    let csPosition = "start";
    const decimalSymbols = [
        ".",   // Period — used in English-speaking countries (US, UK, etc.)
        ",",   // Comma — used in most of Europe and Latin America
        "·",   // Middle dot — historical / some African and British contexts
        "٫",   // Arabic decimal separator
        "‧",   // Dot operator — occasionally used in Asian locales
        "⎖",   // Rare symbol seen in some technical notations
        "︰",   // Two-dot leader — used in some East Asian number formatting
    ];
    for (let i = valString.length - 1; i>= 0; i--){
        let char = valString[i];
        if (/^[0-9]$/.test(char)){ // Is character numeric?
            value = char + value;
        } else if (decimalSymbols.includes(char)) { // Is character decimal?
            value = "." + value;
            decimalSymbol = char;
        } else { // Character is currency symbol
            if (!currencySymbol){
                currencySymbol = char
            }
            if (i == valString.length - 1){
                csPosition = "end"
                continue
            } else {
                return {
                "value":parseFloat(value), 
                "decimalSymbol":decimalSymbol,
                "currencySymbol":currencySymbol,
                "currencySymbolPosition":csPosition
            };
            }
        };
    };
};

const getPaidPostCurationVal = (post) => {
    const vertMen = post.querySelectorAll('.VerticalMenu li');
    if (vertMen.length <= 1) {
        // Payout Declined or List doesn't exist
        return null
    };
    const curatorItem = vertMen[vertMen.length + CURATION_INDEX];
    return parseValue(curatorItem.innerText);
}

const getPaidPostAuthorVal = (post) => {
    const vertMen = post.querySelectorAll('.VerticalMenu li');
    if (vertMen.length <= 1) {
        // Payout Declined or List doesn't exist
        return null
    };
    const curatorItem = vertMen[vertMen.length + AUTHOR_INDEX];
    return parseValue(curatorItem.innerText);
}

const parseValueText = (valString) => {
    const decimalSymbols = [
        ".",   // Period — used in English-speaking countries (US, UK, etc.)
        ",",   // Comma — used in most of Europe and Latin America
        "·",   // Middle dot — historical / some African and British contexts
        "٫",   // Arabic decimal separator
        "‧",   // Dot operator — occasionally used in Asian locales
        "⎖",   // Rare symbol seen in some technical notations
        "︰",   // Two-dot leader — used in some East Asian number formatting
    ];
    for (let i = valString.length - 1; i>= 0; i--){
        let char = valString[i];
        if (/^[0-9]$/.test(char)){ // Is character numeric?
            continue // Skip it
        } else if (decimalSymbols.includes(char)) { // Is character decimal?
            continue // Skip it
        } else {
            if (i < valString.length - 1){
                return valString.slice(0, i);
            }
        };
    };
}

const updatePaidPostTotalVal = (post, curSymb, csPos, totalVal, decSymb) => {
    const vertMen = post.querySelectorAll('.VerticalMenu li');
    if (!vertMen.length){
        return;
    };
    parent = vertMen[0].parentNode;
    const existingPastPay = parent.querySelector('#past_payout');
    if (existingPastPay){
        return;
    };
    
    const totalValStr = totalVal.toString().split('.');

    const integer = totalValStr[0]; // update digits before decimal symbol
    const integer_class = post.querySelectorAll('.Voting__pane span.integer')[0];
    integer_class.innerText = integer;

    let decimal = totalValStr[1]; // update digits after decimal symbol
    if (decimal.length == 1){
        decimal = decimal + "0"; // add 0 if decimal not 2 places
    };
    const decimal_class = post.querySelectorAll('.Voting__pane span.decimal')[0];
    decimal_class.innerText = decSymb + decimal;

    vertMen[vertMen.length + PAST_PAY_INDEX].id = "past_payout"
    valueText = parseValueText(vertMen[vertMen.length + PAST_PAY_INDEX].innerText);
    if (csPos == "start"){
        vertMen[vertMen.length + PAST_PAY_INDEX].innerHTML = "<span>" + valueText + curSymb + integer + decSymb + decimal + "</span>"; 
    } else {
        vertMen[vertMen.length + PAST_PAY_INDEX].innerHTML = "<span>" + valueText  + integer + decSymb + decimal + curSymb + "</span>"; 
    }
};

const addBeneficiaryVal = (post, beneficiaryValue, currencySymb, csPos, decSymb) => {
    const vertMen = post.querySelectorAll('.VerticalMenu li');
    if (!vertMen.length) return;

    const parent = vertMen[0].parentNode;

    const existingBeneficiary = parent.querySelector('#beneficiary-item');
    if (existingBeneficiary) {
        return
    }
    const beneficiaryLi = document.createElement('li');
    beneficiaryLi.id = "beneficiary-item";
    const beneficiarySpan = document.createElement('span');
    beneficiaryValStr = beneficiaryValue.toString().split('.');
    const integer = beneficiaryValStr[0];
    let decimal = beneficiaryValStr[1];

    let ben_text = getBeneficiaryInLanguage(USER_LANGUAGE);
    

    if (decimal.length == 1){
        decimal = decimal + "0";
    };
    
    console.log(csPos)
    if (csPos == "start"){
        beneficiarySpan.textContent = ben_text + currencySymb + integer + decSymb + decimal;
    } else {
        beneficiarySpan.textContent = ben_text + integer + decSymb + decimal + currencySymb;
    }
    beneficiaryLi.appendChild(beneficiarySpan);

    const lastItem = vertMen[vertMen.length + CURATION_INDEX];
    parent.insertBefore(beneficiaryLi, lastItem);
};

const updatePayoutValue = () => {
    let postsList = document.querySelectorAll('#posts_list li');
    let curationReturns;
    postsList.forEach(post => {
        let curationValue, authorValue, beneficiaryValue, totalValue;
        curationReturns = getPaidPostCurationVal(post)
        if (curationReturns){
            curationValue = curationReturns.value;
            decimalSymbol = curationReturns.decimalSymbol;
            currencySymbol = curationReturns.currencySymbol;
            csPosition = curationReturns.currencySymbolPosition;
            totalValue = 2 * curationValue;
        } else {
            return
        }
        authorReturns = getPaidPostAuthorVal(post)
        if (authorReturns){
            authorValue = authorReturns.value;
        } else {
            return
        }
        beneficiaryValue = parseFloat((curationValue - authorValue).toFixed(2));
        if (beneficiaryValue / totalValue < 0.01){
            beneficiaryValue = 0.00
        } else if (beneficiaryValue < 0.01) {
            beneficiaryValue = 0.00
        }

        if (beneficiaryValue == 0 || !beneficiaryValue){
            return
        }

        updatePaidPostTotalVal(post, currencySymbol, csPosition, totalValue, decimalSymbol);
        addBeneficiaryVal(post, beneficiaryValue, currencySymbol, csPosition, decimalSymbol);


    })
}