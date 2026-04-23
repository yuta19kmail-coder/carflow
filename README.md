# CarFlow - 車両管理システム

中古車販売店・自動車整備工場向けの車両管理アプリケーション。
仕入れから納車までのフローをカンバン形式で一元管理します。

公開URL: https://yuta19kmail-coder.github.io/carflow/

## 機能

- カンバン形式の車両ステータス管理（仕入れ → 再生中 → 展示中 → 納車準備 → 納車完了）
- 再生・納車ワークフローの詳細チェックリスト
- カレンダー表示（納車予定・マイルストーン・祝日・定休日対応）
- ガントチャート、進捗一覧、展示ビュー、在庫日数ビュー
- 車両詳細モーダル（写真・作業ログ付き）
- ドラッグ＆ドロップによるステータス変更・納車日変更
- データのJSONエクスポート

## ファイル構成

```
carflow/
├── index.html           ← エントリポイント
├── README.md
├── css/                 ← スタイル
│   ├── base.css         （CSS変数・リセット）
│   ├── login.css
│   ├── layout.css       （トップバー・サイドバー・タブ）
│   ├── components.css   （ボタン・ピル・トースト）
│   ├── panels.css       （右サイドパネル）
│   ├── kanban.css       （カンバン・各種ビュー）
│   ├── calendar.css
│   └── modal.css        （モーダル・ワークフロー）
├── data/
│   └── members.js       （メンバーマスタ）
└── js/                  ← ロジック
    ├── config.js        （定数）
    ├── tasks-def.js     （タスク定義）
    ├── state.js         （グローバル状態）
    ├── helpers.js       （汎用ヘルパー）
    ├── progress.js      （進捗計算）
    ├── sample-data.js   （初期サンプルデータ）
    ├── holidays.js      （祝日・定休日）
    ├── auth.js          （ログイン）
    ├── navigation.js    （タブ・パネル切替）
    ├── dashboard.js
    ├── kanban.js
    ├── car-detail.js    （車両詳細モーダル）
    ├── car-modal.js     （登録・編集フォーム）
    ├── workflow.js      （作業ワークフロー画面）
    ├── calendar.js
    ├── views.js         （展示・ガント・進捗・全体・在庫）
    └── main.js          （再描画ディスパッチャ）
```

## 技術スタック

- Vanilla HTML / CSS / JavaScript（フレームワーク非使用）
- 外部依存なし（祝日APIは起動時に1回取得）
- GitHub Pagesでの静的ホスティング

## 開発メモ

- ファイル分割は token 効率・編集容易性のため
- JS読み込み順は `index.html` 下部の `<script>` タグ順（依存関係あり）
- データはメモリ上のみ（リロードでリセット）— 将来的にlocalStorage or バックエンド連携予定
