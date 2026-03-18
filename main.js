/**
 * ============================================
 * AZETTA.AI - MAIN JAVASCRIPT
 * Modular feature-sliced architecture
 * ============================================
 */

// ============================================
// FEATURE: Circuit Animation Module
// ============================================
const CircuitAnimation = (function () {
    'use strict';

    /**
     * Line constructor for circuit animation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    function Line(x, y) {
        this.location = { x: x, y: y };
        this.width = Math.random() * 1 + 0.25;
        var palette = ['rgba(120,196,164,0.6)', 'rgba(90,181,200,0.5)', 'rgba(120,196,164,0.3)'];
        this.color = palette[~~(Math.random() * palette.length)];
    }

    /**
     * Signalz class - Main circuit animation controller
     * @param {HTMLCanvasElement} canvas - Canvas element
     */
    function Signalz(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.center = { x: null, y: null };
        this.drawNo = 0;
        this.linesNo = 50;
        this.linesSize = 20;
        this.lines = [];

        this.init();
    }

    /**
     * Initialize the circuit animation
     */
    Signalz.prototype.init = function () {
        this.setup();
        for (let i = 0; i < this.linesNo; i++) {
            this.lines.push(new Line(this.center.x, this.center.y));
        }
        this.animate();
    };

    /**
     * Setup canvas dimensions and event listeners
     */
    Signalz.prototype.setup = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.center.x = Math.round(this.canvas.width / 2);
        this.center.y = Math.round(this.canvas.height / 2);

        window.addEventListener('resize', this.onScreenResize.bind(this));
    };

    /**
     * Handle screen resize
     */
    Signalz.prototype.onScreenResize = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.center.x = Math.round(this.canvas.width / 2);
        this.center.y = Math.round(this.canvas.height / 2);

        this.lines.forEach(function (line) {
            line.location.x = this.center.x;
            line.location.y = this.center.y;
        }.bind(this));
    };

    /**
     * Animation loop
     */
    Signalz.prototype.animate = function () {
        requestAnimationFrame(this.animate.bind(this));
        this.draw();
    };

    /**
     * Draw circuit lines
     */
    Signalz.prototype.draw = function () {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawNo++;
        if (this.drawNo % 2 === 1) {
            return;
        }

        for (let idx = 0; idx < this.lines.length; idx++) {
            const line = this.lines[idx];
            const lineSize = this.linesSize;

            let dir = ~~(Math.random() * 3) * 90;
            if (idx % 4 === dir / 90) { dir = 270; }

            this.ctx.lineWidth = line.width;
            this.ctx.strokeStyle = line.color;
            this.ctx.beginPath();
            this.ctx.moveTo(line.location.x, line.location.y);

            switch (dir) {
                case 0:
                    line.location.y -= lineSize;
                    break;
                case 90:
                    line.location.x += lineSize;
                    break;
                case 180:
                    line.location.y += lineSize;
                    break;
                case 270:
                    line.location.x -= lineSize;
                    break;
            }

            this.ctx.lineTo(line.location.x, line.location.y);

            if (line.location.x < 0 || line.location.x > this.canvas.width ||
                line.location.y < 0 || line.location.y > this.canvas.height) {
                line.location.x = this.center.x;
                line.location.y = this.center.y;
            }

            this.ctx.stroke();
        }
    };

    /**
     * Public API
     */
    return {
        init: function (canvasId) {
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                return new Signalz(canvas);
            }
            console.error('Canvas element not found:', canvasId);
            return null;
        }
    };
})();

