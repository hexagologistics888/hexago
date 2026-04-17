// Driver Logistics Website JavaScript

const OFFLINE_RETURN_URL_KEY = 'hexago_offline_return_url';
const OFFLINE_RETURN_SCROLL_KEY = 'hexago_offline_return_scroll_y';
const OFFLINE_RESTORE_PENDING_KEY = 'hexago_offline_restore_pending';
const CONTACT_RETURN_PAGE_KEY = 'hexago_contact_return_page';
const HERO_CAROUSEL_INTERVAL_MS = 3000;
const MOBILE_NAV_BREAKPOINT = 768;
const MOBILE_MENU_OPEN_CLASS = 'active';

function getCurrentRelativeUrl() {
    return window.location.pathname + window.location.search + window.location.hash;
}

function rememberContactReturnPage() {
    var pathname = window.location.pathname.toLowerCase();
    var isContactPage = /\/contact_us\.html$/.test(pathname);
    var isFallbackPage = /\/404\.html$/.test(pathname);

    if (isContactPage || isFallbackPage) return;

    try {
        sessionStorage.setItem(CONTACT_RETURN_PAGE_KEY, getCurrentRelativeUrl());
    } catch (error) {}
}

function getContactReturnPage() {
    try {
        return sessionStorage.getItem(CONTACT_RETURN_PAGE_KEY) || '';
    } catch (error) {
        return '';
    }
}

function normalizeLeadValue(value) {
    var text = '';

    if (typeof value === 'string') {
        text = value.trim();
    } else if (value !== undefined && value !== null) {
        text = String(value).trim();
    }

    return text || 'Not provided';
}

function getLeadTimestamp() {
    try {
        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Calcutta'
        }).format(new Date()) + ' IST';
    } catch (error) {
        return new Date().toLocaleString();
    }
}

function buildWhatsAppLeadMessage(title, fields, sourceLabel) {
    var lines = ['Hexa-go Logistics - ' + title, ''];

    fields.forEach(function(field) {
        lines.push(field.label + ': ' + normalizeLeadValue(field.value));
    });

    lines.push('');
    lines.push('Source: ' + normalizeLeadValue(sourceLabel));
    lines.push('Submitted: ' + getLeadTimestamp());

    return lines.join('\n');
}

function showHexagoPopup(title, message) {
    var existing = document.getElementById('hexago-popup-overlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'hexago-popup-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,10,30,0.65);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;animation:hxFadeIn .25s ease';
    overlay.innerHTML =
        '<style>@keyframes hxFadeIn{from{opacity:0}to{opacity:1}}@keyframes hxSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}</style>' +
        '<div style="background:#fff;border-radius:20px;max-width:420px;width:100%;padding:44px 36px 36px;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.2);animation:hxSlideUp .3s ease;position:relative">' +
        '<div style="width:56px;height:56px;background:linear-gradient(135deg,#FF6B35,#e8521f);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
        '<h3 style="margin:0 0 10px;font-size:1.3rem;font-weight:800;color:#0a1628">' + title + '</h3>' +
        '<p style="margin:0 0 28px;font-size:0.93rem;color:#64748b;line-height:1.7">' + message + '</p>' +
        '<button onclick="document.getElementById(\'hexago-popup-overlay\').remove()" ' +
        'style="background:linear-gradient(135deg,#FF6B35,#e8521f);color:#fff;border:none;padding:13px 40px;border-radius:50px;font-size:0.9rem;font-weight:700;cursor:pointer;letter-spacing:0.04em;box-shadow:0 4px 16px rgba(255,107,53,0.35)">Done</button>' +
        '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
}

function setLeadFormStatus(form, statusId, type, message) {
    var target = statusId ? document.getElementById(statusId) : form.querySelector('.form-status-message');
    if (!target) return;

    target.className = 'form-status-message form-status-' + type;
    target.textContent = message;
    target.hidden = false;
}

