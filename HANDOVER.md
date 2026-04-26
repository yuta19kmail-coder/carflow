# CarFlow 引継ぎプロンプト（v0.8.6 時点）

このドキュメントを次のセッションの最初に貼り付けてください。続きから作業できます。

---

## 0. プロジェクト概要

**CarFlow** は中古車販売店・自動車整備工場向けの車両管理 Web アプリ（HTML+CSS+vanilla JS、フレームワーク不使用）。
ユーザー（ゆうた）は中古車販売・整備工場の3代目経営者兼工場長。社員15名、年商3億円規模。
Youtube 2万人チャンネル運営（修理・工具系）、簡単なタレント業も。

- **作業ルートフォルダ**：`C:\Users\TI-FU\Desktop\アプリ開発\Claud作業フォルダ\carflow`
- **エントリポイント**：`index.html`
- **現在バージョン**：**v0.8.6**
- **当面の方針**：**「自社で本格的に使えるのが先行」**。設定化（マイルストーン編集UI、タスク手順カスタム）は当面ナシ。コード直編集で運用。

---

## 1. 必読ドキュメント

セッション開始時、まず以下を `Read` ツールで読むこと：

1. **`carflow/HANDOVER.md`** — このファイル
2. **`carflow/NAMING.md`** — 名称辞書（UI ラベル・内部 ID・用語定義の正典）
3. **`carflow/index.html`** — エントリ。ログイン画面 + メインアプリの構造、CSS/JS 読み込み順
4. **`carflow/js/kanban.js`** — 車両カード描画 + DnD + 売約／取消／納車完了フロー
5. **`carflow/js/calendar.js`** — 納車カレンダー描画
6. **`carflow/js/views.js`** — 展示・ガント・進捗・全体一覧・在庫
7. **`carflow/js/state.js`** — グローバル状態（cars 配列, exhibitSort, appSettings 等）
8. **`carflow/js/tasks-def.js`** — REGEN_TASKS / DELIVERY_TASKS
9. **`carflow/js/config.js`** — COLS / SCHED_POINTS / SIZES_DEFAULT / pillMap

---

## 2. 環境上の重要な注意点

### 2-1. virtiofs バグ（最重要・頻発）

ファイル書き込み時、**Edit / Write ツールが原文の元バイト数で勝手に切り詰める** ことが頻発。
特に **index.html の末尾の `<script>` タグが消える**。これでログインできなくなる事故が複数回発生。

**対策ルール（必ず守る）**：

1. CSS/JS を大きく書き換える時は **bash の heredoc** を使う：
   ```bash
   cat > /sessions/<sess>/mnt/carflow/js/foo.js <<'EOF'
   （全文）
   EOF
   node --check /sessions/<sess>/mnt/carflow/js/foo.js && echo OK
   ```
2. **書き込み後は必ず `node --check` でシンタックスチェック**
3. **index.html を編集したら必ず `grep -c "script src" index.html` で 19個ある か確認**
4. **末尾の `</body></html>` まで届いてるか `tail -3 index.html` で確認**
5. 末尾欠損が起きたら `head -N` + heredoc で再構築するが、**N の指定で間の行が消えやすい** ので、grep で全 script 行を確認してから補修する

### 2-2. パスマッピング

| ツール経由（Read/Write/Edit） | bash 経由 |
|---|---|
| `C:\...\carflow\foo.js` | `/sessions/<sess>/mnt/carflow/foo.js` |

セッションごとに `<sess>` 部分が変わるので、初回に `request_cowork_directory` でフォルダ接続→マッピングを確認。

### 2-3. キャッシュバスティング

CSS/JS を変更したら **必ずバージョンを上げる**：

```bash
cd /sessions/<sess>/mnt/carflow
sed -i 's/v=086/v=087/g; s/v0\.8\.6/v0.8.7/g' index.html
```

