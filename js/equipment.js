// ========================================
// equipment.js (v1.0.20〜)
// 装備品チェックページ＋装備詳細閲覧ビュー
// マスター: equipment-def.js
// 保存先: car.equipment = { [itemId]: 値, _completed: bool, _updatedAt: ISO }
// ========================================

let _eqActiveCarId = null;
let _eqSavedHintTimer = null;

// ====================================================================
// データアクセス
// ====================================================================

// 車両の装備品データを取得（無ければ初期化）
function getCarEquipment(car) {
  if (!car) return {};
  if (!car.equipment) car.equipment = {};
  return car.equipment;
}

// 値を保存（自動保存トリガー）
function setEquipmentValue(carId, itemId, value) {
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  const eq = getCarEquipment(car);
  if (value == null || value === '') {
    delete eq[itemId];
  } else {
    eq[itemId] = value;
  }
  eq._updatedAt = new Date().toISOString();
  // 値を1つでも変えたら "完了" 状態は解除（再度確認してもらう）
  if (eq._completed) eq._completed = false;
  _showEqSavedHint();
  _updateEqProgressBadge();
}

// 全項目数と入力済み数（_completed と _updatedAt を除外）
function calcEquipmentProgress(car) {
  if (!car || !window.EQUIPMENT_CATEGORIES) return { total: 0, filled: 0, pct: 0 };
  let total = 0, filled = 0;
  const eq = getCarEquipment(car);
  EQUIPMENT_CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
      total++;
      const v = eq[item.id];
      if (v != null && v !== '') filled++;
    });
  });
  const pct = total ? Math.round(filled / total * 100) : 0;
  return { total, filled, pct };
}

// マスターから item を取得（古いID参照用）
function findEqItem(itemId) {
  if (!window.EQUIPMENT_CATEGORIES) return null;
  for (const cat of EQUIPMENT_CATEGORIES) {
    const it = cat.items.find(i => i.id === itemId);
    if (it) return { item: it, category: cat };
  }
  return null;
}

// ====================================================================
// チェックページ：開く / 閉じる
// ====================================================================

function openEquipmentCheck(carId) {
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  _eqActiveCarId = carId;
  _renderEquipmentPage(car);
  document.getElementById('eq-page').classList.add('open');
  // body のスクロールを抑制
  document.body.style.overflow = 'hidden';
}

function closeEquipmentCheck() {
  document.getElementById('eq-page').classList.remove('open');
  document.body.style.overflow = '';

  // v1.0.24: 確実に「詳細モーダル」と「カンバン等の全ビュー」を再描画
  // - detail-body は modal-detail が open でなくても DOM に存在するので、
  //   activeDetailCarId が _eqActiveCarId と一致していれば再描画して次回表示時に最新化
  // - renderAll() でカンバン上のカード（進捗ドット・％）も更新
  const targetCarId = _eqActiveCarId;
  _eqActiveCarId = null;

  if (targetCarId) {
    const car = cars.find(c => c.id === targetCarId);
    // 詳細モーダル側の再描画（activeDetailCarId と一致する時のみ）
    if (car && typeof activeDetailCarId !== 'undefined' && activeDetailCarId === targetCarId) {
      const dbody = document.getElementById('detail-body');
      if (dbody && typeof renderDetailBody === 'function') {
        try { renderDetailBody(car); } catch(e) {}
      }
    }
  }
  // 全ビュー再描画（カンバン・進捗・ガント等）
  if (typeof renderAll === 'function') renderAll();
}

// 「完了する」ボタン
function markEquipmentComplete() {
  if (!_eqActiveCarId) return;
  const car = cars.find(c => c.id === _eqActiveCarId);
  if (!car) return;
  const eq = getCarEquipment(car);
  eq._completed = true;
  eq._updatedAt = new Date().toISOString();
  if (typeof addLog === 'function') addLog(_eqActiveCarId, '装備品チェック完了');
  if (typeof showToast === 'function') showToast('✓ 装備品チェックを完了にしました');
  closeEquipmentCheck();
}

// ====================================================================
// チェックページ：レンダリング
// ====================================================================

