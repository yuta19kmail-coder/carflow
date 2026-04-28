// ========================================
// calendar.js
// 納車カレンダー描画、カウントダウン、月送り
// v0.8.2: 警告カードを上に・今月ボタン・ラベルを最終日（マイルストーン日）に表示
// ========================================

// v1.0.37: 納車カレンダーのマイルストーン定義は「設定UIの期日」から動的生成
// 納車日（offset=0）は固定、それ以外は appTaskDeadline.delivery + 有効タスクから生成
//   - 期日設定がないタスク／無効化タスク はマーカーに出さない（A方針）
//   - ラベル/色はタスクの icon と name を使う
//   - 期日(offset)が同日のタスクは1本にまとめる

// 各タスクの完了判定（汎用）
// task: { id, type, sections? }, state: car.deliveryTasks
function _isDeliveryTaskDone(car, taskId) {
  if (taskId === '__deliver') return car.col === 'done';
  const tasks = (typeof DELIVERY_TASKS !== 'undefined') ? DELIVERY_TASKS : [];
  const t = tasks.find(x => x.id === taskId);
  const dt = car.deliveryTasks || {};
  if (!t) {
    // カスタムタスク（toggle 型）
    return !!dt[taskId];
  }
  if (t.type === 'workflow' && Array.isArray(t.sections)) {
    const st = dt[taskId] || {};
    return t.sections.every(sec => sec.items.every(i => st[i.id]));
  }
  return !!dt[taskId];
}

// 後方互換：他から呼ばれている可能性に備えてラッパーを残す
function isMilestoneDone(car, offset) {
  if (offset === 0) return _isDeliveryTaskDone(car, '__deliver');
  return false;
}

// マーカー色をフォールバック決定（タスクIDに応じて）
function _markerStyleFor(taskId) {
  // 既存 SCHED_POINTS の色味と整合（後方互換）
  const map = {
    d_docs:  { bg:'#f9a825', color:'#333' },
    d_maint: { bg:'#e65100', color:'#fff' },
    d_reg:   { bg:'#6a1b9a', color:'#fff' },
    d_prep:  { bg:'#1565c0', color:'#fff' },
  };
  return map[taskId] || { bg:'var(--blue)', color:'#fff' };
}

// 設定UIから動的にマイルストーン点を生成
// 戻り値：[{ offset, label, bg, color, taskId, isFinal? }, ...]
function _getDeliveryMilestonePoints() {
  const points = [];
  // 納車当日（固定・必須）
  points.push({ offset:0, label:'🚗 納車日', bg:'#388e3c', color:'#fff', bold:true, taskId:'__deliver', isFinal:true });
  // 設定UIから期日付き有効タスクを取得
  const tasks = (typeof getActiveDeliveryTasks === 'function') ? getActiveDeliveryTasks() : [];
  tasks.forEach(t => {
    const dl = (typeof getTaskDeadline === 'function') ? getTaskDeadline(t.id, 'delivery') : null;
    if (dl == null) return;
    const style = _markerStyleFor(t.id);
    points.push({
      offset: dl,
      label: `${t.icon || '📋'} ${t.name}`,
      bg: style.bg, color: style.color, bold: false,
      taskId: t.id, isFinal: false,
    });
  });
  return points;
}

// 1台あたりの「1本バー」のセグメント配列
function buildBarSegments(car, todayStr) {
  const del = car.deliveryDate;
  if (!del || del < todayStr) return [];

  // v1.0.37: 動的マイルストーン
  const SCHED = _getDeliveryMilestonePoints();

  const pointsByDateAsc = [...SCHED]
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
      isFinal: !!sp.isFinal,
      milestoneOffset: sp.offset,
      taskId: sp.taskId,
      isDone: _isDeliveryTaskDone(car, sp.taskId),
    });
    cursor = dateAddDays(sp.date, 1);
  }

  return segments;
}

