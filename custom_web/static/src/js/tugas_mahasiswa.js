/* --- Student Tugas Interactive Javascript (Custom Premium Layout) --- */
console.log("tugas_mahasiswa.js loaded!");

// State Management variables for Filter and Sort
var currentCourseId = "all";
var currentSortAndFilter = "default";

var initStudentTugasDone = false;

// 1. Toggle custom dropdown selectors & Dynamic Filter/Sort Engine
function initStudentTugas() {
    if (initStudentTugasDone) return;
    initStudentTugasDone = true;
    console.log("initStudentTugas starting!");
    // Course selectors
    var courseTrigger = document.getElementById("student_course_btn");
    var courseDropdown = document.getElementById("student_course_dropdown");
    var selectedCourseSpan = document.getElementById("selected_student_course");
    console.log("courseTrigger:", courseTrigger, "courseDropdown:", courseDropdown);
    
    // Sort selectors
    var sortTrigger = document.getElementById("student_sort_btn");
    var sortDropdown = document.getElementById("student_sort_dropdown");
    var selectedSortSpan = document.getElementById("selected_student_sort");

    // Course dropdown event bindings
    if (courseTrigger && courseDropdown) {
        courseTrigger.addEventListener("click", function(e) {
            e.stopPropagation();
            courseDropdown.classList.toggle("hidden");
            courseTrigger.classList.toggle("active");
            
            // Close sort dropdown if open
            if (sortDropdown) {
                sortDropdown.classList.add("hidden");
                sortTrigger.classList.remove("active");
            }
        });

        courseDropdown.addEventListener("click", function(e) {
            var item = e.target.closest(".dropdown-option-item");
            if (!item) return;

            courseDropdown.querySelectorAll(".dropdown-option-item").forEach(function(opt) {
                opt.classList.remove("active");
            });
            item.classList.add("active");

            var name = item.innerText.trim();
            currentCourseId = item.getAttribute("data-id");

            selectedCourseSpan.innerText = name;
            courseDropdown.classList.add("hidden");
            courseTrigger.classList.remove("active");

            applyFiltersAndSort();
        });

        // Hide when clicking outside
        document.addEventListener("click", function(e) {
            if (!courseTrigger.contains(e.target) && !courseDropdown.contains(e.target)) {
                courseDropdown.classList.add("hidden");
                courseTrigger.classList.remove("active");
            }
        });
    }

    // Sort & Status Filter event bindings
    if (sortTrigger && sortDropdown) {
        sortTrigger.addEventListener("click", function(e) {
            e.stopPropagation();
            sortDropdown.classList.toggle("hidden");
            sortTrigger.classList.toggle("active");
            
            // Close course dropdown if open
            if (courseDropdown) {
                courseDropdown.classList.add("hidden");
                courseTrigger.classList.remove("active");
            }
        });

        sortDropdown.addEventListener("click", function(e) {
            var item = e.target.closest(".sort-option-item");
            if (!item) return;

            sortDropdown.querySelectorAll(".sort-option-item").forEach(function(opt) {
                opt.classList.remove("active");
            });
            item.classList.add("active");

            var sortLabel = item.innerText.trim();
            currentSortAndFilter = item.getAttribute("data-sort");

            // Update UI Trigger Label
            selectedSortSpan.innerHTML = `<i class="bi bi-funnel-fill text-purple"></i> ` + sortLabel;
            sortDropdown.classList.add("hidden");
            sortTrigger.classList.remove("active");

            applyFiltersAndSort();
        });

        // Hide when clicking outside
        document.addEventListener("click", function(e) {
            if (!sortTrigger.contains(e.target) && !sortDropdown.contains(e.target)) {
                sortDropdown.classList.add("hidden");
                sortTrigger.classList.remove("active");
            }
        });
    }

    // Detail overlay close handler
    var detailOverlay = document.getElementById("detail-overlay");
    if (detailOverlay) {
        detailOverlay.addEventListener("click", function(e) {
            // Close if the overlay backdrop or the close button is clicked
            if (e.target === detailOverlay || e.target.closest(".detail-close-btn")) {
                e.preventDefault();
                closeTaskDetails();
            }
        });
    }

    // Drag & Drop mock handlers
    var dropZone = document.getElementById("drop-zone");
    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, function(e) {
                e.preventDefault();
                dropZone.classList.add("dragover");
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, function(e) {
                e.preventDefault();
                dropZone.classList.remove("dragover");
            }, false);
        });

        dropZone.addEventListener('drop', function(e) {
            var dt = e.dataTransfer;
            var files = dt.files;
            if (files.length > 0) {
                var fileInput = document.getElementById("file-upload");
                fileInput.files = files;
                handleFileSelect(fileInput);
            }
        }, false);
    }

    // Initial filter and sort by date-open-desc on page load
    applyFiltersAndSort();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudentTugas);
} else {
    initStudentTugas();
}

