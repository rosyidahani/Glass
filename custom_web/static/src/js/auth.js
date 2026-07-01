// ============================================================
// AUTH.JS — Login page: Splash reveal + role toggle + lupa password
// ============================================================

// ---- ROLE TOGGLE ----
function setRole(role) {
    var roleInput = document.getElementById('role_input');
    if (roleInput) roleInput.value = role;

    var btns = document.getElementsByClassName('role-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
    }

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

// ============================================================
// SPLASH → LOGIN REVEAL
// ============================================================
(function () {
    var revealed = false;

    function revealLogin() {
        if (revealed) return;
        revealed = true;
        document.body.classList.add('revealed');
        // Fokus ke input NIM setelah animasi selesai
        setTimeout(function () {
            var nim = document.getElementById('nim');
            if (nim) nim.focus();
        }, 800);
    }

    document.addEventListener('DOMContentLoaded', function () {

        // Jika ada error (login gagal), langsung reveal tanpa perlu scroll
        var errorEl = document.querySelector('.error-msg');
        if (errorEl) {
            revealed = true;
            document.body.classList.add('revealed');
        }

        // ---- WHEEL (desktop scroll) ----
        window.addEventListener('wheel', function (e) {
            if (e.deltaY > 0) revealLogin(); // Scroll ke bawah
        }, { passive: true });

        // ---- TOUCH (mobile swipe up) ----
        var touchStartY = 0;
        window.addEventListener('touchstart', function (e) {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchend', function (e) {
            var touchEndY = e.changedTouches[0].clientY;
            if (touchStartY - touchEndY > 40) revealLogin(); // Swipe ke atas
        }, { passive: true });

        // ---- KEYBOARD (tekan sembarang tombol) ----
        window.addEventListener('keydown', function (e) {
            if (['ArrowDown', 'PageDown', 'Space', 'Enter'].includes(e.key) ||
                (e.key.length === 1)) {
                revealLogin();
            }
        });

        // ---- KLIK hint arrow ----
        var hint = document.getElementById('scrollHint');
        if (hint) {
            hint.addEventListener('click', revealLogin);
            hint.style.cursor = 'pointer';
        }

        // ---- LUPA PASSWORD LINK (inject di bawah tombol Masuk) ----
        var btnLogin = document.querySelector('.btn-login');
        if (btnLogin && !document.querySelector('.forgot-password-wrapper')) {
            var wrapper = document.createElement('div');
            wrapper.className = 'forgot-password-wrapper';

            var link = document.createElement('a');
            link.href = '/lupa-password';
            link.className = 'forgot-password-link';
            link.innerHTML = '&#128274; Lupa Password?';

            link.addEventListener('mouseenter', function () {
                this.style.color = '#3b82f6';
                this.style.background = 'rgba(59,130,246,0.08)';
            });
            link.addEventListener('mouseleave', function () {
                this.style.color = '';
                this.style.background = '';
            });

            wrapper.appendChild(link);
            btnLogin.insertAdjacentElement('afterend', wrapper);
        }
    });
})();
