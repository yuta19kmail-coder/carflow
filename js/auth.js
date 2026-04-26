// ========================================
// auth.js
// ログイン/ログアウト
// v0.9.4: スマホ判定（768px以下）でログイン後に進捗ビューへ自動遷移
// ========================================

// スマホモード判定（768px以下）
function isMobileMode() {
  return window.innerWidth <= 768;
}

// スマホモードならボディに mobile クラスを付与（CSSで一括制御）
function applyMobileClass() {
  document.body.classList.toggle('mobile', isMobileMode());
}

function doLogin() {
  let u = document.getElementById('login-user').value.trim();
  if (document.getElementById('login-pass').value !== '1234') {
    showToast('パスワードが違います');
    return;
  }
  if (!u) u = 'ゲスト';
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
  applyMobileClass();
  renderAll();
  renderDashboard();
  // v0.9.4: スマホモードなら強制で進捗ビューへ
  if (isMobileMode()) {
    forceProgressView();
  }
}

// スマホ用：強制で進捗ビューに切り替え
function forceProgressView() {
  document.querySelectorAll('.side-panel,.view').forEach(v => {
    v.classList.remove('open','active');
    v.style.display = 'none';
  });
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const progressTab = Array.from(document.querySelectorAll('.tab')).find(t => t.textContent.includes('進捗'));
  if (progressTab) progressTab.classList.add('active');
  const view = document.getElementById('view-progress');
  if (view) {
    view.style.display = 'flex';
    view.classList.add('active');
  }
  if (typeof renderProgress === 'function') renderProgress();
}

function doLogout() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

// リサイズ時にスマホ⇔PCを切替
window.addEventListener('resize', () => {
  applyMobileClass();
  if (document.getElementById('app').style.display !== 'none' && isMobileMode()) {
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab || !activeTab.textContent.includes('進捗')) {
      forceProgressView();
    }
  }
});
