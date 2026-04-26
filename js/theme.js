// ========================================
// theme.js (v0.9.6)
// テーマ切替（ダーク/ライト）＋フォントサイズ切替
// localStorage 保存・起動時復元
// ========================================

const THEME_KEY = 'carflow_theme';
const FONTSIZE_KEY = 'carflow_fontsize';
const DEFAULT_THEME = 'dark';
const DEFAULT_FONTSIZE = 'md';

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
  const s = ['md','lg','xl'].includes(size) ? size : 'md';
  document.documentElement.setAttribute('data-fontsize', s);
  try { localStorage.setItem(FONTSIZE_KEY, s); } catch (e) {}
  refreshFontSizePickerUI();
  if (typeof showToast === 'function') {
    const label = s === 'xl' ? '特大' : s === 'lg' ? '大' : '標準';
    showToast(`🔤 文字サイズ：${label}`);
  }
}

function applyStoredThemeAndSize() {
  let theme = DEFAULT_THEME;
  let size = DEFAULT_FONTSIZE;
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'light' || t === 'dark') theme = t;
    const s = localStorage.getItem(FONTSIZE_KEY);
    if (['md','lg','xl'].includes(s)) size = s;
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

// 起動時に即時適用（チラつき防止）
applyStoredThemeAndSize();
