import { describe, it, expect } from 'vitest';
import {
  calcSubtotal,
  calcDiscountRate,
  calcShipping,
  calcOrderTotal,
  type OrderItem,
} from '../src/order';

const item = (price: number, qty = 1): OrderItem => ({
  sku: 'SKU-1',
  price,
  qty,
});

describe('calcSubtotal', () => {
  it('підсумовує вартість позицій з урахуванням кількості', () => {
    // Arrange
    const items = [item(100, 2), { sku: 'SKU-2', price: 50, qty: 3 }];

    // Act
    const result = calcSubtotal(items);

    // Assert
    expect(result).toBe(350);
  });

  it('відхиляє порожнє замовлення', () => {
    expect(() => calcSubtotal([])).toThrow('EMPTY_ORDER');
  });

  it('відхиляє від’ємну ціну', () => {
    expect(() => calcSubtotal([item(-1)])).toThrow('NEGATIVE_PRICE');
  });

  it.each([0, -1, 1.5])('відхиляє кількість %s', (qty) => {
    expect(() => calcSubtotal([item(100, qty)])).toThrow('INVALID_QTY');
  });

  it.each([
    { qty: 1, expected: 100 },
    { qty: 2, expected: 200 },
  ])('приймає кількість $qty біля нижньої межі', ({ qty, expected }) => {
    expect(calcSubtotal([item(100, qty)])).toBeCloseTo(expected, 2);
  });

  it('відхиляє ціну на копійку нижчу за нуль', () => {
    expect(() => calcSubtotal([item(-0.01)])).toThrow('NEGATIVE_PRICE');
  });

  it.each([
    { price: 0, expected: 0 },
    { price: 0.01, expected: 0.01 },
  ])('приймає ціну $price біля нижньої межі', ({ price, expected }) => {
    expect(calcSubtotal([item(price)])).toBeCloseTo(expected, 2);
  });

  it('відхиляє замовлення, якщо некоректна лише одна з позицій', () => {
    const items = [item(100), item(-5)];

    expect(() => calcSubtotal(items)).toThrow('NEGATIVE_PRICE');
  });
});

describe('calcDiscountRate', () => {
  it.each([
    { tier: 'basic' as const, subtotal: 500, expected: 0 },
    { tier: 'silver' as const, subtotal: 500, expected: 0.05 },
    { tier: 'gold' as const, subtotal: 500, expected: 0.1 },
    { tier: 'basic' as const, subtotal: 2000, expected: 0.05 },
    { tier: 'gold' as const, subtotal: 2000, expected: 0.15 },
  ])(
    'рівень $tier із сумою $subtotal дає ставку $expected',
    ({ tier, subtotal, expected }) => {
      expect(calcDiscountRate(tier, subtotal)).toBeCloseTo(expected, 4);
    },
  );

  it.each([
    { subtotal: 1999, expected: 0 },
    { subtotal: 2000, expected: 0.05 },
    { subtotal: 2001, expected: 0.05 },
  ])('межа великого замовлення: $subtotal', ({ subtotal, expected }) => {
    expect(calcDiscountRate('basic', subtotal)).toBeCloseTo(expected, 4);
  });

  it.each([
    { promoRate: 0.09, expected: 0.24 },
    { promoRate: 0.1, expected: 0.25 },
    { promoRate: 0.15, expected: 0.25 },
  ])(
    'gold на 2000 із промокодом $promoRate дає ставку $expected біля межі знижки',
    ({ promoRate, expected }) => {
      expect(calcDiscountRate('gold', 2000, promoRate)).toBeCloseTo(
        expected,
        4,
      );
    },
  );

  it('обмежує сумарну знижку максимальним значенням', () => {
    expect(calcDiscountRate('gold', 2000, 0.5)).toBe(0.25);
  });

  it('відхиляє від’ємний промокод', () => {
    expect(() => calcDiscountRate('basic', 500, -0.1)).toThrow('INVALID_PROMO');
  });
});

describe('calcShipping', () => {
  it.each([
    [999, 60],
    [1000, 0],
    [1001, 0],
  ])('сума %i → доставка %i', (amount, expected) => {
    expect(calcShipping(amount)).toBe(expected);
  });
});

describe('calcOrderTotal', () => {
  it('додає доставку до замовлення нижче порога', () => {
    const total = calcOrderTotal([item(500)], 'basic');
    expect(total).toBeCloseTo(560, 2);
  });

  it('не додає доставку, якщо сума після знижки сягає порога', () => {
    // 1200 − 10 % = 1080 ≥ 1000, доставка безкоштовна
    const total = calcOrderTotal([item(1200)], 'gold');
    expect(total).toBeCloseTo(1080, 2);
  });

  it('знижка може опустити суму нижче порога доставки', () => {
    // 1050 − 10 % = 945 < 1000, тому доставка платна
    const total = calcOrderTotal([item(1050)], 'gold');
    expect(total).toBeCloseTo(1005, 2);
  });

  it.each([
    // basic + промокод 20 %: 1248.75 → 999, 1250 → 1000, 1251.25 → 1001
    { subtotal: 1248.75, expected: 1059 },
    { subtotal: 1250, expected: 1000 },
    { subtotal: 1251.25, expected: 1001 },
  ])(
    'сума після знижки біля порога доставки: $subtotal → $expected',
    ({ subtotal, expected }) => {
      const total = calcOrderTotal([item(subtotal)], 'basic', 0.2);
      expect(total).toBeCloseTo(expected, 2);
    },
  );

  it('передає виняток із нижнього рівня', () => {
    expect(() => calcOrderTotal([], 'gold')).toThrow('EMPTY_ORDER');
  });
});
