// ========================================
// kanban.js
// カンバンボード描画、車両カード生成、ドラッグ&ドロップ、売約／取消／納車完了フロー
// v0.8.5: 納車完了フロー＋祝福演出
// ========================================

const COMPACT_THRESHOLD = 4;
let expandedCards = {};

const COL_ORDER = ['purchase','regen','exhibit','delivery','done'];
const colIdx = id => COL_ORDER.indexOf(id);

// ========================================
// カンバン描画
// ========================================
function renderKanban() {
  expandedCards = {};
  const wrap = document.getElementById('kanban-wrap');
  wrap.innerHTML = '';
  COLS.forEach(col => {
    const colCars = cars.filter(c => c.col === col.id);
    const isCompact = colCars.length >= COMPACT_THRESHOLD;
    const div = document.createElement('div');
    div.className = 'k-col';
    div.innerHTML = `<div class="k-col-hdr"><div class="k-col-dot" style="background:${col.color}"></div><div class="k-col-title">${col.label}</div><div class="k-col-count">${colCars.length}</div></div><div class="k-cards" id="kc-${col.id}" data-col="${col.id}"></div>`;
    wrap.appendChild(div);
    const cd = div.querySelector('.k-cards');
    colCars.forEach(car => cd.appendChild(makeCarCard(car, isCompact)));

    const spacer = document.createElement('div');
    spacer.className = 'k-col-spacer';
    cd.appendChild(spacer);

    cd.addEventListener('dragover', e => { e.preventDefault(); cd.classList.add('drag-over'); });
    cd.addEventListener('dragleave', () => cd.classList.remove('drag-over'));
    cd.addEventListener('drop', e => {
      e.preventDefault();
      cd.classList.remove('drag-over');
      if (!dragCard || dragCard.col === col.id) return;
      handleKanbanMove(dragCard, col.id);
    });
  });
}

// ========================================
// 車両カード生成
// ========================================
function makeCarCard(car, isCompact) {
  const isD = car.col === 'delivery' || car.col === 'done';
  const tasks = isD ? DELIVERY_TASKS : REGEN_TASKS;
  const prog = calcProg(car);
  const inv = daysSince(car.purchaseDate);
  const dots = tasks.map(t => {
    const p = calcSingleProg(car, t.id, tasks);
    const cls = p.pct === 100 ? 'done' : p.pct > 0 ? 'partial' : '';
    return `<div class="cc-dot ${cls}" title="${t.name} ${p.pct}%"></div>`;
  }).join('');

  const contractedDays = daysSinceContract(car);
  let topDayTag;
  if (car.contract) {
    topDayTag = `<div class="cc-bigday db">売約<span class="cc-bigday-num">${contractedDays}</span>日</div>`;
  } else {
    const wt = invWarnTier(inv);
    const cls = wt ? (wt.days >= 45 ? 'dr' : wt.days >= 30 ? 'dw' : 'dg') : 'dg';
    topDayTag = `<div class="cc-bigday ${cls}"${wt?` style="background:${wt.bg};color:${wt.color}"`:''}>在庫<span class="cc-bigday-num">${inv}</span>日</div>`;
  }

  let bottomBar = '';
  if (car.col === 'purchase' || car.col === 'stock' || car.col === 'regen') {
    bottomBar = `<div class="cc-bottom-bar">仕入れから${inv}日</div>`;
  } else if (car.col === 'delivery') {
    const delDiff = car.deliveryDate ? daysDiff(car.deliveryDate) : null;
    if (delDiff != null) {
      const dt = delWarnTier(delDiff);
      const cls = dt ? (delDiff < 0 ? 'br' : delDiff <= 1 ? 'br' : delDiff <= 3 ? 'bw' : 'bb') : 'bb';
      const label = delDiff === 0 ? '納車本日' : delDiff > 0 ? `納車まで${delDiff}日` : `納車超過${-delDiff}日`;
      bottomBar = `<div class="cc-bottom-bar ${cls}"${dt?` style="background:${dt.bg};color:${dt.color}"`:''}>${label}</div>`;
    } else {
      bottomBar = `<div class="cc-bottom-bar">納車日未設定</div>`;
    }
  }

  const div = document.createElement('div');
  div.className = 'car-card' + (isCompact ? ' compact' : '');
  div.draggable = true;
  div.dataset.carId = car.id;
  div.dataset.col = car.col;
  div.innerHTML = `
    <div class="cc-thumb">${car.photo ? `<img src="${car.photo}">` : carEmoji(car.size)}</div>
    <div class="cc-body">
      <div class="cc-info-row">
        <div class="cc-info-left">
          <div class="cc-maker">${car.maker} · ${car.num}</div>
          <div class="cc-model">${car.model}</div>
          <div class="cc-price">${fmtPrice(car.price)}</div>
        </div>
        <div class="cc-info-right">
          ${topDayTag}
          <div class="cc-tag">${car.size}</div>
          <div class="cc-tag">${fmtYearDisplay(parseYearInput(car.year)||car.year)}</div>
        </div>
      </div>
      <div class="cc-mid">
        <div class="cc-pct-wrap"><span class="cc-pct">${prog.pct}%</span><span class="cc-pct-label">${isD?'納車準備':'再生'}進捗</span></div>
        <div class="cc-dots">${dots}</div>
      </div>
    </div>
    ${bottomBar}`;
  div.addEventListener('dragstart', () => { dragCard = car; div.classList.add('dragging'); });
  div.addEventListener('dragend', () => { dragCard = null; div.classList.remove('dragging'); });

  div.addEventListener('click', () => {
    if (!isCompact) { openDetail(car.id); return; }
    const colId = car.col;
    const currentExpanded = expandedCards[colId];
    if (currentExpanded === div) {
      openDetail(car.id);
    } else {
      if (currentExpanded) currentExpanded.classList.remove('expanded');
      div.classList.add('expanded');
      expandedCards[colId] = div;
    }
  });
  return div;
}

