import type { Classification } from '../domain/usefulLife';
import type { CalculationSettings } from '../domain/depreciation';

export type Vehicle = Classification & {
  id: string;
  plateNumber: string;
  storeName: string;
  vehicleClass: string;
  carName: string;
  isUsed: boolean;
  firstRegistrationYm?: string;
  acquisitionDate: string;
  inServiceDate: string;
  acquisitionCost: number;
  method: 'declining' | 'straight';
  usefulLifeYears: number;
  usefulLifeOverride?: { years: number; reason: string };
  status: 'active' | 'sold' | 'disposed';
  disposalDate?: string;
  salePrice?: number;
  plannedSaleYm?: string;
  expectedSalePrice?: number;
  memo?: string;
};
export type Settings = CalculationSettings & {
  companyName: string;
  defaultMethod: Vehicle['method'];
  idleTimeoutMinutes: number;
};
export type Ledger = { vehicles: Vehicle[]; settings: Settings };
export interface Repository {
  read(): Ledger;
  saveVehicle(vehicle: Vehicle): Ledger;
  deleteVehicle(id: string): Ledger;
  saveSettings(settings: Settings): Ledger;
  reset(): Ledger;
}
