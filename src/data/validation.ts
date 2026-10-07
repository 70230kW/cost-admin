import { dateMonth, monthIndex } from '../domain/fiscal';
import { legalUsefulLife, usedUsefulLife } from '../domain/usefulLife';
import { integer, oneOf } from '../domain/validation';
import { depreciationSchedule } from '../domain/depreciation';
import type { Vehicle, Settings } from './repository';

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('入力の形式が不正です');
  return value as Record<string, unknown>;
}
function text(value: unknown, label: string, max = 100): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`${label}を1〜${max}文字で入力してください`);
  return value.trim();
}
function amount(value: unknown, label: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number') throw new Error(`${label}を整数で入力してください`);
  try { integer(value, min, max); } catch { throw new Error(`${label}の範囲が不正です`); }
  return value;
}
function choice<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string') throw new Error(`${label}を選択してください`);
  try { oneOf(value, allowed); } catch { throw new Error(`${label}の選択が不正です`); }
  return value as T;
}
function bool(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label}の選択が不正です`);
  return value;
}
export function parseSettings(value: unknown): Settings {
  const r = record(value);
  return {
    companyName: text(r.companyName, '会社名'),
    fiscalYearEndMonth: amount(r.fiscalYearEndMonth, '決算月', 1, 12),
    defaultMethod: choice(r.defaultMethod, ['declining', 'straight'], '償却方法'),
    rounding: choice(r.rounding, ['floor', 'ceil'], '端数処理'),
    depreciateInDisposalYear: bool(r.depreciateInDisposalYear, '売却年度の償却'),
    idleTimeoutMinutes: amount(r.idleTimeoutMinutes, '自動ログアウト時間', 15, 120),
  };
}
export function parseVehicle(value: unknown): Vehicle {
  const r = record(value);
  const vehicle: Vehicle = {
    id: text(r.id, 'ID'), plateNumber: text(r.plateNumber, '登録番号'),
    storeName: text(r.storeName, '店舗'), vehicleClass: text(r.vehicleClass, 'クラス'),
    carName: text(r.carName, '車名・型式'),
    bodyType: choice(r.bodyType, ['passenger', 'truck', 'bus'], '車体'),
    fuelType: choice(r.fuelType, ['gasoline', 'diesel', 'hybrid', 'ev', 'fcv', 'other'], '燃料'),
    isUsed: bool(r.isUsed, '中古車'),
    acquisitionDate: text(r.acquisitionDate, '取得日', 10),
    inServiceDate: text(r.inServiceDate, '事業供用日', 10),
    acquisitionCost: amount(r.acquisitionCost, '取得価額', 1),
    method: choice(r.method, ['declining', 'straight'], '償却方法'),
    usefulLifeYears: 2,
    status: choice(r.status, ['active', 'sold', 'disposed'], '状態'),
  };
  dateMonth(vehicle.acquisitionDate); dateMonth(vehicle.inServiceDate);
  if (vehicle.acquisitionDate < '2012-04-01') throw new Error('取得日は2012年4月1日以降にしてください');
  if (vehicle.inServiceDate < vehicle.acquisitionDate) throw new Error('事業供用日は取得日以降にしてください');
  if (r.displacementCc !== undefined) vehicle.displacementCc = amount(r.displacementCc, '排気量');
  if (r.maxLoadKg !== undefined) vehicle.maxLoadKg = amount(r.maxLoadKg, '最大積載量');
  if (r.firstRegistrationYm !== undefined) {
    vehicle.firstRegistrationYm = text(r.firstRegistrationYm, '初度登録年月', 7);
    monthIndex(vehicle.firstRegistrationYm);
    if (vehicle.firstRegistrationYm > vehicle.inServiceDate.slice(0, 7)) throw new Error('初度登録年月は事業供用月以前にしてください');
  }
  if (vehicle.isUsed && !vehicle.firstRegistrationYm) throw new Error('中古車には初度登録年月が必要です');
  const legal = legalUsefulLife(vehicle);
  if (r.usefulLifeOverride !== undefined) {
    const override = record(r.usefulLifeOverride);
    vehicle.usefulLifeOverride = { years: amount(override.years, '手動耐用年数', 2, 6), reason: text(override.reason, '上書き理由', 500) };
    vehicle.usefulLifeYears = vehicle.usefulLifeOverride.years;
  } else {
    if (legal === null) throw new Error('この車両は耐用年数の手動選択と理由が必要です');
    vehicle.usefulLifeYears = vehicle.isUsed ? usedUsefulLife(legal, vehicle.firstRegistrationYm!, vehicle.inServiceDate.slice(0, 7)) : legal;
  }
  if (r.memo !== undefined && r.memo !== '') vehicle.memo = text(r.memo, 'メモ', 1000);
  if (vehicle.status !== 'active') {
    vehicle.disposalDate = text(r.disposalDate, '売却・除却日', 10);
    dateMonth(vehicle.disposalDate);
    if (vehicle.disposalDate < vehicle.inServiceDate) throw new Error('売却・除却日は事業供用日以降にしてください');
    if (vehicle.status === 'sold') vehicle.salePrice = amount(r.salePrice, '売却額');
  }
  return vehicle;
}
export function checkSchedule(vehicle: Vehicle, settings: Settings): void {
  depreciationSchedule(vehicle, settings);
}
