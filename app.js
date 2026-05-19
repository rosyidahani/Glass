const express = require("express");

const app = express();

app.use(express.json());

/*
====================================
DATA SEMENTARA
====================================
*/

let mahasiswa = {
  id: 1,
  nama: "Bintang",
  xp_rank: 1500,
  koin: 500
};

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
*/

app.post("/api/mahasiswa/action", (req, res) => {

  const { action } = req.body;

  // VALIDASI
  if (!action) {
    return res.status(400).json({
      success: false,
      message: "Action wajib diisi"
    });
  }

  // LOGIC ACTION
  switch(action) {

    case "tambah_xp":
      mahasiswa.xp_rank += 100;
      break;

    case "tambah_koin":
      mahasiswa.koin += 50;
      break;

    case "beli_item":
      mahasiswa.koin -= 100;
      break;

    case "naik_level":
      mahasiswa.xp_rank += 500;
      break;

    case "reset":
      mahasiswa.xp_rank = 0;
      mahasiswa.koin = 0;
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
    data: mahasiswa
  });

});

/*
====================================
LEADERBOARD
GET /api/leaderboard
====================================
*/

app.get("/api/leaderboard", (req, res) => {

  const leaderboard = [
    {
      nama: "Bintang",
      xp_rank: mahasiswa.xp_rank
    },
    {
      nama: "Adit",
      xp_rank: 1200
    },
    {
      nama: "Rama",
      xp_rank: 900
    }
  ];

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