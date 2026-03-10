// API client — static JSON version for GitHub Pages hosting
// Fetches pre-generated JSON files; computes countdown + current position client-side.
const ApophisAPI = {
  _cache: {},
  _cacheTTL: {},

  async _fetch(endpoint, cacheDuration) {
    const now = Date.now();
    if (this._cache[endpoint] && this._cacheTTL[endpoint] > now) {
      return this._cache[endpoint];
    }

    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
      const data = await res.json();
      this._cache[endpoint] = data;
      this._cacheTTL[endpoint] = now + (cacheDuration || 60000);
      return data;
    } catch (err) {
      console.warn(`Failed to fetch ${endpoint}:`, err.message);
      if (this._cache[endpoint]) return this._cache[endpoint];
      throw err;
    }
  },

  // Countdown is computed entirely client-side — no fetch needed
  arrival() {
    const ARRIVAL_DATE = new Date('2029-04-13T21:46:00Z');
    const ARRIVAL_MS = ARRIVAL_DATE.getTime();
    const now = Date.now();
    let diff = ARRIVAL_MS - now;
    const isPast = diff < 0;
    if (isPast) diff = Math.abs(diff);

    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const years = Math.floor(totalDays / 365.25);
    const remainingDays = Math.floor(totalDays - years * 365.25);

    return Promise.resolve({
      arrival: {
        iso: ARRIVAL_DATE.toISOString(),
        unix: Math.floor(ARRIVAL_MS / 1000),
        description: 'April 13, 2029 at 21:46 UTC'
      },
      countdown: {
        isPast,
        years,
        days: remainingDays,
        hours: totalHours % 24,
        minutes: totalMinutes % 60,
        seconds: totalSeconds % 60,
        totalDays,
        totalHours,
        totalMinutes,
        totalSeconds
      },
      computedAt: new Date().toISOString()
    });
  },

  position() {
    return this._fetch('/api/position.json', 24 * 60 * 60 * 1000);
  },

  facts() {
    return this._fetch('/api/facts.json', 24 * 60 * 60 * 1000);
  },

  async orbit() {
    const data = await this._fetch('/api/orbit.json', 24 * 60 * 60 * 1000);
    // Recompute current positions client-side from orbital elements
    data.apophis.currentPosition = this._computeCurrentPosition(data.apophis.elements);
    data.earth.currentPosition = this._computeCurrentPosition(data.earth.elements);
    return data;
  },

  // Client-side Kepler solver for current position
  _solveKepler(M, e) {
    const TWO_PI = 2 * Math.PI;
    M = ((M % TWO_PI) + TWO_PI) % TWO_PI;
    let E = M + e * Math.sin(M);
    for (let i = 0; i < 50; i++) {
      const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-10) break;
    }
    return E;
  },

  _computeCurrentPosition(el) {
    const DEG = Math.PI / 180;
    const TWO_PI = 2 * Math.PI;
    const a = el.semi_major_axis_au;
    const e = el.eccentricity;
    const i = (el.inclination_deg || 0) * DEG;
    const omega = (el.ascending_node_deg || 0) * DEG;
    const w = (el.arg_perihelion_deg || 0) * DEG;
    const M0 = (el.mean_anomaly_deg || 0) * DEG;
    const period = (el.period_days || 365.25) * 86400000;
    const epochJD = el.epoch_jd || 2460400.5;
    const epochMs = (epochJD - 2440587.5) * 86400000;
    const dt = Date.now() - epochMs;
    const n = TWO_PI / period * 86400000;
    const M = M0 + n * dt;
    const E = this._solveKepler(M, e);
    const v = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );
    const r = a * (1 - e * e) / (1 + e * Math.cos(v));
    const xO = r * Math.cos(v), yO = r * Math.sin(v);
    const cosW = Math.cos(w), sinW = Math.sin(w);
    const cosO = Math.cos(omega), sinO = Math.sin(omega);
    const cosI = Math.cos(i), sinI = Math.sin(i);
    return {
      x: (cosO*cosW - sinO*sinW*cosI)*xO + (-cosO*sinW - sinO*cosW*cosI)*yO,
      y: (sinO*cosW + cosO*sinW*cosI)*xO + (-sinO*sinW + cosO*cosW*cosI)*yO,
      z: (sinW*sinI)*xO + (cosW*sinI)*yO
    };
  }
};
