// Danh sách sản phẩm mẫu
const products = [
    "Nike Air Max 2025",
    "Adidas UltraBoost",
    "Adidas Sport",
    "Adidas American",
    "Adidas Premium",
    "Adidas Gold",
    "Converse Classic",
    "Vans Old Skool",
    "Adidas football",
    "Shoe Classic",
    "Biti's Premium",
    "Adidas Silver"
];

// Lấy các phần tử DOM
const searchInput = document.getElementById('search-input');
const suggestionsList = document.getElementById('search-suggestions');

// Xử lý sự kiện nhập liệu
searchInput.addEventListener('input', function () {
    const query = searchInput.value.trim().toLowerCase();

    // Nếu không có nội dung tìm kiếm, ẩn danh sách gợi ý
    if (!query) {
        suggestionsList.style.display = 'none';
        // Phục hồi hiển thị toàn bộ sản phẩm khi xóa ô tìm kiếm
        clearSearchResults();
        return;
    }

    // Lọc danh sách sản phẩm dựa trên từ khóa
    const suggestions = products.filter(product =>
        product.toLowerCase().includes(query)
    );

    // Hiển thị danh sách gợi ý
    renderSuggestions(suggestions);
});

// Hàm hiển thị danh sách gợi ý
function renderSuggestions(suggestions) {
    // Xóa danh sách gợi ý cũ
    suggestionsList.innerHTML = '';

    // Nếu không có gợi ý, ẩn danh sách
    if (suggestions.length === 0) {
        suggestionsList.style.display = 'none';
        return;
    }

    // Tạo danh sách gợi ý mới
    suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;

        // Xử lý sự kiện khi nhấn vào gợi ý
        li.addEventListener('click', function () {
                searchInput.value = suggestion; // Điền gợi ý vào thanh tìm kiếm
                suggestionsList.style.display = 'none'; // Ẩn danh sách gợi ý
                // Hiển thị kết quả tìm kiếm tương ứng
                showSearchResults(suggestion);
        });

        suggestionsList.appendChild(li);
    });

    // Hiển thị danh sách gợi ý
    suggestionsList.style.display = 'block';
}

// Ẩn danh sách gợi ý khi nhấn ra ngoài
document.addEventListener('click', function (event) {
    if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
        suggestionsList.style.display = 'none';
    }
});

// Xử lý khi nhấn Enter trong ô tìm kiếm
searchInput.addEventListener('keydown', function(e){
    if (e.key === 'Enter') {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (!q) return;
        suggestionsList.style.display = 'none';
        showSearchResults(q);
    }
});

// Hiển thị kết quả tìm kiếm: lọc các .product-card
function showSearchResults(query) {
    const q = query.trim().toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    let found = 0;
    cards.forEach(card => {
        const titleEl = card.querySelector('h3');
        const title = titleEl ? titleEl.textContent.trim().toLowerCase() : '';
        if (title.includes(q)) {
            card.style.display = '';
            found++;
        } else {
            card.style.display = 'none';
        }
    });

    // Nếu có kết quả, cuộn đến phần sản phẩm và làm nổi bật ngắn
    const productsSection = document.querySelector('.products');
    if (found > 0 && productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // thêm hiệu ứng nhấp nháy cho phần tử đầu tiên khớp
        const first = document.querySelector('.product-card[style*=display]:not([style*="display: none"])') || document.querySelector('.product-card');
        if (first) {
            first.classList.add('search-result-highlight');
            setTimeout(() => first.classList.remove('search-result-highlight'), 1600);
        }
    } else {
        alert('Không tìm thấy sản phẩm phù hợp.');
    }
}

// Hàm phục hồi danh sách sản phẩm (khi xóa tìm kiếm)
function clearSearchResults() {
    document.querySelectorAll('.product-card').forEach(card => card.style.display = '');
}

// --- News detail: khi bấm vào một mục trong danh sách tin, hiển thị chi tiết và cuộn tới đó ---
document.addEventListener('DOMContentLoaded', () => {
    const newsItems = document.querySelectorAll('.news-item');
    const detail = document.getElementById('news-detail');
    const detailTitle = document.getElementById('news-detail-title');
    const detailBody = document.getElementById('news-detail-body');
    const closeBtn = document.getElementById('close-news-detail');

    if (!newsItems.length || !detail) return;

    newsItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            // If an explicit data-url is provided, open it; otherwise search the title on Google
            const link = item.getAttribute('data-url');
            if (link) {
                window.open(link, '_blank');
                return;
            }
            const titleEl = item.querySelector('.news-info h3');
            const title = titleEl ? titleEl.textContent.trim() : '';
            if (!title) return;
            const query = encodeURIComponent(title);
            const searchUrl = `https://www.google.com/search?q=${query}`;
            window.open(searchUrl, '_blank');
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', () => {
        detail.classList.add('hidden');
        window.scrollTo({ top: detail.offsetTop - 40, behavior: 'smooth' });
    });
});

// Lấy các nút "Mua ngay"
const addToCartButtons = document.querySelectorAll('.add-to-cart');

// Lấy giỏ hàng từ LocalStorage hoặc khởi tạo giỏ hàng trống
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Cập nhật số lượng sản phẩm trong giỏ hàng (hiển thị trên icon giỏ hàng)
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Thêm sự kiện cho các nút "Mua ngay"
addToCartButtons.forEach((button) => {
    button.addEventListener('click', function () {
        const productCard = button.closest('.product-card');
        const productName = productCard.querySelector('h3').textContent;
        const productPrice = parseInt(productCard.querySelector('.price').textContent.replace(/[^0-9]/g, ''));
        const productImage = productCard.querySelector('img').src;

        // Tạo đối tượng sản phẩm
        const product = {
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: 1
        };

        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const existingProduct = cart.find(item => item.name === product.name);
        if (existingProduct) {
            existingProduct.quantity += 1; // Tăng số lượng nếu đã có
        } else {
            cart.push(product); // Thêm sản phẩm mới
        }

        // Lưu giỏ hàng vào LocalStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        // Cập nhật số lượng sản phẩm trong giỏ hàng
        updateCartCount();
        alert(`Đã thêm "${productName}" vào giỏ hàng!`);
    });
});

// Cập nhật số lượng sản phẩm khi tải trang
updateCartCount();

// ---------- USER HEADER DISPLAY ----------
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const headerUser = document.getElementById("header-username");

    if (user && headerUser) {
        headerUser.textContent = user.email;
    }
});

// Xử lý nút 'Nhận mã giảm giá' trên trang khuyến mãi
document.querySelectorAll('button[data-voucher]').forEach(btn => {
    btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-voucher');
        if (!code) return;
        if (!window.VoucherStore) {
            alert('Không thể lưu voucher (VoucherStore không khả dụng).');
            return;
        }
        const res = window.VoucherStore.addVoucher(code);
        if (!res.added) {
            if (res.reason === 'exists') alert('Voucher đã tồn tại!');
            else alert('Không thể nhận voucher.');
        } else {
            alert('Đã nhận voucher: ' + code);
        }
    });
});