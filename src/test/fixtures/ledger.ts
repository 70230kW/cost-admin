import type { Ledger, Vehicle } from '../../data/repository';
const base: Vehicle = {
  id: 'demo-1', plateNumber: '見本 300 わ 0001', storeName: 'テスト店', vehicleClass: 'S', carName: '見本コンパクト',
  bodyType: 'passenger', fuelType: 'gasoline', displacementCc: 1500,
  isUsed: false, acquisitionDate: '2024-04-01', inServiceDate: '2024-04-01',
  acquisitionCost: 3000000, method: 'declining', usefulLifeYears: 3, status: 'active',
};
export function demoLedger(): Ledger {
  return {
    // 人間の確認待ちの値はデモ専用の仮値。設定画面で変更できる。
    settings: { companyName: '架空レンタカー（デモ）', fiscalYearEndMonth: 3, defaultMethod: 'declining', rounding: 'floor', depreciateInDisposalYear: true, idleTimeoutMinutes: 30 },
    vehicles: [
      { ...base },
      { ...base, id: 'demo-2', plateNumber: '見本 300 わ 0002', storeName: 'テスト第二店', carName: '見本中古コンパクト', isUsed: true, firstRegistrationYm: '2022-10', inServiceDate: '2024-10-01', acquisitionCost: 1800000, usefulLifeYears: 2 },
      { ...base, id: 'demo-3', plateNumber: '見本 300 わ 0003', vehicleClass: 'EV', carName: '見本電気自動車', fuelType: 'ev', displacementCc: 0, usefulLifeYears: 4, usefulLifeOverride: { years: 4, reason: '架空デモ用の仮設定。税務区分は要確認' } },
    ],
  };
}
