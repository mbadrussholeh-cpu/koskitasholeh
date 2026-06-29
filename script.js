import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// 🔐 Konfigurasi Utama Firebase Proyek Sholeh
const firebaseConfig = {
  apiKey: "AIzaSyDLr3H6QXJwZ0FZpoufEKL_2oYB6v8_xN8",
  authDomain: "koskitasholeh.firebaseapp.com",
  databaseURL: "https://koskitasholeh-default-rtdb.firebaseio.com/", 
  projectId: "koskitasholeh",
  storageBucket: "koskitasholeh.firebasestorage.app",
  messagingSenderId: "209064214575",
  appId: "1:209064214575:web:baf230757fc02a614046da"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Data 17 Kamar Asli
const roomIds = [
  "room_A01", "room_A02", "room_A03", "room_A04", 
  "room_B01", "room_B02", "room_B03", "room_B04", 
  "room_C01", "room_C02", "room_C03", "room_C04", 
  "room_D01", "room_D02", "room_D03", "room_D04", "room_E01"
];

let DATA_LOKAL = [];

// FUNGSI NAVIGASI PINDAH TAB (DIKIRIM KE SCOPE GLOBAL WINDOW)
window.switchView = function(viewName) {
  document.getElementById('view-dashboard').classList.add('hidden');
  document.getElementById('view-mahasiswa').classList.add('hidden');
  document.getElementById('view-keuangan').classList.add('hidden');
  
  ['dashboard', 'mahasiswa', 'keuangan'].forEach(v => {
    const btn = document.getElementById(`nav-${v}`);
    if(btn) btn.className = "w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 transition-all cursor-pointer";
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if(targetView) targetView.classList.remove('hidden');
  
  const activeBtn = document.getElementById(`nav-${viewName}`);
  if(activeBtn) activeBtn.className = "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-blue-400 bg-gradient-to-r from-blue-600/20 to-blue-600/5 border border-blue-500/10";

  const titles = { dashboard: "Dashboard Ringkasan", mahasiswa: "Manajemen Data Mahasiswa", keuangan: "Pusat Keuangan & Tagihan" };
  document.getElementById('page-title').innerText = titles[viewName];

  if(viewName === 'mahasiswa') renderMahasiswaView();
  if(viewName === 'keuangan') renderKeuanganView();
};

function initDropdown() {
  const select = document.getElementById('form-room');
  if(!select) return;
  let html = '';
  roomIds.forEach(id => {
    const label = "Kamar " + id.replace("room_", "").replace(/([A-E])/, "$1-");
    html += `<option value="${id}">${label}</option>`;
  });
  select.innerHTML = html;
}

// Live Clock
setInterval(() => {
  const clk = document.getElementById('live-clock');
  if(clk) clk.innerText = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });
}, 1000);

// Inisialisasi Saat Halaman Siap
window.addEventListener('load', () => {
  initDropdown();
  lucide.createIcons();

  const dbTargetRef = ref(db, 'properties/prop_kos_putra_mandiri/rooms');

  onValue(dbTargetRef, (snapshot) => {
    const fbData = snapshot.val() || {};
    DATA_LOKAL = [];

    roomIds.forEach(id => {
      const labelKamar = "Kamar " + id.replace("room_", "").replace(/([A-E])/, "$1-");
      if(fbData[id]) {
        DATA_LOKAL.push({
          id: id,
          roomNumber: fbData[id].roomNumber || labelKamar,
          tenant: fbData[id].tenantId ? (fbData[id].tenant || "Aktif") : "-",
          status: fbData[id].tenantId ? "occupied" : "available",
          duration: fbData[id].duration || "-"
        });
      } else {
        DATA_LOKAL.push({ id: id, roomNumber: labelKamar, tenant: "-", status: "available", duration: "-" });
      }
    });

    const totalTerisi = DATA_LOKAL.filter(r => r.status === 'occupied').length;
    document.getElementById('count-occupied').innerText = totalTerisi + " Kamar Terisi";
    document.getElementById('count-available').innerText = (roomIds.length - totalTerisi) + " Kamar Kosong";

    const estimasiOmzet = totalTerisi * 1500000;
    document.getElementById('total-revenue-text').innerText = "Rp " + estimasiOmzet.toLocaleString('id-ID');

    renderDashboardMap();
  });
});

function renderDashboardMap() {
  const mapGrid = document.getElementById('visual-map-grid');
  if(!mapGrid) return;
  let mapHtml = '';
  DATA_LOKAL.forEach(room => {
    const isOccupied = room.status === 'occupied';
    const bgStyle = isOccupied ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    mapHtml += `
      <div class="p-2 border rounded-lg text-center flex flex-col items-center justify-center ${bgStyle}">
        <span class="text-[10px] font-black">${room.id.replace("room_", "")}</span>
        <span class="text-[8px] font-medium opacity-80">${isOccupied ? 'Terisi' : 'Sedia'}</span>
      </div>
    `;
  });
  mapGrid.innerHTML = mapHtml;
}

window.renderMahasiswaView = function() {
  const tbody = document.getElementById('table-mhs-body');
  const searchQuery = document.getElementById('search-mhs').value.toLowerCase();
  let html = '';

  const hanyaTerisi = DATA_LOKAL.filter(r => r.status === 'occupied');
  const filtered = hanyaTerisi.filter(r => r.tenant.toLowerCase().includes(searchQuery));

  if(filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-slate-600">Tidak ada penghuni aktif ditemukan...</td></tr>`;
    return;
  }

  filtered.forEach(room => {
    html += `
      <tr class="hover:bg-slate-800/30 transition-colors">
        <td class="p-3 font-bold text-blue-400">${room.roomNumber}</td>
        <td class="p-3 font-semibold text-white">${room.tenant}</td>
        <td class="p-3 text-slate-400">${room.duration}</td>
        <td class="p-3 space-x-2">
          <a href="https://wa.me/628123456789?text=Halo%20${encodeURIComponent(room.tenant)}" target="_blank" class="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/40 text-[11px] font-bold transition-all inline-block">
            <i data-lucide="phone" class="w-3 h-3 inline mr-1"></i> Hubungi WA
          </a>
          <button onclick="switchView('dashboard'); editData('${room.id}', '${room.tenant}', '${room.duration}')" class="px-2 py-1 bg-slate-800 text-slate-300 rounded hover:text-white text-[11px] cursor-pointer">Edit</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
  lucide.createIcons();
};

window.renderKeuanganView = function() {
  const tbody = document.getElementById('table-finance-body');
  let html = '';

  DATA_LOKAL.forEach(room => {
    const isOccupied = room.status === 'occupied';
    const statusBadge = isOccupied 
      ? `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-[10px]">Lunas Bulan Ini</span>`
      : `<span class="text-slate-600 italic">Kamar Kosong</span>`;

    html += `
      <tr class="hover:bg-slate-800/30 transition-colors">
        <td class="p-3 font-bold text-slate-400">${room.roomNumber}</td>
        <td class="p-3 font-semibold ${isOccupied ? 'text-white' : 'text-slate-600'}">${room.tenant}</td>
        <td class="p-3">${statusBadge}</td>
        <td class="p-3">
          ${isOccupied ? `
            <button onclick="alert('Nota billing tagihan digital berhasil dikirim via WhatsApp ke ${room.tenant}!')" class="p-1 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
              <i data-lucide="send" class="w-4 h-4"></i>
            </button>
          ` : '-'}
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
  lucide.createIcons();
};

window.saveData = function(e) {
  e.preventDefault();
  const idKamar = document.getElementById('form-room').value;
  const namaMhs = document.getElementById('form-name').value;
  const durasi = document.getElementById('form-duration').value;

  const targetRef = ref(db, `properties/prop_kos_putra_mandiri/rooms/${idKamar}`);
  const labelFormat = "Kamar " + idKamar.replace("room_", "").replace(/([A-E])/, "$1-");

  update(targetRef, {
    roomNumber: labelFormat,
    tenantId: "tenant_" + Date.now(),
    tenant: namaMhs,
    duration: durasi
  }).then(() => resetForm()).catch(err => alert(err));
};

window.editData = function(id, tenant, duration) {
  document.getElementById('form-room').value = id;
  document.getElementById('form-name').value = tenant;
  document.getElementById('form-duration').value = duration;
  document.getElementById('form-action-text').innerText = `Perbarui Data ${id}`;
  document.getElementById('btn-cancel').classList.remove('hidden');
};

window.resetForm = function() {
  document.getElementById('kos-form').reset();
  document.getElementById('form-action-text').innerText = "Check-In Kamar (Tambah Penyewa)";
  document.getElementById('btn-cancel').classList.add('hidden');
};