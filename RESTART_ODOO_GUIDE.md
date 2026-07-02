# 🚀 PANDUAN MANUAL RESTART ODOO SERVICE

Masalah: Odoo belum reload file auth.py yang ter-update dengan psycopg2 direct OTP generation.

## Opsi 1: Gunakan Windows Services GUI (PALING MUDAH)

1. **Tekan tombol `Win + R`** (atau buka Run)
2. **Ketik: `services.msc`** dan tekan Enter
3. **Cari service bernama: "odoo-server-17.0"**
4. **Klik kanan → "Restart"**
5. **Tunggu hingga status berubah menjadi "Running"** (±30 detik)

## Opsi 2: Gunakan PowerShell dengan Admin Mode

1. **Tekan `Win + X`** (atau klik Start dan search "PowerShell")
2. **Pilih "Windows PowerShell (Admin)" atau "Terminal (Admin)"**
3. **Copy-paste command ini:**

```powershell
Stop-Service -Name "odoo-server-17.0" -Force ; Start-Sleep -Seconds 5 ; Start-Service -Name "odoo-server-17.0" ; Start-Sleep -Seconds 3 ; Get-Service -Name "odoo-server-17.0"
```

4. **Tekan Enter dan tunggu** (output akan tampil saat done)

## Opsi 3: Gunakan Command Prompt (CMD) dengan Admin Mode

1. **Tekan `Win + R`**
2. **Ketik: `cmd`** dan tekan `Ctrl + Shift + Enter` untuk open as Admin
3. **Copy-paste command ini:**

```cmd
net stop "odoo-server-17.0" && timeout /t 5 && net start "odoo-server-17.0"
```

4. **Tekan Enter**

## Setelah Restart: TEST OTP FLOW

1. **Refresh browser:** `http://localhost:8069/lupa-password`
2. **Input email:** `afandiirawan0216@gmail.com`
3. **Klik "Kirim Kode OTP"**
4. **Cek database** dengan command:

```powershell
cd 'd:\Glass\Dataset' ; python check_token_simple.py
```

✅ **Jika output tampil reset token dengan OTP code → BERHASIL!**

## Troubleshooting

❌ "Akses Denied" saat restart?
- Pastikan run PowerShell/CMD sebagai Administrator
- Gunakan Opsi 1 (Services GUI) yang tidak perlu admin prompt

❌ Service tidak restart juga?
- Cek apakah Odoo process masih jalan: `Get-Process python`
- Kill manual: `Stop-Process -Name "python" -Force` (⚠️ hati-hati!)
- Tunggu 30 detik sebelum test form lagi

❌ Masih tidak ada token di database setelah restart?
- Restart Odoo sekali lagi
- Check file paths di auth.py sudah benar (`d:\Glass`)
- Email mungkin belum ada di database (verify dengan `check_token_simple.py`)

## Setelah Berhasil

1. ✅ Reset token akan tercreate di database
2. ✅ Email akan terkirim dengan OTP 6 digit
3. ✅ User bisa input OTP untuk verify dan reset password
