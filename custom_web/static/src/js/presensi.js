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
    var buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    var activeBtn = document.getElementById('btn-' + status);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
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
            updateStatusBox('camera-active', '<i class="bi bi-camera-fill"></i> Kamera Siap. Posisikan wajah Anda.');
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

// --- Simulasi Pemindaian Interaktif (Liveness, Jarak, Tracking, Warna) ---
function runFaceScanSequence(onComplete) {
    var indicators = document.getElementById('interactiveIndicators');
    var trackingBox = document.getElementById('faceTrackingBox');
    var ovalFrame = document.getElementById('faceOvalFrame');
    
    var distanceIndicator = document.getElementById('distanceIndicator');
    var distanceText = document.getElementById('distanceText');
    
    var poseIndicator = document.getElementById('poseIndicator');
    var poseText = document.getElementById('poseText');
    
    if (indicators) indicators.classList.remove('hidden');
    if (trackingBox) trackingBox.classList.remove('hidden');
    
    // Helper untuk mengubah status secara real-time
    function updateState(distance, distanceColor, pose, poseColor, boxWidth, boxHeight, boxLeft, boxTop, ovalColor, statusMsg) {
        if (distanceText) distanceText.innerHTML = "Jarak Wajah: " + distance;
        if (distanceIndicator) {
            distanceIndicator.style.borderColor = distanceColor;
            distanceIndicator.style.color = distanceColor;
        }
        
        if (poseText) poseText.innerHTML = "Petunjuk: " + pose;
        if (poseIndicator) {
            poseIndicator.style.borderColor = poseColor;
            poseIndicator.style.color = poseColor;
        }
        
        if (trackingBox) {
            trackingBox.style.width = boxWidth + "px";
            trackingBox.style.height = boxHeight + "px";
            trackingBox.style.left = boxLeft;
            trackingBox.style.top = boxTop;
            trackingBox.style.borderColor = ovalColor;
            var corners = trackingBox.querySelectorAll('div');
            corners.forEach(function(c) {
                c.style.borderColor = ovalColor;
            });
        }
        
        if (ovalFrame) {
            ovalFrame.style.borderColor = ovalColor;
            ovalFrame.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 20px " + ovalColor;
        }
        
        if (statusMsg) {
            updateStatusBox('active', statusMsg);
        }
    }
    
    // Alur Simulasi
    // 1. Deteksi Awal - Terlalu Jauh (Merah)
    updateState("Terlalu Jauh", "#ef4444", "Dekatkan wajah Anda ke kamera", "#ef4444", 80, 80, "50%", "50%", "#ef4444", "Memulai Pemindaian...");
    
    // 2. Terlalu Dekat (Kuning/Oranye) - setelah 1.2 detik
    setTimeout(function() {
        updateState("Terlalu Dekat", "#f59e0b", "Jauhkan wajah Anda sedikit", "#f59e0b", 160, 160, "50%", "50%", "#f59e0b", "Mendeteksi Jarak...");
    }, 1200);
    
    // 3. Jarak Ideal (Hijau) - setelah 2.4 detik
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "Jarak sesuai. Bersiap deteksi keaktifan.", "#10b981", 120, 120, "50%", "50%", "#10b981", "Jarak Wajah Ideal");
    }, 2400);
    
    // 4. Liveness - Putar Kanan (Oranye) - setelah 3.6 detik
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "👉 Putar wajah ke kanan", "#f59e0b", 120, 120, "55%", "50%", "#f59e0b", "Deteksi Keaktifan (Liveness)");
    }, 3600);
    
    // 5. Liveness - Putar Kiri (Oranye) - setelah 5.0 detik
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "👈 Putar wajah ke kiri", "#f59e0b", 120, 120, "45%", "50%", "#f59e0b", "Deteksi Keaktifan (Liveness)");
    }, 5000);
    
    // 6. Liveness - Angkat Dagu (Oranye) - setelah 6.4 detik
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "▲ Angkat dagu Anda", "#f59e0b", 120, 120, "50%", "45%", "#f59e0b", "Deteksi Keaktifan (Liveness)");
    }, 6400);
    
    // 7. Liveness - Turunkan Dagu (Oranye) - setelah 7.8 detik
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "▼ Turunkan dagu Anda", "#f59e0b", 120, 120, "50%", "55%", "#f59e0b", "Deteksi Keaktifan (Liveness)");
    }, 7800);
    
    // 8. Finalizing - Jangan Bergerak (Cyan) - setelah 9.2 detik
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "🔒 Jangan bergerak, memproses...", "#10b981", 120, 120, "50%", "50%", "#06b6d4", "Memproses Biometrik Akhir");
    }, 9200);
    
    // 9. Selesai - setelah 10.5 detik
    setTimeout(function() {
        if (indicators) indicators.classList.add('hidden');
        if (trackingBox) trackingBox.classList.add('hidden');
        onComplete();
    }, 10500);
}

