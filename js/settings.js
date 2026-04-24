// ========================================
// settings.js
// 設定画面：アコーディオン、警告エディタ、通知、目標設定、定休日ルール
// ========================================

// アコーディオン開閉
function toggleAcc(head) {
  const card = head.closest('.acc-card');
  const open = card.dataset.accOpen === '1';
  card.dataset.accOpen = open ? '0' : '1';
}

// ========================================
// 在庫警告エディタ
// ========================================
function renderInvWarnEditor() {
  const el = document.getElementById('inv-warn-editor');
  if (!el) return;
  el.innerHTML = appSettings.invWarn.map((t, i) => `
    <div class="warn-row">
      <div class="wr-dot" style="background:${t.color}"></div>
      <div class="wr-label">${t.label}（${t.days}日以上）</div>
      <input type="number" min="1" max="365" value="${t.days}" onchange="onInvWarnDaysChange(${i}, this.value)">
      <div class="toggle${t.on?' on':''}" onclick="toggleInvWarn(${i})"></div>
    </div>
  `).join('');
}
function onInvWarnDaysChange(i, v) {
  const n = Math.max(1, parseInt(v, 10) || 1);
  appSettings.invWarn[i].days = n;
  renderInvWarnEditor();
  renderAll();
  renderDashboard();
}
function toggleInvWarn(i) {
  appSettings.invWarn[i].on = !appSettings.invWarn[i].on;
  renderInvWarnEditor();
  renderAll();
  renderDashboard();
}

// ========================================
// 納車残日数警告エディタ
// ========================================
function renderDelWarnEditor() {
  const el = document.getElementById('del-warn-editor');
  if (!el) return;
  el.innerHTML = appSettings.delWarn.map((t, i) => `
    <div class="warn-row">
      <div class="wr-dot" style="background:${t.color}"></div>
      <div class="wr-label">${t.label}（残${t.days}日以下）</div>
      <input type="number" min="0" max="90" value="${t.days}" onchange="onDelWarnDaysChange(${i}, this.value)">
      <div class="toggle${t.on?' on':''}" onclick="toggleDelWarn(${i})"></div>
    </div>
  `).join('');
}
function onDelWarnDaysChange(i, v) {
  const n = Math.max(0, parseInt(v, 10) || 0);
  appSettings.delWarn[i].days = n;
  renderDelWarnEditor();
  renderAll();
  renderDashboard();
}
function toggleDelWarn(i) {
  appSettings.delWarn[i].on = !appSettings.delWarn[i].on;
  renderDelWarnEditor();
  renderAll();
  renderDashboard();
}

// ========================================
// デフォルト納車日（リードタイム）
// ========================================
function onLeadDaysChange(inp) {
  const n = Math.max(1, parseInt(inp.value, 10) || 14);
  appSettings.deliveryLeadDays = n;
  renderDashboard();
}
function refreshLeadDaysUI() {
  const el = document.getElementById('lead-days-inp');
  if (el) el.value = appSettings.deliveryLeadDays;
}

// ========================================
// 通知設定エディタ
// ========================================
function renderNotifEditor() {
  const el = document.getElementById('notif-editor');
  if (!el) return;
  const rows = [
    {key:'pre',   title:'納車直前アラート'},
    {key:'stock', title:'長期在庫アラート'},
    {key:'stall', title:'作業停滞アラート'},
  ];
  el.innerHTML = rows.map(r => {
    const c = appSettings.notif[r.key];
    return `
      <div class="setting-row" style="flex-wrap:wrap">
        <div style="flex:1;min-width:160px">
          <div style="font-size:13px;font-weight:600">${r.title}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:3px;line-height:1.5">${c.desc.replace(/N/g, `<strong style="color:var(--blue)">${c.days}</strong>`)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <input type="number" min="0" max="365" value="${c.days}" onchange="onNotifDaysChange('${r.key}', this.value)" style="width:64px;padding:5px 8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:12px;text-align:right"><span style="font-size:11px;color:var(--text3)">日</span>
          <div class="toggle${c.on?' on':''}" onclick="toggleNotif('${r.key}')"></div>
        </div>
      </div>
    `;
  }).join('');
}
function onNotifDaysChange(key, v) {
  const n = Math.max(0, parseInt(v, 10) || 0);
  appSettings.notif[key].days = n;
  renderNotifEditor();
  renderDashboard();
  renderActions();
}
function toggleNotif(key) {
  appSettings.notif[key].on = !appSettings.notif[key].on;
  renderNotifEditor();
  renderDashboard();
  renderActions();
}

