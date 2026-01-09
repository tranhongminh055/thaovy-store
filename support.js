// Email-based support chat system for ThaoVyStore
(function(){
  const chatWindow = document.getElementById('chatWindow');
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');

  // Generate unique session ID for this customer (stored in sessionStorage)
  let sessionId = sessionStorage.getItem('supportSessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('supportSessionId', sessionId);
  }

  let customerEmail = sessionStorage.getItem('customerEmail') || '';
  let customerName = sessionStorage.getItem('customerName') || '';
  let isChecking = false;

  const API_URL = '/.netlify/functions';

  function appendMessage(text, from='bot', type=''){
    const wrap = document.createElement('div'); 
    wrap.className = 'msg ' + (from==='customer'?'user':'bot');
    const b = document.createElement('div'); 
    b.className = 'bubble ' + (from==='customer'?'user':'bot');
    b.innerText = text; 
    wrap.appendChild(b); 
    chatWindow.appendChild(wrap); 
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function clearMessages() {
    while (chatWindow.firstChild) {
      chatWindow.removeChild(chatWindow.firstChild);
    }
  }

  async function handleSend(){
    const text = input.value.trim(); 
    if(!text) return;

    // Get customer info on first message
    if (!customerEmail) {
      appendMessage('Vui lòng nhập email của bạn trước tiên.', 'bot');
      return;
    }

    input.value = '';
    appendMessage(text, 'customer');

    try {
      const res = await fetch(API_URL + '/support-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          customerEmail,
          customerName,
          message: text
        })
      });

      const data = await res.json();
      if (!res.ok) {
        appendMessage('Lỗi gửi tin: ' + (data.error || 'Unknown error'), 'bot');
        return;
      }

      appendMessage('✓ Tin nhắn đã gửi tới shop. Chờ phản hồi...', 'bot');

      // Start polling for replies
      if (!isChecking) {
        startPolling();
      }
    } catch (err) {
      appendMessage('Lỗi kết nối: ' + err.message, 'bot');
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(API_URL + '/support-messages/' + sessionId);
      const data = await res.json();

      if (!res.ok) {
        console.error('Error fetching messages:', data);
        return;
      }

      // Clear and rebuild chat to sync with server state
      const allMessages = data.messages || [];
      
      // Only update if new messages arrived
      const lastDisplayedCount = chatWindow.querySelectorAll('.msg').length;
      if (allMessages.length > lastDisplayedCount - 1) { // -1 for welcome message
        // Find messages that aren't displayed yet
        const newMessages = allMessages.slice(lastDisplayedCount - 1);
        newMessages.forEach(msg => {
          if (msg.type === 'reply') {
            appendMessage(msg.body, 'bot');
          }
        });
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }

  function startPolling() {
    isChecking = true;
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 3000); // Poll every 3 seconds

    // Stop polling after 30 minutes of inactivity
    setTimeout(() => {
      clearInterval(pollInterval);
      isChecking = false;
    }, 30 * 60 * 1000);
  }

  // Request customer email/name on load if not set
  async function askForCustomerInfo() {
    if (customerEmail) return;

    const email = prompt('Nhập email của bạn để nhận phản hồi từ shop:');
    if (!email) {
      appendMessage('Email là bắt buộc để tiếp tục.', 'bot');
      return;
    }

    customerEmail = email;
    sessionStorage.setItem('customerEmail', email);

    const name = prompt('Nhập tên của bạn (không bắt buộc):');
    if (name) {
      customerName = name;
      sessionStorage.setItem('customerName', name);
    }

    appendMessage(`Cảm ơn ${name || 'bạn'}! Nhập tin nhắn để liên hệ với shop.`, 'bot');
  }

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') handleSend(); });

  // FAQ quick buttons: prefill input
  document.querySelectorAll('.faq').forEach(b=>b.addEventListener('click', e=>{ 
    input.value = e.target.innerText; 
    input.focus(); 
  }));

  // Initial setup
  clearMessages();
  appendMessage('Chào bạn! Nhập câu hỏi để nhắn tin với shop.', 'bot');
  askForCustomerInfo();
})();
