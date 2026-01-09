// checkout.js: render cart summary, handle order submission
document.addEventListener('DOMContentLoaded', () => {
  const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  const orderItemsEl = document.getElementById('orderItems');
  const orderTotalEl = document.getElementById('orderTotal');

  function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cart')||'[]');
    if (!cart.length) { orderItemsEl.innerHTML = 'Không có sản phẩm.'; orderTotalEl.innerText = '0đ'; return; }
    orderItemsEl.innerHTML = '';
    let total = 0;
    cart.forEach(it => {
      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `<img src="${it.image||'src/giay nam dep.jfif'}" alt="${it.name}"><div><strong>${it.name}</strong><div class="muted">Số lượng: ${it.quantity}</div></div><div style="margin-left:auto">${(it.price||0).toLocaleString()}đ</div>`;
      orderItemsEl.appendChild(item);
      total += (Number(it.price)||0) * (Number(it.quantity)||1);
    });
    orderTotalEl.innerText = total.toLocaleString() + 'đ';
  }

  renderCart();

  const checkoutFormEl = document.getElementById('checkoutForm');
  if (checkoutFormEl) {
    checkoutFormEl.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('shipName').value.trim();
      const phone = document.getElementById('shipPhone').value.trim();
      const email = document.getElementById('shipEmail').value.trim();
      const address = document.getElementById('shipAddress').value.trim();
      const delivery = document.querySelector('input[name="delivery"]:checked').value;
      const payment = document.querySelector('input[name="payment"]:checked').value;
      if (!name || !phone || !address) { alert('Vui lòng điền đầy đủ thông tin giao hàng.'); return; }
      const order = { id: 'ORD'+Date.now(), name, phone, email, address, delivery, payment, items: JSON.parse(localStorage.getItem('cart')||'[]'), total: document.getElementById('orderTotal').innerText, createdAt: Date.now() };
      // save orders
      const orders = JSON.parse(localStorage.getItem('orders')||'[]');
      orders.push(order);
      localStorage.setItem('orders', JSON.stringify(orders));
      // clear cart
      localStorage.setItem('cart','[]');
      if (window.updateCartCount) updateCartCount();
      alert('Đặt hàng thành công — Mã đơn: ' + order.id);
      renderCart();
      e.target.reset();
    });
  }
});
