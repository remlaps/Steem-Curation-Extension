CURATION_INDEX = -1
AUTHOR_INDEX = -2
PAST_PAY_INDEX = -3

const parseValue = (valString) => {
    let value = '';
    let decimalSymbol;
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
        if (!isNaN(char)){ // Is character numeric?
            value = char + value;
        } else if (decimalSymbols.includes(char)) { // Is character decimal?
            value = "." + value;
            decimalSymbol = char;
        } else { // Character is currency symbol
            currencySymbol = char
            return {
                "value":parseFloat(value), 
                "decimalSymbol":decimalSymbol,
                "currencySymbol":currencySymbol
            };
        };
    };
}

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
        if (!isNaN(char)){ // Is character numeric?
            continue // Skip it
        } else if (decimalSymbols.includes(char)) { // Is character decimal?
            continue // Skip it
        } else {
            return valString.slice(0, i + 1);
        };
    };
}

const updatePaidPostTotalVal = (post, totalVal, decSymb) => {
    const vertMen = post.querySelectorAll('.VerticalMenu li');
    if (!vertMen.length){
        return
    }
    parent = vertMen[0].parentNode;
    const existingPastPay = parent.querySelector('#past_payout');
    if (existingPastPay){
        return
    }
    
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
    vertMen[vertMen.length + PAST_PAY_INDEX].innerText = valueText + integer + decSymb + decimal; 
};

const addBeneficiaryVal = (post, beneficiaryValue, currencySymb, decSymb) => {
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
    if (decimal.length == 1){
        decimal = decimal + "0";
    };
    beneficiarySpan.textContent = " - Beneficiaries " + currencySymb + integer + decSymb + decimal;
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
            decimalSymbol = curationReturns.decimalSymbol
            currencySymbol = curationReturns.currencySymbol
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

        updatePaidPostTotalVal(post, totalValue, decimalSymbol);
        addBeneficiaryVal(post, beneficiaryValue, currencySymbol, decimalSymbol);


    })
}