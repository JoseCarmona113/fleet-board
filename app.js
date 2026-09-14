const initialData = {
  drivers: [
    { id: 'd1', name: 'Jose', initials: 'JC' },
    { id: 'd2', name: 'Mike', initials: 'MR' },
    { id: 'd3', name: 'Chris', initials: 'CT' },
    { id: 'd4', name: 'Andre', initials: 'AB' },
    { id: 'd5', name: 'Luis', initials: 'LG' },
  ],
  trucks: [
    { id: '101', status: 'available', driverId: '', reason: '', note: '' },
    { id: '104', status: 'available', driverId: '', reason: '', note: '' },
    { id: '112', status: 'in-use', driverId: 'd1', reason: '', note: '' },
    { id: '118', status: 'in-use', driverId: 'd2', reason: '', note: '' },
    { id: '121', status: 'available', driverId: '', reason: '', note: '' },
    { id: '126', status: 'tagged-out', driverId: '', reason: 'Flat / damaged tire', note: 'Driver-side rear tire damaged.' },
    { id: '133', status: 'tagged-out', driverId: '', reason: 'Check engine light', note: 'Maintenance notified.' },
    { id: '140', status: 'in-use', driverId: 'd4', reason: '', note: '' },
    { id: '145', status: 'available', driverId: '', reason: '', note: '' },
    { id: '152', status: 'available', driverId: '', reason: '', note: '' },
  ],
  activity: [
    { at: Date.now() - 1000 * 60 * 12, text: 'Truck 126 tagged out', detail: 'Flat / damaged tire' },
    { at: Date.now() - 1000 * 60 * 35, text: 'Jose assigned to Truck 112', detail: 'Truck marked In Use' },
    { at: Date.now() - 1000 * 60 * 52, text: 'Truck 133 tagged out', detail: 'Check engine light' },
  ]
};

const STORAGE_KEY = 'fleet-board-demo-v1';
let data = loadData();
let activeFilter = 'all';
let selectedTruckId = null;

