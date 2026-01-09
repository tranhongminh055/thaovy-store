// Lấy các phần tử cần thiết
const cartItemsContainer = document.querySelector('.cart-items'); // chỉ render sản phẩm
const subtotalElement = document.getElementById('subtotal');
const discountElement = document.getElementById('discount');
const totalElement = document.getElementById('total');
const voucherInput = document.getElementById('voucher-code');
const applyVoucherButton = document.getElementById('apply-voucher');
const toggleVoucherButton = document.getElementById('toggle-voucher-list');
const voucherList = document.getElementById('voucher-list');
const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
const creditCardForm = document.getElementById('credit-card-form');
const bankTransferForm = document.getElementById('bank-transfer-form');
const checkoutButton = document.getElementById('checkout');

// Hàm chuẩn hóa giá từ LocalStorage
function getPriceNumber(value) {
    if (!value) return 0;
    return parseInt(value.toString().replace(/[^0-9]/g, '')) || 0;
}

// Hàm format VND
function formatVND(number) {
    return number.toLocaleString('vi-VN') + ' VND';
}

// Lấy giỏ hàng từ LocalStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// List of major Vietnamese banks to populate bank-select
const VIETNAM_BANKS = [
    'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
    'Ngân hàng TMCP Công Thương Việt Nam (VietinBank)',
    'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
    'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    'Ngân hàng TMCP Á Châu (ACB)',
    'Ngân hàng TMCP Quân Đội (MB)',
    'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
    'Ngân hàng TMCP Phát triển Nhà TPHCM (HDBank)',
    'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)',
    'Ngân hàng Nông nghiệp và Phát triển Nông thôn (Agribank)',
    'Ngân hàng TMCP Sài Gòn (SCB)',
    'Ngân hàng TMCP Quốc Dân (NCB)',
    'Ngân hàng TMCP Đông Á (DongA Bank)',
    'Ngân hàng TMCP Phương Đông (OCB)',
    'Ngân hàng TMCP Hàng Hải (MSB)',
    'Ngân hàng TMCP Quốc Tế Việt Nam (VIB)',
    'Ngân hàng TMCP Bảo Việt (BaoVietBank)',
    'Ngân hàng TMCP Bưu Điện Liên Việt (LienVietPostBank)'
];

// Hiển thị giỏ hàng
function renderCart() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <h2>Giỏ hàng của bạn đang trống</h2>
                <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm.</p>
                <a href="index.html" class="btn-continue-shopping">Tiếp tục mua sắm</a>
            </div>
        `;
        subtotalElement.textContent = '0 VND';
        totalElement.textContent = '0 VND';
        discountElement.textContent = '0 VND';
        return;
    }

    let cartHTML = `
        <div class="cart-header">
            <div>Sản phẩm</div>
            <div>Tên sản phẩm</div>
            <div>Giá</div>
            <div>Số lượng</div>
            <div>Tổng</div>
            <div>Thao tác</div>
        </div>
    `;

    cart.forEach((item, index) => {
        const price = getPriceNumber(item.price);
        cartHTML += `
            <div class="cart-item" data-index="${index}">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-info">
                    <h3>${item.name}</h3>
                </div>
                <div class="item-price">${formatVND(price)}</div>
                <div class="quantity-control">
                    <button class="decrease">-</button>
                    <input type="number" value="${item.quantity}" min="1" class="item-quantity">
                    <button class="increase">+</button>
                </div>
                <div class="item-total">${formatVND(price * item.quantity)}</div>
                <div class="item-remove">
                    <button class="remove-item"><i class="fas fa-trash"></i> Xóa</button>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = cartHTML;
    // Thêm sự kiện
    addCartEventListeners();
    updateTotal();
    // Cập nhật badge số lượng trên header
    if (typeof updateCartCount === 'function') updateCartCount();
}