更新箇所：
- `index.html` 上部 CSS link の `?v=NNN`（9つ）
- `index.html` 各 script src の `?v=NNN`（19個）
- `index.html` トップバーの `<span>v0.8.x</span>`
- `index.html` ログイン画面の `<div class="login-ver">CarFlow v0.8.x</div>`

### 2-4. CSS ファイル一覧（9つ）

`base.css / login.css / layout.css / components.css / panels.css / kanban.css / calendar.css / modal.css / celebrate.css`

### 2-5. JS ファイル読み込み順（19個・崩れたら再構築）

```
config.js → tasks-def.js → state.js → helpers.js → progress.js
→ sample-data.js → holidays.js → auth.js → navigation.js → archive.js → settings.js
→ dashboard.js → kanban.js → car-detail.js → car-modal.js → workflow.js → calendar.js → views.js
→ main.js
```

### 2-6. index.html 末尾の起動スクリプト（必須）

```html
<script>
  if (typeof makeSampleCars === 'function') {
    window.cars = makeSampleCars();
  }
  if (typeof appSettings !== 'undefined' && appSettings.goals && !appSettings.goals.monthly) {
    appSettings.goals.monthly = {};
  }
  calYear = new Date().getFullYear();
  calMonth = new Date().getMonth();
  if (typeof fetchJpHolidays === 'function') {
    fetchJpHolidays().then(() => {
      if (typeof renderCloseMonthOptions === 'function') renderCloseMonthOptions();
    }).catch(() => {});
  }
</script>
</body>
</html>
```

これが消えるとログインできなくなる（`doLogin` 自体は auth.js だが、サンプルデータ生成・カレンダー初期化が走らずカード DnD 等が壊れる）。

---

## 3. ユーザーとのやり取り方針

- **ゆうたさんはデザイン感覚が鋭い**。実装前に「こうしたい」を画像 or 指示書で共有してくれる。**勝手にレイアウト変えず、必ずすり合わせてから実装**
- 質問は **A/B/C 選択肢形式** にすると返答が速い
- 「変わってない」「バグってる」と言われたら、まずキャッシュバスター（`?v=`）を確認
- 細かい調整→一気に書き換え、ではなく **小刻みに確認** が好まれる
- バージョンは 1機能修正 = 1 リリースで上げる（v0.8.6 → v0.8.7）

---

## 4. 直近の作業履歴（v0.7.8 → v0.8.6）

### v0.7.9 〜 v0.8.2：納車カレンダー大型改修

- タブ名「カレンダー」→「📅 納車カレンダー」
- 年月見出しダークグレー塗り＋白字
- 画面スクロール修正
- 定休日に斜線オーバーレイ（祝日と被ってもわかる）
- 完了マイルストーンに打ち消し線
- 警告カードを1車種1個に重複排除（直近の未完了マイルストーン）
- バー1本化＋マイルストーン色分け（最初/最後だけ角丸、途中一直線）
- 2か月連続表示（当月＋翌月）
- 警告カードをカレンダー上部に配置
- 「今月」ボタン追加
- バー上ラベルをマイルストーン日（セグメント末尾）に右寄せ表示

### v0.8.3：起動時画面のバグ修復

- index.html の末尾欠損（virtiofs バグ）を修復
- 起動スクリプト（サンプル生成・カレンダー初期化・祝日取得）を復元

### v0.8.4：カンバン売約・取消フロー全面修正

- 「売約POPでキャンセル押しても移動が実行されてしまう」バグ修正
- 仕入れ/再生中/展示中 → 納車準備：売約POP → キャンセルで何もしない、OKで売約データ設定＆移動
- 納車準備/納車完了 → それより前の列：「売約をキャンセルしますか？」POP（赤ボタン）→ OKで売約・納車準備データを完全リセット
- 納車完了 → 納車準備：「納車完了を取り消しますか？」POP → OKで col のみ delivery に戻す（売約は保持）

### v0.8.5：納車完了フロー＋祝福演出

