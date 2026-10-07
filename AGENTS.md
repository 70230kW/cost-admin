# AGENTS.md — レンタカー減価償却管理アプリ

Codexが作業のたびに読むルール。**作業を始める前に必ず `docs/SPEC.md`（何を作るか）と `docs/SECURITY.md`（なぜこのルールなのか）を読むこと。**

## プロジェクト概要

- レンタカー事業者が、車両1台ごとに減価償却費・帳簿価額・売却損益を管理するWebアプリ
- 船井総研の支援先（複数社）に提供する
- データは**各社のGoogleドライブにあるスプレッドシート**に保存する。こちら側（GitHub・Firebase・Codex）にはクライアントのデータを一切置かない
- サーバーは持たない。静的サイト（Firebase Hosting）からブラウザが直接GoogleのAPIを呼ぶ

## コミュニケーション

- 報告、PRの説明、コードコメントは日本語で書く
- 画面の文言はすべて日本語にする

## 技術スタック

- 言語はTypeScriptに統一する。ビルドや補助のスクリプトもTypeScript（Node）で書き、Pythonなど別の言語を混ぜない
  - 理由：サーバーを持たずブラウザだけで動く構成なので、ブラウザが直接実行できる言語が必要。また、金額計算と外部データの検証で型チェックが効く。使う部品（React、Googleのログイン・Picker、Firebase Hosting）もすべてこの言語が前提になっている
- Vite + React + TypeScript（`strict: true`）
- Tailwind CSS
- Vitest（テスト）、ESLint
- date-fns（日付）、Recharts（グラフ）
- Google Identity Services（ログイン）、Google Sheets API／Drive API／Google Picker（保存とファイル選択）
- papaparse ＋ encoding-japanese（CSV）、exceljs（Excel）
  - npmの `xlsx`（SheetJS 0.18.5）は更新が止まっていて既知の脆弱性があるため使わない

## コマンド

```
npm ci              # 依存のインストール（package-lock.json どおり）
npm run dev         # 開発サーバー（本番モード。Google連携あり）
npm run dev:demo    # 開発サーバー（デモモード。Googleに接続しない）
npm run lint
npm run typecheck
npm test
npm run build       # 本番モードのビルド
npm run build:demo  # デモモードのビルド（PRプレビュー用）
```

## ディレクトリ構成

```
src/
  domain/            償却計算（純粋関数のみ。React・Google API・現在時刻に依存しない）
    rates.ts         償却率テーブル
    usefulLife.ts    法定耐用年数の判定、中古の簡便法
    fiscal.ts        事業年度・月数の計算
    depreciation.ts  定率法・定額法のスケジュール（年次・月次）
    disposal.ts      売却・除却、売却シミュレーション
    __tests__/
  data/              保存先の切り替え
    repository.ts    共通インターフェース
    demo/            デモモード用（メモリ上・架空データ）
    sheets/          Googleスプレッドシート用
  auth/              Googleログイン、自動ログアウト
  features/          画面ごと（ledger / dashboard / vehicles / reports / plan / history / closing / settings）
  components/        共通UI
  test/fixtures/     テスト・デモ用の架空データ
```

## 作業の進め方

1. 1回のタスクで1フェーズだけ進める（`docs/SPEC.md` の「実装の順番」）。範囲外の変更はしない
2. 計算ロジックは `src/domain` に置き、テストと一緒に書く
3. `docs/SPEC.md` の「テスト用の正解値」は人間が検算済み。テストが落ちたら**実装を直す**。期待値は書き換えない。期待値が間違っていると思ったら、理由を書いて作業を止める
4. 金額は整数の円で持つ。率は小数ではなく整数の分数（`667/1000`、保証率は `11089/100000`）で持ち、「掛け算→割り算→端数処理」の順で計算する
5. 日付は `'YYYY-MM-DD'`、年月は `'YYYY-MM'` の文字列で持つ。`src/domain` の中で現在時刻を取らない。基準日は引数で受け取る
6. 作業の最後に `npm run lint`、`npm run typecheck`、`npm test`、`npm run build`、`npm run build:demo` がすべて通ることを確認する
7. `docs/SPEC.md` の「人間の確認待ち」は勝手に決めない。仮の値で実装するときは設定で変えられるようにして、PRに書く
8. mainブランチへ直接pushしない。変更は必ずPRで出す。タグとリリースは作らない（本番公開は人間が行う）