// Cập nhật tổng tiền
function updateTotal() {
    const subtotal = cart.reduce((total, item) =>
        total + getPriceNumber(item.price) * item.quantity, 0
    );

    subtotalElement.textContent = formatVND(subtotal);

    // Nếu có voucher đã áp dụng, tính lại discount dựa trên subtotal (để giữ % luôn đúng khi thay đổi số lượng)
    const appliedCode = (localStorage.getItem('appliedVoucher') || '').toString().trim().toUpperCase();
    let discount = 0;
    if (appliedCode === 'SALE10') discount = subtotal * 0.1;
    else if (appliedCode === 'SALE20') discount = subtotal * 0.2;
    else if (appliedCode === 'FREESHIP') discount = 50000;
    else {
        // fallback: nếu không có appliedVoucher, dùng giá trị hiện tại trong discountElement
        discount = getPriceNumber(discountElement.textContent);
    }

    discountElement.textContent = formatVND(discount);
    const total = Math.max(subtotal - discount, 0);
    totalElement.textContent = formatVND(total);
}

// Thêm sự kiện cho nút cập nhật giỏ hàng
function addCartEventListeners() {
    document.querySelectorAll('.increase').forEach((button, index) => {
        button.addEventListener('click', () => {
            cart[index].quantity++;
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
        });
    });

    document.querySelectorAll('.decrease').forEach((button, index) => {
        button.addEventListener('click', () => {
            if (cart[index].quantity > 1) {
                cart[index].quantity--;
                localStorage.setItem('cart', JSON.stringify(cart));
                renderCart();
            }
        });
    });

    document.querySelectorAll('.remove-item').forEach((button, index) => {
        button.addEventListener('click', () => {
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
        });
    });
}

// CLICK voucher từ danh sách
document.querySelectorAll('#voucher-list li[data-voucher]').forEach(voucherItem => {
    voucherItem.addEventListener('click', function () {
        voucherInput.value = this.getAttribute('data-voucher');
        voucherList.classList.add('hidden');
        applyVoucherButton.click();
    });
});

// Toggle danh sách voucher
toggleVoucherButton.addEventListener('click', function () {
    voucherList.classList.toggle('hidden');
});

// Áp dụng voucher
applyVoucherButton.addEventListener('click', function () {
    const code = voucherInput.value.trim().toUpperCase();
    const subtotal = cart.reduce((total, item) =>
        total + getPriceNumber(item.price) * item.quantity, 0
    );

    if (!code) {
        alert('Vui lòng nhập mã voucher!');
        return;
    }

    // Xác định giá trị giảm
    let discount = 0;
    if (code === "SALE10") discount = subtotal * 0.1;
    else if (code === "SALE20") discount = subtotal * 0.2;
    else if (code === "FREESHIP") discount = 50000;
    else {
        alert("Mã voucher không hợp lệ!");
        discountElement.textContent = formatVND(0);
        updateTotal();
        return;
    }

    // Nếu chưa lưu trong VoucherStore thì lưu (không chặn khi đã tồn tại)
    if (window.VoucherStore) {
        if (!window.VoucherStore.hasVoucher(code)) {
            window.VoucherStore.addVoucher(code);
        }
    }

    // Lưu voucher đã áp để tái tính sau khi refresh hoặc thay đổi giỏ
    localStorage.setItem('appliedVoucher', code);

    // Áp dụng giảm giá và cập nhật giao diện
    discountElement.textContent = formatVND(discount);
    updateTotal();
    renderReceivedVouchers();
    alert('Áp dụng voucher thành công!');
});

// Áp dụng voucher theo mã (sử dụng từ danh sách voucher đã nhận)
function applyVoucherByCode(code) {
    if (!code) return false;
    code = code.toString().trim().toUpperCase();
    // reflect code into input so user sees which voucher is applied
    if (voucherInput) voucherInput.value = code;
    // show preview
    const previewEl = document.getElementById('voucher-preview');
    if (previewEl) previewEl.textContent = code;
    const subtotal = cart.reduce((total, item) =>
        total + getPriceNumber(item.price) * item.quantity, 0
    );

    let discount = 0;
    if (code === "SALE10") discount = subtotal * 0.1;
    else if (code === "SALE20") discount = subtotal * 0.2;
    else if (code === "FREESHIP") discount = 50000;
    else {
        alert('Mã voucher không hợp lệ!');
        return false;
    }

    // Lưu mã đã áp để duy trì trạng thái sau refresh
    localStorage.setItem('appliedVoucher', code);
    discountElement.textContent = formatVND(discount);
    updateTotal();
    renderReceivedVouchers();
    return true;
}

