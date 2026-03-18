/**
 * Azetta.ai - Shared Components
 * Injects navbar and footer into pages that include placeholder elements.
 * 
 * Usage:
 *   <div id="site-header" data-active="manifesto"></div>
 *   <div id="site-footer"></div>
 *   <script src="js/components.js"></script>
 * 
 * For blog posts (one level deep):
 *   <div id="site-header" data-active="blog" data-prefix=".."></div>
 *   <script src="../js/components.js"></script>
 */
(function () {
  'use strict';

  // Detect path prefix from the header element or default to ''
  var headerEl = document.getElementById('site-header');
  var footerEl = document.getElementById('site-footer');

  var prefix = '';
  if (headerEl && headerEl.dataset.prefix) {
    prefix = headerEl.dataset.prefix + '/';
  }

  var activePage = headerEl ? (headerEl.dataset.active || '') : '';

  // ─── Navbar ───
  function renderHeader() {
    if (!headerEl) return;

    var home = prefix + 'index.html';
    var nav = [
      { label: 'Our Mission',  href: home + '#about',    id: 'about'    },
      { label: 'Our Research', href: home + '#research',  id: 'research' },
      { label: 'Our Products', href: home + '#products',  id: 'products' },
      { label: 'Our Team',     href: home + '#team',      id: 'team'     },
      { label: 'Our Blog',     href: prefix + 'blogs.html', id: 'blog'  }
    ];

    // On the home page, use bare anchors so the scroll is instant
    if (activePage === 'home') {
      nav[0].href = '#about';
      nav[1].href = '#research';
      nav[2].href = '#products';
      nav[3].href = '#team';
    }

    var navItems = nav.map(function (item) {
      var cls = item.id === activePage ? ' class="active"' : '';
      return '<li><a href="' + item.href + '"' + cls + '>' + item.label + '</a></li>';
    }).join('\n          ');

    var brandHref = activePage === 'home' ? '#hero' : prefix + 'index.html#hero';

    var logoSvg = '<img class="nav-logo" src="' + prefix + 'assets/logo.png" alt="Azetta.ai logo" aria-hidden="true">';

    headerEl.outerHTML =
      '<header class="site-header" aria-label="Primary navigation">\n' +
      '  <div class="nav-container">\n' +
      '    <a class="brand-mark" href="' + brandHref + '" aria-label="Azetta.ai home">\n' +
      '      ' + logoSvg + '<span class="brand-name">azetta.ai</span>\n' +
      '    </a>\n' +
      '    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation">\n' +
      '      <span class="sr-only">Toggle navigation</span>\n' +
      '      <span class="nav-toggle-line"></span>\n' +
      '      <span class="nav-toggle-line"></span>\n' +
      '      <span class="nav-toggle-line"></span>\n' +
      '    </button>\n' +
      '    <nav class="primary-nav" id="primary-navigation">\n' +
      '      <ul class="nav-list">\n' +
      '        ' + navItems + '\n' +
      '      </ul>\n' +
      '      <div class="nav-cta">\n' +
      '        <a class="btn btn-primary" href="mailto:contact@azetta.ai">Reach Out</a>\n' +
      '      </div>\n' +
      '    </nav>\n' +
      '  </div>\n' +
      '</header>';
  }

  // ─── Footer ───
  function renderFooter() {
    if (!footerEl) return;

    footerEl.outerHTML =
      '<footer class="site-footer" role="contentinfo">\n' +
      '  <div class="footer-container">\n' +
      '    <div class="footer-main">\n' +
      '      <div class="footer-brand">\n' +
      '        <a href="' + prefix + 'index.html#hero" class="footer-logo">Azetta.ai</a>\n' +
      '        <p class="footer-tagline">Pioneering Physics Grounded AI</p>\n' +
      '      </div>\n' +
      '      <nav class="footer-nav" aria-label="Footer navigation">\n' +
      '        <div class="footer-nav-group">\n' +
      '          <h4>Company</h4>\n' +
      '          <ul>\n' +
      '            <li><a href="' + prefix + 'index.html#about">Our Mission</a></li>\n' +
      '            <li><a href="' + prefix + 'index.html#research">Our Research</a></li>\n' +
      '            <li><a href="' + prefix + 'index.html#products">Our Products</a></li>\n' +
      '            <li><a href="' + prefix + 'blogs.html">Our Blog</a></li>\n' +
      '            <li><a href="mailto:contact@azetta.ai">Reach Out</a></li>\n' +
      '          </ul>\n' +
      '        </div>\n' +
      '        <div class="footer-nav-group">\n' +
      '          <h4>Resources</h4>\n' +
      '          <ul>\n' +
      '            <li><a href="https://github.com/mlnomadpy/nmn" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.4rem;"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>GitHub</a></li>\n' +
      '            <li><a href="https://pypi.org/project/nmn/" target="_blank" rel="noopener">PyPI</a></li>\n' +
      '            <li><a href="https://azetta.ai/assets/nomodelulu.pdf" target="_blank" rel="noopener">Whitepaper</a></li>\n' +
      '          </ul>\n' +
      '        </div>\n' +
      '      </nav>\n' +
      '    </div>\n' +
      '    <div class="footer-bottom">\n' +
      '      <p class="footer-copyright">© ' + new Date().getFullYear() + ' Azetta.ai. All rights reserved.</p>\n' +
      '      <p class="footer-legal">\n' +
      '        <a href="mailto:legal@azetta.ai">Privacy Policy</a>\n' +
      '        <span class="separator">•</span>\n' +
      '        <a href="mailto:legal@azetta.ai">Terms of Service</a>\n' +
      '      </p>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '</footer>';
  }

  renderHeader();
  renderFooter();
})();
