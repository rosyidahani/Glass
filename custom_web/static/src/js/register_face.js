// --- Inisialisasi Kamera ---
var webcamStream = null;

function initWebcam() {
    var video = document.getElementById('webcam');
    var fallback = document.getElementById('cameraFallback');
    
    if (!video) return;
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 800 }
            } 
        })
        .then(function(stream) {
            webcamStream = stream;
            video.srcObject = stream;
            video.classList.remove('hidden');
            if (fallback) {
                fallback.classList.add('hidden');
            }
            updateStatusBox('camera-active', '<i class="bi bi-camera-fill"></i> Kamera Siap. Hadapkan wajah ke kamera.');
        })
        .catch(function(err) {
            console.warn("Akses kamera ditolak atau tidak tersedia: ", err);
            updateStatusBox('camera-denied', '<i class="bi bi-exclamation-triangle-fill"></i> Kamera diblokir. Mode Simulasi Aktif.');
        });
    } else {
        updateStatusBox('camera-denied', '<i class="bi bi-exclamation-triangle-fill"></i> Browser tidak mendukung webcam.');
    }
}

// --- Memperbarui Box Status ---
function updateStatusBox(stateClass, htmlContent) {
    var statusBox = document.getElementById('scannerStatusBox');
    var statusMsg = document.getElementById('statusMessage');
    
    if (!statusBox || !statusMsg) return;
    
    statusBox.className = 'scanner-status-box';
    if (stateClass) {
        statusBox.classList.add(stateClass);
    }
    statusMsg.innerHTML = htmlContent;
}

// --- Menghasilkan Vektor Wajah Deterministik dari NIM ---
function generateDeterministicFaceVector(nim) {
    let vector = [];
    let hash = 0;
    for (let i = 0; i < nim.length; i++) {
        hash = (hash << 5) - hash + nim.charCodeAt(i);
        hash |= 0;
    }
    let seed = hash;
    for (let i = 0; i < 128; i++) {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        vector.push(((seed / 4294967296) * 2 - 1).toFixed(6));
    }
    return vector.join(',');
}

// --- Memulai Proses Pendaftaran Wajah ---
function startFaceRegistration() {
    var metadataEl = document.getElementById('registerMetadata');
    if (!metadataEl) return;
    
    var studentNim = metadataEl.getAttribute('data-student-nim');
    var btn = document.getElementById('btnMulaiRegistrasi');
    var scannerCard = document.getElementById('scannerCard');
    
    if (!btn || !scannerCard) return;
    
    btn.disabled = true;
    var btnText = btn.querySelector('.btn-text');
    var btnLoader = btn.querySelector('.btn-loader');
    
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    
    scannerCard.classList.add('scanning');
    updateStatusBox('active', '<i class="bi bi-person-bounding-box"></i> Memetakan titik biometrik wajah Anda...');
    
    // Simulasikan pemindaian selama 2.5 detik sebelum mengirim data
    setTimeout(function() {
        var faceVector = generateDeterministicFaceVector(studentNim);
        submitFaceRegistrationAPI(faceVector);
    }, 2500);
}

// --- Kirim Data ke API Odoo ---
function submitFaceRegistrationAPI(faceVector) {
    fetch('/api/mahasiswa/register-face', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            face_vector: faceVector
        })
    })
    .then(function(res) {
        return res.json().then(function(json) {
            if (res.ok && json.result && json.result.status === 'success') {
                return json.result;
            } else {
                throw new Error((json.result && json.result.message) || 'Gagal mendaftarkan wajah.');
            }
        });
    })
    .then(function(data) {
        triggerRegistrationSuccess();
    })
    .catch(function(err) {
        console.error(err);
        triggerRegistrationFailure(err.message);
    });
}

// --- Menangani Registrasi Sukses ---
function triggerRegistrationSuccess() {
    var scannerCard = document.getElementById('scannerCard');
    var successCheckmark = document.getElementById('successCheckmark');
    var btn = document.getElementById('btnMulaiRegistrasi');
    var statusBox = document.getElementById('scannerStatusBox');
    
    if (scannerCard) scannerCard.classList.remove('scanning');
    if (statusBox) statusBox.classList.add('hidden');
    
    if (successCheckmark) {
        successCheckmark.classList.remove('hidden');
    }
    
    if (btn) {
        btn.innerHTML = '<span class="text-green"><i class="bi bi-check-circle-fill"></i> Registrasi Berhasil!</span>';
        btn.disabled = true;
        btn.style.background = '#e6f4ea';
        btn.style.borderColor = '#34a853';
        btn.style.color = '#137333';
    }
    
    if (webcamStream) {
        webcamStream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
    
    // Redirect ke dashboard setelah 3 detik
    setTimeout(function() {
        window.location.href = '/dashboard/mahasiswa';
    }, 3000);
}

// --- Menangani Registrasi Gagal ---
function triggerRegistrationFailure(errorMessage) {
    var scannerCard = document.getElementById('scannerCard');
    var btn = document.getElementById('btnMulaiRegistrasi');
    
    if (scannerCard) scannerCard.classList.remove('scanning');
    
    updateStatusBox('camera-denied', `<i class="bi bi-x-circle-fill"></i> ${errorMessage}`);
    
    if (btn) {
        btn.disabled = false;
        var btnText = btn.querySelector('.btn-text');
        var btnLoader = btn.querySelector('.btn-loader');
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoader) btnLoader.classList.add('hidden');
        
        btn.style.background = '#fde8e8';
        btn.style.borderColor = '#f56565';
        btn.style.color = '#e53e3e';
        setTimeout(function() {
            btn.removeAttribute('style');
        }, 2000);
    }
}

// --- Inisialisasi Kamera saat DOM Siap ---
document.addEventListener('DOMContentLoaded', function() {
    initWebcam();
});