- 仕入れ/再生中/展示中 → 納車完了：特例フロー（売約POP → OKで一気に done + 演出）
- 納車準備 → 納車完了：「この車両を『納車完了』にしますか？」POP → OKで done + 演出
- **祝福演出**：紙吹雪120片＋中央カード「🎉 納車完了！おつかれさまでした！」3秒で自動フェードアウト
  - 新規 `css/celebrate.css`、kanban.js に `celebrateDelivery(car)` 関数

### v0.8.5b：holidays.js / auth.js 復旧

- v0.8.5 の末尾欠損で消えた `holidays.js` / `auth.js` の script タグを復元

### v0.8.6：展示ビュー全面リニューアル

- **ストック車両列**（最左、青み背景）：仕入れ＋再生中をサイズ問わず一括
- **ボディサイズ別列**：SIZES の全区分、0台でも列を表示
- **上部一括ソートバー**：💰金額 / 📦在庫日数 / 📅年式（クリックで▲▼トグル、青ハイライト）
- **ヘッダー**：大きな台数表示＋展示中列のみ全体％
- **カード**：写真・車体色・年式・走行距離・金額・在庫日数バッジ（進捗情報ナシ）
- 合計表示（右上）：「ストック X台 / 展示中 Y台」
- state.js に `exhibitSort = {key:'invDays', dir:'desc'}` 追加

---

## 5. 次にやる候補（優先順なし、ゆうたさんから指示待ち）

### A. 残課題（過去の引継ぎ宿題）

1. **カンバン列の内部 ID 統一**：`purchase` vs `stock` の混在 → `purchase` に統一
   - 現状：`kanban.js` の `bottomBar` 判定で `if (car.col === 'purchase' || car.col === 'stock' || car.col === 'regen')` のように両方見てる
   - 影響箇所を grep で洗って `purchase` 一本化
2. **タブ絵文字 📦 の被り整理**：「月次集計締め(📦)」と「在庫日数(📦)」

### B. 設定化（保留中、いつかやる）

「マイルストーン名・◯日前・タスク手順」の設定UI化。データモデルが深いので、**実運用しながら本当に必要な範囲を見極めてから** 着手する方針。

### C. 他のビュー改善

ガント・進捗・全体一覧・在庫日数 はまだ古い構造のまま。展示ビューと同レベルに磨くか、ゆうたさん次第。

---

## 6. 設計の重要ポイント

### 6-1. 列遷移と売約フロー

```
仕入れ ─┬─→ 納車準備 ─→ 納車完了
        │   (売約POP)   (完了POP+演出)
再生中 ─┤              ↑
        │              └─ 戻り：取消POP（売約は保持）
展示中 ─┘
        │
        └─→ 納車完了（特例：売約POP→OKで一気＋演出）

納車準備/納車完了 → 仕入れ/再生中/展示中
   = 売約キャンセルPOP → OKで売約データ完全リセット
```

### 6-2. メモの2種類

| 種別 | プロパティ | 性質 | UI 配置 |
|---|---|---|---|
| **コアメモ** | `car.memo` | 車両情報。フェーズが変わっても残る | 詳細モーダル：編集ボタンの上 |
| **作業メモ** | `car.workMemo` | フェーズ中の申し送り。納車準備で自動クリア | 詳細モーダル：タスク一覧の下（タップ編集可）|

### 6-3. カード下段帯ルール（カンバン）

| カラム | 表示 |
|---|---|
| 仕入れ・再生中 | 「仕入れから N 日」（グレー）|
| 展示中 | 帯なし |
| 納車準備 | 「納車まで N 日」（青→3日以内オレンジ→当日/超過は赤）|
| 納車完了 | 帯なし |

### 6-4. マイルストーンと業務タスクの対応（コード固定）

| マイルストーン（SCHED_POINTS） | 完了判定 |
|---|---|
| 📄 書類作成完了（5日前）| `d_docs` ON |
| 🔧 整備完了（3日前）| `d_maint` 全項目完了 |
| 📝 登録完了（2日前）| `d_reg` ON |
| ✅ 完全完成（1日前）| `d_prep` 全項目完了 |
| 🚗 納車日（0日）| `car.col === 'done'` |

