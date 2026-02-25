// Apophis closest approach: April 13, 2029 at 21:46 UTC
(function () {
  const ARRIVAL = new Date('2029-04-13T21:46:00Z').getTime();

  function update() {
    let diff = ARRIVAL - Date.now();
    const past = diff < 0;
    if (past) diff = -diff;

    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    const y = Math.floor(d / 365.25);
    const rd = Math.floor(d - y * 365.25);

    const el = id => document.getElementById(id);
    el('cd-years').textContent = y;
    el('cd-days').textContent = String(rd).padStart(3, '0');
    el('cd-hours').textContent = String(h % 24).padStart(2, '0');
    el('cd-minutes').textContent = String(m % 60).padStart(2, '0');
    el('cd-seconds').textContent = String(s % 60).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
})();
