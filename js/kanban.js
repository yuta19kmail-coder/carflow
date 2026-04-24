// ========================================
// kanban.js
// カンバンボード描画、車両カード生成、ドラッグ&ドロップ、売却確認
// ========================================

// 小表示モードへ切り替える列内の枚数しきい値
const COMPACT_THRESHOLD = 4;

// 現在一時展開中のカード（小表示モード時に1枚だけ大表示にする用）
// { colId: cardElement } のマップ。列ごとに1枚のみ展開可。
let expandedCards = {};

// カンバン全体を描画
function renderKanban() {
  // 再描画時は展開状態をクリア
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

    // 最下段の下に将来カンバン追加用の空行スペース
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
  // 売約ONなら「売約◯日」(blue系)、それ以外は「在庫◯日」(3段警告)
  const contractedDays = daysSinceContract(car);
  let dayTag;
  if (car.contract) {
    // 納車残日数の警告色 or 基本blue
    const diff = car.deliveryDate ? daysDiff(car.deliveryDate) : null;
    const dt = delWarnTier(diff);
    const extra = (dt && diff != null && diff >= 0) ? `<span style="margin-left:4px;font-size:10px">${diff===0?'納車本日':'納車まで'+diff+'日'}</span>` : '';
    dayTag = `<div class="cc-days db">売約${contractedDays}日${extra}</div>`;
  } else {
    const wt = invWarnTier(inv);
    const cls = wt ? (wt.days >= 45 ? 'dr' : wt.days >= 30 ? 'dw' : 'dg') : 'dg';
    dayTag = `<div class="cc-days ${cls}"${wt?` style="background:${wt.bg};color:${wt.color}"`:''}>在庫${inv}日</div>`;
  }
  const div = document.createElement('div');
  div.className = 'car-card' + (isCompact ? ' compact' : '');
  div.draggable = true;
  div.dataset.carId = car.id;
  div.dataset.col = car.col;
  div.innerHTML = `
    <div class="cc-thumb">${car.photo ? `<img src="${car.photo}">` : carEmoji(car.size)}</div>
    <div class="cc-body">
      <div class="cc-maker">${car.maker} · ${car.num}</div>
      <div class="cc-model">${car.model}</div>
      <div class="cc-price">${fmtPrice(car.price)}</div>
      <div class="cc-mid">
        <div><div class="cc-pct">${prog.pct}%</div><div class="cc-pct-label">${isD?'納車準備':'再生'}進捗</div></div>
        <div class="cc-dots">${dots}</div>
      </div>
      <div class="cc-foot"><div class="cc-tag">${car.size}</div><div class="cc-tag">${fmtYearDisplay(parseYearInput(car.year)||car.year)}</div>${dayTag}</div>
    </div>`;
  div.addEventListener('dragstart', () => { dragCard = car; div.classList.add('dragging'); });
  div.addEventListener('dragend', () => { dragCard = null; div.classList.remove('dragging'); });

  // クリック挙動
  //   通常モード：即 車両詳細を開く
  //   小表示モード：
  //     未展開→1枚だけ一時大表示（同列の別展開は閉じる）
  //     展開中→車両詳細を開く
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
  car.col = pendingTargetCol;
  pendingDragCar = null;
  pendingTargetCol = null;
  renderAll();
  showToast(sell ? '売約にしました！' : 'ステータスを更新しました');
}
