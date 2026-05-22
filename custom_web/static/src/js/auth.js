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