// ============================================
// FEATURE: SVG Animation Module
// ============================================
const SVGAnimation = (function () {
    'use strict';

    /**
     * Initialize SVG animations using Anime.js
     */
    function init() {
        // Check if anime is loaded
        if (typeof anime === 'undefined') {
            console.error('Anime.js library not loaded');
            return;
        }

        const tl = anime.timeline({
            autoplay: true,
            loop: true,
            direction: 'alternate',
            loopComplete: function (anim) {
                setTimeout(() => {
                    anim.play();
                }, 3000);
            }
        });

        tl.add({
            targets: '.group path',
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'easeInOutSine',
            duration: 2000,
            delay: function (el, i) {
                return i * 50;
            }
        }).add({
            targets: '#processor, #pixel_heart, #Text',
            scale: [1, 1.2],
            duration: 1500,
            easing: 'easeInOutQuad',
            delay: function (el, i) {
                return i * 250;
            }
        });
    }

    /**
     * Public API
     */
    return {
        init: init
    };
})();

// ============================================
// FEATURE: Navigation Controls
// ============================================
const Navigation = (function () {
    'use strict';

    function closeNav(toggle, nav) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        document.body.classList.remove('nav-open');
    }

    function init() {
        const toggle = document.querySelector('.nav-toggle');
        const nav = document.querySelector('.primary-nav');

        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            nav.classList.toggle('is-open');
            document.body.classList.toggle('nav-open', !expanded);
        });

        const links = nav.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => closeNav(toggle, nav));
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 960 && nav.classList.contains('is-open')) {
                closeNav(toggle, nav);
            }
        });
    }

    return {
        init
    };
})();

// ============================================
// FEATURE: CTA Button Handlers
// ============================================
const CTAHandlers = (function () {
    'use strict';

    /**
     * Handle waitlist button click
     */
    function handleWaitlist(e) {
        e.preventDefault();
        // TODO: Implement waitlist functionality
        console.log('Waitlist button clicked');
        alert('Waitlist functionality coming soon!');
    }

    /**
     * Handle whitepaper button click
     */
    function handleWhitepaper(e) {
        e.preventDefault();
        // TODO: Implement whitepaper download/view
        console.log('Whitepaper button clicked');
        alert('Whitepaper coming soon!');
    }

    /**
     * Handle docs button click
     */
    function handleDocs(e) {
        e.preventDefault();
        // TODO: Implement docs navigation
        console.log('Docs button clicked');
        alert('Documentation coming soon!');
    }

    /**
     * Initialize button event listeners
     */
    function init() {
        const buttons = document.querySelectorAll('.cta-buttons .btn');
        if (buttons.length >= 3) {
            buttons[0].addEventListener('click', handleWaitlist);
            buttons[1].addEventListener('click', handleWhitepaper);
            buttons[2].addEventListener('click', handleDocs);
        }
    }

    /**
     * Public API
     */
    return {
        init: init
    };
})();

// ============================================
// FEATURE: Analytics & Performance
// ============================================
const Analytics = (function () {
    'use strict';

    /**
     * Track page view
     */
    function trackPageView() {
        // TODO: Implement analytics tracking
        console.log('Page view tracked');
    }

    /**
     * Track user interaction
     * @param {string} action - Action name
     * @param {string} label - Action label
     */
    function trackEvent(action, label) {
        // TODO: Implement event tracking
        console.log('Event tracked:', action, label);
    }

    /**
     * Public API
     */
    return {
        trackPageView: trackPageView,
        trackEvent: trackEvent
    };
})();

