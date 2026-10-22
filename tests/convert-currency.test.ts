import { describe, expect, it } from 'vitest';
import { convertCurrency } from '../src/order';

interface ConversionCase {
  amount: number;
  rate: number;
  fee: number;
  expected: number;
}

const CENTS = 2;

describe('convertCurrency', () => {
  describe('для коректних даних', () => {
    it('конвертує суму за курсом і утримує комісію з результату', () => {
      // Arrange: 100 USD × 41.5 = 4150 грн, комісія 2 % = 83 грн
      const amount = 100;
      const rate = 41.5;
      const fee = 0.02;

      // Act
      const result = convertCurrency(amount, rate, fee);

      // Assert
      expect(result).toBeCloseTo(4067, CENTS);
    });

    it.each<ConversionCase>([
      // гривня → долар без комісії: 250 × 0.024 = 6
      { amount: 250, rate: 0.024, fee: 0, expected: 6 },
      // 1000 × 0.0241 = 24.1; − 1.5 % = 23.7385 → 23.74
      { amount: 1000, rate: 0.0241, fee: 0.015, expected: 23.74 },
      // 19.99 × 41.25 = 824.5875; − 1 % = 816.341625 → 816.34
      { amount: 19.99, rate: 41.25, fee: 0.01, expected: 816.34 },
      // курс 1 (та сама валюта): лишається тільки комісія 10 %
      { amount: 50, rate: 1, fee: 0.1, expected: 45 },
    ])(
      'перетворює $amount за курсом $rate з комісією $fee на $expected',
      ({ amount, rate, fee, expected }) => {
        expect(convertCurrency(amount, rate, fee)).toBeCloseTo(expected, CENTS);
      },
    );
  });

  describe('заокруглення до копійок', () => {
    it.each([
      { rate: 0.124, expected: 0.12 },
      { rate: 0.125, expected: 0.13 },
      { rate: 0.126, expected: 0.13 },
    ])(
      'заокруглює 1 × $rate до $expected за правилом половини вгору',
      ({ rate, expected }) => {
        expect(convertCurrency(1, rate, 0)).toBeCloseTo(expected, CENTS);
      },
    );

    it('не втрачає копійку на значенні 1.005, неточному в двійковому поданні', () => {
      // 1.005 * 100 = 100.49999… — наївне Math.round дало б 1.00
      expect(convertCurrency(1.005, 1, 0)).toBeCloseTo(1.01, CENTS);
    });
  });

  describe('межові значення', () => {
    it('відхиляє суму на копійку нижчу за нуль', () => {
      expect(() => convertCurrency(-0.01, 1, 0)).toThrow('NEGATIVE_AMOUNT');
    });

    it.each([
      { amount: 0, expected: 0 },
      { amount: 0.01, expected: 0.01 },
    ])('приймає суму $amount біля нижньої межі', ({ amount, expected }) => {
      expect(convertCurrency(amount, 1, 0)).toBeCloseTo(expected, CENTS);
    });

    it('відхиляє курс, трохи менший за нуль', () => {
      expect(() => convertCurrency(10000, -0.0001, 0)).toThrow('NEGATIVE_RATE');
    });

    it.each([
      { rate: 0, expected: 0 },
      { rate: 0.0001, expected: 1 },
    ])('приймає курс $rate біля нижньої межі', ({ rate, expected }) => {
      expect(convertCurrency(10000, rate, 0)).toBeCloseTo(expected, CENTS);
    });

    it('відхиляє комісію, трохи меншу за нуль', () => {
      expect(() => convertCurrency(100, 1, -0.01)).toThrow('INVALID_FEE');
    });

    it.each([
      { fee: 0, expected: 100 },
      { fee: 0.01, expected: 99 },
      { fee: 0.99, expected: 1 },
    ])('приймає комісію $fee у межах діапазону', ({ fee, expected }) => {
      expect(convertCurrency(100, 1, fee)).toBeCloseTo(expected, CENTS);
    });

    it.each([1, 1.01])('відхиляє комісію %s на верхній межі й вище', (fee) => {
      expect(() => convertCurrency(100, 1, fee)).toThrow('INVALID_FEE');
    });
  });

  describe('для некоректних даних', () => {
    it.each([
      { amount: -100, rate: 41.5, fee: 0, code: 'NEGATIVE_AMOUNT' },
      { amount: 100, rate: -41.5, fee: 0, code: 'NEGATIVE_RATE' },
      { amount: 100, rate: 41.5, fee: -0.5, code: 'INVALID_FEE' },
      { amount: 100, rate: 41.5, fee: 2, code: 'INVALID_FEE' },
    ])(
      'викидає $code для суми $amount, курсу $rate і комісії $fee',
      ({ amount, rate, fee, code }) => {
        expect(() => convertCurrency(amount, rate, fee)).toThrow(code);
      },
    );

    it.each([
      { amount: Number.NaN, rate: 41.5, fee: 0 },
      { amount: 100, rate: Number.NaN, fee: 0 },
      { amount: 100, rate: 41.5, fee: Number.NaN },
      { amount: Number.POSITIVE_INFINITY, rate: 41.5, fee: 0 },
      { amount: 100, rate: Number.POSITIVE_INFINITY, fee: 0 },
    ])(
      'викидає INVALID_NUMBER для нескінченного чи нечислового входу ($amount, $rate, $fee)',
      ({ amount, rate, fee }) => {
        expect(() => convertCurrency(amount, rate, fee)).toThrow(
          'INVALID_NUMBER',
        );
      },
    );

    it('перевіряє коректність числа раніше за знак курсу', () => {
      expect(() => convertCurrency(Number.NaN, -1, 0)).toThrow(
        'INVALID_NUMBER',
      );
    });
  });
});
