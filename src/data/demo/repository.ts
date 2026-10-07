import type { Repository, Ledger, Vehicle, Settings } from '../repository';
import { parseVehicle, parseSettings, checkSchedule } from '../validation';
import { demoLedger } from '../../test/fixtures/ledger';

export class DemoRepository implements Repository {
  private ledger: Ledger = demoLedger();
  read(): Ledger { return structuredClone(this.ledger); }
  saveVehicle(input: Vehicle): Ledger {
    const vehicle = parseVehicle(input);
    checkSchedule(vehicle, this.ledger.settings);
    if (this.ledger.vehicles.some(v => v.id !== vehicle.id && v.plateNumber === vehicle.plateNumber)) throw new Error('同じ登録番号の車両が既にあります');
    const index = this.ledger.vehicles.findIndex(v => v.id === vehicle.id);
    const vehicles = this.ledger.vehicles.map(v => v.id === vehicle.id ? vehicle : v);
    if (index < 0) vehicles.push(vehicle);
    const total = vehicles.reduce((sum, v) => sum + BigInt(v.acquisitionCost), 0n);
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('台帳全体の取得価額が対応範囲を超えています');
    this.ledger.vehicles = vehicles;
    return this.read();
  }
  deleteVehicle(id: string): Ledger {
    if (!this.ledger.vehicles.some(v => v.id === id)) throw new Error('車両が見つかりません');
    this.ledger.vehicles = this.ledger.vehicles.filter(v => v.id !== id);
    return this.read();
  }
  saveSettings(input: Settings): Ledger {
    const settings = parseSettings(input);
    for (const vehicle of this.ledger.vehicles) checkSchedule(vehicle, settings);
    this.ledger.settings = settings;
    return this.read();
  }
  reset(): Ledger { this.ledger = demoLedger(); return this.read(); }
}
