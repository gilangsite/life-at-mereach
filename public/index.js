/* ============================================
   MEREACH Website - JavaScript
   ============================================ */

// ========== GLOBAL STATE ==========
const state = {
    registeredPartners: [], // Simulated partner database (will be replaced with actual backend)
    currentEventSlide: 0,
    eventAutoSlideInterval: null,
    isEventDragging: false,
    eventDragStartX: 0,
    eventDragCurrentX: 0
};

// ========== DOM ELEMENTS ==========
// ========== CONFIGURATION ==========
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzun7ybIGPcN4sR71saLloMp9QwA22kGX1py-C4f5dUfTWGfBjPyqQ30lkDk8uhly7vaA/exec'; // Replace with your Google Apps Script Web App URL
const elements = {
    nav: document.getElementById('nav'),

    // Modals
    modalPartner: document.getElementById('modal-partner'),
    modalTeman: document.getElementById('modal-teman'),
    modalEvent: document.getElementById('modal-event'),
    modalSuccess: document.getElementById('modal-success'),
    modalAksesKonten: document.getElementById('modal-akses-konten'),

    // Modal Triggers
    btnPartner: document.getElementById('btn-partner'),
    btnTeman: document.getElementById('btn-teman'),
    btnBackHome: document.getElementById('btn-back-home'),
    closePartner: document.getElementById('close-partner'),
    closeTeman: document.getElementById('close-teman'),
    closeEvent: document.getElementById('close-event'),
    closeAksesKonten: document.getElementById('close-akses-konten'),

    // Nav Dropdown
    navToggle: document.getElementById('nav-toggle'),
    navDropdown: document.getElementById('nav-dropdown'),

    // Forms
    formPartner: document.getElementById('form-partner'),
    formTeman: document.getElementById('form-teman'),
    formEvent: document.getElementById('form-event'),
    formVerifyEmail: document.getElementById('form-verify-email'),

    // Conditional form fields
    sumberInfo: document.getElementById('sumber-info'),
    namaTeman: document.getElementById('nama-teman'),
    waktuLain: document.getElementById('waktu-lain'),

    // Carousels
    eventsCarousel: document.getElementById('events-carousel'),
    kuliahCarousel: document.getElementById('kuliah-carousel'),

    // Notification
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message'),
    notificationIcon: document.getElementById('notification-icon'),
    notificationActions: document.getElementById('notification-actions')
};

// ========== DROPDOWN MENU ==========
elements.navToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.navDropdown.classList.toggle('active');
    elements.navToggle.classList.toggle('active'); // Animate hamburger
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!elements.navDropdown?.contains(e.target) && !elements.navToggle?.contains(e.target)) {
        elements.navDropdown?.classList.remove('active');
        elements.navToggle?.classList.remove('active'); // Reset hamburger
    }
});

// Dropdown items click (scroll and close)
document.querySelectorAll('.nav-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
        elements.navDropdown.classList.remove('active');
        elements.navToggle.classList.remove('active'); // Reset hamburger
    });
});

// ========== NAVIGATION SCROLL EFFECT ==========
function handleNavScroll() {
    if (window.scrollY > 50) {
        elements.nav.classList.add('scrolled');
    } else {
        elements.nav.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', handleNavScroll);

// ========== MODAL FUNCTIONS ==========
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Modal event listeners
elements.btnPartner?.addEventListener('click', () => openModal(elements.modalPartner));
elements.btnTeman?.addEventListener('click', () => openModal(elements.modalTeman));
elements.closePartner?.addEventListener('click', () => closeModal(elements.modalPartner));
elements.closeTeman?.addEventListener('click', () => closeModal(elements.modalTeman));
elements.closeEvent?.addEventListener('click', () => closeModal(elements.modalEvent));
elements.closeAksesKonten?.addEventListener('click', () => closeModal(elements.modalAksesKonten));
elements.btnBackHome?.addEventListener('click', () => closeModal(elements.modalSuccess));

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
        }
    });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            closeModal(modal);
        });
    }
});