// 2. Unified Filter and Sort Execution Engine
function applyFiltersAndSort() {
    var activeCards = Array.from(document.querySelectorAll(".tugas-card-layout"));
    var historyStrips = Array.from(document.querySelectorAll(".history-card-strip"));

    // A. FILTER PASS
    activeCards.forEach(function(card) {
        var cardCourse = card.getAttribute("data-course-id");
        var cardStatus = card.getAttribute("data-status");
        
        var matchesCourse = (currentCourseId === "all" || cardCourse == currentCourseId);
        var isPending = (cardStatus === "pending");

        // Sort option can also be a filter
        var matchesFilter = true;
        if (currentSortAndFilter === "filter-selesai") {
            matchesFilter = false; // completed tasks go to history
        } else if (currentSortAndFilter === "filter-terlambat") {
            matchesFilter = false; // missed tasks go to history
        }

        if (matchesCourse && isPending && matchesFilter) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });

    historyStrips.forEach(function(strip) {
        var stripCourse = strip.getAttribute("data-course-id");
        var stripStatus = strip.getAttribute("data-status"); // "completed" or "missed"
        
        var matchesCourse = (currentCourseId === "all" || stripCourse == currentCourseId);
        
        var matchesFilter = true;
        if (currentSortAndFilter === "filter-selesai") {
            matchesFilter = (stripStatus === "completed");
        } else if (currentSortAndFilter === "filter-terlambat") {
            matchesFilter = (stripStatus === "missed");
        }

        if (matchesCourse && matchesFilter) {
            strip.style.display = "";
        } else {
            strip.style.display = "none";
        }
    });

    // Auto-switch tabs based on filter
    if (currentSortAndFilter === "filter-selesai" || currentSortAndFilter === "filter-terlambat") {
        switchTugasTab("history");
    } else if (currentSortAndFilter === "filter-all") {
        // stay on current tab
    } else if (currentSortAndFilter.startsWith("date-") || currentSortAndFilter.startsWith("name-")) {
        switchTugasTab("tugas");
    }

    // B. SORT PASS
    // Sort Active Cards
    var activeContainer = document.querySelector(".mhs-assignments-feed-layout");
    if (activeContainer && activeCards.length > 0) {
        var visibleActive = activeCards.filter(c => c.style.display !== "none");
        
        // Handle JS empty state
        var activeEmpty = activeContainer.querySelector(".empty-state");
        if (visibleActive.length === 0) {
            if (!activeEmpty) {
                var emptyDiv = document.createElement("div");
                emptyDiv.className = "empty-state";
                emptyDiv.style = "grid-column: span 2; text-align: center; padding: 40px; background: rgba(255,255,255,0.4); border-radius: 16px;";
                emptyDiv.innerHTML = '<i class="bi bi-slash-circle" style="font-size: 32px; color: #64748b;"></i><p style="margin-top: 10px; color: #64748b; font-weight: 600;">Tidak ada tugas yang sesuai filter.</p>';
                activeContainer.appendChild(emptyDiv);
            } else {
                activeEmpty.style.display = "";
            }
        } else {
            if (activeEmpty) activeEmpty.style.display = "none";
            sortElementsArray(visibleActive, currentSortAndFilter);
            visibleActive.forEach(function(card) {
                activeContainer.appendChild(card); // Re-order in DOM
                card.style.animation = "popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
            });
        }
    }

    // Sort History Strips
    var historyContainer = document.querySelector(".history-cards-feed-wrapper");
    if (historyContainer && historyStrips.length > 0) {
        var visibleHistory = historyStrips.filter(s => s.style.display !== "none");
        
        var historyEmpty = historyContainer.querySelector(".empty-state");
        if (visibleHistory.length === 0) {
            if (!historyEmpty) {
                var emptyDiv = document.createElement("div");
                emptyDiv.className = "empty-state";
                emptyDiv.style = "text-align: center; padding: 40px; background: rgba(255,255,255,0.4); border-radius: 16px;";
                emptyDiv.innerHTML = '<i class="bi bi-slash-circle" style="font-size: 32px; color: #64748b;"></i><p style="margin-top: 10px; color: #64748b; font-weight: 600;">Tidak ada riwayat yang sesuai filter.</p>';
                historyContainer.appendChild(emptyDiv);
            } else {
                historyEmpty.style.display = "";
            }
        } else {
            if (historyEmpty) historyEmpty.style.display = "none";
            sortElementsArray(visibleHistory, currentSortAndFilter);
            visibleHistory.forEach(function(strip) {
                historyContainer.appendChild(strip); // Re-order in DOM
                strip.style.animation = "popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)";
            });
        }
    }

    updateStudentTugasStats();
}

