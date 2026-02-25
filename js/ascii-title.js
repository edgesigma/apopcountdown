// Animated ASCII art title for "APOPHIS"
(function () {
  const el = document.getElementById('ascii-title');
  if (!el) return;

  // Hand-crafted ASCII art — ANSI Shadow style
  const lines = [
    ' █████╗ ██████╗  ██████╗ ██████╗ ██╗  ██╗██╗███████╗',
    '██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║  ██║██║██╔════╝',
    '███████║██████╔╝██║   ██║██████╔╝███████║██║███████╗ ',
    '██╔══██║██╔═══╝ ██║   ██║██╔═══╝ ██╔══██║██║╚════██║',
    '██║  ██║██║     ╚██████╔╝██║     ██║  ██║██║███████║ ',
    '╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝ '
  ];

  const fullText = lines.join('\n');
  let i = 0;
  const speed = 12; // characters per frame — fast reveal
  const startDelay = 100;

  // First render empty to hold space
  el.textContent = lines.map(l => ' '.repeat(l.length)).join('\n');

  function reveal() {
    if (i >= fullText.length) {
      el.textContent = fullText;
      // After full reveal, add a subtle flicker
      setTimeout(addGlitch, 2000);
      return;
    }

    i += speed;
    const visible = fullText.substring(0, i);
    const remaining = fullText.substring(i).replace(/[^\n]/g, ' ');
    el.textContent = visible + remaining;

    requestAnimationFrame(reveal);
  }

  setTimeout(reveal, startDelay);

  // Occasional subtle character glitch
  function addGlitch() {
    const chars = '█╗╔═║╚╝░▒▓';
    const text = fullText.split('');
    const glitchCount = 3 + Math.floor(Math.random() * 5);
    const positions = [];

    for (let g = 0; g < glitchCount; g++) {
      const pos = Math.floor(Math.random() * text.length);
      if (text[pos] !== '\n' && text[pos] !== ' ') {
        positions.push({ pos, original: text[pos] });
        text[pos] = chars[Math.floor(Math.random() * chars.length)];
      }
    }

    el.textContent = text.join('');

    setTimeout(() => {
      el.textContent = fullText;
      // Schedule next glitch
      setTimeout(addGlitch, 4000 + Math.random() * 6000);
    }, 80);
  }
})();
