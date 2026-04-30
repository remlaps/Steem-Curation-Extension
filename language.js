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

const getEfficiencyMetricsInLang = (user_lang) => {
    let rewards = "Rewards";
    let contributed = "Contributed";
    let received = "Received";
    let author = "Author";

    switch (user_lang) {
        case "fr":
            rewards = "Récompenses";
            contributed = "A contribué";
            received = "Reçu";
            author = "Auteur";
            break;
        case "it":
            rewards = "Ricompense";
            contributed = "Contribuito";
            received = "Ricevuto";
            author = "Autore";
            break;
        case "ja":
            rewards = "報酬"
            contributed = "寄稿"
            received = "受け取った"
            author = "著者"
            break;
        case "ko":
            rewards = "보상";
            contributed = "기여했다";
            received = "받았다";
            author = "작가";
            break;
        case "pl":
            rewards = "Nagrody";
            contributed = "Wkład";
            received = "Otrzymane";
            author = "Autor";
            break;
        case "ru":
            rewards = "Награды";
            contributed = "Внесено";
            received = "Полученный";
            author = "Автор";
            break
        case "es":
            rewards = "Recompensas";
            contributed = "Contribuyó";
            received = "Recibido";
            author = "Autor";
            break
        case "uk":
            rewards = "Нагороди";
            contributed = "Внесок";
            received = "Отримано";
            author = "Автор";
            break;
    }

    return {
        rewards,
        contributed,
        received,
        author
    }
}

const formatValueLanguage = (currencySymbol = "$", value, user_lang) => {
    // If value is already a formatted string (e.g., "1.0k", "123k", "1.2M"), use it directly
    if (typeof value === 'string') {
        if(['fr', 'pl', 'ru', 'uk'].includes(user_lang)) return `${value} ${currencySymbol}`;
        else return `${currencySymbol}${value}`;
    }
    // For numeric values, check if finite
    if (!isFinite(value)) return;
    if(['fr', 'pl', 'ru', 'uk'].includes(user_lang)) return `${value} ${currencySymbol}`;
    else return `${currencySymbol}${value}`;
}

const formatDateLanguage = (date, user_lang) => {
    const LOCALE_MAP = {
        en: 'en-US',
        fr: 'fr-FR',
        ja: 'ja-JP',
        ko: 'ko-KR',
        pl: 'pl-PL',
        ru: 'ru-RU',
        es: 'es-ES',
        uk: 'uk-UA'
    };
    const formattedDate = new Intl.DateTimeFormat(LOCALE_MAP[user_lang] ?? user_lang, {month: '2-digit', day:'2-digit'}).format(date);
    return formattedDate;
}