// C. Element Sorter Helper
function sortElementsArray(array, sortOption) {
    var activeSort = sortOption;
    if (activeSort === "default" || activeSort.startsWith("filter-")) {
        activeSort = "date-open-desc"; // Default sorting: Tanggal Buka (Terbaru)
    }

    array.sort(function(a, b) {
        var nameA = (a.getAttribute("data-name") || "").toLowerCase();
        var nameB = (b.getAttribute("data-name") || "").toLowerCase();
        var dateOpenA = a.getAttribute("data-date-open") || "";
        var dateOpenB = b.getAttribute("data-date-open") || "";
        var dateCloseA = a.getAttribute("data-date-close") || "";
        var dateCloseB = b.getAttribute("data-date-close") || "";

        switch (activeSort) {
            case "name-asc":
                return nameA.localeCompare(nameB);
            case "name-desc":
                return nameB.localeCompare(nameA);
            case "date-open-asc":
                return dateOpenA.localeCompare(dateOpenB);
            case "date-open-desc":
                return dateOpenB.localeCompare(dateOpenA);
            case "date-close-asc":
                return dateCloseA.localeCompare(dateCloseB);
            case "date-close-desc":
                return dateCloseB.localeCompare(dateCloseA);
            default:
                return 0;
        }
    });
}

// 3. Switch Tab between Tugas (Active Cards) and History
function switchTugasTab(tabName) {
    var btnTugas = document.getElementById("tab-tugas");
    var btnHistory = document.getElementById("tab-history");
    
    var containerTugas = document.getElementById("active-tasks-container");
    var containerHistory = document.getElementById("history-tasks-container");

    if (tabName === "tugas") {
        btnTugas.classList.add("active");
        btnHistory.classList.remove("active");
        containerTugas.classList.remove("hidden");
        containerHistory.classList.add("hidden");
    } else {
        btnTugas.classList.remove("active");
        btnHistory.classList.add("active");
        containerTugas.classList.add("hidden");
        containerHistory.classList.remove("hidden");
    }
}

// 4. Submission drawer overlay controls
function openSubmissionDrawerNew(btn) {
    var taskId = btn.getAttribute("data-id");
    var taskTitle = btn.getAttribute("data-title");
    var taskSubject = btn.getAttribute("data-subject");

    document.getElementById("submit-task-id").value = taskId;
    document.getElementById("submit-task-title").innerText = taskTitle;
    document.getElementById("submit-task-subject").innerHTML = '<i class="bi bi-book"></i> ' + taskSubject;

    document.getElementById("file-upload").value = "";
    var nameDisplay = document.getElementById("file-name-display");
    if (nameDisplay) {
        nameDisplay.classList.add("hidden");
        nameDisplay.innerText = "";
    }
    document.getElementById("link-submission").value = "";
    document.getElementById("catatan").value = "";

    var overlay = document.getElementById("submission-overlay");
    overlay.classList.add("open");
}

function openSubmissionDrawer(taskId, taskTitle, taskSubject) {
    // Deprecated
}

function closeSubmissionDrawer() {
    var overlay = document.getElementById("submission-overlay");
    if (overlay) overlay.classList.remove("open");
}

// Close task detail overlay (modal) if present
function closeTaskDetails() {
    var overlay = document.getElementById("detail-overlay");
    if (overlay) overlay.classList.remove("open");
}


// 5. Task Detail Modal Controls
function showTaskDetailsNew(btn) {
    var taskId = btn.getAttribute("data-id");
    var title = btn.getAttribute("data-title");
    var subject = btn.getAttribute("data-subject");
    var desc = btn.getAttribute("data-desc") || "Tidak ada deskripsi.";
    var hasFile = btn.getAttribute("data-has-file") === "true";
    var fileUrl = btn.getAttribute("data-file-url") || "";
    var fileName = btn.getAttribute("data-file-name") || "";

    document.getElementById("detail-task-title").innerText = title;
    document.getElementById("detail-task-subject").innerText = subject;
    document.getElementById("detail-task-desc").innerText = desc;

    var materiWrapper = document.getElementById("detail-task-materi-wrapper");
    var materiLink = document.getElementById("detail-task-materi-link");
    var materiName = document.getElementById("detail-task-materi-name");
    
    if (materiWrapper && materiLink && materiName) {
        if (hasFile) {
            materiWrapper.classList.remove("hidden");
            materiLink.setAttribute("href", fileUrl);
            materiName.innerText = fileName;
        } else {
            materiWrapper.classList.add("hidden");
        }
    }

    document.getElementById("detail-overlay").classList.add("open");
}

function showTaskDetails(taskId, title, subject, description) {
    // Deprecated
}