function _renderEquipmentPage(car) {
  // タイトル & 車両ヘッダー
  document.getElementById('eq-title').textContent = '装備品チェック';
  const thumb = document.getElementById('eq-vehicle-thumb');
  if (thumb) {
    if (car.photo) {
      thumb.style.backgroundImage = `url("${car.photo}")`;
      thumb.textContent = '';
    } else {
      thumb.style.backgroundImage = '';
      thumb.textContent = (typeof carEmoji === 'function') ? carEmoji(car.size) : '🚗';
    }
  }
  document.getElementById('eq-vehicle-name').textContent = `${car.maker || ''} ${car.model || ''}`.trim();
  const ymd = [];
  if (car.year)  ymd.push((typeof fmtYearDisplay === 'function') ? fmtYearDisplay((typeof parseYearInput==='function'?parseYearInput(car.year):null) || car.year) : car.year);
  if (car.color) ymd.push(car.color);
  if (car.km != null) ymd.push(`${Number(car.km).toLocaleString()}km`);
  document.getElementById('eq-vehicle-sub').textContent = ymd.join(' ・ ');

  _updateEqProgressBadge();

  // カテゴリ本体
  const body = document.getElementById('eq-body-inner');
  let html = '';
  EQUIPMENT_CATEGORIES.forEach((cat, idx) => {
    const filled = _countCatFilled(car, cat);
    const total = cat.items.length;
    const isOpen = idx === 0; // 最初のカテゴリだけデフォルト展開
    html += `
      <div class="eq-cat" data-cat="${cat.id}" data-open="${isOpen?1:0}">
        <div class="eq-cat-head" onclick="toggleEqCat('${cat.id}')">
          <span class="eq-cat-icon">${cat.icon || ''}</span>
          <span class="eq-cat-label">${escapeHtml(cat.label)}</span>
          <span class="eq-cat-count" id="eq-cat-count-${cat.id}">${filled}/${total}</span>
          <span class="eq-cat-toggle">▼</span>
        </div>
        <div class="eq-cat-items">
          ${_renderCatItems(car, cat)}
        </div>
      </div>`;
  });
  body.innerHTML = html;

  // 完了ボタンの状態
  const completeBtn = document.querySelector('.eq-action-complete');
  if (completeBtn) {
    const eq = getCarEquipment(car);
    completeBtn.setAttribute('data-completed', eq._completed ? '1' : '0');
    completeBtn.textContent = eq._completed ? '✓ 完了済（更新する）' : '完了する';
  }
}

function toggleEqCat(catId) {
  const el = document.querySelector(`.eq-cat[data-cat="${catId}"]`);
  if (!el) return;
  const open = el.getAttribute('data-open') === '1';
  el.setAttribute('data-open', open ? '0' : '1');
}

// グループ化を反映してアイテム描画
function _renderCatItems(car, cat) {
  const eq = getCarEquipment(car);
  let html = '';
  let lastGroup = null;
  let groupOpen = false;
  cat.items.forEach(item => {
    const grp = item.group || null;
    if (grp !== lastGroup) {
      if (groupOpen) {
        html += '</div>';
        groupOpen = false;
      }
      if (grp) {
        const lbl = (window.EQUIPMENT_GROUP_LABELS && EQUIPMENT_GROUP_LABELS[grp]) || '';
        if (lbl) html += `<div class="eq-group-head">${escapeHtml(lbl)}</div>`;
        html += `<div class="eq-group">`;
        groupOpen = true;
      }
      lastGroup = grp;
    }
    html += _renderItem(car, item, eq[item.id]);
  });
  if (groupOpen) html += '</div>';
  return html;
}

function _renderItem(car, item, value) {
  const helpHtml = item.help
    ? `<div class="eq-item-help">${escapeHtml(item.help)}</div>`
    : '';
  // v1.0.21: ℹボタンを左寄せ（チェックを右端へ）
  const infoBtn = item.help
    ? `<div class="eq-item-info" onclick="toggleEqInfo('${item.id}')">ℹ</div>`
    : '<div class="eq-item-info-placeholder"></div>';

  // 入力部の生成
  let controlHtml = '';
  let extraRow = ''; // 行の下に追加表示する用（select / text）

  if (item.type === 'tri') {
    controlHtml = _renderTriControl(item.id, value);
  } else if (item.type === 'select') {
    // ラベル行は名前＋ℹ️、選択ボタン群は下の行
    extraRow = `<div class="eq-select-row" data-select-row="${item.id}">${_renderSelectButtons(item, value)}</div>`;
  } else if (item.type === 'status') {
    controlHtml = _renderStatusControl(item.id, value);
  } else if (item.type === 'text') {
    extraRow = `<div class="eq-text-row"><textarea class="eq-text-input" rows="3" placeholder="必要に応じて記入"
      oninput="onEqTextInput('${item.id}', this.value)">${escapeHtml(value || '')}</textarea></div>`;
  }

  const verticalCls = (item.type === 'select' || item.type === 'text') ? ' eq-item-vertical' : '';

  // v1.0.21: 順序は「ラベル → ℹ → コントロール」。ℹはチェックボタンのすぐ左に置いて、
  // 右手親指でチェックを押す動線にℹが近接するよう配置。
  return `
    <div class="eq-item${verticalCls}" data-item="${item.id}" data-info-open="0">
      <div class="eq-item-row">
        <div class="eq-item-label">${escapeHtml(item.label)}</div>
        ${infoBtn}
        ${controlHtml}
      </div>
      ${extraRow}
      ${helpHtml}
    </div>`;
}

