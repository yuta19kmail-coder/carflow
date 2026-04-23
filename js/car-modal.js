// ========================================
// car-modal.js
// 車両登録/編集モーダル
// ========================================

// 車両登録モーダルを開く（carId指定で編集モード）
function openCarModal(carId) {
  editingCarId = carId || null;
  formPhotoData = null;
  const car = carId ? cars.find(c => c.id === carId) : null;
  document.getElementById('inp-num').value      = car?.num || '';
  document.getElementById('inp-maker').value    = car?.maker || '';
  document.getElementById('inp-model').value    = car?.model || '';
  document.getElementById('inp-year').value     = car?.year || '';
  document.getElementById('inp-color').value    = car?.color || '';
  document.getElementById('inp-size').value     = car?.size || 'コンパクト';
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
