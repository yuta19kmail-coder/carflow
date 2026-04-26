// ========================================
// views.js
// その他のビュー（展示、ガント、進捗、全体一覧、在庫）
// エクスポート機能も含む
// v0.8.6: 展示ビューを全面リライト（ストック列＋ボディサイズ別、上部一括ソート、空列表示）
// v0.8.7: 進捗ビューを2枠グループ化、全体一覧に並び替えボタン＋在庫日数グループ表示
// ========================================

// ========================================
// 展示ビュー
// ========================================
// ボタンクリック：同じkeyならdir反転、違うkeyならasc/desc初期値で切替
function setExhibitSort(key) {
  if (exhibitSort.key === key) {
    exhibitSort.dir = exhibitSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    exhibitSort.key = key;
    // 金額・年式は降順スタート（高い/新しい順）、在庫日数は降順スタート（古い順=要対応順）
    exhibitSort.dir = 'desc';
  }
  renderExhibit();
}

// ソート関数を返す
function _exhibitSorter() {
  const {key, dir} = exhibitSort;
  const sign = dir === 'asc' ? 1 : -1;
  return (a, b) => {
    let av, bv;
    if (key === 'price') {
      av = Number(a.price) || 0;
      bv = Number(b.price) || 0;
    } else if (key === 'invDays') {
      av = daysSince(a.purchaseDate);
      bv = daysSince(b.purchaseDate);
    } else if (key === 'year') {
      av = parseYearInput(a.year) || 0;
      bv = parseYearInput(b.year) || 0;
    } else {
      return 0;
    }
    if (av < bv) return -1 * sign;
    if (av > bv) return 1 * sign;
    return 0;
  };
}

// 1台のカードを生成
function _makeExhibitCard(car) {
  const inv = daysSince(car.purchaseDate);
  const wt = invWarnTier(inv);
  const invCls = wt ? (wt.days >= 45 ? 'dr' : wt.days >= 30 ? 'dw' : 'dg') : 'dg';
  const km = Number(car.km || 0).toLocaleString();
  const yr = fmtYearDisplay(parseYearInput(car.year) || car.year);
  const card = document.createElement('div');
  card.className = 'ex-card';
  card.innerHTML = `
    <div class="ex-card-thumb">${car.photo ? `<img src="${car.photo}">` : carEmoji(car.size)}</div>
    <div class="ex-card-body">
      <div class="ex-card-title">${car.maker} ${car.model}</div>
      <div class="ex-card-meta">
        <span class="ex-card-meta-item">${car.color || '—'}</span>
        <span class="ex-card-meta-item">${yr}</span>
      </div>
      <div class="ex-card-meta">
        <span class="ex-card-meta-item">${km}km</span>
      </div>
      <div class="ex-card-bottom">
        <span class="ex-card-price">${fmtPrice(car.price)}</span>
        <span class="ex-card-inv ${invCls}">${inv}日</span>
      </div>
    </div>`;
  card.onclick = () => openDetail(car.id);
  return card;
}

// 1列を生成（ヘッダー＋本体）
function _makeExhibitColumn(opts) {
  // opts: {key, name, icon, isStock, count, pct, cars}
  const col = document.createElement('div');
  col.className = 'ex-col' + (opts.isStock ? ' stock' : '');
  const pctHtml = opts.isStock ? '' : `<span class="ex-col-pct">${opts.pct.toFixed(1)}%</span>`;
  col.innerHTML = `
    <div class="ex-col-hdr">
      <div class="ex-col-name"><span class="ex-col-icon">${opts.icon}</span>${opts.name}</div>
      <div class="ex-col-stats">
        <span class="ex-col-count">${opts.count}</span>
        <span class="ex-col-count-unit">台</span>
        ${pctHtml}
      </div>
    </div>
    <div class="ex-col-body"></div>`;
  const body = col.querySelector('.ex-col-body');
  if (opts.cars.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'ex-col-empty';
    empty.textContent = opts.isStock ? '仕入れ・再生中の車両はありません' : 'この区分の在庫はありません';
    body.appendChild(empty);
  } else {
    opts.cars.forEach(c => body.appendChild(_makeExhibitCard(c)));
  }
  return col;
}

