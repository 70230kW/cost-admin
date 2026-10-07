# ⚠️ Phase 1：開発基盤・償却計算・CIを追加

## 変更内容

Vite・React・TypeScript・Vitest・ESLintの基盤、新規依存、CIとDependabotを追加しました。
`src/domain` に法定耐用年数・中古簡便法・年次/月次償却・売却/除却の純粋計算を実装しました。
業務UI・Google連携・保存・デプロイは追加していません。

## プレビューでの確認手順

`npm ci` 後、`npm run dev:demo` または `npm run dev` で起動します。
Phase 1の画面は空で、HTTP応答とReact起動モジュールを確認できます。業務画面の確認は Phase 2 以降です。
計算は `npm test` で確認してください。

## テスト

- lint・strict型チェック・49件のVitest・本番/デモビルド：すべて成功。
- 仕様書11章A〜E・中古6例・車種分類の正解値を変更せず検証。
- 月次合計、備忘価額、改定取得価額の固定、月割り前の保証判定、切り上げ、日付・入力境界、売却・除却も検証。
- `npm ci --cache /tmp/cost-admin-npm` でロックファイルからの導入を確認。
- `npm audit --audit-level=high`：脆弱性0件。
- gitleaks 8.24.3（公開チェックサム検証済み）：作業ツリーと既存Git履歴で検出0件。
- 両開発モードでHTMLとReact起動モジュールのHTTP応答を確認。
- GitHub上のワークフロー自体は未実行です。

## セキュリティへの影響

あり：新規依存と `.github/` の追加は人間のレビュー対象です。依存の理由と固定版公開日は [DEPENDENCIES.md](DEPENDENCIES.md) に記録しました。週間ダウンロード数は npm Downloads API が403を返すため未取得です。
Actions は実際のタグから確認したSHAで固定、CI権限は `contents: read`、チェックアウト認証の永続化は無効です。実データ・Secrets・外部通信を行うアプリコード・デプロイ権限を追加していません。gitleaks が使うのはGitHubの自動発行 `GITHUB_TOKEN` です。
Dependabot alerts/security updates の有効化はGitHub設定で人間が行う必要があります。

## 仮置きした値

なし。端数処理・売却年度の償却は必須引数です。EV/FCVは自動判定不可を返します。税務判断待ちの値を固定していません。
切り捨てで年額が0円になる極小額など、20事業年度で1円まで収束しない入力はエラーになります。変則決算は対象外です。
