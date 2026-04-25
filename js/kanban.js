// ========================================
// kanban.js
// カンバンボード描画、車両カード生成、ドラッグ&ドロップ、売却確認
// ========================================

const COMPACT_THRESHOLD = 4;
let expandedCards = {};

// カンバン全体を描画
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
      if (dragCard.col === 'exhibit' && col.id === 'delivery') {
        pendingDragCar = dragCard;
        pendingTargetCol = col.id;
        const lead = (typeof appSettings !== 'undefined' && appSettings.deliveryLeadDays) || 14;
        document.getElementById('sell-date').value = dateAddDays(todayStr(), lead);
        document.getElementById('confirm-sell').classList.add('open');
      } else {
        addLog(dragCard.id, `ステータス変更: ${COLS.find(c=>c.id===dragCard.col)?.label}→${col.label}`);
        if (col.id === 'delivery' && dragCard.col !== 'delivery') dragCard.workMemo = '';
        dragCard.col = col.id;
        renderAll();
        showToast('ステータスを更新しました');
      }
    });
  });
}

// 車両カード1枚を生成
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

  // 右上：在庫日数 or 売約日数
  const contractedDays = daysSinceContract(car);
  let topDayTag;
  if (car.contract) {
    topDayTag = `<div class="cc-bigday db">売約<span class="cc-bigday-num">${contractedDays}</span>日</div>`;
  } else {
    const wt = invWarnTier(inv);
    const cls = wt ? (wt.days >= 45 ? 'dr' : wt.days >= 30 ? 'dw' : 'dg') : 'dg';
    topDayTag = `<div class="cc-bigday ${cls}"${wt?` style="background:${wt.bg};color:${wt.color}"`:''}>在庫<span class="cc-bigday-num">${inv}</span>日</div>`;
  }

  // 下段帯：列ごとにルール分岐
  // 仕入れ・再生中→仕入れからN日 / 展示中→なし / 納車準備→納車までN日 / 納車完了→なし
  let bottomBar = '';
  if (car.col === 'stock' || car.col === 'regen') {
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

// 売却確認ダイアログの処理
function closeSellConfirm(sell) {
  document.getElementById('confirm-sell').classList.remove('open');
  if (!pendingDragCar) return;
  const car = pendingDragCar;
  if (sell) {
    car.contract = 1;
    if (!car.contractDate) car.contractDate = todayStr();
    car.deliveryDate = document.getElementById('sell-date').value || '';
    addLog(car.id, '売約設定・納車準備へ移動');
  } else {
    addLog(car.id, 'ステータス変更: 展示中→納車準備');
  }
  if (pendingTargetCol === 'delivery' && car.col !== 'delivery') car.workMemo = '';
  car.col = pendingTargetCol;
  pendingDragCar = null;
  pendingTargetCol = null;
  renderAll();
  showToast(sell ? '売約にしました！' : 'ステータスを更新しました');
}
