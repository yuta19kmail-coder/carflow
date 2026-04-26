// ========================================
// help.js
// ヘルプモーダルの開閉とタブ切替
// 内容は仮（v0.8.7時点）。社内ITリテラシーが高くないユーザー向けの平易な日本語。
// ========================================

function openHelp(tabId) {
  const ov = document.getElementById('help-overlay');
  if (!ov) return;
  ov.classList.add('open');
  switchHelpTab(tabId || 'basic');
}

function closeHelp() {
  const ov = document.getElementById('help-overlay');
  if (ov) ov.classList.remove('open');
}

function switchHelpTab(id) {
  document.querySelectorAll('.help-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === id);
  });
  document.querySelectorAll('.help-section').forEach(s => {
    s.classList.toggle('active', s.dataset.tab === id);
  });
}

// オーバーレイ外側クリックで閉じる
document.addEventListener('click', function(e) {
  const ov = document.getElementById('help-overlay');
  if (!ov || !ov.classList.contains('open')) return;
  if (e.target === ov) closeHelp();
});
