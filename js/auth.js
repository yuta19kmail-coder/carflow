// ========================================
// auth.js
// ログイン/ログアウト
// ========================================

function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  if (!u) { showToast('ユーザー名を入力してください'); return; }
  if (document.getElementById('login-pass').value !== '1234') {
    showToast('パスワードが違います');
    return;
  }
  currentUser = u;
  const init = u.slice(0,2).toUpperCase();
  document.getElementById('u-av').textContent = init;
  document.getElementById('sb-av').textContent = init;
  document.getElementById('u-name').textContent = u;
  document.getElementById('sb-name').textContent = u;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  calYear = new Date().getFullYear();
  calMonth = new Date().getMonth();
  fetchJpHolidays();
  renderAll();
  renderDashboard();
}

function doLogout() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}
