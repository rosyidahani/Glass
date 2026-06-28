// --- Dosen Presensi Portal JS ---

document.addEventListener('DOMContentLoaded', function() {
    initFormDefaults();
    initTypeToggle();
    initLocationFetch();
    initAutocompleteSelect();
    initFormSubmit();
    initTutupSesi();
    initRiwayatTable();
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
        var mataKuliahId = document.getElementById('mata_kuliah_id').value;
        var tipeKelas = document.querySelector('input[name="tipe_kelas"]:checked').value;
        var datetimeVal = document.getElementById('batas_waktu_telat').value; // format: YYYY-MM-DDTHH:MM
        
        // Ubah format datetime ke YYYY-MM-DD HH:MM:00 untuk Odoo ORM
        var formatBatasTelat = datetimeVal.replace('T', ' ') + ':00';

        var payload = {
            nama_sesi: namaSesi,
            mata_kuliah_id: parseInt(mataKuliahId),
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
                    throw new Error((json.result && json.result.message) || (json.error && json.error.message) || 'Gagal membuka sesi.');
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
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: { sesi_id: parseInt(sesiId) }
            })
        })
        .then(function(res) {
            return res.json().then(function(json) {
                if (json.result && json.result.status === 'success') {
                    return json.result.data;
                } else {
                    throw new Error((json.result && json.result.message) || (json.error && json.error.message) || 'Gagal menutup sesi.');
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

// 6. Logika Autocomplete Dropdown untuk Mata Kuliah
function initAutocompleteSelect() {
    var triggerBtn = document.getElementById('mata_kuliah_btn');
    var selectedText = document.getElementById('selected_course_text');
    var idInput = document.getElementById('mata_kuliah_id');
    var dropdownPane = document.getElementById('mata_kuliah_dropdown');
    var searchInput = document.getElementById('mata_kuliah_search');
    
    if (!triggerBtn || !selectedText || !idInput || !dropdownPane || !searchInput) return;
    
    var items = dropdownPane.getElementsByClassName('dropdown-option-item');
    
    // Toggle dropdown pane
    triggerBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var isHidden = dropdownPane.classList.contains('hidden');
        if (isHidden) {
            dropdownPane.classList.remove('hidden');
            triggerBtn.classList.add('active');
            searchInput.focus();
        } else {
            dropdownPane.classList.add('hidden');
            triggerBtn.classList.remove('active');
        }
    });
    
    // Search filter logic (triggers on typing >= 2 characters)
    searchInput.addEventListener('input', function() {
        var query = searchInput.value.trim().toLowerCase();
        
        // Jika input kurang dari 2 karakter, tampilkan semua mata kuliah
        if (query.length < 2) {
            for (var i = 0; i < items.length; i++) {
                items[i].style.display = 'block';
            }
            return;
        }
        
        // Filter mata kuliah
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var name = item.getAttribute('data-name').toLowerCase();
            var code = item.getAttribute('data-code').toLowerCase();
            
            if (name.includes(query) || code.includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        }
    });
    
    // Tangani pemilihan item dropdown
    dropdownPane.addEventListener('click', function(e) {
        var item = e.target.closest('.dropdown-option-item');
        if (!item) return;
        
        var id = item.getAttribute('data-id');
        var name = item.getAttribute('data-name');
        var code = item.getAttribute('data-code');
        
        // Update tampilan pilihan
        selectedText.textContent = `${code} - ${name}`;
        selectedText.style.color = '#0f172a'; // Beri warna gelap agar kontras
        idInput.value = id;
        
        // Tutup dropdown
        dropdownPane.classList.add('hidden');
        triggerBtn.classList.remove('active');
        
        // Bersihkan kotak pencarian
        searchInput.value = '';
        for (var i = 0; i < items.length; i++) {
            items[i].style.display = 'block';
        }
    });
    
    // Sembunyikan dropdown jika mengklik di luar area input/dropdown
    document.addEventListener('click', function(e) {
        if (!triggerBtn.contains(e.target) && !dropdownPane.contains(e.target)) {
            dropdownPane.classList.add('hidden');
            triggerBtn.classList.remove('active');
        }
    });
}

// 7. Logika Sorting Tabel & Interaktivitas Baris Riwayat
function initRiwayatTable() {
    var table = document.querySelector('.modern-table');
    if (!table) return;

    var headers = table.querySelectorAll('thead th');
    var tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Tambahkan class & pointer cursor ke header agar terkesan bisa diklik
    headers.forEach(function(header, colIndex) {
        header.style.cursor = 'pointer';
        header.classList.add('sortable-header');
        
        // Simpan konten teks asli untuk menghindari penggandaan icon
        var originalText = header.childNodes[0].textContent.trim();
        header.innerHTML = originalText + ' <i class="bi bi-arrow-down-up sort-indicator" style="font-size: 0.8rem; opacity: 0.5; margin-left: 5px;"></i>';

        var asc = true;
        header.addEventListener('click', function() {
            // Reset icon headers lain
            headers.forEach(function(h) {
                if (h !== header) {
                    var indicator = h.querySelector('.sort-indicator');
                    if (indicator) {
                        indicator.className = 'bi bi-arrow-down-up sort-indicator';
                        indicator.style.opacity = '0.5';
                    }
                }
            });

            // Update icon header ini
            var indicator = header.querySelector('.sort-indicator');
            if (indicator) {
                indicator.className = asc ? 'bi bi-arrow-up sort-indicator' : 'bi bi-arrow-down sort-indicator';
                indicator.style.opacity = '1';
            }

            var rows = Array.from(tbody.querySelectorAll('tr'));
            if (rows.length === 1 && rows[0].classList.contains('row-empty')) return;

            rows.sort(function(rowA, rowB) {
                var cellA = rowA.cells[colIndex].textContent.trim();
                var cellB = rowB.cells[colIndex].textContent.trim();

                // Cek jika numeric (misal total hadir "12 Mhs" atau "+5 Koin")
                var numA = parseFloat(cellA.replace(/[^0-9.-]/g, ''));
                var numB = parseFloat(cellB.replace(/[^0-9.-]/g, ''));

                if (!isNaN(numA) && !isNaN(numB)) {
                    return asc ? numA - numB : numB - numA;
                }

                return asc ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
            });

            // Re-append sorted rows
            rows.forEach(function(row) {
                tbody.appendChild(row);
            });

            asc = !asc; // toggle sort direction
        });
    });

    // Klik pada baris tabel pergi ke detail
    var rows = tbody.querySelectorAll('tr');
    rows.forEach(function(row) {
        if (row.classList.contains('row-empty')) return;
        
        // Hanya baris di tabel riwayat utama yang punya data-id yang bisa diklik pergi ke detail
        var sesiId = row.getAttribute('data-id');
        if (sesiId) {
            row.style.cursor = 'pointer';
            row.classList.add('clickable-row');

            row.addEventListener('click', function(e) {
                window.location.href = '/dosen/presensi/histori/detail/' + sesiId;
            });
        }
    });
}
