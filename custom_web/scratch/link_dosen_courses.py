import psycopg2

def run_seed():
    try:
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            user='openpg',
            password='koentji',
            dbname='Glass'
        )
        cur = conn.cursor()
        
        # 1. Hubungkan Dosen Ari (ID: 1) ke 8 mata kuliah Semester 1
        course_ids = [1, 2, 3, 4, 5, 6, 7, 8]
        for cid in course_ids:
            cur.execute("""
                UPDATE mata_kuliah 
                SET dosen_id = 1, dosen_pengampu = 'Ari' 
                WHERE id = %s;
            """, (cid,))
        
        # 2. Hapus sesi presensi yang corrupt / tidak ada mata kuliahnya
        cur.execute("DELETE FROM presensi_sesi WHERE mata_kuliah_id IS NULL;")
        
        conn.commit()
        print("Data Seeding Sukses: Dosen Ari terhubung ke 8 mata kuliah Semester 1, data sampah presensi berhasil dibersihkan!")
        
        # Cetak pembuktian
        cur.execute("SELECT id, nama, dosen_id, dosen_pengampu FROM mata_kuliah WHERE dosen_id = 1;")
        rows = cur.fetchall()
        for r in rows:
            print(f" - [Matkul ID {r[0]}] {r[1]} -> Dosen ID: {r[2]} ({r[3]})")
            
        cur.close()
        conn.close()
    except Exception as e:
        print("Gagal menjalankan seeding:", e)

if __name__ == '__main__':
    run_seed()
