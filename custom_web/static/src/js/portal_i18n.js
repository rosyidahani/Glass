// Client-side translation system for Student and Lecturer Portal
const portalTranslations = {
    id: {
        "portal_title": "Portal Mahasiswa",
        "sidebar_home": "Home",
        "sidebar_presensi": "Presensi",
        "sidebar_presensi_mhs": "Presensi Mahasiswa",
        "sidebar_tugas": "Tugas",
        "sidebar_leaderboard": "Leaderboard",
        "sidebar_logout": "Logout",
        // Shared Headers
        "title_tugas": "Tugas",
        "title_toko_koin": "Toko Koin",
        "title_leaderboard": "Leaderboard",
        "title_pengaturan": "Pengaturan",
        "title_presensi": "Presensi",
        "title_shop": "Toko",
        "title_settings": "Pengaturan Akun",
        "title_coins_exchange": "Saldo koin Anda",
        "title_total_xp": "Poin XP Anda saat ini",
        // Dashboard
        "dash_semester": "Semester",
        "dash_koin": "Koin",
        "dash_xp": "Total XP",
        "dash_rank": "Peringkat",
        "dash_active_tasks": "Tugas Aktif",
        "dash_history_tasks": "Riwayat Tugas",
        "dash_shop": "Toko",
        "dash_settings": "Pengaturan Akun",
        // Settings
        "set_title": "Pengaturan",
        "set_security": "Sandi & Keamanan",
        "set_theme": "Tema",
        "set_lang": "Bahasa",
        "set_faq": "Bantuan (faq)",
        "set_logout": "Log out",
        "set_edit_photo": "Ubah Foto",
        "set_semester": "Semester",
        "set_coins": "Koin",
        "set_total_xp": "Total XP",
        "theme_ocean": "Ocean Breeze",
        "theme_midnight": "Midnight Slate",
        "theme_amethyst": "Amethyst Dream",
        // Leaderboard
        "lb_title": "Peringkat Mahasiswa",
        "lb_angkatan": "Angkatan",
        "lb_no_data": "Belum ada data peringkat untuk angkatan ini.",
        "lb_others": "Peringkat Lainnya",
        "lb_no_others": "Belum ada peringkat tambahan.",
        // Shop
        "shop_title": "Toko Koin Mahasiswa",
        "shop_avatars": "Koleksi Avatar",
        "shop_vouchers": "Voucher Hadiah",
        "shop_tab_avatar": "Avatar",
        "shop_tab_voucher": "Voucher",
        "shop_cool_avatar": "Avatar keren",
        "shop_btn_buy": "Beli",
        "shop_btn_equip": "Gunakan",
        "shop_btn_equipped": "Digunakan",
        "shop_btn_claimed": "Ditukar",
        "shop_btn_claim": "Tukar",
        // Tugas / Assignments Page
        "tugas_active": "Tugas Aktif",
        "tugas_completed": "Selesai",
        "tugas_total_coins": "Total Koin",
        "tugas_tab": "Tugas",
        "tugas_history": "History",
        "tugas_select_course": "Pilih mata kuliah",
        "tugas_all_courses": "Semua Mata Kuliah",
        "tugas_sort_filter": "Urutkan & Filter",
        "sort_default": "Default",
        "sort_section_time": "Urutkan Nama & Waktu",
        "sort_name_asc": "Nama (A-Z)",
        "sort_name_desc": "Nama (Z-A)",
        "sort_open_asc": "Tanggal Buka (Terlama)",
        "sort_open_desc": "Tanggal Buka (Terbaru)",
        "sort_close_asc": "Batas Waktu (Terdekat)",
        "sort_close_desc": "Batas Waktu (Terlama)",
        "sort_section_status": "Filter Status",
        "sort_status_all": "Semua Status",
        "tugas_empty_active": "Belum ada tugas aktif yang perlu dikerjakan.",
        "tugas_empty_history": "Belum ada riwayat tugas.",
        "tugas_date_open": "Tanggal Buka",
        "tugas_date_close": "Batas Deadline",
        "btn_detail": "Detail",
        "btn_submit_task": "Kerjakan",
        "tugas_graded": "Dinilai",
        "tugas_completed_pending": "Selesai (Menunggu Nilai)",
        "tugas_missed": "Terlambat",
        "tugas_upload_file": "Unggah Berkas Tugas",
        "tugas_drop_zone": "Tarik & lepas berkas di sini atau klik untuk mencari",
        "tugas_supported_formats": "Mendukung format ZIP, RAR, PDF, atau DOCX (Maksimal 10MB)",
        "tugas_link_label": "Link Tautan Pengumpulan (Opsional)",
        "tugas_link_placeholder": "Contoh: https://github.com/username/repository-tugas",
        "tugas_link_helper": "Sertakan tautan repository GitHub atau Google Drive jika pengerjaan menggunakan kontrol versi.",
        "tugas_notes_label": "Catatan untuk Dosen",
        "tugas_notes_placeholder": "Tuliskan catatan pengerjaan tambahan di sini...",
        "tugas_btn_submit": "Kirim & Kumpulkan Jawaban",
        "detail_task_title": "Detail Tugas",
        "tugas_instruction": "Deskripsi Instruksi Pengerjaan:",
        "tugas_attachment": "Lampiran File Materi:",
        "tugas_success_title": "Tugas Berhasil Dikumpulkan!",
        "tugas_success_subtitle": "Luar biasa! Tugas Anda telah tersimpan secara aman di sistem.",
        "tugas_success_notice": "Tugas Anda telah berhasil dikirim dan sedang menunggu penilaian dari Dosen.",
        "tugas_btn_back": "Kembali ke Dashboard Tugas",
        // Attendance
        "pre_instruction": "Silakan pilih kelas mata kuliah aktif untuk melakukan presensi kehadiran hari ini.",
        "pre_search_placeholder": "Cari mata kuliah atau dosen...",
        "pre_all": "Semua",
        "pre_online": "Online",
        "pre_offline": "Offline",
        "pre_finished": "Selesai",
        "pre_empty_title": "Belum Ada Sesi Presensi Aktif",
        "pre_empty_desc": "Dosen pengampu Anda belum membuka sesi presensi kelas untuk saat ini. Silakan hubungi dosen bersangkutan.",
        "pre_gps_badge": "Validasi GPS Aktif (Radius Kampus)",
        "pre_btn_start": "Mulai Presensi",
        // Dosen Portal
        "lecturer_portal": "Portal Dosen",
        "card_make_task_title": "Buat Tugas",
        "card_make_task_desc": "Kelola dan buat penugasan baru untuk mahasiswa secara terorganisir.",
        "card_make_task_btn": "Kelola Tugas",
        "card_attendance_title": "Presensi",
        "card_attendance_desc": "Buka sesi kehadiran kelas baru dan awasi partisipasi mahasiswa secara instan.",
        "card_attendance_btn": "Mulai Presensi",
        "card_submission_title": "Pengumpulan",
        "card_submission_desc": "Periksa berkas jawaban tugas mahasiswa dan berikan feedback nilai secara instan.",
        "card_submission_btn": "Periksa Tugas",
        "card_leaderboard_title": "Leaderboard",
        "card_leaderboard_desc": "Pantau peringkat mahasiswa berdasarkan akumulasi XP dan pencapaian mereka.",
        "card_leaderboard_btn": "Lihat Peringkat",
        "dosen_btn_change_photo": "Ubah Foto Profil",
        "dosen_prodi": "Program Studi",
        "dosen_kepakaran": "Kepakaran / Keilmuan",
        "dosen_select_language": "Pilih bahasa",
        "dosen_btn_save": "Simpan",
        "dosen_btn_back": "Kembali",
        "dosen_change_password": "Ganti sandi",
        "dosen_old_password_placeholder": "Password lama",
        "dosen_new_password_placeholder": "Password baru",
        "dosen_select_theme": "Pilih tema",
        "dosen_lb_portal": "Portal Leaderboard Dosen",
        "dosen_btn_back_dashboard": "Kembali ke Dashboard",
        "dosen_filter_batch": "Filter Angkatan"
    },
    en: {
        "portal_title": "Student Portal",
        "sidebar_home": "Home",
        "sidebar_presensi": "Attendance",
        "sidebar_presensi_mhs": "Student Attendance",
        "sidebar_tugas": "Assignments",
        "sidebar_leaderboard": "Leaderboard",
        "sidebar_logout": "Logout",
        // Shared Headers
        "title_tugas": "Assignments",
        "title_toko_koin": "Coin Shop",
        "title_leaderboard": "Leaderboard",
        "title_pengaturan": "Settings",
        "title_presensi": "Attendance",
        "title_shop": "Shop",
        "title_settings": "Account Settings",
        "title_coins_exchange": "Your coin balance",
        "title_total_xp": "Your current XP points",
        // Dashboard
        "dash_semester": "Semester",
        "dash_koin": "Coins",
        "dash_xp": "Total XP",
        "dash_rank": "Rank",
        "dash_active_tasks": "Active Tasks",
        "dash_history_tasks": "Task History",
        "dash_shop": "Shop",
        "dash_settings": "Account Settings",
        // Settings
        "set_title": "Settings",
        "set_security": "Password & Security",
        "set_theme": "Theme",
        "set_lang": "Language",
        "set_faq": "Help (FAQ)",
        "set_logout": "Log out",
        "set_edit_photo": "Edit Photo",
        "set_semester": "Semester",
        "set_coins": "Coins",
        "set_total_xp": "Total XP",
        "theme_ocean": "Ocean Breeze",
        "theme_midnight": "Midnight Slate",
        "theme_amethyst": "Amethyst Dream",
        // Leaderboard
        "lb_title": "Student Rankings",
        "lb_angkatan": "Batch",
        "lb_no_data": "No ranking data available for this batch.",
        "lb_others": "Other Rankings",
        "lb_no_others": "No additional rankings yet.",
        // Shop
        "shop_title": "Student Coin Shop",
        "shop_avatars": "Avatar Collection",
        "shop_vouchers": "Gift Vouchers",
        "shop_tab_avatar": "Avatars",
        "shop_tab_voucher": "Vouchers",
        "shop_cool_avatar": "A cool",
        "shop_btn_buy": "Buy",
        "shop_btn_equip": "Equip",
        "shop_btn_equipped": "Equipped",
        "shop_btn_claimed": "Claimed",
        "shop_btn_claim": "Claim",
        // Tugas / Assignments Page
        "tugas_active": "Active Tasks",
        "tugas_completed": "Completed",
        "tugas_total_coins": "Total Coins",
        "tugas_tab": "Assignments",
        "tugas_history": "History",
        "tugas_select_course": "Select Course",
        "tugas_all_courses": "All Courses",
        "tugas_sort_filter": "Sort & Filter",
        "sort_default": "Default",
        "sort_section_time": "Sort by Name & Time",
        "sort_name_asc": "Name (A-Z)",
        "sort_name_desc": "Name (Z-A)",
        "sort_open_asc": "Open Date (Oldest)",
        "sort_open_desc": "Open Date (Newest)",
        "sort_close_asc": "Deadline (Nearest)",
        "sort_close_desc": "Deadline (Furthest)",
        "sort_section_status": "Filter by Status",
        "sort_status_all": "All Statuses",
        "tugas_empty_active": "No active assignments to work on.",
        "tugas_empty_history": "No assignment history available.",
        "tugas_date_open": "Open Date",
        "tugas_date_close": "Deadline",
        "btn_detail": "Details",
        "btn_submit_task": "Submit",
        "tugas_graded": "Graded",
        "tugas_completed_pending": "Submitted (Pending Grading)",
        "tugas_missed": "Missed",
        "tugas_upload_file": "Upload Assignment File",
        "tugas_drop_zone": "Drag & drop file here or click to browse",
        "tugas_supported_formats": "Supports ZIP, RAR, PDF, or DOCX (Max 10MB)",
        "tugas_link_label": "Submission URL Link (Optional)",
        "tugas_link_placeholder": "Example: https://github.com/username/assignment-repo",
        "tugas_link_helper": "Include GitHub repository or Google Drive link if version control is used.",
        "tugas_notes_label": "Notes for Lecturer",
        "tugas_notes_placeholder": "Write any additional notes here...",
        "tugas_btn_submit": "Submit Assignment",
        "detail_task_title": "Assignment Details",
        "tugas_instruction": "Instructions/Description:",
        "tugas_attachment": "Material Attachment:",
        "tugas_success_title": "Assignment Submitted Successfully!",
        "tugas_success_subtitle": "Awesome! Your assignment has been successfully stored in the system.",
        "tugas_success_notice": "Your assignment has been submitted and is currently awaiting grading from the lecturer.",
        "tugas_btn_back": "Back to Assignments",
        // Attendance
        "pre_instruction": "Please select an active course session to record your attendance for today.",
        "pre_search_placeholder": "Search course or lecturer...",
        "pre_all": "All",
        "pre_online": "Online",
        "pre_offline": "Offline",
        "pre_finished": "Finished",
        "pre_empty_title": "No Active Attendance Session",
        "pre_empty_desc": "Your lecturer has not opened the attendance session yet. Please contact your lecturer.",
        "pre_gps_badge": "GPS Validation Active (Campus Radius)",
        "pre_btn_start": "Start Attendance",
        // Dosen Portal
        "lecturer_portal": "Lecturer Portal",
        "card_make_task_title": "Create Assignment",
        "card_make_task_desc": "Manage and create new assignments for students in an organized way.",
        "card_make_task_btn": "Manage Assignments",
        "card_attendance_title": "Attendance",
        "card_attendance_desc": "Open a new class attendance session and monitor student participation instantly.",
        "card_attendance_btn": "Start Attendance",
        "card_submission_title": "Submissions",
        "card_submission_desc": "Review student assignment submission files and provide grading feedback instantly.",
        "card_submission_btn": "Review Assignments",
        "card_leaderboard_title": "Leaderboard",
        "card_leaderboard_desc": "Monitor student rankings based on accumulated XP and achievements.",
        "card_leaderboard_btn": "View Rankings",
        "dosen_btn_change_photo": "Change Profile Picture",
        "dosen_prodi": "Study Program",
        "dosen_kepakaran": "Expertise / Field",
        "dosen_select_language": "Select language",
        "dosen_btn_save": "Save",
        "dosen_btn_back": "Back",
        "dosen_change_password": "Change password",
        "dosen_old_password_placeholder": "Old password",
        "dosen_new_password_placeholder": "New password",
        "dosen_select_theme": "Select theme",
        "dosen_lb_portal": "Lecturer Leaderboard Portal",
        "dosen_btn_back_dashboard": "Back to Dashboard",
        "dosen_filter_batch": "Filter by Batch"
    }
};