`calendar.js` の `isMilestoneDone(car, offset)` で判定。

### 6-5. 在庫日数の警告色（3段）

緑 (`dg`) → 橙 (`dw`, 30日〜) → 赤 (`dr`, 45日〜)
閾値は設定パネルで調整可能（`appSettings.invWarn`）。

### 6-6. 展示ビューのソート

- `state.js` の `exhibitSort = {key, dir}` で保持
- key: `'price'|'invDays'|'year'`、dir: `'asc'|'desc'`
- 同じボタンクリックで dir 反転、違うボタンで key 切替＋dir='desc' 初期化

---

## 7. ファイル構成

```
carflow/
├── index.html               ← エントリ（末尾 script 19個＋起動スクリプト必須）
├── HANDOVER.md              ← このファイル
├── NAMING.md                ← 名称辞書
├── README.md
├── css/
│   ├── base.css
│   ├── login.css
│   ├── layout.css
│   ├── components.css
│   ├── panels.css           ← 設定アコーディオン、ダッシュボード
│   ├── kanban.css           ← 車両カード、展示ビュー
│   ├── calendar.css         ← 納車カレンダー
│   ├── modal.css
│   └── celebrate.css        ← 納車完了の祝福演出（v0.8.5 で追加）
└── js/
    ├── config.js            ← COLS / SIZES_DEFAULT / SCHED_POINTS / pillMap / WEEK
    ├── tasks-def.js         ← REGEN_TASKS / DELIVERY_TASKS
    ├── state.js             ← cars, exhibitSort, appSettings, グローバル状態
    ├── helpers.js           ← daysSince / 警告色関数 / 年式変換 / 定休日判定
    ├── progress.js          ← calcProg / calcSingleProg
    ├── sample-data.js
    ├── holidays.js          ← 祝日取得・休業日管理
    ├── auth.js              ← doLogin / doLogout
    ├── navigation.js        ← showPanel / switchTab
    ├── archive.js           ← 月次集計締め
    ├── settings.js          ← 設定パネルの各エディタ
    ├── dashboard.js
    ├── kanban.js            ← カード描画 + DnD + 売約/取消/納車完了 + 祝福演出
    ├── car-detail.js        ← 詳細モーダル
    ├── car-modal.js         ← 車両編集モーダル
    ├── workflow.js          ← ワークフロー画面
    ├── calendar.js          ← 納車カレンダー（2か月＋1本バー）
    ├── views.js             ← 展示／ガント／進捗／全体一覧／在庫
    └── main.js              ← renderAll ディスパッチャ
```

---

## 8. このプロンプトの使い方

新セッション開始時、ゆうたさんが最初のメッセージにこう書く想定：

> 引継ぎです。`C:\Users\TI-FU\Desktop\アプリ開発\Claud作業フォルダ\carflow\HANDOVER.md` と `NAMING.md` を読んでから返事してください。

新エージェントは：
1. `request_cowork_directory` でフォルダ接続
2. `Read` で `HANDOVER.md` と `NAMING.md` を順に読む
3. 「読みました。現在 v0.8.6。次は◯◯から進めますか？」と確認
4. ゆうたさんの返答を待ってから実装

---

## 9. 最後に：virtiofs バグ対策チェックリスト

毎回の編集後に必ず：

- [ ] `node --check js/<変更ファイル>.js` でシンタックスエラーなし
- [ ] `grep -c "script src" index.html` で **19** が返る
- [ ] `tail -3 index.html` で `</body></html>` が見える
- [ ] CSS/JS 変更時は `?v=NNN` を上げた（CSS link 9個・script 19個）
- [ ] トップバーとログイン画面の `v0.x.x` も上げた

これだけで「ログインできなくなった」事故は防げる。

---

最終更新：v0.8.6 / 展示ビュー大型リニューアル完了
