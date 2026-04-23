// ========================================
// dashboard.js
// ダッシュボード、アクションチップ描画
// ========================================

// ダッシュボードパネル全体を描画
function renderDashboard() {
  const total = cars.length;
  const active = cars.filter(c => c.col !== 'done').length;
  const contracted = cars.filter(c => c.contract).length;
  const done = cars.filter(c => c.col === 'done').length;

  document.getElementById('stat-grid').innerHTML = `
    <div class="stat-box"><div class="stat-num">${total}</div><div class="stat-label">総車両数</div></div>
    <div class="stat-box"><div class="stat-num" style="color:var(--orange)">${active}</div><div class="stat-label">管理中</div></div>
    <div class="stat-box"><div class="stat-num" style="color:var(--green)">${contracted}</div><div class="stat-label">成約済み</div></div>
    <div class="stat-box"><div class="stat-num" style="color:var(--text3)">${done}</div><div class="stat-label">納車完了</div></div>`;

  const chips = [];
  cars.forEach(car => {
    if (car.col === 'done') return;
    if (car.contract && car.deliveryDate) {
      const d = daysDiff(car.deliveryDate);
      if (d !== null && d <= 3 && d >= 0) {
        chips.push(`<div class="chip chip-red" onclick="openDetail('${car.id}')"><span class="chip-dot"></span>🚨 ${car.maker} ${car.model} 納車${d===0?'本日':d+'日後'}</div>`);
      }
    }
    if (daysSince(car.purchaseDate) > 30) {
      chips.push(`<div class="chip chip-orange"><span class="chip-dot"></span>📦 ${car.maker} ${car.model} 在庫${daysSince(car.purchaseDate)}日</div>`);
    }
  });

  document.getElementById('dash-actions').innerHTML = chips.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:4px">${chips.join('')}</div>`
    : '<div style="font-size:13px;color:var(--text3);padding:8px 0">要対応アクションなし ✓</div>';

  document.getElementById('dash-status').innerHTML = COLS.map(col => {
    const n = cars.filter(c => c.col === col.id).length;
    const pct = total ? Math.round(n/total*100) : 0;
    return `<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--border)"><div style="width:8px;height:8px;border-radius:50%;background:${col.color};flex-shrink:0"></div><div style="flex:1;font-size:13px">${col.label}</div><div style="width:80px"><div class="pbar"><div class="pfill" style="width:${pct}%;background:${col.color}"></div></div></div><div style="font-size:12px;color:var(--text2);width:28px;text-align:right">${n}台</div></div>`;
  }).join('');
}

// 操作ログパネル描画
function renderLogPanel() {
  document.getElementById('log-badge').style.display = 'none';
  document.getElementById('log-list').innerHTML = globalLogs.length
    ? globalLogs.map(l => `<div class="log-row"><span class="log-time">${l.time}</span><span class="log-user">${l.user}</span><span style="color:var(--text2)">${l.carNum} — ${l.action}</span></div>`).join('')
    : '<div style="font-size:13px;color:var(--text3)">ログなし</div>';
}

// メンバー一覧描画
function renderMembers() {
  document.getElementById('member-list').innerHTML = MEMBERS.map(m =>
    `<div class="member-row"><div class="m-av">${m.init.slice(0,2)}</div><div><div style="font-size:13px;font-weight:500">${m.name}</div><div style="font-size:11px;color:var(--text3)">${m.role}</div></div><span class="pill pill-green" style="margin-left:auto">在席</span></div>`
  ).join('');
}

// 下部アクションチップ描画
function renderActions() {
  const chips = document.getElementById('action-chips');
  chips.innerHTML = '';
  let any = false;
  cars.forEach(car => {
    if (car.col === 'done') return;
    if (car.contract && car.deliveryDate) {
      const d = daysDiff(car.deliveryDate);
      if (d !== null && d <= 3 && d >= 0) {
        const c = document.createElement('div');
        c.className = 'chip chip-red';
        c.innerHTML = `<span class="chip-dot"></span>🚨 ${car.maker} ${car.model} 納車${d===0?'本日':d+'日後'}`;
        c.onclick = () => openDetail(car.id);
        chips.appendChild(c);
        any = true;
      }
    }
    if (daysSince(car.purchaseDate) > 30) {
      const c = document.createElement('div');
      c.className = 'chip chip-orange';
      c.innerHTML = `<span class="chip-dot"></span>📦 ${car.maker} ${car.model} 在庫${daysSince(car.purchaseDate)}日`;
      chips.appendChild(c);
      any = true;
    }
  });
  if (!any) chips.innerHTML = '<div style="font-size:12px;color:var(--text3)">緊急アクションなし ✓</div>';
}
