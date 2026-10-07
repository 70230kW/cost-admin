import { dateMonth, fiscalEnd, yearMonth } from './fiscal';
import { multiply, rateFor, type Rounding } from './rates';
import { integer, oneOf } from './validation';
export type DepreciationInput = {
  acquisitionDate: string; inServiceDate: string; acquisitionCost: number;
  usefulLifeYears: number; method: 'declining' | 'straight';
  disposalDate?: string;
};
export type CalculationSettings = { fiscalYearEndMonth: number; rounding: Rounding; depreciateInDisposalYear: boolean };
export type AnnualRow = {
  fiscalYearEnd: string; openingBookValue: number; depreciation: number;
  closingBookValue: number; revisedAcquisitionCost: number | null;
  months: readonly { ym: string; depreciation: number }[];
};
export function depreciationSchedule(input: DepreciationInput, settings: CalculationSettings): AnnualRow[] {
  const acquisition = dateMonth(input.acquisitionDate);
  let start = dateMonth(input.inServiceDate);
  if (input.acquisitionDate < '2012-04-01' || input.inServiceDate < input.acquisitionDate || start < acquisition) throw new Error('取得日または事業供用日が対象範囲外です');
  integer(input.acquisitionCost, 1); integer(settings.fiscalYearEndMonth, 1, 12);
  oneOf(input.method, ['declining', 'straight']); oneOf(settings.rounding, ['floor', 'ceil']);
  if (typeof settings.depreciateInDisposalYear !== 'boolean') throw new Error('売却年度の設定が不正です');
  const rate = rateFor(input.usefulLifeYears);
  const disposal = input.disposalDate === undefined ? null : dateMonth(input.disposalDate);
  if (input.disposalDate !== undefined && input.disposalDate < input.inServiceDate) throw new Error('売却日は事業供用日以降にしてください');
  const disposalEnd = disposal === null ? null : fiscalEnd(disposal, settings.fiscalYearEndMonth);
  let book = input.acquisitionCost; let revised: number | null = null;
  const rows: AnnualRow[] = [];
  // 定額法6年の月割りを含めても十分な上限。設定・入力不備による無限ループを防ぐ。
  for (let count = 0; count < 20; count++) {
    const end = fiscalEnd(start, settings.fiscalYearEndMonth);
    const last = disposal !== null ? Math.min(end, disposal) : end;
    const months = last - start + 1;
    const opening = book;
    let annual: number;
    if (input.method === 'straight') annual = multiply(input.acquisitionCost, rate.straight, settings.rounding, months);
    else {
      if (revised === null && rate.guarantee && rate.revised &&
        multiply(book, rate.declining, settings.rounding) < multiply(input.acquisitionCost, rate.guarantee, settings.rounding)) revised = book;
      annual = multiply(revised ?? book, revised === null ? rate.declining : rate.revised!, settings.rounding, months);
    }
    if (end === disposalEnd && !settings.depreciateInDisposalYear) annual = 0;
    const depreciation = Math.min(book - 1, annual);
    book -= depreciation;
    const monthlyBase = Math.floor(depreciation / months);
    rows.push({ fiscalYearEnd: yearMonth(end), openingBookValue: opening, depreciation, closingBookValue: book,
      revisedAcquisitionCost: revised,
      months: Array.from({ length: months }, (_, i) => ({ ym: yearMonth(start + i), depreciation: i === months - 1 ? depreciation - monthlyBase * (months - 1) : monthlyBase })),
    });
    if (book === 1 || end === disposalEnd) return rows;
    start = end + 1;
  }
  throw new Error('償却スケジュールが収束しません');
}
