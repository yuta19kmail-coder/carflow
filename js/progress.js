// ========================================
// progress.js
// 進捗計算ロジック
// 各車両のタスク進捗率を計算する関数
// ========================================

// 車両全体の進捗を計算
function calcProg(car) {
  const isD = car.col === 'delivery' || car.col === 'done';
  const tasks = isD ? DELIVERY_TASKS : REGEN_TASKS;
  const state = isD ? car.deliveryTasks : car.regenTasks;
  let total = 0, done = 0;
  tasks.forEach(t => {
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
