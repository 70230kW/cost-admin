import { useState } from 'react';
import type { Vehicle, Settings } from '../../data/repository';
import { depreciationSchedule } from '../../domain/depreciation';
import { yen, methodLabel, bodyLabel, fuelLabel, statusLabel } from '../../components/Field';

export function VehicleDetail({ vehicle, settings, onEdit, onDelete, onBack }: {
  vehicle: Vehicle; settings: Settings; onEdit: () => void; onDelete: () => void; onBack: () => void;
}) {
  const rows = depreciationSchedule(vehicle, settings);
  const [selectedYear, setSelectedYear] = useState(rows[0]!.fiscalYearEnd);
  const selected = rows.find(row => row.fiscalYearEnd === selectedYear) ?? rows[0]!;
  return <>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">車両詳細</p><h2>{vehicle.carName}</h2><p className="muted">{vehicle.plateNumber} · {vehicle.storeName}</p></div><div className="button-row"><button className="secondary" onClick={onBack}>一覧に戻る</button><button onClick={onEdit}>編集する</button></div></div>
      <dl className="detail-grid">
        <div><dt>取得価額（税抜）</dt><dd>{yen(vehicle.acquisitionCost)}</dd></div>
        <div><dt>償却方法・耐用年数</dt><dd>{methodLabel[vehicle.method]} · {vehicle.usefulLifeYears}年</dd></div>
        <div><dt>取得日</dt><dd>{vehicle.acquisitionDate}</dd></div><div><dt>事業供用日</dt><dd>{vehicle.inServiceDate}</dd></div>
        <div><dt>車体・燃料</dt><dd>{bodyLabel[vehicle.bodyType]} · {fuelLabel[vehicle.fuelType]}</dd></div>
        <div><dt>排気量・最大積載量</dt><dd>{vehicle.displacementCc ?? '—'} cc · {vehicle.maxLoadKg ?? '—'} kg</dd></div>
        <div><dt>区分・初度登録年月</dt><dd>{vehicle.isUsed ? '中古' : '新車'} · {vehicle.firstRegistrationYm ?? '—'}</dd></div>
        <div><dt>クラス・状態</dt><dd>{vehicle.vehicleClass} · {statusLabel[vehicle.status]}</dd></div>
      </dl>
      {vehicle.usefulLifeOverride && <div className="callout"><strong>耐用年数の手動設定：{vehicle.usefulLifeOverride.years}年</strong><p>{vehicle.usefulLifeOverride.reason}</p></div>}
      {vehicle.memo && <p className="memo">{vehicle.memo}</p>}
    </section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">年間の推移</p><h2>年次償却スケジュール</h2></div><span className="badge">最終帳簿価額 1円</span></div>
      <div className="table-scroll"><table aria-label="年次償却スケジュール"><thead><tr><th>事業年度末</th><th className="numeric">期首帳簿価額</th><th className="numeric">償却費</th><th className="numeric">期末帳簿価額</th><th>改定取得価額</th></tr></thead><tbody>{rows.map(row => <tr key={row.fiscalYearEnd}><td>{row.fiscalYearEnd}期</td><td className="numeric">{yen(row.openingBookValue)}</td><td className="numeric">{yen(row.depreciation)}</td><td className="numeric">{yen(row.closingBookValue)}</td><td>{row.revisedAcquisitionCost === null ? '—' : yen(row.revisedAcquisitionCost)}</td></tr>)}</tbody></table></div>
    </section>
    <section className="panel"><div className="panel-heading"><div><p className="eyebrow">月ごとの内訳</p><h2>月次償却スケジュール</h2></div><label className="inline-field">事業年度<select aria-label="月次の事業年度" value={selected.fiscalYearEnd} onChange={e => setSelectedYear(e.target.value)}>{rows.map(row => <option key={row.fiscalYearEnd} value={row.fiscalYearEnd}>{row.fiscalYearEnd}期</option>)}</select></label></div>
      <div className="table-scroll"><table aria-label="月次償却スケジュール"><thead><tr><th>年月</th><th className="numeric">償却費</th></tr></thead><tbody>{selected.months.map(month => <tr key={month.ym}><td>{month.ym}</td><td className="numeric">{yen(month.depreciation)}</td></tr>)}</tbody><tfoot><tr><th>年額との一致</th><td className="numeric">{yen(selected.months.reduce((total, month) => total + month.depreciation, 0))}</td></tr></tfoot></table></div>
      <p className="muted">端数はその年度の最後の償却月に寄せています。</p>
    </section>
    <div className="danger-zone"><p>デモ台帳からこの車両を削除します。</p><button className="danger secondary" onClick={onDelete}>車両を削除</button></div>
  </>;
}
