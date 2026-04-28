// ========================================
// tasks-def.js
// 再生タスク・納車タスクの定義
// 作業工程を増やしたい/減らしたい時はここを編集
// ========================================

// 再生（リノベーション）工程のタスク定義
const REGEN_TASKS = [
  {id:'t_equip', name:'装備品チェック', icon:'🔍', type:'workflow', sections:[
    {title:'01 外装確認', items:[
      {id:'e1', name:'ボディ全周チェック', sub:'傷・へこみ・錆',
       detail:'ボディ全周を目視確認し板金カルテに記入します。',
       points:['ルーフ・ピラーも確認','フレーム歪みの有無']},
      {id:'e2', name:'タイヤ・ホイール確認', sub:'溝・偏摩耗・傷',
       detail:'タイヤ4本の溝・製造年・偏摩耗を確認します。',
       points:['溝1.6mm以下は交換']},
    ]},
    {title:'02 内装確認', items:[
      {id:'e3', name:'シート・内張り確認', sub:'破れ・汚れ・臭い',
       detail:'シート・天井・カーペットを確認します。',
       points:['シートの破れ・沈み込み']},
      {id:'e4', name:'電装品確認', sub:'スイッチ・ナビ・エアコン',
       detail:'全電装系スイッチ類の動作を確認します。',
       points:['エアコン冷暖房の効き']},
    ]},
    {title:'03 付属品', items:[
      {id:'e5', name:'付属品確認', sub:'スペアキー・取説等',
       detail:'付属品がすべて揃っているか確認します。',
       points:['スペアキーの有無']},
    ]},
  ]},

  {id:'t_regen', name:'再生', icon:'🔧', type:'workflow', sections:[
    {title:'01 エンジン・機関', items:[
      {id:'r1', name:'エンジンオイル交換', sub:'量・色・漏れ確認',
       detail:'オイル量・色・漏れを確認し交換します。',
       points:['交換推奨距離確認']},
      {id:'r2', name:'下回り点検', sub:'ブレーキ・足回り',
       detail:'リフトアップして下回りを確認します。',
       points:['パッド残量3mm以下は交換']},
      {id:'r3', name:'消耗品交換', sub:'バッテリー・ワイパー',
       detail:'バッテリー電圧・ワイパーゴムを確認し交換。',
       points:['12.4V以下は交換']},
    ]},
    {title:'02 板金・塗装', items:[
      {id:'r4', name:'板金・塗装', sub:'へこみ・傷修理',
       detail:'板金カルテに基づき修理を実施します。',
       points:['優先度の高い箇所から']},
    ]},
  ]},

  {id:'t_photo',   name:'写真撮影',   icon:'📷', type:'toggle'},
  {id:'t_estim',   name:'見積もり作成', icon:'🧮', type:'toggle'},
  {id:'t_webup',   name:'webUP',     icon:'🌐', type:'toggle'},

  {id:'t_exhibit', name:'展示', icon:'🏪', type:'workflow', sections:[
    {title:'01 クリーニング', items:[
      {id:'ex1', name:'外装洗車・下地処理', sub:'高圧洗浄・脱脂',
       detail:'高圧洗浄後、脱脂処理します。',
       points:['エンブレム周りも入念に']},
      {id:'ex2', name:'磨き・コーティング', sub:'バフ掛け・ガラスコート',
       detail:'コンパウンドで傷除去後ガラスコーティング施工。',
       points:['粗目→細目→仕上げ']},
      {id:'ex3', name:'内装クリーニング', sub:'スチーム洗浄・消臭',
       detail:'スチーム洗浄と消臭剤を施工します。',
       points:['シートレール下の清掃']},
    ]},
    {title:'02 展示準備', items:[
      {id:'ex4', name:'展示位置・POP設置', sub:'プライスカード',
       detail:'展示スペースに配置しPOPを設置。',
       points:['見やすい角度に配置']},
    ]},
  ]},
];

// 納車準備工程のタスク定義
const DELIVERY_TASKS = [
  {id:'d_prep', name:'納車準備', icon:'📦', type:'workflow', sections:[
    {title:'01 最終確認', items:[
      {id:'dp1', name:'最終外観チェック', sub:'傷・汚れの最終確認',
       detail:'納車前の最終外観チェックを実施します。',
       points:['新たな傷がないか確認']},
      {id:'dp2', name:'室内最終クリーニング', sub:'納車前清掃',
       detail:'室内を最終クリーニングします。',
       points:['フロアマットの清掃']},
    ]},
  ]},

  {id:'d_maint', name:'納車整備', icon:'🔧', type:'workflow', sections:[
    {title:'01 納車前点検', items:[
      {id:'dm1', name:'オイル・液量最終確認', sub:'各液量確認',
       detail:'各液量を最終確認します。',
       points:['エンジンオイル量','冷却水']},
      {id:'dm2', name:'タイヤ空気圧調整', sub:'規定値に調整',
       detail:'4輪のタイヤ空気圧を規定値に調整します。',
       points:['車両の指定空気圧を確認']},
      {id:'dm3', name:'試乗・動作確認', sub:'走行テスト',
       detail:'近隣を試乗し異常がないか確認します。',
       points:['ブレーキの効き']},
    ]},
  ]},

  {id:'d_docs', name:'書類', icon:'📄', type:'toggle'},
  {id:'d_reg',  name:'登録', icon:'📝', type:'toggle'},
];

