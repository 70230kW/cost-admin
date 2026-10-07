import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Phase 1 はビルドの土台のみ。業務画面は Phase 2 で実装する。
const root = document.getElementById('root');
if (!root) throw new Error('起動用の要素がありません');
createRoot(root).render(<StrictMode>{null}</StrictMode>);
