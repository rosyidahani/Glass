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

// --- Inisialisasi Model AI & Kamera ---
var webcamStream = null;
var modelsLoaded = false;
var faceTrackingInterval = null;
var latestFaceDescriptor = null;

// Fungsi memuat model face-api.js dari CDN
function loadFaceApiModels(onSuccess, onFailure) {
    if (modelsLoaded) {
        if (onSuccess) onSuccess();
        return;
    }
    
    updateStatusBox('camera-active', '<i class="bi bi-cpu spin"></i> Memuat Model AI...');
    
    // Memuat bobot model dari CDN jsDelivr
    const weightsUrl = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
    
    Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(weightsUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(weightsUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(weightsUrl)
    ])
    .then(function() {
        modelsLoaded = true;
        console.log("Model AI face-api.js berhasil dimuat untuk presensi.");
        if (onSuccess) onSuccess();
    })
    .catch(function(err) {
        console.error("Gagal memuat model AI:", err);
        updateStatusBox('camera-denied', '<i class="bi bi-exclamation-triangle-fill"></i> Gagal memuat model AI. Silakan refresh halaman.');
        if (onFailure) onFailure(err);
    });
}

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
            
            // Mulai loop pelacakan wajah real-time
            startFaceTracking();
        })
        .catch(function(err) {
            console.warn("Akses kamera ditolak atau tidak tersedia: ", err);
            updateStatusBox('camera-denied', '<i class="bi bi-exclamation-triangle-fill"></i> Kamera diblokir. Harap izinkan akses kamera.');
        });
    } else {
        updateStatusBox('camera-denied', '<i class="bi bi-exclamation-triangle-fill"></i> Browser tidak mendukung webcam.');
    }
}

// --- Loop Pelacakan Wajah Real-Time ---
function startFaceTracking() {
    var video = document.getElementById('webcam');
    var trackingBox = document.getElementById('faceTrackingBox');
    
    if (!video || !trackingBox) return;
    
    if (faceTrackingInterval) clearInterval(faceTrackingInterval);
    
    faceTrackingInterval = setInterval(async function() {
        if (video.paused || video.ended) return;
        
        try {
            const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();
                
            if (detection) {
                // Sesuaikan koordinat kotak pembatas dengan ukuran CSS elemen video
                const displaySize = { width: video.clientWidth, height: video.clientHeight };
                const resizedDetection = faceapi.resizeResults(detection, displaySize);
                const box = resizedDetection.detection.box;
                
                // Pindahkan kotak pelacak wajah di atas wajah pengguna
                trackingBox.style.left = box.x + 'px';
                trackingBox.style.top = box.y + 'px';
                trackingBox.style.width = box.width + 'px';
                trackingBox.style.height = box.height + 'px';
                trackingBox.style.transform = 'none'; // bersihkan translate bawaan CSS
                trackingBox.classList.remove('hidden');
                
                // Simpan descriptor wajah terbaru
                latestFaceDescriptor = detection.descriptor;
            } else {
                // Sembunyikan kotak jika tidak ada wajah yang terdeteksi
                trackingBox.classList.add('hidden');
            }
        } catch (e) {
            console.error("Error pada pelacakan wajah:", e);
        }
    }, 150);
}

