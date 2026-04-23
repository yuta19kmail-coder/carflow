// ========================================
// kanban.js
// カンバンボード描画、車両カード生成、ドラッグ&ドロップ、売却確認
// ========================================

// カンバン全体を描画
function renderKanban() {
  const wrap = document.getElementById('kanban-wrap');
  wrap.innerHTML = '';
  COLS.forEach(col => {
    const colCars = cars.filter(c => c.col === col.id);
    const div = document.createElement('div');
    div.className = 'k-col';
    div.innerHTML = `<div class="k-col-hdr"><div class="k-col-dot" style="background:${col.color}"></div><div class="k-col-title">${col.label}</div><div class="k-col-count">${colCars.length}</div></div><div class="k-cards" id="kc-${col.id}" data-col="${col.id}"></div>`;
    wrap.appendChild(div);
    const cd = div.querySelector('.k-cards');
    colCars.forEach(car => cd.appendChild(makeCarCard(car)));
    cd.addEventListener('dragover', e => { e.preventDefault(); cd.classList.add('drag-over'); });
    cd.addEventListener('dragleave', () => cd.classList.remove('drag-over'));
    cd.addEventListener('drop', e => {
      e.preventDefault();
      cd.classList.remove('drag-over');
      if (!dragCard || dragCard.col === col.id) return;
      // 展示中→納車準備の場合は売却確認
      if (dragCard.col === 'exhibit' && col.id === 'delivery') {
        pendingDragCar = dragCard;
        pendingTargetCol = col.id;
        document.getElementById('sell-date').value = '';
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
function makeCarCard(car) {
  const isD = car.col === 'delivery' || car.col === 'done';
  const tasks = isD ? DELIVERY_TASKS : REGEN_TASKS;
  const prog = calcProg(car);
  const inv = daysSince(car.purchaseDate);
  const dots = tasks.map(t => {
    const p = calcSingleProg(car, t.id, tasks);
    const cls = p.pct === 100 ? 'done' : p.pct > 0 ? 'partial' : '';
    return `<div class="cc-dot ${cls}" title="${t.name} ${p.pct}%"></div>`;
  }).join('');
  const div = document.createElement('div');
  div.className = 'car-card';
  div.draggable = true;
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
      <div class="cc-foot"><div class="cc-tag">${car.size}</div><div class="cc-tag">${car.year}年</div><div class="cc-days ${inv>30?'dw':'dg'}">在庫${inv}日</div></div>
    </div>`;
  div.addEventListener('dragstart', () => { dragCard = car; div.classList.add('dragging'); });
  div.addEventListener('dragend', () => { dragCard = null; div.classList.remove('dragging'); });
  div.addEventListener('click', () => openDetail(car.id));
  return div;
}

// 売却確認ダイアログの処理
function closeSellConfirm(sell) {
  document.getElementById('confirm-sell').classList.remove('open');
  if (!pendingDragCar) return;
  const car = pendingDragCar;
  if (sell) {
    car.contract = 1;
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
