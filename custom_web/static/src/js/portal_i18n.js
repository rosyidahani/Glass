// Client-side translation system for Student and Lecturer Portal
const portalTranslations = {
    id: {
        "sidebar_home": "Home",
        "sidebar_presensi": "Presensi",
        "sidebar_presensi_mhs": "Presensi Mahasiswa",
        "sidebar_tugas": "Tugas",
        "sidebar_leaderboard": "Leaderboard",
        "sidebar_logout": "Logout",
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
        // Leaderboard
        "lb_title": "Peringkat Mahasiswa",
        "lb_angkatan": "Angkatan",
        "lb_no_data": "Belum ada data peringkat untuk angkatan ini.",
        // Shop
        "shop_title": "Toko Koin Mahasiswa",
        "shop_avatars": "Koleksi Avatar",
        "shop_vouchers": "Voucher Hadiah",
        "shop_btn_buy": "Beli",
        "shop_btn_equip": "Gunakan",
        "shop_btn_equipped": "Digunakan"
    },
    en: {
        "sidebar_home": "Home",
        "sidebar_presensi": "Attendance",
        "sidebar_presensi_mhs": "Student Attendance",
        "sidebar_tugas": "Assignments",
        "sidebar_leaderboard": "Leaderboard",
        "sidebar_logout": "Logout",
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
        "set_edit_photo": "Change Photo",
        "set_semester": "Semester",
        "set_coins": "Coins",
        "set_total_xp": "Total XP",
        // Leaderboard
        "lb_title": "Student Rankings",
        "lb_angkatan": "Batch",
        "lb_no_data": "No ranking data available for this batch.",
        // Shop
        "shop_title": "Student Coin Shop",
        "shop_avatars": "Avatar Collection",
        "shop_vouchers": "Gift Vouchers",
        "shop_btn_buy": "Buy",
        "shop_btn_equip": "Equip",
        "shop_btn_equipped": "Equipped"
    }
};

window.getPortalLang = function() {
    return localStorage.getItem("portal_lang") || "id";
};

window.setPortalLang = function(lang) {
    localStorage.setItem("portal_lang", lang);
    applyPortalTranslations();
};

window.applyPortalTranslations = function() {
    const lang = window.getPortalLang();
    const translations = portalTranslations[lang] || portalTranslations["id"];
    
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
};

document.addEventListener("DOMContentLoaded", () => {
    window.applyPortalTranslations();
});
