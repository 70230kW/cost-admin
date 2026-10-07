import { describe, expect, it } from 'vitest';
import { depreciationSchedule, type CalculationSettings, type DepreciationInput } from '../depreciation';
import { legalUsefulLife, usedUsefulLife } from '../usefulLife';
import { dateMonth, elapsedMonths, fiscalEnd, monthIndex, yearMonth } from '../fiscal';
import { multiply, rateFor } from '../rates';
import { simulateDisposal, simulateRemoval } from '../disposal';
const settings: CalculationSettings = { fiscalYearEndMonth: 3, rounding: 'floor', depreciateInDisposalYear: true };
const vehicle: DepreciationInput = { acquisitionDate: '2024-04-01', inServiceDate: '2024-04-01', acquisitionCost: 3000000, usefulLifeYears: 3, method: 'declining' };
describe('仕様書11章の検算済み正解値', () => {
  it.each([
    ['A', 3000000, 3, 'declining', '2024-04-01', [2001000, 666333, 332666], 332670],
    ['B', 4000000, 4, 'declining', '2024-04-01', [2000000, 1000000, 500000, 499999], 499960],
    ['C', 2400000, 3, 'declining', '2024-10-01', [800400, 1066933, 355288, 177378], 266136],
    ['D', 1800000, 2, 'declining', '2024-10-01', [900000, 899999], null],
    ['E', 3000000, 3, 'straight', '2024-04-01', [1002000, 1002000, 995999], null],
  ] as const)('%s 年次・月次・備忘価額', (_, cost, years, method, start, expected, guarantee) => {
    const rows = depreciationSchedule({ ...vehicle, acquisitionCost: cost, usefulLifeYears: years, method, inServiceDate: start }, settings);
    expect(rows.map(r => r.depreciation)).toEqual(expected);
    expect(rows.at(-1)?.closingBookValue).toBe(1);
    for (const row of rows) expect(row.months.reduce((s, m) => s + m.depreciation, 0)).toBe(row.depreciation);
    if (guarantee !== null) expect(multiply(cost, rateFor(years).guarantee!, 'floor')).toBe(guarantee);
    if (years === 3 && method === 'declining') expect(rows[2]?.revisedAcquisitionCost).toBe(cost === 3000000 ? 332667 : null);
  });
  it.each([[3,24,2],[3,40,2],[4,12,3],[4,24,2],[5,12,4],[5,36,2]])('中古 %i年・%iヶ月→%i年', (years, months, expected) => {
    expect(usedUsefulLife(years, '2020-01', yearMonth(monthIndex('2020-01') + months))).toBe(expected);
  });
  it.each([[660,3],[2000,3],[2001,4],[2500,4],[3000,5]])('乗用 %icc→%i年', (cc, years) => {
    expect(legalUsefulLife({ bodyType: 'passenger', fuelType: 'gasoline', displacementCc: cc })).toBe(years);
  });
  it.each([[2000,3],[3000,4]])('貨物 %ikg→%i年', (kg, years) => {
    expect(legalUsefulLife({ bodyType: 'truck', fuelType: 'diesel', maxLoadKg: kg })).toBe(years);
  });
  it('乗合は5年', () => expect(legalUsefulLife({ bodyType: 'bus', fuelType: 'diesel' })).toBe(5));
  it.each(['ev', 'fcv'] as const)('%s は手動選択', fuelType => expect(legalUsefulLife({ bodyType: 'passenger', fuelType })).toBeNull());
});
describe('日付・設定・境界', () => {
  it('月をまたぐ1日でも1ヶ月、12月決算と閏日', () => {
    expect(dateMonth('2024-02-29')).toBe(monthIndex('2024-02'));
    expect(() => dateMonth('2023-02-29')).toThrow();
    expect(() => dateMonth('2024-04-31')).toThrow();
    expect(yearMonth(fiscalEnd(monthIndex('2024-04'), 3))).toBe('2025-03');
    expect(yearMonth(fiscalEnd(monthIndex('2024-12'), 12))).toBe('2024-12');
    expect(elapsedMonths('2023-12', '2024-01')).toBe(1);
    const row = depreciationSchedule({ ...vehicle, inServiceDate: '2025-03-31' }, settings)[0]!;
    expect(row.months).toEqual([{ ym: '2025-03', depreciation: 166750 }]);
  });
  it('中古簡便法の全期間・最低2年・逆転日付', () => {
    expect(usedUsefulLife(5, '2020-01', '2025-01')).toBe(2);
    expect(usedUsefulLife(4, '2024-01', '2024-01')).toBe(4);
    expect(() => usedUsefulLife(3, '2025-01', '2024-01')).toThrow();
  });
  it('切り上げを最終段階で一度だけ行う', () => {
    expect(multiply(101, [667, 1000], 'floor', 6)).toBe(33);
    expect(multiply(101, [667, 1000], 'ceil', 6)).toBe(34);
    expect(multiply(Number.MAX_SAFE_INTEGER, [667,1000], 'floor')).toBe(Number(BigInt(Number.MAX_SAFE_INTEGER) * 667n / 1000n));
  });
  it('月次の端数は最後の月に寄せる', () => {
    const rows = depreciationSchedule({ ...vehicle, acquisitionCost: 101, method: 'straight' }, settings);
    expect(rows[0]?.months.map(m => m.depreciation)).toEqual([2,2,2,2,2,2,2,2,2,2,2,11]);
  });
  it.each([2,3,4,5,6])('耐用%i年の両方式・両端数処理で収束し総額が一致', years => {
    for (const method of ['straight', 'declining'] as const) for (const rounding of ['floor', 'ceil'] as const) {
      const rows = depreciationSchedule({ ...vehicle, usefulLifeYears: years, method, inServiceDate: '2024-12-31' }, { ...settings, rounding, fiscalYearEndMonth: 12 });
      expect(rows.reduce((s, r) => s + r.depreciation, 0)).toBe(2999999);
      for (const row of rows) {
        expect(row.months.reduce((s,m) => s + m.depreciation, 0)).toBe(row.depreciation);
        expect(row.openingBookValue - row.depreciation).toBe(row.closingBookValue);
      }
    }
  });
  it.each([
    { acquisitionDate: '2012-03-31' }, { inServiceDate: '2023-01-01' },
    { acquisitionCost: 0 }, { acquisitionCost: 1.5 }, { acquisitionCost: Infinity },
    { usefulLifeYears: 7 }, { disposalDate: '2024-03-31' },
    { inServiceDate: '2024-13-01' },
  ])('不正な計算入力を拒否 %j', changes => expect(() => depreciationSchedule({ ...vehicle, ...changes }, settings)).toThrow());
  it('不正な設定を拒否', () => {
    expect(() => depreciationSchedule(vehicle, { ...settings, fiscalYearEndMonth: 0 })).toThrow();
    expect(() => legalUsefulLife({ bodyType: 'truck', fuelType: 'diesel', maxLoadKg: -1 })).toThrow();
  });
  it('取得日下限と1円資産', () => {
    expect(depreciationSchedule({ ...vehicle, acquisitionDate: '2012-04-01', acquisitionCost: 1 }, settings)[0]?.depreciation).toBe(0);
  });
});
describe('売却・除却の純粋計算', () => {
  it('売却月まで償却し、それ以降の月・年度を含めない', () => {
    const result = simulateDisposal(vehicle, settings, '2024-09-30', 2500000);
    expect(result.bookValue).toBe(1999500); expect(result.profitOrLoss).toBe(500500);
    expect(result.schedule).toHaveLength(1);
    expect(result.schedule[0]?.months.at(-1)?.ym).toBe('2024-09');
  });
  it('売却年度に償却しない設定と除却', () => {
    expect(simulateDisposal(vehicle, { ...settings, depreciateInDisposalYear: false }, '2025-06-01', 1000000).bookValue).toBe(999000);
    expect(simulateRemoval(vehicle, settings, '2024-09-30').profitOrLoss).toBe(-1999500);
    expect(() => simulateDisposal(vehicle, settings, '2024-09-30', -1)).toThrow();
  });
  it('初年度に同月売却する場合と償却終了後の売却', () => {
    expect(simulateDisposal(vehicle, settings, '2024-04-01', 0).bookValue).toBe(2833250);
    expect(simulateDisposal(vehicle, settings, '2034-04-01', 100).profitOrLoss).toBe(99);
  });
});
describe('改定償却率と不変性', () => {
  it.each([5,6])('耐用%i年は改定取得価額を固定して使い続ける', years => {
    const rows = depreciationSchedule({ ...vehicle, usefulLifeYears: years }, settings);
    const revised = rows.filter(row => row.revisedAcquisitionCost !== null);
    expect(revised.length).toBeGreaterThan(1);
    expect(new Set(revised.map(row => row.revisedAcquisitionCost)).size).toBe(1);
    expect(revised[0]?.revisedAcquisitionCost).toBe(revised[0]?.openingBookValue);
  });
  it('保証額は月割りする前の年額と比較する', () => {
    const first = depreciationSchedule({ ...vehicle, inServiceDate: '2025-03-01' }, settings)[0]!;
    expect(first.revisedAcquisitionCost).toBeNull();
    expect(first.depreciation).toBe(166750);
  });
  it('設定と入力を変更せず同じ結果を返す', () => {
    const input = Object.freeze({ ...vehicle }); const config = Object.freeze({ ...settings });
    expect(depreciationSchedule(input, config)).toEqual(depreciationSchedule(input, config));
    expect(input).toEqual(vehicle); expect(config).toEqual(settings);
  });
  it('年額0円で収束しない入力は成功扱いしない', () => {
    expect(() => depreciationSchedule({ ...vehicle, method: 'straight', acquisitionCost: 2 }, settings)).toThrow('収束しません');
  });
  it('必要な分類値なし・不正な年月・未対応耐用年数を拒否または要確認にする', () => {
    expect(legalUsefulLife({ bodyType: 'passenger', fuelType: 'gasoline' })).toBeNull();
    expect(() => monthIndex('2024-00')).toThrow();
    expect(() => monthIndex('0000-01')).toThrow();
    expect(() => rateFor(3.5)).toThrow();
  });
});