// ========================================
// 定休日ルール
// ========================================
function renderClosedRulesList() {
  const el = document.getElementById('closed-rules-list');
  if (!el) return;
  const dowLabel = ['日','月','火','水','木','金','土'];
  const rules = closedRules.filter(r => r.pattern !== 'weekly'); // weeklyは曜日ピッカー側で表示
  if (!rules.length) {
    el.innerHTML = '<div style="font-size:11px;color:var(--text3)">追加ルールなし（毎週以外の変則定休日はここに追加）</div>';
    return;
  }
  el.innerHTML = '<div style="font-size:11px;font-weight:600;color:var(--text3);margin-bottom:6px">追加ルール</div>' +
    rules.map(r => {
      let txt = '';
      if (r.pattern === 'biweekly') txt = `隔週 ${dowLabel[r.dow]}曜`;
      if (r.pattern === 'nth') txt = `第${r.nth} ${dowLabel[r.dow]}曜`;
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px">
        <span>${txt}</span>
        <button onclick="removeClosedRule('${r.id}')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:14px">✕</button>
      </div>`;
    }).join('');
}
function removeClosedRule(id) {
  closedRules = closedRules.filter(r => r.id !== id);
  renderClosedRulesList();
  if (typeof renderCalendar === 'function') renderCalendar();
  showToast('ルールを削除しました');
}
function openClosedRuleForm() {
  document.getElementById('cr-pattern').value = 'biweekly';
  document.getElementById('cr-dow').value = '2';
  document.getElementById('cr-nth').value = '1';
  onClosedRulePatternChange();
  document.getElementById('confirm-closed-rule').classList.add('open');
}
function closeClosedRuleForm() {
  document.getElementById('confirm-closed-rule').classList.remove('open');
}
function onClosedRulePatternChange() {
  const p = document.getElementById('cr-pattern').value;
  document.getElementById('cr-nth-row').style.display = p === 'nth' ? 'block' : 'none';
}
function saveClosedRule() {
  const pattern = document.getElementById('cr-pattern').value;
  const dow = parseInt(document.getElementById('cr-dow').value, 10);
  const rule = {id:'r'+Date.now(), pattern, dow};
  if (pattern === 'nth') rule.nth = parseInt(document.getElementById('cr-nth').value, 10);
  if (pattern === 'biweekly') rule.anchorYM = `${new Date().getFullYear()}-01`;
  closedRules.push(rule);
  closeClosedRuleForm();
  renderClosedRulesList();
  if (typeof renderCalendar === 'function') renderCalendar();
  showToast('休業ルールを追加しました');
}

// ========================================
// 目標設定エディタ
// ========================================
function renderGoalsEditor() {
  const el = document.getElementById('goals-editor');
  if (!el) return;
  const g = appSettings.goals;
  const now = new Date();
  // 表示する12ヶ月は「今の会計年度の開始月」から12ヶ月
  const ys = g.yearStart;
  let fyStartYear = now.getFullYear();
  if (now.getMonth()+1 < ys) fyStartYear--;
  const months = [];
  for (let i = 0; i < 12; i++) {
    const m = ((ys - 1 + i) % 12) + 1;
    const y = fyStartYear + Math.floor((ys - 1 + i) / 12);
    months.push({y, m});
  }
  let rows = months.map(({y,m}) => {
    const key = ymKeyFromYM(y, m);
    const cur = g.monthly[key] || {...g.default};
    return `<div class="goal-row">
      <div style="font-weight:600">${y}年${m}月</div>
      <div style="display:flex;gap:4px;align-items:center"><input type="number" min="0" step="10" value="${Math.round((cur.sales||0)/10000)}" onchange="onMonthlyGoalSales('${key}', this.value)"><span style="font-size:11px;color:var(--text3)">万円</span></div>
      <div style="display:flex;gap:4px;align-items:center"><input type="number" min="0" value="${cur.count||0}" onchange="onMonthlyGoalCount('${key}', this.value)"><span style="font-size:11px;color:var(--text3)">台</span></div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div style="font-size:12px;color:var(--text2);margin-bottom:10px">売上計上のタイミング・年度開始月・月別目標をここで設定します</div>

    <div class="setting-row">
      <div><div style="font-size:13px;font-weight:600">売上計上モード</div>
        <div style="font-size:11px;color:var(--text3);margin-top:3px">
          契約主義：売約した月に計上 / 納車主義：納車完了した月に計上
        </div>
      </div>
      <div style="display:flex;gap:0;background:var(--bg3);border:1px solid var(--border);border-radius:7px;overflow:hidden">
        <button onclick="setRevRecog('contract')" style="padding:7px 12px;border:none;background:${g.revRecog==='contract'?'var(--blue)':'transparent'};color:${g.revRecog==='contract'?'#fff':'var(--text2)'};font-size:12px;cursor:pointer;font-weight:600">売約時</button>
        <button onclick="setRevRecog('delivery')" style="padding:7px 12px;border:none;background:${g.revRecog==='delivery'?'var(--blue)':'transparent'};color:${g.revRecog==='delivery'?'#fff':'var(--text2)'};font-size:12px;cursor:pointer;font-weight:600">納車完了時</button>
      </div>
    </div>

    <div class="setting-row">
      <div><div style="font-size:13px;font-weight:600">年度開始月</div><div style="font-size:11px;color:var(--text3);margin-top:3px">1月（暦年）／4月（一般的な決算）／任意月</div></div>
      <select onchange="setYearStart(this.value)" style="padding:6px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px">
        ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `<option value="${m}"${m===ys?' selected':''}>${m}月始まり</option>`).join('')}
      </select>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 4px">
      <div style="font-size:13px;font-weight:600">月別目標</div>
      <button class="btn-sm" onclick="openBulkGoal()">一括入力</button>
    </div>
    <div class="goal-row" style="font-size:10px;color:var(--text3);padding-bottom:5px;border-bottom:2px solid var(--border)">
      <div>年月</div><div style="text-align:center">売上目標</div><div style="text-align:center">台数目標</div>
    </div>
    ${rows}
  `;
}
function setRevRecog(mode) {
  appSettings.goals.revRecog = mode;
  renderGoalsEditor();
  renderDashboard();
  if (typeof renderArchive === 'function') renderArchive();
  showToast(mode === 'contract' ? '売上計上：売約時に変更しました' : '売上計上：納車完了時に変更しました');
}
function setYearStart(v) {
  appSettings.goals.yearStart = parseInt(v, 10) || 1;
  renderGoalsEditor();
  renderDashboard();
}
function onMonthlyGoalSales(key, v) {
  const manYen = Math.max(0, parseFloat(v) || 0);
  const cur = appSettings.goals.monthly[key] || {...appSettings.goals.default};
  cur.sales = Math.round(manYen * 10000);
  appSettings.goals.monthly[key] = cur;
  renderDashboard();
}
function onMonthlyGoalCount(key, v) {
  const n = Math.max(0, parseInt(v, 10) || 0);
  const cur = appSettings.goals.monthly[key] || {...appSettings.goals.default};
  cur.count = n;
  appSettings.goals.monthly[key] = cur;
  renderDashboard();
}
function openBulkGoal() {
  document.getElementById('bulk-sales').value = Math.round((appSettings.goals.default.sales||0)/10000);
  document.getElementById('bulk-count').value = appSettings.goals.default.count || 0;
  document.getElementById('confirm-bulk-goal').classList.add('open');
}
function closeBulkGoal() {
  document.getElementById('confirm-bulk-goal').classList.remove('open');
}
function applyBulkGoal() {
  const sales = Math.round((parseFloat(document.getElementById('bulk-sales').value) || 0) * 10000);
  const count = parseInt(document.getElementById('bulk-count').value, 10) || 0;
  appSettings.goals.default = {sales, count};
  // 今年度12ヶ月に一括適用
  const ys = appSettings.goals.yearStart;
  const now = new Date();
  let fyStartYear = now.getFullYear();
  if (now.getMonth()+1 < ys) fyStartYear--;
  for (let i = 0; i < 12; i++) {
    const m = ((ys - 1 + i) % 12) + 1;
    const y = fyStartYear + Math.floor((ys - 1 + i) / 12);
    appSettings.goals.monthly[ymKeyFromYM(y, m)] = {sales, count};
  }
  closeBulkGoal();
  renderGoalsEditor();
  renderDashboard();
  showToast('月次目標を一括設定しました');
}
