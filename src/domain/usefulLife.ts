import { elapsedMonths } from './fiscal';
import { integer, oneOf } from './validation';
import { rateFor } from './rates';
export type Classification = {
  bodyType: 'passenger' | 'truck' | 'bus';
  fuelType: 'gasoline' | 'diesel' | 'hybrid' | 'ev' | 'fcv' | 'other';
  displacementCc?: number; maxLoadKg?: number;
};
export function legalUsefulLife(input: Classification): 3 | 4 | 5 | null {
  oneOf(input.bodyType, ['passenger', 'truck', 'bus']);
  oneOf(input.fuelType, ['gasoline', 'diesel', 'hybrid', 'ev', 'fcv', 'other']);
  if (input.displacementCc !== undefined) integer(input.displacementCc, 0);
  if (input.maxLoadKg !== undefined) integer(input.maxLoadKg, 0);
  if (input.fuelType === 'ev' || input.fuelType === 'fcv') return null;
  if (input.bodyType === 'bus') return 5;
  const value = input.bodyType === 'truck' ? input.maxLoadKg : input.displacementCc;
  if (value === undefined || value === 0) return null;
  return value <= 2000 ? 3 : input.bodyType === 'passenger' && value >= 3000 ? 5 : 4;
}
export function usedUsefulLife(legalYears: number, firstRegistrationYm: string, inServiceYm: string): number {
  rateFor(legalYears);
  const months = elapsedMonths(firstRegistrationYm, inServiceYm);
  const lifeMonths = legalYears * 12;
  return Math.max(2, Math.floor((months >= lifeMonths ? lifeMonths : (lifeMonths - months) * 5 + months) / 60));
}