// ========== CONDITIONAL FORM FIELDS ==========
// Show/hide "nama teman" field based on sumber info
elements.sumberInfo?.addEventListener('change', (e) => {
    if (e.target.value === 'Temen') {
        elements.namaTeman.style.display = 'block';
        elements.namaTeman.required = true;
    } else {
        elements.namaTeman.style.display = 'none';
        elements.namaTeman.required = false;
        elements.namaTeman.value = '';
    }
});

// Show/hide "waktu lain" field based on waktu produktif
document.querySelectorAll('input[name="waktuProduktif"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'Lainnya') {
            elements.waktuLain.style.display = 'block';
            elements.waktuLain.required = true;
        } else {
            elements.waktuLain.style.display = 'none';
            elements.waktuLain.required = false;
            elements.waktuLain.value = '';
        }
    });
});

// ========== NOTIFICATION FUNCTIONS ==========
function showNotification(message, type = 'error', actions = []) {
    elements.notificationMessage.textContent = message;
    elements.notification.className = `notification ${type} show`;

    // Update icon based on type
    if (type === 'error') {
        elements.notificationIcon.innerHTML = `
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        `;
        elements.notificationIcon.classList.add('error');
        elements.notificationIcon.classList.remove('success');
    } else {
        elements.notificationIcon.innerHTML = `
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        `;
        elements.notificationIcon.classList.add('success');
        elements.notificationIcon.classList.remove('error');
    }

    // Add action buttons
    elements.notificationActions.innerHTML = '';
    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = `btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`;
        btn.textContent = action.label;
        btn.style.padding = '8px 16px';
        btn.style.fontSize = '0.875rem';
        btn.addEventListener('click', () => {
            hideNotification();
            action.onClick?.();
        });
        elements.notificationActions.appendChild(btn);
    });

    // Auto hide after 5 seconds if no actions
    if (actions.length === 0) {
        setTimeout(hideNotification, 5000);
    }
}

function hideNotification() {
    elements.notification.classList.remove('show');
}