const getEfficiencyGraphInLang = (user_lang) => {
    let date = "Date";
    let efficiency = "Efficiency";
    let weightedEff = "Weighted Eff";
    let voterReceived = "Voter Received";
    let totalValue = "Post Total";
    let mean = "Mean";
    let median = "Median";

    switch (user_lang){
        case 'fr':
            date = "Date";
            efficiency = "Efficacité";
            weightedEff = "Pondéré Eff";
            voterReceived = "Électeur Reçu";
            totalValue = "Valeur Totale";
            mean = "Moyenne";
            median = "Médiane";
            break;
        case 'it':
            date = "Data";
            efficiency = "Efficienza";
            weightedEff = "Eff Ponderata";
            voterReceived = "Elettore Ricevuto";
            totalValue = "Valore Totale";
            mean = "Media";
            median = "Mediana";
            break;
        case 'ja':
            date = "日付";
            efficiency = "効率";
            weightedEff = "加重効率";
            voterReceived = "投票者受付";
            totalValue = "合計金額";
            mean = "平均";
            median = "中央値";
            break;
        case 'ko':
            date = "날짜";
            efficiency = "능률";
            weightedEff = "가중 효율성";
            voterReceived = "유권자 접수";
            totalValue = "총 가치";
            mean = "평균";
            median = "중앙값";
            break;
        case 'pl':
            date = "Data";
            efficiency = "Efektywność";
            weightedEff = "Ważona Ef";
            voterReceived = "Wyborca ​​Otrzymał";
            totalValue = "Wartość Całkowita";
            mean = "Średnia";
            median = "Mediana";
            break;
        case 'ru':
            date = "Дата";
            efficiency = "Эффективность";
            weightedEff = "Взвешенная Эфф";
            voterReceived = "Избиратели Полученный";
            totalValue = "Общая стоимость";
            mean = "Среднее";
            median = "Медиана";
            break;
        case 'es':
            date = "Fecha";
            efficiency = "Eficiencia";
            weightedEff = "Ef Ponderada";
            voterReceived = "Votante Recibido";
            totalValue = "Valor Total";
            mean = "Media";
            median = "Mediana";
            break
        case 'uk':
            date = "Дата";
            efficiency = "Ефективність";
            weightedEff = "Зважена Еф";
            voterReceived = "Отримано виборця";
            totalValue = "Загальна вартість";
            mean = "Середній";
            median = "Медіана";
            break;
    }

    return {
        date,
        efficiency,
        weightedEff,
        voterReceived,
        totalValue,
        mean,
        median
    }
}

const getEfficiencyToggle = (user_lang) =>{
    let feather = "Efficiency (click for Weighted Efficiency)"
    let dumbbell = "Weighted Efficiency (click for Efficiency)"

    switch (user_lang){
        case 'fr':
            feather = "Efficacité (cliquer pour pondérée)";
            dumbbell = "Pondéré (cliquez pour Efficacité)";
            break;
        case 'it':
            feather = "Efficienza (clicca per Ponderato)";
            dumbbell = "Ponderato (clicca per Efficienza)";
            break;
        case 'ja':
            feather = "効率（クリックすると重み付けされます）";
            dumbbell = "加重（効率についてはクリック）";
            break;
        case 'ko':
            feather = "효율성(가중치를 보려면 클릭하세요)";
            dumbbell = "가중치 적용(효율성을 위해 클릭)";
            break;
        case 'pl':
            feather = "Efektywność (kliknij, aby zobaczyć Ważony)";
            dumbbell = "Ważony (kliknij, aby zobaczyć Efektywność)";
            break;
        case 'ru':
            feather = "Эффективность (нажмите, чтобы увидеть взвешенную)";
            dumbbell = "Взвешенный (нажмите, чтобы увидеть эффективность)";
            break;
        case 'es':
            feather = "Eficiencia (haga clic para Ponderado)";
            dumbbell = "Ponderado (haga clic para Eficiencia)";
            break;
        case 'uk':
            feather = "Ефективність (натисніть для Зважена)";
            dumbbell = "Зважена (натисніть для визначення Ефективність)";
            break;
    }

    return {
        feather,
        dumbbell
    }
}

const getGraphLabelsInLang = (user_lang) => {
    let time = "Time";
    let value = "Value";
    let votes = "Votes";
    let postNumber = "Post Number";
    let category = "Category";
    let payout = "Payout";

    switch (user_lang) {
        case 'fr':
            time = "Temps";
            value = "Valeur";
            votes = "Votes";
            postNumber = "Numéro de publication";
            category = "Catégorie";
            payout = "Paiement";
            break;
        case 'it':
            time = "Tempo";
            value = "Valore";
            votes = "Voti";
            postNumber = "Numero post";
            category = "Categoria";
            payout = "Pagamento";
            break;
        case 'ja':
            time = "時間";
            value = "価値";
            votes = "投票";
            postNumber = "投稿番号";
            category = "カテゴリー";
            payout = "支払い";
            break;
        case 'ko':
            time = "시간";
            value = "가치";
            votes = "투표";
            postNumber = "게시물 번호";
            category = "카테고리";
            payout = "지급";
            break;
        case 'pl':
            time = "Czas";
            value = "Wartość";
            votes = "Głosy";
            postNumber = "Numer postu";
            category = "Kategoria";
            payout = "Wypłata";
            break;
        case 'ru':
            time = "Время";
            value = "Значение";
            votes = "Голоса";
            postNumber = "Номер поста";
            category = "Категория";
            payout = "Выплата";
            break;
        case 'es':
            time = "Tiempo";
            value = "Valor";
            votes = "Votos";
            postNumber = "Número de publicación";
            category = "Categoría";
            payout = "Pago";
            break;
        case 'uk':
            time = "Час";
            value = "Значення";
            votes = "Голоси";
            postNumber = "Номер поста";
            category = "Категорія";
            payout = "Виплата";
            break;
    }

    return {
        time,
        value,
        votes,
        postNumber,
        category,
        payout
    }
}

