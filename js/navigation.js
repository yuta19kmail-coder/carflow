// ========================================
// navigation.js
// パネル・タブの切り替え
// ========================================

// サイドバーのパネル（ダッシュボード、ログ、メンバー、設定、通知）表示
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
  if (name === 'log') renderLogPanel();
  if (name === 'members') renderMembers();
  if (name === 'dashboard') renderDashboard();
  if (name === 'settings') renderClosedDaysPicker();
}

// タブ（カンバン、カレンダー、展示、ガント、進捗、一覧、在庫）切替
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
  if (name === 'kanban')    renderKanban();
  if (name === 'calendar')  renderCalendar();
  if (name === 'exhibit')   renderExhibit();
  if (name === 'gantt')     renderGantt();
  if (name === 'progress')  renderProgress();
  if (name === 'table')     renderTable();
  if (name === 'inventory') renderInventory();
}
