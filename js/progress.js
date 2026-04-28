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

// 車両全体の進捗を計算
function calcProg(car) {
  const isD = car.col === 'delivery' || car.col === 'done';
  const tasks = isD ? DELIVERY_TASKS : REGEN_TASKS;
  const state = isD ? car.deliveryTasks : car.regenTasks;
  let total = 0, done = 0;
  tasks.forEach(t => {
    // v1.0.24: t_equip は装備品チェックの全項目を1項目1カウントで集計
    // → タスク行の％（calcSingleProg）と全体進捗バーの分母・分子を一致させる
    if (t.id === 't_equip') {
      const ep = _calcEquipProgUnified(car);
      total += ep.total;
      done += ep.done;
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
