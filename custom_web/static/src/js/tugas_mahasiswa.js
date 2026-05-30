/* --- Student Tugas Interactive Javascript --- */

// Handle Tab Filtering for Student Assignments
function filterMhsTugas(status) {
    var tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(function(t) { t.classList.remove("active"); });

    var activeTab = document.getElementById("tab-" + (status === "all" ? "all" : status === "pending" ? "pending" : "completed"));
    if (activeTab) activeTab.classList.add("active");

    var cards = document.querySelectorAll(".tugas-card");
    cards.forEach(function(card) {
        var cardStatus = card.getAttribute("data-status");
        if (status === "all") {
            card.style.display = "";
        } else if (status === "pending" && cardStatus === "pending") {
            card.style.display = "";
        } else if (status === "completed" && cardStatus === "completed") {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}

// Drawer overlay controls
function openSubmissionDrawer(taskId, taskTitle, taskSubject) {
    document.getElementById("submit-task-id").value = taskId;
    document.getElementById("submit-task-title").innerText = taskTitle;
    document.getElementById("submit-task-subject").innerHTML = '<i class="bi bi-book"></i> ' + taskSubject;

    // Reset fields
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

// Drag and drop mock file handlers
document.addEventListener("DOMContentLoaded", function() {
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
});

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

// Handle mock submission
function submitMockSubmission() {
    var fileInput = document.getElementById("file-upload");
    var linkInput = document.getElementById("link-submission").value.trim();
    var taskId = document.getElementById("submit-task-id").value;

    if (!fileInput.files[0] && !linkInput) {
        showToast("Pengumpulan Gagal", "Harap unggah file atau masukkan link tautan tugas!", "bi-exclamation-triangle-fill text-warning");
        return;
    }

    // Close submission drawer
    closeSubmissionDrawer();

    // Mark the card as completed
    var card = document.querySelector(`[data-id="${taskId}"]`);
    if (card) {
        card.setAttribute("data-status", "completed");
        
        // Update footer status UI
        var indicator = card.querySelector(".status-indicator");
        indicator.className = "status-indicator submitted";
        indicator.innerHTML = '<i class="bi bi-check-circle-fill"></i> Sudah Dikumpulkan';

        // Disable button
        var btn = card.querySelector(".btn-action-kumpulkan");
        btn.className = "btn-action-kumpulkan disabled";
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Selesai';
        btn.setAttribute("disabled", "disabled");

        // Sync header statistics HUD counts
        updateStudentTugasStats();
    }

    // Open gamified celebration modal
    setTimeout(function() {
        var celebration = document.getElementById("celebration-panel");
        celebration.classList.remove("hidden");
    }, 400);
}

function closeCelebration() {
    document.getElementById("celebration-panel").classList.add("hidden");
}

// Re-calculate tab statistics badge counts
function updateStudentTugasStats() {
    var cards = document.querySelectorAll(".tugas-card");
    var total = cards.length;
    var pending = 0;
    var completed = 0;

    cards.forEach(function(card) {
        var stat = card.getAttribute("data-status");
        if (stat === "pending") pending++;
        if (stat === "completed") completed++;
    });

    document.getElementById("count-semua").innerText = total;
    document.getElementById("count-belum").innerText = pending;
    document.getElementById("count-selesai").innerText = completed;
}
