// ========================================
// car-modal.js
// 車両登録/編集モーダル
// v0.8.9: 新規登録時は「仕入れ車として登録」「その他として登録」の2ボタン
// ========================================

// --- ボディサイズ設定UI ---
function renderSizeEditor() {
  const el = document.getElementById('size-editor');
  if (!el) return;
  if (!SIZES.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text3)">区分がありません。下から追加してください。</div>';
    return;
  }
  el.innerHTML = SIZES.map((s,i) => `
    <div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;margin-bottom:6px">
      <input type="text" value="${s.replace(/"/g,'&quot;')}" onchange="renameSizeOption(${i}, this.value)" style="flex:1;padding:4px 7px;background:var(--bg2);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:12px;outline:none">
      <button onclick="moveSizeOption(${i},-1)" ${i===0?'disabled':''} style="padding:3px 8px;background:var(--bg2);border:1px solid var(--border);border-radius:5px;color:var(--text2);font-size:11px;cursor:pointer">▲</button>
      <button onclick="moveSizeOption(${i},1)" ${i===SIZES.length-1?'disabled':''} style="padding:3px 8px;background:var(--bg2);border:1px solid var(--border);border-radius:5px;color:var(--text2);font-size:11px;cursor:pointer">▼</button>
      <button onclick="removeSizeOption(${i})" style="padding:3px 8px;background:var(--bg2);border:1px solid var(--border);border-radius:5px;color:var(--red);font-size:11px;cursor:pointer">✕</button>
    </div>
  `).join('');
}

function addSizeOption() {
  const inp = document.getElementById('size-add-inp');
  const v = (inp.value||'').trim();
  if (!v) return;
  if (SIZES.includes(v)) { showToast('同じ区分が既にあります'); return; }
  SIZES.push(v);
  inp.value = '';
  renderSizeEditor();
  showToast(`「${v}」を追加しました`);
}

function renameSizeOption(i, newName) {
  const v = (newName||'').trim();
  if (!v) { renderSizeEditor(); return; }
  const old = SIZES[i];
  if (old === v) return;
  SIZES[i] = v;
  cars.forEach(c => { if (c.size === old) c.size = v; });
  renderSizeEditor();
  renderAll();
}

function moveSizeOption(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= SIZES.length) return;
  [SIZES[i], SIZES[j]] = [SIZES[j], SIZES[i]];
  renderSizeEditor();
}

function removeSizeOption(i) {
  const name = SIZES[i];
  const used = cars.some(c => c.size === name);
  if (used && !confirm(`「${name}」を使用中の車両があります。削除しますか？（該当車両は未分類になります）`)) return;
  SIZES.splice(i, 1);
  if (used) cars.forEach(c => { if (c.size === name) c.size = SIZES[0] || ''; });
  renderSizeEditor();
  renderAll();
  showToast('区分を削除しました');
}

function resetSizeOptions() {
  if (!confirm('ボディサイズ区分を初期値に戻しますか？')) return;
  SIZES.length = 0;
  SIZES_DEFAULT.forEach(s => SIZES.push(s));
  renderSizeEditor();
  renderAll();
  showToast('初期値に戻しました');
}

function refreshSizeOptions(selected) {
  const sel = document.getElementById('inp-size');
  if (!sel) return;
  const prev = selected ?? sel.value;
  sel.innerHTML = SIZES.map(s => `<option${s===prev?' selected':''}>${s}</option>`).join('');
}

function refreshYearDatalist() {
  const dl = document.getElementById('dl-year');
  if (!dl) return;
  const cur = new Date().getFullYear();
  let html = '';
  for (let y = cur + 1; y >= cur - 30; y--) html += `<option value="${fmtYearDisplay(y)}">`;
  dl.innerHTML = html;
}

function refreshKmDatalist() {
  const dl = document.getElementById('dl-km');
  if (!dl) return;
  let html = '';
  for (let km = 5000; km <= 200000; km += 5000) {
    const label = km < 10000 ? `${km/1000}千km`
                             : (km % 10000 === 0 ? `${km/10000}万km` : `${(km/10000).toFixed(1)}万km`);
    html += `<option value="${km}" label="${label}">`;
  }
  dl.innerHTML = html;
}

