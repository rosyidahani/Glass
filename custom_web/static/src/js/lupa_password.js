// ============================================
// LUPA PASSWORD — Frontend JS
// ============================================

/**
 * Transisi ke step tertentu (1, 2, 3, atau 4).
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
        // Jika di step 4 (selesai), dot 3 ikut ditandai done
        if (i === 3 && step === 4) {
            dot.classList.add('done');
        } else if (i === step) {
            dot.classList.add('active');
        }
    }

    // Update step lines
    for (var j = 1; j <= 2; j++) {
        var line = document.getElementById('step-line-' + j);
        if (!line) continue;
        if (j < step || (j === 2 && step === 4)) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    }

    // Jalankan timer jika masuk ke Step 2
    if (step === 2) {
        startOtpCountdown();
        initOtpInputs();
    }
}

/**
 * Loading state pada tombol submit.
 */
function setLoading(btn, isLoading, text) {
    if (isLoading) {
        btn.classList.add('loading');
        btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite;"></i> ' + (text || 'Mengirim...');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.innerHTML = text;
        btn.disabled = false;
    }
}

// ============================================
// OTP COUNTDOWN TIMER & AJAX RESEND
// ============================================
var countdownTimer = null;

function startOtpCountdown() {
    clearInterval(countdownTimer);
    var seconds = 60;
    var countdownEl = document.getElementById('otp-countdown');
    var timerTextEl = document.getElementById('otp-timer-text');
    var resendBtnEl = document.getElementById('otpResendBtn');
    
    if (!countdownEl || !timerTextEl || !resendBtnEl) return;

    timerTextEl.style.display = 'inline';
    resendBtnEl.style.display = 'none';
    countdownEl.textContent = seconds;

    countdownTimer = setInterval(function() {
        seconds--;
        countdownEl.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(countdownTimer);
            timerTextEl.style.display = 'none';
            resendBtnEl.style.display = 'inline-block';
        }
    }, 1000);
}

function resendOTP() {
    var btn = document.getElementById('otpResendBtn');
    if (!btn) return;

    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Mengirim...';

    // Fetch Odoo json endpoint
    fetch('/lupa-password/resend-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            params: {}
        })
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        btn.disabled = false;
        btn.textContent = originalText;
        
        var result = data.result || {};
        if (result.success) {
            var timerTextEl = document.getElementById('otp-timer-text');
            timerTextEl.innerHTML = '<span style="color: #10b981; font-weight: 600;"><i class="bi bi-check-circle-fill"></i> OTP dikirim ulang!</span>';
            timerTextEl.style.display = 'inline';
            btn.style.display = 'none';

            setTimeout(function() {
                timerTextEl.innerHTML = 'Kirim ulang kode dalam <strong id="otp-countdown">60</strong> detik';
                startOtpCountdown();
            }, 1500);
        } else {
            alert(result.message || 'Gagal mengirim ulang OTP.');
        }
    })
    .catch(function(err) {
        btn.disabled = false;
        btn.textContent = originalText;
        alert('Terjadi kesalahan jaringan.');
    });
}

// ============================================
// OTP DIGITS INPUT TRAVERSAL
// ============================================
function initOtpInputs() {
    var digits = document.querySelectorAll('.otp-digit');
    if (digits.length === 0) return;

    digits.forEach(function(input, index) {
        // Handle input numeric only
        input.addEventListener('input', function(e) {
            var val = input.value;
            input.value = val.replace(/[^0-9]/g, ''); // Hanya angka
            
            if (input.value && index < digits.length - 1) {
                digits[index + 1].focus();
            }
            combineOtp();
        });

        // Handle keyboard navigation (Backspace & Panah)
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace') {
                if (!input.value && index > 0) {
                    digits[index - 1].focus();
                    digits[index - 1].value = '';
                    combineOtp();
                }
            } else if (e.key === 'ArrowLeft' && index > 0) {
                digits[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < digits.length - 1) {
                digits[index + 1].focus();
            }
        });

        // Handle paste event (6 digit OTP)
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            var data = (e.clipboardData || window.clipboardData).getData('text').trim();
            if (/^\d{6}$/.test(data)) {
                for (var i = 0; i < digits.length; i++) {
                    digits[i].value = data[i];
                }
                digits[digits.length - 1].focus();
                combineOtp();
            }
        });
    });

    function combineOtp() {
        var code = '';
        digits.forEach(function(input) {
            code += input.value;
        });
        var hiddenInput = document.getElementById('otp_code');
        if (hiddenInput) {
            hiddenInput.value = code;
        }
    }
}

// ============================================
// INISIALISASI SAAT DOM SIAP
// ============================================
document.addEventListener('DOMContentLoaded', function () {

    // Tambah CSS spin animation secara inline
    var styleEl = document.createElement('style');
    styleEl.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(styleEl);

    // Tangani loading pada form email
    var fpForm = document.getElementById('fpForm');
    var fpSubmitBtn = document.getElementById('fpSubmitBtn');
    if (fpForm && fpSubmitBtn) {
        fpForm.addEventListener('submit', function (e) {
            var emailVal = document.getElementById('fp_email').value.trim();
            if (!emailVal) {
                e.preventDefault();
                return;
            }
            setLoading(fpSubmitBtn, true, 'Kirim Kode OTP');
        });
    }

    // Tangani loading pada form OTP
    var otpForm = document.getElementById('otpForm');
    var otpSubmitBtn = document.getElementById('otpSubmitBtn');
    if (otpForm && otpSubmitBtn) {
        otpForm.addEventListener('submit', function (e) {
            var otpVal = document.getElementById('otp_code').value.trim();
            if (otpVal.length !== 6) {
                e.preventDefault();
                // Tandai error merah pada semua digit box
                document.querySelectorAll('.otp-digit').forEach(function(input) {
                    input.classList.add('error');
                });
                return;
            }
            setLoading(otpSubmitBtn, true, 'Verifikasi OTP');
        });
    }

    // Tangani loading pada form Reset Password
    var resetForm = document.getElementById('resetForm');
    var resetSubmitBtn = document.getElementById('resetSubmitBtn');
    if (resetForm && resetSubmitBtn) {
        resetForm.addEventListener('submit', function (e) {
            var p1 = document.getElementById('new_password').value;
            var p2 = document.getElementById('confirm_password').value;
            if (p1 !== p2 || p1.length < 6) {
                e.preventDefault();
                alert('Kedua password tidak cocok atau kurang dari 6 karakter.');
                return;
            }
            setLoading(resetSubmitBtn, true, 'Simpan Password Baru');
        });
    }
});
