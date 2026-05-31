/* --- Dosen Tugas Premium Interactivity (Expanded) --- */

document.addEventListener("DOMContentLoaded", function() {
    // --- 1. Form Pembuatan Tugas (Halaman: /dosen/tugas/buat) ---
    var form = document.getElementById("form-buat-tugas");
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            
            var mkSelect = document.getElementById("mk_id");
            var mkName = mkSelect.options[mkSelect.selectedIndex].text;
            var judul = document.getElementById("judul").value.trim();
            var deadlineRaw = document.getElementById("deadline").value;
            var deskripsi = document.getElementById("deskripsi").value.trim();
            var jenis_tugas = document.querySelector('input[name="jenis_tugas"]:checked').value;
            
            if (!mkSelect.value || !judul || !deadlineRaw || !deskripsi) {
                showToast("Peringatan", "Harap isi semua kolom wajib (*)!", "bi-exclamation-triangle-fill text-warning");
                return;
            }

            var deadlineDate = new Date(deadlineRaw);
            var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            var formattedDeadline = deadlineDate.getDate() + " " + months[deadlineDate.getMonth()] + " " + deadlineDate.getFullYear() + ", " + 
                                    String(deadlineDate.getHours()).padStart(2, '0') + ":" + String(deadlineDate.getMinutes()).padStart(2, '0') + " WIB";

            var randomId = "task-" + Date.now();

            var newItemHTML = `
                <div class="tugas-item" data-id="${randomId}" data-jenis="${jenis_tugas}" style="animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
                    <div class="tugas-item-header">
                        <div class="tugas-title-meta">
                            <h4>${judul}</h4>
                            <p class="subject"><i class="bi bi-book"></i> ${mkName}</p>
                        </div>
                        <span class="type-badge ${jenis_tugas.toLowerCase()}">${jenis_tugas}</span>
                    </div>
                    <div class="tugas-item-body">
                        <span class="val text-danger"><i class="bi bi-clock-fill"></i> ${formattedDeadline}</span>
                        <p class="desc text-truncate-3">${deskripsi}</p>
                    </div>
                    <div class="tugas-item-footer">
                        <button class="btn-toggle-detail" onclick="toggleDetails(this)"><i class="bi bi-chevron-down"></i> Detail</button>
                        <div class="actions">
                            <button class="btn-action edit" onclick="editMockTask('${randomId}')"><i class="bi bi-pencil-square"></i></button>
                            <button class="btn-action delete" onclick="deleteMockTask('${randomId}')"><i class="bi bi-trash3-fill"></i></button>
                        </div>
                    </div>
                </div>
            `;

            var container = document.getElementById("assignments-list");
            if (container) {
                container.insertAdjacentHTML("afterbegin", newItemHTML);
                updateDosenTugasStats();
            }

            form.reset();
            showToast("Tugas Dibuat!", "Tugas baru berhasil dipublikasikan untuk mahasiswa.", "bi-check-circle-fill text-success");
        });
    }

    // --- 2. Filter Kelas Mata Kuliah (Halaman: /dosen/tugas/pengumpulan) ---
    var filterButtons = document.querySelectorAll(".course-filter-btn");
    filterButtons.forEach(function(btn) {
        btn.addEventListener("click", function() {
            filterButtons.forEach(function(b) { b.classList.remove("active"); });
            btn.classList.add("active");

            var filterValue = btn.getAttribute("data-filter");
            var cards = document.querySelectorAll(".dosen-submission-task-card");

            cards.forEach(function(card) {
                var cardCourse = card.getAttribute("data-course-id");
                if (filterValue === "all" || cardCourse === filterValue) {
                    card.style.display = "";
                    card.style.animation = "fadeIn 0.4s ease";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    // --- 3. Halaman Detail & Pengumpulan Mahasiswa (Halaman: /dosen/tugas/detail/<id>) ---
    var path = window.location.pathname;
    if (path.includes("/dosen/tugas/detail/")) {
        var taskId = path.split("/").pop();
        loadTugasDetailAndSubmissions(taskId);
    }
});

// Load and populate detail specs and submission tables
async function loadTugasDetailAndSubmissions(taskId) {
    try {
        let response = await fetch('/api/tugas/detail/' + taskId);
        let result = await response.json();
        
        if (result.status !== 'success') {
            showToast("Error", "Gagal memuat data tugas.", "bi-exclamation-triangle-fill text-danger");
            return;
        }
        
        var task = result.data;

        // Populate Spec Card
        var titleEl = document.getElementById("detail-spec-title");
        var subjectEl = document.getElementById("detail-spec-subject");
        var typeEl = document.getElementById("detail-spec-type");
        var deadlineEl = document.getElementById("detail-spec-deadline");
        var descEl = document.getElementById("detail-spec-desc");
        var hudTitle = document.getElementById("detail-hud-title");

        if (titleEl) titleEl.innerText = task.title;
        if (hudTitle) hudTitle.innerText = task.title;
        if (subjectEl) {
            subjectEl.innerText = task.subject;
            if (task.subject.includes("AI")) subjectEl.className = "badge-tag purple";
            else if (task.subject.includes("Web II")) subjectEl.className = "badge-tag blue";
            else subjectEl.className = "badge-tag teal";
        }
        if (typeEl) {
            typeEl.innerText = task.type;
            typeEl.className = "badge-tag outline";
        }
        if (deadlineEl) deadlineEl.innerHTML = '<i class="bi bi-clock-fill"></i> Batas Waktu: ' + task.deadline;
        if (descEl) descEl.innerText = task.desc;

        // Populate Submissions Table
        var tbody = document.getElementById("submissions-table-body");
        if (!tbody) return;

        if (!task.submissions || task.submissions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-40 text-muted font-bold">
                        <i class="bi bi-folder-x" style="font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.5;"></i>
                        Belum ada pengumpulan tugas dari mahasiswa untuk saat ini.
                    </td>
                </tr>
            `;
            return;
        }

        var rowsHTML = "";
        task.submissions.forEach(function(sub) {
            var fileBtn = "";
            if (sub.type === "zip") {
                fileBtn = `<a href="#" class="btn-zip-download" onclick="event.preventDefault(); showToast('Mengunduh', 'Mengunduh berkas ${sub.file}...', 'bi-cloud-download text-primary');"><i class="bi bi-file-earmark-zip-fill"></i> Unduh ZIP</a>`;
            } else {
                fileBtn = `<a href="${sub.file}" target="_blank" class="btn-link-view"><i class="bi bi-link-45deg"></i> Buka Tautan</a>`;
            }

            var gradeBadge = "";
            var gradeInput = "";

            if (sub.status === "graded") {
                gradeBadge = `<span class="grade-badge graded"><i class="bi bi-check-circle-fill"></i> Dinilai (${sub.grade})</span>`;
                gradeInput = `<input type="number" class="input-grade" value="${sub.grade}" min="0" max="100"/>`;
            } else {
                gradeBadge = `<span class="grade-badge pending"><i class="bi bi-hourglass-split"></i> Belum Dinilai</span>`;
                gradeInput = `<input type="number" class="input-grade" placeholder="-" min="0" max="100"/>`;
            }

            rowsHTML += `
                <tr data-sub-id="${sub.id}">
                    <td>
                        <div class="student-meta-block">
                            <p class="name">${sub.name}</p>
                            <p class="nim">${sub.nim}</p>
                        </div>
                    </td>
                    <td><i class="bi bi-calendar3"></i> ${sub.date}</td>
                    <td>${fileBtn}</td>
                    <td class="catatan">${sub.note || '-'}</td>
                    <td class="status-td">${gradeBadge}</td>
                    <td>
                        <div class="grading-input-wrapper">
                            ${gradeInput}
                            <button class="btn-save-grade" onclick="saveMockGrade('${sub.id}', '${sub.name}', this)">
                                <i class="bi bi-check-lg"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = rowsHTML;

    } catch (error) {
        console.error(error);
        showToast("Error", "Koneksi ke server gagal.", "bi-wifi-off text-danger");
    }
}

// Interactive Grade Submission Simulator
async function saveMockGrade(subId, studentName, btn) {
    var wrapper = btn.closest(".grading-input-wrapper");
    var input = wrapper.querySelector(".input-grade");
    var scoreValue = input.value.trim();

    if (!scoreValue) {
        showToast("Error", "Harap masukkan nilai tugas terlebih dahulu!", "bi-exclamation-triangle-fill text-danger");
        return;
    }

    var score = parseInt(scoreValue);
    if (isNaN(score) || score < 0 || score > 100) {
        showToast("Error", "Nilai harus berupa angka antara 0 dan 100!", "bi-exclamation-triangle-fill text-danger");
        return;
    }

    try {
        let res = await fetch('/api/tugas/nilai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pengumpulan_id: subId, nilai: score })
        });
        let data = await res.json();
        
        if (data.status === 'success') {
            // Success transition
            btn.style.transform = "scale(0.8)";
            setTimeout(function() {
                btn.style.transform = "scale(1)";
                
                // Update table badge status
                var tr = btn.closest("tr");
                var statusTd = tr.querySelector(".status-td");
                statusTd.innerHTML = `<span class="grade-badge graded"><i class="bi bi-check-circle-fill"></i> Dinilai (${score})</span>`;
                
                // Success Toast
                showToast("Penilaian Sukses!", "Nilai tugas " + studentName + " berhasil disimpan: " + score, "bi-patch-check-fill text-success");
            }, 200);
        } else {
            showToast("Error", data.message || "Gagal menyimpan nilai.", "bi-exclamation-triangle-fill text-danger");
        }
    } catch (e) {
        console.error(e);
        showToast("Error", "Koneksi ke server gagal.", "bi-wifi-off text-danger");
    }
}

// Original helper functions
function toggleDetails(btn) {
    var card = btn.closest(".tugas-item");
    var details = card.querySelector(".collapsed-details");
    
    if (details.classList.contains("open")) {
        details.classList.remove("open");
        btn.innerHTML = '<i class="bi bi-chevron-down"></i> Detail';
    } else {
        details.classList.add("open");
        btn.innerHTML = '<i class="bi bi-chevron-up"></i> Tutup';
    }
}

function showToast(title, message, iconClass) {
    var container = document.getElementById("toast-container");
    if (!container) return;

    var toastId = "toast-" + Date.now();
    var html = `
        <div class="glowing-toast" id="${toastId}">
            <i class="bi ${iconClass} toast-icon"></i>
            <div class="toast-content">
                <h5>${title}</h5>
                <p>${message}</p>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML("beforeend", html);
    
    setTimeout(function() {
        var el = document.getElementById(toastId);
        if (el) {
            el.classList.add("hide");
            setTimeout(function() { el.remove(); }, 300);
        }
    }, 4000);
}

async function deleteMockTask(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;
    
    try {
        let res = await fetch('/api/tugas/hapus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tugas_id: id })
        });
        let data = await res.json();
        
        if (data.status === 'success') {
            var el = document.querySelector(`[data-id="${id}"]`);
            if (el) {
                el.style.transform = "scale(0.9) translateY(-10px)";
                el.style.opacity = "0";
                setTimeout(function() {
                    el.remove();
                    updateDosenTugasStats();
                    showToast("Tugas Dihapus", "Tugas berhasil dihapus.", "bi-trash3-fill text-danger");
                }, 300);
            }
        } else {
            showToast("Error", "Gagal menghapus tugas.", "bi-exclamation-triangle-fill text-danger");
        }
    } catch (e) {
        console.error(e);
        showToast("Error", "Koneksi ke server gagal.", "bi-wifi-off text-danger");
    }
}

function editMockTask(id) {
    var el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return;

    var title = el.querySelector("h4").innerText;
    var desc = el.querySelector(".desc").innerText;
    var jenis = el.getAttribute("data-jenis");
    
    document.getElementById("judul").value = title;
    document.getElementById("deskripsi").value = desc;
    
    if (jenis === "Individu") {
        document.getElementById("jenis_individu").checked = true;
    } else {
        document.getElementById("jenis_kelompok").checked = true;
    }

    document.getElementById("form-buat-tugas").scrollIntoView({ behavior: "smooth" });
    el.remove();
    updateDosenTugasStats();
    showToast("Mode Edit", "Detail tugas dimuat ke formulir.", "bi-pencil-square text-primary");
}

function updateDosenTugasStats() {
    var list = document.getElementById("assignments-list");
    if (!list) return;

    var totalEl = document.getElementById("stat-total-tugas");
    var indEl = document.getElementById("stat-individu");
    var kelEl = document.getElementById("stat-kelompok");

    var items = list.querySelectorAll(".tugas-item");
    var total = items.length;
    var ind = list.querySelectorAll('[data-jenis="Individu"]').length;
    var kel = list.querySelectorAll('[data-jenis="Kelompok"]').length;

    totalEl.innerText = total;
    indEl.innerText = ind;
    kelEl.innerText = kel;
}
