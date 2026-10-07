# Phase 2 のデモプレビュー

デモ画面を手元で使うだけなら Firebase は不要です。Node.js 24で `npm ci` と `npm run dev:demo` を実行してください。

PRごとのURLを作る場合は仕様書のプレビュー用Firebaseプロジェクトが必要です。本番用とは別にし、ここには架空データのデモビルドだけを公開します。

## 人間が行う準備

1. プレビュー専用のFirebaseプロジェクトを作り、Hostingを有効にします。
2. このプロジェクトだけの「Firebase Hosting 管理者」権限を持つサービスアカウントを用意します。
3. サービスアカウントJSONをGitHubリポジトリの Actions Secret `FIREBASE_SERVICE_ACCOUNT_PREVIEW` に登録します。チャット・リポジトリ・Codex環境へ鍵の内容を置かないでください。
4. Actions Variable `FIREBASE_PROJECT_ID_PREVIEW` にプレビュー用プロジェクトIDを登録します。
5. PRのCIワークフロー（デモプレビュージョブ）を再実行します。公開が成功するとPRにURLがコメントされます。チャネルは `pr-<PR番号>`、有効期限は7日です。

`firebase.json` は `dist-demo` だけを公開し、外部通信とGoogle接続をCSPで禁止します。`npm run verify:demo` でモード表示・本番との分離・Google通信先の混入がないことを検査します。プレビュー用の設定は本番には流用しません。

CIのlint・型チェック・単体/E2Eテスト・ビルド・audit・gitleaksがすべて成功してから公開ジョブを実行します。

未設定の間はワークフローが警告を表示して公開ステップをスキップします。チェック成功は「公開済み」を意味しません。ForkのPRはSecretを使う公開ジョブを実行しません。liveチャネル・本番公開・タグ・リリースは扱いません。
