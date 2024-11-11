function createToggleControl() {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'sce-control';

    const titleLink = document.createElement('a');
    titleLink.href = 'https://github.com/remlaps/Steem-Curation-Extension';
    titleLink.textContent = 'Steem Curation Extension';
    titleLink.target = '_blank';
    titleLink.className = 'sce-title-link';

    const controlRow = document.createElement('div');
    controlRow.className = 'sce-control-row';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'resteem-toggle';
    // Get saved state, default to true if not set
    checkbox.checked = localStorage.getItem('showResteems') !== 'false';

    const label = document.createElement('label');
    label.htmlFor = 'resteem-toggle';
    label.textContent = 'Show Resteems';

    const computedStyle = window.getComputedStyle(document.body);
    label.style.fontFamily = computedStyle.fontFamily;
    titleLink.style.fontFamily = computedStyle.fontFamily;
    label.style.color = computedStyle.color;

    controlRow.appendChild(checkbox);
    controlRow.appendChild(label);
    controlDiv.appendChild(titleLink);
    controlDiv.appendChild(controlRow);
    document.body.appendChild(controlDiv);

    checkbox.addEventListener('change', function () {
        // Save state when changed
        localStorage.setItem('showResteems', this.checked);
        updateResteemVisibility();
    });

    // Apply initial state
    updateResteemVisibility();
}

function setControlBoxVisibility(visibility) {
    const controlBox = document.querySelector('.sce-control');
    if (controlBox) {
      controlBox.style.display = visibility;
    } else {
      console.warn("Control row element with class 'sce-control' not found!");
    }
  }

function updateResteemVisibility(username) {
    const checkbox = document.getElementById('resteem-toggle');

    if (checkbox) {
        //***
        // Hide the checkbox control if we're not on a feed link
        // */
        if (!window.location.pathname.endsWith('/feed')) {
            setControlBoxVisibility('none'); // Hides the control box
            return;
        }

        const summaries = document.querySelectorAll('.articles__summary');
        if (summaries.length > 200) {
            setControlBoxVisibility('none'); // Hides the control box
            return;
        }

        setControlBoxVisibility('block'); // Shows the control box

        const feedOwner = window.location.pathname.split('/')[1].replace('@', '');
        if ( summaries.lenth > 20 ) {
            checkbox.checked = !checkbox.checked;
            return;            
        }
        summaries.forEach(async summary => {
            const hasResteem = summary.querySelector('.articles__resteem') !== null;
            if (hasResteem) {

                const targetElement = summary.querySelector
                ('#posts_list > ul > li > div > div.articles__summary-header > div.user > div.user__col.user__col--right > span.user__name > span > strong > a');
                const resteemedAuthor = targetElement.textContent;
                const isFollowed = await isFollowing ( steemApi, feedOwner, resteemedAuthor );
                // console.debug(`${feedOwner} following ${resteemedAuthor}: ${isFollowed}`);
                
                const parentLi = summary.closest('li');
                if (parentLi && !isFollowed && resteemedAuthor !== feedOwner) {
                    parentLi.style.display = checkbox.checked ? 'block' : 'none';
                }
            }
        });
    }
}

const cacheExpiration = 30 * 60 * 1000; // 30 minutes in milliseconds
let followingCache = null;

async function isFollowing(steemApi, follower, following) {
  const cacheKey = `${follower}:${following}`;

  // Check if the cache is loaded in memory
  if (!followingCache) {
    // If the cache is not loaded, try to load it from local storage
    followingCache = await getCachedResult();
  }

  // Check the cache
  if (followingCache && followingCache.has(cacheKey) && Date.now() - followingCache.get(cacheKey).timestamp < cacheExpiration) {
    return followingCache.get(cacheKey).result;
  }

  // If the cache is not found or expired, fetch the data from the API
  const params = [follower, following, "blog", 1];
  const url = steemApi;
  const method = "condenser_api.get_following";
  try {
    const response = await fetch(`${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: 1
      })
    });
    const data = await response.json();
    const result = data.result;
    let isFollowing = false;
    if (result.length > 0 && result[0].following === following) {
      isFollowing = true;
    }

    // Update the in-memory cache
    if (!followingCache) {
      followingCache = new Map();
    }
    followingCache.set(cacheKey, {
      result: isFollowing,
      timestamp: Date.now()
    });

    // Save the updated cache to local storage
    await setCachedResult(followingCache);

    return isFollowing;
  } catch (error) {
    throw error;
  }
}

async function getCachedResult() {
  const cachedValue = localStorage.getItem('followingCache');
  if (cachedValue) {
    return new Map(JSON.parse(cachedValue));
  }
  return null;
}

async function setCachedResult(cache) {
  localStorage.setItem('followingCache', JSON.stringify(Array.from(cache.entries())));
}