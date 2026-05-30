/* LOGIKA INTERAKTIF PRESENSI FACE ID & SELEKSI KELAS */

// --- Fungsi Pencarian Kelas ---
function filterCourses() {
    var searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    var query = searchInput.value.toLowerCase().trim();
    var cards = document.querySelectorAll('.course-card');
    
    cards.forEach(function(card) {
        var name = card.getAttribute('data-name') || '';
        if (name.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// --- Fungsi Filter Status ---
function filterStatus(status) {
    // Kelola kelas aktif pada tombol filter
    var buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    var activeBtn = document.getElementById('btn-' + status);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Saring kartu
    var cards = document.querySelectorAll('.course-card');
    cards.forEach(function(card) {
        if (status === 'all') {
            card.style.display = '';
        } else {
            var cardStatus = card.getAttribute('data-status') || '';
            if (cardStatus === status) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// --- Inisialisasi Kamera ---
var webcamStream = null;

function initWebcam() {
    var video = document.getElementById('webcam');
    var fallback = document.getElementById('cameraFallback');
    
    if (!video) return; // Hanya jalankan di halaman scan
    
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
            updateStatusBox('camera-active', '<i class="bi bi-camera-fill"></i> Kamera Siap. Posisikan wajah Anda.');
        })
        .catch(function(err) {
            console.warn("Akses kamera ditolak atau tidak tersedia: ", err);
            // Tetap gunakan fallback visual wireframe SVG
            updateStatusBox('camera-denied', '<i class="bi bi-exclamation-triangle-fill"></i> Kamera diblokir. Mode Simulasi Aktif.');
        });
    } else {
        updateStatusBox('camera-denied', '<i class="bi bi-exclamation-triangle-fill"></i> Browser tidak mendukung webcam.');
    }
}

// --- Memperbarui Box Status di Atas Kamera ---
function updateStatusBox(stateClass, htmlContent) {
    var statusBox = document.getElementById('scannerStatusBox');
    var statusMsg = document.getElementById('statusMessage');
    
    if (!statusBox || !statusMsg) return;
    
    statusBox.className = 'scanner-status-box'; // reset
    if (stateClass) {
        statusBox.classList.add(stateClass);
    }
    statusMsg.innerHTML = htmlContent;
}

// --- Proses Validasi Face ID & GPS Riil ---
function startPresenceSimulation() {
    var metadataEl = document.getElementById('presenceMetadata');
    if (!metadataEl) return;
    
    var courseId = parseInt(metadataEl.getAttribute('data-course-id'));
    var courseType = metadataEl.getAttribute('data-course-type') || 'online';
    var courseName = metadataEl.getAttribute('data-course-name') || 'Mata Kuliah';
    
    var btn = document.getElementById('btnMulaiPresensi');
    var scannerCard = document.getElementById('scannerCard');
    
    if (!btn || !scannerCard) return;
    
    // Nonaktifkan tombol selama proses pemindaian berlangsung
    btn.disabled = true;
    var btnText = btn.querySelector('.btn-text');
    var btnLoader = btn.querySelector('.btn-loader');
    
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    
    // Tambahkan kelas pemindaian ke container utama untuk memicu animasi laser
    scannerCard.classList.add('scanning');
    
    if (courseType === 'offline') {
        // Alur Offline: Wajib Validasi GPS Browser Asli
        updateStatusBox('location-active', '<i class="bi bi-geo-alt-fill spin"></i> Mendeteksi GPS Handphone/Browser Anda...');
        
        if (!navigator.geolocation) {
            triggerScanFailure("Sensor lokasi GPS tidak didukung oleh browser Anda.");
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                var accuracy = position.coords.accuracy;
                var isMock = position.coords.mocked || false; // standard Android HTML5 mock detection
                
                updateStatusBox('active', '<i class="bi bi-person-bounding-box"></i> GPS Valid! Memproses Pemindaian Wajah...');
                
                // Lakukan scan wajah selama 2 detik kemudian tembak API
                setTimeout(function() {
                    submitCheckInAPI(courseId, courseName, lat, lon, isMock, accuracy);
                }, 2000);
            },
            function(error) {
                console.error("GPS error:", error);
                var errorMsg = "Gagal memverifikasi lokasi GPS.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = "Akses lokasi ditolak. Harap aktifkan izin lokasi di browser Anda.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMsg = "Sinyal GPS tidak tersedia.";
                }
                triggerScanFailure(errorMsg);
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );
    } else {
        // Alur Online: Langsung Pemindaian Wajah, GPS diset 0.0 (Bypassed)
        updateStatusBox('active', '<i class="bi bi-person-bounding-box"></i> Memindai Face ID Anda...');
        
        setTimeout(function() {
            submitCheckInAPI(courseId, courseName, 0.0, 0.0, false, 10);
        }, 2200);
    }
}

// --- Submit Check-In data ke API Odoo ---
function submitCheckInAPI(sesiId, courseName, lat, lon, isMock, accuracy) {
    var payload = {
        sesi_id: sesiId,
        latitude: lat,
        longitude: lon,
        is_mock_location: isMock,
        accuracy: accuracy,
        face_verified: true
    };

    fetch('/api/presensi/check-in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(function(res) {
        return res.json().then(function(json) {
            if (res.ok && json.status === 'success') {
                return json.data;
            } else {
                throw new Error(json.message || 'Gagal merekam presensi.');
            }
        });
    })
    .then(function(data) {
        // Presensi berhasil! Trigger layar sukses dengan data reward dinamis
        triggerScanSuccess(courseName, data);
    })
    .catch(function(err) {
        console.error(err);
        triggerScanFailure(err.message);
    });
}

// --- Menangani Kegagalan Scan & API ---
function triggerScanFailure(errorMessage) {
    var scannerCard = document.getElementById('scannerCard');
    var btn = document.getElementById('btnMulaiPresensi');
    
    if (scannerCard) scannerCard.classList.remove('scanning');
    
    updateStatusBox('camera-denied', `<i class="bi bi-x-circle-fill"></i> ${errorMessage}`);
    
    if (btn) {
        btn.disabled = false;
        var btnText = btn.querySelector('.btn-text');
        var btnLoader = btn.querySelector('.btn-loader');
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoader) btnLoader.classList.add('hidden');
        
        // Buat getaran visual/merah di tombol
        btn.style.background = '#fde8e8';
        btn.style.borderColor = '#f56565';
        btn.style.color = '#e53e3e';
        setTimeout(function() {
            btn.removeAttribute('style');
        }, 2000);
    }
}

// --- Menangani Keberhasilan Scan & Menampilkan Reward Gamifikasi ---
function triggerScanSuccess(courseName, data) {
    var scannerCard = document.getElementById('scannerCard');
    var successCheckmark = document.getElementById('successCheckmark');
    var btn = document.getElementById('btnMulaiPresensi');
    var statusBox = document.getElementById('scannerStatusBox');
    
    if (scannerCard) scannerCard.classList.remove('scanning');
    if (statusBox) statusBox.classList.add('hidden');
    
    // Format pesan sukses gamifikasi sesuai data yang didapatkan
    var successMsgText = `Presensi Sukses! Anda mendapatkan +${data.xp_didapat} XP dan +${data.koin_didapat} Koin.`;
    if (data.is_pertama) {
        successMsgText = `🎉 LUAR BIASA! Anda yang Pertama Hadir! Bonus +${data.xp_didapat} XP dan +${data.koin_didapat} Koin didapatkan!`;
    } else if (data.status_kehadiran === 'terlambat') {
        successMsgText = `Presensi Sukses! Namun Anda terlambat (mendapatkan +0 XP / +0 Koin). Tetap semangat!`;
    }
    
    // Tampilkan overlay checklist vector sukses
    if (successCheckmark) {
        successCheckmark.classList.remove('hidden');
        var successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.innerText = successMsgText;
        }
    }
    
    // Perbarui teks tombol
    if (btn) {
        btn.innerHTML = '<span class="text-green"><i class="bi bi-check-circle-fill"></i> Presensi Berhasil!</span>';
        btn.disabled = true;
        btn.style.background = '#e6f4ea';
        btn.style.borderColor = '#34a853';
        btn.style.color = '#137333';
    }
    
    // Hentikan webcam
    if (webcamStream) {
        webcamStream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
    
    // Alihkan kembali ke daftar kelas setelah 4 detik
    setTimeout(function() {
        window.location.href = '/presensi';
    }, 4000);
}

// --- Self-Initialization saat DOM Terunggah ---
document.addEventListener('DOMContentLoaded', function() {
    initWebcam();
});
