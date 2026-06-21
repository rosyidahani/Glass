// Dynamic Modals and Features handler for Settings Page
document.addEventListener("DOMContentLoaded", () => {
    // Intercept settings items clicks
    const settingsItems = document.querySelectorAll(".settings-item");
    settingsItems.forEach(item => {
        const iconEl = item.querySelector(".item-icon i");
        if (!iconEl) return;

        item.addEventListener("click", (e) => {
            // If it is logout, let the default href (/logout) handle it
            if (item.classList.contains("logout-item") || item.getAttribute("href") === "/logout") {
                return;
            }
            e.preventDefault();

            if (iconEl.classList.contains("bi-shield-lock-fill")) {
                openPasswordModal();
            } else if (iconEl.classList.contains("bi-palette-fill")) {
                openThemeModal();
            } else if (iconEl.classList.contains("bi-translate")) {
                openLanguageModal();
            } else if (iconEl.classList.contains("bi-question-circle-fill")) {
                openFAQModal();
            }
        });
    });
});

// Helper to create and show a glassmorphic modal
function createModal(titleId, defaultTitle, contentHTML) {
    // Remove existing modal if any
    const existing = document.getElementById("settings-modal-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "settings-modal-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.25s ease;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        box-shadow: var(--card-shadow);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 24px;
        padding: 30px;
        width: 90%;
        max-width: 460px;
        position: relative;
        transform: translateY(20px);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        color: var(--text-color);
        box-sizing: border-box;
    `;

    // Title
    const header = document.createElement("h3");
    header.style.cssText = `
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 20px;
        font-weight: 800;
        color: var(--text-color);
        padding-right: 40px;
    `;
    header.setAttribute("data-translate-id", titleId);
    header.innerText = defaultTitle;

    // Content container
    const body = document.createElement("div");
    body.innerHTML = contentHTML;

    // Close button
    const closeBtn = document.createElement("span");
    closeBtn.id = "modal-close-btn";
    closeBtn.innerHTML = '<i class="bi bi-x-lg" style="pointer-events: none;"></i>';
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 15px;
        font-size: 20px;
        cursor: pointer;
        color: var(--text-muted);
        transition: color 0.2s, transform 0.2s;
        z-index: 1000;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        pointer-events: auto !important;
    `;
    closeBtn.addEventListener("mouseenter", () => {
        closeBtn.style.color = "var(--text-color)";
        closeBtn.style.transform = "scale(1.1)";
        closeBtn.style.background = "var(--accent-light)";
    });
    closeBtn.addEventListener("mouseleave", () => {
        closeBtn.style.color = "var(--text-muted)";
        closeBtn.style.transform = "scale(1)";
        closeBtn.style.background = "transparent";
    });
    closeBtn.onclick = function(e) {
        console.log("X button clicked!");
        e.stopPropagation();
        window.closeModal(overlay, modal);
    };

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Apply translations to the modal elements
    if (window.applyPortalTranslations) {
        window.applyPortalTranslations();
    }

    // Trigger transitions
    setTimeout(() => {
        overlay.style.opacity = "1";
        modal.style.transform = "translateY(0)";
    }, 10);

    // Close on overlay click
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            window.closeModal(overlay, modal);
        }
    };

    return { overlay, modal };
}

window.closeModal = function(overlay, modal) {
    if (!overlay || !modal) return;
    overlay.style.opacity = "0";
    modal.style.transform = "translateY(20px)";
    setTimeout(() => {
        overlay.remove();
    }, 250);
};

