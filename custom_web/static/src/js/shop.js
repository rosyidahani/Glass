/* JAVASCRIPT LOGIK UNTUK TOKO REWARD / SHOP MAHASISWA */

// Inisialisasi State dari LocalStorage / Default values
let studentState = {
    coins: 0,
    ownedAvatars: ['avatar_default_character_l'],
    equippedAvatar: 'avatar_default_character_l',
    claimedVouchers: []
};

// Data list yang ada di toko (Dibaca secara dinamis dari database Odoo)
function getAvatarData() {
    return window.avatarData || {
        'avatar_default_character_l': { name: 'Default Character L', price: 0, img: '/custom_web/static/src/img/avatar_default_character_l.png' },
        'char_cyber': { name: 'Cyber Ninja', price: 15, img: '/custom_web/static/src/img/char_cyber.png' },
        'char_royal': { name: 'Cendekiawan Kerajaan', price: 30, img: '/custom_web/static/src/img/char_royal.png' },
        'char_neon': { name: 'Hacker Neon', price: 50, img: '/custom_web/static/src/img/char_neon.png' }
    };
}

function getVoucherData() {
    return window.voucherData || {
        'v_wifi': { name: 'Akses WiFi Cepat Kampus (24 Jam)', price: 5, prefix: 'WIF' },
        'v_canteen': { name: 'Kupon Makan Kantin Rp 10.000', price: 12, prefix: 'CAN' },
        'v_library': { name: 'Bebas Denda Buku Perpustakaan (1x)', price: 15, prefix: 'LIB' },
        'v_print': { name: 'Cetak Gratis Tugas 50 Lembar', price: 20, prefix: 'PRT' }
    };
}

// Modal handlers
let activeModal = null;

// Helper to perform Odoo JSON-RPC call
async function fetchJsonRpc(url, params = {}) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: params
            })
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.data ? data.error.data.message : data.error.message);
        }
        return data.result;
    } catch (err) {
        console.error("JSON-RPC Error:", err);
        throw err;
    }
}

// Menginisialisasi toko saat dokumen dimuat
document.addEventListener('DOMContentLoaded', async function() {
    await initShopState();
    setupEventListeners();
    updateShopUI();
    
    // Perbarui gambar karakter di halaman dashboard jika ada di halaman dashboard
    syncDashboardAvatar();
});

// Sync data koin & item dari HTML dan LocalStorage (Fallback ke LocalStorage jika gagal)
async function initShopState() {
    // Cari elemen penampung koin bawaan Odoo
    const coinEl = document.getElementById('raw-student-coins');
    const initialCoins = coinEl ? parseInt(coinEl.textContent.trim()) || 0 : 0;
    
    try {
        const state = await fetchJsonRpc('/api/shop/state');
        if (state && state.status === 'success') {
            studentState.coins = state.coins;
            studentState.ownedAvatars = state.ownedAvatars;
            studentState.equippedAvatar = state.equippedAvatar;
            studentState.claimedVouchers = state.claimedVouchers;
            
            // Sync ke local storage untuk fallback / dashboard render jika offline
            localStorage.setItem('student_coins', studentState.coins);
            localStorage.setItem('owned_avatars', JSON.stringify(studentState.ownedAvatars));
            localStorage.setItem('equipped_avatar', studentState.equippedAvatar);
            localStorage.setItem('claimed_vouchers', JSON.stringify(studentState.claimedVouchers));
            return;
        }
    } catch (e) {
        console.warn("Backend shop state tidak tersedia, beralih ke LocalStorage:", e);
    }
    
    // Fallback logic jika server error / offline
    if (localStorage.getItem('student_coins') === null) {
        localStorage.setItem('student_coins', initialCoins);
        studentState.coins = initialCoins;
    } else {
        studentState.coins = parseInt(localStorage.getItem('student_coins'));
    }
    
    if (localStorage.getItem('owned_avatars') === null) {
        localStorage.setItem('owned_avatars', JSON.stringify(studentState.ownedAvatars));
    } else {
        studentState.ownedAvatars = JSON.parse(localStorage.getItem('owned_avatars'));
    }
    
    if (localStorage.getItem('equipped_avatar') === null) {
        localStorage.setItem('equipped_avatar', studentState.equippedAvatar);
    } else {
        studentState.equippedAvatar = localStorage.getItem('equipped_avatar');
    }
    
    if (localStorage.getItem('claimed_vouchers') === null) {
        localStorage.setItem('claimed_vouchers', JSON.stringify(studentState.claimedVouchers));
    } else {
        studentState.claimedVouchers = JSON.parse(localStorage.getItem('claimed_vouchers'));
    }
}

