// Driver Logistics Website JavaScript

const OFFLINE_RETURN_URL_KEY = 'hexago_offline_return_url';
const OFFLINE_RETURN_SCROLL_KEY = 'hexago_offline_return_scroll_y';
const OFFLINE_RESTORE_PENDING_KEY = 'hexago_offline_restore_pending';
const CONTACT_RETURN_PAGE_KEY = 'hexago_contact_return_page';
const HERO_CAROUSEL_INTERVAL_MS = 3000;

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
    var lines = ['Hexago Logistics - ' + title, ''];

    fields.forEach(function(field) {
        lines.push(field.label + ': ' + normalizeLeadValue(field.value));
    });

    lines.push('');
    lines.push('Source: ' + normalizeLeadValue(sourceLabel));
    lines.push('Submitted: ' + getLeadTimestamp());

    return lines.join('\n');
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
            var response = await fetch(formAction, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Lead submission failed');
            }

            if (options.whatsAppNumber) {
                var whatsAppMessage = buildWhatsAppLeadMessage(
                    options.title || 'New Website Enquiry',
                    (options.fields || []).map(function(field) {
                        return {
                            label: field.label,
                            value: formData.get(field.name)
                        };
                    }),
                    options.sourceLabel || window.location.pathname
                );

                window.open(
                    'https://wa.me/' + options.whatsAppNumber + '?text=' + encodeURIComponent(whatsAppMessage),
                    '_blank',
                    'noopener'
                );
            }

            submitButton.textContent = options.successText || 'Submitted';
            submitButton.style.background = '#10B981';
            form.reset();
            setLeadFormStatus(
                form,
                options.statusId,
                'success',
                options.successMessage || 'Thank you. Your enquiry has been received and our team will contact you shortly.'
            );

            if (typeof options.afterSuccess === 'function') {
                options.afterSuccess({
                    form: form,
                    submitButton: submitButton
                });
            }

            var redirectUrl = '';
            if (typeof options.getRedirectUrl === 'function') {
                redirectUrl = options.getRedirectUrl() || '';
            } else if (typeof options.redirectUrl === 'string') {
                redirectUrl = options.redirectUrl;
            }

            if (redirectUrl) {
                setTimeout(function() {
                    window.location.href = redirectUrl;
                }, options.redirectDelayMs || 2200);
            }

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

    if (window.bootstrap && window.bootstrap.Carousel) {
        const carousel = window.bootstrap.Carousel.getOrCreateInstance(heroCarousel, {
            interval: HERO_CAROUSEL_INTERVAL_MS,
            ride: 'carousel',
            pause: false,
            touch: true,
            wrap: true
        });
        carousel.cycle();
        return;
    }

    const slides = Array.from(heroCarousel.querySelectorAll('.hero-slide'));
    const indicators = Array.from(
        heroCarousel.querySelectorAll('.carousel-indicators [data-bs-slide-to]')
    );

    if (!slides.length) return;

    let currentSlide = slides.findIndex((slide) => slide.classList.contains('active'));
    if (currentSlide < 0) currentSlide = 0;

    function showSlide(index) {
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
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
    const toggle = document.querySelector('.mobile-menu-toggle');
    if (toggle) {
        toggle.setAttribute('aria-expanded', navLinks.classList.contains('active') ? 'true' : 'false');
    }
}

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

// GSAP & ScrollTrigger Animations
try { gsap.registerPlugin(ScrollTrigger); } catch(e) {}

// Initialize animations on page load
document.addEventListener('DOMContentLoaded', function() {
    initConnectivityFallback();
    rememberContactReturnPage();
    initScrollHeader();
    initHeroCarousel();
    
    let mm = gsap.matchMedia();

    mm.add({
        isDesktop: "(min-width: 769px) and (prefers-reduced-motion: no-preference)",
        isMobile: "(max-width: 768px) and (prefers-reduced-motion: no-preference)"
    }, (context) => {
        let { isDesktop, isMobile } = context.conditions;

        // Responsive animation values to prevent layout shifts on small screens
        const headerY = isMobile ? -60 : -100;
        const entryY = isMobile ? 30 : 60;
        const smallY = isMobile ? 15 : 30;
        const buttonY = isMobile ? 10 : 20;
        const imageScale = isMobile ? 0.95 : 0.85;

        // Global Header Animation
        gsap.from('header', {
            y: headerY,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });

        // Hero Section Animations
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

        // Section Headers Animation
        gsap.utils.toArray('.section-header, .section-title').forEach(header => {
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

        // Creative Cards / Service Cards / Stat Cards Staggered Animation
        const cardContainers = [
            '.why-choose .row', 
            '.services-grid', 
            '.owners-container', 
            '.blog-grid',
            '.stats-grid',
            '.services-container'
        ];

        cardContainers.forEach(containerSelector => {
            const container = document.querySelector(containerSelector);
            if (container) {
                const cards = container.querySelectorAll('.creative-card, .service-card, .owner-card, .blog-card, .stat-card');
                if (cards.length > 0) {
                    // Initial Entry Animation
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

                    // Specific internal standard enhancements for Service Cards
                    if (containerSelector === '.services-grid' || containerSelector === '.services-container') {
                        cards.forEach(card => {
                            const img = card.querySelector('img');
                            if (img) {
                                // On hover/tap interaction: subtle scale with full color maintained
                                card.addEventListener('mouseenter', () => {
                                    if(isDesktop || isMobile) {
                                        gsap.to(img, {
                                            scale: 1.05,
                                            duration: 0.5,
                                            ease: 'power2.out'
                                        });
                                    }
                                });
                                
                                card.addEventListener('mouseleave', () => {
                                    if(isDesktop || isMobile) {
                                        gsap.to(img, {
                                            scale: 1,
                                            duration: 0.5,
                                            ease: 'power2.out'
                                        });
                                    }
                                });

                                // For mobile/touch robustness: Subtle zoom midway through screen
                                ScrollTrigger.create({
                                    trigger: card,
                                    start: 'top 60%',
                                    end: 'bottom 40%',
                                    onEnter: () => gsap.to(img, { scale: 1.05, duration: 0.6 }),
                                    onLeave: () => gsap.to(img, { scale: 1, duration: 0.6 }),
                                    onEnterBack: () => gsap.to(img, { scale: 1.05, duration: 0.6 }),
                                    onLeaveBack: () => gsap.to(img, { scale: 1, duration: 0.6 })
                                });
                            }
                        });
                    }
                }
            }
        });

        // Global Standalone Image Entrance Animation
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

        // CTA Banner Animation
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

        // Footer Animation
        gsap.from('footer .footer-content > div', {
            scrollTrigger: { trigger: 'footer', start: 'top 95%', once: true },
            y: smallY, duration: 0.8, stagger: 0.2, ease: 'power2.out'
        });

        // ==============================================
        // ANIME.JS ANIMATIONS
        // ==============================================
        
        // 1. Continuous "Breathing" Pulse on Primary Buttons
        // We ensure Anime js only runs its loop if the user accepts motion
        const reachButtons = document.querySelectorAll('.reach-btn');
        if (reachButtons.length > 0) {
            anime({
                targets: '.reach-btn',
                scale: [1, 1.05],
                duration: 1500,
                easing: 'easeInOutSine',
                direction: 'alternate',
                loop: true
            });
        }

    }); // End of matchMedia

});



    const labels = document.querySelectorAll('.form-control-wave label');

    labels.forEach(label => {
    label.innerHTML = label.innerText
        .split('')
        .map((letter, idx) => 
        `<span style="transition-delay:${idx * 40}ms">${letter}</span>`
        )
        .join('');
    });