const getWordTimeMetricsInLang = (user_lang) => {
    let words = "words";
    let minRead = "min read";
    let min = "min";
    let hr = "hr";
    let d = "d";

    switch (user_lang) {
        case 'fr':
            words = "mots";
            minRead = "min de lecture";
            min = "min";
            hr = "h";
            d = "j";
            break;
        case 'it':
            words = "parole";
            minRead = "min di lettura";
            min = "min";
            hr = "h";
            d = "g";
            break;
        case 'ja':
            words = "語";
            minRead = "分で読む";
            min = "分";
            hr = "時間";
            d = "日";
            break;
        case 'ko':
            words = "단어";
            minRead = "분 읽기";
            min = "분";
            hr = "시간";
            d = "일";
            break;
        case 'pl':
            words = "słów";
            minRead = "min czytania";
            min = "min";
            hr = "godz";
            d = "d";
            break;
        case 'ru':
            words = "слов";
            minRead = "мин чтения";
            min = "мин";
            hr = "ч";
            d = "д";
            break;
        case 'es':
            words = "palabras";
            minRead = "min de lectura";
            min = "min";
            hr = "h";
            d = "d";
            break;
        case 'uk':
            words = "слів";
            minRead = "хв читання";
            min = "хв";
            hr = "год";
            d = "д";
            break;
    }

    return {
        words,
        minRead,
        min,
        hr,
        d
    }
}

