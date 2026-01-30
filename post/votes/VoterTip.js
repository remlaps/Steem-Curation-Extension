class VoterTip {
    /**
   * @param {HTMLLIElement} li - the single vote row
   * @param {Object} vote     - the matching vote object from post.details.active_votes
   * @param {Function} render - ({li, vote, user}) => HTML string
   */
   constructor({
    li, 
    post, 
    getPostCached, 
    vote, 
    language,
    render = VoterTip.defaultRender,
    days

   }
    , ) {
        this.li = li;
        this.post = post;
        this.getPostCached = getPostCached;
        this.vote = vote;
        this.user = li.querySelector('.vote-username')?.textContent.trim();
        this.language = language;
        this.render = render;
        this.days = days;
        this.efficiencyData = [];
        this.weightedEffAvg = 0;
        this.totalCurationRew = 0.00;
        this.contributedValue = 0.00;
        this.totAuthor = 0;
        this.isCancelled = false;
        this.downloadStarted = false;
        this.downloadComplete = false;
        this.downloadPromise = null;
        this.lastProcessedIndex = -1;

        // ensure row can anchor absolutely-positioned tooltip

        if (getComputedStyle(this.li).position === 'static'){
            this.li.style.position = 'relative';
        }

        this.tip = document.createElement('div');
        this.tip.className = 'voter-tooltip';
        this.tip.innerHTML = this.render({ li: this.li, vote: this.vote, user: this.user });
        this.tip.addEventListener('click', e => e.stopPropagation());
        this.li.appendChild(this.tip);
        this.addChart();
    }

    static defaultRender({li, vote, user}){
        const languageData = getEfficiencyMetricsInLang(this.language);
        return `
            <div class="voter-tip__header">
                <div class="voter_metrics">
                    <div class="voter_metric>
                        <span class="voter_metric__label">${languageData['rewards']}:</span>
                        <span id="totalRewards" class="voter_metric__value">0</span>
                    </div>
                    <div class="voter_metric>
                        <span class="voter_metric__label">${languageData['contributed']}:</span>
                        <span id="contributedValue" class="voter_metric__value">$0.00</span>
                    </div>
                    <div class="voter_metric>
                        <span class="voter_metric__label">${languageData['received']}:</span>
                        <span id="totalCurationRew" class="voter_metric__value">$0.00</span>
                    </div>
                    <div class="voter_metric>
                        <span class="voter_metric__label">${languageData['author']}:</span>
                        <span id="authorVotes" class="voter_metric__value">0</span>
                    </div>
                </div>
            </div>
            <div class="voter-tip__chart"></div>
    `
    }
    async prefetchEfficiencyData() {
        if (!this.scatter) return;
        if (this.downloadComplete) return;
        // Only prevent starting if there's an active non-cancelled download
        if (this.downloadStarted && !this.isCancelled) return;
        
        // Reset progress tracking only for truly fresh downloads (not restarts)
        // If lastProcessedIndex is -1, it's a fresh start; if >= 0, we're resuming
        if (this.lastProcessedIndex === -1) {
            // Fresh start - ensure we start from the beginning
            this.lastProcessedIndex = -1;
        }
        // Otherwise, preserve lastProcessedIndex to resume from where we left off
        
        this.downloadStarted = true;
        this.isCancelled = false;
        
        this.downloadPromise = (async () => {
            const res = await getHistoricCurationRewards(this.user, this.post, this.days);
            
            if (this.isCancelled) return;
            
            const rows = res?.rows ?? [];
            const cols = res?.cols ?? {};
            const tIdx = cols.time, aIdx = cols.author, pIdx = cols.permlink, vIdx = cols.vests;

            // Start from lastProcessedIndex + 1 to resume where we left off
            for (let i = this.lastProcessedIndex + 1; i < rows.length; i++) {
                const reward = rows[i];
                if (this.isCancelled) return;
                
                const timeSec = reward[tIdx];

                if (!timeSec) continue;

                // fetch historic post (potentially cached)
                let histPost;
                for (let i = 0; i < 5; i++){
                    if (this.isCancelled) return;
                    
                    try{
                        histPost = await this.getPostCached(reward[aIdx], reward[pIdx], timeSec);
                    } catch (err){
                        if (
                            err?.message?.includes("503") ||
                            err?.status === 503 ||
                            err?.code === 503
                        ){
                            await sleep(100)
                        } else {
                            console.error(`Failed after ${i+1} retries`, err);
                        };
                    };  
                };
                
                if (this.isCancelled) return;
                if (!histPost) continue;
                
                let sameAuthor = false;

                if (histPost.author === this.post.author){
                    this.totAuthor += 1
                    sameAuthor = true;
                };

                const voterVests = Number(reward[vIdx]) || 0;
                const totalVests   = Number(histPost.details.total_vests ?? histPost.details.totalVests ?? 0);
                // Use totalRshares (calculated in getVoteData, already divided by 1000000) 
                // rather than total_rshares (raw API value, might be in different units)
                const totalRshares = Number(histPost.details.totalRshares ?? 0);
            
                // Find the voter's vote in the historic post to get their rshares
                const histVote = histPost.details.active_votes?.find(v => v.voter === this.user);
                
                // If the vote doesn't exist in the historic post, skip this entry
                // (shouldn't happen if they received a curation reward, but safety check)
                if (!histVote) continue;
                
                const voterRshares = histVote.rshares / 1000000;

                if (totalVests <= 0 || totalRshares <= 0 || voterRshares <= 0 || voterVests <= 0) continue;
                
                const pctContributed = voterRshares / totalRshares;
                const pctReceived = voterVests / totalVests;
                if (pctContributed <= 0 || pctReceived <= 0) continue;

                const efficiency = Math.round((pctReceived / pctContributed) * 100);

                // Use the historic vote's percent for weighted efficiency, not the current post's vote
                const voteWeight = histVote.percent / 10000;

                const weightedEfficiency = Math.round(efficiency * voteWeight);

                const tsMs = timeSec * 1000;

                const totalValue = Number(histPost.details.total_payout_value.toFixed(2));
                const voterRewardValue = Number((pctReceived * totalValue).toFixed(2));
                const voterContributedValue = Number((pctContributed * totalValue).toFixed(2));
                this.contributedValue += voterContributedValue;

                this.totalCurationRew += voterRewardValue;

                const point = {
                    tsMs: tsMs,
                    efficiency: efficiency,
                    weightedEff: weightedEfficiency,
                    voterRewardValue: voterRewardValue,
                    totalValue: totalValue,
                    sameAuthor: sameAuthor
                }

                this.efficiencyData.push(point);
                this.scatter.pushPoint(point);

                this.updateMetrics();

                // Update progress tracking after successfully processing the reward
                this.lastProcessedIndex = i;

                await sleep(50);
                
                if (this.isCancelled) return;
            }

            if (this.isCancelled) return;
            
            this.scatter.finalize();
            this.scatter.addStatsLines();
            this.downloadComplete = true;
        })();
        
        await this.downloadPromise;
    }

    addChart() {
        this.chartContainer = this.tip.querySelector('.voter-tip__chart');
        if (!this.chartContainer){
            console.warn(`Chart container not found`);
            return;
        };

        if (!this.scatter){
            this.scatter = new EfficiencyScatter({
                anchorTs: this.post.details.created,
                days: this.days,
                containerEl: this.chartContainer,
                label: `@${this.user}`,
                yBaselineMin: 0,
                language: this.language
            })
        }
    }

    updateMetrics() {
        const formatK = (value, whole = true) => {
            value = Number(value) || 0;

            if (value < 1000) return `${whole ? Math.round(value) : value.toFixed(2)}`
            
            if (value < 100000) return `${(value / 1000).toFixed(1)}k`

            if (value < 1000000) return `${Math.round(value / 1000)}k`

            else return `${(value / 1000000).toFixed(1)}M`
        }
        const totalRewards = this.tip.querySelector('#totalRewards');
        totalRewards.textContent = formatK(this.efficiencyData.length);
        const contributedValue = this.tip.querySelector('#contributedValue');
        contributedValue.textContent = formatValueLanguage('$', formatK(this.contributedValue, false), this.language);
        const totalCurationRew = this.tip.querySelector('#totalCurationRew');
        totalCurationRew.textContent = formatValueLanguage('$', formatK(this.totalCurationRew, false, '$'), this.language);
        const authorVotes = this.tip.querySelector('#authorVotes');
        authorVotes.textContent = formatK(this.totAuthor);
    }

    show(){
        this.tip.classList.add('visible');
    }
    hide() {
        this.tip.classList.remove('visible');
    }

    cancelDownload() {
        this.isCancelled = true;
    }

    resetCancellation() {
        // If the download was cancelled, reset downloadStarted to allow restart
        if (this.isCancelled && this.downloadStarted) {
            this.downloadStarted = false;
        }
        this.isCancelled = false;
    }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
