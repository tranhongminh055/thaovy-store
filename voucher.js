// Voucher utility: lưu, lấy và kiểm tra voucher trong LocalStorage
(function () {
  const KEY = 'vouchers';

  function getVouchers() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveVouchers(list) {
    localStorage.setItem(KEY, JSON.stringify(list || []));
  }

  function hasVoucher(code) {
    if (!code) return false;
    code = code.toString().trim().toUpperCase();
    return getVouchers().some(v => v.code === code);
  }

  function addVoucher(code, meta = {}) {
    if (!code) return { added: false, reason: 'empty' };
    code = code.toString().trim().toUpperCase();
    if (hasVoucher(code)) return { added: false, reason: 'exists' };
    const list = getVouchers();
    const v = Object.assign({ code, addedAt: new Date().toISOString() }, meta);
    list.push(v);
    saveVouchers(list);
    return { added: true, voucher: v };
  }

  function removeVoucher(code) {
    if (!code) return;
    code = code.toString().trim().toUpperCase();
    const list = getVouchers().filter(v => v.code !== code);
    saveVouchers(list);
    return list;
  }

  window.VoucherStore = {
    getVouchers,
    saveVouchers,
    hasVoucher,
    addVoucher,
    removeVoucher,
  };
})();