// ソートボタンの状態を更新
function _refreshExhibitSortBtns() {
  document.querySelectorAll('#view-exhibit .ex-sort-btn').forEach(btn => {
    const k = btn.dataset.key;
    btn.classList.remove('active');
    const ar = btn.querySelector('.sort-arrow');
    if (ar) ar.remove();
    if (k === exhibitSort.key) {
      btn.classList.add('active');
      const arrow = document.createElement('span');
      arrow.className = 'sort-arrow';
      arrow.textContent = exhibitSort.dir === 'asc' ? '▲' : '▼';
      btn.appendChild(arrow);
    }
  });
}

// 展示ビュー本体
function renderExhibit() {
  const cols = document.getElementById('ex-cols');
  if (!cols) return;
  cols.innerHTML = '';

  // ストック車両（仕入れ＋再生中）
  const stockCars = cars.filter(c => c.col === 'purchase' || c.col === 'regen');
  // 展示中（ボディサイズ別）
  const exhibitCars = cars.filter(c => c.col === 'exhibit');

  const sorter = _exhibitSorter();
  stockCars.sort(sorter);
  const exhibitTotal = exhibitCars.length;

  const stockCol = _makeExhibitColumn({
    key: 'stock',
    name: 'ストック車両',
    icon: '📦',
    isStock: true,
    count: stockCars.length,
    pct: 0,
    cars: stockCars,
  });
  cols.appendChild(stockCol);

  SIZES.forEach(size => {
    const sized = exhibitCars.filter(c => c.size === size).sort(sorter);
    const pct = exhibitTotal > 0 ? (sized.length / exhibitTotal * 100) : 0;
    const col = _makeExhibitColumn({
      key: size,
      name: size,
      icon: carEmoji(size),
      isStock: false,
      count: sized.length,
      pct,
      cars: sized,
    });
    cols.appendChild(col);
  });

  const totalLabel = document.getElementById('ex-total-label');
  if (totalLabel) {
    totalLabel.textContent = `ストック ${stockCars.length}台 / 展示中 ${exhibitTotal}台`;
  }

  _refreshExhibitSortBtns();
}

// ========================================
// ガントチャートビュー：14日分の納車予定表示
// ========================================
function renderGantt() {
  const contracted = cars.filter(c => c.contract && c.deliveryDate);
  const days = 14;
  const now = new Date();
  now.setHours(0,0,0,0);
  let ths = '<th>車両</th><th>ステータス</th><th>進捗</th>';
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    ths += `<th style="min-width:32px;text-align:center;font-size:10px">${d.getMonth()+1}/${d.getDate()}</th>`;
  }
  let rows = '';
  contracted.forEach(car => {
    const prog = calcProg(car);
    const colLabel = COLS.find(c => c.id === car.col)?.label || car.col;
    let cells = '';
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      cells += `<td style="text-align:center;padding:3px">${car.deliveryDate === d.toISOString().split('T')[0] ? '🚗' : ''}</td>`;
    }
    rows += `<tr onclick="openDetail('${car.id}')" style="cursor:pointer"><td><div style="font-size:12px;font-weight:600">${car.maker} ${car.model}</div><div style="font-size:10px;color:var(--text3)">${car.num}</div></td><td><span class="pill ${pillMap[car.col]||'pill-gray'}">${colLabel}</span></td><td><div class="pbar" style="width:72px"><div class="pfill" style="width:${prog.pct}%"></div></div><div style="font-size:10px;color:var(--text3)">${prog.pct}%</div></td>${cells}</tr>`;
  });
  document.getElementById('gtable').innerHTML = `<thead><tr>${ths}</tr></thead><tbody>${rows}</tbody>`;
}