// ============================================
// FEATURE: Accessibility Enhancements
// ============================================
const Accessibility = (function () {
    'use strict';

    /**
     * Add keyboard navigation support
     */
    function addKeyboardNav() {
        const nodes = document.querySelectorAll('.node');
        nodes.forEach((node, index) => {
            node.setAttribute('tabindex', '0');
            node.setAttribute('role', 'article');

            node.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    node.click();
                }
            });
        });
    }

    /**
     * Add ARIA labels
     */
    function addAriaLabels() {
        // Add semantic roles and labels
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            if (section.classList.contains('hero')) {
                section.setAttribute('aria-label', 'Hero section');
            } else if (section.classList.contains('products')) {
                section.setAttribute('aria-label', 'Product suite overview');
            } else if (section.classList.contains('data-flow')) {
                section.setAttribute('aria-label', 'Core architecture features');
            } else if (section.classList.contains('architecture')) {
                section.setAttribute('aria-label', 'System architecture');
            } else if (section.classList.contains('terminal')) {
                section.setAttribute('aria-label', 'Terminal demonstration');
            } else if (section.classList.contains('cta-section')) {
                section.setAttribute('aria-label', 'Call to action');
            }
        });
    }

    /**
     * Reduce motion for users who prefer it
     */
    function respectReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (prefersReducedMotion.matches) {
            document.body.classList.add('reduce-motion');
            // Disable animations if user prefers reduced motion
            const style = document.createElement('style');
            style.textContent = `
                .reduce-motion * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Initialize accessibility features
     */
    function init() {
        addKeyboardNav();
        addAriaLabels();
        respectReducedMotion();
    }

    /**
     * Public API
     */
    return {
        init: init
    };
})();

// ============================================
// APP INITIALIZATION
// ============================================
const App = (function () {
    'use strict';

    /**
     * Initialize all modules
     */
    function init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initModules);
        } else {
            initModules();
        }
    }

    /**
     * Initialize all modules after DOM is ready
     */
    function initModules() {
        console.log('Initializing Azetta.ai...');

        // Initialize circuit animation
        CircuitAnimation.init('circuit-canvas');

        // Initialize SVG animation (wait for anime.js to load)
        if (typeof anime !== 'undefined') {
            SVGAnimation.init();
        } else {
            console.warn('Anime.js not loaded yet, SVG animations disabled');
        }

        // Initialize navigation controls
        Navigation.init();

        // Initialize CTA handlers
        CTAHandlers.init();

        // Initialize accessibility features
        Accessibility.init();

        // Track page view
        Analytics.trackPageView();

        console.log('Azetta.ai initialized successfully');
    }

    /**
     * Public API
     */
    return {
        init: init
    };
})();

// ============================================
// START APPLICATION
// ============================================
App.init();

// ============================================
// FEATURE: Scroll Reveal
// ============================================
(function () {
    'use strict';
    if (!window.IntersectionObserver) return;
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            } else {
                entry.target.classList.remove('revealed');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    function attachReveal() {
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(function (el) {
            observer.observe(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachReveal);
    } else {
        attachReveal();
    }
})();

// ============================================
// FEATURE: Home-page Flywheel Animation
// ============================================
(function () {
    'use strict';
    var svg = document.getElementById('flywheel-svg');
    if (!svg) return;

    var nodes = [0, 1, 2, 3, 4, 5];
    var edges = ['fw-e01', 'fw-e12', 'fw-e23', 'fw-e34', 'fw-e45', 'fw-e50'];
    var current = 0;
    var timer = null;
    var STEP = 1800;

    function activate(idx) {
        nodes.forEach(function (i) {
            var n = document.getElementById('fw-node-' + i);
            if (n) n.classList.remove('fw-active');
        });
        edges.forEach(function (id) {
            var e = document.getElementById(id);
            if (e) e.classList.remove('fw-active');
        });
        var node = document.getElementById('fw-node-' + idx);
        if (node) node.classList.add('fw-active');
        var edgeEl = document.getElementById(edges[(idx + 5) % 6]);
        if (edgeEl) edgeEl.classList.add('fw-active');
    }

    function start() {
        if (timer) return;
        activate(current);
        timer = setInterval(function () {
            current = (current + 1) % 6;
            activate(current);
        }, STEP);
    }

    function stop() {
        clearInterval(timer);
        timer = null;
    }

    if (window.IntersectionObserver) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { start(); } else { stop(); }
            });
        }, { threshold: 0.2 });
        observer.observe(svg);
    } else {
        start();
    }
})();

// ============================================
// FEATURE: Flip Card Keyboard Support
// ============================================
(function () {
    'use strict';
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var el = document.activeElement;
        if (el && el.classList.contains('flip-card')) {
            e.preventDefault();
            el.classList.toggle('is-flipped');
        }
    });
})();

