// ========================================
// car-modal.js
// 車両登録/編集モーダル
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
  // 既存車両のsize値も差し替え
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

// ボディサイズselectを現在のSIZESから再生成
function refreshSizeOptions(selected) {
  const sel = document.getElementById('inp-size');
  if (!sel) return;
  const prev = selected ?? sel.value;
  sel.innerHTML = SIZES.map(s => `<option${s===prev?' selected':''}>${s}</option>`).join('');
}

// 年式selectを生成（今年から過去30年分）
function refreshYearOptions() {
  const sel = document.getElementById('inp-year-sel');
  if (!sel) return;
  const cur = new Date().getFullYear();
  let html = '<option value="">▼選択</option>';
  for (let y = cur + 1; y >= cur - 30; y--) html += `<option value="${y}">${y}年</option>`;
  sel.innerHTML = html;
  sel.value = '';
}

// 年式プルダウン選択時 → 入力欄に反映
function onYearSelect(sel) {
  if (sel.value) {
    document.getElementById('inp-year').value = sel.value;
    sel.value = '';
  }
}

// 走行距離プルダウン選択時 → 入力欄に反映
function onKmSelect(sel) {
  if (sel.value) {
    document.getElementById('inp-km').value = sel.value;
    sel.value = '';
  }
}

// 車両登録モーダルを開く（carId指定で編集モード）
function openCarModal(carId) {
  editingCarId = carId || null;
  formPhotoData = null;
  const car = carId ? cars.find(c => c.id === carId) : null;
  refreshSizeOptions(car?.size || 'コンパクト');
  refreshYearOptions();
  const kmSel = document.getElementById('inp-km-sel');
  if (kmSel) kmSel.value = '';
  document.getElementById('inp-num').value      = car?.num || '';
  document.getElementById('inp-maker').value    = car?.maker || '';
  document.getElementById('inp-model').value    = car?.model || '';
  document.getElementById('inp-year').value     = car?.year || '';
  document.getElementById('inp-color').value    = car?.color || '';
  document.getElementById('inp-size').value     = car?.size || SIZES[0] || 'コンパクト';
  document.getElementById('inp-km').value       = car?.km || '';
  document.getElementById('inp-price').value    = car?.price || '';
  document.getElementById('inp-purchase').value = car?.purchaseDate || todayStr();
  document.getElementById('inp-delivery').value = car?.deliveryDate || '';
  document.getElementById('inp-memo').value     = car?.memo || '';
  document.getElementById('inp-photo-prev').innerHTML = car?.photo
    ? `<img src="${car.photo}" style="width:100%;max-height:110px;object-fit:cover;border-radius:7px;margin-top:7px">`
    : '';
  document.getElementById('car-modal-title').textContent = car ? '車両情報を編集' : '新規車両登録';
  document.getElementById('car-save-btn').textContent = car ? '更新する' : '登録する';
  document.getElementById('modal-car').classList.add('open');
}

// フォーム内の写真選択
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

// 車両情報を保存（新規 or 更新）
function saveCarModal() {
  const num = document.getElementById('inp-num').value.trim();
  const maker = document.getElementById('inp-maker').value.trim();
  const model = document.getElementById('inp-model').value.trim();
  if (!num || !maker || !model) {
    showToast('管理番号・メーカー・車種は必須です');
    return;
  }
  const deliveryDate = document.getElementById('inp-delivery').value || '';

  if (editingCarId) {
    // 既存車両を更新
    const car = cars.find(c => c.id === editingCarId);
    if (!car) return;
    car.num = num; car.maker = maker; car.model = model;
    car.year         = document.getElementById('inp-year').value     || car.year;
    car.color        = document.getElementById('inp-color').value    || car.color;
    car.size         = document.getElementById('inp-size').value;
    car.km           = document.getElementById('inp-km').value       || car.km;
    car.price        = document.getElementById('inp-price').value    || '';
    car.purchaseDate = document.getElementById('inp-purchase').value || car.purchaseDate;
    car.deliveryDate = deliveryDate;
    car.contract     = deliveryDate ? 1 : 0;
    car.memo         = document.getElementById('inp-memo').value;
    if (formPhotoData) car.photo = formPhotoData;
    addLog(editingCarId, '車両情報を編集');
    closeModal('modal-car');
    if (document.getElementById('modal-detail').classList.contains('open')) renderDetailBody(car);
  } else {
    // 新規車両を登録
    const car = {
      id:uid(), num, maker, model,
      year : document.getElementById('inp-year').value     || '—',
      color: document.getElementById('inp-color').value    || '—',
      size : document.getElementById('inp-size').value,
      km   : document.getElementById('inp-km').value       || '0',
      price: document.getElementById('inp-price').value    || '',
      purchaseDate: document.getElementById('inp-purchase').value || todayStr(),
      contract: deliveryDate ? 1 : 0,
      deliveryDate,
      memo : document.getElementById('inp-memo').value,
      photo: formPhotoData,
      col: 'purchase',
      regenTasks: mkTaskState(REGEN_TASKS),
      deliveryTasks: mkTaskState(DELIVERY_TASKS),
      logs: []
    };
    addLog(car.id, '新規登録');
    cars.push(car);
    closeModal('modal-car');
    renderDashboard();
  }
  renderAll();
  showToast(editingCarId ? '情報を更新しました' : `${maker} ${model} を登録しました`);
}