// 6. Handle file choose display
function handleFileSelect(input) {
    var display = document.getElementById("file-name-display");
    if (input.files && input.files[0]) {
        display.innerText = "📁 " + input.files[0].name + " (" + (input.files[0].size / 1024 / 1024).toFixed(2) + " MB)";
        display.classList.remove("hidden");
    } else {
        display.classList.add("hidden");
        display.innerText = "";
    }
}

// 7. Submit Real Submission to Odoo Backend (Multipart/FormData to HTTP route)
async function submitRealSubmission() {
    const btnSubmit = document.querySelector(".btn-submit-drawer");
    if (!btnSubmit) {
        showToast("Error", "Tombol submit tidak ditemukan (btn-submit-drawer).", "bi-exclamation-triangle-fill text-danger");
        return;
    }

    var fileInput = document.getElementById("file-upload");
    var linkInput = document.getElementById("link-submission").value.trim();
    var taskId = document.getElementById("submit-task-id").value;
    var catatan = document.getElementById("catatan").value.trim();

    var tipe_file = "link";
    if (fileInput.files.length > 0) {
        tipe_file = "zip";
        var file = fileInput.files[0];
        if (file.size > 10 * 1024 * 1024) {
            showToast("Peringatan", "Ukuran berkas tugas maksimal 10MB!", "bi-exclamation-triangle-fill text-warning");
            return;
        }
    }

    if (tipe_file === "link" && !linkInput) {
        showToast("Pengumpulan Gagal", "Harap isi tautan (Link) tugas Anda!", "bi-exclamation-triangle-fill text-warning");
        return;
    }
    if (tipe_file === "zip" && !fileInput.files[0]) {
        showToast("Pengumpulan Gagal", "Harap unggah file tugas Anda!", "bi-exclamation-triangle-fill text-warning");
        return;
    }

    var btnSubmit = document.querySelector(".btn-submit-drawer");
    var originalBtnHTML = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="bi bi-arrow-repeat pulsing-icon"></i> Mengirim...';

    // Construct multipart form data
    var formData = new FormData();
    formData.append("tugas_id", taskId);
    formData.append("tipe_file", tipe_file);
    formData.append("catatan", catatan);
    if (tipe_file === "link") {
        formData.append("link_jawaban", linkInput);
    } else if (tipe_file === "zip") {
        formData.append("file_jawaban", fileInput.files[0]);
    }

    try {
        var res = await fetch("/api/tugas/kumpul", {
            method: "POST",
            body: formData
        });
        
        var rawText = await res.text();
        var resultData = {};
        try {
            var parsed = JSON.parse(rawText);
            resultData = parsed.result || parsed.data || parsed;
        } catch (jsonErr) {
            resultData = { status: "error", message: "Gagal memproses response server." };
        }
        
        if (resultData.status === "success" || resultData.message === "Tugas berhasil dikumpulkan!") {
            closeSubmissionDrawer();
            
            // Open gamified celebration modal
            setTimeout(function() {
                var celebration = document.getElementById("celebration-panel");
                celebration.classList.remove("hidden");
            }, 400);
        } else {
            showToast("Error", resultData.message || "Gagal mengumpulkan tugas.", "bi-exclamation-triangle-fill text-danger");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalBtnHTML;
        }
    } catch (e) {
        showToast("Error", "Koneksi ke server gagal.", "bi-wifi-off text-danger");
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnHTML;
    }
}

function submitMockSubmission() {
    // Deprecated
}

function closeCelebration() {
    document.getElementById("celebration-panel").classList.add("hidden");
    window.location.reload();
}

// 8. Dynamic statistics synchronization
function updateStudentTugasStats() {
    var activeCount = 0;
    var historyCount = 0;

    document.querySelectorAll(".tugas-card-layout").forEach(function(card) {
        if (card.getAttribute("data-status") === "pending" && card.style.display !== "none") {
            activeCount++;
        }
    });

    document.querySelectorAll(".history-card-strip").forEach(function(strip) {
        if (strip.style.display !== "none") {
            historyCount++;
        }
    });

    var activeText = document.getElementById("stats-active-count");
    if (activeText) activeText.innerText = activeCount;

    var historyText = document.getElementById("stats-history-count");
    if (historyText) historyText.innerText = historyCount;
}

// 9. Custom Toast Utility
function showToast(title, message, iconClass) {
    var container = document.getElementById("mhs-toast-container");
    if (!container) return;

    var toast = document.createElement("div");
    toast.className = "glowing-toast";
    toast.innerHTML = `
        <div class="toast-icon-side"><i class="bi ${iconClass}"></i></div>
        <div class="toast-body-side">
            <h5>${title}</h5>
            <p>${message}</p>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(0)";
    }, 10);

    setTimeout(function() {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(40px)";
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 4000);
}