// Apophis Countdown Widget Embed Script (~1KB)
// Usage: <div id="apophis-widget" data-width="600" data-height="400" data-mode="approach"></div>
//        <script src="https://apophiscountdown.com/widget/embed.js"></script>
(function() {
  var container = document.getElementById('apophis-widget');
  if (!container) return;

  var width = container.getAttribute('data-width') || '600';
  var height = container.getAttribute('data-height') || '400';
  var mode = container.getAttribute('data-mode') || 'orbital';
  var theme = container.getAttribute('data-theme') || 'dark';

  // Determine base URL from script src
  var scripts = document.getElementsByTagName('script');
  var baseUrl = '';
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('widget/embed.js') !== -1) {
      baseUrl = scripts[i].src.replace('/widget/embed.js', '');
      break;
    }
  }
  if (!baseUrl) baseUrl = window.location.origin;

  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/widget/widget.html?mode=' + mode + '&theme=' + theme;
  iframe.width = width;
  iframe.height = height;
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'lazy');
  iframe.title = 'Apophis Countdown Widget';

  container.appendChild(iframe);
})();