function attachLeadForm(form, options) {
    if (!form || form.dataset.leadFormBound === '1') return;

    form.dataset.leadFormBound = '1';

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        var submitButton = form.querySelector('[type="submit"]');
        if (!submitButton) return;

        var originalText = submitButton.textContent;
        var originalBackground = submitButton.style.background;
        var formData = new FormData(form);
        var formAction = form.getAttribute('action') || '';

        submitButton.textContent = options.submittingText || 'Submitting...';
        submitButton.disabled = true;

        if (!formAction || /YOUR_ID/i.test(formAction)) {
            submitButton.textContent = 'Form setup needed';
            submitButton.style.background = '#EF4444';
            setLeadFormStatus(form, options.statusId, 'error', 'This form is not fully connected yet. Please update the Formspree configuration.');
            setTimeout(function() {
                submitButton.textContent = originalText;
                submitButton.style.background = originalBackground;
                submitButton.disabled = false;
            }, 3500);
            return;
        }

        try {
            var contactIframe = document.getElementById('contact_iframe');
            if (!contactIframe) {
                contactIframe = document.createElement('iframe');
                contactIframe.id = 'contact_iframe';
                contactIframe.name = 'contact_iframe';
                contactIframe.style.display = 'none';
                document.body.appendChild(contactIframe);
            }
            form.target = 'contact_iframe';
            form.method = 'POST';
            form.submit();

            submitButton.textContent = options.successText || 'Sent!';
            submitButton.style.background = '#10B981';
            form.reset();
            showHexagoPopup('Enquiry Received', 'Thank you for reaching out. Our team will contact you within 24 hours.');

            setTimeout(function() {
                submitButton.textContent = originalText;
                submitButton.style.background = originalBackground;
                submitButton.disabled = false;
            }, options.resetDelayMs || 3000);
        } catch (error) {
            submitButton.textContent = options.errorText || 'Unable to send';
            submitButton.style.background = '#EF4444';
            setLeadFormStatus(
                form,
                options.statusId,
                'error',
                options.errorMessage || 'We could not send your message right now. Please try again or contact us by phone.'
            );

            setTimeout(function() {
                submitButton.textContent = originalText;
                submitButton.style.background = originalBackground;
                submitButton.disabled = false;
            }, 3500);
        }
    });
}

window.HexagoLeadForms = {
    attach: attachLeadForm
};

function initConnectivityFallback() {
    const isFallbackPage = /\/404\.html$/.test(window.location.pathname);
    if (isFallbackPage) return;

    const currentUrl = window.location.pathname + window.location.search + window.location.hash;

    try {
        const shouldRestore = sessionStorage.getItem(OFFLINE_RESTORE_PENDING_KEY) === '1';
        const returnUrl = sessionStorage.getItem(OFFLINE_RETURN_URL_KEY);
        const savedScroll = sessionStorage.getItem(OFFLINE_RETURN_SCROLL_KEY);

        if (shouldRestore && returnUrl === currentUrl) {
            window.addEventListener('load', function restoreOfflineScroll() {
                const scrollTop = Number(savedScroll || 0);
                window.scrollTo(0, Number.isFinite(scrollTop) ? scrollTop : 0);
                sessionStorage.removeItem(OFFLINE_RESTORE_PENDING_KEY);
                sessionStorage.removeItem(OFFLINE_RETURN_URL_KEY);
                sessionStorage.removeItem(OFFLINE_RETURN_SCROLL_KEY);
            }, { once: true });
        }
    } catch (error) {}

    let redirectedToOffline = false;

    function moveToOfflineFallback() {
        if (redirectedToOffline || navigator.onLine !== false) return;

        redirectedToOffline = true;

        try {
            sessionStorage.setItem(OFFLINE_RETURN_URL_KEY, currentUrl);
            sessionStorage.setItem(
                OFFLINE_RETURN_SCROLL_KEY,
                String(window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0)
            );
        } catch (error) {}

        window.location.replace(new URL('404.html?offline=1', window.location.href).toString());
    }

    window.addEventListener('offline', moveToOfflineFallback);

    if (navigator.onLine === false) {
        moveToOfflineFallback();
    }
}

