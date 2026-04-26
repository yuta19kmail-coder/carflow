// ========================================
// car-detail.js
// 車両詳細モーダルの表示と操作
// v0.8.9: その他はタスク非表示・メモ中心、削除ボタン追加
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

// その他用の詳細：タスクなしでメモ中心
function _renderDetailBodyOther(car) {
  const inv = daysSince(car.purchaseDate);
  const colLabel = COLS.find(c => c.id === car.col)?.label || car.col;
  const coreMemo = (car.memo || '').trim();
  const workMemo = (car.workMemo || '').trim();

  const dayBlock = `
    <div class="detail-days-box dg">
      <div class="detail-days-num">${inv}<span class="detail-days-unit">日</span></div>
      <div class="detail-days-label">仕入れから</div>
    </div>`;

  const coreMemoHtml = coreMemo
    ? `<div class="core-memo" data-expanded="0" onclick="toggleCoreMemo(this)">
         <div class="core-memo-label">📌 メモ</div>
         <div class="core-memo-text">${escapeHtml(coreMemo).replace(/\n/g,'<br>')}</div>
       </div>`
    : `<div class="core-memo core-memo-empty">
         <div class="core-memo-label">📌 メモ</div>
         <div class="core-memo-text core-memo-placeholder">メモは未記入です（編集ボタンから記入）</div>
       </div>`;

  let html = `
    <div class="detail-photo">
      ${car.photo ? `<img src="${car.photo}">` : carEmoji(car.size)}
      <div class="detail-photo-edit" onclick="document.getElementById('dp-inp').click()">📷 変更</div>
    </div>
    <input type="file" id="dp-inp" accept="image/*" style="display:none" onchange="onDetailPhoto(this)">
    <div class="detail-other-status">
      <span class="pill ${pillMap[car.col]||'pill-other'}">📝 ${colLabel}</span>
      <span class="detail-other-hint">身の振り方が決まっていない保留中の車両</span>
    </div>
    <div class="detail-head">
      <div class="detail-head-left">
        ${dayBlock}
      </div>
      <div class="detail-head-right">
        <div class="detail-other-msg">タスクや進捗の管理対象外。<br>展示・再生・仕入れに動かすと売り物のフローに入ります。</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">管理番号</div><div style="font-size:13px;font-weight:600">${car.num}</div></div>
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">年式</div><div style="font-size:13px;font-weight:600">${fmtYearDisplay(parseYearInput(car.year)||car.year)}</div></div>
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">車体色</div><div style="font-size:13px;font-weight:600">${car.color||'—'}</div></div>
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">走行距離</div><div style="font-size:13px;font-weight:600">${Number(car.km||0).toLocaleString()}km</div></div>
    </div>
    ${coreMemoHtml}
    <button onclick="openCarModal('${car.id}')" style="width:100%;padding:9px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);color:var(--text2);font-size:13px;cursor:pointer;margin-bottom:16px">✏️ 車両詳細を編集</button>
    <div class="work-memo" id="work-memo-wrap">
      <div class="work-memo-label">📝 作業メモ <span class="work-memo-hint">（保留中のメモ）</span></div>
      <div class="work-memo-view" onclick="startEditWorkMemo('${car.id}')">${
        workMemo
          ? escapeHtml(workMemo).replace(/\n/g,'<br>')
          : '<span class="work-memo-placeholder">タップしてメモを記入</span>'
      }</div>
    </div>
    <div class="detail-danger-zone">
      <button class="detail-delete-btn" onclick="confirmDeleteCar('${car.id}')">🗑️ この車両を削除</button>
    </div>`;
  document.getElementById('detail-body').innerHTML = html;
}

