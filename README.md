# レンタカー減価償却管理アプリ

Phase 2のデモ画面です。車両の登録・編集・削除、店舗/クラス/状態の絞り込み、年次/月次償却スケジュール、設定を試せます。架空データだけを使用し、入力はメモリ上に保持します。再読み込みで初期状態に戻ります。

Google認証・スプレッドシート保存・取込/出力・締め・売却操作は未実装です。デモ画面の計算にはPhase 1の独立した `src/domain` を使います。

仕様は [SPEC.md](SPEC.md)、安全性の方針は [SECURITY.md](SECURITY.md)、作業ルールは [AGENTS.md](AGENTS.md) を参照してください。仕様書は現在リポジトリ直下です。

## 開発

Node.js 24（`.nvmrc`）を使います。

```sh
npm ci
npm run dev:demo
```

`npm run dev` は本番モードで、現在はGoogle連携の準備中画面です。デモ台帳は本番ビルドから除外します。
クラウド環境でnpmの既定キャッシュに書き込めない場合は `npm ci --cache /tmp/cost-admin-npm` を使います。

## 検証

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run build:demo
npm run verify:demo
npx playwright install --with-deps chromium
npm run test:e2e
npm audit --audit-level=high
```

クラウドに `/usr/bin/chromium` がある場合、ブラウザの追加導入をせず `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` を実行できます。
計算・入力・メモリ保存の単体テストと、デスクトップ/モバイルの実ブラウザテストを用意しています。`dist/` が本番、`dist-demo/` がデモ出力です。

## デモの確認

- 「車両を登録」で架空車両を入力します。耐用年数は貸自動車業用の区分と中古簡便法で判定します。
- EV・FCVなど自動判定できない車両は手動選択と理由が必須です。一覧には「要確認」を表示します。
- 車名を押すと年次/月次の計算と登録内容を確認できます。「編集する」「車両を削除」も試せます。
- 基準月で月末帳簿価額と当期の見込みを確認します。
- 「設定」で決算月・端数処理などを変えると既存車両の計算も更新します。

端数処理（切り捨て）、売却年度の償却（計上する）、自動ログアウト時間（30分）は人間の確認待ちのデモ専用仮値です。設定で変更できます。自動ログアウト自体はPhase 3で実装します。切り捨てで年額0円になる極小額など、20年度で1円へ収束しない入力はエラーになります。

## PRプレビュー

Firebaseは手元のデモ実行には不要です。PRごとの公開URLが必要な場合は [プレビューの設定手順](docs/PREVIEW_SETUP.md) に従い、プレビュー専用Firebaseを用意します。未設定の間は公開ステップを警告付きでスキップします。
CI・Dependabotは `.github/` にあります。本番公開・mainへの直接push・タグ/リリースは行いません。