window.getPortalLang = function() {
    return localStorage.getItem("portal_lang") || "id";
};

window.setPortalLang = function(lang) {
    localStorage.setItem("portal_lang", lang);
    document.cookie = "portal_lang=" + lang + "; path=/; max-age=31536000";
    applyPortalTranslations();
};

window.applyPortalTranslations = function() {
    const lang = window.getPortalLang();
    const translations = portalTranslations[lang] || portalTranslations["id"];
    
    // 1. Text elements
    document.querySelectorAll("[data-translate-id]").forEach(el => {
        const id = el.getAttribute("data-translate-id");
        if (translations[id]) {
            if (el.tagName === "INPUT" && (el.type === "button" || el.type === "submit")) {
                el.value = translations[id];
            } else {
                el.innerText = translations[id];
            }
        }
    });

    // 2. Title attributes
    document.querySelectorAll("[data-translate-title-id]").forEach(el => {
        const id = el.getAttribute("data-translate-title-id");
        if (translations[id]) {
            el.setAttribute("title", translations[id]);
        }
    });

    // 3. Placeholders
    document.querySelectorAll("[data-translate-placeholder-id]").forEach(el => {
        const id = el.getAttribute("data-translate-placeholder-id");
        if (translations[id]) {
            el.setAttribute("placeholder", translations[id]);
        }
    });
};

document.addEventListener("DOMContentLoaded", () => {
    const lang = localStorage.getItem("portal_lang") || "id";
    document.cookie = "portal_lang=" + lang + "; path=/; max-age=31536000";
    window.applyPortalTranslations();
});
