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
    const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
    if (modelsLoaded) {
        if (onSuccess) onSuccess();
        return;
    }
    
    updateStatusBox('camera-active', '<i class="bi bi-cpu spin"></i> ' + (isEng ? 'Loading AI Models...' : 'Memuat Model AI...'));
    
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
        updateStatusBox('camera-denied', '<i class="bi bi-exclamation-triangle-fill"></i> ' + (isEng ? 'Failed to load AI models. Please refresh the page.' : 'Gagal memuat model AI. Silakan refresh halaman.'));
        if (onFailure) onFailure(err);
    });
}

function initWebcam() {
    const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
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
            updateStatusBox('camera-active', '<i class="bi bi-camera-fill"></i> ' + (isEng ? 'Camera Ready. Position your face.' : 'Kamera Siap. Posisikan wajah Anda.'));
            
            // Mulai loop pelacakan wajah real-time
            startFaceTracking();
        })
        .catch(function(err) {
            console.warn("Akses kamera ditolak atau tidak tersedia: ", err);
            updateStatusBox('camera-denied', '<i class="bi bi-exclamation-triangle-fill"></i> ' + (isEng ? 'Camera blocked. Please allow camera access.' : 'Kamera diblokir. Harap izinkan akses kamera.'));
        });
    } else {
        updateStatusBox('camera-denied', '<i class="bi bi-exclamation-triangle-fill"></i> ' + (isEng ? 'Browser does not support webcam.' : 'Browser tidak mendukung webcam.'));
    }
}

// --- Analisis Wajah (Jarak, Posisi Tengah, Pose Lurus) ---
function analyzeFace(detection, video) {
    const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
    if (!detection) return { ok: false, reason: isEng ? "Face not detected" : "Wajah tidak terdeteksi" };

    const box = detection.detection.box;
    const videoWidth = video.videoWidth || video.clientWidth || 640;
    const videoHeight = video.videoHeight || video.clientHeight || 480;

    // 1. Cek Jarak Wajah (Lebar Box dibanding Lebar Video)
    const boxWidthRatio = box.width / videoWidth;
    let distanceOk = true;
    let distanceMsg = isEng ? "Distance OK" : "Jarak Sesuai";
    let distanceStatus = "ok";
    if (boxWidthRatio < 0.28) {
        distanceOk = false;
        distanceMsg = isEng ? "Too Far, Move Closer" : "Terlalu Jauh, Mendekatlah";
        distanceStatus = "too-far";
    } else if (boxWidthRatio > 0.55) {
        distanceOk = false;
        distanceMsg = isEng ? "Too Close, Move Back" : "Terlalu Dekat, Menjauhlah";
        distanceStatus = "too-close";
    }

    // 2. Cek Posisi Tengah (Centeredness)
    const boxCenterX = box.x + box.width / 2;
    const boxCenterY = box.y + box.height / 2;
    const videoCenterX = videoWidth / 2;
    const videoCenterY = videoHeight / 2;
    const devX = Math.abs(boxCenterX - videoCenterX) / videoWidth;
    const devY = Math.abs(boxCenterY - videoCenterY) / videoHeight;
    let positionOk = true;
    let positionMsg = isEng ? "Centered" : "Posisi Tengah";
    if (devX > 0.12 || devY > 0.15) {
        positionOk = false;
        positionMsg = isEng ? "Center Your Face" : "Posisikan Wajah di Tengah";
    }

    // 3. Cek Pose (Menghadap Lurus) menggunakan Landmarks 68 titik
    let poseOk = true;
    let poseMsg = isEng ? "Pose OK" : "Menghadap Lurus";
    let ratio = 1.0;
    if (detection.landmarks) {
        const nose = detection.landmarks.getNose()[3]; // Ujung hidung
        const leftEye = detection.landmarks.getLeftEye()[0]; // Sudut luar mata kiri
        const rightEye = detection.landmarks.getRightEye()[3]; // Sudut luar mata kanan
        
        const distToLeft = Math.abs(nose.x - leftEye.x);
        const distToRight = Math.abs(nose.x - rightEye.x);
        ratio = distToLeft / distToRight;

        // Ratio ideal adalah ~1.0 jika lurus. Toleransi antara 0.65 - 1.5.
        if (ratio < 0.65 || ratio > 1.5) {
            poseOk = false;
            poseMsg = isEng ? "Face Straight Ahead" : "Hadapkan Wajah Lurus ke Depan";
        }
    }

    const ok = distanceOk && positionOk && poseOk;
    return {
        ok: ok,
        distanceOk: distanceOk,
        distanceMsg: distanceMsg,
        distanceStatus: distanceStatus,
        positionOk: positionOk,
        positionMsg: positionMsg,
        poseOk: poseOk,
        poseMsg: poseMsg,
        ratio: ratio
    };
}

