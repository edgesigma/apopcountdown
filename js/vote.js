// Apophis "Should it hit?" vote — CTA + modal
(function() {
  var VOTE_API = window.location.hostname === 'localhost'
    ? '/api/vote'
    : 'https://us-central1-snap-panel.cloudfunctions.net/apophis-vote';
  var LOCAL_KEY = 'apophis_vote';

  var cta = document.getElementById('vote-cta');
  var ctaText = document.getElementById('vote-cta-text');
  var modal = document.getElementById('vote-modal');
  var closeBtn = document.getElementById('vote-modal-close');
  var btnYes = document.getElementById('vote-yes');
  var btnNo = document.getElementById('vote-no');
  var resultsWrap = document.getElementById('vote-results');

  if (!cta || !modal || !btnYes || !btnNo) return;

  var existingVote = localStorage.getItem(LOCAL_KEY);
  var tallies = null;
  var ctaCycleTimer = null;
  var ctaIndex = 0;

  // Load tallies on init
  fetchTallies();

  // If already voted, show results immediately when modal opens
  if (existingVote) {
    showResults(null, existingVote);
  }

  // CTA click opens modal
  cta.addEventListener('click', function() {
    modal.classList.add('open');
    cta.style.display = 'none';
    stopCtaCycle();
  });

  // Close modal
  closeBtn.addEventListener('click', function() {
    modal.classList.remove('open');
    cta.style.display = '';
    startCtaCycle();
  });

  // Close on backdrop click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('open');
      cta.style.display = '';
      startCtaCycle();
    }
  });

  btnYes.addEventListener('click', function() { submitVote('yes'); });
  btnNo.addEventListener('click', function() { submitVote('no'); });

  function submitVote(choice) {
    localStorage.setItem(LOCAL_KEY, choice);
    existingVote = choice;
    showResults(null, choice);

    fetch(VOTE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote: choice })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      tallies = data;
      showResults(data, choice);

      if (typeof posthog !== 'undefined') {
        posthog.capture('apophis_vote', { vote: choice, yes: data.yes, no: data.no });
      }
    })
    .catch(function(err) {
      console.warn('Vote submit failed:', err);
    });
  }

  function fetchTallies() {
    fetch(VOTE_API)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        tallies = data;
        if (existingVote) {
          showResults(data, existingVote);
        }
        startCtaCycle();
      })
      .catch(function() {
        startCtaCycle();
      });
  }

  function showResults(data, yourVote) {
    btnYes.classList.toggle('voted', yourVote === 'yes');
    btnYes.classList.toggle('voted-inactive', yourVote === 'no');
    btnNo.classList.toggle('voted', yourVote === 'no');
    btnNo.classList.toggle('voted-inactive', yourVote === 'yes');

    var t = data || tallies;
    if (!t) {
      resultsWrap.style.display = 'block';
      document.getElementById('vote-pct-yes').textContent = '--';
      document.getElementById('vote-pct-no').textContent = '--';
      document.getElementById('vote-total').textContent = 'tallying votes...';
      return;
    }

    var yes = t.yes || 0;
    var no = t.no || 0;
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

    var yesWidth = Math.max(yesPct, 12);
    var noWidth = Math.max(noPct, 12);
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

  // ── CTA cycling animation ──

  function getTallyLine() {
    if (!tallies) return null;
    var yes = tallies.yes || 0;
    var no = tallies.no || 0;
    var total = yes + no;
    if (total === 0) return null;
    var yesPct = Math.round((yes / total) * 100);
    return total.toLocaleString() + ' votes \u2014 ' + yesPct + '% YES';
  }

  function getCtaMessages() {
    var msgs = ['Cast your vote!'];
    var tally = getTallyLine();
    if (tally) msgs.push(tally);
    return msgs;
  }

  function cycleCtaText() {
    var msgs = getCtaMessages();
    if (msgs.length < 2) return;

    ctaIndex = (ctaIndex + 1) % msgs.length;
    var next = msgs[ctaIndex];

    ctaText.classList.add('fade-out');
    setTimeout(function() {
      ctaText.textContent = next;
      ctaText.classList.remove('fade-out');
      ctaText.classList.add('fade-in');
      setTimeout(function() {
        ctaText.classList.remove('fade-in');
      }, 250);
    }, 250);
  }

  function startCtaCycle() {
    stopCtaCycle();
    ctaCycleTimer = setInterval(cycleCtaText, 3500);
  }

  function stopCtaCycle() {
    if (ctaCycleTimer) {
      clearInterval(ctaCycleTimer);
      ctaCycleTimer = null;
    }
  }
})();
