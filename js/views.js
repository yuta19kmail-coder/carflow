// ========================================
// views.js
// その他のビュー（展示、ガント、進捗、全体一覧、在庫）
// エクスポート機能も含む
// ========================================

// 展示ビュー：ボディサイズ別に展示中の車両を列表示
function renderExhibit() {
  const active = cars.filter(c => ['purchase','regen','exhibit'].includes(c.col));
  const cols = document.getElementById('ex-cols');
  cols.innerHTML = '';
  SIZES.forEach(size => {
    const sized = active.filter(c => c.size === size);
    if (!sized.length) return;
    const col = document.createElement('div');
    col.className = 'ex-col';
    col.innerHTML = `<div class="ex-col-hdr">${size} <span style="color:var(--text3)">(${sized.length}台)</span></div><div class="ex-col-body"></div>`;
    cols.appendChild(col);
    const body = col.querySelector('.ex-col-body');
    sized.forEach(car => {
      const inv = daysSince(car.purchaseDate);
      const dc = inv > 30 ? 'var(--red)' : inv > 14 ? 'var(--orange)' : 'var(--green)';
      const card = document.createElement('div');
      card.className = 'ex-card';
      card.innerHTML = `<div style="font-size:12px;font-weight:600;margin-bottom:3px">${car.maker} ${car.model}</div><div style="font-size:10px;color:var(--text3)">${car.num}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span class="pill ${pillMap[car.col]||'pill-gray'}">${COLS.find(c=>c.id===car.col)?.label||car.col}</span><span style="color:${dc};font-size:12px;font-weight:600">${inv}日</span></div>`;
      card.onclick = () => openDetail(car.id);
      body.appendChild(card);
    });
  });
}

// ガントチャートビュー：14日分の納車予定表示
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

// 進捗ビュー：カード一覧で進捗を表示
function renderProgress() {
  const active = cars.filter(c => ['regen','delivery'].includes(c.col));
  const grid = document.getElementById('pv-grid');
  grid.innerHTML = '';
  active.forEach(car => {
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
    grid.appendChild(card);
  });
  if (!active.length) grid.innerHTML = '<div style="color:var(--text3);font-size:13px">再生中・納車準備の車両がありません</div>';
}

// 全体一覧ビュー：テーブル形式で全車両を表示
function renderTable() {
  const tbl = document.getElementById('dtable');
  tbl.innerHTML = `<thead><tr><th>管理番号</th><th>メーカー/車種</th><th>年式</th><th>ボディ</th><th>走行距離</th><th>販売金額</th><th>仕入日</th><th>ステータス</th><th>成約</th><th>納車予定</th><th>進捗</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  cars.forEach(car => {
    const prog = calcProg(car);
    const colLabel = COLS.find(c => c.id === car.col)?.label || car.col;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="font-weight:600;color:var(--blue)">${car.num}</td><td>${car.maker} ${car.model}</td><td>${fmtYearDisplay(parseYearInput(car.year)||car.year)}</td><td>${car.size}</td><td>${Number(car.km||0).toLocaleString()}km</td><td style="color:var(--green);font-weight:600">${fmtPrice(car.price)}</td><td>${fmtDate(car.purchaseDate)}</td><td><span class="pill ${pillMap[car.col]||'pill-gray'}">${colLabel}</span></td><td>${car.contract?'<span class="pill pill-green">成約</span>':'<span class="pill pill-gray">未成約</span>'}</td><td>${car.deliveryDate?fmtDate(car.deliveryDate):'—'}</td><td><div style="display:flex;align-items:center;gap:5px"><div class="pbar" style="width:56px"><div class="pfill" style="width:${prog.pct}%"></div></div><span style="font-size:11px;color:var(--text3)">${prog.pct}%</span></div></td>`;
    tr.onclick = () => openDetail(car.id);
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}

// 在庫日数ビュー：在庫の古い順にカード表示
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

// データをJSONでエクスポート
function exportData() {
  const b = new Blob([JSON.stringify(cars, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'carflow.json';
  a.click();
  showToast('エクスポートしました');
}