// ========== FORM SUBMISSIONS ==========
// Partner form submission
elements.formPartner?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Change button state
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending...';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Get checkbox values for kendaraan
    const kendaraan = formData.getAll('kendaraan');
    data.kendaraan = kendaraan.join(', ');
    data.type = 'partner';

    try {
        // Submit to Google Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors for simple POST
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        // Add to simulated state
        state.registeredPartners.push({
            email: data.email,
            namaLengkap: data.namaLengkap,
            ...data
        });

        console.log('Partner Registration Success (Sent to Script)');

        // Reset form and close modal
        e.target.reset();
        closeModal(elements.modalPartner);

        // Show Success Modal
        setTimeout(() => openModal(elements.modalSuccess), 500);

    } catch (error) {
        console.error('Submission Error:', error);
        showNotification('Terjadi kesalahan saat mengirim data. Silakan coba lagi.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// Teman form submission
elements.formTeman?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting...';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.type = 'teman';

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        console.log('Teman Registration Success (Sent to Script)');

        // Show success notification
        showNotification('Selamat datang, Teman MEREACH! Kamu sekarang bisa mengakses konten eksklusif.', 'success');

        // Reset form and close modal
        e.target.reset();
        closeModal(elements.modalTeman);

    } catch (error) {
        console.error('Submission Error:', error);
        showNotification('Terjadi kesalahan. Silakan coba lagi.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// Event form submission
elements.formEvent?.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Check if email is registered (simulated)
    // In production, this will check against actual database via API
    const isRegistered = state.registeredPartners.some(
        partner => partner.namaLengkap.toLowerCase() === data.namaLengkap.toLowerCase()
    );

    if (!isRegistered) {
        showNotification(
            'Email belum terdaftar atau salah. Pastikan kamu daftar dulu menjadi Partner MEREACH untuk mengikuti Event.',
            'error',
            [
                {
                    label: 'Partner MEREACH',
                    primary: true,
                    onClick: () => {
                        closeModal(elements.modalEvent);
                        openModal(elements.modalPartner);
                    }
                }
            ]
        );
        return;
    }

    console.log('Event Registration:', data);

    // Show success notification
    showNotification('Pendaftaran event berhasil! Kami akan mengirimkan info lengkap ke emailmu.', 'success');

    // Reset form and close modal
    e.target.reset();
    closeModal(elements.modalEvent);
});

// ========== EVENT CAROUSEL (ROBUST INFINITE LOOP) ==========
function initEventsCarousel() {
    const carousel = elements.eventsCarousel;
    if (!carousel) return;

    // Clone cards for infinite loop (Set: [Clone-Left] [Original] [Clone-Right])
    const originalCards = Array.from(carousel.querySelectorAll('.event-card'));
    const total = originalCards.length;

    // Duplicate cards TWICE (once before, once after)
    const clonesLeft = originalCards.map(c => c.cloneNode(true));
    const clonesRight = originalCards.map(c => c.cloneNode(true));

    clonesLeft.forEach(c => carousel.insertBefore(c, carousel.firstChild));
    clonesRight.forEach(c => carousel.appendChild(c));

    const allCards = Array.from(carousel.querySelectorAll('.event-card'));
    // Start at index `total` (First real card)
    let currentIndex = total;
    let isTransitioning = false;
    let autoSlideInterval = null;

    function updateCarousel(smooth = true) {
        if (smooth) {
            carousel.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            carousel.style.transition = 'none';
        }

        const currentCard = allCards[currentIndex];
        const cardWidth = currentCard.offsetWidth;
        const viewportWidth = window.innerWidth;
        const currentItemOffset = currentCard.offsetLeft;

        // Formula: Center point of screen - Center point of card relative to carousel container
        const translate = (viewportWidth / 2) - (cardWidth / 2) - currentItemOffset;
        carousel.style.transform = `translateX(${translate}px)`;

        // Update active class
        allCards.forEach((card, idx) => {
            if (idx === currentIndex) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    function handleTransitionEnd() {
        isTransitioning = false;

        // Loop Logic
        // If we swipe past the last real card into the RIGHT clones
        if (currentIndex >= total * 2) {
            // Jump back to the start of real cards (index `total`)
            currentIndex = total;
            updateCarousel(false);
        }
        // If we swipe past the first real card into the LEFT clones
        else if (currentIndex < total) {
            // Jump to the corresponding card in the RIGHT clones (index `total + (currentIndex % total)`)
            // Or more simply, if currentIndex is 0 (first clone), jump to total (first real).
            // If currentIndex is total-1 (last clone), jump to total*2 - 1 (last real).
            currentIndex = total + (currentIndex % total);
            updateCarousel(false);
        }
    }

    carousel.addEventListener('transitionend', handleTransitionEnd);

    function nextSlide() {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex++;
        updateCarousel();
    }

    function prevSlide() {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex--;
        updateCarousel();
    }

    // Manual Swipe Logic
    let startX = 0;
    let isDragging = false;

    function startDrag(e) {
        if (isTransitioning) return;
        isDragging = true;
        startX = e.type === 'mousedown' ? e.pageX : e.touches[0].pageX;
        carousel.style.cursor = 'grabbing';
        stopAutoSlide();
    }

    function moveDrag(e) {
        if (!isDragging) return;
        e.preventDefault(); // Prevent scroll on mobile
    }

    function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        carousel.style.cursor = 'grab';

        const endX = e.type === 'mouseup' ? e.pageX : e.changedTouches[0].pageX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) { // Threshold
            if (diff > 0) nextSlide();
            else prevSlide();
        } else {
            // Snap back if swipe was too small
            updateCarousel();
        }
        startAutoSlide();
    }

    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(nextSlide, 3000);
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    // Event Listeners
    carousel.addEventListener('mousedown', startDrag);
    carousel.addEventListener('touchstart', startDrag, { passive: false });

    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('touchmove', moveDrag, { passive: false });

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);

    // Initial setup
    // Delay slightly to ensure layout is computed
    setTimeout(() => {
        updateCarousel(false);
        startAutoSlide();
    }, 100);

    // Handle resize
    window.addEventListener('resize', () => {
        updateCarousel(false);
    });
}

// ========== JOIN EVENT BUTTONS ==========
document.querySelectorAll('.event-join-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(elements.modalEvent);
    });
});

