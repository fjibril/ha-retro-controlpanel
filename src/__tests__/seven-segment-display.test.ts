import { SevenSegmentDisplay } from "../seven-segment-display";
import { describe, it, expect } from 'vitest';

describe('NumberFormatter', () => {
    const sevenSegmentDisplay = new SevenSegmentDisplay();
  describe('Basic formatting', () => {
    it('should format positive integer without padding', () => {
      expect(sevenSegmentDisplay.formatWithPrioritySigDigits(31.0, 4, 2)).toBe('31');
    });

    it('should format negative integer without padding', () => {
      expect(sevenSegmentDisplay.formatWithPrioritySigDigits(-31.0, 4, 2)).toBe('-31');
    });
  });

  describe('Space padding', () => {
    it('should pad positive number with spaces', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(31.0, 6, 2, false);
      expect(result).toBe('    31');
      expect(result.length).toBe(6);
    });

    it('should pad negative number with spaces', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-31.0, 6, 2, false);
      expect(result).toBe('   -31');
      expect(result.length).toBe(6);
    });
  });

  describe('Zero padding', () => {
    it('should pad positive number with zeros', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(31.0, 6, 2, true);
      expect(result).toBe('000031');
      expect(result.length).toBe(6);
    });

    it('should pad negative number with zeros (minus first)', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-31.0, 6, 2, true);
      expect(result).toBe('-00031');
      expect(result.length).toBe(6);
    });
  });

  describe('Fraction handling', () => {
    it('should format decimal with space padding', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-31.567, 8, 2, false);
      expect(result).toBe('  -31.57');
      expect(result.length).toBe(8);
    });

    it('should format decimal with zero padding', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-31.567, 8, 2, true);
      expect(result).toBe('-0031.57');
      expect(result.length).toBe(8);
    });

    it('should format small decimal with space padding', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-3.14159, 8, 3, false);
      expect(result).toBe('  -3.142');
      expect(result.length).toBe(8);
    });

    it('should format small decimal with zero padding', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-3.14159, 8, 3, true);
      expect(result).toBe('-003.142');
      expect(result.length).toBe(8);
    });
    it('should round up if at or above .5', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(100.5, 3, 0, true);
      expect(result).toBe('101');
      expect(result.length).toBe(3);
    });
    it('should round down if below .5', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(100.499999, 3, 0, true);
      expect(result).toBe('100');
      expect(result.length).toBe(3);
    });
    it('should round up if at or above .5 for negatives', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-100.5, 4, 0, true);
      expect(result).toBe('-101');
      expect(result.length).toBe(4);
    });
    it('should round down if below .5 for negative numbers', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-100.499999, 4, 0, true);
      expect(result).toBe('-100');
      expect(result.length).toBe(4);
    });
  });

  describe('Positive decimals', () => {
    it('should format positive decimal with space padding', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(42.5, 5, 1, false);
      expect(result).toBe(' 42.5');
      expect(result.length).toBe(5);
    });

    it('should format positive decimal with zero padding', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(42.5, 6, 1, true);
      expect(result).toBe('0042.5');
      expect(result.length).toBe(6);
    });
  });

  describe('Negative decimals', () => {
    it('should count the minus sign as a character ', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-42.2, 3, 1, false);
      expect(result).toBe('-42');
      expect(result.length).toBe(3);
    });
    it('should add padding with space before the minus sign', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-42, 5, 1, false);
      expect(result).toBe('  -42');
      expect(result.length).toBe(5);
    });
    it('should add padding with zeroes after the minus sign', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(-42, 5, 1, true);
      expect(result).toBe('-0042');
      expect(result.length).toBe(5);
    });
  });

  describe('Edge cases', () => {
    it('should format zero', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(0, 4, 2, false);
      expect(result.length).toBe(4);
    });

    it('should format very small positive with zero padding', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(1.23, 6, 2, true);
      expect(result).toBe('001.23');
      expect(result.length).toBe(6);
    });

    it('should handle no fractions (maxFractionDigits=0)', () => {
      const result = sevenSegmentDisplay.formatWithPrioritySigDigits(3.99, 3, 0, false);
      expect(result).toBe('  4');
      expect(result.length).toBe(3);
    });
  });
});