function _renderTriControl(itemId, value) {
  const states = ['none', 'on', 'off'];
  const labels = { none: '未', on: 'あり', off: 'なし' };
  const cur = states.includes(value) ? value : 'none';
  return `
    <div class="eq-tri" onclick="cycleEqTri('${itemId}')">
      ${states.map(s => `<span class="eq-tri-btn" data-state="${s}" data-active="${s===cur?1:0}">${labels[s]}</span>`).join('')}
    </div>`;
}

function _renderStatusControl(itemId, value) {
  const states = ['none', 'ok', 'ng'];
  const labels = { none: '未確認', ok: 'OK', ng: 'NG' };
  const cur = states.includes(value) ? value : 'none';
  return `
    <div class="eq-status" onclick="cycleEqStatus('${itemId}')">
      ${states.map(s => `<span class="eq-status-btn" data-state="${s}" data-active="${s===cur?1:0}">${labels[s]}</span>`).join('')}
    </div>`;
}

function _renderSelectButtons(item, value) {
  // v1.0.21: 日本語の選択肢を onclick 文字列に直接埋め込むとエスケープが壊れる事故が発生したので、
  // data-* 属性方式に変更。クリックは data-item / data-opt から値を取り出す。
  return (item.options || []).map(opt =>
    `<span class="eq-select-btn" data-active="${value===opt?1:0}"
       data-item="${escapeHtml(item.id)}" data-opt="${escapeHtml(opt)}"
       onclick="onEqSelectClick(this)">${escapeHtml(opt)}</span>`
  ).join('');
}

// v1.0.21: select ボタンクリックハンドラ
function onEqSelectClick(el) {
  if (!el) return;
  const itemId = el.getAttribute('data-item');
  const opt = el.getAttribute('data-opt');
  if (!itemId || opt == null) return;
  setEqSelect(itemId, opt);
}

// ====================================================================
// 入力ハンドラ
// ====================================================================

function cycleEqTri(itemId) {
  if (!_eqActiveCarId) return;
  const car = cars.find(c => c.id === _eqActiveCarId);
  if (!car) return;
  const cur = getCarEquipment(car)[itemId] || 'none';
  // none → on → off → none
  const next = cur === 'none' ? 'on' : cur === 'on' ? 'off' : 'none';
  setEquipmentValue(_eqActiveCarId, itemId, next === 'none' ? null : next);
  _updateTriUI(itemId, next);
  _updateCatCount(itemId);
}

function cycleEqStatus(itemId) {
  if (!_eqActiveCarId) return;
  const car = cars.find(c => c.id === _eqActiveCarId);
  if (!car) return;
  const cur = getCarEquipment(car)[itemId] || 'none';
  const next = cur === 'none' ? 'ok' : cur === 'ok' ? 'ng' : 'none';
  setEquipmentValue(_eqActiveCarId, itemId, next === 'none' ? null : next);
  _updateStatusUI(itemId, next);
  _updateCatCount(itemId);
}

function setEqSelect(itemId, opt) {
  if (!_eqActiveCarId) return;
  const car = cars.find(c => c.id === _eqActiveCarId);
  if (!car) return;
  const cur = getCarEquipment(car)[itemId];
  // 同じものをタップしたら解除（未チェックに戻す）
  const next = (cur === opt) ? null : opt;
  setEquipmentValue(_eqActiveCarId, itemId, next);
  _updateSelectUI(itemId, next);
  _updateCatCount(itemId);
}

function onEqTextInput(itemId, value) {
  if (!_eqActiveCarId) return;
  // 連打を抑える
  clearTimeout(window._eqTextTimer);
  window._eqTextTimer = setTimeout(() => {
    setEquipmentValue(_eqActiveCarId, itemId, (value || '').trim());
    _updateCatCount(itemId);
  }, 300);
}