// 詳細モーダルの本体を描画
function renderDetailBody(car) {
  // v0.8.9: その他は専用ビュー
  if (car.col === 'other') return _renderDetailBodyOther(car);

  const isD = car.col === 'delivery' || car.col === 'done';
  const tasks = isD ? DELIVERY_TASKS : REGEN_TASKS;
  const prog = calcProg(car);
  const inv = daysSince(car.purchaseDate);
  const contractedDays = daysSinceContract(car);
  const delDiff = car.deliveryDate ? daysDiff(car.deliveryDate) : null;
  let dayBlock = '';
  if (car.contract) {
    const wt = delWarnTier(delDiff);
    const delLabel = (delDiff != null) ? (delDiff === 0 ? '納車本日' : delDiff > 0 ? `納車まで${delDiff}日` : `納車超過${-delDiff}日`) : '';
    dayBlock = `
      <div class="detail-days-box db">
        <div class="detail-days-num">${contractedDays}<span class="detail-days-unit">日</span></div>
        <div class="detail-days-label">売約から</div>
        ${delLabel ? `<div class="detail-days-sub${wt?' warn':''}">${delLabel}</div>` : ''}
      </div>`;
  } else {
    const wt = invWarnTier(inv);
    const cls = wt ? (wt.days >= 45 ? 'dr' : wt.days >= 30 ? 'dw' : 'dg') : 'dg';
    dayBlock = `
      <div class="detail-days-box ${cls}"${wt?` style="background:${wt.bg};color:${wt.color}"`:''}>
        <div class="detail-days-num">${inv}<span class="detail-days-unit">日</span></div>
        <div class="detail-days-label">在庫</div>
      </div>`;
  }
  const coreMemo = (car.memo || '').trim();
  const coreMemoHtml = coreMemo
    ? `<div class="core-memo" data-expanded="0" onclick="toggleCoreMemo(this)">
         <div class="core-memo-label">📌 メモ</div>
         <div class="core-memo-text">${escapeHtml(coreMemo).replace(/\n/g,'<br>')}</div>
       </div>`
    : `<div class="core-memo core-memo-empty">
         <div class="core-memo-label">📌 メモ</div>
         <div class="core-memo-text core-memo-placeholder">メモは未記入です（編集ボタンから記入）</div>
       </div>`;
  const workMemo = (car.workMemo || '').trim();
  let html = `
    <div class="detail-photo">
      ${car.photo ? `<img src="${car.photo}">` : carEmoji(car.size)}
      <div class="detail-photo-edit" onclick="document.getElementById('dp-inp').click()">📷 変更</div>
    </div>
    <input type="file" id="dp-inp" accept="image/*" style="display:none" onchange="onDetailPhoto(this)">
    <div class="detail-head">
      <div class="detail-head-left">
        ${dayBlock}
      </div>
      <div class="detail-head-right">
        ${car.price ? `<div class="detail-price">${fmtPrice(car.price)}</div>` : ''}
        ${car.deliveryDate ? `<div class="detail-deldate">納車予定: ${fmtDate(car.deliveryDate)}</div>` : ''}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">管理番号</div><div style="font-size:13px;font-weight:600">${car.num}</div></div>
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">年式</div><div style="font-size:13px;font-weight:600">${fmtYearDisplay(parseYearInput(car.year)||car.year)}</div></div>
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">車体色</div><div style="font-size:13px;font-weight:600">${car.color}</div></div>
      <div style="background:var(--bg3);border-radius:7px;padding:10px"><div style="color:var(--text3);font-size:10px;margin-bottom:3px">走行距離</div><div style="font-size:13px;font-weight:600">${Number(car.km||0).toLocaleString()}km</div></div>
    </div>
    ${coreMemoHtml}
    <button onclick="openCarModal('${car.id}')" style="width:100%;padding:9px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);color:var(--text2);font-size:13px;cursor:pointer;margin-bottom:16px">✏️ 車両詳細を編集</button>
    <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${isD?'納車準備':'業務タスク'}</div>
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
  html += `
    <div class="work-memo" id="work-memo-wrap">
      <div class="work-memo-label">📝 作業メモ ${isD ? '<span class="work-memo-hint">（納車準備中のメモ）</span>' : '<span class="work-memo-hint">（再生中のメモ）</span>'}</div>
      <div class="work-memo-view" onclick="startEditWorkMemo('${car.id}')">${
        workMemo
          ? escapeHtml(workMemo).replace(/\n/g,'<br>')
          : '<span class="work-memo-placeholder">タップしてメモを記入</span>'
      }</div>
    </div>
    <div class="detail-danger-zone">
      <button class="detail-delete-btn" onclick="confirmDeleteCar('${car.id}')">🗑️ この車両を削除</button>
    </div>`;
  document.getElementById('detail-body').innerHTML = html;
}

// コアメモの展開/折りたたみ
function toggleCoreMemo(el) {
  const cur = el.getAttribute('data-expanded') === '1';
  el.setAttribute('data-expanded', cur ? '0' : '1');
}

// HTML エスケープ（メモ表示用）
function escapeHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// 作業メモを編集モードへ
function startEditWorkMemo(carId) {
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  const wrap = document.getElementById('work-memo-wrap');
  if (!wrap) return;
  const cur = car.workMemo || '';
  wrap.innerHTML = `
    <div class="work-memo-label">📝 作業メモ</div>
    <textarea id="work-memo-ta" class="work-memo-input" rows="4" placeholder="作業の進捗・申し送りなど">${escapeHtml(cur)}</textarea>
    <div class="work-memo-btns">
      <button class="btn-sm" onclick="cancelEditWorkMemo('${carId}')">キャンセル</button>
      <button class="btn-sm btn-primary" onclick="saveWorkMemo('${carId}')">保存</button>
    </div>`;
  const ta = document.getElementById('work-memo-ta');
  if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}

function cancelEditWorkMemo(carId) {
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  renderDetailBody(car);
}

function saveWorkMemo(carId) {
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  const ta = document.getElementById('work-memo-ta');
  const v = ta ? ta.value.trim() : '';
  car.workMemo = v;
  addLog(carId, '作業メモを更新');
  renderDetailBody(car);
  renderAll();
  showToast('作業メモを保存しました');
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

// ========================================
// v0.8.9: 車両削除フロー
// ========================================
let _deletingCarId = null;

function confirmDeleteCar(carId) {
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  _deletingCarId = carId;
  const sub = document.getElementById('confirm-delete-sub');
  if (sub) {
    sub.innerHTML = `<strong>${escapeHtml(car.maker)} ${escapeHtml(car.model)}</strong>（${escapeHtml(car.num)}）<br>このデータは復元できません。本当に削除しますか？`;
  }
  document.getElementById('confirm-delete-car').classList.add('open');
}

function closeDeleteCarConfirm(doDelete) {
  document.getElementById('confirm-delete-car').classList.remove('open');
  if (!doDelete || !_deletingCarId) {
    _deletingCarId = null;
    return;
  }
  const idx = cars.findIndex(c => c.id === _deletingCarId);
  if (idx < 0) { _deletingCarId = null; return; }
  const removed = cars[idx];
  cars.splice(idx, 1);
  // 詳細モーダルを閉じる
  closeModal('modal-detail');
  // ダッシュボード等も再描画
  if (typeof renderDashboard === 'function') renderDashboard();
  renderAll();
  showToast(`${removed.maker} ${removed.model} を削除しました`);
  _deletingCarId = null;
}
