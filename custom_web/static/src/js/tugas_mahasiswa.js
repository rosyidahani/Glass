document.addEventListener('DOMContentLoaded', function() {
    var formKumpul = document.getElementById('form-kumpul-tugas');
    
    if (formKumpul) {
        formKumpul.addEventListener('submit', function(e) {
            e.preventDefault();
            submitTugasMahasiswa(this);
        });
        
        // Logika untuk menampilkan/menyembunyikan input sesuai tipe pengumpulan (Link / File ZIP)
        var tipeFileInputs = document.querySelectorAll('input[name="tipe_file"]');
        tipeFileInputs.forEach(function(radio) {
            radio.addEventListener('change', function() {
                var wrapperFile = document.getElementById('wrapper-file');
                var wrapperLink = document.getElementById('wrapper-link');
                
                if (this.value === 'zip') {
                    if (wrapperFile) wrapperFile.classList.remove('hidden');
                    if (wrapperLink) wrapperLink.classList.add('hidden');
                } else {
                    if (wrapperFile) wrapperFile.classList.add('hidden');
                    if (wrapperLink) wrapperLink.classList.remove('hidden');
                }
            });
        });
    }
});

function submitTugasMahasiswa(formElement) {
    var submitBtn = document.getElementById('btn-submit-tugas');
    var formData = new FormData(formElement);
    var tipeFile = formData.get('tipe_file');
    
    // Validasi basic pada frontend
    if (tipeFile === 'zip') {
        var fileInput = formData.get('file_jawaban');
        if (!fileInput || !fileInput.name) {
            showToast('Peringatan', 'Harap pilih file (ZIP/PDF) untuk diunggah!', 'bi-exclamation-triangle-fill text-warning');
            return;
        }
    } else if (tipeFile === 'link') {
        if (!formData.get('link_jawaban').trim()) {
            showToast('Peringatan', 'Harap isi tautan (Link) tugas Anda!', 'bi-exclamation-triangle-fill text-warning');
            return;
        }
    }

    // Animasi Loading
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Mengunggah...';
    }

    fetch('/api/tugas/kumpul', {
        method: 'POST',
        // Catatan: Tidak perlu mengatur header Content-Type secara manual.
        // Fetch API akan mengatur otomatis menjadi 'multipart/form-data' dengan batasnya.
        body: formData 
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showToast('Sukses!', 'Tugas Anda berhasil dikumpulkan.', 'bi-check-circle-fill text-success');
            setTimeout(() => {
                window.location.reload(); // Muat ulang agar tampil status "Sudah Dikumpulkan"
            }, 1500);
        } else {
            showToast('Gagal', data.message || 'Terjadi kesalahan pada server.', 'bi-x-circle-fill text-danger');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Kumpulkan Tugas';
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Koneksi Terputus', 'Gagal terhubung ke server.', 'bi-wifi-off text-danger');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Kumpulkan Tugas';
        }
    });
}