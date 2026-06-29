// Centralized JS untuk setting dosen
// Saat ini: implementasi upload foto profil dan submit preferensi tema/bahasa + ganti sandi.

function postJSON(url, payload) {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(function (res) {
        return res.json();
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Pre-select current language radio button
    var savedLang = localStorage.getItem("portal_lang") || "id";
    var langRadio = document.querySelector('input[name="bahasa_preference"][value="' + savedLang + '"]');
    if (langRadio) {
        langRadio.checked = true;
    }

    // Foto profil
    var formPhoto = document.getElementById('form_upload_foto_dosen');

    if (formPhoto) {
        formPhoto.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = document.getElementById('foto_profil_input');
            if (!input || !input.files || !input.files[0]) {
                alert('Pilih file foto dulu.');
                return;
            }

            var file = input.files[0];
            var reader = new FileReader();
            reader.onload = function () {
                // reader result: data URL; ambil base64 setelah koma
                var dataUrl = reader.result;
                var base64 = dataUrl.split(',')[1] || '';

                postJSON('/api/dosen/settings/upload-foto', {
                    foto_base64: base64,
                    filename: file.name || ''
                }).then(function (json) {
                    if (json && json.status === 'success') {
                        alert('Foto profil berhasil diupdate.');
                        window.location.reload();
                    } else {
                        alert(json.message || 'Gagal update foto profil.');
                    }
                }).catch(function (err) {
                    console.error(err);
                    alert('Error: ' + err.message);
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // Tema
    var formTheme = document.getElementById('form_set_tema');
    if (formTheme) {
        formTheme.addEventListener('submit', function (e) {
            e.preventDefault();
            var tema = document.querySelector('input[name="tema_preference"]:checked');
            tema = tema ? tema.value : '';
            if (!tema) {
                alert('Pilih tema.');
                return;
            }
            postJSON('/api/dosen/settings/set-tema', { tema_preference: tema }).then(function (json) {
                if (json && json.status === 'success') {
                    alert('Tema berhasil disimpan.');
                    window.location.reload();
                } else {
                    alert(json.message || 'Gagal menyimpan tema.');
                }
            });
        });
    }

    // Bahasa
    var formLang = document.getElementById('form_set_bahasa');
    if (formLang) {
        formLang.addEventListener('submit', function (e) {
            e.preventDefault();
            var bahasa = document.querySelector('input[name="bahasa_preference"]:checked');
            bahasa = bahasa ? bahasa.value : '';
            var lang = localStorage.getItem("portal_lang") || "id";
            if (!bahasa) {
                alert(lang === 'en' ? 'Please select a language.' : 'Pilih bahasa.');
                return;
            }
            postJSON('/api/dosen/settings/set-bahasa', { bahasa_preference: bahasa }).then(function (json) {
                if (json && json.status === 'success') {
                    localStorage.setItem("portal_lang", bahasa);
                    document.cookie = "portal_lang=" + bahasa + "; path=/; max-age=31536000";
                    alert(bahasa === 'en' ? 'Language preference saved successfully.' : 'Bahasa berhasil disimpan.');
                    window.location.reload();
                } else {
                    alert(json.message || (lang === 'en' ? 'Failed to save language preference.' : 'Gagal menyimpan bahasa.'));
                }
            });
        });
    }


    // Sandi
    var formPassword = document.getElementById('form_ganti_sandi');

    // FAQ
    var formFaq = document.getElementById('form_faq_dosen');
    if (formFaq) {
        formFaq.addEventListener('submit', function (e) {
            e.preventDefault();

            var tentang = document.querySelector('textarea[name="faq_tentang"]');
            var penggunaan = document.querySelector('textarea[name="faq_penggunaan"]');

            var tentangVal = tentang ? tentang.value : '';
            var penggunaanVal = penggunaan ? penggunaan.value : '';

            postJSON('/api/dosen/settings/set-faq', {
                faq_tentang: tentangVal,
                faq_penggunaan: penggunaanVal
            }).then(function (json) {
                if (json && json.status === 'success') {
                    alert('FAQ berhasil disimpan.');
                    window.location.reload();
                } else {
                    alert(json.message || 'Gagal menyimpan FAQ.');
                }
            });
        });
    }

    if (formPassword) {
        formPassword.addEventListener('submit', function (e) {
            e.preventDefault();
            var oldPass = document.getElementById('old_password');
            var newPass = document.getElementById('new_password');
            if (!oldPass || !newPass) return;
            if (!newPass.value || newPass.value.length < 4) {
                alert('Password baru terlalu pendek.');
                return;
            }
            postJSON('/api/dosen/settings/ganti-sandi', {
                old_password: oldPass.value,
                new_password: newPass.value
            }).then(function (json) {
                if (json && json.status === 'success') {
                    alert('Sandi berhasil diubah.');
                    window.location.reload();
                } else {
                    alert(json.message || 'Gagal mengubah sandi.');
                }
            });
        });
    }
});