// ========== KULIAH SECTION BUTTONS ==========
document.querySelectorAll('.btn-akses').forEach(btn => {
    btn.addEventListener('click', () => {
        openModal(elements.modalAksesKonten);
    });
});

// JSONP Helper for index.js (similar to dashboard.js)
function callScript(params) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        window[callbackName] = (data) => {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };

        const queryString = Object.keys(params)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');

        const script = document.createElement('script');
        script.src = `${SCRIPT_URL}?${queryString}&callback=${callbackName}`;
        script.onerror = () => {
            document.body.removeChild(script);
            reject(new Error('Network Error'));
        };
        document.body.appendChild(script);
    });
}

// Verify Email for Exclusive Content
elements.formVerifyEmail?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('id-verify-email').value.trim();
    const submitBtn = document.getElementById('btn-verify-submit');
    const errorEl = document.getElementById('verify-error');

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Memverifikasi...';
    errorEl.style.display = 'none';

    try {
        const result = await callScript({
            action: 'checkEmailRegistration',
            email: email
        });

        if (result.status === 'success' && result.registered) {
            closeModal(elements.modalAksesKonten);
            showNotification(`Selamat datang kembali, ${result.name}! Akses Konten Eksklusif berhasil dibuka.`, 'success');
            // In a real app, you'd redirect or reveal the content here.
            // For now, we'll just show success.
        } else {
            closeModal(elements.modalAksesKonten);
            showNotification(
                'Email kamu belum terdaftar sebagai Partner atau Teman MEREACH.',
                'error',
                [
                    {
                        label: 'Jadi Teman MEREACH',
                        primary: true,
                        onClick: () => openModal(elements.modalTeman)
                    },
                    {
                        label: 'Daftar Partner',
                        primary: false,
                        onClick: () => openModal(elements.modalPartner)
                    }
                ]
            );
        }
    } catch (err) {
        errorEl.textContent = 'Gagal memverifikasi. Coba lagi.';
        errorEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Verifikasi Akses';
    }
});

// ========== TESTIMONIALS PAUSE ON HOVER ==========
function initTestimonials() {
    const columns = document.querySelectorAll('.testimonials-column');

    columns.forEach(column => {
        column.addEventListener('mouseenter', () => {
            column.style.animationPlayState = 'paused';
        });

        column.addEventListener('mouseleave', () => {
            column.style.animationPlayState = 'running';
        });
    });
}

// ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Logo Click to Top
document.querySelector('.nav-logo-link').addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ========== INTERSECTION OBSERVER FOR ANIMATIONS ==========
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('animate-ready');
        observer.observe(section);
    });
}

// Add animation styles dynamically
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    .animate-ready {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease, transform 0.8s ease;
    }
    
    .animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .hero.animate-ready {
        opacity: 1;
        transform: none;
    }
`;
document.head.appendChild(animationStyles);

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    initEventsCarousel();
    initTestimonials();
    initScrollAnimations();
    handleNavScroll();
});

// ========== GOOGLE APPS SCRIPT INTEGRATION (PLACEHOLDER) ==========
// This section will be configured later to send data to Google Sheets

/*
async function submitToGoogleSheets(formType, data) {
    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: formType,
                data: data,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error submitting form:', error);
        throw error;
    }
}

async function checkPartnerRegistration(email) {
    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=checkEmail&email=${encodeURIComponent(email)}`);
        const result = await response.json();
        return result.registered;
    } catch (error) {
        console.error('Error checking registration:', error);
        return false;
    }
}
*/
