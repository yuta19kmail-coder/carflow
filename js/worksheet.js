// ========================================
// worksheet.js (v1.2.0)
// 中古車作業管理票（再生 / 納車時）の専用フルスクリーン画面
//
// equipment.js を参考にした作業項目チェック UI。
// 装備品との違い：
//   - 値は2状態のみ（未完了 / 完了）
//   - 詳細は注意点（detail / points）として下に展開
//   - 「全項目完了」になるまで完了ボタンが押せない
//   - 途中で「✕戻る」できる（保存はその場で car.regenTasks/deliveryTasks に反映）
//
// 開き方：openWorksheet(carId, taskId)
//   taskId は 't_regen' または 'd_prep'（または将来の任意の workflow タスク）
// ========================================

let _wsActiveCarId = null;
let _wsActiveTaskId = null;
let _wsActiveCatIdx = 0;

function _wsGetTaskDef(taskId) {
  // REGEN_TASKS / DELIVERY_TASKS 両方から探す
  const all = (typeof REGEN_TASKS !== 'undefined' ? REGEN_TASKS : [])
    .concat(typeof DELIVERY_TASKS !== 'undefined' ? DELIVERY_TASKS : []);
  return all.find(t => t.id === taskId) || null;
}

function _wsGetTaskState(car, taskId) {
  const isDelivery = taskId.startsWith('d_') || taskId === 'd_prep';
  if (isDelivery) {
    if (!car.deliveryTasks) car.deliveryTasks = {};
    if (!car.deliveryTasks[taskId]) car.deliveryTasks[taskId] = {};
    return car.deliveryTasks[taskId];
  }
  if (!car.regenTasks) car.regenTasks = {};
  if (!car.regenTasks[taskId]) car.regenTasks[taskId] = {};
  return car.regenTasks[taskId];
}

function _wsAllItems(taskDef) {
  const out = [];
  (taskDef.sections || []).forEach(sec => {
    (sec.items || []).forEach(item => out.push({ section: sec, item }));
  });
  return out;
}

function _wsCalcProgress(car, taskDef) {
  const state = _wsGetTaskState(car, taskDef.id);
  const all = _wsAllItems(taskDef);
  const total = all.length;
  let done = 0;
  all.forEach(({ item }) => { if (state[item.id]) done++; });
  return { total, done, pct: total ? Math.round(done / total * 100) : 0 };
}