// 1か月分のグリッドを描画
function renderOneMonth(year, month, hostEl) {
  const ts = todayStr();

  const labelEl = document.createElement('div');
  labelEl.className = 'cal-section-label';
  if (year === calYear && month === calMonth) {
    labelEl.textContent = `${year}年 ${month + 1}月`;
  } else {
    labelEl.textContent = `${year}年 ${month + 1}月（翌月）`;
    labelEl.classList.add('next');
  }
  hostEl.appendChild(labelEl);

  const wrap = document.createElement('div');
  wrap.className = 'cal-wrap-inner';
  wrap.style.cssText = 'background:#fff;border-radius:var(--r2);overflow:hidden;border:1px solid #ddd';
  hostEl.appendChild(wrap);

  const grid = document.createElement('div');
  grid.className = 'cal-grid';
  wrap.appendChild(grid);

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

    // レーン割り当て（1車種=1レーン）
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
      nameEl.className = 'cal-ev-name';
      nameEl.dataset.carId = car.id;
      nameEl.style.cssText = 'position:absolute;left:4px;right:0;top:0;height:16px;font-size:10px;font-weight:700;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:4px;cursor:pointer';
      nameEl.textContent = car.model;
      nameEl.title = `${car.maker} ${car.model} — クリックで詳細`;
      nameEl.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openDetail(car.id);
      });
      nameRow.appendChild(nameEl);
    });

    // 車両全体のバーの開始/終了日を計算
    const carBarBounds = {};
    Object.keys(carLane).forEach(carId => {
      const segs = allSegments.filter(x => x.car.id === carId);
      if (!segs.length) return;
      const start = segs.reduce((m, x) => x.startDate < m ? x.startDate : m, segs[0].startDate);
      const end = segs.reduce((m, x) => x.endDate > m ? x.endDate : m, segs[0].endDate);
      carBarBounds[carId] = {start, end};
    });

    // バー描画
    weekSegs.forEach(s => {
      const bounds = carBarBounds[s.car.id];
      for (let col = s._s; col <= s._e; col++) {
        const cellEl = cellEls[col];
        if (!cellEl) continue;
        const rows = cellEl.querySelectorAll('.cal-ev-row');
        const row = rows[s._lane * 2 + 1];
        if (!row) continue;

        const cellDate = weekCells[col].ds;
        const bar = document.createElement('div');
        bar.className = 'cal-ev-bar';
        if (s.isDone) bar.classList.add('done');

        const isSegFirst = col === s._s, isSegLast = col === s._e;
        const isBarStart = bounds && cellDate === bounds.start;
        const isBarEnd = bounds && cellDate === bounds.end;
        const weekFirstCol = weekCells.findIndex(c => c !== null);
        const weekLastCol = weekCells.findLastIndex(c => c !== null);
        const isWeekStart = col === weekFirstCol;
        const isWeekEnd = col === weekLastCol;

        bar.style.background = s.bg;
        bar.style.color = s.color;
        bar.style.left = isSegFirst ? (isBarStart || isWeekStart ? '2px' : '0') : '-1px';
        bar.style.right = isSegLast ? (isBarEnd || isWeekEnd ? '2px' : '0') : '-1px';

        const leftRadius = (isBarStart || isWeekStart) && isSegFirst ? '8px' : '0';
        const rightRadius = (isBarEnd || isWeekEnd) && isSegLast ? '8px' : '0';
        bar.style.borderRadius = `${leftRadius} ${rightRadius} ${rightRadius} ${leftRadius}`;

        // ラベル：マイルストーン日（=セグメント末尾）に右寄せで表示
        if (isSegLast) {
          bar.textContent = s.label;
          bar.style.justifyContent = 'flex-end';
          bar.title = `${s.car.maker} ${s.car.model} — ${s.label}${s.isDone ? '（完了）' : ''}`;
        }

        bar.dataset.carId = s.car.id;
        if (s.isFinal) {
          bar.draggable = true;
          bar.style.cursor = 'grab';
          bar.addEventListener('dragstart', () => { dragDeliveryCarId = s.car.id; });
          bar.addEventListener('dragend', () => { dragDeliveryCarId = null; });
        }
        bar.addEventListener('click', (ev) => {
          ev.stopPropagation();
          setCalendarFocus(s.car.id);
        });
        row.appendChild(bar);
      }
    });
  }
}

// カレンダー全体（当月＋翌月）
function renderCalendar() {
  const titleEl = document.getElementById('cal-title');
  if (titleEl) {
    let ny = calYear, nm = calMonth + 1;
    if (nm > 11) { nm = 0; ny++; }
    titleEl.textContent = `${calYear}年 ${calMonth + 1}月 〜 ${ny}年 ${nm + 1}月`;
  }

  const host = document.querySelector('#view-calendar .cal-wrap');
  if (!host) return;
  host.innerHTML = '';
  host.style.background = 'transparent';
  host.style.border = 'none';
  host.style.borderRadius = '0';
  host.style.overflow = 'visible';

  renderOneMonth(calYear, calMonth, host);

  let ny = calYear, nm = calMonth + 1;
  if (nm > 11) { nm = 0; ny++; }
  renderOneMonth(ny, nm, host);

  renderCountdown();
}