function onYearBlur(inp) {
  if (!inp.value.trim()) return;
  inp.value = normalizeYear(inp.value);
}

function onKmBlur(inp) {
  const v = String(inp.value || '').replace(/[,\s]/g, '').replace(/km$/i, '');
  if (!v) return;
  const n = parseInt(v, 10);
  if (!isNaN(n) && n >= 0) inp.value = String(n);
}

function updateSellUI() {
  const sw = document.getElementById('sell-switch');
  const on = sw.classList.contains('on');
  document.getElementById('inp-contract-date').disabled = !on;
  document.getElementById('inp-delivery').disabled = !on;
  document.getElementById('sell-switch-hint').textContent = on ? 'ON：売約済み（日付を入力できます）' : 'OFF：未成約（売約日・納車予定日は編集できません）';
  if (!on) {
    document.getElementById('inp-contract-date').value = '';
    document.getElementById('inp-delivery').value = '';
  } else {
    if (!document.getElementById('inp-contract-date').value) {
      document.getElementById('inp-contract-date').value = todayStr();
    }
    if (!document.getElementById('inp-delivery').value) {
      const lead = (typeof appSettings !== 'undefined' && appSettings.deliveryLeadDays) || 14;
      document.getElementById('inp-delivery').value = dateAddDays(todayStr(), lead);
    }
  }
}

function onSellSwitchClick() {
  const sw = document.getElementById('sell-switch');
  const goingOn = !sw.classList.contains('on');
  if (goingOn) {
    const car = editingCarId ? cars.find(c => c.id === editingCarId) : null;
    const col = car ? car.col : 'purchase';
    if (!isDeliveryPhase(col)) {
      showEarlySellConfirm(col);
      return;
    }
  }
  sw.classList.toggle('on');
  updateSellUI();
}

function showEarlySellConfirm(col) {
  const label = COLS.find(c => c.id === col)?.label || col;
  document.getElementById('early-sell-sub').innerHTML =
    `まだ「${label}」ステータスです。<br>このタイミングで売約フラグを立てますか？`;
  document.getElementById('confirm-early-sell').classList.add('open');
}

function closeEarlySellConfirm(ok) {
  document.getElementById('confirm-early-sell').classList.remove('open');
  if (ok) {
    document.getElementById('sell-switch').classList.add('on');
    updateSellUI();
  }
}

function openCarModal(carId) {
  editingCarId = carId || null;
  formPhotoData = null;
  const car = carId ? cars.find(c => c.id === carId) : null;
  refreshSizeOptions(car?.size || 'コンパクト');
  refreshYearDatalist();
  refreshKmDatalist();
  document.getElementById('inp-num').value      = car?.num || '';
  document.getElementById('inp-maker').value    = car?.maker || '';
  document.getElementById('inp-model').value    = car?.model || '';
  document.getElementById('inp-year').value     = car?.year ? normalizeYear(car.year) : '';
  document.getElementById('inp-color').value    = car?.color || '';
  document.getElementById('inp-size').value     = car?.size || SIZES[0] || 'コンパクト';
  document.getElementById('inp-km').value       = car?.km || '';
  document.getElementById('inp-price').value    = car?.price || '';
  document.getElementById('inp-purchase').value = car?.purchaseDate || todayStr();
  document.getElementById('inp-contract-date').value = car?.contractDate || '';
  document.getElementById('inp-delivery').value = car?.deliveryDate || '';
  document.getElementById('inp-memo').value     = car?.memo || '';
  const sw = document.getElementById('sell-switch');
  if (car?.contract) sw.classList.add('on'); else sw.classList.remove('on');
  updateSellUI();
  document.getElementById('inp-photo-prev').innerHTML = car?.photo
    ? `<img src="${car.photo}" style="width:100%;max-height:110px;object-fit:cover;border-radius:7px;margin-top:7px">`
    : '';
  document.getElementById('car-modal-title').textContent = car ? '車両情報を編集' : '新規車両登録';

  // v0.8.9: 新規登録時は「仕入れ車として登録」「その他として登録」の2ボタン
  // 編集時は「更新する」1ボタン（その他ボタンは隠す）
  const saveBtn = document.getElementById('car-save-btn');
  const otherBtn = document.getElementById('car-save-other-btn');
  if (car) {
    if (saveBtn) {
      saveBtn.textContent = '更新する';
      saveBtn.setAttribute('onclick', `saveCarModal('__edit__')`);
    }
    if (otherBtn) otherBtn.style.display = 'none';
  } else {
    if (saveBtn) {
      saveBtn.textContent = '仕入れ車として登録';
      saveBtn.setAttribute('onclick', `saveCarModal('purchase')`);
    }
    if (otherBtn) otherBtn.style.display = '';
  }
  document.getElementById('modal-car').classList.add('open');
}

