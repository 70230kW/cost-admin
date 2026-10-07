import { useState } from 'react';
import type { Ledger, Vehicle } from '../../data/repository';
import { depreciationSchedule } from '../../domain/depreciation';
import { fiscalEnd, monthIndex, yearMonth } from '../../domain/fiscal';
import { legalUsefulLife } from '../../domain/usefulLife';
import { yen, methodLabel, statusLabel } from '../../components/Field';

export function VehicleList({ ledger, referenceYm, onReferenceChange, onSelect, onNew }: {
  ledger: Ledger; referenceYm: string; onReferenceChange: (ym: string) => void; onSelect: (id: string) => void; onNew: () => void;
}) {
  const [store, setStore] = useState(''); const [vehicleClass, setVehicleClass] = useState(''); const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const end = yearMonth(fiscalEnd(monthIndex(referenceYm), ledger.settings.fiscalYearEndMonth));
  const calculations = new Map(ledger.vehicles.map(vehicle => {
    const rows = depreciationSchedule(vehicle, ledger.settings);
    const depreciated = rows.flatMap(row => row.months).filter(month => month.ym <= referenceYm).reduce((sum, month) => sum + month.depreciation, 0);
    const value = vehicle.acquisitionDate.slice(0, 7) > referenceYm || (vehicle.disposalDate && vehicle.disposalDate.slice(0, 7) <= referenceYm) ? 0 : vehicle.acquisitionCost - depreciated;
    return [vehicle.id, { value, annual: rows.find(row => row.fiscalYearEnd === end)?.depreciation ?? 0 }] as const;
  }));
  const filtered = ledger.vehicles.filter(v => (!store || v.storeName === store) && (!vehicleClass || v.vehicleClass === vehicleClass) && (!status || v.status === status) && `${v.plateNumber} ${v.carName}`.includes(search.trim()));
  const total = ledger.vehicles.reduce((sum, v) => sum + calculations.get(v.id)!.value, 0);
  const annual = ledger.vehicles.reduce((sum, v) => sum + calculations.get(v.id)!.annual, 0);
  const options = (key: 'storeName' | 'vehicleClass') => [...new Set(ledger.vehicles.map(v => v[key]))].sort().map(value => <option key={value} value={value}>{value}</option>);
  const warning = (vehicle: Vehicle) => legalUsefulLife(vehicle) === null;
  return <>
    <div className="page-heading"><div><p className="eyebrow">車両ごとの償却を、ひとつの台帳で</p><h1>車両台帳</h1><p className="muted">{ledger.settings.companyName}</p></div><button onClick={onNew}>＋ 車両を登録</button></div>
    <div className="summary-grid"><article><p>登録車両</p><strong>{ledger.vehicles.length}<small>台</small></strong><span>デモ台帳全体</span></article><article><p>基準月末の帳簿価額</p><strong>{yen(total)}</strong><span>{referenceYm} 月末</span></article><article><p>当期の償却費（見込）</p><strong>{yen(annual)}</strong><span>{end}期 · 台帳全体</span></article></div>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">登録済みの車両</p><h2>車両一覧 <span className="count">{filtered.length}件</span></h2></div><label className="inline-field">基準月<span className="month-control"><span aria-hidden="true">{referenceYm.slice(0, 4)}年{Number(referenceYm.slice(5))}月 ▦</span><input type="month" aria-label="基準月" value={referenceYm} onClick={e => e.currentTarget.showPicker?.()} onChange={e => { try { monthIndex(e.target.value); onReferenceChange(e.target.value); } catch { /* 空欄・無効な年月は適用しない */ } }} /></span></label></div>
      <div className="filters"><label>店舗<select aria-label="店舗" value={store} onChange={e => setStore(e.target.value)}><option value="">すべての店舗</option>{options('storeName')}</select></label><label>クラス<select aria-label="クラス" value={vehicleClass} onChange={e => setVehicleClass(e.target.value)}><option value="">すべてのクラス</option>{options('vehicleClass')}</select></label><label>状態<select aria-label="状態" value={status} onChange={e => setStatus(e.target.value)}><option value="">すべての状態</option>{Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="search-field">車両を探す<input type="search" placeholder="登録番号・車名" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
      <div className="table-scroll"><table aria-label="車両一覧"><thead><tr><th>車両・登録番号</th><th>店舗 / クラス</th><th>償却方法</th><th className="numeric">取得価額</th><th className="numeric">月末帳簿価額</th><th className="numeric">当期償却費</th><th>状態</th></tr></thead><tbody>{filtered.map(vehicle => <tr key={vehicle.id}><td><button className="text-button" onClick={() => onSelect(vehicle.id)}>{vehicle.carName}</button><small className="subtext">{vehicle.plateNumber}</small>{warning(vehicle) && <span className="badge warning">耐用年数 要確認</span>}</td><td>{vehicle.storeName}<small className="subtext">{vehicle.vehicleClass}</small></td><td>{methodLabel[vehicle.method]}<small className="subtext">{vehicle.usefulLifeYears}年 · {vehicle.isUsed ? '中古' : '新車'}</small></td><td className="numeric">{yen(vehicle.acquisitionCost)}</td><td className="numeric strong">{yen(calculations.get(vehicle.id)!.value)}</td><td className="numeric">{yen(calculations.get(vehicle.id)!.annual)}</td><td><span className="badge">{statusLabel[vehicle.status]}</span></td></tr>)}</tbody></table></div>
      {filtered.length === 0 && <div className="empty"><h3>該当する車両がありません</h3><p>絞り込みを変更するか、車両を登録してください。</p><button className="secondary" onClick={() => { setStore(''); setVehicleClass(''); setStatus(''); setSearch(''); }}>絞り込みを解除</button></div>}
      <p className="muted table-note">基準月の月末まで償却した帳簿価額です。当期償却費には期末までの見込みを含みます。</p>
    </section>
  </>;
}