// Menghubungkan fungsi klik ke tombol-tombol
function setupEventListeners() {
    // Delegasi klik tombol beli / pakai avatar
    const avatarGrid = document.querySelector('.avatar-grid');
    if (avatarGrid) {
        avatarGrid.addEventListener('click', function(e) {
            const btn = e.target.closest('.avatar-action-btn');
            if (!btn) return;
            
            const avatarId = btn.getAttribute('data-id');
            if (btn.classList.contains('btn-buy')) {
                showPurchaseConfirmModal('avatar', avatarId);
            } else if (btn.classList.contains('btn-equip')) {
                equipAvatar(avatarId);
            }
        });
    }

    // Delegasi klik tombol tukar voucher
    const voucherList = document.querySelector('.voucher-list');
    if (voucherList) {
        voucherList.addEventListener('click', function(e) {
            const btn = e.target.closest('.voucher-action-btn');
            if (!btn || btn.classList.contains('btn-claimed')) return;
            
            const voucherId = btn.getAttribute('data-id');
            showPurchaseConfirmModal('voucher', voucherId);
        });
    }
}

// Mengalihkan tab toko
function switchShopTab(tabName) {
    // Saring tombol aktif
    document.querySelectorAll('.shop-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeTabBtn = document.getElementById(`tab-${tabName}-btn`);
    if (activeTabBtn) activeTabBtn.classList.add('active');
    
    // Tampilkan panel aktif
    document.querySelectorAll('.shop-pane').forEach(pane => pane.classList.remove('active'));
    const activePane = document.getElementById(`shop-${tabName}-pane`);
    if (activePane) activePane.classList.add('active');
}

// Sinkronisasi data di tampilan
function updateShopUI() {
    const lang = localStorage.getItem("portal_lang") || "id";
    const isEng = lang === 'en';

    // Update koin di topbar dan bagian stat lain
    const coinDisplays = document.querySelectorAll('.sync-coins');
    coinDisplays.forEach(el => {
        const amountEl = el.querySelector('.student-coins-amount');
        if (amountEl) {
            amountEl.textContent = studentState.coins;
        } else {
            el.innerHTML = `<i class="bi bi-coin"></i> <span class="student-coins-amount">${studentState.coins}</span> <span data-translate-id="dash_koin">${isEng ? 'Coins' : 'Poin'}</span>`;
            if (window.applyPortalTranslations) window.applyPortalTranslations();
        }
    });
    
    // Update koin di dashboard top-hud
    const dashboardCoinPill = document.querySelector('.coin-pill');
    if (dashboardCoinPill) {
        const amountEl = dashboardCoinPill.querySelector('.student-coins-amount');
        if (amountEl) {
            amountEl.textContent = studentState.coins;
        } else {
            dashboardCoinPill.innerHTML = `<i class="bi bi-coin"></i> <span class="student-coins-amount">${studentState.coins}</span> <span data-translate-id="dash_koin">${isEng ? 'Coins' : 'Poin'}</span>`;
            if (window.applyPortalTranslations) window.applyPortalTranslations();
        }
    }

    // Update status kartu avatar
    document.querySelectorAll('.avatar-card').forEach(card => {
        const avatarId = card.getAttribute('data-id');
        const actionBtn = card.querySelector('.avatar-action-btn');
        
        card.classList.remove('equipped-active');
        
        if (studentState.equippedAvatar === avatarId) {
            card.classList.add('equipped-active');
            actionBtn.className = 'avatar-action-btn btn-equipped';
            actionBtn.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${isEng ? 'Equipped' : 'Digunakan'}`;
        } else if (studentState.ownedAvatars.includes(avatarId)) {
            actionBtn.className = 'avatar-action-btn btn-equip';
            actionBtn.innerHTML = `<i class="bi bi-person-fill-check"></i> ${isEng ? 'Equip' : 'Gunakan'}`;
        } else {
            actionBtn.className = 'avatar-action-btn btn-buy';
            actionBtn.setAttribute('data-id', avatarId);
            const aData = getAvatarData()[avatarId] || { price: 0 };
            actionBtn.innerHTML = `<i class="bi bi-coin"></i> ${isEng ? 'Buy' : 'Beli'} ${aData.price}`;
        }
    });

    // Update status tombol voucher
    document.querySelectorAll('.voucher-card').forEach(card => {
        const voucherId = card.getAttribute('data-id');
        const actionBtn = card.querySelector('.voucher-action-btn');
        
        if (studentState.claimedVouchers.includes(voucherId)) {
            actionBtn.className = 'voucher-action-btn btn-claimed';
            actionBtn.innerHTML = isEng ? 'Claimed' : 'Ditukar';
            actionBtn.disabled = true;
        } else {
            actionBtn.className = 'voucher-action-btn btn-claim';
            actionBtn.innerHTML = isEng ? 'Claim' : 'Tukar';
            actionBtn.disabled = false;
        }
    });
}

// Gunakan avatar
async function equipAvatar(avatarId) {
    if (!studentState.ownedAvatars.includes(avatarId)) return;
    const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
    
    try {
        const res = await fetchJsonRpc('/api/shop/equip', { avatar_code: avatarId });
        if (res && res.status === 'success') {
            studentState.equippedAvatar = avatarId;
            localStorage.setItem('equipped_avatar', avatarId);
            updateShopUI();
            showToast(isEng ? 'Avatar equipped successfully!' : 'Avatar berhasil dipasang!', 'success');
            syncDashboardAvatar();
        } else {
            showToast(res.message || (isEng ? 'Failed to change avatar on server.' : 'Gagal mengubah avatar di server.'), 'error');
        }
    } catch (e) {
        // Fallback jika API gagal
        studentState.equippedAvatar = avatarId;
        localStorage.setItem('equipped_avatar', avatarId);
        updateShopUI();
        showToast(isEng ? 'Avatar equipped locally (offline).' : 'Avatar dipasang lokal (offline).', 'info');
        syncDashboardAvatar();
    }
}

// Sinkronisasi karakter di dashboard utama
function syncDashboardAvatar() {
    // Biarkan server-side rendering dari Odoo (dashboard.xml) yang menentukan gambar karakter
    // karena seluruh gambar avatar tersimpan dan dilayani secara biner langsung dari database.
    return;
}

// Menampilkan Toast Notifikasi
function showToast(message, type = 'info') {
    let container = document.getElementById('shop-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'shop-toast-container';
        container.className = 'shop-toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `shop-toast toast-${type}`;
    
    let icon = '<i class="bi bi-info-circle-fill"></i>';
    if (type === 'success') icon = '<i class="bi bi-check-circle-fill" style="color: #10b981;"></i>';
    if (type === 'error') icon = '<i class="bi bi-exclamation-triangle-fill" style="color: #ef4444;"></i>';
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate3d(0, -15px, 0) scale(0.9)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Buka Modal Konfirmasi
function showPurchaseConfirmModal(itemType, itemId) {
    closeModal();
    const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
    
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'shop-modal-overlay';
    modalOverlay.id = 'shop-modal-confirm';
    
    let title, text, price;
    if (itemType === 'avatar') {
        const item = getAvatarData()[itemId] || { name: 'Avatar', price: 0 };
        title = isEng ? 'Redeem Avatar' : 'Tukar Avatar';
        text = isEng ? 
            `Are you sure you want to exchange <strong>${item.price} Coins</strong> to get the <strong>${item.name}</strong> avatar?` : 
            `Apakah Anda yakin ingin menukar <strong>${item.price} Koin</strong> untuk mendapatkan avatar <strong>${item.name}</strong>?`;
        price = item.price;
    } else {
        const item = getVoucherData()[itemId] || { name: 'Voucher', price: 0 };
        title = isEng ? 'Redeem Voucher' : 'Tukar Voucher';
        text = isEng ? 
            `Are you sure you want to exchange <strong>${item.price} Coins</strong> for the <strong>${item.name}</strong> voucher?` : 
            `Apakah Anda yakin ingin menukar <strong>${item.price} Koin</strong> untuk voucher <strong>${item.name}</strong>?`;
        price = item.price;
    }
    
    modalOverlay.innerHTML = `
        <div class="shop-modal glass-panel">
            <div class="shop-modal-body">
                <div class="shop-modal-icon icon-amber">
                    <i class="bi bi-coin"></i>
                </div>
                <h3 class="shop-modal-title">${title}</h3>
                <p class="shop-modal-text">${text}</p>
                <div class="shop-modal-actions">
                    <button class="shop-modal-btn btn-cancel" onclick="closeModal()">${isEng ? 'Cancel' : 'Batal'}</button>
                    <button class="shop-modal-btn btn-confirm" onclick="processPurchase('${itemType}', '${itemId}', ${price})">${isEng ? 'Redeem Now' : 'Tukar Sekarang'}</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    activeModal = modalOverlay;
}

// Proses Pembelian / Pengurangan Koin
async function processPurchase(itemType, itemId, price) {
    closeModal();
    const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
    
    // Cek saldo koin
    if (studentState.coins < price) {
        showToast(isEng ? 'Your coins are insufficient for this redemption!' : 'Koin Anda tidak mencukupi untuk melakukan penukaran ini!', 'error');
        return;
    }
    
    try {
        const res = await fetchJsonRpc('/api/shop/buy', { item_code: itemId });
        if (res && res.status === 'success') {
            studentState.coins = res.coins;
            localStorage.setItem('student_coins', studentState.coins);
            
            // Tambahkan item ke list kepemilikan
            if (itemType === 'avatar') {
                studentState.ownedAvatars.push(itemId);
                localStorage.setItem('owned_avatars', JSON.stringify(studentState.ownedAvatars));
                showPurchaseSuccessModal(itemType, itemId);
            } else {
                studentState.claimedVouchers.push(itemId);
                localStorage.setItem('claimed_vouchers', JSON.stringify(studentState.claimedVouchers));
                showPurchaseSuccessModal(itemType, itemId, res.code_generated);
            }
            updateShopUI();
        } else {
            showToast(res.message || (isEng ? 'Transaction failed on server.' : 'Transaksi gagal di server.'), 'error');
        }
    } catch (e) {
        showToast(isEng ? 'Failed to connect to server to process transaction.' : 'Gagal terhubung ke server untuk memproses transaksi.', 'error');
    }
}

// Tampilkan Modal Berhasil Tukar
function showPurchaseSuccessModal(itemType, itemId, serverCode = '') {
    const isEng = (localStorage.getItem("portal_lang") || "id") === 'en';
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'shop-modal-overlay';
    modalOverlay.id = 'shop-modal-success';
    
    let title, text, couponBox = '';
    
    if (itemType === 'avatar') {
        const item = getAvatarData()[itemId] || { name: 'Avatar' };
        title = isEng ? 'Redeem Successful!' : 'Penukaran Berhasil!';
        text = isEng ? 
            `Congratulations! The <strong>${item.name}</strong> avatar is now yours. You can equip it directly from the dashboard.` : 
            `Selamat! Avatar <strong>${item.name}</strong> sekarang milik Anda. Anda dapat langsung menggunakannya di dashboard.`;
    } else {
        const item = getVoucherData()[itemId] || { name: 'Voucher', prefix: 'VOU' };
        const displayCode = serverCode || `${item.prefix}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;
        title = isEng ? 'Voucher Claimed!' : 'Voucher Didapatkan!';
        text = isEng ? 
            `Here is the coupon code for your <strong>${item.name}</strong> voucher. Save or show this code to redeem it:` : 
            `Berikut adalah kode kupon untuk voucher <strong>${item.name}</strong> Anda. Simpan atau tunjukkan kode ini untuk menggunakannya:`;
        couponBox = `<div class="coupon-code-box">${displayCode}</div>`;
    }
    
    modalOverlay.innerHTML = `
        <div class="shop-modal glass-panel">
            <div class="shop-modal-body">
                <div class="shop-modal-icon icon-success">
                    <i class="bi bi-gift-fill"></i>
                </div>
                <h3 class="shop-modal-title">${title}</h3>
                <p class="shop-modal-text">${text}</p>
                ${couponBox}
                <div class="shop-modal-actions">
                    <button class="shop-modal-btn btn-close" onclick="closeModal()">${isEng ? 'Awesome' : 'Mantap'}</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    activeModal = modalOverlay;
}

// Tutup Modal Aktif
function closeModal() {
    if (activeModal) {
        activeModal.remove();
        activeModal = null;
    }
}
