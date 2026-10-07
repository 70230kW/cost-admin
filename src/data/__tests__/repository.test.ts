import { describe, expect, it } from 'vitest';
import { DemoRepository } from '../demo/repository';
import { parseVehicle, parseSettings } from '../validation';
import { demoLedger } from '../../test/fixtures/ledger';
import { depreciationSchedule } from '../../domain/depreciation';
const base = () => demoLedger().vehicles[0]!;
describe('デモ台帳', () => {
  it('登録・編集・削除でき、再作成とリセットで初期状態に戻る', () => {
    const repo = new DemoRepository();
    const input = { ...base(), id: 'new', plateNumber: '見本 300 わ 0004' };
    expect(repo.saveVehicle(input).vehicles).toHaveLength(4);
    expect(repo.saveVehicle({ ...input, carName: '見本変更後' }).vehicles.find(v => v.id === 'new')?.carName).toBe('見本変更後');
    expect(repo.deleteVehicle('new').vehicles).toHaveLength(3);
    repo.saveVehicle(input);
    expect(new DemoRepository().read().vehicles).toHaveLength(3);
    expect(repo.reset()).toEqual(demoLedger());
  });
  it('読み出した値や入力を変更しても台帳に影響しない', () => {
    const repo = new DemoRepository(); const input = { ...base(), id: 'new', plateNumber: '見本 300 わ 0004' };
    repo.saveVehicle(input); input.carName = '見本外部変更';
    const read = repo.read(); read.vehicles[0]!.carName = '見本外部変更'; read.settings.companyName = '見本変更会社';
    expect(repo.read().vehicles[0]!.carName).toBe('見本コンパクト');
    expect(repo.read().vehicles.at(-1)!.carName).toBe('見本コンパクト');
    expect(repo.read().settings.companyName).toBe('架空レンタカー（デモ）');
  });
  it('登録番号の重複、不正入力、計算できない極小額は状態を変更しない', () => {
    const repo = new DemoRepository(); const before = repo.read();
    expect(() => repo.saveVehicle({ ...base(), id: 'duplicate' })).toThrow('登録番号');
    expect(() => repo.saveVehicle({ ...base(), acquisitionCost: 1.5 })).toThrow();
    expect(() => repo.saveVehicle({ ...base(), acquisitionCost: 2, method: 'straight' })).toThrow('収束');
    expect(() => repo.deleteVehicle('missing')).toThrow();
    expect(repo.read()).toEqual(before);
  });
  it('設定変更で既存車両の計算が変わり、初期償却方法も保持する', () => {
    const repo = new DemoRepository(); const original = repo.read();
    const changed = repo.saveSettings({ ...original.settings, rounding: 'ceil', fiscalYearEndMonth: 12, defaultMethod: 'straight', depreciateInDisposalYear: false, idleTimeoutMinutes: 45 });
    expect(changed.settings.defaultMethod).toBe('straight');
    expect(depreciationSchedule(changed.vehicles[0]!, changed.settings)[0]?.depreciation).not.toBe(depreciationSchedule(original.vehicles[0]!, original.settings)[0]?.depreciation);
    expect(() => repo.saveSettings({ ...changed.settings, fiscalYearEndMonth: 0 })).toThrow();
    expect(repo.read()).toEqual(changed);
  });
});
describe('車両入力の検証と耐用年数', () => {
  it('中古簡便法と手動上書きを適用する', () => {
    expect(parseVehicle({ ...base(), isUsed: true, firstRegistrationYm: '2022-04' }).usefulLifeYears).toBe(2);
    expect(parseVehicle({ ...base(), usefulLifeOverride: { years: 5, reason: '架空検証用' } }).usefulLifeYears).toBe(5);
  });
  it.each(['ev', 'fcv'])('%s は手動選択と理由が必要', fuelType => {
    expect(() => parseVehicle({ ...base(), fuelType })).toThrow('手動');
    expect(() => parseVehicle({ ...base(), fuelType, usefulLifeOverride: { years: 4, reason: '' } })).toThrow('理由');
    expect(parseVehicle({ ...base(), fuelType, usefulLifeOverride: { years: 4, reason: '架空デモ用・要確認' } }).usefulLifeYears).toBe(4);
  });
  it.each([
    { acquisitionDate: '2012-03-31' }, { inServiceDate: '2023-01-01' }, { inServiceDate: '2024-02-30' },
    { isUsed: true }, { isUsed: true, firstRegistrationYm: '2025-01' },
    { bodyType: 'invalid' }, { fuelType: 'invalid' }, { plateNumber: '' }, { storeName: ' ' },
    { acquisitionCost: Infinity }, { acquisitionCost: '3000000' }, { displacementCc: -1 },
    { usefulLifeOverride: { years: 7, reason: '架空' } }, { status: 'sold' },
    { firstRegistrationYm: '2024-13' }, { memo: 'a'.repeat(1001) },
  ])('不正入力を拒否 %j', changes => expect(() => parseVehicle({ ...base(), ...changes })).toThrow());
  it('未知の属性を保存せず、文字列はHTMLとして解釈しない', () => {
    const parsed = parseVehicle({ ...base(), unexpected: '値', carName: '<img src=x onerror=alert(1)>' });
    expect(parsed).not.toHaveProperty('unexpected'); expect(parsed.carName).toBe('<img src=x onerror=alert(1)>');
  });
});
describe('設定検証', () => {
  it.each([{ fiscalYearEndMonth: 13 }, { idleTimeoutMinutes: 14 }, { idleTimeoutMinutes: 121 }, { idleTimeoutMinutes: 30.5 }, { rounding: 'invalid' }, { depreciateInDisposalYear: 'false' }, { companyName: '' }, { defaultMethod: 'invalid' }])('不正設定を拒否 %j', changes => expect(() => parseSettings({ ...demoLedger().settings, ...changes })).toThrow());
});
it('合計額が安全な整数の範囲を超える保存は拒否し、台帳を変更しない', () => {
  const repo = new DemoRepository(); const before = repo.read();
  expect(() => repo.saveVehicle({ ...base(), acquisitionCost: Number.MAX_SAFE_INTEGER })).toThrow('対応範囲');
  expect(repo.read()).toEqual(before);
});