// --- Proses Validasi Face ID & GPS Riil ---
function startPresenceSimulation() {
    var metadataEl = document.getElementById('presenceMetadata');
    if (!metadataEl) return;
    
    var courseId = parseInt(metadataEl.getAttribute('data-course-id'));
    var courseType = metadataEl.getAttribute('data-course-type') || 'online';
    var courseName = metadataEl.getAttribute('data-course-name') || 'Mata Kuliah';
    var studentNim = metadataEl.getAttribute('data-student-nim') || '';
    
    var btn = document.getElementById('btnMulaiPresensi');
    var scannerCard = document.getElementById('scannerCard');
    
    if (!btn || !scannerCard) return;
    
    btn.disabled = true;
    var btnText = btn.querySelector('.btn-text');
    var btnLoader = btn.querySelector('.btn-loader');
    
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    
    scannerCard.classList.add('scanning');
    
    if (courseType === 'offline') {
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
                var isMock = position.coords.mocked || false;
                
                updateStatusBox('active', '<i class="bi bi-person-bounding-box"></i> GPS Valid! Memproses Pemindaian Wajah...');
                
                runFaceScanSequence(function() {
                    submitCheckInAPI(courseId, courseName, lat, lon, isMock, accuracy, studentNim);
                });
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
        runFaceScanSequence(function() {
            submitCheckInAPI(courseId, courseName, 0.0, 0.0, false, 10, studentNim);
        });
    }
}

// --- Submit Check-In data ke API Odoo ---
function submitCheckInAPI(sesiId, courseName, lat, lon, isMock, accuracy, studentNim) {
    var faceVector = generateDeterministicFaceVector(studentNim);
    var payload = {
        sesi_id: sesiId,
        latitude: lat,
        longitude: lon,
        is_mock_location: isMock,
        accuracy: accuracy,
        face_verified: true,
        face_descriptor: faceVector
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
    
    var successMsgText = `Presensi Sukses! Anda mendapatkan +${data.xp_didapat} XP dan +${data.koin_didapat} Koin.`;
    if (data.is_pertama) {
        successMsgText = `🎉 LUAR BIASA! Anda yang Pertama Hadir! Bonus +${data.xp_didapat} XP dan +${data.koin_didapat} Koin didapatkan!`;
    } else if (data.status_kehadiran === 'terlambat') {
        successMsgText = `Presensi Sukses! Namun Anda terlambat (mendapatkan +0 XP / +0 Koin). Tetap semangat!`;
    }
    
    if (successCheckmark) {
        successCheckmark.classList.remove('hidden');
        var successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.innerText = successMsgText;
        }
    }
    
    if (btn) {
        btn.innerHTML = '<span class="text-green"><i class="bi bi-check-circle-fill"></i> Presensi Berhasil!</span>';
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
    
    setTimeout(function() {
        window.location.href = '/presensi';
    }, 4000);
}

// --- Self-Initialization saat DOM Terunggah ---
document.addEventListener('DOMContentLoaded', function() {
    initWebcam();
});
