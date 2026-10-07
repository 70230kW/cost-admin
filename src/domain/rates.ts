import { integer, oneOf } from './validation';
export type Rounding = 'floor' | 'ceil';
export type UsefulLife = 2 | 3 | 4 | 5 | 6;
export type Fraction = readonly [number, number];
export type Rate = { straight: Fraction; declining: Fraction; revised: Fraction | null; guarantee: Fraction | null };
export const RATES: Readonly<Record<UsefulLife, Rate>> = {
  2: { straight: [500,1000], declining: [1000,1000], revised: null, guarantee: null },
  3: { straight: [334,1000], declining: [667,1000], revised: [1000,1000], guarantee: [11089,100000] },
  4: { straight: [250,1000], declining: [500,1000], revised: [1000,1000], guarantee: [12499,100000] },
  5: { straight: [200,1000], declining: [400,1000], revised: [500,1000], guarantee: [10800,100000] },
  6: { straight: [167,1000], declining: [333,1000], revised: [334,1000], guarantee: [9911,100000] },
};
export function rateFor(years: number): Rate {
  integer(years, 2, 6);
  return RATES[years as UsefulLife];
}
// 掛け算を BigInt で行い、中間値の精度を保って最後に一度だけ丸める。
export function multiply(value: number, [numerator, denominator]: Fraction, rounding: Rounding, months = 12): number {
  integer(value, 0); integer(numerator, 0); integer(denominator, 1); integer(months, 0, 12);
  oneOf(rounding, ['floor', 'ceil']);
  const n = BigInt(value) * BigInt(numerator) * BigInt(months);
  const d = BigInt(denominator) * 12n;
  const result = Number((n + (rounding === 'ceil' ? d - 1n : 0n)) / d);
  integer(result, 0);
  return result;
}
