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
    var hint = document.getElementById('scrollHint');
    var btnLogin = document.querySelector('.btn-login');

    if (!container || !loginSection) return;

    // ---- Auto-Scroll on Login Error ----
    var hasError = !!document.querySelector('.error-msg');
    if (hasError) {
        // Delay slightly for smooth transition
        setTimeout(function () {
            loginSection.scrollIntoView({ behavior: 'auto' });
            loginSection.classList.add('active-login');
        }, 100);
    }

    // ---- Intersection Observer to Trigger Entry Animation ----
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active-login');
                    // Focus NIM input automatically when login card is fully in view
                    setTimeout(function () {
                        var nimInput = document.getElementById('nim');
                        if (nimInput) nimInput.focus();
                    }, 400);
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
            loginSection.scrollIntoView({ behavior: 'smooth' });
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
