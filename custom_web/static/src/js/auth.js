function setRole(role) {
    var roleInput = document.getElementById('role_input');
    if (roleInput) {
        roleInput.value = role;
    }
    
    var btns = document.getElementsByClassName('role-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
    }
    
    var labelNim = document.getElementById('label_nim');
    var inputNim = document.getElementById('nim');
    
    if (role === 'mahasiswa') {
        if (labelNim) labelNim.innerText = 'NIM';
        if (inputNim) inputNim.placeholder = 'Masukkan NIM Anda';
        if (btns[0]) btns[0].classList.add('active');
    } else {
        if (labelNim) labelNim.innerText = 'NIP';
        if (inputNim) inputNim.placeholder = 'Masukkan NIP Anda';
        if (btns[1]) btns[1].classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    var btnLogin = document.querySelector('.btn-login');
    if (btnLogin && !document.querySelector('.forgot-password-wrapper')) {
        var wrapper = document.createElement('div');
        wrapper.className = 'forgot-password-wrapper';
        wrapper.style.cssText = 'text-align:center; margin-top:16px;';

        var link = document.createElement('a');
        link.href = '/lupa-password';
        link.className = 'forgot-password-link';
        link.style.cssText = 'display:inline-flex; align-items:center; gap:6px; color:#64748b; font-size:13px; font-weight:500; font-family:Outfit,sans-serif; text-decoration:none; padding:6px 12px; border-radius:8px; transition:all 0.25s ease;';
        link.innerHTML = '&#128274; Lupa Password?';

        link.addEventListener('mouseenter', function () {
            this.style.color = '#3b82f6';
            this.style.background = 'rgba(59,130,246,0.08)';
            this.style.textDecoration = 'underline';
        });
        link.addEventListener('mouseleave', function () {
            this.style.color = '#64748b';
            this.style.background = 'transparent';
            this.style.textDecoration = 'none';
        });

        wrapper.appendChild(link);
        btnLogin.insertAdjacentElement('afterend', wrapper);
    }
});
