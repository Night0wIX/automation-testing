import { describe, expect, it } from 'vitest';
import { MAX_ROMAN, MIN_ROMAN, toRoman } from '../src/roman';

interface ConversionCase {
  value: number;
  expected: string;
}

const INVALID_NUMBER = 'INVALID_NUMBER';
const OUT_OF_RANGE = 'OUT_OF_RANGE';

const ADDITIVE_CASES: ConversionCase[] = [
  { value: 3, expected: 'III' },
  { value: 8, expected: 'VIII' },
  { value: 58, expected: 'LVIII' },
  { value: 2024, expected: 'MMXXIV' },
];

const SUBTRACTIVE_CASES: ConversionCase[] = [
  { value: 4, expected: 'IV' },
  { value: 9, expected: 'IX' },
  { value: 40, expected: 'XL' },
  { value: 90, expected: 'XC' },
  { value: 400, expected: 'CD' },
  { value: 900, expected: 'CM' },
];

const MIXED_CASES: ConversionCase[] = [
  { value: 14, expected: 'XIV' },
  { value: 444, expected: 'CDXLIV' },
  { value: 1994, expected: 'MCMXCIV' },
];

const BOUNDARY_CASES: ConversionCase[] = [
  { value: MIN_ROMAN, expected: 'I' },
  { value: MAX_ROMAN, expected: 'MMMCMXCIX' },
];

const BEYOND_BOUNDARY_VALUES = [MIN_ROMAN - 1, MAX_ROMAN + 1];
const NEGATIVE_VALUE = -5;
const NON_INTEGER_VALUES = [3.5, Number.NaN, Number.POSITIVE_INFINITY];

describe('toRoman', () => {
  describe('для коректних значень', () => {
    it('повертає римський запис цілого числа з діапазону', () => {
      // Arrange
      const value = 2024;

      // Act
      const result = toRoman(value);

      // Assert
      expect(result).toBe('MMXXIV');
    });

    it.each(ADDITIVE_CASES)(
      'записує $value адитивно як $expected',
      ({ value, expected }) => {
        const result = toRoman(value);

        expect(result).toBe(expected);
      },
    );

    it.each(SUBTRACTIVE_CASES)(
      'записує $value субтрактивно як $expected',
      ({ value, expected }) => {
        const result = toRoman(value);

        expect(result).toBe(expected);
      },
    );

    it.each(MIXED_CASES)(
      'поєднує обидві форми, записуючи $value як $expected',
      ({ value, expected }) => {
        const result = toRoman(value);

        expect(result).toBe(expected);
      },
    );
  });

  describe('на межах діапазону', () => {
    it.each(BOUNDARY_CASES)(
      'повертає $expected для граничного значення $value',
      ({ value, expected }) => {
        const result = toRoman(value);

        expect(result).toBe(expected);
      },
    );

    it.each(BEYOND_BOUNDARY_VALUES)(
      'відхиляє %i за межею діапазону помилкою OUT_OF_RANGE',
      (value) => {
        const convert = () => toRoman(value);

        expect(convert).toThrow(RangeError);
        expect(convert).toThrow(OUT_OF_RANGE);
      },
    );
  });

  describe('для некоректних значень', () => {
    it('відхиляє від’ємне число помилкою OUT_OF_RANGE', () => {
      const convert = () => toRoman(NEGATIVE_VALUE);

      expect(convert).toThrow(RangeError);
      expect(convert).toThrow(OUT_OF_RANGE);
    });

    it.each(NON_INTEGER_VALUES)(
      'відхиляє неціле значення %s помилкою INVALID_NUMBER',
      (value) => {
        const convert = () => toRoman(value);

        expect(convert).toThrow(TypeError);
        expect(convert).toThrow(INVALID_NUMBER);
      },
    );
  });
});
