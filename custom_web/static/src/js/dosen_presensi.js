// --- Dosen Presensi Portal JS ---

document.addEventListener('DOMContentLoaded', function() {
    initFormDefaults();
    initTypeToggle();
    initLocationFetch();
    initAutocompleteSelect();
    initFormSubmit();
    initTutupSesi();
    initRiwayatTable();
    moveDrawersToBody();
    initActiveSessionDrawer();
    initAktifDetailTabs();
    initClickableSessionCards();
    initPresensiManualGlobal();
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
            // Sukses: Tampilkan Pop Up Sukses dan alihkan ke Halaman Portal Presensi
            var successModal = document.getElementById('successModal');
            var btnModalClose = document.getElementById('btnModalClose');
            
            if (successModal) {
                successModal.classList.add('show');
                
                // Redirect otomatis setelah 2.5 detik
                var redirectTimeout = setTimeout(function() {
                    window.location.href = '/dosen/presensi';
                }, 2500);
                
                // Redirect instan jika tombol diklik
                if (btnModalClose) {
                    btnModalClose.addEventListener('click', function() {
                        clearTimeout(redirectTimeout);
                        window.location.href = '/dosen/presensi';
                    });
                }
            } else {
                // Fallback jika modal HTML tidak ter-render
                window.location.href = '/dosen/presensi';
            }
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

// 5. AJAX Tutup Sesi Instan — global delegation agar bekerja di semua halaman
function initTutupSesi() {
    // Gunakan document-level delegation agar tombol pada halaman detail aktif juga terdeteksi
    document.addEventListener('click', function(e) {
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
            // Sukses: jika di halaman detail aktif, kembali ke menu presensi
            if (window.location.pathname.indexOf('/dosen/presensi/aktif/') !== -1) {
                window.location.href = '/dosen/presensi';
            } else {
                window.location.reload();
            }
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

// Helper: pindahkan semua drawer ke document.body agar position:fixed benar
function moveDrawersToBody() {
    var drawers = document.querySelectorAll('.detail-drawer-overlay');
    drawers.forEach(function(drawer) {
        document.body.appendChild(drawer);
    });
}

// 8. Drawer Sesi Aktif (Server-Rendered) & Presensi Manual
function initActiveSessionDrawer() {
    var listContainer = document.getElementById('sesi-aktif-list');
    if (!listContainer) return;

    // Klik tombol "Lihat Detail" — buka drawer spesifik per sesi
    listContainer.addEventListener('click', function(e) {
        var btn = e.target.closest('.btn-detail-sesi');
        if (!btn) return;
        e.stopPropagation();

        var sesiId = btn.getAttribute('data-id');
        if (!sesiId) return;

        openDrawerForSesi(sesiId);
    });

    // Delegasi klik tombol X (close) di seluruh halaman
    document.addEventListener('click', function(e) {
        var closeBtn = e.target.closest('.close-drawer-btn');
        if (closeBtn) {
            var targetId = closeBtn.getAttribute('data-target');
            var drawerEl = targetId ? document.getElementById(targetId) : closeBtn.closest('.detail-drawer-overlay');
            if (drawerEl) closeDrawer(drawerEl);
            return;
        }

        // Tutup jika klik overlay (luar panel)
        if (e.target.classList.contains('detail-drawer-overlay') && !e.target.classList.contains('hidden')) {
            closeDrawer(e.target);
        }
    });

    // Delegasi klik tab button
    document.addEventListener('click', function(e) {
        var tabBtn = e.target.closest('.drawer-tab-btn');
        if (!tabBtn) return;

        var drawerEl = tabBtn.closest('.detail-drawer-overlay');
        if (!drawerEl) return;

        drawerEl.querySelectorAll('.drawer-tab-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        drawerEl.querySelectorAll('.drawer-tab-content').forEach(function(c) {
            c.classList.remove('active');
        });

        tabBtn.classList.add('active');
        var tabId = tabBtn.getAttribute('data-tab');
        var targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    });

    // (Semua event listener delegasi yang butuh listContainer sudah dipindahkan ke global jika tidak berhubungan dengan drawer)

    function openDrawerForSesi(sesiId) {
        var drawer = document.getElementById('detailSesiDrawer-' + sesiId);
        if (!drawer) return;

        // Reset ke tab pertama (Sudah Hadir)
        drawer.querySelectorAll('.drawer-tab-btn').forEach(function(b, idx) {
            b.classList.toggle('active', idx === 0);
        });
        drawer.querySelectorAll('.drawer-tab-content').forEach(function(c, idx) {
            c.classList.toggle('active', idx === 0);
        });

        drawer.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer(drawer) {
        drawer.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function handlePresensiManual(sesiId, mahasiswaId, btn) {
        if (btn.disabled || btn.classList.contains('checked')) return;

        btn.disabled = true;
        btn.style.borderColor = '#3b82f6';
        btn.innerHTML = '<i class="bi bi-arrow-repeat pulsing-icon" style="color: #3b82f6;"></i>';

        // Endpoint /api/presensi/manual-dosen sudah terdaftar di Odoo (tidak butuh restart)
        fetch('/api/presensi/manual-dosen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sesi_id: parseInt(sesiId),
                mahasiswa_id: parseInt(mahasiswaId)
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(result) {
            if (result.status === 'success') {
                btn.className = 'btn-presensi-manual checked';
                btn.innerHTML = '<i class="bi bi-check-lg"></i>';
                btn.disabled = true;

                // Animasi keluar lalu reload halaman agar data tersinkron
                setTimeout(function() {
                    var item = btn.closest('.belum-hadir-item');
                    if (item) {
                        item.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                        item.style.opacity = '0';
                        item.style.transform = 'translateX(20px)';
                        setTimeout(function() {
                            item.remove();
                            window.location.reload();
                        }, 400);
                    } else {
                        window.location.reload();
                    }
                }, 700);
            } else {
                alert('Gagal presensi manual: ' + (result.message || 'Terjadi kesalahan.'));
                btn.disabled = false;
                btn.className = 'btn-presensi-manual';
                btn.innerHTML = '<i class="bi bi-check-lg"></i>';
            }
        })
        .catch(function(err) {
            console.error('Presensi manual error:', err);
            alert('Kesalahan jaringan saat melakukan presensi manual.');
            btn.className = 'btn-presensi-manual';
            btn.innerHTML = '<i class="bi bi-check-lg"></i>';
        });
    }
}

// 11. Inisialisasi Presensi Manual secara Global
function initPresensiManualGlobal() {
    document.addEventListener('click', function(e) {
        var manualBtn = e.target.closest('.btn-presensi-manual');
        if (!manualBtn) return;

        var sesiId = manualBtn.getAttribute('data-sesi-id');
        var mhsId = manualBtn.getAttribute('data-mhs-id');
        if (!sesiId || !mhsId) return;

        // Toggle checked class pada button untuk multiple select
        manualBtn.classList.toggle('checked');

        // Update counter dan tampilkan/sembunyikan submit bar
        var checkedBtns = document.querySelectorAll('.btn-presensi-manual.checked');
        var batchBar = document.getElementById('batch-submit-bar');
        var batchCountSpan = document.getElementById('batch-count');

        if (batchBar && batchCountSpan) {
            batchCountSpan.textContent = checkedBtns.length;
            if (checkedBtns.length > 0) {
                batchBar.classList.remove('hidden');
            } else {
                batchBar.classList.add('hidden');
            }
        }
    });

    // Event listener untuk tombol submit batch
    var batchSubmitBtn = document.getElementById('btn-submit-batch-presensi');
    if (batchSubmitBtn) {
        batchSubmitBtn.addEventListener('click', function() {
            var sesiId = batchSubmitBtn.getAttribute('data-sesi-id');
            var checkedBtns = document.querySelectorAll('.btn-presensi-manual.checked');
            if (!sesiId || !checkedBtns.length) return;

            var mhsIds = [];
            checkedBtns.forEach(function(btn) {
                var mhsId = btn.getAttribute('data-mhs-id');
                if (mhsId) mhsIds.push(parseInt(mhsId));
            });

            // Disable button dan set loading status
            batchSubmitBtn.disabled = true;
            var originalHTML = batchSubmitBtn.innerHTML;
            batchSubmitBtn.innerHTML = '<i class="bi bi-arrow-repeat pulsing-icon"></i> Menyimpan Kehadiran...';

            fetch('/api/presensi/manual-dosen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sesi_id: parseInt(sesiId),
                    mahasiswa_ids: mhsIds
                })
            })
            .then(function(res) { return res.json(); })
            .then(function(result) {
                if (result.status === 'success') {
                    // Berhasil, reload halaman untuk update tabel & stats
                    window.location.reload();
                } else {
                    alert('Gagal presensi manual: ' + (result.message || 'Terjadi kesalahan.'));
                    batchSubmitBtn.disabled = false;
                    batchSubmitBtn.innerHTML = originalHTML;
                }
            })
            .catch(function(err) {
                console.error('Batch presensi manual error:', err);
                alert('Kesalahan jaringan saat melakukan presensi manual.');
                batchSubmitBtn.disabled = false;
                batchSubmitBtn.innerHTML = originalHTML;
            });
        });
    }
}

// 9. Tab Switching untuk Halaman Detail Sesi Aktif
function initAktifDetailTabs() {
    var tabBtns = document.querySelectorAll('.aktif-tab-btn');
    if (!tabBtns.length) return;

    tabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Reset semua tab btn
            tabBtns.forEach(function(b) { b.classList.remove('active'); });
            // Sembunyikan semua tab content
            document.querySelectorAll('.aktif-tab-content').forEach(function(c) {
                c.classList.remove('active');
            });

            btn.classList.add('active');
            var tabId = btn.getAttribute('data-tab');
            var panel = document.getElementById(tabId);
            if (panel) panel.classList.add('active');
        });
    });
}

// 10. Klik seluruh card sesi → navigasi ke halaman detail aktif
function initClickableSessionCards() {
    var cards = document.querySelectorAll('.session-card-clickable');
    cards.forEach(function(card) {
        var url = card.getAttribute('data-detail-url');
        if (!url) return;

        card.style.cursor = 'pointer';

        card.addEventListener('click', function(e) {
            // Jangan navigasi jika yang diklik adalah tombol tutup sesi atau link lihat detail
            if (e.target.closest('.btn-tutup-sesi') || e.target.closest('.btn-detail-sesi')) return;
            window.location.href = url;
        });
    });
}