// --- Perbarui Badge Indikator di Layar ---
function updateIndicators(analysis) {
    const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
    const distBadge = document.getElementById('distanceIndicator');
    const distText = document.getElementById('distanceText');
    const distIcon = document.getElementById('distanceIcon');
    const poseBadge = document.getElementById('poseIndicator');
    const poseText = document.getElementById('poseText');
    const poseIcon = document.getElementById('poseIcon');

    if (!analysis || (analysis.ok === false && analysis.reason === (isEng ? "Face not detected" : "Wajah tidak terdeteksi"))) {
        if (distBadge) {
            distBadge.style.background = 'rgba(15, 23, 42, 0.75)';
            if (distText) distText.innerText = isEng ? "Face Distance: Detecting..." : "Jarak Wajah: Mendeteksi...";
            if (distIcon) distIcon.className = "bi bi-arrows-expand";
        }
        if (poseBadge) {
            poseBadge.style.background = 'rgba(15, 23, 42, 0.75)';
            if (poseText) poseText.innerText = isEng ? "Instructions: Position Your Face" : "Petunjuk: Posisikan Wajah Anda";
            if (poseIcon) poseIcon.className = "bi bi-person-badge";
        }
        return;
    }

    // Update Jarak
    if (distBadge && distText) {
        if (analysis.distanceOk) {
            distBadge.style.background = 'rgba(34, 197, 94, 0.85)'; // Hijau
            distText.innerText = isEng ? "Face Distance: OK" : "Jarak Wajah: Sesuai";
            if (distIcon) distIcon.className = "bi bi-check-circle-fill";
        } else {
            distBadge.style.background = 'rgba(239, 68, 68, 0.85)'; // Merah
            distText.innerText = analysis.distanceMsg;
            if (distIcon) distIcon.className = "bi bi-exclamation-triangle-fill";
        }
    }

    // Update Pose & Posisi Tengah
    if (poseBadge && poseText) {
        if (analysis.positionOk && analysis.poseOk) {
            poseBadge.style.background = 'rgba(34, 197, 94, 0.85)'; // Hijau
            poseText.innerText = isEng ? "Position & Pose: OK" : "Posisi & Pose: Sesuai";
            if (poseIcon) poseIcon.className = "bi bi-check-circle-fill";
        } else {
            poseBadge.style.background = 'rgba(245, 158, 11, 0.85)'; // Jingga
            poseText.innerText = !analysis.positionOk ? analysis.positionMsg : analysis.poseMsg;
            if (poseIcon) poseIcon.className = "bi bi-person-badge-fill";
        }
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
            const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
                .withFaceLandmarks()
                .withFaceDescriptor();
                
            if (detection) {
                const displaySize = { width: video.clientWidth, height: video.clientHeight };
                const resizedDetection = faceapi.resizeResults(detection, displaySize);
                const box = resizedDetection.detection.box;
                
                // Mirror the X coordinate for the tracking box because the video feed is mirrored via CSS (scaleX(-1))
                const mirroredLeft = displaySize.width - box.x - box.width;
                
                trackingBox.style.left = mirroredLeft + 'px';
                trackingBox.style.top = box.y + 'px';
                trackingBox.style.width = box.width + 'px';
                trackingBox.style.height = box.height + 'px';
                trackingBox.style.transform = 'none';
                trackingBox.classList.remove('hidden');
                
                latestFaceDescriptor = detection.descriptor;
            } else {
                trackingBox.classList.add('hidden');
                latestFaceDescriptor = null;
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

// --- Memulihkan Gaya Tampilan Halaman ---
function restorePageStyle() {
    document.body.style.backgroundColor = '';
    document.body.style.transition = '';
    var video = document.getElementById('webcam');
    if (video) {
        video.style.filter = '';
        video.style.transition = '';
    }
}

// --- Proses Validasi Face ID & GPS Riil ---
function startPresenceSimulation() {
    latestFaceDescriptor = null; // Bersihkan cache data wajah sebelumnya
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
    
    async function proceedWithFaceCheck(lat, lon, isMock, accuracy) {
        const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
        latestFaceDescriptor = null; // Bersihkan cache data wajah sebelum pemindaian aktif
        updateStatusBox('active', '<i class="bi bi-cpu spin"></i> ' + (isEng ? 'Preparing camera...' : 'Menyiapkan kamera...'));
        
        var video = document.getElementById('webcam');
        if (!video) {
            triggerScanFailure(isEng ? "Camera not found." : "Kamera tidak ditemukan.");
            return;
        }

        stopFaceTracking(); // Hentikan pelacakan pasif

        // One-Shot Instant Scan: Naikkan kecerahan & gunakan kilatan layar putih untuk penerangan fisik
        video.style.transition = 'filter 0.3s ease';
        video.style.filter = 'brightness(1.4) contrast(1.2)';
        
        document.body.style.transition = 'background-color 0.2s ease';
        document.body.style.backgroundColor = '#ffffff'; // Kilatan putih penuh (Flash)

        updateStatusBox('active', `<i class="bi bi-person-video spin"></i> <strong>${isEng ? 'Face Scan' : 'Pemindaian Wajah'}</strong><br>${isEng ? 'Position your face in the center...' : 'Posisikan wajah Anda di tengah...'}`);

        let detectedDescriptor = null;
        let attempts = 0;
        const maxAttempts = 150; 
        let scanPassed = false;

        // Tunggu kilatan layar sebentar (150ms)
        await new Promise(resolve => setTimeout(resolve, 150));

        while (attempts < maxAttempts) {
            attempts++;
            try {
                const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                    
                if (detection) {
                    const analysis = analyzeFace(detection, video);
                    updateIndicators(analysis);
                    
                    if (analysis.ok) {
                        detectedDescriptor = detection.descriptor;
                        scanPassed = true;
                        break;
                    } else {
                        // Tampilkan pesan error spesifik agar pengguna tahu apa yang harus diperbaiki
                        let errorMsg = !analysis.distanceOk ? analysis.distanceMsg : (!analysis.positionOk ? analysis.positionMsg : analysis.poseMsg);
                        updateStatusBox('active', `<i class="bi bi-exclamation-circle-fill"></i> <strong>${isEng ? 'Adjust Position' : 'Sesuaikan Posisi'}</strong><br>${errorMsg}`);
                    }
                } else {
                    updateIndicators(null);
                    updateStatusBox('active', `<i class="bi bi-camera-fill"></i> ${isEng ? 'Face not detected. Position your face.' : 'Wajah tidak terdeteksi. Posisikan wajah Anda.'}`);
                }
            } catch (e) {
                console.error("Gagal mendeteksi wajah:", e);
            }
            await new Promise(resolve => setTimeout(resolve, 100)); // Scan setiap 100ms untuk kelancaran
        }

        restorePageStyle(); // Kembalikan warna layar

        if (detectedDescriptor && scanPassed) {
            const faceVectorJSON = JSON.stringify(Array.from(detectedDescriptor));
            updateStatusBox('active', `<i class="bi bi-cloud-arrow-up-fill spin"></i> ${isEng ? 'Sending verification data to server...' : 'Mengirim data verifikasi ke server...'}`);
            submitCheckInAPI(courseId, courseName, lat, lon, isMock, accuracy, faceVectorJSON);
        } else {
            scannerCard.classList.remove('scanning');
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoader) btnLoader.classList.add('hidden');
            btn.disabled = false;
            startFaceTracking();
            triggerScanFailure(isEng ? "Face Scan Failed: Unable to verify your face. Please try again." : "Pemindaian Wajah Gagal: Tidak dapat memverifikasi wajah Anda. Silakan coba kembali.");
        }
    }
    
    if (courseType === 'offline') {
        const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
        updateStatusBox('location-active', `<i class="bi bi-geo-alt-fill spin"></i> ${isEng ? 'Detecting your phone/browser GPS...' : 'Mendeteksi GPS Handphone/Browser Anda...'}`);
        
        if (!navigator.geolocation) {
            triggerScanFailure(isEng ? "GPS sensor is not supported by your browser." : "Sensor lokasi GPS tidak didukung oleh browser Anda.");
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                var accuracy = position.coords.accuracy;
                var isMock = position.coords.mocked || false;
                
                proceedWithFaceCheck(lat, lon, isMock, accuracy);
            },
            function(error) {
                console.error("GPS error:", error);
                var errorMsg = isEng ? "Failed to verify GPS location." : "Gagal memverifikasi lokasi GPS.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = isEng ? "Location access denied. Please enable location permissions in your browser." : "Akses lokasi ditolak. Harap aktifkan izin lokasi di browser Anda.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMsg = isEng ? "GPS signal unavailable." : "Sinyal GPS tidak tersedia.";
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
        proceedWithFaceCheck(0.0, 0.0, false, 10);
    }
}

// Fungsi menghitung rata-rata vektor wajah (128-dimensi)
function averageDescriptors(descriptors) {
    if (descriptors.length === 0) return null;
    const length = descriptors[0].length;
    const averaged = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        let sum = 0;
        for (let j = 0; j < descriptors.length; j++) {
            sum += descriptors[j][i];
        }
        averaged[i] = sum / descriptors.length;
    }
    return averaged;
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
                throw new Error((json.result && json.result.message) || (json.error && json.error.message) || (isEng ? 'Failed to record attendance.' : 'Gagal merekam presensi.'));
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
    const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
    var scannerCard = document.getElementById('scannerCard');
    var successCheckmark = document.getElementById('successCheckmark');
    var btn = document.getElementById('btnMulaiPresensi');
    var statusBox = document.getElementById('scannerStatusBox');
    var trackingBox = document.getElementById('faceTrackingBox');
    
    if (scannerCard) scannerCard.classList.remove('scanning');
    if (statusBox) statusBox.classList.add('hidden');
    if (trackingBox) trackingBox.classList.add('hidden');
    
    var successMsgText = "";
    if (data.status_kehadiran === 'terlambat') {
        successMsgText = isEng 
            ? `Attendance Successful! But you are late (getting +0 XP / +0 Coins). Keep up the spirit!`
            : `Presensi Sukses! Namun Anda terlambat (mendapatkan +0 XP / +0 Koin). Tetap semangat!`;
    } else {
        if (data.urutan_hadir === 1) {
            successMsgText = isEng
                ? `🎉 AMAZING! You are the First to Attend! Bonus +${data.xp_didapat} XP and +${data.koin_didapat} Coins received!`
                : `🎉 LUAR BIASA! Anda yang Pertama Hadir! Bonus +${data.xp_didapat} XP dan +${data.koin_didapat} Koin didapatkan!`;
        } else if (data.urutan_hadir === 2) {
            successMsgText = isEng
                ? `🎉 AMAZING! You are the Second to Attend! Bonus +${data.xp_didapat} XP and +${data.koin_didapat} Coins received!`
                : `🎉 LUAR BIASA! Anda yang Kedua Hadir! Bonus +${data.xp_didapat} XP dan +${data.koin_didapat} Koin didapatkan!`;
        } else if (data.urutan_hadir === 3) {
            successMsgText = isEng
                ? `🎉 AMAZING! You are the Third to Attend! Bonus +${data.xp_didapat} XP and +${data.koin_didapat} Coins received!`
                : `🎉 LUAR BIASA! Anda yang Ketiga Hadir! Bonus +${data.xp_didapat} XP dan +${data.koin_didapat} Koin didapatkan!`;
        } else {
            successMsgText = isEng
                ? `You have successfully recorded attendance`
                : `Anda berhasil melakukan presensi`;
        }
    }
    
    if (successCheckmark) {
        successCheckmark.classList.remove('hidden');
        var successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.innerText = successMsgText;
        }
    }
    
    if (btn) {
        btn.innerHTML = `<span class="text-green"><i class="bi bi-check-circle-fill"></i> ${isEng ? 'Attendance Successful!' : 'Presensi Berhasil!'}</span>`;
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
