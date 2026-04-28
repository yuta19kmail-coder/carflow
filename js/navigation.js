// ========================================
// navigation.js
// パネル・タブの切り替え
// v0.9.6: 設定画面でテーマ・フォントサイズ選択状態を反映
// ========================================

function showPanel(name, el) {
  document.querySelectorAll('.side-panel,.view').forEach(v => {
    v.classList.remove('open','active');
    v.style.display = 'none';
  });
  document.querySelectorAll('.sb-item').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  const p = document.getElementById('panel-' + name);
  if (p) { p.style.display = 'flex'; p.classList.add('open'); }
  // v1.2.1: ダッシュボード表示中は下部アクションエリアを隠す
  document.body.classList.toggle('panel-dashboard-active', name === 'dashboard');
  if (name === 'log') renderLogPanel();
  if (name === 'members') renderMembers();
  if (name === 'dashboard') renderDashboard();
  if (name === 'archive') renderArchive();
  if (name === 'settings') {
    renderClosedDaysPicker();
    renderSizeEditor();
    renderInvWarnEditor();
    renderDelWarnEditor();
    // v1.0.35: 通知・アラート設定セクションは廃止（要対応アクション C に統合）
    renderClosedRulesList();
    renderGoalsEditor();
    refreshLeadDaysUI();
    // v0.9.6: テーマ・フォントサイズの選択状態を反映
    if (typeof refreshThemePickerUI === 'function') refreshThemePickerUI();
    if (typeof refreshFontSizePickerUI === 'function') refreshFontSizePickerUI();
    // v1.0.32: タスクエディタ
    if (typeof renderTasksEditor === 'function') renderTasksEditor();
  }
}

// タブ（カンバン、カレンダー、展示、進捗、一覧、在庫）切替
function switchTab(name, el) {
  document.querySelectorAll('.side-panel,.view').forEach(v => {
    v.classList.remove('open','active');
    v.style.display = 'none';
  });
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  const v = document.getElementById('view-' + name);
  if (v) { v.style.display = 'flex'; v.classList.add('active'); }
  // v1.2.1: タブ切替時はダッシュボードフラグを外す
  document.body.classList.remove('panel-dashboard-active');
  if (name === 'kanban')    renderKanban();
  if (name === 'calendar')  renderCalendar();
  if (name === 'exhibit')   renderExhibit();
  if (name === 'progress')  renderProgress();
  if (name === 'table')     renderTable();
  if (name === 'inventory') renderInventory();
  if (name === 'deal') {
    if (typeof renderDeal === 'function') renderDeal();
    if (typeof enterDealMode === 'function') enterDealMode();
  } else {
    document.body.classList.remove('deal-mode');
  }
}