const getGraphTitlesInLang = (user_lang) => {
    let postValueOverTime = "Post Value Over Time ($)";
    let totalVotesOverTime = "Total Votes Over Time";
    let previousWeekPayouts = "Previous Week Payouts";
    let weekPayoutSummary = "Week Payout Summary";
    let totalValue = "Total Value";
    let organicValue = "Organic Value";
    let burnValue = "Burn Value";
    let totalVotes = "Total Votes";
    let payoutLabel = "Payout:";

    switch (user_lang) {
        case 'fr':
            postValueOverTime = "Valeur du post au fil du temps ($)";
            totalVotesOverTime = "Total des votes au fil du temps";
            previousWeekPayouts = "Paiements de la semaine précédente";
            weekPayoutSummary = "Résumé des paiements de la semaine";
            totalValue = "Valeur totale";
            organicValue = "Valeur organique";
            burnValue = "Valeur de brûlage";
            totalVotes = "Total des votes";
            payoutLabel = "Paiement :";
            break;
        case 'it':
            postValueOverTime = "Valore del post nel tempo ($)";
            totalVotesOverTime = "Voti totali nel tempo";
            previousWeekPayouts = "Pagamenti della settimana precedente";
            weekPayoutSummary = "Riepilogo pagamenti settimanali";
            totalValue = "Valore totale";
            organicValue = "Valore organico";
            burnValue = "Valore di bruciatura";
            totalVotes = "Voti totali";
            payoutLabel = "Pagamento:";
            break;
        case 'ja':
            postValueOverTime = "時間経過による投稿価値 ($)";
            totalVotesOverTime = "時間経過による総投票数";
            previousWeekPayouts = "前週の支払い";
            weekPayoutSummary = "週間支払いサマリー";
            totalValue = "合計価値";
            organicValue = "オーガニック価値";
            burnValue = "バーン価値";
            totalVotes = "総投票数";
            payoutLabel = "支払い：";
            break;
        case 'ko':
            postValueOverTime = "시간에 따른 게시물 가치 ($)";
            totalVotesOverTime = "시간에 따른 총 투표 수";
            previousWeekPayouts = "이전 주 지급";
            weekPayoutSummary = "주간 지급 요약";
            totalValue = "총 가치";
            organicValue = "유기 가치";
            burnValue = "소각 가치";
            totalVotes = "총 투표 수";
            payoutLabel = "지급:";
            break;
        case 'pl':
            postValueOverTime = "Wartość postu w czasie ($)";
            totalVotesOverTime = "Łączne głosy w czasie";
            previousWeekPayouts = "Wypłaty z poprzedniego tygodnia";
            weekPayoutSummary = "Podsumowanie wypłat tygodniowych";
            totalValue = "Wartość całkowita";
            organicValue = "Wartość organiczna";
            burnValue = "Wartość spalania";
            totalVotes = "Łączne głosy";
            payoutLabel = "Wypłata:";
            break;
        case 'ru':
            postValueOverTime = "Стоимость поста со временем ($)";
            totalVotesOverTime = "Всего голосов со временем";
            previousWeekPayouts = "Выплаты за предыдущую неделю";
            weekPayoutSummary = "Сводка выплат за неделю";
            totalValue = "Общая стоимость";
            organicValue = "Органическая стоимость";
            burnValue = "Стоимость сжигания";
            totalVotes = "Всего голосов";
            payoutLabel = "Выплата:";
            break;
        case 'es':
            postValueOverTime = "Valor del post a lo largo del tiempo ($)";
            totalVotesOverTime = "Votos totales a lo largo del tiempo";
            previousWeekPayouts = "Pagos de la semana anterior";
            weekPayoutSummary = "Resumen de pagos semanales";
            totalValue = "Valor total";
            organicValue = "Valor orgánico";
            burnValue = "Valor de quema";
            totalVotes = "Votos totales";
            payoutLabel = "Pago:";
            break;
        case 'uk':
            postValueOverTime = "Вартість поста з часом ($)";
            totalVotesOverTime = "Загальна кількість голосів з часом";
            previousWeekPayouts = "Виплати за попередній тиждень";
            weekPayoutSummary = "Підсумок виплат за тиждень";
            totalValue = "Загальна вартість";
            organicValue = "Органічна вартість";
            burnValue = "Вартість спалення";
            totalVotes = "Загальна кількість голосів";
            payoutLabel = "Виплата:";
            break;
    }

    return {
        postValueOverTime,
        totalVotesOverTime,
        previousWeekPayouts,
        weekPayoutSummary,
        totalValue,
        organicValue,
        burnValue,
        totalVotes,
        payoutLabel
    }
}

