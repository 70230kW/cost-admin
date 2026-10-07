import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
const root = document.getElementById('root');
if (!root) throw new Error('起動用の要素がありません');
// ビルド時に分岐する。本番にはデモ台帳・架空データを含めない。
const content = import.meta.env.VITE_APP_MODE === 'demo' ? (() => {
  const DemoApp = lazy(() => import('./DemoApp'));
  return <Suspense fallback={<p className="loading">台帳を準備しています…</p>}><DemoApp /></Suspense>;
})() : <div className="production-placeholder"><h1>レンタカー減価償却管理</h1><p>本番モードのGoogle連携は準備中です。</p><footer>最終的な税務判断は顧問税理士にご確認ください</footer></div>;
createRoot(root).render(<StrictMode>{content}</StrictMode>);
