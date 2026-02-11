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

    var nav = [
      { label: 'Overview', href: prefix + 'index.html#hero', id: 'overview' },
      { label: 'Periodica', href: prefix + 'index.html#periodica', id: 'periodica' },
      { label: 'Contact', href: prefix + 'index.html#connect', id: 'contact' },
      { label: 'Manifesto', href: prefix + 'manifesto.html', id: 'manifesto' },
      { label: 'Team', href: prefix + 'team.html', id: 'team' },
      { label: 'Blog', href: prefix + 'blogs.html', id: 'blog' },
      { label: 'Newsroom', href: prefix + 'news.html', id: 'newsroom' }
    ];

    // For index.html, use hash-only links for on-page sections
    if (activePage === 'home') {
      nav[0].href = '#hero';
      nav[1].href = '#periodica';
      nav[2].href = '#connect';
    }

    var navItems = nav.map(function (item) {
      var cls = item.id === activePage ? ' class="active"' : '';
      return '<li><a href="' + item.href + '"' + cls + '>' + item.label + '</a></li>';
    }).join('\n          ');

    var brandHref = activePage === 'home' ? '#hero' : prefix + 'index.html#hero';

    headerEl.outerHTML =
      '<header class="site-header" aria-label="Primary navigation">\n' +
      '  <div class="nav-container">\n' +
      '    <a class="brand-mark" href="' + brandHref + '" aria-label="Azetta.ai home">\n' +
      '      <span>Azetta.ai</span><span class="brand-accent"></span>\n' +
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
      '        <a class="btn btn-primary" href="https://getwaitlist.com/waitlist/32497" target="_blank" rel="noopener">Join Waitlist</a>\n' +
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
      '        <p class="footer-tagline">Intelligence from first principles</p>\n' +
      '      </div>\n' +
      '      <nav class="footer-nav" aria-label="Footer navigation">\n' +
      '        <div class="footer-nav-group">\n' +
      '          <h4>Company</h4>\n' +
      '          <ul>\n' +
      '            <li><a href="' + prefix + 'manifesto.html">Manifesto</a></li>\n' +
      '            <li><a href="' + prefix + 'team.html">Team</a></li>\n' +
      '            <li><a href="' + prefix + 'blogs.html">Blog</a></li>\n' +
      '            <li><a href="' + prefix + 'news.html">Newsroom</a></li>\n' +
      '            <li><a href="mailto:contact@azetta.ai">Contact</a></li>\n' +
      '          </ul>\n' +
      '        </div>\n' +
      '        <div class="footer-nav-group">\n' +
      '          <h4>Resources</h4>\n' +
      '          <ul>\n' +
      '            <li><a href="https://github.com/mlnomadpy/nmn" target="_blank" rel="noopener">GitHub</a></li>\n' +
      '            <li><a href="https://pypi.org/project/nmn/" target="_blank" rel="noopener">PyPI</a></li>\n' +
      '            <li><a href="https://azetta.ai/assets/nomodelulu.pdf" target="_blank" rel="noopener">Whitepaper</a></li>\n' +
      '          </ul>\n' +
      '        </div>\n' +
      '        <div class="footer-nav-group">\n' +
      '          <h4>Connect</h4>\n' +
      '          <div class="footer-social">\n' +
      '            <a href="https://github.com/mlnomadpy" target="_blank" rel="noopener" aria-label="GitHub">\n' +
      '              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>\n' +
      '            </a>\n' +
      '            <a href="https://twitter.com/azettaai" target="_blank" rel="noopener" aria-label="Twitter">\n' +
      '              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>\n' +
      '            </a>\n' +
      '            <a href="https://linkedin.com/company/azettaai" target="_blank" rel="noopener" aria-label="LinkedIn">\n' +
      '              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>\n' +
      '            </a>\n' +
      '          </div>\n' +
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
