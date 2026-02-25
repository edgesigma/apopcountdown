// Main page initialization
(function () {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Copy embed
  window.copyEmbed = function () {
    const code = document.querySelector('.api-pre');
    if (code) {
      navigator.clipboard.writeText(code.textContent.trim()).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'copied';
        setTimeout(() => { btn.textContent = 'copy'; }, 2000);
      });
    }
  };
})();