function onFormPhoto(inp) {
  const file = inp.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    formPhotoData = e.target.result;
    document.getElementById('inp-photo-prev').innerHTML =
      `<img src="${formPhotoData}" style="width:100%;max-height:110px;object-fit:cover;border-radius:7px;margin-top:7px">`;
  };
  r.readAsDataURL(file);
}

function saveCarModal(initialCol) {
  // v0.8.9: 新規登録時は initialCol で 'purchase' か 'other' を指定。編集時は無視。
  const num = document.getElementById('inp-num').value.trim();
  const maker = document.getElementById('inp-maker').value.trim();
  const model = document.getElementById('inp-model').value.trim();
  if (!num || !maker || !model) {
    showToast('管理番号・メーカー・車種は必須です');
    return;
  }
  const sellOn = document.getElementById('sell-switch').classList.contains('on');
  const contractDate = sellOn ? (document.getElementById('inp-contract-date').value || todayStr()) : '';
  const deliveryDate = sellOn ? (document.getElementById('inp-delivery').value || '') : '';
  const yearNorm = normalizeYear(document.getElementById('inp-year').value);
  const kmInp = String(document.getElementById('inp-km').value || '').replace(/[,\s]/g, '').replace(/km$/i, '');

  if (editingCarId) {
    const car = cars.find(c => c.id === editingCarId);
    if (!car) return;
    car.num = num; car.maker = maker; car.model = model;
    car.year         = yearNorm || car.year;
    car.color        = document.getElementById('inp-color').value    || car.color;
    car.size         = document.getElementById('inp-size').value;
    car.km           = kmInp || car.km;
    car.price        = document.getElementById('inp-price').value    || '';
    car.purchaseDate = document.getElementById('inp-purchase').value || car.purchaseDate;
    car.contract     = sellOn ? 1 : 0;
    car.contractDate = contractDate;
    car.deliveryDate = deliveryDate;
    car.memo         = document.getElementById('inp-memo').value;
    if (formPhotoData) car.photo = formPhotoData;
    addLog(editingCarId, '車両情報を編集');
    closeModal('modal-car');
    if (document.getElementById('modal-detail').classList.contains('open')) renderDetailBody(car);
  } else {
    const startCol = (initialCol === 'other') ? 'other' : 'purchase';
    const car = {
      id:uid(), num, maker, model,
      year : yearNorm || '—',
      color: document.getElementById('inp-color').value    || '—',
      size : document.getElementById('inp-size').value,
      km   : kmInp || '0',
      price: document.getElementById('inp-price').value    || '',
      purchaseDate: document.getElementById('inp-purchase').value || todayStr(),
      contract: sellOn ? 1 : 0,
      contractDate,
      deliveryDate,
      memo : document.getElementById('inp-memo').value,
      photo: formPhotoData,
      col: startCol,
      regenTasks: mkTaskState(REGEN_TASKS),
      deliveryTasks: mkTaskState(DELIVERY_TASKS),
      logs: []
    };
    addLog(car.id, `新規登録（${startCol === 'other' ? 'その他' : '仕入れ'}として）`);
    cars.push(car);
    closeModal('modal-car');
    renderDashboard();
  }
  renderAll();
  const okMsg = editingCarId
    ? '情報を更新しました'
    : (initialCol === 'other' ? `${maker} ${model} を「その他」として登録しました` : `${maker} ${model} を仕入れ車として登録しました`);
  showToast(okMsg);
}
