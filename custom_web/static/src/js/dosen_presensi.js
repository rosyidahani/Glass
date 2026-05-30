// --- Dosen Presensi Portal JS ---

document.addEventListener('DOMContentLoaded', function() {
    initFormDefaults();
    initTypeToggle();
    initLocationFetch();
    initFormSubmit();
    initTutupSesi();
});

// 1. Inisialisasi default form (Batas Waktu = Jam Sekarang + 1 Jam)
function initFormDefaults() {
    var inputBatas = document.getElementById('batas_waktu_telat');
    if (inputBatas && !inputBatas.value) {
        var now = new Date();
        now.setHours(now.getHours() + 1); // Tambah 1 jam dari sekarang
        
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, '0');
        var day = String(now.getDate()).padStart(2, '0');
        var hours = String(now.getHours()).padStart(2, '0');
        var minutes = String(now.getMinutes()).padStart(2, '0');
        
        inputBatas.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}

// 2. Logika Menyembunyikan/Memunculkan Form GPS (Online / Offline)
function initTypeToggle() {
    var radioOffline = document.getElementById('type_offline');
    var radioOnline = document.getElementById('type_online');
    var gpsContainer = document.getElementById('gps-fields-container');
    var latInput = document.getElementById('latitude');
    var lonInput = document.getElementById('longitude');
    var radiusInput = document.getElementById('radius_meter');

    if (!radioOffline || !radioOnline || !gpsContainer) return;

    function handleToggle() {
        if (radioOnline.checked) {
            gpsContainer.classList.add('hidden');
            latInput.removeAttribute('required');
            lonInput.removeAttribute('required');
            radiusInput.removeAttribute('required');
        } else {
            gpsContainer.classList.remove('hidden');
            latInput.setAttribute('required', 'required');
            lonInput.setAttribute('required', 'required');
            radiusInput.setAttribute('required', 'required');
        }
    }

    radioOffline.addEventListener('change', handleToggle);
    radioOnline.addEventListener('change', handleToggle);
    
    // Pemicu inisialisasi awal
    handleToggle();
}

// 3. Logika Mengambil Koordinat Geolocation Browser
function initLocationFetch() {
    var btnFetch = document.getElementById('btnDapatkanLokasi');
    var statusText = document.getElementById('gps-status');
    var latInput = document.getElementById('latitude');
    var lonInput = document.getElementById('longitude');

    if (!btnFetch || !statusText) return;

    btnFetch.addEventListener('click', function() {
        if (!navigator.geolocation) {
            statusText.innerHTML = '<span style="color: #ef4444;"><i class="bi bi-x-circle"></i> Browser Anda tidak mendukung sensor GPS.</span>';
            return;
        }

        statusText.innerHTML = '<span style="color: #3b82f6;"><i class="bi bi-arrow-repeat pulsing-icon"></i> Mengakses GPS... Harap izinkan.</span>';
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                
                // Masukkan ke input (dibulatkan ke 7 desimal agar presisi)
                latInput.value = parseFloat(lat.toFixed(7));
                lonInput.value = parseFloat(lon.toFixed(7));
                
                statusText.innerHTML = '<span style="color: #10b981;"><i class="bi bi-check-circle-fill"></i> Lokasi GPS berhasil didapatkan!</span>';
            },
            function(error) {
                console.error('GPS error:', error);
                var errorMsg = 'Gagal mendeteksi lokasi.';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = 'Izin akses lokasi ditolak oleh Anda.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMsg = 'Sinyal lokasi tidak tersedia.';
                }
                statusText.innerHTML = `<span style="color: #ef4444;"><i class="bi bi-exclamation-triangle-fill"></i> ${errorMsg}</span>`;
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );
    });
}

// 4. AJAX Submit Pembuatan Sesi Baru
function initFormSubmit() {
    var form = document.getElementById('formBukaSesi');
    var btnSubmit = document.getElementById('btnSubmitSesi');

    if (!form || !btnSubmit) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Siapkan loading feedback
        var originalBtnHTML = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="bi bi-arrow-repeat pulsing-icon"></i> Memproses Sesi...';

        // Ambil data form
        var namaSesi = document.getElementById('nama_sesi').value;
        var mataKuliah = document.getElementById('mata_kuliah').value;
        var tipeKelas = document.querySelector('input[name="tipe_kelas"]:checked').value;
        var datetimeVal = document.getElementById('batas_waktu_telat').value; // format: YYYY-MM-DDTHH:MM
        
        // Ubah format datetime ke YYYY-MM-DD HH:MM:00 untuk Odoo ORM
        var formatBatasTelat = datetimeVal.replace('T', ' ') + ':00';

        var payload = {
            nama_sesi: namaSesi,
            mata_kuliah: mataKuliah,
            tipe_kelas: tipeKelas,
            batas_waktu_telat: formatBatasTelat
        };

        if (tipeKelas === 'offline') {
            payload.latitude = parseFloat(document.getElementById('latitude').value);
            payload.longitude = parseFloat(document.getElementById('longitude').value);
            payload.radius_meter = parseInt(document.getElementById('radius_meter').value);
        }

        // Tembak API buka sesi
        fetch('/api/presensi/buka-sesi', {
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
                    throw new Error(json.message || 'Gagal membuka sesi.');
                }
            });
        })
        .then(function(data) {
            // Sukses: Refresh halaman agar sesi aktif tampil di kanan
            window.location.reload();
        })
        .catch(function(err) {
            console.error(err);
            alert('Kesalahan: ' + err.message);
            // Kembalikan tombol ke semula
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalBtnHTML;
        });
    });
}

// 5. AJAX Tutup Sesi Instan
function initTutupSesi() {
    var listContainer = document.getElementById('sesi-aktif-list');
    if (!listContainer) return;

    listContainer.addEventListener('click', function(e) {
        var btn = e.target.closest('.btn-tutup-sesi');
        if (!btn) return;

        var sesiId = btn.getAttribute('data-id');
        if (!sesiId) return;

        if (!confirm('Apakah Anda yakin ingin menutup sesi presensi ini? Mahasiswa tidak akan bisa melakukan presensi lagi.')) {
            return;
        }

        var originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat pulsing-icon"></i> Menutup...';

        fetch('/api/presensi/tutup-sesi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sesi_id: parseInt(sesiId) })
        })
        .then(function(res) {
            return res.json().then(function(json) {
                if (res.ok && json.status === 'success') {
                    return json.data;
                } else {
                    throw new Error(json.message || 'Gagal menutup sesi.');
                }
            });
        })
        .then(function(data) {
            // Sukses: Refresh halaman agar sesi berpindah ke riwayat tabel bawah
            window.location.reload();
        })
        .catch(function(err) {
            console.error(err);
            alert('Kesalahan: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        });
    });
}
