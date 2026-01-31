/**
 * Unit tests for validation utilities
 */
import {
  formatApiError,
  validateAmount,
  validateEmail,
  validateExpenseSplit,
  validateLength,
  validateRequired,
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true);
      expect(validateEmail('user.name@domain.co.uk').isValid).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('').isValid).toBe(false);
      expect(validateEmail('notanemail').isValid).toBe(false);
      expect(validateEmail('@example.com').isValid).toBe(false);
      expect(validateEmail('test@').isValid).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should accept non-empty strings', () => {
      expect(validateRequired('value').isValid).toBe(true);
      expect(validateRequired('  value  ').isValid).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(validateRequired('').isValid).toBe(false);
      expect(validateRequired('   ').isValid).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should accept valid amounts', () => {
      expect(validateAmount(10).isValid).toBe(true);
      expect(validateAmount('50.25').isValid).toBe(true);
      expect(validateAmount(0.01).isValid).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount(0).isValid).toBe(false);
      expect(validateAmount(-10).isValid).toBe(false);
      expect(validateAmount('abc').isValid).toBe(false);
      expect(validateAmount('10.999').isValid).toBe(false); // Too many decimals
    });

    it('should reject unreasonably large amounts', () => {
      expect(validateAmount(2000000).isValid).toBe(false);
    });
  });

  describe('validateLength', () => {
    it('should validate string length', () => {
      expect(validateLength('hello', 3, 10).isValid).toBe(true);
      expect(validateLength('hi', 3, 10).isValid).toBe(false);
      expect(validateLength('this is too long', 3, 10).isValid).toBe(false);
    });
  });

  describe('validateExpenseSplit', () => {
    it('should validate equal split', () => {
      const splits = [{ amount: 25 }, { amount: 25 }, { amount: 25 }, { amount: 25 }];
      expect(validateExpenseSplit(splits, 100, 'equal').isValid).toBe(true);
    });

    it('should validate percentage split', () => {
      const splits = [{ amount: 40 }, { amount: 30 }, { amount: 30 }];
      expect(validateExpenseSplit(splits, 100, 'percentage').isValid).toBe(true);
    });

    it('should reject invalid splits', () => {
      const splits = [{ amount: 30 }, { amount: 30 }];
      expect(validateExpenseSplit(splits, 100, 'equal').isValid).toBe(false);
    });

    it('should require at least one person in split', () => {
      expect(validateExpenseSplit([], 100, 'equal').isValid).toBe(false);
    });
  });

  describe('formatApiError', () => {
    it('should format string errors', () => {
      expect(formatApiError('Error message')).toBe('Error message');
    });

    it('should extract error from API response', () => {
      const error = {
        data: { detail: 'API error message' },
      };
      expect(formatApiError(error)).toBe('API error message');
    });

    it('should format HTTP status errors', () => {
      expect(formatApiError({ status: 401 })).toContain('Unauthorized');
      expect(formatApiError({ status: 403 })).toContain('permission');
      expect(formatApiError({ status: 404 })).toContain('not found');
      expect(formatApiError({ status: 500 })).toContain('Server error');
    });

    it('should handle network errors', () => {
      const error = { status: 'FETCH_ERROR' };
      expect(formatApiError(error)).toContain('Network error');
    });

    it('should provide default error message', () => {
      expect(formatApiError({})).toContain('unexpected error');
    });
  });
});
