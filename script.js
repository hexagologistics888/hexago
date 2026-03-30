// Driver Logistics Website JavaScript

// Hero Slider Functionality
function initHeroCarousel() {
    const heroCarousel = document.getElementById('heroCarousel');
    if (!heroCarousel) return;

    if (window.bootstrap && window.bootstrap.Carousel) {
        const carousel = window.bootstrap.Carousel.getOrCreateInstance(heroCarousel, {
            interval: 5000,
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
    }, 5000);
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



