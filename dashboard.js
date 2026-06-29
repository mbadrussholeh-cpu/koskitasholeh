const { initializeApp } = require("firebase/app");
const { getDatabase, ref, onValue } = require("firebase/database");

// MASUKKAN URL REALTIME DATABASE MILIKMU DI SINI
const firebaseConfig = {
  projectId: "koskitasholeh",
  databaseURL: "https://koskitaapp-27dc0-default-rtdb.firebaseio.com/" 
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const TARGET_PROPERTY_ID = "prop_kos_putra_mandiri";

function listenDashboardRTDB() {
  const roomsRef = ref(db, `properties/${TARGET_PROPERTY_ID}/rooms`);

  onValue(roomsRef, (snapshot) => {
    console.clear();
    console.log(`=== DASHBOARD REALTIME (RTDB) KOS PUTRA MANDIRI ===`);
    
    const roomsData = snapshot.val();
    if (!roomsData) {
      console.log("Tidak ada data kamar.");
      return;
    }

    let totalKamar = 0;
    let terisi = 0;

    Object.keys(roomsData).forEach((roomId) => {
      const room = roomsData[roomId];
      totalKamar++;
      if (room.status === "occupied") terisi++;

      console.log(`Kamar: ${room.roomNumber} | Tipe: ${room.type} | Status: ${room.status.toUpperCase()} | Penyewa: ${room.currentTenantId || "-"}`);
    });

    console.log(`---------------------------------------------------`);
    console.log(`Statistik Hunian: ${terisi} / ${totalKamar} Kamar Terisi.`);
  });
}

listenDashboardRTDB();