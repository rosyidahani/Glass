// ============================================================
// AUTH.JS — Splash Screen + Scroll Reveal (Pure JS, no template needed)
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

// ============================================================
// MAIN — Splash + Reveal
// ============================================================
document.addEventListener('DOMContentLoaded', function () {

    var header = document.querySelector('.header-section');
    var card   = document.querySelector('.login-card');
    var body   = document.body;

    // Jika ada error login → langsung tampil form, skip splash
    var hasError = !!document.querySelector('.error-msg');

    if (!header || !card) return; // safety guard

    // ---- Inject CSS keyframes ----
    var styleTag = document.createElement('style');
    styleTag.textContent = [
        '@keyframes floatLogo{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}',
        '@keyframes arrowBob{0%,100%{transform:rotate(45deg) translate(0,0);opacity:.9}50%{transform:rotate(45deg) translate(3px,3px);opacity:.4}}',
        '@keyframes fadeInSplash{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}',
    ].join('');
    document.head.appendChild(styleTag);

    // ================================================================
    // STEP 1 — SETUP SPLASH: kunci body, sembunyikan card
    // ================================================================
    body.style.overflow   = 'hidden';
    body.style.height     = '100vh';
    body.style.background = '#eef2fb';

    // Header → full viewport centered, fixed
    header.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:50',
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'justify-content:center',
        'gap:0',
        'transition:transform .7s cubic-bezier(.4,0,.2,1), opacity .6s ease',
        'animation:fadeInSplash .8s ease',
    ].join(';');

    // Logo float animation
    var logo = header.querySelector('.header-logo') || header.querySelector('img');
    if (logo) {
        logo.style.cssText = [
            'width:140px',
            'height:140px',
            'object-fit:contain',
            'filter:drop-shadow(0 16px 40px rgba(59,130,246,.35))',
            'animation:floatLogo 4s ease-in-out infinite',
            'margin-bottom:0',
        ].join(';');
    }

    var titleEl = header.querySelector('.header-title');
    if (titleEl) {
        titleEl.style.cssText = 'font-size:44px;font-weight:800;letter-spacing:6px;background:linear-gradient(135deg,#1e3a8a,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-top:8px;';
    }

    var subtitleEl = header.querySelector('.header-subtitle');
    if (subtitleEl) {
        subtitleEl.style.cssText = 'font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:2px;margin-top:4px;';
    }

    // ---- Tambahkan HINT geser ke atas ----
    var hint = document.createElement('div');
    hint.id = 'splashHint';
    hint.style.cssText = [
        'position:fixed',
        'bottom:48px',
        'left:50%',
        'transform:translateX(-50%)',
        'display:flex',
        'flex-direction:column',
        'align-items:center',
        'gap:10px',
        'z-index:51',
        'transition:opacity .4s ease',
        'cursor:pointer',
    ].join(';');

    // Tiga panah chevron
    var arrowWrap = document.createElement('div');
    arrowWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
    for (var k = 0; k < 3; k++) {
        var arrow = document.createElement('span');
        arrow.style.cssText = [
            'display:block',
            'width:12px',
            'height:12px',
            'border-right:2.5px solid #94a3b8',
            'border-bottom:2.5px solid #94a3b8',
            'border-radius:1px',
            'animation:arrowBob 1.3s ease-in-out ' + (k * 0.15) + 's infinite',
            'opacity:' + (1 - k * 0.3),
        ].join(';');
        arrowWrap.appendChild(arrow);
    }

    var hintText = document.createElement('span');
    hintText.textContent = 'Geser ke atas untuk masuk';
    hintText.style.cssText = 'font-size:12px;font-weight:600;color:#64748b;font-family:Outfit,sans-serif;letter-spacing:.3px;';

    hint.appendChild(arrowWrap);
    hint.appendChild(hintText);
    body.appendChild(hint);

    // ---- Card → sembunyikan di bawah viewport ----
    card.style.cssText = [
        'position:fixed',
        'bottom:0',
        'left:50%',
        'transform:translateX(-50%) translateY(110%)',
        'width:calc(100% - 32px)',
        'max-width:420px',
        'z-index:60',
        'transition:transform .75s cubic-bezier(.34,1.3,.64,1)',
        'border-radius:28px 28px 28px 28px',
        'box-sizing:border-box',
        'margin-bottom:20px',
    ].join(';');

    // Pill handle di atas card
    if (!card.querySelector('.pill-handle')) {
        var pill = document.createElement('div');
        pill.className = 'pill-handle';
        pill.style.cssText = 'width:44px;height:5px;background:#cbd5e1;border-radius:99px;margin:0 auto 20px;';
        card.insertBefore(pill, card.firstChild);
    }

    // ================================================================
    // STEP 2 — REVEAL FUNCTION
    // ================================================================
    var revealed = false;

    function revealLogin() {
        if (revealed) return;
        revealed = true;

        // Header mundur ke atas & memudar
        header.style.transform = 'translateY(-20%)';
        header.style.opacity   = '0.15';
        header.style.pointerEvents = 'none';

        // Hint menghilang
        hint.style.opacity = '0';
        hint.style.pointerEvents = 'none';

        // Card naik ke atas dengan spring bounce
        card.style.transform = 'translateX(-50%) translateY(0)';

        // Fokus ke input NIM setelah animasi
        setTimeout(function () {
            var nim = document.getElementById('nim');
            if (nim) nim.focus();
        }, 850);
    }

    // Jika ada error → langsung reveal tanpa splash
    if (hasError) {
        revealed = true;
        header.style.transition = 'none';
        header.style.transform  = 'translateY(-20%)';
        header.style.opacity    = '0.15';
        header.style.pointerEvents = 'none';
        hint.style.display = 'none';
        card.style.transition = 'none';
        card.style.transform = 'translateX(-50%) translateY(0)';
    }

    // ================================================================
    // STEP 3 — EVENT LISTENERS
    // ================================================================

    // Scroll (desktop)
    window.addEventListener('wheel', function (e) {
        if (e.deltaY > 0) revealLogin();
    }, { passive: true });

    // Touch swipe ke atas (mobile)
    var touchY0 = 0;
    window.addEventListener('touchstart', function (e) {
        touchY0 = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchend', function (e) {
        if (touchY0 - e.changedTouches[0].clientY > 40) revealLogin();
    }, { passive: true });

    // Keyboard
    window.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'PageDown' ||
            e.key === ' ' || e.key === 'Enter' || e.key.length === 1) {
            revealLogin();
        }
    });

    // Klik hint arrow
    hint.addEventListener('click', revealLogin);

    // ================================================================
    // STEP 4 — LUPA PASSWORD LINK
    // ================================================================
    var btnLogin = document.querySelector('.btn-login');
    if (btnLogin && !document.querySelector('.forgot-password-wrapper')) {
        var fpWrapper = document.createElement('div');
        fpWrapper.style.cssText = 'text-align:center;margin-top:16px;';

        var fpLink = document.createElement('a');
        fpLink.href = '/lupa-password';
        fpLink.style.cssText = 'display:inline-flex;align-items:center;gap:6px;color:#64748b;font-size:13px;font-weight:500;font-family:Outfit,sans-serif;text-decoration:none;padding:6px 12px;border-radius:8px;transition:all .25s ease;';
        fpLink.innerHTML = '&#128274; Lupa Password?';
        fpLink.addEventListener('mouseenter', function () { this.style.color='#3b82f6'; this.style.background='rgba(59,130,246,.08)'; });
        fpLink.addEventListener('mouseleave', function () { this.style.color='#64748b'; this.style.background='transparent'; });

        fpWrapper.appendChild(fpLink);
        btnLogin.insertAdjacentElement('afterend', fpWrapper);
    }
});
