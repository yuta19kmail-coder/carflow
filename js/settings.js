// ========================================
// settings.js
// 設定画面：アコーディオン、警告エディタ、通知、目標設定、定休日ルール
// ========================================

// アコーディオン開閉（属性ベースで堅牢に）
function toggleAcc(head) {
  const card = head.closest('.acc-card');
  if (!card) return;
  const cur = card.getAttribute('data-acc-open');
  card.setAttribute('data-acc-open', cur === '1' ? '0' : '1');
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
  // 納車直前は「納車残日数の警告」、長期在庫は「在庫日数の警告」で代替できるため
  // 通知では作業停滞アラートのみを管理する
  const rows = [
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
}

// ========================================
// v1.0.30: 設定パネル サイドバー型ナビ切替
// 左の項目をクリックすると、対応する section.active を切り替える
// ========================================
function selectSettingsSection(sectionId) {
  // 全 nav-item の active 解除
  document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
  // 全 section の active 解除
  document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
  // 該当を active 化
  const navBtn = document.querySelector(`.settings-nav-item[data-section="${sectionId}"]`);
  if (navBtn) navBtn.classList.add('active');
  const section = document.querySelector(`.settings-section[data-section="${sectionId}"]`);
  if (section) section.classList.add('active');
  // 右コンテンツのスクロール位置をトップに戻す
  const content = document.querySelector('.settings-content');
  if (content) content.scrollTop = 0;
}

// ナビボタンのクリックハンドラを設定（DOMContentLoaded 後 / または開く時）
function bindSettingsNav() {
  document.querySelectorAll('.settings-nav-item').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', () => {
      const sec = btn.getAttribute('data-section');
      if (sec) selectSettingsSection(sec);
    });
  });
}

// ページロード後に1回バインド
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindSettingsNav);
} else {
  bindSettingsNav();
}

// ========================================
// v1.0.32〜33: タスク ON/OFF ＋ 並び替え ＋ 期日 ＋ カスタム追加 UI
// ========================================
function renderTasksEditor() {
  const root = document.getElementById('tasks-editor');
  if (!root) return;

  const phases = [
    { key: 'regen',    label: '🔧 再生フェーズ', deadlineHint: '仕入れから', deadlineSuffix: '日以内' },
    { key: 'delivery', label: '📦 納車フェーズ', deadlineHint: '納車まで',   deadlineSuffix: '日前' },
  ];

  let html = '';
  phases.forEach(ph => {
    const tasks = (typeof getAllTasksForUI === 'function') ? getAllTasksForUI(ph.key) : [];
    html += `<div class="task-edit-phase">
      <div class="task-edit-phase-head">${ph.label}</div>
      <div class="task-edit-phase-deadline-hint">期日：<strong>${ph.deadlineHint} N ${ph.deadlineSuffix}</strong>（空欄なら期限なし）</div>`;
    if (!tasks.length) {
      html += '<div class="task-edit-empty">タスクが定義されていません</div>';
    } else {
      tasks.forEach((t, idx) => {
        const customCls = t.builtin ? '' : ' task-edit-custom';
        const isFirst = idx === 0;
        const isLast  = idx === tasks.length - 1;
        const dlVal   = t.deadline != null ? t.deadline : '';
        html += `
          <div class="task-edit-row${customCls}" data-task-id="${escapeHtml(t.id)}" data-phase="${ph.key}">
            <div class="task-edit-order-btns">
              <button class="task-edit-order-btn" onclick="moveTaskUp('${escapeHtml(t.id)}', '${ph.key}')" ${isFirst ? 'disabled' : ''} title="上へ">▲</button>
              <button class="task-edit-order-btn" onclick="moveTaskDown('${escapeHtml(t.id)}', '${ph.key}')" ${isLast ? 'disabled' : ''} title="下へ">▼</button>
            </div>
            <span class="task-edit-icon">${t.icon || '📋'}</span>
            <span class="task-edit-name">${escapeHtml(t.name)}</span>
            ${t.builtin ? '<span class="task-edit-tag">組込</span>' : '<span class="task-edit-tag custom">追加</span>'}
            <div class="task-edit-deadline">
              <input type="number" min="1" max="365" value="${dlVal}"
                     placeholder="—"
                     onchange="setTaskDeadline('${escapeHtml(t.id)}', '${ph.key}', this.value)"
                     class="task-edit-deadline-inp"
                     title="${ph.deadlineHint} N ${ph.deadlineSuffix}">
              <span class="task-edit-deadline-suffix">${ph.deadlineSuffix.replace(/日.*/,'日')}</span>
            </div>
            <label class="task-edit-toggle">
              <input type="checkbox" ${t.enabled ? 'checked' : ''}
                     onchange="toggleTaskEnabled('${escapeHtml(t.id)}', '${ph.key}', this.checked)">
              <span class="task-edit-toggle-slider"></span>
            </label>
            ${t.builtin ? '' : `<button class="task-edit-del" onclick="deleteCustomTask('${escapeHtml(t.id)}')" title="削除">✕</button>`}
          </div>`;
      });
    }
    html += `</div>`;
  });

  // 追加フォーム
  html += `
    <div class="task-edit-add">
      <div class="task-edit-add-title">＋ チェック型タスクを追加</div>
      <div class="task-edit-add-row">
        <input type="text" id="new-task-icon" class="settings-input task-edit-add-icon" placeholder="🔧" maxlength="4">
        <input type="text" id="new-task-name" class="settings-input task-edit-add-name" placeholder="タスク名（例：鈑金見積）" maxlength="20">
      </div>
      <div class="task-edit-add-phase-row">
        <span class="task-edit-add-phase-label">適用フェーズ：</span>
        <label class="task-edit-add-phase">
          <input type="checkbox" id="new-task-phase-regen" checked> 再生
        </label>
        <label class="task-edit-add-phase">
          <input type="checkbox" id="new-task-phase-delivery"> 納車
        </label>
        <button class="btn-sm" onclick="addCustomTask()" style="margin-left:auto">追加する</button>
      </div>
    </div>`;

  root.innerHTML = html;
}

