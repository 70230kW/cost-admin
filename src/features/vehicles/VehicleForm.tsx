import { useState, type SubmitEvent } from 'react';
import type { Vehicle, Settings } from '../../data/repository';
import { parseVehicle } from '../../data/validation';
import { legalUsefulLife, usedUsefulLife } from '../../domain/usefulLife';
import { Field, bodyLabel, fuelLabel, methodLabel } from '../../components/Field';

export function VehicleForm({ vehicle, settings, onSave, onCancel }: {
  vehicle?: Vehicle; settings: Settings; onSave: (vehicle: Vehicle) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({
    plateNumber: vehicle?.plateNumber ?? '', storeName: vehicle?.storeName ?? 'テスト店',
    vehicleClass: vehicle?.vehicleClass ?? 'S', carName: vehicle?.carName ?? '',
    bodyType: vehicle?.bodyType ?? 'passenger', fuelType: vehicle?.fuelType ?? 'gasoline',
    displacementCc: String(vehicle?.displacementCc ?? ''), maxLoadKg: String(vehicle?.maxLoadKg ?? ''),
    firstRegistrationYm: vehicle?.firstRegistrationYm ?? '', acquisitionDate: vehicle?.acquisitionDate ?? '',
    inServiceDate: vehicle?.inServiceDate ?? '', acquisitionCost: String(vehicle?.acquisitionCost ?? ''),
    method: vehicle?.method ?? settings.defaultMethod, overrideYears: String(vehicle?.usefulLifeOverride?.years ?? ''),
    overrideReason: vehicle?.usefulLifeOverride?.reason ?? '', memo: vehicle?.memo ?? '',
  });
  const [isUsed, setIsUsed] = useState(vehicle?.isUsed ?? false);
  const [error, setError] = useState('');
  const update = (name: string, value: string) => setDraft(previous => ({ ...previous, [name]: value }));
  const input = (name: string, type = 'text', required = true, props: Record<string, string | number> = {}) =>
    <input name={name} type={type} value={draft[name] ?? ''} onChange={e => update(name, e.target.value)} required={required} maxLength={100} {...props} />;
  const select = (name: string, options: Record<string, string>) =>
    <select name={name} value={draft[name] ?? ''} onChange={e => update(name, e.target.value)}>{Object.entries(options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>;
  const number = (name: string): number | undefined => {
    const value = (draft[name] ?? '').trim();
    if (!value) return undefined;
    if (!/^\d+$/.test(value)) throw new Error('金額・排気量・積載量は整数で入力してください');
    return Number(value);
  };
  let automatic: string = '要確認：耐用年数を手動で選択してください';
  try {
    const legal = legalUsefulLife({ bodyType: draft.bodyType as Vehicle['bodyType'], fuelType: draft.fuelType as Vehicle['fuelType'],
      ...(number('displacementCc') !== undefined ? { displacementCc: number('displacementCc')! } : {}),
      ...(number('maxLoadKg') !== undefined ? { maxLoadKg: number('maxLoadKg')! } : {}),
    });
    if (legal !== null) automatic = isUsed && draft.firstRegistrationYm && draft.inServiceDate
      ? `自動判定：${usedUsefulLife(legal, draft.firstRegistrationYm, draft.inServiceDate.slice(0, 7))}年（中古簡便法）`
      : `自動判定：${legal}年${isUsed ? '（中古の年月を入力してください）' : ''}`;
  } catch { automatic = '自動判定に必要な値・年月を確認してください'; }
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = parseVehicle({
        ...draft, id: vehicle?.id ?? crypto.randomUUID(), status: vehicle?.status ?? 'active', isUsed,
        displacementCc: number('displacementCc'), maxLoadKg: number('maxLoadKg'), acquisitionCost: number('acquisitionCost'),
        firstRegistrationYm: draft.firstRegistrationYm || undefined,
        ...(draft.overrideYears ? { usefulLifeOverride: { years: Number(draft.overrideYears), reason: draft.overrideReason } } : {}),
        ...(vehicle?.disposalDate ? { disposalDate: vehicle.disposalDate, salePrice: vehicle.salePrice } : {}),
      });
      onSave(result);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '入力を確認してください'); }
  }
  return <section className="panel"><div className="panel-heading"><div><p className="eyebrow">車両情報</p><h2>{vehicle ? '車両を編集' : '車両を登録'}</h2></div><button type="button" className="secondary" onClick={onCancel}>キャンセル</button></div>
    <p className="muted">架空データだけを入力してください。金額は税抜・整数の円です。</p>
    <form onSubmit={submit}>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="form-grid">
        <Field label="登録番号">{input('plateNumber', 'text', true, { placeholder: '見本 300 わ 0004' })}</Field>
        <Field label="店舗">{input('storeName')}</Field>
        <Field label="クラス">{input('vehicleClass')}</Field>
        <Field label="車名・型式">{input('carName', 'text', true, { placeholder: '見本コンパクト' })}</Field>
        <Field label="車体">{select('bodyType', bodyLabel)}</Field>
        <Field label="燃料">{select('fuelType', fuelLabel)}</Field>
        <Field label="排気量（cc）">{input('displacementCc', 'number', false, { min: 0, step: 1 })}</Field>
        <Field label="最大積載量（kg）">{input('maxLoadKg', 'number', false, { min: 0, step: 1 })}</Field>
        <Field label="取得日">{input('acquisitionDate', 'date', true, { min: '2012-04-01' })}</Field>
        <Field label="事業供用日">{input('inServiceDate', 'date')}</Field>
        <Field label="取得価額（円・税抜）">{input('acquisitionCost', 'number', true, { min: 1, step: 1, max: Number.MAX_SAFE_INTEGER })}</Field>
        <Field label="償却方法">{select('method', methodLabel)}</Field>
        <label className="checkbox"><input type="checkbox" checked={isUsed} onChange={e => setIsUsed(e.target.checked)} />中古車</label>
        <Field label="初度登録年月" hint="中古車は必須">{input('firstRegistrationYm', 'month', isUsed)}</Field>
      </div>
      <div className="callout"><strong>{automatic}</strong><p>貸自動車業用の区分です。EV・FCVの税務区分は人間による確認が必要です。</p></div>
      <div className="form-grid">
        <Field label="耐用年数の上書き">{select('overrideYears', { '': '自動判定を使う', '2': '2年', '3': '3年', '4': '4年', '5': '5年', '6': '6年' })}</Field>
        <Field label="上書き理由" hint="手動選択時は必須">{input('overrideReason', 'text', Boolean(draft.overrideYears), { maxLength: 500 })}</Field>
      </div>
      <Field label="メモ"><textarea name="memo" value={draft.memo} onChange={e => update('memo', e.target.value)} rows={3} maxLength={1000} /></Field>
      <div className="form-actions"><button type="submit">{vehicle ? '変更を反映' : '登録する'}</button><span className="muted">再読み込みすると初期状態に戻ります</span></div>
    </form>
  </section>;
}
