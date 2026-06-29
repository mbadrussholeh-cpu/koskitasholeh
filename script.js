import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

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

const roomIds = [
  "room_A01", "room_A02", "room_A03", "room_A04", 
  "room_B01", "room_B02", "room_B03", "room_B04", 
  "room_C01", "room_C02", "room_C03", "room_C04", 
  "room_D01", "room_D02", "room_D03", "room_D04", "room_E01"
];

let DATA_LOKAL = [];

window.switchView = function(viewName) {
  ['dashboard', 'mahasiswa', 'kamar', 'keuangan'].forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
    const btn = document.getElementById(`nav-${v}`);
    if (btn) btn.className = "w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl text-slate-500 hover:bg-pink-50 hover:text-rose-500 transition-all cursor-pointer font-cute";
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');
  
  const activeBtn = document.getElementById(`nav-${viewName}`);
  if (activeBtn) activeBtn.className = "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-rose-600 bg-pink-100/70 border border-pink-200/50 shadow-xs font-cute";

  const titles = { 
    dashboard: "Dashboard Utama 🌸", 
    mahasiswa: "Buku Kontak Penghuni 📖", 
    kamar: "Fasilitas & Inventaris Kamar 🛏️", 
    keuangan: "Pusat Catatan Keuangan 💰" 
  };
  document.getElementById('page-title').innerText = titles[viewName];

  if(viewName === 'mahasiswa') renderMahasiswaView();
  if(viewName === 'kamar') renderKamarFasilitasView();
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

setInterval(() => {
  const clk = document.getElementById('live-clock');
  if(clk) clk.innerText = "🌸 " + new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });
}, 1000);

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
    document.getElementById('count-occupied').innerText = totalTerisi + " Terisi 💕";
    document.getElementById('count-available').innerText = (roomIds.length - totalTerisi) + " Sedia ✨";

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
    const style = isOccupied ? 'bg-pink-100 text-rose-500 border-pink-300' : 'bg-emerald-50 text-emerald-600 border-emerald-200';
    mapHtml += `
      <div onclick="alert('📢 ${room.roomNumber}\\nStatus: ${isOccupied ? 'Terisi oleh ' + room.tenant : 'Kamar Kosong Ready'}\\nKontrak: ${room.duration}')" 
           class="p-2.5 border rounded-xl text-center flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-3xs ${style}">
        <span class="text-[11px] font-bold font-cute">${room.id.replace("room_", "")}</span>
        <span class="text-[8px] font-semibold opacity-80">${isOccupied ? '❤️' : '✨'}</span>
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
    tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-pink-300 font-medium">Belum ada teman kos tercatat...</td></tr>`;
    return;
  }

  filtered.forEach(room => {
    html += `
      <tr class="hover:bg-pink-50/40 transition-colors">
        <td class="p-3 font-bold text-rose-500 font-cute">${room.roomNumber}</td>
        <td class="p-3 font-semibold text-slate-700">${room.tenant}</td>
        <td class="p-3 text-slate-400 font-medium">${room.duration}</td>
        <td class="p-3 space-x-2">
          <a href="https://wa.me/628123456789?text=Halo%20kak%20${encodeURIComponent(room.tenant)}%20dari%20${room.roomNumber}" target="_blank" class="px-2 py-1 bg-rose-500 text-white rounded-lg hover:bg-rose-600 text-[10px] font-bold shadow-3xs transition-all inline-block font-cute">
            Hubungi WA 💬
          </a>
          <button onclick="switchView('dashboard'); editData('${room.id}', '${room.tenant}', '${room.duration}')" class="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-[10px] font-bold cursor-pointer font-cute">Edit</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
};

// 🌸 FITUR BARU: RENDER KARTU FASILITAS KAMAR
window.renderKamarFasilitasView = function() {
  const container = document.getElementById('cards-fasilitas-container');
  if(!container) return;
  let html = '';

  DATA_LOKAL.forEach(room => {
    const isOccupied = room.status === 'occupied';
    html += `
      <div class="bg-gradient-to-b from-white to-pink-50/20 border border-pink-100 rounded-xl p-4 shadow-3xs relative overflow-hidden">
        <div class="absolute right-2 top-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${isOccupied ? 'bg-pink-100 text-rose-500' : 'bg-emerald-100 text-emerald-600'} font-cute">
          ${isOccupied ? 'Terisi' : 'Kosong'}
        </div>
        <h4 class="text-xs font-bold text-rose-600 font-cute mb-2">${room.roomNumber}</h4>
        <div class="space-y-1 text-[11px] text-slate-500 font-medium">
          <p>🛏️ Kasur Springbed: <span class="text-emerald-500 font-bold">Ready</span></p>
          <p>🪑 Meja Belajar & Lemari: <span class="text-emerald-500 font-bold">Ready</span></p>
          <p>⚡ Token Listrik: <span class="text-pink-400 font-bold">Mandiri</span></p>
          <p class="pt-2 border-t border-pink-50 text-[10px] text-slate-400 italic">Penyewa: ${room.tenant}</p>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
};

window.renderKeuanganView = function() {
  const tbody = document.getElementById('table-finance-body');
  let html = '';

  DATA_LOKAL.forEach(room => {
    const isOccupied = room.status === 'occupied';
    const statusBadge = isOccupied 
      ? `<span class="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px] font-cute">✨ Lunas Bulan Ini</span>`
      : `<span class="text-slate-300 italic text-[11px]">Kamar Kosong</span>`;

    html += `
      <tr class="hover:bg-pink-50/40 transition-colors">
        <td class="p-3 font-bold text-slate-400 font-cute">${room.roomNumber}</td>
        <td class="p-3 font-semibold ${isOccupied ? 'text-slate-700' : 'text-slate-300'}">${room.tenant}</td>
        <td class="p-3">${statusBadge}</td>
        <td class="p-3">
          ${isOccupied ? `
            <button onclick="alert('💌 Nota billing imut manis sudah meluncur terbang via WhatsApp ke kak ${room.tenant}!')" class="p-1 text-rose-400 hover:text-rose-500 transition-colors cursor-pointer">
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
  document.getElementById('form-action-text').innerText = `Perbarui ${id} 🌸`;
  document.getElementById('btn-cancel').classList.remove('hidden');
};

window.resetForm = function() {
  document.getElementById('kos-form').reset();
  document.getElementById('form-action-text').innerText = "Check-In Kamar Unggulan";
  document.getElementById('btn-cancel').classList.add('hidden');
};