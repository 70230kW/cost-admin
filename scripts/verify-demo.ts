import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
function texts(directory: string): string {
  return readdirSync(directory, { withFileTypes: true }).map(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? texts(path) : /\.(js|html|css)$/.test(entry.name) ? readFileSync(path, 'utf8') : '';
  }).join('\n');
}
const demo = texts('dist-demo');
const production = texts('dist');
const banner = 'デモモード（入力内容は保存されません）';
if (!demo.includes(banner)) throw new Error('デモビルドにモード表示がありません');
if (production.includes(banner) || production.includes('見本コンパクト')) throw new Error('本番ビルドにデモが混入しています');
for (const domain of ['accounts.google.com', 'apis.google.com', 'docs.google.com', 'sheets.googleapis.com', 'www.googleapis.com', 'oauth2.googleapis.com']) {
  if (demo.includes(domain)) throw new Error('デモビルドにGoogle通信先が含まれています');
}
const firebase = JSON.parse(readFileSync('firebase.json', 'utf8')) as { hosting: { public: string } };
if (firebase.hosting.public !== 'dist-demo') throw new Error('プレビューの公開先がデモビルドではありません');
process.stdout.write('デモ表示・Google通信先なし・本番との分離・プレビュー公開ディレクトリを確認しました\n');