// ========================================
// 進捗ビュー：v0.8.7 で2枠グループ化（販売前／納車準備）
// ========================================
function _makeProgressCard(car) {
  const isD = car.col === 'delivery';
  const tasks = isD ? DELIVERY_TASKS : REGEN_TASKS;
  const prog = calcProg(car);
  const colLabel = COLS.find(c => c.id === car.col)?.label || car.col;
  const card = document.createElement('div');
  card.className = 'pv-card';
  const taskRows = tasks.map(t => {
    const p = calcSingleProg(car, t.id, tasks);
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)"><span style="font-size:14px">${t.icon}</span><div style="flex:1;font-size:12px">${t.name}</div><div class="pbar" style="width:52px"><div class="pfill" style="width:${p.pct}%"></div></div><div style="font-size:11px;color:var(--text3);width:30px;text-align:right">${p.pct}%</div></div>`;
  }).join('');
  card.innerHTML = `<div class="pv-head"><div class="pv-thumb">${car.photo?`<img src="${car.photo}">`:carEmoji(car.size)}</div><div style="flex:1"><div style="font-size:13px;font-weight:600">${car.maker} ${car.model}</div><div style="font-size:11px;color:var(--text2)">${car.num} · ${fmtYearDisplay(parseYearInput(car.year)||car.year)}</div></div><span class="pill ${pillMap[car.col]||'pill-gray'}">${colLabel}</span></div><div class="pv-body">${taskRows}<div style="margin-top:9px;display:flex;justify-content:space-between;font-size:12px;color:var(--text2)"><span>全体</span><span style="font-weight:700;color:var(--green)">${prog.pct}%</span></div><div class="pbar" style="height:6px;margin-top:5px"><div class="pfill" style="width:${prog.pct}%"></div></div></div><div class="pv-btn" onclick="openDetail('${car.id}')">▶ カードを開く</div>`;
  return card;
}

function renderProgress() {
  const wrap = document.getElementById('pv-grid');
  if (!wrap) return;
  wrap.innerHTML = '';

  // 販売前 ＝ 仕入れ／再生中／展示中（売約前すべて）
  const beforeSale = cars.filter(c => ['purchase','regen','exhibit'].includes(c.col));
  // 納車準備
  const inDelivery = cars.filter(c => c.col === 'delivery');

  const groups = [
    {id:'before', label:'🏷️ 販売前（売約前）', sub:'仕入れ・再生中・展示中', cars: beforeSale, emptyMsg:'販売前の車両はありません'},
    {id:'delivery', label:'📦 納車準備', sub:'売約済み・納車に向けて準備中', cars: inDelivery, emptyMsg:'納車準備中の車両はありません'},
  ];

  groups.forEach(g => {
    const sec = document.createElement('div');
    sec.className = 'pv-group';
    sec.innerHTML = `
      <div class="pv-group-head">
        <div class="pv-group-title">${g.label} <span class="pv-group-count">${g.cars.length}台</span></div>
        <div class="pv-group-sub">${g.sub}</div>
      </div>
      <div class="pv-group-body"></div>`;
    const body = sec.querySelector('.pv-group-body');
    if (!g.cars.length) {
      const empty = document.createElement('div');
      empty.className = 'pv-group-empty';
      empty.textContent = g.emptyMsg;
      body.appendChild(empty);
    } else {
      g.cars.forEach(car => body.appendChild(_makeProgressCard(car)));
    }
    wrap.appendChild(sec);
  });
}

// ========================================
// 全体一覧ビュー：v0.8.7 並び替え＋在庫日数グループ
// ========================================

// 並び替えボタンクリック：同keyならdir反転、違うkeyならkey切替
function setTableSort(key) {
  if (tableSort.key === key) {
    tableSort.dir = tableSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    tableSort.key = key;
    // 仕入れ日・納車予定日は新しい順から、進捗％・管理番号は若い順から、ステータスはCOLS順
    tableSort.dir = (key === 'num' || key === 'status' || key === 'progress') ? 'asc' : 'desc';
  }
  renderTable();
}

function _tableSorter() {
  const {key, dir} = tableSort;
  const sign = dir === 'asc' ? 1 : -1;
  const colOrder = {};
  COLS.forEach((c, i) => { colOrder[c.id] = i; });
  return (a, b) => {
    let av, bv;
    if (key === 'num') {
      av = (a.num || '').toString();
      bv = (b.num || '').toString();
      return av.localeCompare(bv) * sign;
    } else if (key === 'purchaseDate') {
      av = a.purchaseDate || '';
      bv = b.purchaseDate || '';
      return av.localeCompare(bv) * sign;
    } else if (key === 'status') {
      av = colOrder[a.col] != null ? colOrder[a.col] : 99;
      bv = colOrder[b.col] != null ? colOrder[b.col] : 99;
    } else if (key === 'progress') {
      av = calcProg(a).pct;
      bv = calcProg(b).pct;
    } else if (key === 'deliveryDate') {
      av = a.deliveryDate || '';
      bv = b.deliveryDate || '';
      return av.localeCompare(bv) * sign;
    } else {
      return 0;
    }
    if (av < bv) return -1 * sign;
    if (av > bv) return 1 * sign;
    return 0;
  };
}

