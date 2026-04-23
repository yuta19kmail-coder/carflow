// ========================================
// car-detail.js
// 車両詳細モーダルの表示と操作
// ========================================

// 車両詳細を開く
function openDetail(carId) {
  activeDetailCarId = carId;
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  document.getElementById('detail-title').textContent = `${car.maker} ${car.model}`;
  renderDetailBody(car);
  document.getElementById('modal-detail').classList.add('open');
}

// 詳細モーダルの本体を描画
function renderDetailBody(car) {
  const isD = car.col === 'delivery' || car.col === 'done';
  const tasks = isD ? DELIVERY_TASKS : REGEN_TASKS;
  const prog = calcProg(car);
  let html = `
    <div class="detail-photo">
      ${car.photo ? `<img src="${car.photo}">` : carEmoji(car.size)}
      <div class="detail-photo-edit" onclick="document.getElementById('dp-inp').click()">📷 変更</div>
    </div>
    <input type="file" id="dp-inp" accept="image/*" style="display:none" onchange="onDetailPhoto(this)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      ${car.deliveryDate ? `<span style="font-size:12px;color:var(--text2)">納車予定: ${fmtDate(car.deliveryDate)}</span>` : ''}
      ${car.price ? `<span style="font-size:15px;font-weight:700;color:var(--green);margin-left:auto">${fmtPrice(car.price)}</span>` : ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">管理番号</div><div style="font-size:13px;font-weight:600">${car.num}</div></div>
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">年式</div><div style="font-size:13px;font-weight:600">${car.year}年</div></div>
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">車体色</div><div style="font-size:13px;font-weight:600">${car.color}</div></div>
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">走行距離</div><div style="font-size:13px;font-weight:600">${Number(car.km||0).toLocaleString()}km</div></div>
    </div>
    <button onclick="openCarModal('${car.id}')" style="width:100%;padding:9px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);color:var(--text2);font-size:13px;cursor:pointer;margin-bottom:16px">✏️ 車両詳細を編集</button>
    <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${isD?'納車準備':'再生'}チェック</div>
    <div class="detail-overall">
      <div class="detail-overall-label"><span>全体進捗</span><span>${prog.done}/${prog.total} (${prog.pct}%)</span></div>
      <div class="detail-overall-bar"><div class="detail-overall-fill" style="width:${prog.pct}%"></div></div>
    </div>
    <div class="task-items">`;
  tasks.forEach(task => {
    const p = calcSingleProg(car, task.id, tasks);
    const isDone = p.pct === 100, isPartial = p.pct > 0 && p.pct < 100;
    const state = isD ? car.deliveryTasks : car.regenTasks;
    if (task.type === 'toggle') {
      const checked = !!state[task.id];
      html += `<div class="task-item"><div class="task-item-row">
        <div class="task-chk${checked?' done':''}" onclick="toggleTaskToggle('${car.id}','${task.id}',${isD})">
          ${checked ? '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><polyline points="2,7 5.5,11 12,3" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
        </div>
        <div><div class="task-item-name">${task.icon} ${task.name}</div><div class="task-item-sub">${checked?'完了':'未完了'}</div></div>
        <div class="task-item-pct" style="margin-left:auto">${checked?'100':'0'}%</div>
      </div></div>`;
    } else {
      html += `<div class="task-item"><div class="task-item-row">
        <div class="task-chk${isDone?' done':isPartial?' partial':''}">
          ${isDone ? '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><polyline points="2,7 5.5,11 12,3" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : isPartial ? '<div style="width:7px;height:7px;border-radius:50%;background:#fff"></div>' : ''}
        </div>
        <div><div class="task-item-name">${task.icon} ${task.name}</div><div class="task-item-sub">${p.done}/${p.total} 完了</div></div>
        <div class="task-item-pct">${p.pct}%</div>
        <button class="task-open-btn" onclick="openWorkflow('${car.id}','${task.id}',${isD})">開く →</button>
      </div></div>`;
    }
  });
  html += `</div>`;
  document.getElementById('detail-body').innerHTML = html;
}

// 詳細から写真を変更
function onDetailPhoto(inp) {
  const car = cars.find(c => c.id === activeDetailCarId);
  if (!car) return;
  const file = inp.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    car.photo = e.target.result;
    renderDetailBody(car);
    renderAll();
    showToast('写真を更新しました');
  };
  r.readAsDataURL(file);
}

// トグル型タスクの完了/未完了切替
function toggleTaskToggle(carId, taskId, isD) {
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  const state = isD ? car.deliveryTasks : car.regenTasks;
  state[taskId] = !state[taskId];
  addLog(carId, `「${taskId}」を${state[taskId]?'完了':'未完了に戻す'}`);
  renderDetailBody(car);
  renderAll();
  showToast(state[taskId] ? '✓ 完了しました' : '未完了に戻しました');
}