// ========================================
// カンバン移動の振り分け
// ========================================
function handleKanbanMove(car, targetCol) {
  const fromLabel = COLS.find(c => c.id === car.col)?.label || car.col;
  const toLabel = COLS.find(c => c.id === targetCol)?.label || targetCol;

  // パターン1: 仕入れ/再生中/展示中 → 納車準備（売約POP）
  if ((car.col === 'purchase' || car.col === 'regen' || car.col === 'exhibit') && targetCol === 'delivery') {
    pendingDragCar = car;
    pendingTargetCol = targetCol;
    const lead = (typeof appSettings !== 'undefined' && appSettings.deliveryLeadDays) || 14;
    document.getElementById('sell-date').value = car.deliveryDate || dateAddDays(todayStr(), lead);
    document.getElementById('confirm-sell').classList.add('open');
    return;
  }

  // パターン2: 仕入れ/再生中/展示中 → 納車完了（特例：売約POP→OKで一気に納車完了＋祝福演出）
  if ((car.col === 'purchase' || car.col === 'regen' || car.col === 'exhibit') && targetCol === 'done') {
    pendingDragCar = car;
    pendingTargetCol = targetCol;
    const lead = (typeof appSettings !== 'undefined' && appSettings.deliveryLeadDays) || 14;
    document.getElementById('sell-date').value = car.deliveryDate || dateAddDays(todayStr(), lead);
    document.getElementById('confirm-sell').classList.add('open');
    return;
  }

  // パターン3: 納車準備 → 納車完了（納車完了確認POP→OKで祝福演出）
  if (car.col === 'delivery' && targetCol === 'done') {
    pendingDragCar = car;
    pendingTargetCol = targetCol;
    document.getElementById('confirm-deliver').classList.add('open');
    return;
  }

  // パターン4: 納車準備/納車完了 → それより前（売約キャンセル確認）
  if ((car.col === 'delivery' || car.col === 'done') &&
      (targetCol === 'purchase' || targetCol === 'regen' || targetCol === 'exhibit')) {
    pendingDragCar = car;
    pendingTargetCol = targetCol;
    const sub = document.getElementById('uncontract-sub');
    if (sub) sub.textContent = `${fromLabel} → ${toLabel} に戻します。売約日・納車予定日・納車準備の進捗もすべてリセットされます。`;
    document.getElementById('confirm-uncontract').classList.add('open');
    return;
  }

  // パターン5: 納車完了 → 納車準備（取り消し確認、売約は残す）
  if (car.col === 'done' && targetCol === 'delivery') {
    pendingDragCar = car;
    pendingTargetCol = targetCol;
    document.getElementById('confirm-undeliver').classList.add('open');
    return;
  }

  // それ以外（仕入れ↔再生中、再生中↔展示中など）はそのまま移動
  applyKanbanMove(car, targetCol);
}

function applyKanbanMove(car, targetCol) {
  const fromLabel = COLS.find(c => c.id === car.col)?.label || car.col;
  const toLabel = COLS.find(c => c.id === targetCol)?.label || targetCol;
  if (targetCol === 'delivery' && car.col !== 'delivery') car.workMemo = '';
  car.col = targetCol;
  addLog(car.id, `ステータス変更: ${fromLabel}→${toLabel}`);
  renderAll();
  showToast('ステータスを更新しました');
}

