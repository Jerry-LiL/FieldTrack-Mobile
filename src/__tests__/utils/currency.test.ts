import { formatCurrency } from '../../utils/currency';

describe('formatCurrency', () => {
  it('formats usd with two decimals by default', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('treats NaN as zero', () => {
    expect(formatCurrency(NaN)).toBe('$0.00');
  });

  it('rounds to cents', () => {
    expect(formatCurrency(9.999)).toBe('$10.00');
  });
});