// ========================================
// v1.0.32〜33: タスク ON/OFF ＋ 並び替え ＋ カスタム追加 ＋ 期日
// 設定UIで管理（メモリ上、リロードで初期化）
// ========================================

// 組み込みタスクの enabled 状態（true=有効、false=無効）
// 形：{ regen: { t_equip:true, t_regen:true, ... }, delivery: {...} }
// 未定義キーは「有効」扱い（後方互換）
let appTaskEnabled = { regen: {}, delivery: {} };

// ユーザー追加のチェック型タスク
// 形：[{ id, name, icon, phases:['regen'|'delivery'] }]
let appCustomTasks = [];

// v1.0.33: タスク並び順（フェーズごと、ID配列）
// 配列に無い ID は末尾に元の定義順で追加される
let appTaskOrder = { regen: [], delivery: [] };

// v1.0.33: タスク期日（フェーズごと、{taskId: 日数 or null}）
// 再生：仕入れから N 日以内（N = 数値）
// 納車：納車まで N 日前まで（N = 数値）
let appTaskDeadline = { regen: {}, delivery: {} };

// タスクが有効か判定（未定義は true 扱い）
function isTaskActive(taskId, phase) {
  const map = (appTaskEnabled && appTaskEnabled[phase]) || {};
  if (taskId in map) return map[taskId] !== false;
  return true; // 未定義は有効
}

// v1.0.33: タスク期日を取得（数値 or null）
function getTaskDeadline(taskId, phase) {
  const map = (appTaskDeadline && appTaskDeadline[phase]) || {};
  const v = map[taskId];
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// v1.0.33: 並び順を反映してタスク配列をソート
// order 配列に書かれている順を優先、未記載のものは元の定義順で末尾
function _sortByTaskOrder(tasks, phase) {
  const order = (appTaskOrder && appTaskOrder[phase]) || [];
  if (!order.length) return tasks;
  const indexed = tasks.map((t, i) => {
    const oi = order.indexOf(t.id);
    return { t, key: oi >= 0 ? oi : 1000 + i };
  });
  indexed.sort((a, b) => a.key - b.key);
  return indexed.map(x => x.t);
}

// 組み込み＋カスタム の合体配列を作る（フェーズ別）
function _allTasksForPhase(phase) {
  const builtin = (phase === 'delivery' ? DELIVERY_TASKS : REGEN_TASKS).map(t => ({
    id: t.id, name: t.name, icon: t.icon, type: t.type, sections: t.sections, builtin: true,
  }));
  const custom = (appCustomTasks || [])
    .filter(t => (t.phases || []).includes(phase))
    .map(t => ({ id: t.id, name: t.name, icon: t.icon, type: 'toggle', _custom: true, builtin: false }));
  return _sortByTaskOrder(builtin.concat(custom), phase);
}

// 再生フェーズで有効なタスクのリスト（組み込み＋カスタム、並び順反映）
function getActiveRegenTasks() {
  return _allTasksForPhase('regen').filter(t => isTaskActive(t.id, 'regen'));
}

// 納車フェーズで有効なタスクのリスト
function getActiveDeliveryTasks() {
  return _allTasksForPhase('delivery').filter(t => isTaskActive(t.id, 'delivery'));
}

// 設定UI用：組み込み＋カスタムを enabled 状態付きで全部返す（並び順反映）
function getAllTasksForUI(phase) {
  return _allTasksForPhase(phase).map(t => ({
    id: t.id, name: t.name, icon: t.icon, type: t.type,
    enabled: isTaskActive(t.id, phase),
    builtin: t.builtin,
    deadline: getTaskDeadline(t.id, phase),
  }));
}

// v1.0.33: 並び替え（1個分上下）
function moveTaskOrder(taskId, phase, dir) {
  // 現在の表示順を取得
  const cur = _allTasksForPhase(phase).map(t => t.id);
  const i = cur.indexOf(taskId);
  if (i < 0) return;
  const j = i + dir;
  if (j < 0 || j >= cur.length) return;
  [cur[i], cur[j]] = [cur[j], cur[i]];
  appTaskOrder[phase] = cur;
}
