// ========================================
// state.js
// アプリの状態（グローバル変数）
// 現在ログイン中のユーザー、編集中の車両ID、
// ドラッグ中のオブジェクトなどを保持
// ========================================

let currentUser = '';              // ログインユーザー名
let formPhotoData = null;          // 車両登録フォームで選択中の写真
let editingCarId = null;           // 編集中の車両ID
let calYear, calMonth;             // カレンダー表示中の年月
let dragCard = null;               // ドラッグ中の車両カード
let dragDeliveryCarId = null;      // カレンダーで納車バーをドラッグ中の車両ID
let pendingDragCar = null;         // 売却確認ダイアログで保留中の車両
let pendingTargetCol = null;       // 同上の移動先列
let globalLogs = [];               // 全操作ログ
let activeDetailCarId = null;      // 現在詳細モーダル表示中の車両ID
let wfState = {carId:null, taskId:null, isDelivery:false}; // ワークフロー状態
let closedDays = [3];              // 定休日の曜日（初期：水曜）
let customHolidays = [];           // カスタム休業日リスト
let jpHolidays = {};               // 日本の祝日（APIから取得）
