import { cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const control = isValidElement(children) ? cloneElement(children as ReactElement<{ 'aria-label': string }>, { 'aria-label': label }) : children;
  return <label className="field"><span>{label}</span>{control}{hint && <small>{hint}</small>}</label>;
}
export const yen = (value: number) => `${value.toLocaleString('ja-JP')}円`;
export const methodLabel = { declining: '定率法', straight: '定額法' } as const;
export const bodyLabel = { passenger: '乗用', truck: '貨物', bus: '乗合' } as const;
export const fuelLabel = { gasoline: 'ガソリン', diesel: 'ディーゼル', hybrid: 'ハイブリッド', ev: 'EV', fcv: 'FCV', other: 'その他' } as const;
export const statusLabel = { active: '保有中', sold: '売却済み', disposed: '除却済み' } as const;
