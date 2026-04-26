// ========================================
// theme.js (v0.9.8)
// テーマ切替（ダーク/ライト）＋フォントサイズ切替
// localStorage 保存・起動時復元
// v0.9.8: トップバーのクイックフォントサイズ切替（cycleFontSize）追加
// ========================================

const THEME_KEY = 'carflow_theme';
const FONTSIZE_KEY = 'carflow_fontsize';
const DEFAULT_THEME = 'dark';
const DEFAULT_FONTSIZE = 'md';

// フォントサイズの順序（クイック切替用）
const FONTSIZE_ORDER = ['md', 'lg', 'xl'];
const FONTSIZE_LABELS = { md: '標準', lg: '大', xl: '特大' };

function setTheme(theme) {
  const t = (theme === 'light') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  refreshThemePickerUI();
  if (typeof showToast === 'function') {
    showToast(t === 'light' ? '☀️ ライトテーマに切替えました' : '🌙 ダークテーマに切替えました');
  }
}

function setFontSize(size) {
  const s = FONTSIZE_ORDER.includes(size) ? size : 'md';
  document.documentElement.setAttribute('data-fontsize', s);
  try { localStorage.setItem(FONTSIZE_KEY, s); } catch (e) {}
  refreshFontSizePickerUI();
  refreshTopbarFontSizeLabel();
  if (typeof showToast === 'function') {
    showToast(`🔤 文字サイズ：${FONTSIZE_LABELS[s]}`);
  }
}

// v0.9.8: クイック切替（押すたびに md → lg → xl → md ローテーション）
function cycleFontSize() {
  const cur = document.documentElement.getAttribute('data-fontsize') || DEFAULT_FONTSIZE;
  const idx = FONTSIZE_ORDER.indexOf(cur);
  const next = FONTSIZE_ORDER[(idx + 1) % FONTSIZE_ORDER.length];
  setFontSize(next);
}

function applyStoredThemeAndSize() {
  let theme = DEFAULT_THEME;
  let size = DEFAULT_FONTSIZE;
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') theme = t;
    const s = localStorage.getItem(FONTSIZE_KEY);
    if (FONTSIZE_ORDER.includes(s)) size = s;
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-fontsize', size);
}

function refreshThemePickerUI() {
  const cur = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
  document.querySelectorAll('#theme-picker .theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === cur);
  });
}

function refreshFontSizePickerUI() {
  const cur = document.documentElement.getAttribute('data-fontsize') || DEFAULT_FONTSIZE;
  document.querySelectorAll('#fontsize-picker .fontsize-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.fontsize === cur);
  });
}

// v0.9.8: トップバーのクイックボタンのラベル更新
function refreshTopbarFontSizeLabel() {
  const cur = document.documentElement.getAttribute('data-fontsize') || DEFAULT_FONTSIZE;
  const el = document.getElementById('tb-fontsize-label');
  if (el) el.textContent = FONTSIZE_LABELS[cur] || '標準';
}

// 起動時：保存値を即時適用
applyStoredThemeAndSize();
// DOM ready 後にトップバーのラベルも更新
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', refreshTopbarFontSizeLabel);
} else {
  refreshTopbarFontSizeLabel();
}
