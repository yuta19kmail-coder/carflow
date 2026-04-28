// ========================================
// progress.js
// 進捗計算ロジック
// 各車両のタスク進捗率を計算する関数
// ========================================

// v1.0.20: t_equip だけ装備品チェック専用ページに移行
// 完了判定は car.equipment._completed（明示宣言）を見る
function _isEquipmentCompleted(car) {
  return !!(car && car.equipment && car.equipment._completed);
}

// v1.0.24: t_equip は常に入力比例で進捗％を返す（_completed フラグは UI の✓表示にのみ利用）
// 全項目数 / 入力済み項目数 で計算。EQUIPMENT_CATEGORIES が無い時は 0/1 を返す。
function _calcEquipProgUnified(car) {
  if (typeof calcEquipmentProgress === 'function') {
    const p = calcEquipmentProgress(car);
    return { pct: p.pct, done: p.filled, total: p.total || 1 };
  }
  return { pct: 0, done: 0, total: 1 };
}

// タスクが「完了」かどうかの判定（全体進捗用、二値）
// v1.0.27: t_equip は _completed フラグを見る。それ以外は pct === 100。
function _isTaskComplete(car, task, tasks) {
  if (task.id === 't_equip') return _isEquipmentCompleted(car);
  const p = calcSingleProg(car, task.id, tasks);
  return p.pct >= 100;
}

// 車両全体の進捗を計算
// v1.0.27: シンプルB方式 — 完了タスク数 / 全タスク数（タスク単位の二値判定）
//   例：6タスクで装備品チェック「完了する」押下＋他全部未 → 1/6 ≒ 17%
//   ウエイト調整は v1.0.30 ぐらいで設定UI追加予定
function calcProg(car) {
  const isD = car.col === 'delivery' || car.col === 'done';
  // v1.0.32: 有効なタスクだけで全体進捗を計算（無効化タスクはカウントしない）
  const tasks = isD ? getActiveDeliveryTasks() : getActiveRegenTasks();
  let total = 0, done = 0;
  tasks.forEach(t => {
    total++;
    if (_isTaskComplete(car, t, tasks)) done++;
  });
  return {pct: total ? Math.round(done/total*100) : 0, done, total};
}

// 単一タスクの進捗を計算
function calcSingleProg(car, taskId, tasks) {
  const isD = car.col === 'delivery' || car.col === 'done';
  const state = isD ? car.deliveryTasks : car.regenTasks;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return {pct:0, done:0, total:0};
  // v1.0.24: t_equip は常に入力比例で進捗％を返す
  // _completed フラグは「確認済みかどうか」の別概念として UI 側で別表示する
  if (taskId === 't_equip') {
    return _calcEquipProgUnified(car);
  }
  if (task.type === 'toggle') {
    return {pct: state[taskId] ? 100 : 0, done: state[taskId] ? 1 : 0, total:1};
  }
  let total = 0, done = 0;
  task.sections.forEach(s => s.items.forEach(i => {
    total++;
    if (state[taskId] && state[taskId][i.id]) done++;
  }));
  return {pct: total ? Math.round(done/total*100) : 0, done, total};
}