// Modal 1: Password & Security
function openPasswordModal() {
    const isEng = window.getPortalLang() === "en";
    const content = `
        <form id="change-password-form" style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-muted);" data-translate-id="lbl_old_pass">${isEng ? 'Current Password' : 'Password Lama'}</label>
                <input type="password" id="old-password" required style="padding: 12px; border-radius: 12px; border: 1px solid var(--card-border); background: rgba(255, 255, 255, 0.5); color: var(--text-color); font-size: 14px; outline: none;"/>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-muted);" data-translate-id="lbl_new_pass">${isEng ? 'New Password' : 'Password Baru'}</label>
                <input type="password" id="new-password" required style="padding: 12px; border-radius: 12px; border: 1px solid var(--card-border); background: rgba(255, 255, 255, 0.5); color: var(--text-color); font-size: 14px; outline: none;"/>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-muted);" data-translate-id="lbl_confirm_pass">${isEng ? 'Confirm New Password' : 'Konfirmasi Password Baru'}</label>
                <input type="password" id="confirm-password" required style="padding: 12px; border-radius: 12px; border: 1px solid var(--card-border); background: rgba(255, 255, 255, 0.5); color: var(--text-color); font-size: 14px; outline: none;"/>
            </div>
            <div id="password-alert" style="display: none; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500;"></div>
            <button type="submit" style="margin-top: 10px; padding: 14px; border-radius: 14px; border: none; background: var(--accent-color); color: #ffffff; font-weight: 700; font-size: 14px; cursor: pointer; transition: background 0.2s;" data-translate-id="btn_save_pass">${isEng ? 'Save Password' : 'Simpan Password'}</button>
        </form>
    `;

    const { overlay, modal } = createModal("set_security", "Sandi & Keamanan", content);

    const form = modal.querySelector("#change-password-form");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const oldPass = modal.querySelector("#old-password").value;
        const newPass = modal.querySelector("#new-password").value;
        const confirmPass = modal.querySelector("#confirm-password").value;
        const alertBox = modal.querySelector("#password-alert");

        if (newPass !== confirmPass) {
            alertBox.style.display = "block";
            alertBox.style.background = "rgba(239, 68, 68, 0.1)";
            alertBox.style.color = "#ef4444";
            alertBox.innerText = isEng ? "New passwords do not match!" : "Password baru tidak cocok!";
            return;
        }

        alertBox.style.display = "block";
        alertBox.style.background = "rgba(59, 130, 246, 0.1)";
        alertBox.style.color = "#3b82f6";
        alertBox.innerText = isEng ? "Processing..." : "Memproses...";

        fetch("/api/settings/change_password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                old_password: oldPass,
                new_password: newPass
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                alertBox.style.background = "rgba(16, 185, 129, 0.1)";
                alertBox.style.color = "#10b981";
                alertBox.innerText = isEng ? "Password successfully changed!" : "Password berhasil diubah!";
                setTimeout(() => window.closeModal(overlay, modal), 1500);
            } else {
                alertBox.style.background = "rgba(239, 68, 68, 0.1)";
                alertBox.style.color = "#ef4444";
                alertBox.innerText = data.message || (isEng ? "Failed to change password." : "Gagal mengubah password.");
            }
        })
        .catch(() => {
            alertBox.style.background = "rgba(239, 68, 68, 0.1)";
            alertBox.style.color = "#ef4444";
            alertBox.innerText = isEng ? "Connection error." : "Kesalahan koneksi.";
        });
    });
}

// Modal 2: Theme Selector
function openThemeModal() {
    const isEng = window.getPortalLang() === "en";
    const currentTheme = localStorage.getItem("portal_theme") || "ocean";

    const content = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div class="theme-card ${currentTheme === 'ocean' ? 'active-theme' : ''}" onclick="selectTheme('ocean')" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 16px; border: 2px solid ${currentTheme === 'ocean' ? 'var(--accent-color)' : 'var(--card-border)'}; background: rgba(255, 255, 255, 0.1); cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #60a5fa);"></div>
                    <span style="font-weight: 600;" data-translate-id="theme_ocean">Ocean Breeze</span>
                </div>
                ${currentTheme === 'ocean' ? '<i class="bi bi-check-circle-fill" style="color: var(--accent-color); font-size: 18px;"></i>' : ''}
            </div>
            <div class="theme-card ${currentTheme === 'midnight' ? 'active-theme' : ''}" onclick="selectTheme('midnight')" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 16px; border: 2px solid ${currentTheme === 'midnight' ? 'var(--accent-color)' : 'var(--card-border)'}; background: rgba(255, 255, 255, 0.05); cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #0f172a, #1e293b);"></div>
                    <span style="font-weight: 600;" data-translate-id="theme_midnight">Midnight Slate</span>
                </div>
                ${currentTheme === 'midnight' ? '<i class="bi bi-check-circle-fill" style="color: var(--accent-color); font-size: 18px;"></i>' : ''}
            </div>
            <div class="theme-card ${currentTheme === 'amethyst' ? 'active-theme' : ''}" onclick="selectTheme('amethyst')" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 16px; border: 2px solid ${currentTheme === 'amethyst' ? 'var(--accent-color)' : 'var(--card-border)'}; background: rgba(255, 255, 255, 0.05); cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #a78bfa);"></div>
                    <span style="font-weight: 600;" data-translate-id="theme_amethyst">Amethyst Dream</span>
                </div>
                ${currentTheme === 'amethyst' ? '<i class="bi bi-check-circle-fill" style="color: var(--accent-color); font-size: 18px;"></i>' : ''}
            </div>
        </div>
    `;

    createModal("set_theme", "Tema", content);
}

window.selectTheme = function(theme) {
    localStorage.setItem("portal_theme", theme);
    document.documentElement.className = "theme-" + theme;
    
    // Close modal and reopen to update checkboxes
    const overlay = document.getElementById("settings-modal-overlay");
    if (overlay) {
        overlay.remove();
    }
    openThemeModal();
};

// Modal 3: Language Selector
function openLanguageModal() {
    const currentLang = window.getPortalLang();

    const content = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div onclick="selectLanguage('id')" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 16px; border: 2px solid ${currentLang === 'id' ? 'var(--accent-color)' : 'var(--card-border)'}; background: rgba(255, 255, 255, 0.05); cursor: pointer; transition: all 0.2s;">
                <span style="font-weight: 600;">Bahasa Indonesia</span>
                ${currentLang === 'id' ? '<i class="bi bi-check-circle-fill" style="color: var(--accent-color); font-size: 18px;"></i>' : ''}
            </div>
            <div onclick="selectLanguage('en')" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 16px; border: 2px solid ${currentLang === 'en' ? 'var(--accent-color)' : 'var(--card-border)'}; background: rgba(255, 255, 255, 0.05); cursor: pointer; transition: all 0.2s;">
                <span style="font-weight: 600;">English</span>
                ${currentLang === 'en' ? '<i class="bi bi-check-circle-fill" style="color: var(--accent-color); font-size: 18px;"></i>' : ''}
            </div>
        </div>
    `;

    createModal("set_lang", "Bahasa", content);
}

