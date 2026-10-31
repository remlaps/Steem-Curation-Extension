const detectUserLanguage = () => {
    const select = document.querySelector('.SidePanel select.language');
    return select ? select.value : 'en';
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

const getReblogLabelsInLang = (user_lang) => {
    const labels = {
        buttonTitle: "Reblog with your own comment",
        dialogTitle: "Reblog with comment",
        titleLabel: "Title",
        titlePrefix: "Reblog:",
        titleReplyPrefix: "Reblog-reply:",
        commentLabel: "Your comment",
        commentPlaceholder: "Add your own thoughts about this post...",
        tagsLabel: "Tags",
        tagsPlaceholder: "Separate tags with spaces or commas",
        includeImageLabel: "Include image",
        excerptLabel: "Excerpt from the original post",
        postPreviewLabel: "Post preview",
        linkLabel: "Original post:",
        linkLabelBy: "Original post by",
        attributionNote: "Reblogged using the [Steem Curation Extension](https://github.com/remlaps/Steem-Curation-Extension). Steem Keychain is required to use this feature.",
        beneficiaryLabel: "Author beneficiary",
        beneficiaryNote: "{percent}% of this post's author rewards will be assigned to @{author}.",
        submit: "Reblog",
        cancel: "Cancel",
        working: "Broadcasting...",
        success: "Reblog submitted successfully.",
        loginRequired: "Please log in to Steem before reblogging.",
        keychainMissing: "Steem Keychain is required to reblog. Please install it to continue.",
        keychainLinkText: "Install Steem Keychain",
        loadFailed: "Could not load the original post.",
        broadcastFailed: "Broadcast failed:",
        confirmTitle: "Please confirm",
        confirmButton: "Post anyway",
        communityWarning: "The first tag is a community tag ({tag}). This post will be published in that community.",
        emptyCommentWarning: "You have not written your own comment.",
        shortDescriptionWarning: "Your comment is shorter than 100 words.",
        writeTab: "Write",
        previewTab: "Preview",
        toolbarBold: "Bold",
        toolbarItalic: "Italic",
        toolbarStrikethrough: "Strikethrough",
        toolbarHeading: "Heading",
        toolbarQuote: "Quote",
        toolbarCode: "Inline code",
        toolbarCodeBlock: "Code block",
        toolbarBulletList: "Bulleted list",
        toolbarNumberedList: "Numbered list",
        toolbarLink: "Link",
        toolbarImage: "Image",
        maximize: "Maximize",
        restore: "Restore",
        sideBySide: "Side by side",
        stacked: "Stacked"
    };

    switch (user_lang) {
        case 'fr':
            labels.buttonTitle = "Re-publier avec votre propre commentaire";
            labels.dialogTitle = "Re-publier avec commentaire";
            labels.titleLabel = "Titre";
            labels.titlePrefix = "Re-publication :";
            labels.titleReplyPrefix = "Re-publication (réponse) :";
            labels.commentLabel = "Votre commentaire";
            labels.commentPlaceholder = "Ajoutez vos propres réflexions sur cette publication...";
            labels.tagsLabel = "Tags";
            labels.tagsPlaceholder = "Séparez les tags par des espaces ou des virgules";
            labels.includeImageLabel = "Inclure l'image";
            labels.excerptLabel = "Extrait de la publication d'origine";
            labels.postPreviewLabel = "Aperçu de la publication";
            labels.linkLabel = "Publication d'origine :";
            labels.linkLabelBy = "Publication originale de";
            labels.attributionNote = "Re-publié avec l'extension [Steem Curation Extension](https://github.com/remlaps/Steem-Curation-Extension). Steem Keychain est requis pour utiliser cette fonctionnalité.";
            labels.beneficiaryLabel = "Bénéficiaire (auteur)";
            labels.beneficiaryNote = "{percent} % des récompenses d'auteur de cette publication seront attribuées à @{author}.";
            labels.submit = "Re-publier";
            labels.cancel = "Annuler";
            labels.working = "Diffusion en cours...";
            labels.success = "Re-publication envoyée avec succès.";
            labels.loginRequired = "Veuillez vous connecter à Steem avant de re-publier.";
            labels.keychainMissing = "Steem Keychain est requis pour re-publier. Veuillez l'installer pour continuer.";
            labels.keychainLinkText = "Installer Steem Keychain";
            labels.loadFailed = "Impossible de charger la publication d'origine.";
            labels.broadcastFailed = "Échec de la diffusion :";
            labels.confirmTitle = "Veuillez confirmer";
            labels.confirmButton = "Publier quand même";
            labels.communityWarning = "Le premier tag est un tag de communauté ({tag}). Cette publication sera publiée dans cette communauté.";
            labels.emptyCommentWarning = "Vous n'avez pas écrit votre propre commentaire.";
            labels.shortDescriptionWarning = "Votre commentaire compte moins de 100 mots.";
            labels.writeTab = "Écrire";
            labels.previewTab = "Aperçu";
            labels.toolbarBold = "Gras";
            labels.toolbarItalic = "Italique";
            labels.toolbarStrikethrough = "Barré";
            labels.toolbarHeading = "Titre";
            labels.toolbarQuote = "Citation";
            labels.toolbarCode = "Code en ligne";
            labels.toolbarCodeBlock = "Bloc de code";
            labels.toolbarBulletList = "Liste à puces";
            labels.toolbarNumberedList = "Liste numérotée";
            labels.toolbarLink = "Lien";
            labels.toolbarImage = "Image";
            labels.maximize = "Agrandir";
            labels.restore = "Restaurer";
            labels.sideBySide = "Côte à côte";
            labels.stacked = "Empilé";
            break;
        case 'it':
            labels.buttonTitle = "Ripubblica con il tuo commento";
            labels.dialogTitle = "Ripubblica con commento";
            labels.titleLabel = "Titolo";
            labels.titlePrefix = "Ripubblicazione:";
            labels.titleReplyPrefix = "Ripubblicazione (risposta):";
            labels.commentLabel = "Il tuo commento";
            labels.commentPlaceholder = "Aggiungi i tuoi pensieri su questo post...";
            labels.tagsLabel = "Tag";
            labels.tagsPlaceholder = "Separa i tag con spazi o virgole";
            labels.includeImageLabel = "Includi immagine";
            labels.excerptLabel = "Estratto dal post originale";
            labels.postPreviewLabel = "Anteprima del post";
            labels.linkLabel = "Post originale:";
            labels.linkLabelBy = "Post originale di";
            labels.attributionNote = "Ripubblicato con l'estensione [Steem Curation Extension](https://github.com/remlaps/Steem-Curation-Extension). Steem Keychain è necessario per utilizzare questa funzione.";
            labels.beneficiaryLabel = "Beneficiario (autore)";
            labels.beneficiaryNote = "Il {percent}% delle ricompense d'autore di questo post sarà assegnato a @{author}.";
            labels.submit = "Ripubblica";
            labels.cancel = "Annulla";
            labels.working = "Trasmissione in corso...";
            labels.success = "Ripubblicazione inviata con successo.";
            labels.loginRequired = "Accedi a Steem prima di ripubblicare.";
            labels.keychainMissing = "Steem Keychain è necessario per ripubblicare. Installalo per continuare.";
            labels.keychainLinkText = "Installa Steem Keychain";
            labels.loadFailed = "Impossibile caricare il post originale.";
            labels.broadcastFailed = "Trasmissione non riuscita:";
            labels.confirmTitle = "Conferma";
            labels.confirmButton = "Pubblica comunque";
            labels.communityWarning = "Il primo tag è un tag di comunità ({tag}). Questo post verrà pubblicato in quella comunità.";
            labels.emptyCommentWarning = "Non hai scritto un tuo commento.";
            labels.shortDescriptionWarning = "Il tuo commento contiene meno di 100 parole.";
            labels.writeTab = "Scrivi";
            labels.previewTab = "Anteprima";
            labels.toolbarBold = "Grassetto";
            labels.toolbarItalic = "Corsivo";
            labels.toolbarStrikethrough = "Barrato";
            labels.toolbarHeading = "Titolo";
            labels.toolbarQuote = "Citazione";
            labels.toolbarCode = "Codice inline";
            labels.toolbarCodeBlock = "Blocco di codice";
            labels.toolbarBulletList = "Elenco puntato";
            labels.toolbarNumberedList = "Elenco numerato";
            labels.toolbarLink = "Link";
            labels.toolbarImage = "Immagine";
            labels.maximize = "Ingrandisci";
            labels.restore = "Ripristina";
            labels.sideBySide = "Affiancati";
            labels.stacked = "Impilato";
            break;
        case 'ja':
            labels.buttonTitle = "自分のコメントを付けてリブログ";
            labels.dialogTitle = "コメント付きリブログ";
            labels.titleLabel = "タイトル";
            labels.titlePrefix = "リブログ:";
            labels.titleReplyPrefix = "リブログ（返信）:";
            labels.commentLabel = "あなたのコメント";
            labels.commentPlaceholder = "この投稿についてのあなたの考えを追加...";
            labels.tagsLabel = "タグ";
            labels.tagsPlaceholder = "タグはスペースまたはカンマで区切ってください";
            labels.includeImageLabel = "画像を含める";
            labels.excerptLabel = "元の投稿からの抜粋";
            labels.postPreviewLabel = "投稿プレビュー";
            labels.linkLabel = "元の投稿:";
            labels.linkLabelBy = "元の投稿者";
            labels.attributionNote = "[Steem Curation Extension](https://github.com/remlaps/Steem-Curation-Extension) を使用してリブログしました。この機能を使用するには Steem Keychain が必要です。";
            labels.beneficiaryLabel = "著者への報酬分配率";
            labels.beneficiaryNote = "この投稿の著者報酬の{percent}%は @{author} に割り当てられます。";
            labels.submit = "リブログ";
            labels.cancel = "キャンセル";
            labels.working = "送信中...";
            labels.success = "リブログが正常に送信されました。";
            labels.loginRequired = "リブログする前にSteemにログインしてください。";
            labels.keychainMissing = "リブログにはSteem Keychainが必要です。続行するにはインストールしてください。";
            labels.keychainLinkText = "Steem Keychainをインストール";
            labels.loadFailed = "元の投稿を読み込めませんでした。";
            labels.broadcastFailed = "送信に失敗しました:";
            labels.confirmTitle = "確認してください";
            labels.confirmButton = "それでも投稿する";
            labels.communityWarning = "最初のタグはコミュニティタグ（{tag}）です。この投稿はそのコミュニティに公開されます。";
            labels.emptyCommentWarning = "自分のコメントを書いていません。";
            labels.shortDescriptionWarning = "コメントが100語未満です。";
            labels.writeTab = "作成";
            labels.previewTab = "プレビュー";
            labels.toolbarBold = "太字";
            labels.toolbarItalic = "斜体";
            labels.toolbarStrikethrough = "取り消し線";
            labels.toolbarHeading = "見出し";
            labels.toolbarQuote = "引用";
            labels.toolbarCode = "インラインコード";
            labels.toolbarCodeBlock = "コードブロック";
            labels.toolbarBulletList = "箇条書き";
            labels.toolbarNumberedList = "番号付きリスト";
            labels.toolbarLink = "リンク";
            labels.toolbarImage = "画像";
            labels.maximize = "最大化";
            labels.restore = "元に戻す";
            labels.sideBySide = "並べて表示";
            labels.stacked = "上下に表示";
            break;
        case 'ko':
            labels.buttonTitle = "내 댓글과 함께 리블로그";
            labels.dialogTitle = "댓글과 함께 리블로그";
            labels.titleLabel = "제목";
            labels.titlePrefix = "리블로그:";
            labels.titleReplyPrefix = "리블로그(답글):";
            labels.commentLabel = "내 댓글";
            labels.commentPlaceholder = "이 게시물에 대한 생각을 추가하세요...";
            labels.tagsLabel = "태그";
            labels.tagsPlaceholder = "태그는 공백 또는 쉼표로 구분하세요";
            labels.includeImageLabel = "이미지 포함";
            labels.excerptLabel = "원본 게시물에서 발췌";
            labels.postPreviewLabel = "게시물 미리보기";
            labels.linkLabel = "원본 게시물:";
            labels.linkLabelBy = "원본 작성자";
            labels.attributionNote = "[Steem Curation Extension](https://github.com/remlaps/Steem-Curation-Extension)을(를) 사용하여 리블로그했습니다. 이 기능을 사용하려면 Steem Keychain이 필요합니다.";
            labels.beneficiaryLabel = "작성자 수혜 비율";
            labels.beneficiaryNote = "이 게시물의 작성자 보상 {percent}%가 @{author}에게 배정됩니다.";
            labels.submit = "리블로그";
            labels.cancel = "취소";
            labels.working = "전송 중...";
            labels.success = "리블로그가 성공적으로 전송되었습니다.";
            labels.loginRequired = "리블로그하기 전에 Steem에 로그인하세요.";
            labels.keychainMissing = "리블로그하려면 Steem Keychain이 필요합니다. 계속하려면 설치하세요.";
            labels.keychainLinkText = "Steem Keychain 설치";
            labels.loadFailed = "원본 게시물을 불러올 수 없습니다.";
            labels.broadcastFailed = "전송 실패:";
            labels.confirmTitle = "확인해 주세요";
            labels.confirmButton = "그래도 게시";
            labels.communityWarning = "첫 번째 태그가 커뮤니티 태그({tag})입니다. 이 게시물은 해당 커뮤니티에 게시됩니다.";
            labels.emptyCommentWarning = "자신의 댓글을 작성하지 않았습니다.";
            labels.shortDescriptionWarning = "댓글이 100단어 미만입니다.";
            labels.writeTab = "작성";
            labels.previewTab = "미리보기";
            labels.toolbarBold = "굵게";
            labels.toolbarItalic = "기울임꼴";
            labels.toolbarStrikethrough = "취소선";
            labels.toolbarHeading = "제목";
            labels.toolbarQuote = "인용";
            labels.toolbarCode = "인라인 코드";
            labels.toolbarCodeBlock = "코드 블록";
            labels.toolbarBulletList = "글머리 기호 목록";
            labels.toolbarNumberedList = "번호 매기기 목록";
            labels.toolbarLink = "링크";
            labels.toolbarImage = "이미지";
            labels.maximize = "최대화";
            labels.restore = "복원";
            labels.sideBySide = "나란히 보기";
            labels.stacked = "세로로 보기";
            break;
        case 'pl':
            labels.buttonTitle = "Rebloguj z własnym komentarzem";
            labels.dialogTitle = "Rebloguj z komentarzem";
            labels.titleLabel = "Tytuł";
            labels.titlePrefix = "Reblog:";
            labels.titleReplyPrefix = "Reblog (odpowiedź):";
            labels.commentLabel = "Twój komentarz";
            labels.commentPlaceholder = "Dodaj własne przemyślenia na temat tego posta...";
            labels.tagsLabel = "Tagi";
            labels.tagsPlaceholder = "Oddziel tagi spacjami lub przecinkami";
            labels.includeImageLabel = "Dołącz obraz";
            labels.excerptLabel = "Fragment oryginalnego posta";
            labels.postPreviewLabel = "Podgląd posta";
            labels.linkLabel = "Oryginalny post:";
            labels.linkLabelBy = "Oryginalny post autorstwa";
            labels.attributionNote = "Zreblogowano przy użyciu rozszerzenia [Steem Curation Extension](https://github.com/remlaps/Steem-Curation-Extension). Do korzystania z tej funkcji wymagany jest Steem Keychain.";
            labels.beneficiaryLabel = "Beneficjent (autor)";
            labels.beneficiaryNote = "{percent}% nagród autorskich z tego posta zostanie przypisane do @{author}.";
            labels.submit = "Rebloguj";
            labels.cancel = "Anuluj";
            labels.working = "Nadawanie...";
            labels.success = "Reblog został pomyślnie wysłany.";
            labels.loginRequired = "Zaloguj się do Steem przed reblogowaniem.";
            labels.keychainMissing = "Do reblogowania wymagany jest Steem Keychain. Zainstaluj go, aby kontynuować.";
            labels.keychainLinkText = "Zainstaluj Steem Keychain";
            labels.loadFailed = "Nie udało się załadować oryginalnego posta.";
            labels.broadcastFailed = "Nadawanie nie powiodło się:";
            labels.confirmTitle = "Potwierdź";
            labels.confirmButton = "Opublikuj mimo to";
            labels.communityWarning = "Pierwszy tag to tag społeczności ({tag}). Ten post zostanie opublikowany w tej społeczności.";
            labels.emptyCommentWarning = "Nie napisałeś własnego komentarza.";
            labels.shortDescriptionWarning = "Twój komentarz ma mniej niż 100 słów.";
            labels.writeTab = "Pisz";
            labels.previewTab = "Podgląd";
            labels.toolbarBold = "Pogrubienie";
            labels.toolbarItalic = "Kursywa";
            labels.toolbarStrikethrough = "Przekreślenie";
            labels.toolbarHeading = "Nagłówek";
            labels.toolbarQuote = "Cytat";
            labels.toolbarCode = "Kod w linii";
            labels.toolbarCodeBlock = "Blok kodu";
            labels.toolbarBulletList = "Lista punktowana";
            labels.toolbarNumberedList = "Lista numerowana";
            labels.toolbarLink = "Link";
            labels.toolbarImage = "Obraz";
            labels.maximize = "Maksymalizuj";
            labels.restore = "Przywróć";
            labels.sideBySide = "Obok siebie";
            labels.stacked = "Jeden pod drugim";
            break;
        case 'ru':
            labels.buttonTitle = "Реблог с вашим комментарием";
            labels.dialogTitle = "Реблог с комментарием";
            labels.titleLabel = "Заголовок";
            labels.titlePrefix = "Реблог:";
            labels.titleReplyPrefix = "Реблог (ответ):";
            labels.commentLabel = "Ваш комментарий";
            labels.commentPlaceholder = "Добавьте свои мысли об этом посте...";
            labels.tagsLabel = "Теги";
            labels.tagsPlaceholder = "Разделяйте теги пробелами или запятыми";
            labels.includeImageLabel = "Включить изображение";
            labels.excerptLabel = "Отрывок из оригинального поста";
            labels.postPreviewLabel = "Предпросмотр поста";
            labels.linkLabel = "Оригинальный пост:";
            labels.linkLabelBy = "Оригинальный пост от";
            labels.attributionNote = "Реблог выполнен с помощью расширения [Steem Curation Extension](https://github.com/remlaps/Steem-Curation-Extension). Для использования этой функции требуется Steem Keychain.";
            labels.beneficiaryLabel = "Бенефициар (автор)";
            labels.beneficiaryNote = "{percent}% авторских наград этого поста будет назначено @{author}.";
            labels.submit = "Реблог";
            labels.cancel = "Отмена";
            labels.working = "Отправка...";
            labels.success = "Реблог успешно отправлен.";
            labels.loginRequired = "Пожалуйста, войдите в Steem перед реблогом.";
            labels.keychainMissing = "Для реблога требуется Steem Keychain. Установите его, чтобы продолжить.";
            labels.keychainLinkText = "Установить Steem Keychain";
            labels.loadFailed = "Не удалось загрузить оригинальный пост.";
            labels.broadcastFailed = "Ошибка отправки:";
            labels.confirmTitle = "Подтвердите";
            labels.confirmButton = "Всё равно опубликовать";
            labels.communityWarning = "Первый тег — тег сообщества ({tag}). Пост будет опубликован в этом сообществе.";
            labels.emptyCommentWarning = "Вы не написали свой комментарий.";
            labels.shortDescriptionWarning = "Ваш комментарий содержит менее 100 слов.";
            labels.writeTab = "Написать";
            labels.previewTab = "Просмотр";
            labels.toolbarBold = "Полужирный";
            labels.toolbarItalic = "Курсив";
            labels.toolbarStrikethrough = "Зачёркнутый";
            labels.toolbarHeading = "Заголовок";
            labels.toolbarQuote = "Цитата";
            labels.toolbarCode = "Встроенный код";
            labels.toolbarCodeBlock = "Блок кода";
            labels.toolbarBulletList = "Маркированный список";
            labels.toolbarNumberedList = "Нумерованный список";
            labels.toolbarLink = "Ссылка";
            labels.toolbarImage = "Изображение";
            labels.maximize = "Развернуть";
            labels.restore = "Восстановить";
            labels.sideBySide = "Рядом";
            labels.stacked = "Стопкой";
            break;
        case 'es':
            labels.buttonTitle = "Reblog con tu propio comentario";
            labels.dialogTitle = "Reblog con comentario";
            labels.titleLabel = "Título";
            labels.titlePrefix = "Reblog:";
            labels.titleReplyPrefix = "Reblog (respuesta):";
            labels.commentLabel = "Tu comentario";
            labels.commentPlaceholder = "Añade tus propias reflexiones sobre esta publicación...";
            labels.tagsLabel = "Etiquetas";
            labels.tagsPlaceholder = "Separa las etiquetas con espacios o comas";
            labels.includeImageLabel = "Incluir imagen";
            labels.excerptLabel = "Extracto de la publicación original";
            labels.postPreviewLabel = "Vista previa de la publicación";
            labels.linkLabel = "Publicación original:";
            labels.linkLabelBy = "Publicación original de";
            labels.attributionNote = "Reblogueado con la extensión [Steem Curation Extension](https://github.com/remlaps/Steem-Curation-Extension). Se requiere Steem Keychain para usar esta función.";
            labels.beneficiaryLabel = "Beneficiario (autor)";
            labels.beneficiaryNote = "El {percent}% de las recompensas del autor de esta publicación se asignará a @{author}.";
            labels.submit = "Reblog";
            labels.cancel = "Cancelar";
            labels.working = "Transmitiendo...";
            labels.success = "Reblog enviado correctamente.";
            labels.loginRequired = "Inicia sesión en Steem antes de rebloguear.";
            labels.keychainMissing = "Se requiere Steem Keychain para rebloguear. Instálalo para continuar.";
            labels.keychainLinkText = "Instalar Steem Keychain";
            labels.loadFailed = "No se pudo cargar la publicación original.";
            labels.broadcastFailed = "Error al transmitir:";
            labels.confirmTitle = "Confirma";
            labels.confirmButton = "Publicar de todos modos";
            labels.communityWarning = "La primera etiqueta es una etiqueta de comunidad ({tag}). Esta publicación se publicará en esa comunidad.";
            labels.emptyCommentWarning = "No has escrito tu propio comentario.";
            labels.shortDescriptionWarning = "Tu comentario tiene menos de 100 palabras.";
            labels.writeTab = "Escribir";
            labels.previewTab = "Vista previa";
            labels.toolbarBold = "Negrita";
            labels.toolbarItalic = "Cursiva";
            labels.toolbarStrikethrough = "Tachado";
            labels.toolbarHeading = "Encabezado";
            labels.toolbarQuote = "Cita";
            labels.toolbarCode = "Código en línea";
            labels.toolbarCodeBlock = "Bloque de código";
            labels.toolbarBulletList = "Lista con viñetas";
            labels.toolbarNumberedList = "Lista numerada";
            labels.toolbarLink = "Enlace";
            labels.toolbarImage = "Imagen";
            labels.maximize = "Maximizar";
            labels.restore = "Restaurar";
            labels.sideBySide = "Lado a lado";
            labels.stacked = "Apilado";
            break;
        case 'uk':
            labels.buttonTitle = "Реблог з вашим коментарем";
            labels.dialogTitle = "Реблог з коментарем";
            labels.titleLabel = "Заголовок";
            labels.titlePrefix = "Реблог:";
            labels.titleReplyPrefix = "Реблог (відповідь):";
            labels.commentLabel = "Ваш коментар";
            labels.commentPlaceholder = "Додайте свої думки про цей пост...";
            labels.tagsLabel = "Теги";
            labels.tagsPlaceholder = "Розділяйте теги пробілами або комами";
            labels.includeImageLabel = "Включити зображення";
            labels.excerptLabel = "Уривок з оригінального посту";
            labels.postPreviewLabel = "Попередній перегляд посту";
            labels.linkLabel = "Оригінальний пост:";
            labels.linkLabelBy = "Оригінальний пост від";
            labels.attributionNote = "Реблог виконано за допомогою розширення [Steem Curation Extension](https://github.com/remlaps/Steem-Curation-Extension). Для використання цієї функції потрібен Steem Keychain.";
            labels.beneficiaryLabel = "Бенефіціар (автор)";
            labels.beneficiaryNote = "{percent}% авторських винагород цього посту буде призначено @{author}.";
            labels.submit = "Реблог";
            labels.cancel = "Скасувати";
            labels.working = "Надсилання...";
            labels.success = "Реблог успішно надіслано.";
            labels.loginRequired = "Будь ласка, увійдіть у Steem перед реблогом.";
            labels.keychainMissing = "Для реблогу потрібен Steem Keychain. Встановіть його, щоб продовжити.";
            labels.keychainLinkText = "Встановити Steem Keychain";
            labels.loadFailed = "Не вдалося завантажити оригінальний пост.";
            labels.broadcastFailed = "Помилка надсилання:";
            labels.confirmTitle = "Підтвердьте";
            labels.confirmButton = "Опублікувати попри все";
            labels.communityWarning = "Перший тег — тег спільноти ({tag}). Пост буде опубліковано в цій спільноті.";
            labels.emptyCommentWarning = "Ви не написали власний коментар.";
            labels.shortDescriptionWarning = "Ваш коментар містить менше 100 слів.";
            labels.writeTab = "Написати";
            labels.previewTab = "Перегляд";
            labels.toolbarBold = "Напівжирний";
            labels.toolbarItalic = "Курсив";
            labels.toolbarStrikethrough = "Закреслений";
            labels.toolbarHeading = "Заголовок";
            labels.toolbarQuote = "Цитата";
            labels.toolbarCode = "Вбудований код";
            labels.toolbarCodeBlock = "Блок коду";
            labels.toolbarBulletList = "Маркований список";
            labels.toolbarNumberedList = "Нумерований список";
            labels.toolbarLink = "Посилання";
            labels.toolbarImage = "Зображення";
            labels.maximize = "Розгорнути";
            labels.restore = "Відновити";
            labels.sideBySide = "Поруч";
            labels.stacked = "Стовпчиком";
            break;
    }

    return labels;
}