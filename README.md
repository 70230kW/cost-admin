# レンタカー減価償却管理アプリ

Phase 1：Vite + React + TypeScript の土台と、独立した償却計算ライブラリです。
業務画面・Google接続・データ保存・デプロイは未実装です。

仕様は [SPEC.md](SPEC.md)、安全性の方針は [SECURITY.md](SECURITY.md)、作業ルールは [AGENTS.md](AGENTS.md) を参照してください。現在これらはリポジトリ直下にあります。

## 開発

Node.js 24（`.nvmrc`）を使います。依存は `package-lock.json` で固定しています。

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run build:demo
```

書き込み可能な npm キャッシュが必要です。クラウド環境で既定のキャッシュが使えない場合は `npm ci --cache /tmp/cost-admin-npm` とします。

`npm run dev` は本番モード、`npm run dev:demo` はデモモードの開発サーバーです。Phase 1 の画面は空です。本番ビルドは `dist/`、デモビルドは `dist-demo/` に出力します。両モードとも現在は外部通信を行いません。

## 計算

`src/domain` は React・Google API・現在時刻から独立した純粋関数です。

- `rates.ts`：2〜6年の整数分数による償却率。BigInt の中間計算で整数精度を維持します。
- `usefulLife.ts`：貸自動車業用の法定耐用年数、中古車の簡便法。
- `fiscal.ts`：日付検証、事業年度、経過月数。
- `depreciation.ts`：年次・月次スケジュール。月次端数は最後の月に寄せます。
- `disposal.ts`：売却・除却シミュレーションの計算のみ。

`depreciationSchedule` に取得日・事業供用日・取得価額・耐用年数・償却方法と、決算月・端数処理・売却年度の償却の有無を渡します。中古の耐用年数は `usedUsefulLife` で事前計算します。EV・FCVなど自動判定できない車両は `legalUsefulLife` が `null` を返し、人間による耐用年数の選択が必要です。未確定の設定にデフォルト値を設けていません。

取得日は2012年4月1日以降、金額は安全な整数の円に限定します。切り捨てで年額が0円になる極小額など、20事業年度以内に1円まで償却できない入力は明示的にエラーになります。変則決算・対象外の取得日・耐用年数は扱いません。

## CI

PRと main へのpushで lint・型チェック・49件の計算テスト・両モードのビルド・high以上の npm audit・gitleaks を実行します。外部ActionsはSHA固定、権限は `contents: read`、デプロイはありません。Dependabot は npm と GitHub Actions を週次確認します。

Dependabot alerts/security updates の有効化は GitHub Settings で人間が行います。gitleaks-action は個人リポジトリではライセンス不要です。Organizationへ移行する場合は SECURITY.md に従ってライセンス設定が必要です。
