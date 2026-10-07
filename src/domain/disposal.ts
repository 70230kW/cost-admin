import { depreciationSchedule, type CalculationSettings, type DepreciationInput } from './depreciation';
import { integer } from './validation';
export function simulateDisposal(input: DepreciationInput, settings: CalculationSettings, disposalDate: string, salePrice: number) {
  integer(salePrice, 0);
  const schedule = depreciationSchedule({ ...input, disposalDate }, settings);
  const bookValue = schedule.at(-1)!.closingBookValue;
  return { bookValue, profitOrLoss: salePrice - bookValue, schedule };
}
export function simulateRemoval(input: DepreciationInput, settings: CalculationSettings, disposalDate: string) {
  return simulateDisposal(input, settings, disposalDate, 0);
}
