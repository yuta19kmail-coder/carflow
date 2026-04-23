// ========================================
// calendar.js
// カレンダー描画、カウントダウン、月送り
// ========================================

// カレンダー全体を描画
function renderCalendar() {
  const ts = todayStr();
  document.getElementById('cal-title').textContent = `${calYear}年 ${calMonth+1}月`;
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  // 曜日ヘッダー
  WEEK.forEach((d,i) => {
    const e = document.createElement('div');
    e.className = 'cal-dl';
    if (i === 0) e.classList.add('sun');
    else if (i === 6) e.classList.add('sat');
    else e.classList.add('wkd');
    e.textContent = d;
    grid.appendChild(e);
  });

  const sd = new Date(calYear, calMonth, 1).getDay();
  const dim = new Date(calYear, calMonth+1, 0).getDate();

  // 納車準備中(delivery)かつ納車日がある車両のみ
  const targetCars = cars.filter(c => c.col === 'delivery' && c.deliveryDate);

  // バーイベントを構築
  // 1. 今日〜納車日の進行バー（車ごとに1本）
  // 2. マイルストーンは単日バー
  const barEvents = [];
  targetCars.forEach(car => {
    const del = car.deliveryDate;

    // 今日〜納車日の進行バー
    if (ts <= del) {
      barEvents.push({
        car, label:car.model,
        bg:'#43a047', color:'#fff',
        startDate:ts, endDate:del,
        isRange:true, isDelivery:false
      });
    }

    // マイルストーン（単日）
    SCHED_POINTS.forEach(sp => {
      const date = dateAddDays(del, -sp.offset);
      if (date >= ts) {
        barEvents.push({
          car, label:sp.label,
          bg:sp.bg, color:sp.color,
          startDate:date, endDate:date,
          isRange:false, isDelivery:sp.offset === 0
        });
      }
    });
  });

  // 週ごとに描画
  const totalWeeks = Math.ceil((sd + dim) / 7);
  for (let week = 0; week < totalWeeks; week++) {
    const weekCells = [];
    for (let col = 0; col < 7; col++) {
      const dayNum = week*7 + col - sd + 1;
      if (dayNum < 1 || dayNum > dim) { weekCells.push(null); continue; }
      const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
      weekCells.push({dayNum, ds, col});
    }
    const validCells = weekCells.filter(c => c);
    if (!validCells.length) continue;
    const weekStart = validCells[0].ds;
    const weekEnd = validCells[validCells.length-1].ds;

    // この週にかかるイベント
    const weekEvs = barEvents.filter(ev => ev.endDate >= weekStart && ev.startDate <= weekEnd);

    // セルDOM生成
    const cellEls = [];
    weekCells.forEach((cell, colIdx) => {
      if (!cell) {
        const e = document.createElement('div');
        e.className = 'cal-cell';
        e.style.background = '#f8f8f8';
        grid.appendChild(e);
        cellEls.push(null);
        return;
      }
      const {dayNum, ds} = cell;
      const dow = colIdx;
      const isSun = dow === 0, isSat = dow === 6;
      const jpHol = jpHolidays[ds] || null;
      const custHol = customHolidays.find(h => h.date === ds) || null;
      const isClosed = closedDays.includes(dow);
      const isHol = isSun || !!jpHol || !!custHol;
      let cls = 'cal-cell';
      if (ds === ts) cls += ' today';
      else if (isHol) cls += ' hol-day';
      else if (isClosed) cls += ' closed-day';
      const cellEl = document.createElement('div');
      cellEl.className = cls;
      cellEl.dataset.date = ds;

      cellEl.addEventListener('dragover', e => { e.preventDefault(); cellEl.classList.add('drag-target'); });
      cellEl.addEventListener('dragleave', () => cellEl.classList.remove('drag-target'));
      cellEl.addEventListener('drop', e => {
        e.preventDefault();
        cellEl.classList.remove('drag-target');
        if (!dragDeliveryCarId) return;
        const car = cars.find(c => c.id === dragDeliveryCarId);
        if (!car) return;
        const old = car.deliveryDate;
        car.deliveryDate = ds;
        car.contract = 1;
        addLog(car.id, `納車日変更: ${old}→${ds}`);
        dragDeliveryCarId = null;
        renderCalendar();
        renderAll();
        showToast(`納車日を ${fmtDate(ds)} に変更しました`);
      });

      // 日付ヘッダー
      const hdr = document.createElement('div');
      hdr.className = 'cal-cell-header';
      const numEl = document.createElement('span');
      numEl.className = 'cal-cell-num ' + (isHol ? 'hol-col' : isSat ? 'sat-col' : 'nor-col');
      numEl.textContent = dayNum;
      hdr.appendChild(numEl);
      const holName = jpHol || custHol?.name || null;
      if (holName) {
        const t = document.createElement('span');
        t.className = 'cal-cell-tag hol-tag';
        t.textContent = holName;
        hdr.appendChild(t);
      } else if (isClosed) {
        const t = document.createElement('span');
        t.className = 'cal-cell-tag closed-tag';
        t.textContent = '定休日';
        hdr.appendChild(t);
      }
      cellEl.appendChild(hdr);
      grid.appendChild(cellEl);
      cellEls.push(cellEl);
    });

    // レーン割り当て
    const laneEndCol = [];
    weekEvs.forEach(ev => {
      const sIdx = weekCells.findIndex(c => c && c.ds >= ev.startDate);
      const eIdx = weekCells.findLastIndex(c => c && c.ds <= ev.endDate);
      ev._s = sIdx < 0 ? weekCells.findIndex(c => c !== null) : sIdx;
      ev._e = eIdx < 0 ? weekCells.findLastIndex(c => c !== null) : eIdx;
      let lane = 0;
      while (laneEndCol[lane] !== undefined && laneEndCol[lane] >= ev._s) lane++;
      laneEndCol[lane] = ev._e;
      ev._lane = lane;
    });

    // イベント行をセルに追加
    const maxLane = weekEvs.length ? Math.max(...weekEvs.map(e => e._lane)) : 0;
    cellEls.forEach(el => {
      if (!el) return;
      for (let i = 0; i <= maxLane; i++) {
        const row = document.createElement('div');
        row.className = 'cal-ev-row';
        el.appendChild(row);
      }
    });

    // バー描画
    weekEvs.forEach(ev => {
      for (let col = ev._s; col <= ev._e; col++) {
        const cellEl = cellEls[col];
        if (!cellEl) continue;
        const rows = cellEl.querySelectorAll('.cal-ev-row');
        const row = rows[ev._lane];
        if (!row) continue;
        const bar = document.createElement('div');
        bar.className = 'cal-ev-bar';
        const isFirst = col === ev._s, isLast = col === ev._e;
        bar.style.background = ev.bg;
        bar.style.color = ev.color;
        bar.style.left = isFirst ? '2px' : '-1px';
        bar.style.right = isLast ? '2px' : '-1px';
        bar.style.borderRadius = isFirst && isLast ? '3px' : isFirst ? '3px 0 0 3px' : isLast ? '0 3px 3px 0' : '0';
        if (isFirst) {
          bar.textContent = ev.label;
          bar.title = `${ev.car.maker} ${ev.car.model} — ${ev.label}`;
        }
        if (ev.isDelivery) {
          bar.draggable = true;
          bar.style.cursor = 'grab';
          bar.addEventListener('dragstart', () => { dragDeliveryCarId = ev.car.id; });
          bar.addEventListener('dragend', () => { dragDeliveryCarId = null; });
        }
        bar.addEventListener('click', () => openDetail(ev.car.id));
        row.appendChild(bar);
      }
    });
  }
  renderCountdown();
}

