const express = require("express");

const app = express();

app.use(express.json());

/*
====================================
DATA SEMENTARA
====================================
*/

let mahasiswa = [
  {
    id: 1,
    nama: "Oci",
    xp_rank: 1500,
    koin: 500
  },
  {
    id: 2,
    nama: "Yuyu",
    xp_rank: 1200,
    koin: 400
  },
  {
    id: 3,
    nama: "Pandi",
    xp_rank: 1000,
    koin: 300
  },
  {
    id: 4,
    nama: "Gagas Tamvan",
    xp_rank: 1800,
    koin: 700
  }
];

/*
====================================
GET STATUS
GET /api/mahasiswa/status
====================================
*/

app.get("/api/mahasiswa/status", (req, res) => {

  res.status(200).json({
    success: true,
    data: mahasiswa
  });

});

/*
====================================
POST ACTION
POST /api/mahasiswa/action
====================================
BODY:
{
  "id": 1,
  "action": "tambah_xp"
}
====================================
*/

app.post("/api/mahasiswa/action", (req, res) => {

  const { id, action } = req.body;

  // VALIDASI
  if (!id || !action) {
    return res.status(400).json({
      success: false,
      message: "ID dan action wajib diisi"
    });
  }

  // CARI MAHASISWA
  const mhs = mahasiswa.find((item) => item.id === id);

  if (!mhs) {
    return res.status(404).json({
      success: false,
      message: "Mahasiswa tidak ditemukan"
    });
  }

  // LOGIC ACTION
  switch(action) {

    case "tambah_xp":
      mhs.xp_rank += 100;
      break;

    case "tambah_koin":
      mhs.koin += 50;
      break;

    case "beli_item":
      mhs.koin -= 100;
      break;

    case "naik_level":
      mhs.xp_rank += 500;
      break;

    case "reset":
      mhs.xp_rank = 0;
      mhs.koin = 0;
      break;

    default:
      return res.status(400).json({
        success: false,
        message: "Action tidak dikenal"
      });

  }

  // RESPONSE
  res.status(200).json({
    success: true,
    message: `${action} berhasil`,
    data: mhs
  });

});

/*
====================================
LEADERBOARD
GET /api/leaderboard
====================================
*/

app.get("/api/leaderboard", (req, res) => {

  const leaderboard = mahasiswa
    .sort((a, b) => b.xp_rank - a.xp_rank)
    .map((mhs) => ({
      nama: mhs.nama,
      xp_rank: mhs.xp_rank
    }));

  res.status(200).json({
    success: true,
    data: leaderboard
  });

});

/*
====================================
ROOT
GET /
====================================
*/

app.get("/", (req, res) => {
  res.send("Backend berhasil jalan!");
});

/*
====================================
SERVER
====================================
*/

app.listen(3000, () => {
  console.log("Server berjalan di port 3000");
});