window.selectLanguage = function(lang) {
    window.setPortalLang(lang);
    
    const overlay = document.getElementById("settings-modal-overlay");
    if (overlay) {
        overlay.remove();
    }
    // Reload page to re-initialize and apply full translations
    location.reload();
};

// Modal 4: Bantuan (faq)
function openFAQModal() {
    const isEng = window.getPortalLang() === "en";
    
    const faqs = isEng ? [
        {
            q: "How do I submit an assignment?",
            a: "Go to the 'Assignments' menu, select an active assignment, upload your file response, and click 'Submit'."
        },
        {
            q: "How do I earn XP and Coins?",
            a: "You earn XP and Coins by successfully submitting assignments on time and attending your registered classes."
        },
        {
            q: "How do I redeem my Coins?",
            a: "Go to the 'Shop' page from your main dashboard to exchange your coins for gorgeous custom avatars or gift vouchers."
        },
        {
            q: "What is Device Binding?",
            a: "To prevent cheating, your student account is bound to your primary device when checking attendance. Contact your lecturer to reset your binding if you change devices."
        }
    ] : [
        {
            q: "Bagaimana cara mengumpulkan tugas?",
            a: "Masuk ke menu 'Tugas', pilih tugas yang aktif, unggah berkas jawaban Anda, lalu klik tombol 'Kumpulkan'."
        },
        {
            q: "Bagaimana cara mendapatkan XP & Koin?",
            a: "Anda akan mendapatkan XP dan Koin secara otomatis dengan mengumpulkan tugas sebelum tenggat waktu serta melakukan presensi kelas tepat waktu."
        },
        {
            q: "Bagaimana cara menukarkan Koin?",
            a: "Kunjungi halaman 'Toko' dari dashboard utama untuk menukarkan akumulasi koin Anda dengan koleksi avatar premium atau voucher hadiah."
        },
        {
            q: "Apa itu Device Binding?",
            a: "Untuk mencegah kecurangan, akun mahasiswa Anda diikat pada perangkat pertama yang digunakan saat absen. Hubungi dosen untuk meriset binding jika Anda berganti perangkat."
        }
    ];

    let faqHTML = `<div style="display: flex; flex-direction: column; gap: 14px; max-height: 60vh; overflow-y: auto; padding-right: 4px;">`;
    faqs.forEach((faq, index) => {
        faqHTML += `
            <div style="border-bottom: 1px solid var(--card-border); padding-bottom: 12px;">
                <div onclick="toggleFaq(${index})" style="display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 14px; cursor: pointer; color: var(--text-color); gap: 10px;">
                    <span>${faq.q}</span>
                    <i id="faq-icon-${index}" class="bi bi-chevron-down" style="font-size: 12px; transition: transform 0.2s;"></i>
                </div>
                <div id="faq-ans-${index}" style="display: none; margin-top: 8px; font-size: 13px; line-height: 1.5; color: var(--text-muted);">
                    ${faq.a}
                </div>
            </div>
        `;
    });
    faqHTML += `</div>`;

    createModal("set_faq", "Bantuan (faq)", faqHTML);
}

window.toggleFaq = function(index) {
    const ans = document.getElementById(`faq-ans-${index}`);
    const icon = document.getElementById(`faq-icon-${index}`);
    if (ans.style.display === "none") {
        ans.style.display = "block";
        icon.style.transform = "rotate(180deg)";
    } else {
        ans.style.display = "none";
        icon.style.transform = "rotate(0deg)";
    }
};

// Global fallback click listener to ensure modal closes under any circumstances
document.addEventListener("click", function(e) {
    const target = e.target;
    
    // Check close button click (either the span wrapper or the icon itself)
    if (target.closest("#modal-close-btn") || target.closest(".bi-x-lg")) {
        console.log("Global close click intercepted.");
        const overlay = document.getElementById("settings-modal-overlay");
        if (overlay) {
            const modal = overlay.querySelector("div");
            if (window.closeModal) {
                window.closeModal(overlay, modal);
            } else {
                overlay.remove();
            }
        }
        return;
    }
    
    // Check backdrop click
    if (target.id === "settings-modal-overlay") {
        console.log("Global backdrop click intercepted.");
        const modal = target.querySelector("div");
        if (window.closeModal) {
            window.closeModal(target, modal);
        } else {
            target.remove();
        }
    }
});