function toggleEqInfo(itemId) {
  const el = document.querySelector(`.eq-item[data-item="${itemId}"]`);
  if (!el) return;
  const open = el.getAttribute('data-info-open') === '1';
  el.setAttribute('data-info-open', open ? '0' : '1');
}

// UI 同期
function _updateTriUI(itemId, state) {
  const el = document.querySelector(`.eq-item[data-item="${itemId}"]`);
  if (!el) return;
  el.querySelectorAll('.eq-tri-btn').forEach(b => {
    b.setAttribute('data-active', b.getAttribute('data-state') === state ? '1' : '0');
  });
}
function _updateStatusUI(itemId, state) {
  const el = document.querySelector(`.eq-item[data-item="${itemId}"]`);
  if (!el) return;
  el.querySelectorAll('.eq-status-btn').forEach(b => {
    b.setAttribute('data-active', b.getAttribute('data-state') === state ? '1' : '0');
  });
}
function _updateSelectUI(itemId, value) {
  const el = document.querySelector(`.eq-item[data-item="${itemId}"]`);
  if (!el) return;
  el.querySelectorAll('.eq-select-btn').forEach(b => {
    // value が null の場合は全て非アクティブ。data-opt 属性で比較（textContent はエスケープで揺れるため）
    const opt = b.getAttribute('data-opt');
    b.setAttribute('data-active', (value != null && opt === value) ? '1' : '0');
  });
}

function _countCatFilled(car, cat) {
  const eq = getCarEquipment(car);
  let n = 0;
  cat.items.forEach(it => {
    const v = eq[it.id];
    if (v != null && v !== '') n++;
  });
  return n;
}
function _updateCatCount(itemId) {
  // どのカテゴリの項目か特定
  const found = findEqItem(itemId);
  if (!found) return;
  if (!_eqActiveCarId) return;
  const car = cars.find(c => c.id === _eqActiveCarId);
  if (!car) return;
  const filled = _countCatFilled(car, found.category);
  const el = document.getElementById(`eq-cat-count-${found.category.id}`);
  if (el) el.textContent = `${filled}/${found.category.items.length}`;
  _updateEqProgressBadge();
  // 値が1つでも変わったので完了ボタンの表示も再評価
  const completeBtn = document.querySelector('.eq-action-complete');
  if (completeBtn) {
    const eq = getCarEquipment(car);
    completeBtn.setAttribute('data-completed', eq._completed ? '1' : '0');
    completeBtn.textContent = eq._completed ? '✓ 完了済（更新する）' : '完了する';
  }
}
function _updateEqProgressBadge() {
  if (!_eqActiveCarId) return;
  const car = cars.find(c => c.id === _eqActiveCarId);
  if (!car) return;
  const p = calcEquipmentProgress(car);
  const el = document.getElementById('eq-progress-badge');
  if (el) el.textContent = `${p.filled}/${p.total} (${p.pct}%)`;
}

function _showEqSavedHint() {
  const el = document.getElementById('eq-saved-hint');
  if (!el) return;
  el.classList.add('show');
  clearTimeout(_eqSavedHintTimer);
  _eqSavedHintTimer = setTimeout(() => el.classList.remove('show'), 1100);
}

// ====================================================================
// 装備詳細 閲覧ビュー（モーダル内 / 商談モード共通）
// ====================================================================

// "あり/なし/未"の集計
function _eqViewSummary(car) {
  const eq = getCarEquipment(car);
  let total = 0, on = 0, off = 0, none = 0, sel = 0, txt = 0;
  EQUIPMENT_CATEGORIES.forEach(cat => {
    cat.items.forEach(it => {
      total++;
      const v = eq[it.id];
      if (v == null || v === '') { none++; return; }
      if (it.type === 'tri') {
        if (v === 'on') on++;
        else if (v === 'off') off++;
        else none++;
      } else if (it.type === 'status') {
        if (v === 'ok') on++;
        else if (v === 'ng') off++;
        else none++;
      } else if (it.type === 'select') {
        sel++;
      } else if (it.type === 'text') {
        if ((v || '').trim()) txt++;
        else none++;
      }
    });
  });
  return { total, on, off, none, sel, txt };
}

