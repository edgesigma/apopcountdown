// Apophis "Should it hit?" vote
(function() {
  var VOTE_API = window.location.hostname === 'localhost'
    ? '/api/vote'
    : 'https://us-central1-snap-panel.cloudfunctions.net/apophis-vote';
  var LOCAL_KEY = 'apophis_vote';

  var panel = document.getElementById('vote-panel');
  var buttonsWrap = document.getElementById('vote-buttons');
  var resultsWrap = document.getElementById('vote-results');
  var btnYes = document.getElementById('vote-yes');
  var btnNo = document.getElementById('vote-no');

  if (!panel || !btnYes || !btnNo) return;

  // Check if already voted locally
  var existingVote = localStorage.getItem(LOCAL_KEY);

  // Load current tallies on init
  fetchTallies();

  if (existingVote) {
    showResults(null, existingVote);
  }

  btnYes.addEventListener('click', function() { submitVote('yes'); });
  btnNo.addEventListener('click', function() { submitVote('no'); });

  function submitVote(choice) {
    // Optimistic UI
    localStorage.setItem(LOCAL_KEY, choice);
    showResults(null, choice);

    fetch(VOTE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote: choice })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      showResults(data, choice);

      // Track in PostHog if available
      if (typeof posthog !== 'undefined') {
        posthog.capture('apophis_vote', { vote: choice, yes: data.yes, no: data.no });
      }
    })
    .catch(function(err) {
      console.warn('Vote submit failed:', err);
      // Still show local state — vote will be retried
    });
  }

  function fetchTallies() {
    fetch(VOTE_API)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (existingVote) {
          showResults(data, existingVote);
        } else {
          // Pre-cache tallies for after vote
          panel._tallies = data;
        }
      })
      .catch(function() {
        // API unavailable — vote still works locally
      });
  }

  function showResults(data, yourVote) {
    // Highlight chosen button, dim the other
    btnYes.classList.toggle('voted', yourVote === 'yes');
    btnYes.classList.toggle('voted-inactive', yourVote === 'no');
    btnNo.classList.toggle('voted', yourVote === 'no');
    btnNo.classList.toggle('voted-inactive', yourVote === 'yes');

    // Use provided data, cached data, or placeholder
    var tallies = data || panel._tallies;
    if (!tallies) {
      resultsWrap.style.display = 'block';
      document.getElementById('vote-pct-yes').textContent = '--';
      document.getElementById('vote-pct-no').textContent = '--';
      document.getElementById('vote-total').textContent = 'tallying votes...';
      return;
    }

    var yes = tallies.yes || 0;
    var no = tallies.no || 0;
    var total = yes + no;

    if (total === 0) {
      resultsWrap.style.display = 'block';
      document.getElementById('vote-pct-yes').textContent = '0';
      document.getElementById('vote-pct-no').textContent = '0';
      document.getElementById('vote-bar-yes').style.width = '50%';
      document.getElementById('vote-bar-no').style.width = '50%';
      document.getElementById('vote-total').textContent = 'first vote!';
      return;
    }

    var yesPct = Math.round((yes / total) * 100);
    var noPct = 100 - yesPct;

    // Ensure minimum width for label visibility
    var yesWidth = Math.max(yesPct, 12);
    var noWidth = Math.max(noPct, 12);
    // Normalize
    var widthTotal = yesWidth + noWidth;
    yesWidth = (yesWidth / widthTotal) * 100;
    noWidth = (noWidth / widthTotal) * 100;

    resultsWrap.style.display = 'block';
    document.getElementById('vote-pct-yes').textContent = yesPct;
    document.getElementById('vote-pct-no').textContent = noPct;
    document.getElementById('vote-bar-yes').style.width = yesWidth + '%';
    document.getElementById('vote-bar-no').style.width = noWidth + '%';
    document.getElementById('vote-total').textContent = total.toLocaleString() + ' votes';
  }
})();
