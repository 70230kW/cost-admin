import { useState } from 'react';
import { DemoRepository } from './data/demo/repository';
import { VehicleList } from './features/vehicles/VehicleList';
import { VehicleDetail } from './features/vehicles/VehicleDetail';
import { VehicleForm } from './features/vehicles/VehicleForm';
import { SettingsForm } from './features/settings/SettingsForm';
import type { Vehicle, Settings } from './data/repository';

type View = { kind: 'list' | 'new' | 'settings' } | { kind: 'detail' | 'edit'; id: string };
export default function DemoApp() {
  const [repository] = useState(() => new DemoRepository());
  const [ledger, setLedger] = useState(() => repository.read());
  const [view, setView] = useState<View>({ kind: 'list' });
  const [message, setMessage] = useState('');
  const [referenceYm, setReferenceYm] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const vehicle = 'id' in view ? ledger.vehicles.find(v => v.id === view.id) : undefined;
  function saveVehicle(value: Vehicle) {
    setLedger(repository.saveVehicle(value)); setView({ kind: 'detail', id: value.id }); setMessage('車両情報をデモ台帳に反映しました');
  }
  function saveSettings(value: Settings) {
    setLedger(repository.saveSettings(value)); setMessage('設定を反映し、計算を更新しました');
  }
  function navigate(value: View) { setView(value); setMessage(''); }
  return <>
    <div className="demo-banner">デモモード（入力内容は保存されません）<span>架空データのみ・Google接続なし</span></div>
    <div className="app-shell"><aside className="sidebar"><a className="brand" href="#" onClick={e => { e.preventDefault(); navigate({ kind: 'list' }); }}><span className="brand-mark">車</span><span>償却台帳<small>レンタカー管理</small></span></a>
      <nav aria-label="メインメニュー"><button aria-current={view.kind !== 'settings' ? 'page' : undefined} onClick={() => navigate({ kind: 'list' })}><span aria-hidden="true">▤</span>車両台帳</button><button aria-current={view.kind === 'settings' ? 'page' : undefined} onClick={() => navigate({ kind: 'settings' })}><span aria-hidden="true">⚙</span>設定</button></nav>
      <div className="sidebar-note"><span className="badge">デモ台帳</span><p>入力はメモリ上だけで扱います。ページの再読み込みで初期状態に戻ります。</p><button className="reset-button" onClick={() => { if (window.confirm('入力した内容を破棄して、架空の初期データに戻しますか？')) { setLedger(repository.reset()); navigate({ kind: 'list' }); setMessage('初期データに戻しました'); } }}>初期データに戻す</button></div>
    </aside><div className="main-column"><header className="topbar"><span>{ledger.settings.companyName}</span><span className="badge">税抜・円</span></header><main>
      {message && <p role="status" className="success">{message}</p>}
      {view.kind === 'list' && <VehicleList ledger={ledger} referenceYm={referenceYm} onReferenceChange={setReferenceYm} onSelect={id => navigate({ kind: 'detail', id })} onNew={() => navigate({ kind: 'new' })} />}
      {view.kind === 'new' && <VehicleForm settings={ledger.settings} onSave={saveVehicle} onCancel={() => navigate({ kind: 'list' })} />}
      {view.kind === 'edit' && vehicle && <VehicleForm vehicle={vehicle} settings={ledger.settings} onSave={saveVehicle} onCancel={() => navigate({ kind: 'detail', id: vehicle.id })} />}
      {view.kind === 'detail' && vehicle && <VehicleDetail vehicle={vehicle} settings={ledger.settings} onEdit={() => navigate({ kind: 'edit', id: vehicle.id })} onBack={() => navigate({ kind: 'list' })} onDelete={() => { if (window.confirm(`${vehicle.plateNumber} をデモ台帳から削除しますか？`)) { setLedger(repository.deleteVehicle(vehicle.id)); navigate({ kind: 'list' }); setMessage('車両を削除しました'); } }} />}
      {view.kind === 'settings' && <SettingsForm settings={ledger.settings} onSave={saveSettings} />}
    </main><footer>最終的な税務判断は顧問税理士にご確認ください</footer></div></div>
  </>;
}