// 全項目を ○ × 形式で表示（QB の指定どおり）
// onBack: 「← 戻る」ボタンのコールバック JS 文字列（任意）。指定すると上部に表示。
function renderEquipmentView(car, opts) {
  opts = opts || {};
  const eq = getCarEquipment(car);
  if (!window.EQUIPMENT_CATEGORIES) return '';
  const sum = _eqViewSummary(car);

  let html = '';

  if (opts.backHandler) {
    html += `<div class="deal-eq-back" onclick="${opts.backHandler}">← 戻る</div>`;
  }

  // サマリー
  html += `
    <div class="eq-view-summary">
      <div class="col"><span class="num on">${sum.on}</span><span class="lbl">あり / OK</span></div>
      <div class="col"><span class="num off">${sum.off}</span><span class="lbl">なし / NG</span></div>
      <div class="col"><span class="num none">${sum.none}</span><span class="lbl">未</span></div>
      <div class="col"><span class="num total">${sum.total}</span><span class="lbl">全項目</span></div>
    </div>`;

  if (sum.on === 0 && sum.off === 0 && sum.sel === 0 && sum.txt === 0) {
    html += `
      <div class="eq-view-empty">
        <div class="big">📋</div>
        <div>まだ装備品チェックが行われていません</div>
        <div style="margin-top:6px;font-size:11px">スマホでチェックを開始してください</div>
      </div>`;
    return `<div class="eq-view">${html}</div>`;
  }

  EQUIPMENT_CATEGORIES.forEach(cat => {
    // 表示する項目があるかチェック（未だけのカテゴリは省略）
    const rows = cat.items.map(it => {
      const v = eq[it.id];
      let valHtml = '';
      let cls = '';
      if (v == null || v === '') {
        valHtml = '—';
        cls = 'none';
      } else if (it.type === 'tri') {
        if (v === 'on')  { valHtml = '○'; cls = 'on'; }
        else if (v === 'off') { valHtml = '×'; cls = 'off'; }
        else { valHtml = '—'; cls = 'none'; }
      } else if (it.type === 'status') {
        if (v === 'ok')  { valHtml = 'OK'; cls = 'ok'; }
        else if (v === 'ng') { valHtml = 'NG'; cls = 'ng'; }
        else { valHtml = '—'; cls = 'none'; }
      } else if (it.type === 'select') {
        valHtml = escapeHtml(v);
        cls = 'sel';
      } else if (it.type === 'text') {
        const t = (v || '').trim();
        if (!t) { valHtml = '—'; cls = 'none'; }
        else { valHtml = escapeHtml(t); cls = 'txt'; }
      }
      return `<div class="eq-view-row"><span class="label">${escapeHtml(it.label)}</span><span class="val ${cls}">${valHtml}</span></div>`;
    }).join('');

    html += `
      <div class="eq-view-cat">
        <div class="eq-view-cat-head"><span class="icon">${cat.icon||''}</span>${escapeHtml(cat.label)}</div>
        <div class="eq-view-grid">${rows}</div>
      </div>`;
  });

  return `<div class="eq-view">${html}</div>`;
}

// アコーディオンの開閉（カード詳細モーダル内）
// v1.0.21: 新規画面置換 → アコーディオン展開方式に変更
function toggleEquipmentAccordion(carId, forceOpen) {
  const wrap = document.getElementById(`eq-acc-${carId}`);
  const btn = document.getElementById(`eq-acc-btn-${carId}`);
  if (!wrap || !btn) return;
  const isOpen = wrap.getAttribute('data-open') === '1';
  const next = (typeof forceOpen === 'boolean') ? forceOpen : !isOpen;
  if (next) {
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    // 中身をその場で生成（最新値を反映）
    wrap.innerHTML = renderEquipmentView(car, {});
    wrap.setAttribute('data-open', '1');
    btn.setAttribute('data-open', '1');
  } else {
    wrap.setAttribute('data-open', '0');
    // 中身は残しても閉じれば見えないが、再展開時に最新値で描き直すので消しておく
    wrap.innerHTML = '';
  }
}

// 商談ポップアップ用：装備詳細モード切替
function dealShowEquipment(carId) {
  const body = document.getElementById('deal-popup-body');
  if (!body) return;
  body.setAttribute('data-eq-mode', '1');
  // 既にパネル要素があれば中身だけ差し替え
  let panel = body.querySelector('.deal-eq-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'deal-eq-panel';
    body.appendChild(panel);
  }
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  panel.innerHTML = renderEquipmentView(car, { backHandler: `dealHideEquipment()` });
}

function dealHideEquipment() {
  const body = document.getElementById('deal-popup-body');
  if (!body) return;
  body.setAttribute('data-eq-mode', '0');
}
