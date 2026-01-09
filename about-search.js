// Product data (shared with index.js)
const ABOUT_PRODUCTS = [
  { name: 'Nike Air Max 2025', image: 'src/giay-the-thao-nam-adidas-galaxy-6-hp2416-mau-xanh-dam-size-44-6771ffad4a016-30122024090429.webp', price: '2.200.000đ' },
  { name: 'Adidas UltraBoost', image: 'src/giay nam dep.jfif', price: '2.500.000đ' },
  { name: 'Adidas Sport', image: 'src/louis vutton.jpg', price: '2.900.000đ' },
  { name: 'Adidas American', image: 'src/b692c9562c49ccb7d224f427a53bf935.jpg', price: '3.500.000đ' },
  { name: 'Adidas Premium', image: 'src/Giy Tennis Nam Adidas Barricade M GW2963 Phi Mu-anh-5.webp', price: '2.500.000đ' },
  { name: 'Adidas Gold', image: 'src/adidas gold.jpeg', price: '4.500.000đ' },
  { name: 'Converse Classic', image: 'src/sg-11134201-22100-7vlfiz21k4iv43.jfif', price: '950.000đ' },
  { name: 'Vans Old Skool', image: 'src/giay-nike-air-zoom-pegasus-39-premium-nam-trang-xanh-05-1000x1000.jpg', price: '1.150.000đ' },
  { name: "Biti's Premium", image: 'src/adidas silver.jpeg', price: '1.150.000đ' },
  { name: 'Adidas Silver', image: 'src/adidas silver 2.jfif', price: '1.150.000đ' }
];

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-btn');
  const suggestions = document.getElementById('search-suggestions');
  const resultsWrap = document.getElementById('search-results');
  const resultsGrid = document.getElementById('searchProducts');

  function renderSuggestions(list) {
    suggestions.innerHTML = '';
    if (!list.length) { suggestions.style.display = 'none'; return; }
    list.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.name;
      li.addEventListener('click', () => {
        input.value = item.name;
        suggestions.style.display = 'none';
        showResults(item.name);
      });
      suggestions.appendChild(li);
    });
    suggestions.style.display = 'block';
  }

  function showResults(query) {
    const q = query.trim().toLowerCase();
    const matches = ABOUT_PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
    resultsGrid.innerHTML = '';
    if (!matches.length) {
      resultsGrid.innerHTML = '<div class="muted">Không tìm thấy sản phẩm phù hợp.</div>';
      resultsWrap.classList.remove('hidden');
      return;
    }
    matches.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <div class="price">${p.price}</div>
        <button class="add-to-cart">Mua ngay</button>
      `;
      // attach add-to-cart behavior similar to index.js
      card.querySelector('.add-to-cart').addEventListener('click', () => {
        let cart = JSON.parse(localStorage.getItem('cart')||'[]');
        const existing = cart.find(i=>i.name===p.name);
        if (existing) existing.quantity+=1; else cart.push({ name: p.name, price: parseInt(p.price.replace(/[^0-9]/g,'')) || 0, image: p.image, quantity:1 });
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount && updateCartCount();
        alert('Đã thêm '+p.name+' vào giỏ hàng');
      });
      resultsGrid.appendChild(card);
    });
    resultsWrap.classList.remove('hidden');
    // scroll to results
    resultsWrap.scrollIntoView({ behavior: 'smooth' });
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { suggestions.style.display='none'; resultsWrap.classList.add('hidden'); clearSearchResults && clearSearchResults(); return; }
    const filtered = ABOUT_PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
    renderSuggestions(filtered.slice(0,8));
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); showResults(input.value); suggestions.style.display='none'; }
  });

  // Button click (magnifier)
  if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); showResults(input.value); suggestions.style.display = 'none'; });

  document.addEventListener('click', (ev) => {
    if (!input.contains(ev.target) && !suggestions.contains(ev.target)) suggestions.style.display='none';
  });
});
