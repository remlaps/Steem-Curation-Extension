document.getElementById('checkFollowers').addEventListener('click', function() {
  const accountName = document.getElementById('accountName').value;
  if (accountName) {
    document.getElementById('progress').innerHTML = `<p><strong>Checking followers for account: ${accountName}</strong></p>`;
    getFollowers(accountName);
  } else {
    alert('Please enter a Steemit account name.');
  }
});

async function getFollowers(accountName) {
  // Clear previous account information
  document.getElementById('results').innerHTML = '';
  document.getElementById('progress').innerHTML = '';

  let followers = [];
  let lastFollower = null;
  let previousLastFollower = null;
  let iterationCounter = 0; // Initialize the iteration counter
  const limit = 100; // Setting the limit to 100 as per your change

  while (true) {
    const params = JSON.stringify({
      jsonrpc: "2.0",
      method: "condenser_api.get_followers",
      params: [accountName, lastFollower, "blog", limit],
      id: 1
    });

    const response = await fetch('https://api.steemit.com', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    const newFollowers = data.result;

    // If no new followers are returned, break the loop
    if (!newFollowers || newFollowers.length === 0) {
      break;
    }

    // If we are continuing from the last follower, remove the duplicate entry
    if (lastFollower && newFollowers[0].follower === lastFollower) {
      newFollowers.shift();
    }

    if (newFollowers.length > 0) {
      followers = followers.concat(newFollowers);
      previousLastFollower = lastFollower;
      lastFollower = newFollowers[newFollowers.length - 1].follower;

      // Increment the iteration counter
      iterationCounter++;

      // Update progress after every 5 iterations
      if (iterationCounter === 5) {
        document.getElementById('progress').innerHTML = `<p><strong>Fetched ${followers.length} followers so far...</strong></p>`;
        iterationCounter = 0; // Reset the iteration counter
      }
    }

    // If we received fewer followers than the limit - 1, we have reached the end
    if (newFollowers.length < limit - 1) {
      break;
    }

    // If the last follower hasn't changed, we have reached the end
    if (lastFollower === previousLastFollower) {
      break;
    }
  }
  

  const totalFollowers = followers.length;
  const reputations = followers.map(f => f.reputation).sort((a, b) => a - b);
  const medianReputation = calculateMedian(reputations);

  // Calculate Follower Strength
  const followerStrength = calculateFollowerStrength(totalFollowers, medianReputation);
  
  // After the while loop completes (iteration through followers list is complete)
  // Clear the progress indicator
  document.getElementById('progress').innerHTML = '';  

  document.getElementById('results').innerHTML = `
	<p><strong>Account Name:</strong> ${accountName}</p>
	<p><strong>Total Followers:</strong> ${totalFollowers}</p>
	<p><strong>Median Follower Reputation:</strong> ${medianReputation.toFixed(2)}</p>
	<p><strong>Follower Network Strength:</strong> ${Number(followerStrength).toFixed(2)}</p>
  `;

  // Log the total followers, median reputation, and follower strength
  console.log(`Total Followers: ${totalFollowers}`);
  console.log(`Median Follower Reputation: ${medianReputation}`);
  console.log(`Follower Network Strength: ${followerStrength}`);
}

function calculateMedian(numbers) {
  const mid = Math.floor(numbers.length / 2);
  if (numbers.length % 2 === 0) {
    return (numbers[mid - 1] + numbers[mid]) / 2;
  } else {
    return numbers[mid];
  }
}

function calculateFollowerStrength(followerCount, medianReputation) {
  const maxFollowerCount = 2000; // Max follower count for normalization
  const maxReputation = Math.min(102, 40 + 62 * (Math.max(0, (maxFollowerCount - followerCount)) / maxFollowerCount));

  const threshold = 30;
  const minFollowers = 20;
  let normMedianReputation = 0;
  let normFollowerCount = 0;

  if (medianReputation > threshold && followerCount >= minFollowers ) {
    normMedianReputation = ((medianReputation - threshold) / (maxReputation - threshold));
    normMedianReputation = Math.min(1, normMedianReputation);

    normFollowerCount = ( followerCount - minFollowers ) / ( maxFollowerCount - minFollowers );
	normFollowerCount = Math.min( 1, normFollowerCount );
	
    // Calculate distance from bottom-left corner
    const distance = Math.sqrt(Math.pow(normFollowerCount, 2) + Math.pow(normMedianReputation, 2));
	console.log(`Normalized followers: ${normFollowerCount}, Normalized reputation: ${normMedianReputation}`);

    // Calculate strength based on distance
    const strength = Math.max(distance, 0.01);
    return strength.toFixed(2);
  } else {
    return 0.01.toFixed(2);
  }
}

// Function to retrieve version number from manifest.json
function getVersionNumber() {
  return chrome.runtime.getManifest().version;
}

// Function to update the HTML content of the popup with the version number
function updatePopupVersion() {
  var versionElement = document.getElementById('version');
  if (versionElement) {
    versionElement.textContent = getVersionNumber();
  }
}

// Call the updatePopupVersion function when the popup is loaded
document.addEventListener('DOMContentLoaded', function() {
  updatePopupVersion();
});
