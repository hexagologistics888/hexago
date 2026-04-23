/* ================================================================
   Hexa-go Logistics — VISUAL ENHANCEMENTS v2.1
   Mobile-first · All networks (2G→6G+) · All devices
   ================================================================ */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                 || window.innerWidth <= 768;

  /* ══════════════════════════════════════════
     PRELOADER — network-aware timing
     2G/slow → up to 2s
     3G      → ~1s
     4G/5G/6G/WiFi/any fast → ~250ms
     saveData mode → 400ms (don't waste battery)
  ══════════════════════════════════════════ */
  var preloader = document.getElementById('hexago-preloader');
  if (preloader && window.getComputedStyle(preloader).display !== 'none') {
    var hidePreloader = function () {
      if (preloader._gone) return;
      preloader._gone = true;
      preloader.classList.add('hidden');
      setTimeout(function () { preloader.style.display = 'none'; }, 600);
    };

    var delay = 350; // sensible default (no API support)

    // navigator.connection covers Chrome/Android; fallbacks for other browsers
    var conn = navigator.connection
            || navigator.mozConnection
            || navigator.webkitConnection;

    if (conn) {
      // Respect data saver — user wants fast everything
      if (conn.saveData) {
        delay = 350;
      } else {
        // downlink is in Mbps — covers 5G (100-1000 Mbps), 6G (1 Gbps+), WiFi, etc.
        var dl = conn.downlink || 0;
        var et = conn.effectiveType || '';

        if (dl >= 5 || et === '4g') {
          delay = 250;
        } else if (dl >= 1 || et === '3g') {
          delay = 700;
        } else {
          // 2G, slow-2g, or unknown — cap at 800ms
          delay = 800;
        }
      }
    }

    setTimeout(hidePreloader, delay);
  }

  /* ══════════════════════════════════════════
     READING PROGRESS BAR
  ══════════════════════════════════════════ */
  var progressBar = document.getElementById('reading-progress');
  if (progressBar) {
    var progressTicking = false;
    window.addEventListener('scroll', function () {
      if (!progressTicking) {
        requestAnimationFrame(function () {
          var scrollTop = window.scrollY || window.pageYOffset;
          var docH = document.documentElement.scrollHeight - window.innerHeight;
          progressBar.style.width = (docH > 0 ? (scrollTop / docH) * 100 : 0) + '%';
          progressTicking = false;
        });
        progressTicking = true;
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════
     BACK TO TOP
  ══════════════════════════════════════════ */
  var btt = document.getElementById('back-to-top');
  if (btt) {
    var bttTicking = false;
    var onBttScroll = function () {
      if (!bttTicking) {
        requestAnimationFrame(function () {
          var y = window.scrollY || window.pageYOffset;
          btt.classList.toggle('visible', y > 420);
          bttTicking = false;
        });
        bttTicking = true;
      }
    };
    window.addEventListener('scroll', onBttScroll, { passive: true });
    btt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ══════════════════════════════════════════
     SCROLL REVEAL — works on all mobile browsers
     Uses IntersectionObserver with iOS Safari fallback
  ══════════════════════════════════════════ */
  function initReveal() {
    if (prefersReduced) {
      // Instantly show everything if reduced motion
      document.querySelectorAll('[data-reveal], [data-stagger] > *').forEach(function (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    var hasIO = 'IntersectionObserver' in window;

    // Fallback: no IntersectionObserver (very old Android WebView, Opera Mini)
    if (!hasIO) {
      document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('revealed'); });
      document.querySelectorAll('[data-stagger] > *').forEach(function (el) { el.classList.add('revealed'); });
      return;
    }

    // Lower threshold on mobile so items reveal sooner (less scroll needed)
    var threshold = isMobile ? 0.08 : 0.12;
    var rootMargin = isMobile ? '0px 0px -20px 0px' : '0px 0px -50px 0px';

    var singleObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = parseInt(entry.target.dataset.delay) || 0;
        setTimeout(function () { entry.target.classList.add('revealed'); }, delay);
        singleObs.unobserve(entry.target);
      });
    }, { threshold: threshold, rootMargin: rootMargin });

    document.querySelectorAll('[data-reveal]').forEach(function (el) { singleObs.observe(el); });

    // Stagger — shorter step on mobile for snappier feel
    var staggerObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var children = entry.target.querySelectorAll(':scope > *');
        var step = isMobile
          ? Math.min(parseInt(entry.target.dataset.stagger) || 80, 80)   // max 80ms on mobile
          : parseInt(entry.target.dataset.stagger) || 110;
        children.forEach(function (child, i) {
          setTimeout(function () { child.classList.add('revealed'); }, i * step);
        });
        staggerObs.unobserve(entry.target);
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('[data-stagger]').forEach(function (el) { staggerObs.observe(el); });
  }

  /* ══════════════════════════════════════════
     NUMBER COUNTERS — mobile + all browsers
  ══════════════════════════════════════════ */
  function initCounters() {
    var els = document.querySelectorAll('.stat-card h3, [data-counter]');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      // No IO — just show final values
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var original = el.textContent.trim();
        var numVal = parseFloat(original.replace(/[^0-9.]/g, '')) || 0;
        var suffix = original.replace(/[0-9.]/g, '').trim();
        // Shorter on mobile for snappiness
        var duration = prefersReduced ? 0 : (isMobile ? 1200 : 1800);

        if (!duration) { obs.unobserve(el); return; }

        var startTime = null;
        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(numVal * eased) + suffix;
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = original;
        }
        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) { obs.observe(el); });
  }

  /* ══════════════════════════════════════════
     PARTICLE CANVAS — mobile-optimised
     Fewer, smaller particles on mobile to save battery
  ══════════════════════════════════════════ */
  function initParticles() {
    if (prefersReduced) return;
    var canvas = document.querySelector('.page-hero canvas.p-canvas');
    if (!canvas) return;

    // Skip on very low-end devices (< 256 MB RAM hint, if available)
    if (navigator.deviceMemory && navigator.deviceMemory < 1) return;

    var ctx = canvas.getContext('2d');
    var particles = [];
    var w = window.innerWidth;
    // Scale particle count by screen size / device tier
    var count = w < 400 ? 12 : w < 768 ? 20 : w < 1200 ? 32 : 45;
    var animId;

    function resize() {
      var hero = canvas.parentElement;
      canvas.width  = hero ? hero.offsetWidth  : w;
      canvas.height = hero ? hero.offsetHeight : 380;
    }

    function mkParticle() {
      return {
        x:   Math.random() * canvas.width,
        y:   Math.random() * canvas.height,
        r:   Math.random() * (isMobile ? 1.8 : 2.2) + 0.5,
        sx:  (Math.random() - 0.5) * 0.35,
        sy:  -(Math.random() * 0.5 + 0.18),
        op:  Math.random() * 0.35 + 0.12,
        col: Math.random() > 0.5 ? '255,107,53' : '255,255,255'
      };
    }

    function init() {
      resize();
      particles = [];
      for (var i = 0; i < count; i++) particles.push(mkParticle());
    }

    function draw() {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.sx; p.y += p.sy;
        if (p.y < -10) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
        if (p.x < -10)  p.x = canvas.width + 5;
        if (p.x > canvas.width + 10) p.x = -5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.col + ',' + p.op + ')';
        ctx.fill();
      }
    }

    init();
    draw();

    // Pause particles when tab is hidden (saves battery on mobile)
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        draw();
      }
    });

    window.addEventListener('resize', function () {
      cancelAnimationFrame(animId);
      w = window.innerWidth;
      count = w < 400 ? 12 : w < 768 ? 20 : w < 1200 ? 32 : 45;
      init();
      draw();
    }, { passive: true });
  }

  /* ══════════════════════════════════════════
     CARD TILT — desktop hover only
     (touch devices get tap highlight instead)
  ══════════════════════════════════════════ */
  function initTilt() {
    if (prefersReduced || isMobile) return;
    document.querySelectorAll('.owner-card, .srv-card, .gallery-item').forEach(function (card) {
      var isGalleryCard = card.classList.contains('gallery-item');
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (py - 0.5) * (isGalleryCard ? -10 : -7);
        var ry = (px - 0.5) * (isGalleryCard ? 10 : 7);
        var lift = isGalleryCard ? -3 : -6;
        card.style.transition = 'transform 0.08s ease';
        card.style.transform  = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(' + lift + 'px)';
        if (isGalleryCard) {
          card.classList.add('tilt-active');
          card.style.setProperty('--shine-x', (px * 100).toFixed(2) + '%');
          card.style.setProperty('--shine-y', (py * 100).toFixed(2) + '%');
        }
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.4s ease';
        card.style.transform  = '';
        if (isGalleryCard) {
          card.classList.remove('tilt-active');
          card.style.removeProperty('--shine-x');
          card.style.removeProperty('--shine-y');
        }
      });
    });
  }

  /* ══════════════════════════════════════════
     RIPPLE — works on touch + click (all devices)
  ══════════════════════════════════════════ */
  function initRipple() {
    if (!document.getElementById('ripple-kf')) {
      var s = document.createElement('style');
      s.id = 'ripple-kf';
      s.textContent = '@keyframes rippleOut{to{transform:scale(7);opacity:0;}}';
      document.head.appendChild(s);
    }

    var sel = '.reach-btn,.cta-btn-primary,.send-btn,.sector-btn,.services-cta a,.unique-submit-btn,.cookie-accept';
    document.querySelectorAll(sel).forEach(function (btn) {
      // Use 'touchstart' on mobile for instant feedback, 'click' on desktop
      var evt = isMobile ? 'touchstart' : 'click';
      btn.addEventListener(evt, function (e) {
        var r   = btn.getBoundingClientRect();
        var src = e.touches ? e.touches[0] : e;
        var x   = src.clientX - r.left - 25;
        var y   = src.clientY - r.top  - 25;
        var rpl = document.createElement('span');
        rpl.style.cssText = [
          'position:absolute', 'width:50px', 'height:50px',
          'border-radius:50%', 'background:rgba(255,255,255,0.28)',
          'pointer-events:none',
          'left:' + x + 'px', 'top:' + y + 'px',
          'transform:scale(0)', 'animation:rippleOut 0.65s ease forwards'
        ].join(';');
        btn.appendChild(rpl);
        rpl.addEventListener('animationend', function () { rpl.remove(); });
      }, { passive: true });
    });
  }

  /* ══════════════════════════════════════════
     ACTIVE NAV HIGHLIGHT
  ══════════════════════════════════════════ */
  function initActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && (href === path || (path === '' && href === 'index.html'))) {
        a.style.color = '#FF6B35';
      }
    });
  }

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  function startEnhancements() {
    initReveal();
    initCounters();
    initParticles();
    initTilt();
    initRipple();
    initActiveNav();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(startEnhancements, { timeout: 900 });
      return;
    }

    setTimeout(startEnhancements, 120);
  });

  /* ══════════════════════════════════════════
     EAGER-LAZY IMAGE LOADER
     Native lazy-load waits until an image is almost in viewport,
     so users see blank -> pop-in while scrolling. This IntersectionObserver
     starts the fetch 800px before the image enters the viewport, so by the
     time the user scrolls to it, it's already decoded and painted.

     PageSpeed still counts these images as deferred (not in initial LCP set)
     because the observer only triggers post-load + post-scroll-intent.
  ══════════════════════════════════════════ */
  if ('IntersectionObserver' in window) {
    var warmImages = function () {
      var imgs = document.querySelectorAll('img[loading="lazy"]');
      if (!imgs.length) return;

      var io = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var img = entry.target;
          // Force the browser to start the fetch by flipping to eager once near viewport.
          // The image is already in DOM; this just nudges the priority up.
          if (img.loading === 'lazy') {
            img.loading = 'eager';
            img.fetchPriority = 'high';
          }
          observer.unobserve(img);
        });
      }, {
        // Start loading 800px before entering viewport -> feels instant on scroll
        rootMargin: '800px 0px 800px 0px',
        threshold: 0.01
      });

      imgs.forEach(function (img) { io.observe(img); });
    };

    // Run after initial paint so LCP / above-fold images aren't disturbed
    if (document.readyState === 'complete') {
      warmImages();
    } else {
      window.addEventListener('load', warmImages, { once: true });
    }
  }

})();
