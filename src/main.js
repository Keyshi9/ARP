import bgImage from './assets/background.png';

// ... (imports)

// ...

// 2. Initialize Background
const heroLinesContainer = document.getElementById('hero-lines');
if (heroLinesContainer) {
    new GridDistortion(heroLinesContainer, {
        grid: 30,
        mouse: 0.15,
        strength: 0.15,
        relaxation: 0.94,
        imageSrc: bgImage
    });
}

// 3. Setup Navigation
setupNavigation();

// 4. Initial Animation
animateEntry();

// 5. Setup Scroll Animations
setupScrollAnimations();

// 6. Setup Registration Logic
setupRegistration();
});

function initLenis() {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    appState.lenis = lenis;
    window.lenis = lenis; // Expose global for onclick handlers

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
}

// Make selectTier global for HTML onclick access
window.selectTier = (tier) => {
    const select = document.getElementById('ticket-select');
    if (select) {
        select.value = tier;
        // Scroll to form
        const formContainer = document.getElementById('reg-form-container');
        if (formContainer && window.lenis) {
            window.lenis.scrollTo(formContainer, { offset: -50 });
        } else {
            if (formContainer) formContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                appState.lenis.scrollTo(targetSection, { offset: -80 });
            }
        });
    });
}

function animateEntry() {
    const heroContent = document.querySelector('.hero-content');
    const nav = document.querySelector('nav');

    const tl = gsap.timeline();

    tl.from(nav, {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    })
        .from(heroContent.children, {
            y: 100,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out'
        }, '-=0.5');
}

function setupScrollAnimations() {
    // Animate Section Titles
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse'
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });
    });

    // Animate Cards
    gsap.utils.toArray('.card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            y: 100,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.1,
            ease: 'power3.out'
        });
    });
}

// Countdown Logic
const eventDate = new Date('2026-05-23T12:00:00').getTime();
const daysEl = document.getElementById('days');
if (daysEl) {
    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = eventDate - now;
        if (distance < 0) return;
        document.getElementById('days').innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
        document.getElementById('hours').innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        document.getElementById('minutes').innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        document.getElementById('seconds').innerText = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
    };

    setInterval(updateCountdown, 1000);
    updateCountdown();
}

function setupRegistration() {
    const form = document.getElementById('registration-form');

    if (!form) return;

    // Mock Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('.form-submit');

        btn.disabled = true;
        btn.innerText = 'PROCESSING...';

        setTimeout(() => {
            const formData = new FormData(form);

            form.innerHTML = `
        <div style="text-align: center; padding: 4rem 0;">
          <h3 style="font-size: 2rem; margin-bottom: 1rem;">You're In.</h3>
          <p>Confirmation sent to ${formData.get('email')}.</p>
          <div style="margin-top: 2rem; font-size: 4rem; opacity: 0.5;">✦</div>
          <button onclick="window.location.reload()" class="form-submit" style="margin-top: 2rem; width: auto; padding: 1rem 3rem;">Close</button>
        </div>
      `;
        }, 1500);
    });
}
