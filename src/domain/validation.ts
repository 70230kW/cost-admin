export function integer(value: number, min: number, max = Number.MAX_SAFE_INTEGER): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error('整数の範囲が不正です');
}
export function oneOf<T extends string>(value: T, allowed: readonly T[]): void {
  if (!allowed.includes(value)) throw new Error('選択値が不正です');
}
