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

// 車両全体の進捗を計算
function calcProg(car) {
  const isD = car.col === 'delivery' || car.col === 'done';
  const tasks = isD ? DELIVERY_TASKS : REGEN_TASKS;
  const state = isD ? car.deliveryTasks : car.regenTasks;
  let total = 0, done = 0;
  tasks.forEach(t => {
    // v1.0.20: t_equip は1タスクとして扱う（完了/未完了の二値）
    if (t.id === 't_equip') {
      total++;
      if (_isEquipmentCompleted(car)) done++;
      return;
    }
    if (t.type === 'toggle') {
      total++;
      if (state[t.id]) done++;
    } else {
      t.sections.forEach(s => s.items.forEach(i => {
        total++;
        if (state[t.id] && state[t.id][i.id]) done++;
      }));
    }
  });
  return {pct: total ? Math.round(done/total*100) : 0, done, total};
}

// 単一タスクの進捗を計算
function calcSingleProg(car, taskId, tasks) {
  const isD = car.col === 'delivery' || car.col === 'done';
  const state = isD ? car.deliveryTasks : car.regenTasks;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return {pct:0, done:0, total:0};
  // v1.0.20: t_equip は装備品チェックの完了フラグだけ見る
  // v1.0.21: 完了押せば100%、それ以外は入力済み数を割合で返す（途中状態を反映）
  if (taskId === 't_equip') {
    if (_isEquipmentCompleted(car)) return {pct: 100, done: 1, total: 1};
    if (typeof calcEquipmentProgress === 'function') {
      const p = calcEquipmentProgress(car);
      return {pct: p.pct, done: p.filled, total: p.total};
    }
    return {pct: 0, done: 0, total: 1};
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
