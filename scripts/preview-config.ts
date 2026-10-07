import { appendFileSync } from 'node:fs';
const project = process.env.FIREBASE_PROJECT_ID_PREVIEW;
const credentialPresent = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PREVIEW);
const configured = Boolean(project && credentialPresent);
if (project && !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project)) throw new Error('プレビュー用FirebaseプロジェクトIDの形式が不正です');
if (!configured) process.stdout.write('::warning::プレビュー未公開：GitHub Variable FIREBASE_PROJECT_ID_PREVIEW と Secret FIREBASE_SERVICE_ACCOUNT_PREVIEW を設定してください。\n');
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `configured=${configured}\n`);
