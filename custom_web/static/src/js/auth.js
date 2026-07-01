// ============================================================
// AUTH.JS — Scroll Snap Reveal & Interactions
// ============================================================

// ---- ROLE TOGGLE ----
function setRole(role) {
    var roleInput = document.getElementById('role_input');
    if (roleInput) roleInput.value = role;

    var btns = document.getElementsByClassName('role-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');

    var labelNim = document.getElementById('label_nim');
    var inputNim = document.getElementById('nim');

    if (role === 'mahasiswa') {
        if (labelNim) labelNim.innerText = 'NIM';
        if (inputNim) inputNim.placeholder = 'Masukkan NIM Anda';
        if (btns[0]) btns[0].classList.add('active');
    } else {
        if (labelNim) labelNim.innerText = 'NIP';
        if (inputNim) inputNim.placeholder = 'Masukkan NIP Anda';
        if (btns[1]) btns[1].classList.add('active');
    }
}

// ---- MAIN SCROLL LOGIC ----
document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('scrollContainer');
    var loginSection = document.getElementById('loginSection');
    var splashSection = document.getElementById('splashSection');
    var hint = document.getElementById('scrollHint');
    var btnLogin = document.querySelector('.btn-login');

    if (!container || !loginSection) return;

    var currentSection = 0; // 0 = splash, 1 = login
    var isAnimating = false;

    // ---- Auto-Scroll on Login Error ----
    var hasError = !!document.querySelector('.error-msg');
    if (hasError) {
        currentSection = 1;
        // Delay slightly for smooth transition
        setTimeout(function () {
            loginSection.scrollIntoView({ behavior: 'auto' });
            loginSection.classList.add('active-login');
        }, 100);
    }

    // ---- Smooth Navigation Helper ----
    function navigateToSection(index) {
        if (isAnimating) return;
        isAnimating = true;
        currentSection = index;

        // Disable scroll snap temporarily to prevent native snapping conflicts during JS-smooth-scrolling
        container.style.scrollSnapType = 'none';

        var targetSection = index === 0 ? splashSection : loginSection;
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        setTimeout(function () {
            // Restore native snap type for viewport matching and touch swipes
            container.style.scrollSnapType = 'y mandatory';
            isAnimating = false;
        }, 800); // Duration aligned with standard smooth scroll
    }

    // ---- Wheel Event Listener for Smooth Scrolling ----
    container.addEventListener('wheel', function (e) {
        // Prevent default desktop wheel scroll (which is discrete and jarring)
        e.preventDefault();

        if (isAnimating) return;

        // Small threshold to avoid accidental micro-scrolls
        if (e.deltaY > 10 && currentSection === 0) {
            navigateToSection(1);
        } else if (e.deltaY < -10 && currentSection === 1) {
            navigateToSection(0);
        }
    }, { passive: false });

    // ---- Keyboard Navigation for Smooth Scrolling ----
    window.addEventListener('keydown', function (e) {
        var key = e.key;
        if (isAnimating) return;

        if (key === 'ArrowDown' || key === 'PageDown' || key === ' ' || key === 'Enter') {
            if (currentSection === 0) {
                e.preventDefault();
                navigateToSection(1);
            }
        } else if (key === 'ArrowUp' || key === 'PageUp') {
            if (currentSection === 1) {
                // Do not hijack scrolling if focusing an input/textarea
                var activeEl = document.activeElement;
                if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                    return;
                }
                e.preventDefault();
                navigateToSection(0);
            }
        }
    });

    // ---- Intersection Observer to Trigger Entry Animation & Sync State ----
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active-login');
                    currentSection = 1;
                    // Focus NIM input automatically when login card is fully in view
                    setTimeout(function () {
                        var nimInput = document.getElementById('nim');
                        if (nimInput) nimInput.focus();
                    }, 400);
                } else {
                    // Update current section if we have scrolled back to splash screen
                    if (container.scrollTop < window.innerHeight / 2) {
                        currentSection = 0;
                    }
                }
            });
        }, { threshold: 0.4 });
        observer.observe(loginSection);
    } else {
        // Fallback for older browsers
        loginSection.classList.add('active-login');
    }

    // ---- Click Hint Arrow to Scroll Down ----
    if (hint) {
        hint.addEventListener('click', function () {
            navigateToSection(1);
        });
    }

    // ---- Inject Lupa Password Link ----
    if (btnLogin && !document.querySelector('.forgot-password-wrapper')) {
        var fpWrapper = document.createElement('div');
        fpWrapper.className = 'forgot-password-wrapper';

        var fpLink = document.createElement('a');
        fpLink.href = '/lupa-password';
        fpLink.className = 'forgot-password-link';
        fpLink.innerHTML = '&#128274; Lupa Password?';

        fpWrapper.appendChild(fpLink);
        btnLogin.insertAdjacentElement('afterend', fpWrapper);
    }
});
