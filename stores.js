// Simple stores data
const STORES = [
  { id: 'dn', name: 'ThaoVyStore - Đà Nẵng', city: 'Đà Nẵng', address: '123 Nguyễn Văn Linh, Q. Hải Châu', hours: '9:00 - 21:00', phone: '090-111-0001', q: 'ThaoVyStore Đà Nẵng' },
  { id: 'hn', name: 'ThaoVyStore - Hà Nội', city: 'Hà Nội', address: '45 Hoàng Hoa Thám, Ba Đình', hours: '9:00 - 21:00', phone: '090-111-0002', q: 'ThaoVyStore Hà Nội' },
  { id: 'hcm', name: 'ThaoVyStore - Hồ Chí Minh', city: 'Hồ Chí Minh', address: '210 Lê Lợi, Q.1', hours: '9:00 - 22:00', phone: '090-111-0003', q: 'ThaoVyStore Hồ Chí Minh' },
  { id: 'hp', name: 'ThaoVyStore - Hải Phòng', city: 'Hải Phòng', address: '88 Trần Phú, Ngô Quyền', hours: '9:00 - 20:00', phone: '090-111-0004', q: 'ThaoVyStore Hải Phòng' }
];

function renderStores(list) {
  const container = document.getElementById('storesContainer');
  container.innerHTML = '';
  list.forEach(s => {
    const el = document.createElement('div');
    el.className = 'store-card';
    el.dataset.q = s.q;
    el.dataset.id = s.id;
    el.innerHTML = `
      <div class="meta">
        <h4>${s.name} <span class="badge">${s.city}</span></h4>
        <p>${s.address}</p>
        <p>${s.hours} • ${s.phone}</p>
      </div>`;
    el.addEventListener('click', () => selectStore(s.id));
    container.appendChild(el);
  });
}

function selectStore(id) {
  const store = STORES.find(s => s.id === id);
  if (!store) return;
  // update map and details
  const q = encodeURIComponent(store.q);
  document.getElementById('mapFrame').src = `https://www.google.com/maps?q=${q}&output=embed`;
  document.getElementById('map-title').innerText = store.name;
  document.getElementById('branchAddress').innerText = 'Địa chỉ: ' + store.address;
  document.getElementById('branchHours').innerText = 'Giờ mở cửa: ' + store.hours;
  document.getElementById('branchPhone').innerText = 'Hotline: ' + store.phone;
  // highlight selected card
  document.querySelectorAll('.store-card').forEach(c => c.classList.remove('selected'));
  const selected = document.querySelector(`.store-card[data-id="${id}"]`);
  if (selected) selected.classList.add('selected');
}

document.addEventListener('DOMContentLoaded', () => {
  renderStores(STORES);
  // default select first
  if (STORES.length) selectStore(STORES[0].id);

  // filter input
  const filter = document.getElementById('filter-input');
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    if (!q) return renderStores(STORES);
    const filtered = STORES.filter(s => (s.name + ' ' + s.city + ' ' + s.address).toLowerCase().includes(q));
    renderStores(filtered);
  });
});
