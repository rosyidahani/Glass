/* --- Student Tugas Interactive Javascript (Custom Premium Layout) --- */

// State Management variables for Filter and Sort
var currentCourseId = "all";
var currentSortAndFilter = "default";

// 1. Toggle custom dropdown selectors & Dynamic Filter/Sort Engine
document.addEventListener("DOMContentLoaded", function() {
    // Course selectors
    var courseTrigger = document.getElementById("student_course_btn");
    var courseDropdown = document.getElementById("student_course_dropdown");
    var selectedCourseSpan = document.getElementById("selected_student_course");
    
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
});

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

    // B. SORT PASS
    // Sort Active Cards
    var activeContainer = document.querySelector(".mhs-assignments-feed-layout");
    if (activeContainer && activeCards.length > 0) {
        var visibleActive = activeCards.filter(c => c.style.display !== "none");
        if (visibleActive.length > 0) {
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
        if (visibleHistory.length > 0) {
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
function openSubmissionDrawer(taskId, taskTitle, taskSubject) {
    document.getElementById("submit-task-id").value = taskId;
    document.getElementById("submit-task-title").innerText = taskTitle;
    document.getElementById("submit-task-subject").innerHTML = '<i class="bi bi-book"></i> ' + taskSubject;

    document.getElementById("file-upload").value = "";
    var nameDisplay = document.getElementById("file-name-display");
    nameDisplay.classList.add("hidden");
    nameDisplay.innerText = "";
    document.getElementById("link-submission").value = "";
    document.getElementById("catatan").value = "";

    var overlay = document.getElementById("submission-overlay");
    overlay.classList.add("open");
}

function closeSubmissionDrawer() {
    var overlay = document.getElementById("submission-overlay");
    overlay.classList.remove("open");
}

// 5. Task Detail Modal Controls
function showTaskDetails(taskId, title, subject, description) {
    document.getElementById("detail-task-title").innerText = title;
    document.getElementById("detail-task-subject").innerText = subject;
    document.getElementById("detail-task-desc").innerText = description;
    
    document.getElementById("detail-overlay").classList.add("open");
}

function closeDetailDrawer() {
    document.getElementById("detail-overlay").classList.remove("open");
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

// 7. Submit Mock Submission
function submitMockSubmission() {
    var fileInput = document.getElementById("file-upload");
    var linkInput = document.getElementById("link-submission").value.trim();
    var taskId = document.getElementById("submit-task-id").value;

    if (!fileInput.files[0] && !linkInput) {
        showToast("Pengumpulan Gagal", "Harap unggah file atau masukkan link tautan tugas!", "bi-exclamation-triangle-fill text-warning");
        return;
    }

    closeSubmissionDrawer();

    var card = document.querySelector(`[data-id="${taskId}"]`);
    if (card) {
        card.setAttribute("data-status", "completed");
        card.style.display = "none";
        
        var wrapper = document.querySelector(".history-cards-feed-wrapper");
        if (wrapper) {
            var title = card.querySelector(".task-title").innerText;
            var subject = card.querySelector(".task-subject").innerText;
            var courseId = card.getAttribute("data-course-id");
            
            var today = new Date();
            var day = today.getDate();
            var months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            var dateStr = day + " " + months[today.getMonth()] + " " + today.getFullYear();
            
            // Format dynamic iso date string for dynamic sorting in current session
            var isoToday = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(day).padStart(2, '0');

            var newStrip = document.createElement("div");
            newStrip.className = "history-card-strip";
            newStrip.setAttribute("data-course-id", courseId);
            newStrip.setAttribute("data-status", "completed");
            newStrip.setAttribute("data-name", title);
            newStrip.setAttribute("data-date-open", isoToday);
            newStrip.setAttribute("data-date-close", isoToday);

            newStrip.innerHTML = `
                <div class="strip-info">
                    <h4 class="strip-title">${title}</h4>
                    <p class="strip-subject">${subject}</p>
                </div>
                <div class="strip-dates">
                    <div class="date-block">
                        <span class="lbl">Tanggal Buka</span>
                        <span class="val">${dateStr}</span>
                    </div>
                    <div class="date-block">
                        <span class="lbl">Batas Waktu</span>
                        <span class="val">${dateStr}</span>
                    </div>
                </div>
                <div class="strip-badge-side">
                    <span class="badge-status-pill success"><i class="bi bi-patch-check-fill"></i> Selesai</span>
                </div>
            `;
            wrapper.insertBefore(newStrip, wrapper.firstChild);
        }
    }

    applyFiltersAndSort();

    // Open gamified celebration modal
    setTimeout(function() {
        var celebration = document.getElementById("celebration-panel");
        celebration.classList.remove("hidden");
    }, 400);
}

function closeCelebration() {
    document.getElementById("celebration-panel").classList.add("hidden");
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
