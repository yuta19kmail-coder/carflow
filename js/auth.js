// ========================================
// auth.js
// ログイン/ログアウト
// v0.9.4: スマホ判定（768px以下）でログイン後に進捗ビューへ自動遷移
// v0.9.8: ログイン直後にトップバーのフォントサイズラベル更新
// v1.0.0: スマホで「管理者モード」一時切替（PC版フル表示）
// v1.0.2: body.mobile クラスベースに統一
// v1.0.3: モード名称を「フルメニュー／クイックメニュー」に、サイドバー折りたたみ追加
// ========================================

// フルメニューモード（スマホでPC版を一時表示中）かどうか
// 内部変数名は mobileAdminMode のまま（互換性維持）
let mobileAdminMode = false;

// v1.0.3: サイドバー折りたたみ状態
let sidebarCollapsed = false;

function isMobileMode() {
  return window.innerWidth <= 768 && !mobileAdminMode;
}

function applyMobileClass() {
  document.body.classList.toggle('mobile', isMobileMode());
  refreshAdminToggleButtons();
}

function refreshAdminToggleButtons() {
  const adminBtn = document.getElementById('mobile-admin-toggle');
  const backBtn = document.getElementById('mobile-back-mobile');
  const isLogin = document.getElementById('app').style.display !== 'none';
  const narrow = window.innerWidth <= 768;
  if (!adminBtn || !backBtn) return;
  if (!isLogin) {
    adminBtn.style.display = 'none';
    backBtn.style.display = 'none';
    return;
  }
  if (narrow && !mobileAdminMode) {
    adminBtn.style.display = '';
    backBtn.style.display = 'none';
  } else if (narrow && mobileAdminMode) {
    adminBtn.style.display = 'none';
    backBtn.style.display = '';
  } else {
    adminBtn.style.display = 'none';
    backBtn.style.display = 'none';
  }
}

// v1.0.3: フルメニューに入る（PC版フル表示）
function enterAdminMode() {
  mobileAdminMode = true;
  applyMobileClass();
  if (typeof renderAll === 'function') renderAll();
  if (typeof showToast === 'function') showToast('🗂️ フルメニューに切替えました');
}

// v1.0.3: クイックメニューに戻る
function exitAdminMode() {
  mobileAdminMode = false;
  applyMobileClass();
  if (typeof forceProgressView === 'function') forceProgressView();
  if (typeof showToast === 'function') showToast('⚡ クイックメニューに戻りました');
}

// v1.0.3: サイドバー折りたたみトグル
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.body.classList.toggle('sidebar-collapsed', sidebarCollapsed);
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
  // v1.0.3: ログイン時はモード解除＆サイドバー初期表示
  mobileAdminMode = false;
  sidebarCollapsed = false;
  document.body.classList.remove('sidebar-collapsed');
  applyMobileClass();
  renderAll();
  renderDashboard();
  // v1.2.1: 初期表示はダッシュボード → 下部要対応エリアを隠すクラスを付与
  document.body.classList.add('panel-dashboard-active');
  if (typeof refreshTopbarFontSizeLabel === 'function') refreshTopbarFontSizeLabel();
  if (isMobileMode()) {
    forceProgressView();
  }
}

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
  // v1.2.1: 進捗ビュー（タブ）に切替＝ダッシュボードフラグは外す
  document.body.classList.remove('panel-dashboard-active');
  if (typeof renderProgress === 'function') renderProgress();
}

function doLogout() {
  mobileAdminMode = false;
  sidebarCollapsed = false;
  document.body.classList.remove('sidebar-collapsed');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  refreshAdminToggleButtons();
}

window.addEventListener('resize', () => {
  applyMobileClass();
  if (document.getElementById('app').style.display !== 'none' && isMobileMode()) {
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab || !activeTab.textContent.includes('進捗')) {
      forceProgressView();
    }
  }
});
