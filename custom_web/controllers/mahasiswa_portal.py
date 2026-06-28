import base64
from odoo import http, fields
import json
from odoo.http import request
from .utils import get_active_mahasiswa


class MahasiswaPortalController(http.Controller):

    @http.route('/avatar/image/<int:avatar_id>', auth='public', website=True, type='http')
    def get_avatar_image(self, avatar_id, **kwargs):
        """Serve avatar image using sudo() context to bypass Odoo public user access restrictions."""
        avatar = request.env['shop.avatar'].sudo().browse(avatar_id)
        if avatar.exists() and avatar.foto_avatar:
            try:
                image_data = base64.b64decode(avatar.foto_avatar)
                content_type = 'image/png'
                if avatar.gambar_url and (avatar.gambar_url.lower().endswith('.jpg') or avatar.gambar_url.lower().endswith('.jpeg')):
                    content_type = 'image/jpeg'
                return request.make_response(image_data, headers=[
                    ('Content-Type', content_type),
                    ('Cache-Control', 'public, max-age=86400')
                ])
            except Exception:
                pass
        return request.not_found()

    @http.route('/dashboard/mahasiswa', auth='public', website=True, type='http')
    def dashboard_mahasiswa(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')

        if not mahasiswa.face_descriptor:
            return request.redirect('/mahasiswa/register-face')

        # Hitung ranking mahasiswa berdasarkan total_xp dalam kelompok 7 digit NIM yang sama
        nim_prefix = (mahasiswa.nim or '').strip()[:7]
        domain = [('active', '=', True)]
        if len(nim_prefix) == 7:
            domain.append(('nim', '=like', f"{nim_prefix}%"))

        all_students = request.env['mahasiswa.mahasiswa'].sudo().search(domain, order='total_xp desc')
        
        rank = 1
        for idx, student in enumerate(all_students, start=1):
            if student.id == mahasiswa.id:
                rank = idx
                break

        return request.render('custom_web.dashboard', {
            'mahasiswa': mahasiswa,
            'rank': rank,
        })

    @http.route('/mahasiswa/register-face', auth='public', website=True, type='http')
    def register_face_page(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')
        
        # Allow visiting the registration page to register or re-register face data.
        return request.render('custom_web.register_face', {
            'mahasiswa': mahasiswa,
        })

    @http.route('/api/mahasiswa/register-face', type='json', auth='public', methods=['POST'], cors='*', csrf=False)
    def api_register_face(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return {'status': 'error', 'message': 'Session expired or not logged in'}
            
        face_vector = kwargs.get('face_vector')
        if not face_vector:
            return {'status': 'error', 'message': 'Data wajah tidak boleh kosong.'}
            
        # Encrypt the face descriptor using aes256_encrypt_b64 from faceid_utils
        from odoo.addons.presensi.models.faceid_utils import aes256_encrypt_b64
        from odoo.addons.presensi.models.faceid_service import _get_faceid_secret
        
        secret = _get_faceid_secret(request.env)
        encrypted_descriptor = aes256_encrypt_b64(face_vector, secret)
        
        try:
            mahasiswa.sudo().write({
                'face_descriptor': encrypted_descriptor
            })
            return {'status': 'success', 'message': 'Pendaftaran wajah berhasil.'}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    @http.route([
        '/dashboard/mahasiswa/settings',
        '/dashboard/mahasiswa/settings/<int:submenu_id>'
    ], auth='public', website=True, type='http')
    def settings_mahasiswa(self, submenu_id=None, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')
        if not mahasiswa.face_descriptor:
            return request.redirect('/mahasiswa/register-face')

        return request.render('custom_web.settings', {
            'mahasiswa': mahasiswa,
        })

    @http.route('/dashboard/mahasiswa/settings/upload_photo', auth='public', website=True, type='http', methods=['POST'], csrf=True)
    def upload_photo_mahasiswa(self, **post):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')

        foto_profil = post.get('foto_profil')
        if foto_profil and foto_profil.filename:
            file_content = foto_profil.read()
            mahasiswa.sudo().write({
                'foto_profil': base64.b64encode(file_content)
            })

        return request.redirect('/dashboard/mahasiswa/settings')

    @http.route('/dashboard/mahasiswa/shop', auth='public', website=True, type='http')
    def shop_mahasiswa(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')
        if not mahasiswa.face_descriptor:
            return request.redirect('/mahasiswa/register-face')

        return request.render('custom_web.shop', {
            'mahasiswa': mahasiswa,
        })

    @http.route('/leaderboard', auth='public', website=True, type='http')
    def leaderboard_mahasiswa(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')
        if not mahasiswa.face_descriptor:
            return request.redirect('/mahasiswa/register-face')

        # Leaderboard mahasiswa: hanya tampilkan mahasiswa dengan 7 digit NIM yang sama
        nim_prefix = (mahasiswa.nim or '').strip()[:7]
        domain = [('active', '=', True)]
        if len(nim_prefix) == 7:
            domain.append(('nim', '=like', f"{nim_prefix}%"))

        students = request.env['mahasiswa.mahasiswa'].sudo().search(
            domain,
            order='total_xp desc',
        )

        return request.render('custom_web.leaderboard', {
            'mahasiswa': mahasiswa,
            'students': students,
        })


    @http.route('/api/shop/state', type='json', auth='public', methods=['POST'], cors='*', csrf=False)
    def api_shop_state(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return {'status': 'error', 'message': 'Session expired or not logged in'}

        owned_avatars = mahasiswa.owned_avatar_ids.mapped('avatar_id') or ['char_default']
        equipped_avatar = mahasiswa.equipped_avatar_id.avatar_id or 'char_default'
        
        # Get list of voucher codes claimed by this student
        claimed_vouchers = request.env['shop.transaction'].sudo().search([
            ('mahasiswa_id', '=', mahasiswa.id),
            ('item_type', '=', 'voucher')
        ]).mapped('voucher_id.code')

        return {
            'status': 'success',
            'coins': mahasiswa.koin,
            'ownedAvatars': owned_avatars,
            'equippedAvatar': equipped_avatar,
            'claimedVouchers': claimed_vouchers,
        }

    @http.route('/api/shop/buy', type='json', auth='public', methods=['POST'], cors='*', csrf=False)
    def api_shop_buy(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return {'status': 'error', 'message': 'Session expired or not logged in'}

        item_code = kwargs.get('item_code')
        if not item_code:
            return {'status': 'error', 'message': 'Kode item wajib diisi.'}

        avatar = request.env['shop.avatar'].sudo().search([('avatar_id', '=', item_code), ('active', '=', True)], limit=1)
        voucher = None
        if avatar:
            item_type = 'avatar'
            price = avatar.harga_koin
            item_id = avatar.id
        else:
            voucher = request.env['shop.voucher'].sudo().search([('code', '=', item_code), ('active', '=', True)], limit=1)
            if voucher:
                item_type = 'voucher'
                price = voucher.price
                item_id = voucher.id
            else:
                return {'status': 'error', 'message': 'Item tidak ditemukan atau tidak aktif.'}

        if mahasiswa.koin < price:
            return {'status': 'error', 'message': 'Koin Anda tidak mencukupi.'}

        # Check if already owned/claimed
        if item_type == 'avatar':
            if avatar in mahasiswa.owned_avatar_ids:
                return {'status': 'error', 'message': 'Anda sudah memiliki avatar ini.'}
        else:
            # Voucher
            existing_tx = request.env['shop.transaction'].sudo().search([
                ('mahasiswa_id', '=', mahasiswa.id),
                ('item_type', '=', 'voucher'),
                ('voucher_id', '=', item_id)
            ], limit=1)
            if existing_tx:
                return {'status': 'error', 'message': 'Anda sudah menukarkan voucher ini.'}

        # Process transaction
        try:
            # Deduct koin
            mahasiswa.sudo().write({'koin': mahasiswa.koin - price})
            
            # Create transaction
            tx_vals = {
                'mahasiswa_id': mahasiswa.id,
                'item_type': item_type,
            }
            if item_type == 'avatar':
                tx_vals['avatar_id'] = item_id
            else:
                tx_vals['voucher_id'] = item_id

            tx = request.env['shop.transaction'].sudo().create(tx_vals)

            # If avatar, add to owned
            if item_type == 'avatar':
                mahasiswa.sudo().write({
                    'owned_avatar_ids': [(4, item_id)]
                })

            return {
                'status': 'success',
                'coins': mahasiswa.koin,
                'code_generated': tx.code_generated or ''
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    @http.route('/api/shop/equip', type='json', auth='public', methods=['POST'], cors='*', csrf=False)
    def api_shop_equip(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return {'status': 'error', 'message': 'Session expired or not logged in'}

        avatar_code = kwargs.get('avatar_code')
        if not avatar_code:
            return {'status': 'error', 'message': 'Kode avatar wajib diisi.'}

        avatar = request.env['shop.avatar'].sudo().search([
            ('avatar_id', '=', avatar_code),
            ('active', '=', True)
        ], limit=1)
        if not avatar.exists():
            return {'status': 'error', 'message': 'Avatar tidak ditemukan.'}

        if avatar not in mahasiswa.owned_avatar_ids:
            return {'status': 'error', 'message': 'Anda belum memiliki avatar ini.'}

        try:
            mahasiswa.sudo().write({
                'equipped_avatar_id': avatar.id
            })
            return {'status': 'success'}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}


    @http.route('/tugas', auth='public', website=True, type='http')
    def tugas(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')
        if not mahasiswa.face_descriptor:
            return request.redirect('/mahasiswa/register-face')

        # Get all tasks for the student's courses
        course_ids = mahasiswa.mata_kuliah_ids.ids
        tugas_obj = request.env['tugas.tugas'].sudo()
        tugas_list = tugas_obj.search([('mata_kuliah_id', 'in', course_ids)], order='deadline desc')
        
        # Map which ones have been submitted by this mahasiswa
        submission_data = request.env['tugas.pengumpulan'].sudo().search_read(
            domain=[
                ('mahasiswa_id', '=', mahasiswa.id),
                ('tugas_id', 'in', tugas_list.ids)
            ],
            fields=['tugas_id', 'nilai', 'status_penilaian']
        )
        submission_by_tugas = {sub['tugas_id'][0]: sub for sub in submission_data}
        
        import pytz
        from datetime import datetime
        now_utc = datetime.utcnow()
        
        tugas_aktif = []
        tugas_riwayat = []
        
        for t in tugas_list:
            sub = submission_by_tugas.get(t.id)
            
            wib = pytz.timezone('Asia/Jakarta')
            
            date_open_dt = t.create_date or datetime.utcnow()
            date_open_wib = pytz.utc.localize(date_open_dt).astimezone(wib)
            date_open_str = date_open_wib.strftime('%d %B %Y, %H:%M WIB')
            date_open_iso = date_open_wib.strftime('%Y-%m-%dT%H:%M:%S')

            deadline_str = 'N/A'
            deadline_iso = ''
            if t.deadline:
                deadline_wib = pytz.utc.localize(t.deadline).astimezone(wib)
                deadline_str = deadline_wib.strftime('%d %B %Y, %H:%M WIB')
                deadline_iso = deadline_wib.strftime('%Y-%m-%dT%H:%M:%S')

            is_soon = False
            if not sub and t.deadline:
                delta = t.deadline - now_utc
                if 0 < delta.total_seconds() <= 86400: # 1 day
                    is_soon = True

            # Format Indonesian months
            months_id = {
                'January': 'Januari', 'February': 'Februari', 'March': 'Maret',
                'April': 'April', 'May': 'Mei', 'June': 'Juni',
                'July': 'Juli', 'August': 'Agustus', 'September': 'September',
                'October': 'Oktober', 'November': 'November', 'December': 'Desember'
            }
            for eng, ind in months_id.items():
                date_open_str = date_open_str.replace(eng, ind)
                deadline_str = deadline_str.replace(eng, ind)
            
            task_data = {
                'id': t.id,
                'name': t.judul,
                'subject': t.mata_kuliah_id.nama if t.mata_kuliah_id else 'Tanpa Mata Kuliah',
                'course_id': t.mata_kuliah_id.id if t.mata_kuliah_id else None,
                'jenis_tugas': t.jenis_tugas,
                'deskripsi': t.deskripsi or '',
                'date_open': date_open_str,
                'date_open_iso': date_open_iso,
                'date_close': deadline_str,
                'date_close_iso': deadline_iso,
                'is_soon': is_soon,
                'has_file_materi': bool(t.file_materi),
                'file_materi_name': t.file_materi_name or '',
                'file_materi_url': f'/dosen/tugas/materi/{t.id}' if t.file_materi else '',
            }
            
            if sub:
                task_data['status'] = 'completed'
                task_data['status_label'] = 'Selesai'
                task_data['nilai'] = sub['nilai']
                task_data['status_penilaian'] = sub['status_penilaian']
                tugas_riwayat.append(task_data)
            else:
                if t.deadline and now_utc > t.deadline:
                    task_data['status'] = 'missed'
                    task_data['status_label'] = 'Terlambat'
                    tugas_riwayat.append(task_data)
                else:
                    task_data['status'] = 'pending'
                    task_data['status_label'] = 'Belum Selesai'
                    tugas_aktif.append(task_data)
            
        return request.render('custom_web.menu', {
            'mahasiswa': mahasiswa,
            'mahasiswa_name': mahasiswa.name,
            'courses': mahasiswa.mata_kuliah_ids,
            'tugas_aktif': tugas_aktif,
            'tugas_riwayat': tugas_riwayat,
            'stats_active_count': len(tugas_aktif),
            'stats_history_count': len(tugas_riwayat),
        })

    @http.route('/tugas/submit', type='http', auth='public', methods=['POST'], cors='*', csrf=False)
    def api_tugas_kumpul(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.make_response(json.dumps({'status': 'error', 'message': 'Session expired or not logged in'}), headers=[('Content-Type', 'application/json')], status=401)

        tugas_id = kwargs.get('tugas_id')
        tipe_file = kwargs.get('tipe_file', 'link')
        link_jawaban = kwargs.get('link_jawaban', '')
        catatan = kwargs.get('catatan', '')

        if not tugas_id:
            return request.make_response(json.dumps({'status': 'error', 'message': 'ID Tugas wajib diisi.'}), headers=[('Content-Type', 'application/json')], status=400)

        try:
            tugas = request.env['tugas.tugas'].sudo().browse(int(tugas_id))
        except (ValueError, TypeError):
            return request.make_response(json.dumps({'status': 'error', 'message': 'ID Tugas tidak valid.'}), headers=[('Content-Type', 'application/json')], status=400)

        if not tugas.exists():
            return request.make_response(json.dumps({'status': 'error', 'message': 'Tugas tidak ditemukan.'}), headers=[('Content-Type', 'application/json')], status=404)

        vals = {
            'tugas_id': tugas.id,
            'mahasiswa_id': mahasiswa.id,
            'tipe_file': tipe_file,
            'catatan': catatan,
            'waktu_kumpul': fields.Datetime.now()
        }

        if tipe_file == 'link':
            if not link_jawaban:
                return request.make_response(json.dumps({'status': 'error', 'message': 'Tautan/Link tugas wajib diisi.'}), headers=[('Content-Type', 'application/json')], status=400)
            vals['link_jawaban'] = link_jawaban
            vals['file_jawaban'] = False
            vals['file_jawaban_name'] = False
        elif tipe_file == 'zip':
            uploaded_file = request.httprequest.files.get('file_jawaban')
            if not uploaded_file:
                return request.make_response(json.dumps({'status': 'error', 'message': 'File tugas wajib diunggah.'}), headers=[('Content-Type', 'application/json')], status=400)
            vals['file_jawaban'] = base64.b64encode(uploaded_file.read())
            vals['file_jawaban_name'] = uploaded_file.filename
            vals['link_jawaban'] = False
        else:
            return request.make_response(json.dumps({'status': 'error', 'message': f'Tipe pengumpulan "{tipe_file}" tidak valid.'}), headers=[('Content-Type', 'application/json')], status=400)

        existing = request.env['tugas.pengumpulan'].sudo().search([
            ('tugas_id', '=', tugas.id),
            ('mahasiswa_id', '=', mahasiswa.id)
        ], limit=1)

        if existing:
            existing.write(vals)
        else:
            request.env['tugas.pengumpulan'].sudo().create(vals)

        return request.make_response(json.dumps({'status': 'success', 'message': 'Tugas berhasil dikumpulkan!'}), headers=[('Content-Type', 'application/json')])

    @http.route('/menu/submenu', auth='public', website=True, type='http')
    def submenu(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')
            
        return request.render('custom_web.submenu', {
            'mahasiswa_name': mahasiswa.name,
        })

    @http.route('/presensi', auth='public', website=True, type='http')
    def presensi_select(self, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')
        if not mahasiswa.face_descriptor:
            return request.redirect('/mahasiswa/register-face')

        # Ambil seluruh mata kuliah yang diambil mahasiswa
        courses_taken = mahasiswa.mata_kuliah_ids

        courses = []
        for course in courses_taken:
            # Cari jika ada sesi presensi yang sedang terbuka untuk mata kuliah ini
            session = request.env['presensi.sesi'].sudo().search([
                ('mata_kuliah_id', '=', course.id),
                ('status', '=', 'open')
            ], limit=1, order='id desc')

            sudah = False
            if session:
                # Cek jika mahasiswa sudah melakukan presensi di sesi aktif ini
                sudah = request.env['presensi.record'].sudo().search([
                    ('sesi_id', '=', session.id),
                    ('mahasiswa_id', '=', mahasiswa.id)
                ], limit=1)

            if session and not sudah:
                dosen_name = session.feature_dosen_id.name or session.dosen_id.name or course.dosen_pengampu or 'Dosen Pengajar'
                
                # Format UTC datetime to Asia/Jakarta (WIB) local time
                import pytz
                waktu_buka_wib = ''
                if session.waktu_buka:
                    waktu_buka_utc = pytz.utc.localize(session.waktu_buka)
                    waktu_buka_wib = waktu_buka_utc.astimezone(pytz.timezone('Asia/Jakarta')).strftime('%H:%M WIB')

                courses.append({
                    'id': session.id,
                    'name': course.nama,
                    'status': session.tipe_kelas,
                    'status_label': 'Online' if session.tipe_kelas == 'online' else 'Offline',
                    'action_label': 'Mulai Presensi',
                    'color': 'green' if session.tipe_kelas == 'online' else 'blue',
                    'dosen': dosen_name,
                    'jam': waktu_buka_wib or 'Jam Aktif',
                    'ruang': session.name,
                })


        return request.render('custom_web.presensi_select', {
            'mahasiswa': mahasiswa,
            'courses': courses,
        })

    @http.route('/presensi/scan/<int:course_id>', auth='public', website=True, type='http')
    def presensi_scan(self, course_id, **kwargs):
        mahasiswa = get_active_mahasiswa()
        if not mahasiswa:
            return request.redirect('/login')
        if not mahasiswa.face_descriptor:
            return request.redirect('/mahasiswa/register-face')

        sesi = request.env['presensi.sesi'].sudo().browse(course_id)
        if not sesi.exists():
            return request.redirect('/presensi')

        # Cek jika sudah pernah presensi atau sesi ditutup
        sudah = request.env['presensi.record'].sudo().search([
            ('sesi_id', '=', sesi.id),
            ('mahasiswa_id', '=', mahasiswa.id)
        ], limit=1)
        if sudah or sesi.status == 'closed':
            return request.redirect('/presensi')

        course = {
            'id': sesi.id,
            'name': sesi.mata_kuliah_id.nama or 'Mata Kuliah',
            'status': sesi.tipe_kelas,
            'dosen': sesi.dosen_id.name or 'Dosen Pengajar',
            'ruang': sesi.name,
        }

        return request.render('custom_web.presensi_scan', {
            'mahasiswa': mahasiswa,
            'course': course,
        })

    @http.route('/api/settings/change_password', auth='public', type='http', website=True, methods=['POST'], csrf=False)
    def api_change_password(self, **kwargs):
        import json
        try:
            body = json.loads(request.httprequest.data)
        except Exception:
            return request.make_response(json.dumps({'status': 'error', 'message': 'Invalid JSON body'}), headers=[('Content-Type', 'application/json')])
        
        old_password = body.get('old_password')
        new_password = body.get('new_password')
        
        if not old_password or not new_password:
            return request.make_response(json.dumps({'status': 'error', 'message': 'Password lama dan baru harus diisi'}), headers=[('Content-Type', 'application/json')])

        mahasiswa = get_active_mahasiswa()
        from .utils import get_active_dosen
        dosen = get_active_dosen()
        
        if mahasiswa:
            hashed_old = request.env['mahasiswa.mahasiswa']._hash_password(old_password)
            if mahasiswa.password != hashed_old:
                return request.make_response(json.dumps({'status': 'error', 'message': 'Password lama salah'}), headers=[('Content-Type', 'application/json')])
            mahasiswa.sudo().write({'password': new_password})
            return request.make_response(json.dumps({'status': 'success', 'message': 'Password berhasil diubah.'}), headers=[('Content-Type', 'application/json')])