// カウントダウンカード描画
function renderCountdown() {
  const el = document.getElementById('cal-countdown');
  if (!el) return;
  const ts = todayStr();
  const items = [];
  cars.filter(c => c.col === 'delivery' && c.deliveryDate).forEach(car => {
    SCHED_POINTS.forEach(sp => {
      const date = dateAddDays(car.deliveryDate, -sp.offset);
      const diff = Math.ceil((new Date(date) - new Date(ts)) / 86400000);
      if (diff >= 0) items.push({car, label:sp.label, date, diff, bg:sp.bg, color:sp.color});
    });
  });
  items.sort((a,b) => a.diff - b.diff);
  if (!items.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:8px 0">納車準備中の車両がありません</div>';
    return;
  }
  el.innerHTML = items.map(it => `
    <div class="countdown-card" onclick="openDetail('${it.car.id}')">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <div style="width:9px;height:9px;border-radius:50%;background:${it.bg};flex-shrink:0"></div>
        <div style="font-size:11px;color:var(--text2)">${it.label}</div>
      </div>
      <div class="countdown-num" style="color:${it.diff===0?'var(--red)':it.diff<=3?'var(--orange)':it.diff<=7?'var(--blue)':'var(--text)'}">${it.diff===0?'本日！':it.diff+'日後'}</div>
      <div class="countdown-label">${fmtDate(it.date)}</div>
      <div class="countdown-car">${it.car.model}</div>
      <div class="countdown-type" style="color:var(--text3)">${it.car.maker} · ${it.car.num}</div>
    </div>`).join('');
}

// 前月へ
function calPrev() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

// 翌月へ
function calNext() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}