// ---------------------------------------------------------------
// 開閉
// ---------------------------------------------------------------
function openWorksheet(carId, taskId) {
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  const taskDef = _wsGetTaskDef(taskId);
  if (!taskDef) return;
  _wsActiveCarId = carId;
  _wsActiveTaskId = taskId;
  _wsActiveCatIdx = 0;
  _renderWorksheetPage(car, taskDef);
  document.getElementById('ws-page').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeWorksheet() {
  document.getElementById('ws-page').classList.remove('open');
  document.body.style.overflow = '';
  const targetCarId = _wsActiveCarId;
  _wsActiveCarId = null;
  _wsActiveTaskId = null;
  if (targetCarId) {
    const car = cars.find(c => c.id === targetCarId);
    if (car && typeof activeDetailCarId !== 'undefined' && activeDetailCarId === targetCarId) {
      const dbody = document.getElementById('detail-body');
      if (dbody && typeof renderDetailBody === 'function') {
        try { renderDetailBody(car); } catch(e) {}
      }
    }
  }
  if (typeof renderAll === 'function') renderAll();
}

function markWorksheetComplete() {
  if (!_wsActiveCarId || !_wsActiveTaskId) return;
  const car = cars.find(c => c.id === _wsActiveCarId);
  const taskDef = _wsGetTaskDef(_wsActiveTaskId);
  if (!car || !taskDef) return;
  const p = _wsCalcProgress(car, taskDef);
  if (p.done < p.total) {
    if (typeof showToast === 'function') showToast(`あと ${p.total - p.done} 項目残っています`);
    return;
  }
  if (typeof addLog === 'function') addLog(car.id, `${taskDef.name}を完了`);
  if (typeof showToast === 'function') showToast(`✓ ${taskDef.name}を完了にしました`);
  closeWorksheet();
}

// ---------------------------------------------------------------
// レンダリング
// ---------------------------------------------------------------
function _renderWorksheetPage(car, taskDef) {
  // ヘッダー
  document.getElementById('ws-title').textContent = `${taskDef.icon || ''} ${taskDef.name}`;
  const thumb = document.getElementById('ws-vehicle-thumb');
  if (thumb) {
    if (car.photo) {
      thumb.style.backgroundImage = `url("${car.photo}")`;
      thumb.textContent = '';
    } else {
      thumb.style.backgroundImage = '';
      thumb.textContent = (typeof carEmoji === 'function') ? carEmoji(car.size) : '🚗';
    }
  }
  document.getElementById('ws-vehicle-name').textContent = `${car.maker || ''} ${car.model || ''}`.trim();
  const ymd = [];
  if (car.year) ymd.push(car.year);
  if (car.color) ymd.push(car.color);
  if (car.km != null) ymd.push(`${Number(car.km).toLocaleString()}km`);
  document.getElementById('ws-vehicle-sub').textContent = ymd.join(' ・ ');

  _wsUpdateProgressBadge();

  // タブ
  const tabs = document.getElementById('ws-tabs');
  tabs.innerHTML = (taskDef.sections || []).map((sec, i) => {
    const filled = _wsCountSectionFilled(car, sec);
    const total = sec.items.length;
    return `<button class="ws-tab ${i === _wsActiveCatIdx ? 'active' : ''}" onclick="switchWorksheetTab(${i})">
      <span class="ws-tab-label">${escapeHtml(sec.title || '')}</span>
      <span class="ws-tab-count">${filled}/${total}</span>
    </button>`;
  }).join('');

  // 本体（アクティブセクションのみ表示）
  _renderWorksheetSectionItems(car, taskDef);

  _refreshWsCompleteBtn(car, taskDef);
  _refreshWsNavBtns(taskDef);
}

function _renderWorksheetSectionItems(car, taskDef) {
  const sec = (taskDef.sections || [])[_wsActiveCatIdx];
  const body = document.getElementById('ws-body-inner');
  if (!sec) { body.innerHTML = ''; return; }
  const state = _wsGetTaskState(car, taskDef.id);
  body.innerHTML = (sec.items || []).map(item => {
    const done = !!state[item.id];
    const subHtml = item.sub ? `<div class="ws-item-sub">${escapeHtml(item.sub)}</div>` : '';
    const detailHtml = (item.detail || (item.points && item.points.length))
      ? `<div class="ws-item-detail">
           ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ''}
           ${item.points && item.points.length
             ? `<ul>${item.points.filter(p=>p).map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`
             : ''}
         </div>`
      : '';
    return `
      <div class="ws-item ${done ? 'done' : ''}" data-id="${item.id}">
        <button class="ws-item-toggle" onclick="toggleWsItem('${item.id}')">
          <div class="ws-item-chk">${done ? '✓' : ''}</div>
          <div class="ws-item-body">
            <div class="ws-item-name">${escapeHtml(item.name || '')}</div>
            ${subHtml}
          </div>
        </button>
        ${detailHtml}
      </div>`;
  }).join('');
}

function switchWorksheetTab(idx) {
  _wsActiveCatIdx = idx;
  const car = cars.find(c => c.id === _wsActiveCarId);
  const taskDef = _wsGetTaskDef(_wsActiveTaskId);
  if (!car || !taskDef) return;
  // タブのアクティブ切替＋本体再描画
  document.querySelectorAll('#ws-tabs .ws-tab').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  _renderWorksheetSectionItems(car, taskDef);
  _refreshWsNavBtns(taskDef);
  // 本体を上にスクロール
  const inner = document.getElementById('ws-body-inner');
  if (inner && inner.parentElement) inner.parentElement.scrollTop = 0;
}

function toggleWsItem(itemId) {
  const car = cars.find(c => c.id === _wsActiveCarId);
  const taskDef = _wsGetTaskDef(_wsActiveTaskId);
  if (!car || !taskDef) return;
  const state = _wsGetTaskState(car, taskDef.id);
  state[itemId] = !state[itemId];
  // 該当 item 行だけ更新
  const row = document.querySelector(`.ws-item[data-id="${itemId}"]`);
  if (row) {
    row.classList.toggle('done', !!state[itemId]);
    const chk = row.querySelector('.ws-item-chk');
    if (chk) chk.textContent = state[itemId] ? '✓' : '';
  }
  // タブのカウント更新
  const sec = (taskDef.sections || [])[_wsActiveCatIdx];
  if (sec) {
    const tab = document.querySelectorAll('#ws-tabs .ws-tab')[_wsActiveCatIdx];
    if (tab) {
      const cnt = tab.querySelector('.ws-tab-count');
      if (cnt) cnt.textContent = `${_wsCountSectionFilled(car, sec)}/${sec.items.length}`;
    }
  }
  _wsUpdateProgressBadge();
  _refreshWsCompleteBtn(car, taskDef);
}

function _wsCountSectionFilled(car, sec) {
  const state = _wsGetTaskState(car, _wsActiveTaskId);
  return (sec.items || []).filter(i => state[i.id]).length;
}

function _wsUpdateProgressBadge() {
  const car = cars.find(c => c.id === _wsActiveCarId);
  const taskDef = _wsGetTaskDef(_wsActiveTaskId);
  if (!car || !taskDef) return;
  const p = _wsCalcProgress(car, taskDef);
  const badge = document.getElementById('ws-progress-badge');
  if (badge) badge.textContent = `${p.done}/${p.total}`;
  const bar = document.getElementById('ws-progress-fill');
  if (bar) bar.style.width = `${p.pct}%`;
}

function _refreshWsCompleteBtn(car, taskDef) {
  const btn = document.getElementById('ws-complete-btn');
  if (!btn) return;
  const p = _wsCalcProgress(car, taskDef);
  const allDone = (p.total > 0 && p.done >= p.total);
  if (allDone) {
    btn.disabled = false;
    btn.classList.remove('disabled');
    btn.textContent = `✓ 完了する（全${p.total}項目）`;
  } else {
    btn.disabled = true;
    btn.classList.add('disabled');
    const remain = p.total - p.done;
    btn.textContent = `あと ${remain} 項目`;
  }
}

function _refreshWsNavBtns(taskDef) {
  const prev = document.getElementById('ws-prev-btn');
  const next = document.getElementById('ws-next-btn');
  const total = (taskDef.sections || []).length;
  if (prev) prev.disabled = (_wsActiveCatIdx <= 0);
  if (next) next.disabled = (_wsActiveCatIdx >= total - 1);
}

function wsPrevTab() {
  if (_wsActiveCatIdx > 0) switchWorksheetTab(_wsActiveCatIdx - 1);
}
function wsNextTab() {
  const taskDef = _wsGetTaskDef(_wsActiveTaskId);
  if (!taskDef) return;
  const total = (taskDef.sections || []).length;
  if (_wsActiveCatIdx < total - 1) switchWorksheetTab(_wsActiveCatIdx + 1);
}