## セキュリティのルール（必ず守る）

理由と詳細は `docs/SECURITY.md` にある。

### データ

- 実在する会社・車両・金額のデータをリポジトリに入れない。テストとデモで使うのは架空のデータだけにする（登録番号は「見本 300 わ 0001」、店舗名は「テスト店」のように、一目で架空とわかる形にする）
- 財務データ（車両、金額、変更履歴）とメールアドレスを、localStorage・sessionStorage・IndexedDB・Cookieに保存しない。メモリ上だけで持つ。ブラウザに保存してよいのは「最後に開いた台帳のファイルID」と表示設定（並び順など）だけ
- 本番ビルドでは、財務データ・メールアドレス・トークンを `console` に出さない

### 認証と通信

- Googleのアクセストークンはメモリ上だけで持つ。保存しない、URLに載せない、ログに出さない
- 要求するGoogleの権限（スコープ）は `https://www.googleapis.com/auth/drive.file`、`openid`、`email` の3つだけ。これ以外は追加しない
- 新しい外部ドメインへの通信、外部スクリプト、CDN、解析ツール（アクセス解析、エラー収集など）を追加しない
- スプレッドシートへの書き込みは必ず `valueInputOption: 'RAW'` を使う（入力値を数式として解釈させない）
- デモモードのビルドには、Googleに接続するコードを含めない

### コード

- `dangerouslySetInnerHTML`、`eval`、`new Function`、`innerHTML` への代入は使わない
- 外部から来た値（CSV、Excel、スプレッドシート、URL）は、使う前に必ず検証する（型、範囲、必須項目）
- CSVやExcelに出力するとき、`=` `+` `-` `@` タブ・改行で始まる文字列セルには先頭に `'` を付ける（数式インジェクション対策）
- 閲覧権限しかない人が、データを変更できる経路を作らない（画面で隠すだけでなく、保存処理の側でも止める）

### 秘密情報

- APIキー、サービスアカウントの鍵、トークンをコードやコミットに含めない
- `VITE_` で始まる環境変数は、ビルド後にブラウザから誰でも見られる。公開してよい値（OAuthクライアントID、制限付きのPicker用APIキー、Google Cloudのプロジェクト番号）だけを置く
- `.env.local` はコミットしない（`.gitignore` に入れる）

### 依存パッケージ

- 追加は最小限にする。追加するときは、PRに「なぜ必要か」「週間ダウンロード数」「最終更新日」を書く
- `package-lock.json` を必ずコミットする。CIでは `npm ci` を使う

### 人間の確認が必要な変更

次のファイルや領域を変えるときは、PRタイトルの先頭に `⚠️` を付け、説明の最初に何を変えたかを書く。

- `.github/` 以下（CI、デプロイ、Dependabotの設定）
- `firebase.json`（セキュリティヘッダー、公開設定）
- 認証と権限まわり（`src/auth/`、Googleのスコープ、閲覧／編集の判定）
- 新しい依存パッケージの追加
- `AGENTS.md`、`docs/SECURITY.md`

## PRの書き方

日本語で、次の項目を書く。

```
## 変更内容
（3行以内）

## プレビューでの確認手順
（どの画面で何を操作し、何が表示されればOKか）

## テスト
（追加したテストと、全体の結果）

## セキュリティへの影響
なし ／ あり：（内容）

## 仮置きした値
（「人間の確認待ち」の項目を仮の値で実装した場合）
```