// 在庫日数からグループキーを決める（OK/注意/要対応/危険）
// 設定の invWarn を参照。on の閾値しか考慮しない
function _invGroupKey(days) {
  const tiers = (appSettings?.invWarn || []).filter(t => t.on).slice().sort((a,b) => b.days - a.days);
  for (const t of tiers) {
    if (days >= t.days) {
      // ラベルから対応：注意/要対応/危険
      return t.label || '警告';
    }
  }
  return 'OK';
}

// グループ表示順とスタイル
const _INV_GROUP_DEFS = [
  {key:'OK',     icon:'✅', cls:'g-ok',     desc:'まだ余裕あり'},
  {key:'注意',   icon:'⚠️', cls:'g-warn',   desc:'そろそろ動きを意識'},
  {key:'要対応', icon:'🔶', cls:'g-action', desc:'販促・値下げ等の検討時期'},
  {key:'危険',   icon:'🔴', cls:'g-danger', desc:'要早期対応'},
];

function _renderTableSortBar() {
  const bar = document.getElementById('table-toolbar');
  if (!bar) return;
  bar.innerHTML = '';
  const items = [
    {key:'num', label:'管理番号', icon:'🔢'},
    {key:'purchaseDate', label:'仕入れ日', icon:'📅'},
    {key:'status', label:'ステータス', icon:'🏷️'},
    {key:'progress', label:'進捗％', icon:'⚡'},
    {key:'deliveryDate', label:'納車予定日', icon:'🚗'},
  ];
  bar.innerHTML = `
    <div class="ex-toolbar-label">並び替え</div>
    ${items.map(it => `<button class="ex-sort-btn" data-key="${it.key}" onclick="setTableSort('${it.key}')">${it.icon} ${it.label}</button>`).join('')}
    <div class="ex-toolbar-spacer"></div>
    <div class="ex-total-label" id="table-total-label"></div>`;
  // active 状態
  bar.querySelectorAll('.ex-sort-btn').forEach(btn => {
    if (btn.dataset.key === tableSort.key) {
      btn.classList.add('active');
      const arrow = document.createElement('span');
      arrow.className = 'sort-arrow';
      arrow.textContent = tableSort.dir === 'asc' ? '▲' : '▼';
      btn.appendChild(arrow);
    }
  });
}

function _makeTableHeadHtml() {
  return `<thead><tr>
    <th>管理番号</th><th>メーカー/車種</th><th>年式</th><th>ボディ</th>
    <th>走行距離</th><th>販売金額</th><th>仕入日</th><th>在庫日数</th>
    <th>ステータス</th><th>成約</th><th>納車予定</th><th>進捗</th>
  </tr></thead>`;
}

function _makeTableRowHtml(car) {
  const prog = calcProg(car);
  const colLabel = COLS.find(c => c.id === car.col)?.label || car.col;
  const inv = car.purchaseDate ? daysSince(car.purchaseDate) : '—';
  const wt = car.purchaseDate ? invWarnTier(daysSince(car.purchaseDate)) : null;
  const invCls = wt ? (wt.days >= 45 ? 'dr' : wt.days >= 30 ? 'dw' : 'dg') : 'dg';
  const invHtml = car.purchaseDate
    ? `<span class="ex-card-inv ${invCls}" style="font-size:11px">${inv}日</span>`
    : '—';
  return `<tr onclick="openDetail('${car.id}')" style="cursor:pointer">
    <td style="font-weight:600;color:var(--blue)">${car.num}</td>
    <td>${car.maker} ${car.model}</td>
    <td>${fmtYearDisplay(parseYearInput(car.year)||car.year)}</td>
    <td>${car.size||'—'}</td>
    <td>${Number(car.km||0).toLocaleString()}km</td>
    <td style="color:var(--green);font-weight:600">${fmtPrice(car.price)}</td>
    <td>${car.purchaseDate?fmtDate(car.purchaseDate):'—'}</td>
    <td>${invHtml}</td>
    <td><span class="pill ${pillMap[car.col]||'pill-gray'}">${colLabel}</span></td>
    <td>${car.contract?'<span class="pill pill-green">成約</span>':'<span class="pill pill-gray">未成約</span>'}</td>
    <td>${car.deliveryDate?fmtDate(car.deliveryDate):'—'}</td>
    <td><div style="display:flex;align-items:center;gap:5px"><div class="pbar" style="width:56px"><div class="pfill" style="width:${prog.pct}%"></div></div><span style="font-size:11px;color:var(--text3)">${prog.pct}%</span></div></td>
  </tr>`;
}

