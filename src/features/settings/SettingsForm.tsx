import { useState, type SubmitEvent } from 'react';
import type { Settings } from '../../data/repository';
import { parseSettings } from '../../data/validation';
import { Field, methodLabel } from '../../components/Field';

export function SettingsForm({ settings, onSave }: { settings: Settings; onSave: (settings: Settings) => void }) {
  const [error, setError] = useState('');
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      onSave(parseSettings({
        companyName: form.get('companyName'), fiscalYearEndMonth: Number(form.get('fiscalYearEndMonth')),
        defaultMethod: form.get('defaultMethod'), rounding: form.get('rounding'),
        depreciateInDisposalYear: form.get('depreciateInDisposalYear') === 'true',
        idleTimeoutMinutes: Number(form.get('idleTimeoutMinutes')),
      }));
      setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : '入力を確認してください'); }
  }
  return <section className="panel"><p className="eyebrow">台帳設定</p><h2>計算と表示の設定</h2>
    <div className="callout"><strong>デモ用の仮設定です</strong><p>端数処理・売却年度の償却・自動ログアウト時間の初期値は確認待ちです。ここで変更できます。Google認証と自動ログアウトは次のフェーズで実装します。</p></div>
    <form onSubmit={submit}>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="form-grid">
        <Field label="会社名"><input name="companyName" defaultValue={settings.companyName} required maxLength={100} /></Field>
        <Field label="決算月"><select name="fiscalYearEndMonth" defaultValue={settings.fiscalYearEndMonth}>{Array.from({ length: 12 }, (_, i) => <option value={i + 1} key={i}>{i + 1}月</option>)}</select></Field>
        <Field label="償却方法の初期値"><select name="defaultMethod" defaultValue={settings.defaultMethod}>{Object.entries(methodLabel).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></Field>
        <Field label="端数処理"><select name="rounding" defaultValue={settings.rounding}><option value="floor">切り捨て（仮の初期値）</option><option value="ceil">切り上げ</option></select></Field>
        <Field label="売却年度の償却"><select name="depreciateInDisposalYear" defaultValue={String(settings.depreciateInDisposalYear)}><option value="true">計上する（仮の初期値）</option><option value="false">計上しない</option></select></Field>
        <Field label="自動ログアウトまでの時間（分）" hint="15〜120分。デモでは動作しません"><input type="number" name="idleTimeoutMinutes" defaultValue={settings.idleTimeoutMinutes} min={15} max={120} step={1} required /></Field>
      </div>
      <div className="form-actions"><button type="submit">設定を反映</button><span className="muted">すべての車両の計算を更新します</span></div>
    </form>
  </section>;
}
