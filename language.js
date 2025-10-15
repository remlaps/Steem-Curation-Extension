const detectUserLanguage = () => {
    return document.querySelector('.SidePanel select.language').value
};

class UnsupportedLanguageError extends Error {
    constructor(locale) {
        super(`Unsupported language: ${locale}`)
        this.name = UnsupportedLanguageError;
    }
}

const getBeneficiaryInLanguage = (user_lang) => {
    let ben_text;
    if (user_lang == "en"){
        ben_text = " - Beneficiaries "
    } else if (user_lang == "fr") {
        ben_text = " - Bénéficiaires "
    } else if (user_lang == "it") {
        ben_text = " - Beneficiari "
    } else if (user_lang == "ja"){
        ben_text = " - 受益者 "
    } else if (user_lang == "ko"){
        ben_text = " - 수혜자 "
    } else if (user_lang == "pl"){
        ben_text = " - Beneficjenci "
    } else if (user_lang == "ru"){
        ben_text = " - Бенефициары "
    } else if (user_lang == "es"){
        ben_text = " - Beneficiarios "
    } else if (user_lang == "uk"){
        ben_text = " - Бенефіціари "
    } else {
        throw new UnsupportedLanguageError(user_lang) // Language not accounted for
    }

    return ben_text
}