// Hero Slider Functionality
function initHeroCarousel() {
    const heroCarousel = document.getElementById('heroCarousel');
    if (!heroCarousel) return;
    const slides = Array.from(heroCarousel.querySelectorAll('.hero-slide'));

    function loadHeroSlideBackground(slide) {
        if (!slide || slide.dataset.bgLoaded === '1') return;

        const bgUrl = slide.getAttribute('data-bg');
        if (!bgUrl) return;

        slide.style.backgroundImage = "url('" + bgUrl.replace(/'/g, "\\'") + "')";
        slide.dataset.bgLoaded = '1';
    }

    function loadNextHeroSlide(index) {
        if (!slides.length) return;
        loadHeroSlideBackground(slides[(index + 1) % slides.length]);
    }

    let currentSlide = slides.findIndex((slide) => slide.classList.contains('active'));
    if (currentSlide < 0) currentSlide = 0;

    loadHeroSlideBackground(slides[currentSlide]);

    if (window.bootstrap && window.bootstrap.Carousel) {
        heroCarousel.addEventListener('slide.bs.carousel', (event) => {
            loadHeroSlideBackground(slides[event.to]);
            loadNextHeroSlide(event.to);
        });

        const carousel = window.bootstrap.Carousel.getOrCreateInstance(heroCarousel, {
            interval: HERO_CAROUSEL_INTERVAL_MS,
            ride: 'carousel',
            pause: false,
            touch: true,
            wrap: true
        });

        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => loadNextHeroSlide(currentSlide), { timeout: 1500 });
        } else {
            setTimeout(() => loadNextHeroSlide(currentSlide), 300);
        }

        carousel.cycle();
        return;
    }

    const indicators = Array.from(
        heroCarousel.querySelectorAll('.carousel-indicators [data-bs-slide-to]')
    );

    if (!slides.length) return;

    function showSlide(index) {
        loadHeroSlideBackground(slides[index]);
        loadNextHeroSlide(index);

        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('active', slideIndex === index);
        });

        indicators.forEach((indicator, indicatorIndex) => {
            const isActive = indicatorIndex === index;
            indicator.classList.toggle('active', isActive);
            indicator.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    }

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });

    showSlide(currentSlide);
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, HERO_CAROUSEL_INTERVAL_MS);
}

// Mobile Menu Toggle
function getMobileMenuElements() {
    return {
        navLinks: document.getElementById('navLinks'),
        toggle: document.querySelector('.mobile-menu-toggle')
    };
}

function setMobileMenuState(isOpen) {
    const elements = getMobileMenuElements();
    if (!elements.navLinks) return;

    elements.navLinks.classList.toggle(MOBILE_MENU_OPEN_CLASS, isOpen);
    elements.navLinks.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    document.body.classList.toggle('mobile-nav-open', isOpen);

    if (elements.toggle) {
        elements.toggle.classList.toggle('is-open', isOpen);
        elements.toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        elements.toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    }
}

function closeMobileMenu() {
    setMobileMenuState(false);
}

function toggleMobileMenu() {
    const elements = getMobileMenuElements();
    if (!elements.navLinks) return;

    setMobileMenuState(!elements.navLinks.classList.contains(MOBILE_MENU_OPEN_CLASS));
}

function initMobileMenu() {
    const elements = getMobileMenuElements();
    if (!elements.navLinks || !elements.toggle) return;

    // If standalone inline script already initialised the menu, skip re-binding
    if (typeof window.toggleMobileMenu === 'function' && elements.navLinks.getAttribute('aria-hidden') !== null) {
        return;
    }

    setMobileMenuState(false);

    if (elements.toggle.dataset.mobileMenuReady !== '1') {
        elements.toggle.dataset.mobileMenuReady = '1';
        elements.toggle.addEventListener('click', (event) => {
            event.preventDefault();
            toggleMobileMenu();
        });
    }

    if (elements.navLinks.dataset.mobileMenuReady === '1') return;
    elements.navLinks.dataset.mobileMenuReady = '1';

    elements.navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
    });

    elements.navLinks.addEventListener('click', (event) => {
        if (event.target === elements.navLinks) {
            closeMobileMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMobileMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > MOBILE_NAV_BREAKPOINT) {
            closeMobileMenu();
        }
    }, { passive: true });
}

window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

// Transparent -> White navbar on scroll
function initScrollHeader() {
    var hdr = document.querySelector('header');
    if (!hdr) return;

    var scrollThreshold = 40;

    function checkScroll() {
        var scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        hdr.classList.toggle('scrolled', scrollTop > scrollThreshold);
    }

    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });
    window.addEventListener('load', checkScroll);
    checkScroll();
}