function renderTable() {
  _renderTableSortBar();

  const wrap = document.getElementById('table-body-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';

  // 在庫日数グループ分け対象は「納車完了以外」
  // 納車完了は 1グループにまとめて末尾
  const sorter = _tableSorter();
  const activeCars = cars.filter(c => c.col !== 'done').slice().sort(sorter);
  const doneCars = cars.filter(c => c.col === 'done').slice().sort(sorter);

  // 各車に group key を付与
  const buckets = {};
  _INV_GROUP_DEFS.forEach(g => { buckets[g.key] = []; });
  activeCars.forEach(c => {
    const days = c.purchaseDate ? daysSince(c.purchaseDate) : 0;
    const k = _invGroupKey(days);
    if (!buckets[k]) buckets[k] = [];
    buckets[k].push(c);
  });

  // グループごとに描画
  _INV_GROUP_DEFS.forEach(g => {
    const list = buckets[g.key];
    if (!list || !list.length) return;
    const sec = document.createElement('div');
    sec.className = 'tbl-group ' + g.cls;
    sec.innerHTML = `
      <div class="tbl-group-head">
        <span class="tbl-group-icon">${g.icon}</span>
        <span class="tbl-group-name">${g.key}</span>
        <span class="tbl-group-desc">${g.desc}</span>
        <span class="tbl-group-count">${list.length}台</span>
      </div>
      <div style="overflow-x:auto"><table class="dtable">${_makeTableHeadHtml()}<tbody>${list.map(_makeTableRowHtml).join('')}</tbody></table></div>`;
    wrap.appendChild(sec);
  });

  // 納車完了グループ
  if (doneCars.length) {
    const sec = document.createElement('div');
    sec.className = 'tbl-group g-done';
    sec.innerHTML = `
      <div class="tbl-group-head">
        <span class="tbl-group-icon">🚗</span>
        <span class="tbl-group-name">納車完了</span>
        <span class="tbl-group-desc">月次集計締めまで残ります</span>
        <span class="tbl-group-count">${doneCars.length}台</span>
      </div>
      <div style="overflow-x:auto"><table class="dtable">${_makeTableHeadHtml()}<tbody>${doneCars.map(_makeTableRowHtml).join('')}</tbody></table></div>`;
    wrap.appendChild(sec);
  }

  // 合計
  const total = activeCars.length + doneCars.length;
  const totalEl = document.getElementById('table-total-label');
  if (totalEl) totalEl.textContent = `合計 ${total}台`;
}

// ========================================
// 在庫日数ビュー
// ========================================
function renderInventory() {
  const sorted = cars.filter(c => c.col !== 'done').sort((a,b) => daysSince(b.purchaseDate) - daysSince(a.purchaseDate));
  const grid = document.getElementById('inv-grid');
  grid.innerHTML = '';
  sorted.forEach(car => {
    const inv = daysSince(car.purchaseDate);
    const dc  = inv > 30 ? '#ef4444' : inv > 14 ? '#f59e0b' : '#1db97a';
    const dbg = inv > 30 ? 'rgba(239,68,68,.2)' : inv > 14 ? 'rgba(245,158,11,.2)' : 'rgba(29,185,122,.2)';
    const card = document.createElement('div');
    card.className = 'inv-card';
    card.innerHTML = `<div class="inv-thumb">${car.photo?`<img src="${car.photo}">`:carEmoji(car.size)}<div class="inv-badge" style="background:${dbg};color:${dc}">${inv}日</div></div><div class="inv-body"><div class="inv-name">${car.maker} ${car.model}</div><div style="font-size:10px;color:var(--text3);margin-top:2px">${car.num}</div><span class="pill ${pillMap[car.col]||'pill-gray'}" style="margin-top:5px;display:inline-block">${COLS.find(c=>c.id===car.col)?.label||car.col}</span></div>`;
    card.onclick = () => openDetail(car.id);
    grid.appendChild(card);
  });
}

// ========================================
// データをJSONでエクスポート
// ========================================
function exportData() {
  const b = new Blob([JSON.stringify(cars, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'carflow.json';
  a.click();
  showToast('エクスポートしました');
}
