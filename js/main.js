// ========================================
// main.js
// 全体の再描画ディスパッチャ
// （起動処理は index.html のHTML読込順序で自動的に行われる）
// ========================================

// 現在アクティブなタブ/パネルをすべて再描画
function renderAll() {
  renderActions();
  const activeTab = document.querySelector('.tab.active');
  if (activeTab) {
    const t = activeTab.textContent;
    if (t.includes('タスク'))     renderKanban();
    if (t.includes('カレンダー')) renderCalendar();
    if (t.includes('展示'))       renderExhibit();
    if (t.includes('進捗'))       renderProgress();
    if (t.includes('全体'))       renderTable();
    if (t.includes('在庫'))       renderInventory();
    if (t.includes('商談'))       renderDeal();
  }
}
