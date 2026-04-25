// ========================================
// calendar.js
// 納車カレンダー描画、カウントダウン、月送り
// v0.8.0: 2か月連続表示、1本バー＋マイルストーン色分け、打ち消し線、警告カード重複排除
// ========================================

// マイルストーンの完了判定
// SCHED_POINTS の各 offset がどの deliveryTask 完了に紐付くか
// 0=納車日, 1=完全完成, 2=登録完了, 3=整備完了, 5=書類作成完了
function isMilestoneDone(car, offset) {
  const dt = car.deliveryTasks || {};
  switch (offset) {
    case 0: // 納車日
      return car.col === 'done';
    case 1: { // 完全完成 = d_prep 全項目完了
      const t = (DELIVERY_TASKS || []).find(x => x.id === 'd_prep');
      if (!t || !t.sections) return false;
      const st = dt.d_prep || {};
      return t.sections.every(sec => sec.items.every(i => st[i.id]));
    }
    case 2: // 登録完了 = d_reg ON
      return !!dt.d_reg;
    case 3: { // 整備完了 = d_maint 全項目完了
      const t = (DELIVERY_TASKS || []).find(x => x.id === 'd_maint');
      if (!t || !t.sections) return false;
      const st = dt.d_maint || {};
      return t.sections.every(sec => sec.items.every(i => st[i.id]));
    }
    case 5: // 書類作成完了 = d_docs ON
      return !!dt.d_docs;
    default:
      return false;
  }
}

// 1台あたりの「1本バー」のセグメント配列を作る
// 今日〜納車日を SCHED_POINTS の日付で区切り、各区間をマイルストーン色で塗る
function buildBarSegments(car, todayStr) {
  const del = car.deliveryDate;
  if (!del || del < todayStr) return [];

  const pointsByDateAsc = [...SCHED_POINTS]
    .map(sp => ({...sp, date: dateAddDays(del, -sp.offset)}))
    .sort((a, b) => a.date.localeCompare(b.date));

  const segments = [];
  let cursor = todayStr;

  for (let i = 0; i < pointsByDateAsc.length; i++) {
    const sp = pointsByDateAsc[i];
    if (sp.date < todayStr) continue;
    if (sp.date < cursor) continue;

    segments.push({
      car,
      label: sp.label,
      bg: sp.bg,
      color: sp.color,
      startDate: cursor,
      endDate: sp.date,
      isFinal: sp.offset === 0,
      milestoneOffset: sp.offset,
      isDone: isMilestoneDone(car, sp.offset),
    });
    cursor = dateAddDays(sp.date, 1);
  }

  return segments;
}