const truckList = document.getElementById('truckList');
const summary = document.getElementById('summary');
const activityList = document.getElementById('activityList');
const updatedAt = document.getElementById('updatedAt');
const dialog = document.getElementById('truckDialog');
const form = document.getElementById('truckForm');
const dialogTitle = document.getElementById('dialogTitle');
const statusInput = document.getElementById('statusInput');
const driverInput = document.getElementById('driverInput');
const reasonInput = document.getElementById('reasonInput');
const noteInput = document.getElementById('noteInput');
const driverField = document.getElementById('driverField');
const reasonField = document.getElementById('reasonField');
const noteField = document.getElementById('noteField');

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(initialData);
  } catch {
    return structuredClone(initialData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function driverName(id) {
  return data.drivers.find(d => d.id === id)?.name || '';
}

function statusLabel(status) {
  return ({ available: 'Available', 'in-use': 'In Use', 'tagged-out': 'Tagged Out' })[status];
}

function statusIcon(status) {
  return ({ available: '✓', 'in-use': '●', 'tagged-out': '!' })[status];
}

function renderSummary() {
  const counts = data.trucks.reduce((acc, truck) => {
    acc[truck.status] = (acc[truck.status] || 0) + 1;
    return acc;
  }, {});
  summary.innerHTML = `
    <div class="summary-card available"><strong>${counts.available || 0}</strong><span>Available</span></div>
    <div class="summary-card in-use"><strong>${counts['in-use'] || 0}</strong><span>In Use</span></div>
    <div class="summary-card tagged-out"><strong>${counts['tagged-out'] || 0}</strong><span>Tagged Out</span></div>
  `;
}

function renderTrucks() {
  const trucks = data.trucks.filter(t => activeFilter === 'all' || t.status === activeFilter);
  truckList.innerHTML = trucks.length ? trucks.map(truck => {
    let meta = 'Ready for assignment';
    if (truck.status === 'in-use') meta = `Driver: ${driverName(truck.driverId) || 'Unassigned'}`;
    if (truck.status === 'tagged-out') meta = `${truck.reason || 'Reason not entered'}${truck.note ? ` · ${truck.note}` : ''}`;
    return `
      <button class="truck-card ${truck.status}" data-id="${truck.id}">
        <div class="status-dot">${statusIcon(truck.status)}</div>
        <div>
          <div class="truck-number">Truck ${truck.id}</div>
          <div class="truck-meta">${escapeHtml(meta)}</div>
        </div>
        <span class="status-pill">${statusLabel(truck.status)}</span>
      </button>
    `;
  }).join('') : '<div class="empty">No trucks in this category.</div>';

  document.querySelectorAll('.truck-card').forEach(btn => {
    btn.addEventListener('click', () => openTruck(btn.dataset.id));
  });
}

function renderActivity() {
  const activity = [...data.activity].sort((a,b) => b.at - a.at).slice(0, 10);
  activityList.innerHTML = activity.length ? activity.map(item => `
    <div class="activity-item">
      <strong>${escapeHtml(item.text)}</strong>
      <p>${escapeHtml(item.detail)} · ${timeAgo(item.at)}</p>
    </div>
  `).join('') : '<div class="empty">No activity yet.</div>';
}

function render() {
  renderSummary();
  renderTrucks();
  renderActivity();
  updatedAt.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

function openTruck(id) {
  selectedTruckId = id;
  const truck = data.trucks.find(t => t.id === id);
  dialogTitle.textContent = `Truck ${id}`;
  statusInput.value = truck.status;
  driverInput.innerHTML = '<option value="">Select driver</option>' + data.drivers.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
  driverInput.value = truck.driverId || '';
  reasonInput.value = truck.reason || '';
  noteInput.value = truck.note || '';
  syncFields();
  dialog.showModal();
}

function syncFields() {
  const status = statusInput.value;
  driverField.classList.toggle('hidden', status !== 'in-use');
  reasonField.classList.toggle('hidden', status !== 'tagged-out');
  noteField.classList.toggle('hidden', status !== 'tagged-out');
  driverInput.required = status === 'in-use';
  reasonInput.required = status === 'tagged-out';
}

statusInput.addEventListener('change', syncFields);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const truck = data.trucks.find(t => t.id === selectedTruckId);
  const previousStatus = truck.status;
  const previousDriver = truck.driverId;
  const nextStatus = statusInput.value;

  if (nextStatus === 'in-use' && !driverInput.value) return;
  if (nextStatus === 'tagged-out' && !reasonInput.value) return;

  truck.status = nextStatus;
  truck.driverId = nextStatus === 'in-use' ? driverInput.value : '';
  truck.reason = nextStatus === 'tagged-out' ? reasonInput.value : '';
  truck.note = nextStatus === 'tagged-out' ? noteInput.value.trim() : '';

  let text = `Truck ${truck.id} marked ${statusLabel(nextStatus)}`;
  let detail = 'Status updated';
  if (nextStatus === 'in-use') {
    text = `${driverName(truck.driverId)} assigned to Truck ${truck.id}`;
    detail = 'Truck marked In Use';
  } else if (nextStatus === 'tagged-out') {
    text = `Truck ${truck.id} tagged out`;
    detail = truck.reason + (truck.note ? ` — ${truck.note}` : '');
  } else if (previousStatus === 'in-use' && previousDriver) {
    detail = `${driverName(previousDriver)} removed from assignment`;
  }

  data.activity.unshift({ at: Date.now(), text, detail });
  saveData();
  dialog.close();
  render();
});

document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === btn));
    renderTrucks();
  });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset the prototype to the original demo data?')) return;
  data = structuredClone(initialData);
  saveData();
  render();
});

function timeAgo(timestamp) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function escapeHtml(value = '') {
  return value.replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
}

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