// ========================================
// 売約確認ダイアログ
// targetCol が done のときは売約データ設定後に祝福演出
// ========================================
function closeSellConfirm(sell) {
  document.getElementById('confirm-sell').classList.remove('open');
  if (!pendingDragCar) return;
  const car = pendingDragCar;
  const target = pendingTargetCol;
  pendingDragCar = null;
  pendingTargetCol = null;
  if (!sell) {
    showToast('キャンセルしました');
    return;
  }
  car.contract = 1;
  if (!car.contractDate) car.contractDate = todayStr();
  car.deliveryDate = document.getElementById('sell-date').value || '';
  car.workMemo = '';
  const fromLabel = COLS.find(c => c.id === car.col)?.label || car.col;
  const toLabel = COLS.find(c => c.id === target)?.label || target;
  car.col = target;
  if (target === 'done') {
    addLog(car.id, `売約＆納車完了：${fromLabel}→${toLabel}（特例）`);
    renderAll();
    celebrateDelivery(car);
  } else {
    addLog(car.id, `売約設定：${fromLabel}→${toLabel}`);
    renderAll();
    showToast('売約にしました！');
  }
}

// ========================================
// 納車完了確認ダイアログ（納車準備 → 納車完了）
// ========================================
function closeDeliverConfirm(deliver) {
  document.getElementById('confirm-deliver').classList.remove('open');
  if (!pendingDragCar) return;
  const car = pendingDragCar;
  const target = pendingTargetCol;
  pendingDragCar = null;
  pendingTargetCol = null;
  if (!deliver) {
    showToast('キャンセルしました');
    return;
  }
  car.col = target;
  addLog(car.id, '納車完了：納車準備→納車完了');
  renderAll();
  celebrateDelivery(car);
}

// ========================================
// 売約キャンセル確認ダイアログ
// ========================================
function closeUncontractConfirm(uncontract) {
  document.getElementById('confirm-uncontract').classList.remove('open');
  if (!pendingDragCar) return;
  const car = pendingDragCar;
  const target = pendingTargetCol;
  pendingDragCar = null;
  pendingTargetCol = null;
  if (!uncontract) {
    showToast('キャンセルしました');
    return;
  }
  car.contract = 0;
  car.contractDate = '';
  car.deliveryDate = '';
  car.workMemo = '';
  if (typeof DELIVERY_TASKS !== 'undefined' && typeof mkTaskState === 'function') {
    car.deliveryTasks = mkTaskState(DELIVERY_TASKS);
  }
  const fromLabel = COLS.find(c => c.id === car.col)?.label || car.col;
  const toLabel = COLS.find(c => c.id === target)?.label || target;
  car.col = target;
  addLog(car.id, `売約キャンセル：${fromLabel}→${toLabel}（売約・納車準備データをリセット）`);
  renderAll();
  showToast('売約をキャンセルしました');
}

// ========================================
// 納車完了取り消し確認ダイアログ
// ========================================
function closeUndeliverConfirm(undeliver) {
  document.getElementById('confirm-undeliver').classList.remove('open');
  if (!pendingDragCar) return;
  const car = pendingDragCar;
  const target = pendingTargetCol;
  pendingDragCar = null;
  pendingTargetCol = null;
  if (!undeliver) {
    showToast('キャンセルしました');
    return;
  }
  car.col = target;
  addLog(car.id, '納車完了を取り消し：納車完了→納車準備');
  renderAll();
  showToast('納車完了を取り消しました');
}

// ========================================
// 納車完了の祝福演出（紙吹雪＋中央カード）
// ========================================
function celebrateDelivery(car) {
  const overlay = document.getElementById('celebrate-overlay');
  if (!overlay) return;
  const conf = document.getElementById('celebrate-confetti');
  const carEl = document.getElementById('celebrate-car');
  if (carEl) carEl.textContent = `${car.maker} ${car.model}（${car.num}）`;

  // 既存紙吹雪をクリア
  if (conf) conf.innerHTML = '';

  // 紙吹雪を生成（120片）
  const colors = ['#fcd34d','#fb923c','#f87171','#60a5fa','#34d399','#a78bfa','#f472b6','#facc15'];
  const count = 120;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const left = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 300;
    const spin = (Math.random() * 1080 + 360) * (Math.random() < 0.5 ? -1 : 1);
    const dur = 2.4 + Math.random() * 1.6;
    const delay = Math.random() * 0.4;
    const w = 6 + Math.random() * 8;
    const h = 8 + Math.random() * 12;
    piece.style.left = left + '%';
    piece.style.width = w + 'px';
    piece.style.height = h + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = Math.random() < 0.3 ? '50%' : '2px';
    piece.style.setProperty('--drift', drift + 'px');
    piece.style.setProperty('--spin', spin + 'deg');
    piece.style.animationDuration = dur + 's';
    piece.style.animationDelay = delay + 's';
    if (conf) conf.appendChild(piece);
  }

  overlay.classList.remove('fade-out');
  overlay.classList.add('show');

  // 3秒後にフェードアウト
  setTimeout(() => {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.classList.remove('show', 'fade-out');
      if (conf) conf.innerHTML = '';
    }, 500);
  }, 3000);
}
