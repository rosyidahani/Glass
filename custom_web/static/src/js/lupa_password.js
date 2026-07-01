// ============================================
// LUPA PASSWORD — Frontend JS
// ============================================

/**
 * Transisi ke step tertentu (1, 2, atau 3).
 */
function showFpStep(step) {
    // Sembunyikan semua panel
    var panels = document.querySelectorAll('.fp-panel');
    panels.forEach(function(p) {
        p.style.display = 'none';
    });

    // Tampilkan panel yang sesuai
    var target = document.getElementById('fp-step-' + step);
    if (target) {
        target.style.display = 'block';
        target.style.animation = 'none';
        // Trigger reflow untuk ulang animasi
        void target.offsetWidth;
        target.style.animation = '';
    }

    // Update step dots
    for (var i = 1; i <= 3; i++) {
        var dot = document.getElementById('step-dot-' + i);
        if (!dot) continue;
        dot.classList.remove('active', 'done');
        if (i < step) dot.classList.add('done');
        if (i === step) dot.classList.add('active');
    }

    // Update step lines
    for (var j = 1; j <= 2; j++) {
        var line = document.getElementById('step-line-' + j);
        if (!line) continue;
        if (j < step) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    }
}

/**
 * Loading state pada tombol submit.
 */
function setLoading(btn, isLoading) {
    if (isLoading) {
        btn.classList.add('loading');
        btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite;"></i> Mengirim...';
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.innerHTML = '<i class="bi bi-send-fill"></i> Kirim Tautan Reset';
        btn.disabled = false;
    }
}

/**
 * Kirim ulang email reset.
 */
function resendEmail() {
    var btn = document.querySelector('#fp-step-2 .fp-submit-btn');
    if (!btn) return;

    var originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Mengirim ulang...';

    setTimeout(function() {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Email telah dikirim ulang!';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        btn.style.boxShadow = '0 10px 25px -5px rgba(16,185,129,0.4)';

        setTimeout(function() {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.style.boxShadow = '';
        }, 3000);
    }, 1500);
}

// ============================================
// INISIALISASI SAAT DOM SIAP
// ============================================
document.addEventListener('DOMContentLoaded', function () {

    // Tambah CSS spin animation secara inline
    var styleEl = document.createElement('style');
    styleEl.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(styleEl);

    // Tangani submit form dengan loading state
    var form = document.getElementById('fpForm');
    var submitBtn = document.getElementById('fpSubmitBtn');

    if (form && submitBtn) {
        form.addEventListener('submit', function (e) {
            var emailVal = document.getElementById('fp_email').value.trim();
            if (!emailVal) {
                e.preventDefault();
                return;
            }
            // Simpan email untuk ditampilkan di step 2
            sessionStorage.setItem('fp_email', emailVal);
            setLoading(submitBtn, true);
        });
    }

    // Tampilkan email di step 2 jika ada
    var sentEmailEl = document.getElementById('fp-sent-email');
    if (sentEmailEl) {
        var savedEmail = sessionStorage.getItem('fp_email') || 'email Anda';
        sentEmailEl.textContent = savedEmail;
    }

    // Jika sudah di step 2 (server return success), tampilkan panel 2
    // (dipanggil dari inline script di template jika t-if="success")
});
