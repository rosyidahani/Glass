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
        console.log("Model AI face-api.js berhasil dimuat.");
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
            video.srcObject = stream;
            video.classList.remove('hidden');
            if (fallback) {
                fallback.classList.add('hidden');
            }
            updateStatusBox('camera-active', '<i class="bi bi-camera-fill"></i> Kamera Siap. Posisikan wajah Anda.');
            
            // Tampilkan indikator interaktif
            var indicators = document.getElementById('interactiveIndicators');
            if (indicators) indicators.classList.remove('hidden');
            
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

// --- Analisis Wajah (Jarak, Posisi Tengah, Pose Lurus) ---
function analyzeFace(detection, video, minRatio = 0.65, maxRatio = 1.5, phaseName = "Hadap Lurus") {
    if (!detection) return { ok: false, reason: "Wajah tidak terdeteksi" };

    const box = detection.detection.box;
    const videoWidth = video.videoWidth || video.clientWidth || 640;
    const videoHeight = video.videoHeight || video.clientHeight || 480;

    // 1. Cek Jarak Wajah (Lebar Box dibanding Lebar Video)
    const boxWidthRatio = box.width / videoWidth;
    let distanceOk = true;
    let distanceMsg = "Jarak Sesuai";
    let distanceStatus = "ok";
    if (boxWidthRatio < 0.28) {
        distanceOk = false;
        distanceMsg = "Terlalu Jauh, Mendekatlah";
        distanceStatus = "too-far";
    } else if (boxWidthRatio > 0.55) {
        distanceOk = false;
        distanceMsg = "Terlalu Dekat, Menjauhlah";
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
    let positionMsg = "Posisi Tengah";
    if (devX > 0.12 || devY > 0.15) {
        positionOk = false;
        positionMsg = "Posisikan Wajah di Tengah";
    }

    // 3. Cek Pose berdasarkan fase (Tengok Kiri / Kanan disesuaikan dengan arah cermin)
    let poseOk = true;
    let poseMsg = "Pose Sesuai";
    let ratio = 1.0;
    if (detection.landmarks) {
        const nose = detection.landmarks.getNose()[3]; // Ujung hidung
        const leftEye = detection.landmarks.getLeftEye()[0]; // Sudut luar mata kiri
        const rightEye = detection.landmarks.getRightEye()[3]; // Sudut luar mata kanan
        
        const distToLeft = Math.abs(nose.x - leftEye.x);
        const distToRight = Math.abs(nose.x - rightEye.x);
        ratio = distToLeft / distToRight;

        // Cek apakah rasio memenuhi kriteria fase saat ini
        if (ratio < minRatio || ratio > maxRatio) {
            poseOk = false;
            if (phaseName === "Hadap Lurus") {
                poseMsg = "Hadapkan Wajah Lurus ke Depan";
            } else if (phaseName === "Tengok Kiri") {
                poseMsg = "Tengokkan Kepala ke KANAN";
            } else if (phaseName === "Tengok Kanan") {
                poseMsg = "Tengokkan Kepala ke KIRI";
            }
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
    const distBadge = document.getElementById('distanceIndicator');
    const distText = document.getElementById('distanceText');
    const distIcon = document.getElementById('distanceIcon');
    const poseBadge = document.getElementById('poseIndicator');
    const poseText = document.getElementById('poseText');
    const poseIcon = document.getElementById('poseIcon');

    if (!analysis || (analysis.ok === false && analysis.reason === "Wajah tidak terdeteksi")) {
        if (distBadge) {
            distBadge.style.background = 'rgba(15, 23, 42, 0.75)';
            if (distText) distText.innerText = "Jarak Wajah: Mendeteksi...";
            if (distIcon) distIcon.className = "bi bi-arrows-expand";
        }
        if (poseBadge) {
            poseBadge.style.background = 'rgba(15, 23, 42, 0.75)';
            if (poseText) poseText.innerText = "Petunjuk: Posisikan Wajah Anda";
            if (poseIcon) poseIcon.className = "bi bi-person-badge";
        }
        return;
    }

    // Update Jarak
    if (distBadge && distText) {
        if (analysis.distanceOk) {
            distBadge.style.background = 'rgba(34, 197, 94, 0.85)'; // Hijau
            distText.innerText = "Jarak Wajah: Sesuai";
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
            poseText.innerText = "Posisi & Pose: Sesuai";
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

                // Jalankan analisis dan tampilkan petunjuk real-time
                const analysis = analyzeFace(detection, video);
                updateIndicators(analysis);
            } else {
                trackingBox.classList.add('hidden');
                latestFaceDescriptor = null;
                updateIndicators(null);
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

// --- Memulai Proses Pendaftaran Wajah Multi-Angle ---
async function startFaceRegistration() {
    var btn = document.getElementById('btnMulaiRegistrasi');
    var scannerCard = document.getElementById('scannerCard');
    
    if (!btn || !scannerCard) return;
    
    btn.disabled = true;
    var btnText = btn.querySelector('.btn-text');
    var btnLoader = btn.querySelector('.btn-loader');
    
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
    
    scannerCard.classList.add('scanning');
    
    var video = document.getElementById('webcam');
    if (!video) {
        triggerRegistrationFailure("Kamera tidak ditemukan.");
        return;
    }

    stopFaceTracking(); // Matikan tracking biasa
    
    // 1. Brightness meningkat maksimal pada tangkapan kamera
    video.style.transition = 'filter 0.5s ease';
    video.style.filter = 'brightness(1.4) contrast(1.2)';
    
    // Siapkan transisi warna background body
    document.body.style.transition = 'background-color 0.8s ease';
    
    // Tiga fase registrasi: Depan (Red), Kiri (Green), Kanan (Blue)
    // Catatan: Karena kamera depan bersifat mirror (cermin), petunjuk teks di-reverse
    const phases = [
        { name: "Hadap Lurus", color: "#ef4444", required: 5, minRatio: 0.8, maxRatio: 1.25, instruction: "Hadapkan wajah LURUS ke depan kamera..." },
        { name: "Tengok Kiri", color: "#22c55e", required: 3, minRatio: 0.0, maxRatio: 0.75, instruction: "Tengokkan kepala Anda sedikit ke KANAN..." },
        { name: "Tengok Kanan", color: "#3b82f6", required: 3, minRatio: 1.35, maxRatio: 99.0, instruction: "Tengokkan kepala Anda sedikit ke KIRI..." }
    ];
    
    let phaseIndex = 0;
    let phaseDescriptors = [];
    let allPhasesData = []; // Menyimpan hasil rata-rata dari ketiga sudut wajah
    
    let attempts = 0;
    const maxAttemptsPerPhase = 35;
    
    while (phaseIndex < phases.length) {
        const currentPhase = phases[phaseIndex];
        phaseDescriptors = [];
        attempts = 0;
        
        // 2. Ubah warna background halaman sesuai fase (RGB)
        document.body.style.backgroundColor = currentPhase.color;
        
        updateStatusBox('active', `<i class="bi bi-person-video spin"></i> <strong>Langkah ${phaseIndex + 1}/3: ${currentPhase.name}</strong><br>${currentPhase.instruction}`);
        
        while (phaseDescriptors.length < currentPhase.required && attempts < maxAttemptsPerPhase) {
            attempts++;
            try {
                const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                    
                if (detection) {
                    const analysis = analyzeFace(detection, video, currentPhase.minRatio, currentPhase.maxRatio, currentPhase.name);
                    updateIndicators(analysis);

                    if (analysis.distanceOk && analysis.positionOk) {
                        // Evaluasi rasio yaw/pose sudut wajah
                        const poseMatch = analysis.ratio >= currentPhase.minRatio && analysis.ratio <= currentPhase.maxRatio;
                        
                        if (poseMatch) {
                            phaseDescriptors.push(detection.descriptor);
                            var progress = Math.round((phaseDescriptors.length / currentPhase.required) * 100);
                            updateStatusBox('active', `<i class="bi bi-cpu spin"></i> Memindai ${currentPhase.name}: ${phaseDescriptors.length}/${currentPhase.required} (${progress}%)`);
                        } else {
                            updateStatusBox('active', `<i class="bi bi-exclamation-circle-fill"></i> ${currentPhase.instruction}`);
                        }
                    } else {
                        let errorMsg = !analysis.distanceOk ? analysis.distanceMsg : analysis.positionMsg;
                        updateStatusBox('active', `<i class="bi bi-exclamation-circle-fill"></i> ${errorMsg}`);
                    }
                } else {
                    updateIndicators(null);
                    updateStatusBox('active', '<i class="bi bi-camera-fill"></i> Wajah tidak terdeteksi. Posisikan wajah Anda.');
                }
            } catch (e) {
                console.error("Gagal memindai frame pada fase " + currentPhase.name, e);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (phaseDescriptors.length === currentPhase.required) {
            const avgDesc = averageDescriptors(phaseDescriptors);
            allPhasesData.push(Array.from(avgDesc));
            phaseIndex++;
            
            updateStatusBox('active', `<i class="bi bi-check-circle-fill"></i> Sudut ${currentPhase.name} berhasil direkam! Bersiap langkah berikutnya...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
            // Gagal menyelesaikan salah satu fase registrasi
            restorePageStyle();
            scannerCard.classList.remove('scanning');
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoader) btnLoader.classList.add('hidden');
            btn.disabled = false;
            startFaceTracking();
            updateStatusBox('camera-denied', `<i class="bi bi-x-circle-fill"></i> Registrasi gagal pada langkah ${currentPhase.name}. Harap ikuti petunjuk gerakan kepala dengan jelas.`);
            return;
        }
    }
    
    // Kembalikan gaya tampilan ke semula
    restorePageStyle();
    
    // Enkripsi dan simpan ketiga sudut wajah ke database Odoo
    const faceVectorJSON = JSON.stringify(allPhasesData);
    submitFaceRegistrationAPI(faceVectorJSON);
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

// --- Kirim Data ke API Odoo ---
function submitFaceRegistrationAPI(faceVector) {
    fetch('/api/mahasiswa/register-face', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
                face_vector: faceVector
            }
        })
    })
    .then(function(res) {
        return res.json().then(function(json) {
            if (json.result && json.result.status === 'success') {
                return json.result;
            } else {
                throw new Error((json.result && json.result.message) || (json.error && json.error.message) || 'Gagal mendaftarkan wajah.');
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
    var trackingBox = document.getElementById('faceTrackingBox');
    
    if (scannerCard) scannerCard.classList.remove('scanning');
    if (statusBox) statusBox.classList.add('hidden');
    if (trackingBox) trackingBox.classList.add('hidden');
    
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
    loadFaceApiModels(function() {
        initWebcam();
    });
});
