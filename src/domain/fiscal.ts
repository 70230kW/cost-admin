import { integer } from './validation';
export function monthIndex(ym: string): number {
  if (!/^\d{4}-\d{2}$/.test(ym)) throw new Error('年月の形式が不正です');
  const year = Number(ym.slice(0, 4)); const month = Number(ym.slice(5));
  integer(year, 1, 9999); integer(month, 1, 12);
  return year * 12 + month - 1;
}
export function yearMonth(index: number): string {
  integer(index, 12, 9999 * 12 + 11);
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String(index % 12 + 1).padStart(2, '0')}`;
}
export function dateMonth(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('日付の形式が不正です');
  const index = monthIndex(date.slice(0, 7)); const day = Number(date.slice(8));
  const year = Math.floor(index / 12); const month = index % 12 + 1;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = month === 2 ? (leap ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
  integer(day, 1, days);
  return index;
}
export function fiscalEnd(index: number, endMonth: number): number {
  yearMonth(index); integer(endMonth, 1, 12);
  const end = Math.floor(index / 12) * 12 + endMonth - 1;
  return index <= end ? end : end + 12;
}
export function elapsedMonths(from: string, to: string): number {
  const months = monthIndex(to) - monthIndex(from);
  integer(months, 0); return months;
}
