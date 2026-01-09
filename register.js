function register() {
    let name = document.getElementById("regName").value.trim();
    let email = document.getElementById("regEmail").value.trim();
    let password = document.getElementById("regPassword").value.trim();
    let msg = document.getElementById("msg");

    // Basic validations
    if (name.length < 2) {
        msg.textContent = "Họ tên phải có ít nhất 2 kí tự.";
        return;
    }

    if (email === "") {
        msg.textContent = "Vui lòng nhập email.";
        return;
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
        msg.textContent = "Email không đúng định dạng (ví dụ: user@example.com).";
        return;
    }

    if (password.length < 6) {
        msg.textContent = "Mật khẩu phải có ít nhất 6 kí tự.";
        return;
    }

    // Call API to register
    fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    }).then(r => r.json()).then(data => {
        if (data && data.success) {
            msg.textContent = 'Đăng ký thành công! Chuyển hướng...';
            setTimeout(() => { window.location.href = 'login.html'; }, 1000);
        } else {
            msg.textContent = data && data.error ? data.error : 'Đăng ký thất bại';
        }
    }).catch(err => {
        console.error('Register error', err);
        msg.textContent = 'Lỗi kết nối tới server';
    });
}