function initGsapAnimations() {
    if (!window.gsap || !window.ScrollTrigger) return;

    try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}

    let mm = gsap.matchMedia();

    mm.add({
        isDesktop: "(min-width: 769px) and (prefers-reduced-motion: no-preference)",
        isMobile: "(max-width: 768px) and (prefers-reduced-motion: no-preference)"
    }, (context) => {
        let { isDesktop, isMobile } = context.conditions;

        const headerY = isMobile ? -60 : -100;
        const entryY = isMobile ? 30 : 60;
        const smallY = isMobile ? 15 : 30;
        const buttonY = isMobile ? 10 : 20;
        const imageScale = isMobile ? 0.95 : 0.85;

        gsap.from('header', {
            y: headerY,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });

        if (document.querySelector('.hero-content')) {
            gsap.from('.hero-content h1', {
                y: entryY,
                opacity: 0,
                duration: 1,
                delay: 0.2,
                ease: 'power3.out'
            });
            gsap.from('.hero-content p', {
                y: smallY,
                opacity: 0,
                duration: 1,
                delay: 0.4,
                ease: 'power3.out'
            });
            gsap.from('.hero-content .reach-btn', {
                y: buttonY,
                opacity: 0,
                duration: 1,
                delay: 0.6,
                ease: 'power3.out'
            });
        }

        gsap.utils.toArray('.section-header, .section-title').forEach(header => {
            if (header.closest('.why-choose')) return;
            gsap.from(header, {
                scrollTrigger: {
                    trigger: header,
                    start: 'top 95%',
                    once: true
                },
                y: smallY,
                duration: 0.8,
                ease: 'power2.out'
            });
        });

        const cardContainers = [
            '.services-grid',
            '.owners-container',
            '.blog-grid',
            '.stats-grid',
            '.services-container'
        ];

        cardContainers.forEach(containerSelector => {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const cards = container.querySelectorAll('.creative-card, .service-card, .owner-card, .blog-card, .stat-card');
            if (!cards.length) return;

            gsap.from(cards, {
                scrollTrigger: {
                    trigger: container,
                    start: 'top 95%',
                    once: true
                },
                y: entryY,
                duration: 0.8,
                stagger: 0.12,
                ease: 'power2.out'
            });

            if (containerSelector === '.services-grid' || containerSelector === '.services-container') {
                cards.forEach(card => {
                    const img = card.querySelector('img');
                    if (!img) return;

                    card.addEventListener('mouseenter', () => {
                        if (isDesktop || isMobile) {
                            gsap.to(img, {
                                scale: 1.05,
                                duration: 0.5,
                                ease: 'power2.out'
                            });
                        }
                    });

                    card.addEventListener('mouseleave', () => {
                        if (isDesktop || isMobile) {
                            gsap.to(img, {
                                scale: 1,
                                duration: 0.5,
                                ease: 'power2.out'
                            });
                        }
                    });

                    ScrollTrigger.create({
                        trigger: card,
                        start: 'top 60%',
                        end: 'bottom 40%',
                        onEnter: () => gsap.to(img, { scale: 1.05, duration: 0.6 }),
                        onLeave: () => gsap.to(img, { scale: 1, duration: 0.6 }),
                        onEnterBack: () => gsap.to(img, { scale: 1.05, duration: 0.6 }),
                        onLeaveBack: () => gsap.to(img, { scale: 1, duration: 0.6 })
                    });
                });
            }
        });

        const standaloneImages = document.querySelectorAll('img:not(nav img):not(footer img):not(.service-card img):not(.creative-card img):not(.owner-card img):not(.blog-card img):not(.stat-card img):not(.image-container img)');

        standaloneImages.forEach(img => {
            if (img.complete && img.naturalWidth > 150) {
                gsap.from(img, {
                    scrollTrigger: { trigger: img, start: 'top 95%', once: true },
                    scale: imageScale,
                    y: smallY,
                    duration: 1.2,
                    ease: 'power3.out'
                });
            }
        });

        if (document.querySelector('.cta-banner')) {
            gsap.from('.cta-banner h2', {
                scrollTrigger: { trigger: '.cta-banner', start: 'top 95%', once: true },
                y: smallY, duration: 1, ease: 'power3.out'
            });
            gsap.from('.cta-banner p', {
                scrollTrigger: { trigger: '.cta-banner', start: 'top 95%', once: true },
                y: buttonY, duration: 1, delay: 0.2, ease: 'power3.out'
            });
            gsap.from('.cta-banner .d-flex', {
                scrollTrigger: { trigger: '.cta-banner', start: 'top 95%', once: true },
                y: buttonY, duration: 1, delay: 0.4, ease: 'power3.out'
            });
        }

        gsap.from('footer .footer-content > div', {
            scrollTrigger: { trigger: 'footer', start: 'top 95%', once: true },
            y: smallY, duration: 0.8, stagger: 0.2, ease: 'power2.out'
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initConnectivityFallback();
    rememberContactReturnPage();
    initMobileMenu();
    initScrollHeader();
    initHeroCarousel();

    if ('requestIdleCallback' in window) {
        requestIdleCallback(initGsapAnimations, { timeout: 1200 });
        return;
    }

    setTimeout(initGsapAnimations, 160);
});
