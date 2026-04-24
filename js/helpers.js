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

// ========================================
// 年式（西暦↔和暦）変換
// ========================================
// 西暦 → 和暦の年号・年を返す
function seirekiToWareki(y) {
  y = Number(y);
  if (!y) return null;
  if (y >= 2019) return {era:'令和', n:y - 2018};  // 2019=令和元年
  if (y >= 1989) return {era:'平成', n:y - 1988};  // 1989=平成元年
  if (y >= 1926) return {era:'昭和', n:y - 1925};
  return null;
}
// 和暦 → 西暦
function warekiToSeireki(era, n) {
  n = Number(n);
  if (!n) return null;
  if (era === '令和' || era === 'R' || era === 'r') return 2018 + n;
  if (era === '平成' || era === 'H' || era === 'h') return 1988 + n;
  if (era === '昭和' || era === 'S' || era === 's') return 1925 + n;
  return null;
}
// 入力文字列をパースして西暦（数値）を返す。失敗時はnull
function parseYearInput(str) {
  if (!str) return null;
  const s = String(str).trim();
  // 表示形式「令和8｜2026」「令和8|2026」「令和8 2026」等 → 西暦を抽出
  const m1 = s.match(/(\d{4})/);
  if (m1 && Number(m1[1]) >= 1900 && Number(m1[1]) <= 2100) return Number(m1[1]);
  // 西暦単独
  if (/^\d{2,4}$/.test(s)) {
    const n = Number(s);
    if (n >= 1900 && n <= 2100) return n;
  }
  // 和暦「令和8」「R8」「h30」「s60」
  const m2 = s.match(/^(令和|平成|昭和|R|r|H|h|S|s)\s*(\d{1,2})年?$/);
  if (m2) return warekiToSeireki(m2[1], m2[2]);
  return null;
}
// 西暦から「令和8｜2026」表示文字列
function fmtYearDisplay(y) {
  const n = Number(y);
  if (!n) return String(y || '');
  const w = seirekiToWareki(n);
  return w ? `${w.era}${w.n}｜${n}` : String(n);
}
// 保存値を「令和8｜2026」形式に正規化
function normalizeYear(input) {
  const y = parseYearInput(input);
  if (!y) return input || '';
  return fmtYearDisplay(y);
}

// ========================================
// 売約関連ヘルパー
// ========================================
// col が 納車準備以降か
const isDeliveryPhase = col => col === 'delivery' || col === 'done';
// 売約からの経過日数
const daysSinceContract = car => {
  if (!car.contract) return 0;
  const base = car.contractDate || car.purchaseDate;
  return daysSince(base);
};

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