// --- Address & banks dynamic population ---
document.addEventListener('DOMContentLoaded', () => {
    // populate bank-list
    const bankSelect = document.getElementById('bank-list');
    if (bankSelect) {
        VIETNAM_BANKS.forEach(b => {
            const opt = document.createElement('option'); opt.value = b; opt.textContent = b; bankSelect.appendChild(opt);
        });
    }

    // address selects
    const cityEl = document.getElementById('city-select');
    const districtEl = document.getElementById('district-select');
    const wardEl = document.getElementById('ward-select');
    const detailEl = document.getElementById('customer-address');
    const mapEl = document.getElementById('map');

    function setMapQuery(q){ if(!mapEl) return; const src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed'; mapEl.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0" src="${src}" allowfullscreen="" loading="lazy"></iframe>`; }

    // load address dataset
    fetch('vn-address.json').then(r=>r.json()).then(data=>{
        // fill cities
        if(cityEl){
            cityEl.innerHTML = '<option value="">Chọn Tỉnh/TP</option>';
            Object.keys(data).forEach(city => { const o = document.createElement('option'); o.value = city; o.textContent = city; cityEl.appendChild(o); });
        }

        function populateDistricts(city){
            districtEl.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
            wardEl.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            if(!city || !data[city]) return;
            Object.keys(data[city]).forEach(dist => { const o = document.createElement('option'); o.value = dist; o.textContent = dist; districtEl.appendChild(o); });
        }

        function populateWards(city, district){
            wardEl.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            if(!city || !district || !data[city] || !data[city][district]) return;
            data[city][district].forEach(w => { const o = document.createElement('option'); o.value = w; o.textContent = w; wardEl.appendChild(o); });
        }

        // restore selection from orderData if present
        let od = {};
        try{ od = JSON.parse(localStorage.getItem('orderData')||'{}'); }catch(e){ od = {}; }
        if(od && od.customer && od.customer.addressStructured){
            const s = od.customer.addressStructured;
            if(s.city) cityEl.value = s.city;
            populateDistricts(s.city);
            if(s.district) districtEl.value = s.district;
            populateWards(s.city, s.district);
            if(s.ward) wardEl.value = s.ward;
            if(detailEl) detailEl.value = s.detail || '';
            // update map
            setMapQuery([s.detail||'', s.ward||'', s.district||'', s.city||''].filter(Boolean).join(', '));
        }

        cityEl && cityEl.addEventListener('change', function(){ populateDistricts(this.value); saveStructuredAddress(); });
        districtEl && districtEl.addEventListener('change', function(){ populateWards(cityEl.value, this.value); saveStructuredAddress(); });
        wardEl && wardEl.addEventListener('change', function(){ saveStructuredAddress(); });
        detailEl && detailEl.addEventListener('input', function(){ saveStructuredAddress(); });

        function saveStructuredAddress(){
            const city = cityEl ? cityEl.value : '';
            const district = districtEl ? districtEl.value : '';
            const ward = wardEl ? wardEl.value : '';
            const detail = detailEl ? detailEl.value.trim() : '';
            const structured = { city, district, ward, detail };
            try{
                const existing = JSON.parse(localStorage.getItem('orderData')||'{}');
                existing.customer = existing.customer || {};
                existing.customer.addressStructured = structured;
                // also set a simple address string
                existing.customer.address = [detail, ward, district, city].filter(Boolean).join(', ');
                localStorage.setItem('orderData', JSON.stringify(existing));
            }catch(e){}
            // update map
            const q = [detail, ward, district, city].filter(Boolean).join(', ');
            if(q) setMapQuery(q);
        }

    }).catch(err=>{ console.warn('Could not load vn-address.json', err); });
});

// Render danh sách voucher đã nhận trong giỏ hàng
function renderReceivedVouchers() {
    const container = document.getElementById('received-voucher-list');
    if (!container || !window.VoucherStore) return;
    const list = window.VoucherStore.getVouchers();
    container.innerHTML = '';
    if (list.length === 0) {
        container.innerHTML = '<li>Chưa có voucher nào</li>';
        return;
    }
    list.forEach(v => {
        const li = document.createElement('li');
        li.textContent = `${v.code}`;

        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Áp dụng';
        applyBtn.style.marginLeft = '8px';
        applyBtn.addEventListener('click', () => {
            applyVoucherByCode(v.code);
        });

        const btn = document.createElement('button');
        btn.textContent = 'Xóa';
        btn.style.marginLeft = '8px';
        btn.addEventListener('click', () => {
            // Nếu xóa voucher đang áp thì xoá luôn trạng thái applied
            const applied = (localStorage.getItem('appliedVoucher') || '').toString().trim().toUpperCase();
            if (applied === v.code) {
                localStorage.removeItem('appliedVoucher');
                // reset discount
                discountElement.textContent = formatVND(0);
            }
            window.VoucherStore.removeVoucher(v.code);
            renderReceivedVouchers();
            updateTotal();
        });

        // Nếu voucher đang được áp dụng, hiển thị trạng thái
        const appliedCode = (localStorage.getItem('appliedVoucher') || '').toString().trim().toUpperCase();
        if (appliedCode === v.code) {
            const span = document.createElement('span');
            span.textContent = 'Đã áp dụng';
            span.style.marginLeft = '8px';
            li.appendChild(span);
            // ensure input shows the applied voucher
            if (voucherInput) voucherInput.value = v.code;
            const previewEl = document.getElementById('voucher-preview');
            if (previewEl) previewEl.textContent = v.code;
        } else {
            li.appendChild(applyBtn);
        }

        li.appendChild(btn);
        container.appendChild(li);
    });
}

// show voucher preview while typing and try to match received vouchers
if (voucherInput) {
    voucherInput.addEventListener('input', () => {
        const q = voucherInput.value.toString().trim().toUpperCase();
        const previewEl = document.getElementById('voucher-preview');
        if (!previewEl) return;
        if (!q) { previewEl.textContent = ''; return; }

        // search in VoucherStore first
        let found = null;
        if (window.VoucherStore) {
            const vs = window.VoucherStore.getVouchers();
            found = vs.find(v => v.code && v.code.toString().toUpperCase() === q);
        }
        // fallback: search static voucher-list items
        if (!found) {
            const listItems = document.querySelectorAll('#voucher-list li[data-voucher]');
            listItems.forEach(li => {
                if (li.getAttribute('data-voucher') && li.getAttribute('data-voucher').toUpperCase() === q) found = { code: q };
            });
        }

        previewEl.textContent = found ? (found.code || q) : 'Mã chưa xác nhận';
    });
}

// Chọn phương thức thanh toán
paymentMethods.forEach(method => {
    method.addEventListener('change', function () {
        creditCardForm.classList.add('hidden');
        bankTransferForm.classList.add('hidden');

        if (this.value === 'credit-card') creditCardForm.classList.remove('hidden');
        if (this.value === 'bank-transfer') bankTransferForm.classList.remove('hidden');
    });
});

// Thanh toán
checkoutButton.addEventListener('click', () => {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();

    if (!name || !phone || !address) {
        alert('Vui lòng nhập đầy đủ thông tin khách hàng!');
        return;
    }

    const subtotal = cart.reduce((total, item) =>
        total + getPriceNumber(item.price) * item.quantity, 0
    );
    const discount = getPriceNumber(discountElement.textContent);
    const total = Math.max(subtotal - discount, 0);

    const orderData = {
        orderId: `#${Math.floor(Math.random() * 1000000000)}`,
        orderDate: new Date().toLocaleDateString(),
        confirmTime: "30 phút sau khi đặt hàng",
        deliveryTime: "2-3 ngày làm việc",
        products: cart,
        subtotal,
        discount,
        total,
        customer: { name, phone, address },
    };

        // read selected payment method and details from cart page and include in orderData
        try{
            const pm = document.querySelector('input[name="payment-method"]:checked');
            if(pm && pm.value) {
                const payment = { method: pm.value };
                if(pm.value === 'credit-card'){
                    const cardNum = document.getElementById('card-number') ? document.getElementById('card-number').value.replace(/\s+/g,'') : '';
                    const holder = document.getElementById('card-holder') ? document.getElementById('card-holder').value.trim() : '';
                    const exp = document.getElementById('expiry-date') ? document.getElementById('expiry-date').value.trim() : '';
                    // mask card number except last 4
                    const masked = cardNum ? cardNum.replace(/.(?=.{4})/g, '*') : '';
                    payment.details = { cardNumber: masked, cardHolder: holder, expiry: exp };
                } else if(pm.value === 'bank-transfer'){
                    const bank = document.getElementById('bank-list') ? document.getElementById('bank-list').value : '';
                    const acc = document.getElementById('bank-account-number') ? document.getElementById('bank-account-number').value.trim() : '';
                    const accName = document.getElementById('bank-account-name') ? document.getElementById('bank-account-name').value.trim() : '';
                    const note = document.getElementById('bank-account-note') ? document.getElementById('bank-account-note').value.trim() : '';
                    payment.details = { bank, accountNumber: acc, accountName: accName, note };
                }
                orderData.payment = payment;
            }
        }catch(e){/* ignore */}

        localStorage.setItem('orderData', JSON.stringify(orderData));
        window.location.href = 'hoadonxacnhan.html';
});

// Sync customer info edits to localStorage.orderData so confirmation page sees latest values
(function syncCartCustomerToOrder(){
    const nameEl = document.getElementById('customer-name');
    const phoneEl = document.getElementById('customer-phone');
    const addrEl = document.getElementById('customer-address');
    function saveOrderDataPartial(){
        try{
            const raw = localStorage.getItem('orderData');
            const od = raw ? JSON.parse(raw) : {};
            od.customer = od.customer || {};
            if(nameEl) od.customer.name = nameEl.value.trim();
            if(phoneEl) od.customer.phone = phoneEl.value.trim();
            if(addrEl) od.customer.address = addrEl.value.trim();
            localStorage.setItem('orderData', JSON.stringify(od));
        }catch(e){/* ignore */}
    }
    [nameEl, phoneEl, addrEl].forEach(el=>{ if(!el) return; el.addEventListener('input', saveOrderDataPartial); });
})();

// Render giỏ hàng khi tải trang
renderCart();

// Prefill customer and payment fields from orderData (used for reorder flow)
function prefillOrderData(){
    try{
        const od = JSON.parse(localStorage.getItem('orderData')||'{}');
        if(!od) return;
        // customer
        if(od.customer){
            const nameEl = document.getElementById('customer-name');
            const phoneEl = document.getElementById('customer-phone');
            const addrEl = document.getElementById('customer-address');
            if(nameEl && od.customer.name) nameEl.value = od.customer.name;
            if(phoneEl && od.customer.phone) phoneEl.value = od.customer.phone;
            if(addrEl && od.customer.address) addrEl.value = od.customer.address;
        }
        // payment
        if(od.payment && od.payment.method){
            const method = od.payment.method;
            const pmRadio = document.querySelector('input[name="payment-method"][value="'+method+'"]');
            if(pmRadio){ pmRadio.checked = true; pmRadio.dispatchEvent(new Event('change')); }
            const d = od.payment.details || {};
            if(method === 'credit-card'){
                const cardNumEl = document.getElementById('card-number');
                const cardHolderEl = document.getElementById('card-holder');
                const expiryEl = document.getElementById('expiry-date');
                if(cardNumEl && d.cardNumber) cardNumEl.value = d.cardNumber;
                if(cardHolderEl && d.cardHolder) cardHolderEl.value = d.cardHolder;
                if(expiryEl && d.expiry) expiryEl.value = d.expiry;
            } else if(method === 'bank-transfer'){
                const bankSelect = document.getElementById('bank-list');
                const accNumEl = document.getElementById('bank-account-number');
                const accNameEl = document.getElementById('bank-account-name');
                if(bankSelect && d.bank) bankSelect.value = d.bank;
                if(accNumEl && d.accountNumber) accNumEl.value = d.accountNumber;
                if(accNameEl && d.accountName) accNameEl.value = d.accountName || '';
                const noteEl = document.getElementById('bank-account-note');
                if(noteEl && d.note) noteEl.value = d.note || '';
            }
        }
    }catch(e){/* ignore */}
}

// Try to prefill before user interacts
prefillOrderData();

// Render voucher đã nhận khi tải trang
renderReceivedVouchers();

// Render khi tải trang
renderCart();

// Nếu muốn khởi tạo giỏ hàng mẫu, hãy sử dụng đoạn này một lần duy nhất hoặc khi cần reset giỏ hàng:
// const sampleCart = [
//     {
//         name: "Áo thun nam",
//         quantity: 2,
//         price: 150000,
//         image: "path/to/image1.jpg",
//     },
//     {
//         name: "Quần jeans nữ",
//         quantity: 1,
//         price: 350000,
//         image: "path/to/image2.jpg",
//     },
// ];
// localStorage.setItem('cart', JSON.stringify(sampleCart));