// 組み込み・カスタム両方共通の ON/OFF 切替
function toggleTaskEnabled(taskId, phase, enabled) {
  if (!appTaskEnabled[phase]) appTaskEnabled[phase] = {};
  appTaskEnabled[phase][taskId] = !!enabled;
  if (typeof _refreshSizesDependentViews === 'function') _refreshSizesDependentViews();
  showToast(enabled ? 'タスクを有効化しました' : 'タスクを無効化しました');
}

// v1.0.33: 並び替え
function moveTaskUp(taskId, phase) {
  if (typeof moveTaskOrder === 'function') moveTaskOrder(taskId, phase, -1);
  renderTasksEditor();
  if (typeof _refreshSizesDependentViews === 'function') _refreshSizesDependentViews();
}
function moveTaskDown(taskId, phase) {
  if (typeof moveTaskOrder === 'function') moveTaskOrder(taskId, phase, 1);
  renderTasksEditor();
  if (typeof _refreshSizesDependentViews === 'function') _refreshSizesDependentViews();
}

// v1.0.33: 期日設定
function setTaskDeadline(taskId, phase, value) {
  if (!appTaskDeadline[phase]) appTaskDeadline[phase] = {};
  const v = (value == null || value === '') ? null : Number(value);
  if (v == null || !Number.isFinite(v) || v <= 0) {
    delete appTaskDeadline[phase][taskId];
  } else {
    appTaskDeadline[phase][taskId] = v;
  }
  if (typeof _refreshSizesDependentViews === 'function') _refreshSizesDependentViews();
}

// カスタムタスク追加
function addCustomTask() {
  const icon = (document.getElementById('new-task-icon').value || '').trim() || '📋';
  const name = (document.getElementById('new-task-name').value || '').trim();
  const useRegen    = document.getElementById('new-task-phase-regen').checked;
  const useDelivery = document.getElementById('new-task-phase-delivery').checked;
  if (!name) { showToast('タスク名を入力してください'); return; }
  if (!useRegen && !useDelivery) { showToast('適用フェーズを選んでください'); return; }
  const id = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const phases = [];
  if (useRegen) phases.push('regen');
  if (useDelivery) phases.push('delivery');
  appCustomTasks.push({ id, name, icon, phases });
  document.getElementById('new-task-icon').value = '';
  document.getElementById('new-task-name').value = '';
  cars.forEach(c => {
    if (useRegen    && c.regenTasks    && !(id in c.regenTasks))    c.regenTasks[id] = false;
    if (useDelivery && c.deliveryTasks && !(id in c.deliveryTasks)) c.deliveryTasks[id] = false;
  });
  renderTasksEditor();
  if (typeof _refreshSizesDependentViews === 'function') _refreshSizesDependentViews();
  showToast(`「${name}」を追加しました`);
}

// カスタムタスク削除
function deleteCustomTask(taskId) {
  const t = appCustomTasks.find(x => x.id === taskId);
  if (!t) return;
  if (!confirm(`「${t.name}」を削除しますか？\n（既に進捗が入っていても消えます）`)) return;
  appCustomTasks = appCustomTasks.filter(x => x.id !== taskId);
  cars.forEach(c => {
    if (c.regenTasks)    delete c.regenTasks[taskId];
    if (c.deliveryTasks) delete c.deliveryTasks[taskId];
  });
  if (appTaskEnabled.regen)    delete appTaskEnabled.regen[taskId];
  if (appTaskEnabled.delivery) delete appTaskEnabled.delivery[taskId];
  if (appTaskDeadline.regen)    delete appTaskDeadline.regen[taskId];
  if (appTaskDeadline.delivery) delete appTaskDeadline.delivery[taskId];
  // 並び順からも除外
  if (appTaskOrder.regen)    appTaskOrder.regen    = appTaskOrder.regen.filter(id => id !== taskId);
  if (appTaskOrder.delivery) appTaskOrder.delivery = appTaskOrder.delivery.filter(id => id !== taskId);
  renderTasksEditor();
  if (typeof _refreshSizesDependentViews === 'function') _refreshSizesDependentViews();
  showToast('タスクを削除しました');
}

// アプリ起動時の復元（appSettings 読込後に呼ぶ想定）
function restoreTasksFromSettings() {
  if (typeof appSettings === 'undefined') return;
  if (appSettings.taskEnabled) {
    appTaskEnabled = {
      regen:    appSettings.taskEnabled.regen    || {},
      delivery: appSettings.taskEnabled.delivery || {},
    };
  }
  if (Array.isArray(appSettings.customTasks)) {
    appCustomTasks = appSettings.customTasks.slice();
  }
  if (appSettings.taskOrder) {
    appTaskOrder = {
      regen:    appSettings.taskOrder.regen    || [],
      delivery: appSettings.taskOrder.delivery || [],
    };
  }
  if (appSettings.taskDeadline) {
    appTaskDeadline = {
      regen:    appSettings.taskDeadline.regen    || {},
      delivery: appSettings.taskDeadline.delivery || {},
    };
  }
}