// カウントダウンカード（1車種1個）
// v1.0.37: SCHED_POINTS の代わりに動的マイルストーン点を使う＋「本日期限タスク」件数を表示
function renderCountdown() {
  const el = document.getElementById('cal-countdown');
  if (!el) return;
  const ts = todayStr();

  // 動的マイルストーン点（納車日含む）
  const SCHED = (typeof _getDeliveryMilestonePoints === 'function') ? _getDeliveryMilestonePoints() : [];

  const byCarId = {};
  cars.filter(c => c.col === 'delivery' && c.deliveryDate).forEach(car => {
    // 各タスクの期限日との差分から、最も近い未完了マイルストーンを選ぶ
    SCHED.forEach(sp => {
      const date = dateAddDays(car.deliveryDate, -sp.offset);
      const diff = Math.ceil((new Date(date) - new Date(ts)) / 86400000);
      if (diff < 0) return;
      // 完了済みマイルストーンはスキップ
      if (sp.taskId && _isDeliveryTaskDone(car, sp.taskId)) return;
      const cand = {car, label: sp.label, date, diff, bg: sp.bg, color: sp.color, offset: sp.offset, taskId: sp.taskId};
      const cur = byCarId[car.id];
      if (!cur || cand.diff < cur.diff) byCarId[car.id] = cand;
    });

    // 本日期限の未完了タスク件数を集計（このカードに表示する）
    let todayDueCount = 0;
    SCHED.forEach(sp => {
      if (sp.offset === 0) return; // 納車日自体は除外
      const date = dateAddDays(car.deliveryDate, -sp.offset);
      if (date !== ts) return;
      if (sp.taskId && _isDeliveryTaskDone(car, sp.taskId)) return;
      todayDueCount++;
    });
    if (byCarId[car.id]) byCarId[car.id].todayDueCount = todayDueCount;
  });

  const items = Object.values(byCarId).sort((a, b) => a.diff - b.diff);

  if (!items.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:8px 0">納車準備中の車両がありません</div>';
    return;
  }
  el.innerHTML = items.map(it => {
    const todayBadge = it.todayDueCount > 0
      ? `<div class="countdown-today-badge" title="本日期限のタスク">⚠ 本日期限 ${it.todayDueCount}件</div>`
      : '';
    return `
    <div class="countdown-card" onclick="openDetail('${it.car.id}')">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <div style="width:9px;height:9px;border-radius:50%;background:${it.bg};flex-shrink:0"></div>
        <div style="font-size:11px;color:var(--text2)">${it.label}</div>
      </div>
      <div class="countdown-num" style="color:${it.diff === 0 ? 'var(--red)' : it.diff <= 3 ? 'var(--orange)' : it.diff <= 7 ? 'var(--blue)' : 'var(--text)'}">${it.diff === 0 ? '本日！' : it.diff + '日後'}</div>
      <div class="countdown-label">${fmtDate(it.date)}</div>
      <div class="countdown-car">${it.car.model}</div>
      <div class="countdown-type" style="color:var(--text3)">${it.car.maker} · ${it.car.num}</div>
      ${todayBadge}
    </div>`;
  }).join('');
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

// 今月に戻る
function calToday() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();
}

// v1.0.13: バーのハイライト切替（解除はカレンダー空白クリックのみ。Q1=B採用）
function setCalendarFocus(carId) {
  const wrap = document.querySelector('#view-calendar .cal-wrap');
  if (!wrap) return;
  wrap.classList.add('cal-focused');
  wrap.dataset.focusCarId = carId;
  wrap.querySelectorAll('.cal-bar-active, .cal-name-active').forEach(el => {
    el.classList.remove('cal-bar-active', 'cal-name-active');
  });
  wrap.querySelectorAll(`.cal-ev-bar[data-car-id="${carId}"]`).forEach(el => el.classList.add('cal-bar-active'));
  wrap.querySelectorAll(`.cal-ev-name[data-car-id="${carId}"]`).forEach(el => el.classList.add('cal-name-active'));
}

function clearCalendarFocus() {
  const wrap = document.querySelector('#view-calendar .cal-wrap');
  if (!wrap) return;
  wrap.classList.remove('cal-focused');
  wrap.dataset.focusCarId = '';
  wrap.querySelectorAll('.cal-bar-active').forEach(el => el.classList.remove('cal-bar-active'));
}

// カレンダー空白クリックで解除（一度だけ配線）
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('#view-calendar .cal-wrap');
  if (!wrap || !wrap.classList.contains('cal-focused')) return;
  // クリックが wrap の外、または wrap 内でもバー/ラベル以外なら解除
  if (!wrap.contains(e.target)) return;
  if (e.target.closest('.cal-ev-bar')) return;
  if (e.target.closest('.cal-ev-name')) return;
  clearCalendarFocus();
});
