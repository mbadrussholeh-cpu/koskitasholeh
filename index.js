const { initializeApp } = require("firebase/app");
const { getDatabase, ref, update } = require("firebase/database");

// GANTI URL DI BAWAH INI DENGAN URL REALTIME DATABASE MILIKMU
const firebaseConfig = {
  projectId: "koskitasholeh",
  databaseURL: "https://koskitaapp-27dc0-default-rtdb.firebaseio.com/" 
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function jalankanSeedingRTDB() {
  const dataAwal = {};
  const propertyId = "prop_kos_putra_mandiri";

  // 1. Data Pemilik & Properti Dasar
  dataAwal[`owners/owner_badrus`] = { name: "M. Badrus Sholeh", phone: 99999999999999, email: "m.badrussholeh@saintek.unipdu.ac.id" };
  dataAwal[`properties/${propertyId}/ownerId`] = "owners/owner_badrus";
  dataAwal[`properties/${propertyId}/name`] = "Kos Putra Mandiri";
  dataAwal[`properties/${propertyId}/address`] = "Jl. Gatot Subroto No. 12";
  dataAwal[`properties/${propertyId}/facilities`] = ["WiFi", "Laundry", "Parkir"];

  const roomIds = ["room_A01", "room_A02", "room_A03", "room_A04", "room_B01", "room_B02", "room_B03", "room_B04", "room_C01", "room_C02", "room_C03", "room_C04", "room_D01", "room_D02", "room_D03", "room_D04", "room_E01"];
  
  const daftarMahasiswa = [
    { id: "tenant_id_1", name: "Fauzan Hakiki" }, { id: "tenant_id_2", name: "Yafi Mahardika" }, { id: "tenant_id_3", name: "M. Idhhar Farhan" }, { id: "tenant_id_4", name: "M. Lie Ulin Nuha" }, { id: "tenant_id_5", name: "Ahmad Ibnu Mutohhari" }, { id: "tenant_id_6", name: "Hobir Sastrawan" }, { id: "tenant_id_7", name: "M. Fauzian Afshor" }, { id: "tenant_id_8", name: "ELsa Dwi Lestari" }, { id: "tenant_id_9", name: "Tiana Permatasari" }, { id: "tenant_id_10", name: "Fauziyah Martha Aula" }, { id: "tenant_id_11", name: "Nabila Khustia Rohmah" }, { id: "tenant_id_12", name: "Nova Nurfitriyana" }, { id: "tenant_id_13", name: "Nukhi Alvin Rahmadani" }, { id: "tenant_id_14", name: "Brilian Hariputra" }, { id: "tenant_id_15", name: "Bimo Adi Nugroho" }, { id: "tenant_id_16", name: "Zulki Mujtahid" }, { id: "tenant_id_17", name: "Husain Aziz Al Rosyid" }
  ];

  // 2. Loop Kamar & Pasang Status Sesuai Index (Anti-Tabrakan)
  roomIds.forEach((roomId, index) => {
    const isOccupied = index < 10; // 10 Kamar pertama otomatis terisi
    const tenantId = isOccupied ? daftarMahasiswa[index].id : "";

    dataAwal[`properties/${propertyId}/rooms/${roomId}`] = { 
      roomNumber: `A-${String(index + 1).padStart(2, '0')}`, 
      type: index % 2 === 0 ? "Standard" : "Premium", 
      price: index % 2 === 0 ? 800000 : 1200000, 
      status: isOccupied ? "occupied" : "available", 
      currentTenantId: tenantId
    };
  });

  // 3. Data Penyewa & Tagihan Pembayaran
  daftarMahasiswa.forEach((mhs, index) => {
    if (index < 10) {
      const assignedRoomId = roomIds[index];
      dataAwal[`tenants/${mhs.id}`] = { name: mhs.name, phone: "08123456789", ktpNumber: "3517xxxxxxxxxxxx", propertyId: propertyId, roomId: assignedRoomId, startDate: Date.now(), endDate: "" };
      dataAwal[`payments/pay_${mhs.id}`] = { tenantId: mhs.id, propertyId: propertyId, month: "2026-06", amount: index % 2 === 0 ? 800000 : 1200000, status: "unpaid", paidAt: "" };
    } else {
      dataAwal[`tenants/${mhs.id}`] = { name: mhs.name, phone: "08123456789", ktpNumber: "3517xxxxxxxxxxxx", propertyId: "", roomId: "", startDate: Date.now(), endDate: "" };
    }
  });

  // 4. Data Permintaan Perbaikan Facilities
  dataAwal[`maintenanceRequests/req_01`] = { tenantId: "tenant_id_1", propertyId: propertyId, roomId: "room_A01", description: "AC bocor di kamar A-01", priority: "high", status: "open", createdAt: Date.now() };
  dataAwal[`maintenanceRequests/req_02`] = { tenantId: "tenant_id_2", propertyId: propertyId, roomId: "room_A02", description: "Kran air kamar mandi macet", priority: "medium", status: "open", createdAt: Date.now() };

  // Tembak data ke server Firebase secara Atomic
  await update(ref(db), dataAwal);
  console.log("🔥 Selesai! Seluruh struktur Realtime Database KosKitaSholeh berhasil di-input.");
  process.exit(0); 
}

jalankanSeedingRTDB();