// 1か月分のグリッドを描画する内部関数
function renderOneMonth(year, month, hostEl) {
  const ts = todayStr();

  // 月見出し
  const labelEl = document.createElement('div');
  labelEl.className = 'cal-section-label';
  if (year === calYear && month === calMonth) {
    labelEl.textContent = `${year}年 ${month + 1}月`;
  } else {
    labelEl.textContent = `${year}年 ${month + 1}月（翌月）`;
    labelEl.classList.add('next');
  }
  hostEl.appendChild(labelEl);

  // ラッパ
  const wrap = document.createElement('div');
  wrap.className = 'cal-wrap-inner';
  wrap.style.cssText = 'background:#fff;border-radius:var(--r2);overflow:hidden;border:1px solid #ddd';
  hostEl.appendChild(wrap);

  const grid = document.createElement('div');
  grid.className = 'cal-grid';
  wrap.appendChild(grid);

  // 曜日ヘッダー
  WEEK.forEach((d, i) => {
    const e = document.createElement('div');
    e.className = 'cal-dl';
    if (i === 0) e.classList.add('sun');
    else if (i === 6) e.classList.add('sat');
    else e.classList.add('wkd');
    e.textContent = d;
    grid.appendChild(e);
  });

  const sd = new Date(year, month, 1).getDay();
  const dim = new Date(year, month + 1, 0).getDate();

  const targetCars = cars.filter(c => c.col === 'delivery' && c.deliveryDate);

  const allSegments = [];
  targetCars.forEach(car => {
    const segs = buildBarSegments(car, ts);
    segs.forEach(s => allSegments.push(s));
  });

  // 週ごとに描画
  const totalWeeks = Math.ceil((sd + dim) / 7);
  for (let week = 0; week < totalWeeks; week++) {
    const weekCells = [];
    for (let col = 0; col < 7; col++) {
      const dayNum = week * 7 + col - sd + 1;
      if (dayNum < 1 || dayNum > dim) {
        weekCells.push(null);
        continue;
      }
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      weekCells.push({dayNum, ds, col});
    }
    const validCells = weekCells.filter(c => c);
    if (!validCells.length) continue;
    const weekStart = validCells[0].ds;
    const weekEnd = validCells[validCells.length - 1].ds;

    const weekSegs = allSegments.filter(s => s.endDate >= weekStart && s.startDate <= weekEnd);

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
      const isClosed = (typeof isClosedByRules === 'function') ? isClosedByRules(ds) : closedDays.includes(dow);
      const isHol = isSun || !!jpHol || !!custHol;

      let cls = 'cal-cell';
      if (ds === ts) cls += ' today';
      if (isHol) cls += ' hol-day';
      if (isClosed) cls += ' closed-day';

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
        if (!car.contract) {
          car.contract = 1;
          if (!car.contractDate) car.contractDate = todayStr();
        }
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

    // -------- レーン割り当て（1車種=1レーン）--------
    const carLane = {};
    let nextLane = 0;
    weekSegs.forEach(s => {
      if (!(s.car.id in carLane)) {
        carLane[s.car.id] = nextLane++;
      }
    });

    weekSegs.forEach(s => {
      const sIdx = weekCells.findIndex(c => c && c.ds >= s.startDate);
      const eIdx = weekCells.findLastIndex(c => c && c.ds <= s.endDate);
      s._s = sIdx < 0 ? weekCells.findIndex(c => c !== null) : sIdx;
      s._e = eIdx < 0 ? weekCells.findLastIndex(c => c !== null) : eIdx;
      s._lane = carLane[s.car.id];
    });

    const carWeekStart = {};
    weekSegs.forEach(s => {
      if (!(s.car.id in carWeekStart) || s._s < carWeekStart[s.car.id]) {
        carWeekStart[s.car.id] = s._s;
      }
    });

    const totalRows = nextLane > 0 ? (nextLane * 2) : 0;

    cellEls.forEach(el => {
      if (!el) return;
      for (let i = 0; i < totalRows; i++) {
        const row = document.createElement('div');
        row.className = 'cal-ev-row';
        el.appendChild(row);
      }
    });

    // 車種名ラベル（週頭）
    Object.keys(carWeekStart).forEach(carId => {
      const startCol = carWeekStart[carId];
      const lane = carLane[carId];
      const car = cars.find(c => c.id === carId);
      if (!car) return;
      const cellEl = cellEls[startCol];
      if (!cellEl) return;
      const rows = cellEl.querySelectorAll('.cal-ev-row');
      const nameRow = rows[lane * 2];
      if (!nameRow) return;
      const nameEl = document.createElement('div');
      nameEl.style.cssText = 'position:absolute;left:4px;right:0;top:0;height:16px;font-size:10px;font-weight:700;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:4px;pointer-events:none';
      nameEl.textContent = car.model;
      nameEl.title = `${car.maker} ${car.model}`;
      nameRow.appendChild(nameEl);
    });

    // バー描画
    weekSegs.forEach(s => {
      const segWidth = s._e - s._s + 1;
      for (let col = s._s; col <= s._e; col++) {
        const cellEl = cellEls[col];
        if (!cellEl) continue;
        const rows = cellEl.querySelectorAll('.cal-ev-row');
        const row = rows[s._lane * 2 + 1];
        if (!row) continue;

        const bar = document.createElement('div');
        bar.className = 'cal-ev-bar';
        if (s.isDone) bar.classList.add('done');

        const isFirst = col === s._s, isLast = col === s._e;
        bar.style.background = s.bg;
        bar.style.color = s.color;
        bar.style.left = isFirst ? '2px' : '-1px';
        bar.style.right = isLast ? '2px' : '-1px';
        bar.style.borderRadius = isFirst && isLast ? '8px' : isFirst ? '8px 0 0 8px' : isLast ? '0 8px 8px 0' : '0';

        if (isFirst && segWidth >= 2) {
          bar.textContent = s.label;
          bar.title = `${s.car.maker} ${s.car.model} — ${s.label}${s.isDone ? '（完了）' : ''}`;
        } else if (isFirst) {
          bar.title = `${s.car.maker} ${s.car.model} — ${s.label}${s.isDone ? '（完了）' : ''}`;
        }

        if (s.isFinal) {
          bar.draggable = true;
          bar.style.cursor = 'grab';
          bar.addEventListener('dragstart', () => { dragDeliveryCarId = s.car.id; });
          bar.addEventListener('dragend', () => { dragDeliveryCarId = null; });
        }
        bar.addEventListener('click', () => openDetail(s.car.id));
        row.appendChild(bar);
      }
    });
  }
}

// カレンダー全体を描画（当月＋翌月）
function renderCalendar() {
  const titleEl = document.getElementById('cal-title');
  if (titleEl) {
    let ny = calYear, nm = calMonth + 1;
    if (nm > 11) { nm = 0; ny++; }
    titleEl.textContent = `${calYear}年 ${calMonth + 1}月 〜 ${ny}年 ${nm + 1}月`;
  }

  // .cal-wrap をホストにして毎回中身を作り直す
  const host = document.querySelector('#view-calendar .cal-wrap');
  if (!host) return;
  host.innerHTML = '';
  host.style.background = 'transparent';
  host.style.border = 'none';
  host.style.borderRadius = '0';
  host.style.overflow = 'visible';

  // 当月
  renderOneMonth(calYear, calMonth, host);

  // 翌月
  let ny = calYear, nm = calMonth + 1;
  if (nm > 11) { nm = 0; ny++; }
  renderOneMonth(ny, nm, host);

  renderCountdown();
}

// カウントダウンカード描画（1車種1個に重複排除：直近の未完了マイルストーン）
function renderCountdown() {
  const el = document.getElementById('cal-countdown');
  if (!el) return;
  const ts = todayStr();

  const byCarId = {};
  cars.filter(c => c.col === 'delivery' && c.deliveryDate).forEach(car => {
    SCHED_POINTS.forEach(sp => {
      const date = dateAddDays(car.deliveryDate, -sp.offset);
      const diff = Math.ceil((new Date(date) - new Date(ts)) / 86400000);
      if (diff < 0) return;
      if (isMilestoneDone(car, sp.offset)) return;
      const cand = {car, label: sp.label, date, diff, bg: sp.bg, color: sp.color, offset: sp.offset};
      const cur = byCarId[car.id];
      if (!cur || cand.diff < cur.diff) byCarId[car.id] = cand;
    });
  });

  const items = Object.values(byCarId).sort((a, b) => a.diff - b.diff);

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
      <div class="countdown-num" style="color:${it.diff === 0 ? 'var(--red)' : it.diff <= 3 ? 'var(--orange)' : it.diff <= 7 ? 'var(--blue)' : 'var(--text)'}">${it.diff === 0 ? '本日！' : it.diff + '日後'}</div>
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
