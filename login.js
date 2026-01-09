function login() {
    let email = document.getElementById("loginEmail").value.trim();
    let password = document.getElementById("loginPassword").value.trim();
    let msg = document.getElementById("msg");

    if (email === "" || password === "") {
        msg.textContent = "Vui lòng nhập đầy đủ!";
        return;
    }

    // Call API to authenticate
    fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, device: navigator.userAgent })
    }).then(r => r.json()).then(data => {
        if (data && data.accessToken) {
            const logged = { name: data.name || '', email: data.email, accessToken: data.accessToken, refreshToken: data.refreshToken, sessionId: data.sessionId };
            localStorage.setItem('loggedUser', JSON.stringify(logged));
            window.location.href = 'index.html';
        } else {
            msg.textContent = data && data.error ? data.error : 'Sai email hoặc mật khẩu!';
        }
    }).catch(err => {
        console.error('Login error', err);
        msg.textContent = 'Lỗi kết nối tới server';
    });
}