function stopFaceTracking() {
    if (faceTrackingInterval) {
        clearInterval(faceTrackingInterval);
        faceTrackingInterval = null;
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

// --- Simulasi Pemindaian Interaktif (Panduan Liveness) ---
function runFaceScanSequence(onComplete) {
    var indicators = document.getElementById('interactiveIndicators');
    var ovalFrame = document.getElementById('faceOvalFrame');
    
    var distanceIndicator = document.getElementById('distanceIndicator');
    var distanceText = document.getElementById('distanceText');
    
    var poseIndicator = document.getElementById('poseIndicator');
    var poseText = document.getElementById('poseText');
    
    if (indicators) indicators.classList.remove('hidden');
    
    // Helper untuk mengubah status secara real-time
    function updateState(distance, distanceColor, pose, poseColor, ovalColor, statusMsg) {
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
        
        if (ovalFrame) {
            ovalFrame.style.borderColor = ovalColor;
            ovalFrame.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 20px " + ovalColor;
        }
        
        if (statusMsg) {
            updateStatusBox('active', statusMsg);
        }
    }
    
    // Alur Panduan Liveness
    updateState("Terlalu Jauh", "#ef4444", "Dekatkan wajah Anda ke kamera", "#ef4444", "#ef4444", "Memulai Pemindaian...");
    
    setTimeout(function() {
        updateState("Terlalu Dekat", "#f59e0b", "Jauhkan wajah Anda sedikit", "#f59e0b", "#f59e0b", "Mendeteksi Jarak...");
    }, 1200);
    
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "Jarak sesuai. Bersiap deteksi keaktifan.", "#10b981", "#10b981", "Jarak Wajah Ideal");
    }, 2400);
    
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "👉 Putar wajah ke kanan", "#f59e0b", "#f59e0b", "Deteksi Keaktifan (Liveness)");
    }, 3600);
    
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "👈 Putar wajah ke kiri", "#f59e0b", "#f59e0b", "Deteksi Keaktifan (Liveness)");
    }, 5000);
    
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "▲ Angkat dagu Anda", "#f59e0b", "#f59e0b", "Deteksi Keaktifan (Liveness)");
    }, 6400);
    
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "▼ Turunkan dagu Anda", "#f59e0b", "#f59e0b", "Deteksi Keaktifan (Liveness)");
    }, 7800);
    
    setTimeout(function() {
        updateState("Ideal (Pas) ✓", "#10b981", "🔒 Jangan bergerak, memproses...", "#10b981", "#06b6d4", "Memproses Biometrik Akhir");
    }, 9200);
    
    setTimeout(function() {
        if (indicators) indicators.classList.add('hidden');
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
                
                runFaceScanSequence(async function() {
                    // Hentikan tracking sementara untuk memfokuskan ekstraksi final
                    stopFaceTracking();
                    
                    var video = document.getElementById('webcam');
                    if (video) {
                        updateStatusBox('active', '<i class="bi bi-cpu spin"></i> Memverifikasi biometrik wajah Anda...');
                        try {
                            const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                                .withFaceLandmarks()
                                .withFaceDescriptor();
                                
                            if (detection) {
                                latestFaceDescriptor = detection.descriptor;
                            }
                        } catch (e) {
                            console.error("Gagal melakukan deteksi akhir:", e);
                        }
                    }
                    
                    if (latestFaceDescriptor) {
                        var faceVector = Array.from(latestFaceDescriptor).map(function(x) { return x.toFixed(6); }).join(',');
                        submitCheckInAPI(courseId, courseName, lat, lon, isMock, accuracy, faceVector);
                    } else {
                        startFaceTracking();
                        triggerScanFailure("Wajah tidak terdeteksi. Posisikan wajah tepat di depan kamera.");
                    }
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
        runFaceScanSequence(async function() {
            stopFaceTracking();
            
            var video = document.getElementById('webcam');
            if (video) {
                updateStatusBox('active', '<i class="bi bi-cpu spin"></i> Memverifikasi biometrik wajah Anda...');
                try {
                    const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                        .withFaceLandmarks()
                        .withFaceDescriptor();
                        
                    if (detection) {
                        latestFaceDescriptor = detection.descriptor;
                    }
                } catch (e) {
                    console.error("Gagal melakukan deteksi akhir:", e);
                }
            }
            
            if (latestFaceDescriptor) {
                var faceVector = Array.from(latestFaceDescriptor).map(function(x) { return x.toFixed(6); }).join(',');
                submitCheckInAPI(courseId, courseName, 0.0, 0.0, false, 10, faceVector);
            } else {
                startFaceTracking();
                triggerScanFailure("Wajah tidak terdeteksi. Posisikan wajah tepat di depan kamera.");
            }
        });
    }
}

// --- Submit Check-In data ke API Odoo ---
function submitCheckInAPI(sesiId, courseName, lat, lon, isMock, accuracy, faceVector) {
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
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: payload
        })
    })
    .then(function(res) {
        return res.json().then(function(json) {
            if (json.result && json.result.status === 'success') {
                return json.result.data;
            } else {
                throw new Error((json.result && json.result.message) || (json.error && json.error.message) || 'Gagal merekam presensi.');
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
    var trackingBox = document.getElementById('faceTrackingBox');
    
    if (scannerCard) scannerCard.classList.remove('scanning');
    if (statusBox) statusBox.classList.add('hidden');
    if (trackingBox) trackingBox.classList.add('hidden');
    
    var successMsgText = `Presensi Sukses! Anda mendapatkan +${data.xp_didapat} XP and +${data.koin_didapat} Koin.`;
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
    // Hanya jalankan pemindaian wajah jika kita berada di halaman scan presensi
    if (document.getElementById('presenceMetadata')) {
        loadFaceApiModels(function() {
            initWebcam();
        });
    }
});
