type RomanSymbol = readonly [value: number, numeral: string];

export const MIN_ROMAN = 1;
export const MAX_ROMAN = 3999;

const ROMAN_SYMBOLS: readonly RomanSymbol[] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function toRoman(value: number): string {
  assertConvertible(value);

  return encode(value);
}

function assertConvertible(value: number): void {
  if (!Number.isInteger(value)) {
    throw new TypeError('INVALID_NUMBER');
  }

  if (value < MIN_ROMAN || value > MAX_ROMAN) {
    throw new RangeError('OUT_OF_RANGE');
  }
}

function encode(value: number): string {
  let remainder = value;
  let roman = '';

  for (const [symbolValue, numeral] of ROMAN_SYMBOLS) {
    roman += numeral.repeat(Math.floor(remainder / symbolValue));
    remainder %= symbolValue;
  }

  return roman;
}
