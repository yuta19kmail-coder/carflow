// ========================================
// auth.js
// ログイン/ログアウト
// v0.9.4: スマホ判定（768px以下）でログイン後に進捗ビューへ自動遷移
// v0.9.8: ログイン直後にトップバーのフォントサイズラベル更新
// v1.0.0: スマホで「管理者モード」一時切替（PC版フル表示）
// ========================================

// 管理者モード（スマホでPC版を一時表示中）かどうか
let mobileAdminMode = false;

function isMobileMode() {
  // 画面幅が小さい かつ 管理者モードでない時だけスマホ扱い
  return window.innerWidth <= 768 && !mobileAdminMode;
}

function applyMobileClass() {
  document.body.classList.toggle('mobile', isMobileMode());
  // 管理者モード切替ボタンの表示制御
  refreshAdminToggleButtons();
}

// v1.0.0: スマホ画面で管理者モード切替ボタンを表示制御
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
    // スマホ＋現場モード → 「管理者モード」ボタンだけ表示
    adminBtn.style.display = '';
    backBtn.style.display = 'none';
  } else if (narrow && mobileAdminMode) {
    // スマホ＋管理者モード → 「現場モードに戻る」だけ表示
    adminBtn.style.display = 'none';
    backBtn.style.display = '';
  } else {
    // PC幅 → どちらも非表示
    adminBtn.style.display = 'none';
    backBtn.style.display = 'none';
  }
}

// v1.0.0: 管理者モードに入る（PC版フル表示）
function enterAdminMode() {
  mobileAdminMode = true;
  applyMobileClass();
  if (typeof renderAll === 'function') renderAll();
  if (typeof showToast === 'function') showToast('⚙️ 管理者モード（PC版表示）');
}

// v1.0.0: 現場モードに戻る
function exitAdminMode() {
  mobileAdminMode = false;
  applyMobileClass();
  if (typeof forceProgressView === 'function') forceProgressView();
  if (typeof showToast === 'function') showToast('📱 現場モードに戻りました');
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
  // v1.0.0: ログイン時は必ず管理者モードを解除（スマホは毎回現場モードから）
  mobileAdminMode = false;
  applyMobileClass();
  renderAll();
  renderDashboard();
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
  if (typeof renderProgress === 'function') renderProgress();
}

function doLogout() {
  // v1.0.0: ログアウト時に管理者モードリセット
  mobileAdminMode = false;
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