const getCurationOverlayInLang = (user_lang) => {
    let curationInfo = "CURATION INFO";
    let postInfo = "Post Info";
    let wordCountReadingTime = "Word count / Reading time:";
    let imagesLinksTags = "[#images / #links / #tags]:";
    let tags = "Tags:";
    let audienceVotesValues = "Audience, Votes, and Values";
    let resteems = "# Resteems:";
    let feedReach = "Feed-reach:";
    let dollarsPerFeed = "$ / feed:";
    let bots = "# bots / % bots:";
    let steemit = "Steemit:";
    let vote = "vote";
    let votes = "votes";
    let organicValue = "Organic value";
    let authorInfo = "Author Info";
    let walletInfo = "Wallet Info";
    let posts = "Posts:";
    let commentsPost = "Comments / Post:";
    let repliesPost = "Replies / Post:";
    let powerdown = "Powerdown %:";
    let min = "min.";

    switch (user_lang) {
        case 'fr':
            curationInfo = "INFO CURATION";
            postInfo = "Info publication";
            wordCountReadingTime = "Nombre de mots / Temps de lecture :";
            imagesLinksTags = "[#images / #liens / #tags] :";
            tags = "Tags :";
            audienceVotesValues = "Audience, votes et valeurs";
            resteems = "# Resteems :";
            feedReach = "Portée du fil :";
            dollarsPerFeed = "$ / fil :";
            bots = "# bots / % bots :";
            steemit = "Steemit :";
            vote = "vote";
            votes = "votes";
            organicValue = "Valeur organique";
            authorInfo = "Info auteur";
            walletInfo = "Info portefeuille";
            posts = "Publications :";
            commentsPost = "Commentaires / Publication :";
            repliesPost = "Réponses / Publication :";
            powerdown = "Réduction de mise % :";
            min = "min.";
            break;
        case 'it':
            curationInfo = "INFO CURAZIONE";
            postInfo = "Info post";
            wordCountReadingTime = "Conteggio parole / Tempo di lettura:";
            imagesLinksTags = "[#immagini / #link / #tag]:";
            tags = "Tag:";
            audienceVotesValues = "Pubblico, voti e valori";
            resteems = "# Resteem:";
            feedReach = "Copertura feed:";
            dollarsPerFeed = "$ / feed:";
            bots = "# bot / % bot:";
            steemit = "Steemit:";
            vote = "voto";
            votes = "voti";
            organicValue = "Valore organico";
            authorInfo = "Info autore";
            walletInfo = "Info portafoglio";
            posts = "Post:";
            commentsPost = "Commenti / Post:";
            repliesPost = "Risposte / Post:";
            powerdown = "Riduzione del potere %:";
            min = "min.";
            break;
        case 'ja':
            curationInfo = "キュレーション情報";
            postInfo = "投稿情報";
            wordCountReadingTime = "単語数 / 読書時間:";
            imagesLinksTags = "[#画像 / #リンク / #タグ]:";
            tags = "タグ:";
            audienceVotesValues = "オーディエンス、投票、価値";
            resteems = "# リステーム:";
            feedReach = "フィード到達数:";
            dollarsPerFeed = "$ / フィード:";
            bots = "# ボット / % ボット:";
            steemit = "Steemit:";
            vote = "投票";
            votes = "投票";
            organicValue = "オーガニック価値";
            authorInfo = "作成者情報";
            walletInfo = "ウォレット情報";
            posts = "投稿:";
            commentsPost = "コメント / 投稿:";
            repliesPost = "返信 / 投稿:";
            powerdown = "ステーク削減 %:";
            min = "分";
            break;
        case 'ko':
            curationInfo = "큐레이션 정보";
            postInfo = "게시물 정보";
            wordCountReadingTime = "단어 수 / 읽기 시간:";
            imagesLinksTags = "[#이미지 / #링크 / #태그]:";
            tags = "태그:";
            audienceVotesValues = "청중, 투표 및 가치";
            resteems = "# 리스팀:";
            feedReach = "피드 도달:";
            dollarsPerFeed = "$ / 피드:";
            bots = "# 봇 / % 봇:";
            steemit = "Steemit:";
            vote = "투표";
            votes = "투표";
            organicValue = "유기 가치";
            authorInfo = "작가 정보";
            walletInfo = "지갑 정보";
            posts = "게시물:";
            commentsPost = "댓글 / 게시물:";
            repliesPost = "답글 / 게시물:";
            powerdown = "스테이크 감소 %:";
            min = "분";
            break;
        case 'pl':
            curationInfo = "INFO KURACJI";
            postInfo = "Info postu";
            wordCountReadingTime = "Liczba słów / Czas czytania:";
            imagesLinksTags = "[#obrazy / #linki / #tagi]:";
            tags = "Tagi:";
            audienceVotesValues = "Odbiorcy, głosy i wartości";
            resteems = "# Resteemy:";
            feedReach = "Zasięg kanału:";
            dollarsPerFeed = "$ / kanał:";
            bots = "# boty / % boty:";
            steemit = "Steemit:";
            vote = "głos";
            votes = "głosy";
            organicValue = "Wartość organiczna";
            authorInfo = "Info autora";
            walletInfo = "Info portfela";
            posts = "Posty:";
            commentsPost = "Komentarze / Post:";
            repliesPost = "Odpowiedzi / Post:";
            powerdown = "Zmniejszenie mocy %:";
            min = "min.";
            break;
        case 'ru':
            curationInfo = "ИНФОРМАЦИЯ О КУРАЦИИ";
            postInfo = "Информация о посте";
            wordCountReadingTime = "Количество слов / Время чтения:";
            imagesLinksTags = "[#изображения / #ссылки / #теги]:";
            tags = "Теги:";
            audienceVotesValues = "Аудитория, голоса и ценности";
            resteems = "# Рестимы:";
            feedReach = "Охват ленты:";
            dollarsPerFeed = "$ / лента:";
            bots = "# боты / % боты:";
            steemit = "Steemit:";
            vote = "голос";
            votes = "голосов";
            organicValue = "Органическая стоимость";
            authorInfo = "Информация об авторе";
            walletInfo = "Информация о кошельке";
            posts = "Посты:";
            commentsPost = "Комментарии / Пост:";
            repliesPost = "Ответы / Пост:";
            powerdown = "Снижение ставки %:";
            min = "мин.";
            break;
        case 'es':
            curationInfo = "INFO CURACIÓN";
            postInfo = "Info publicación";
            wordCountReadingTime = "Recuento de palabras / Tiempo de lectura:";
            imagesLinksTags = "[#imágenes / #enlaces / #etiquetas]:";
            tags = "Etiquetas:";
            audienceVotesValues = "Audiencia, votos y valores";
            resteems = "# Resteems:";
            feedReach = "Alcance del feed:";
            dollarsPerFeed = "$ / feed:";
            bots = "# bots / % bots:";
            steemit = "Steemit:";
            vote = "voto";
            votes = "votos";
            organicValue = "Valor orgánico";
            authorInfo = "Info autor";
            walletInfo = "Info billetera";
            posts = "Publicaciones:";
            commentsPost = "Comentarios / Publicación:";
            repliesPost = "Respuestas / Publicación:";
            powerdown = "Reducción de participación %:";
            min = "min.";
            break;
        case 'uk':
            curationInfo = "ІНФОРМАЦІЯ ПРО КУРАЦІЮ";
            postInfo = "Інформація про пост";
            wordCountReadingTime = "Кількість слів / Час читання:";
            imagesLinksTags = "[#зображення / #посилання / #теги]:";
            tags = "Теги:";
            audienceVotesValues = "Аудиторія, голоси та цінності";
            resteems = "# Рестими:";
            feedReach = "Охоплення стрічки:";
            dollarsPerFeed = "$ / стрічка:";
            bots = "# боти / % боти:";
            steemit = "Steemit:";
            vote = "голос";
            votes = "голосів";
            organicValue = "Органічна вартість";
            authorInfo = "Інформація про автора";
            walletInfo = "Інформація про гаманець";
            posts = "Пости:";
            commentsPost = "Коментарі / Пост:";
            repliesPost = "Відповіді / Пост:";
            powerdown = "Зниження ставки %:";
            min = "хв.";
            break;
    }

    return {
        curationInfo,
        postInfo,
        wordCountReadingTime,
        imagesLinksTags,
        tags,
        audienceVotesValues,
        resteems,
        feedReach,
        dollarsPerFeed,
        bots,
        steemit,
        vote,
        votes,
        organicValue,
        authorInfo,
        walletInfo,
        posts,
        commentsPost,
        repliesPost,
        powerdown,
        min
    }
}