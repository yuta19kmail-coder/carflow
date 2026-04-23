// ========================================
// helpers.js
// 共通ヘルパー関数
// 日付計算、価格整形、トースト表示、モーダル開閉、ログ追加
// ========================================

// タスクの初期状態を生成
function mkTaskState(tasks) {
  const s = {};
  tasks.forEach(t => {
    if (t.type === 'toggle') {
      s[t.id] = false;
    } else {
      s[t.id] = {};
      t.sections.forEach(sec => sec.items.forEach(i => s[t.id][i.id] = false));
    }
  });
  return s;
}

// 日付文字列に日数を加算
function dateAddDays(str, n) {
  const d = new Date(str);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// 今日の日付文字列 (YYYY-MM-DD)
const todayStr = () => new Date().toISOString().split('T')[0];

// ユニークIDを生成
const uid = () => 'c' + Date.now();

// 日付を M/D 形式で整形
const fmtDate = s => {
  if (!s) return '—';
  const d = new Date(s);
  return `${d.getMonth()+1}/${d.getDate()}`;
};

// 指定日からの経過日数
const daysSince = s => {
  if (!s) return 0;
  return Math.floor((new Date() - new Date(s)) / 86400000);
};

// 指定日までの残り日数（負なら過ぎている）
const daysDiff = s => {
  if (!s) return null;
  return Math.ceil((new Date(s) - new Date()) / 86400000);
};

// ボディサイズから絵文字を取得
const carEmoji = s => ({
  軽自動車:'🚙',
  コンパクト:'🚗',
  ミニバン:'🚐',
  SUV:'🛻',
  セダン:'🚘',
  トラック:'🚚'
}[s] || '🚗');

// 価格を「XX.X万円」形式に整形
const fmtPrice = p => {
  if (!p) return '価格未設定';
  return `${(Number(p)/10000).toFixed(1)}万円`;
};

// トースト通知
const showToast = msg => {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
};

// モーダルを閉じる
const closeModal = id => document.getElementById(id).classList.remove('open');

// 操作ログを追加
const addLog = (carId, action) => {
  const car = cars.find(c => c.id === carId);
  if (!car) return;
  const now = new Date();
  const time = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const entry = {time, user:currentUser, action, carNum:car.num};
  car.logs.push(entry);
  globalLogs.unshift(entry);
  document.getElementById('log-badge').style.display = 'inline';
};
