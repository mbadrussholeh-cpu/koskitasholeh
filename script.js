import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

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
    if (btn) btn.className = "w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl text-[#7d6b62] hover:bg-[#ffb5a7]/10 hover:text-[#b5828c] transition-all duration-300 cursor-pointer font-cute";
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');
  
  const activeBtn = document.getElementById(`nav-${viewName}`);
  if (activeBtn) activeBtn.className = "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer text-[#b5828c] bg-[#ffb5a7]/10 border border-[#ffb5a7]/30 shadow-2xs font-cute";

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
    document.getElementById('count-occupied').innerText = totalTerisi + " Terisi 💝";
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
    const style = isOccupied ? 'bg-[#ffe5ec] text-[#e5989b] border-[#f3e1d3]' : 'bg-[#e8f5e9] text-[#95d5b2] border-[#f3e1d3]/40';
    mapHtml += `
      <div onclick="alert('📢 ${room.roomNumber}\\nStatus: ${isOccupied ? 'Terisi oleh ' + room.tenant : 'Kamar Ready'}\\nKontrak: ${room.duration}')" 
           class="p-2.5 border rounded-xl text-center flex flex-col items-center justify-center cursor-pointer hover:scale-105 hover:shadow-2xs transition-all duration-300 ${style}">
        <span class="text-[11px] font-bold font-cute">${room.id.replace("room_", "")}</span>
        <span class="text-[8px] font-semibold opacity-80">${isOccupied ? '💝' : '✨'}</span>
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
    tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-[#a39085] font-medium">Tidak ada data teman aktif...</td></tr>`;
    return;
  }

  filtered.forEach(room => {
    html += `
      <tr class="hover:bg-[#fdf8f5] transition-colors">
        <td class="p-3 font-bold text-[#b5828c] font-cute">${room.roomNumber}</td>
        <td class="p-3 font-semibold text-[#5c4a42]">${room.tenant}</td>
        <td class="p-3 text-slate-400 font-medium">${room.duration}</td>
        <td class="p-3 space-x-2">
          <a href="https://wa.me/628123456789?text=Halo%20kak%20${encodeURIComponent(room.tenant)}%20dari%20${room.roomNumber}" target="_blank" class="px-2.5 py-1 bg-[#e5989b] text-white rounded-lg hover:opacity-90 text-[10px] font-bold transition-all inline-block font-cute">
            Hubungi WA 💬
          </a>
          <button onclick="switchView('dashboard'); editData('${room.id}', '${room.tenant}', '${room.duration}')" class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-[10px] font-bold cursor-pointer font-cute">Edit</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
};

window.renderKamarFasilitasView = function() {
  const container = document.getElementById('cards-fasilitas-container');
  if(!container) return;
  let html = '';

  DATA_LOKAL.forEach(room => {
    const isOccupied = room.status === 'occupied';
    html += `
      <div class="bg-white border border-[#f3e1d3] rounded-xl p-4 shadow-3xs relative overflow-hidden transition-transform duration-300 hover:translate-y-[-2px]">
        <div class="absolute right-2 top-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${isOccupied ? 'bg-[#ffe5ec] text-[#e5989b]' : 'bg-[#e8f5e9] text-[#95d5b2]'} font-cute">
          ${isOccupied ? 'Terisi' : 'Kosong'}
        </div>
        <h4 class="text-xs font-bold text-[#b5828c] font-cute mb-2">${room.roomNumber}</h4>
        <div class="space-y-1 text-[11px] text-[#7d6b62] font-medium">
          <p>🛏️ Kasur Springbed: <span class="text-[#95d5b2] font-bold">Ready</span></p>
          <p>🪑 Meja & Almari: <span class="text-[#95d5b2] font-bold">Ready</span></p>
          <p>⚡ Token Listrik: <span class="text-[#e5989b] font-bold">Mandiri</span></p>
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
      ? `<span class="bg-[#e8f5e9] text-[#95d5b2] border border-[#e8f5e9] px-2 py-0.5 rounded-full font-bold text-[10px] font-cute">✨ Lunas</span>`
      : `<span class="text-slate-300 italic text-[11px]">Kamar Kosong</span>`;

    html += `
      <tr class="hover:bg-[#fdf8f5] transition-colors">
        <td class="p-3 font-bold text-slate-400 font-cute">${room.roomNumber}</td>
        <td class="p-3 font-semibold ${isOccupied ? 'text-[#5c4a42]' : 'text-slate-300'}">${room.tenant}</td>
        <td class="p-3">${statusBadge}</td>
        <td class="p-3">
          ${isOccupied ? `
            <button onclick="alert('💌 Nota manis sudah meluncur terbang via WhatsApp ke kak ${room.tenant}!')" class="p-1 text-[#e5989b] hover:opacity-70 transition-colors cursor-pointer">
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
  document.getElementById('form-action-text').innerText = "Check-In Kamar Baru";
  document.getElementById('btn-cancel').classList.add('hidden');
};