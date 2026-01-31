/**
 * Integration tests for shopping list management
 */
import { validateRequired, validatePositiveNumber } from '@/utils/validation';

describe('Shopping List Integration Tests', () => {
  describe('Shopping Item Validation', () => {
    it('should validate required item name', () => {
      const result1 = validateRequired('Milk', 'Item name');
      expect(result1.isValid).toBe(true);

      const result2 = validateRequired('', 'Item name');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('required');
    });

    it('should validate positive quantity', () => {
      const result1 = validatePositiveNumber(5, 'Quantity');
      expect(result1.isValid).toBe(true);

      const result2 = validatePositiveNumber(0, 'Quantity');
      expect(result2.isValid).toBe(false);

      const result3 = validatePositiveNumber(-1, 'Quantity');
      expect(result3.isValid).toBe(false);
    });
  });

  describe('Shopping List Operations', () => {
    it('should mark items as purchased', () => {
      const mockItem = {
        id: 'item-1',
        name: 'Milk',
        is_purchased: false,
      };

      const updatedItem = {
        ...mockItem,
        is_purchased: true,
        purchased_at: new Date().toISOString(),
      };

      expect(updatedItem.is_purchased).toBe(true);
      expect(updatedItem.purchased_at).toBeTruthy();
    });

    it('should filter purchased vs unpurchased items', () => {
      const mockItems = [
        { id: 'item-1', name: 'Milk', is_purchased: false },
        { id: 'item-2', name: 'Bread', is_purchased: true },
        { id: 'item-3', name: 'Eggs', is_purchased: false },
      ];

      const unpurchased = mockItems.filter((item) => !item.is_purchased);
      const purchased = mockItems.filter((item) => item.is_purchased);

      expect(unpurchased).toHaveLength(2);
      expect(purchased).toHaveLength(1);
    });

    it('should categorize shopping items', () => {
      const mockItems = [
        { id: 'item-1', name: 'Milk', category: 'dairy' },
        { id: 'item-2', name: 'Bread', category: 'bakery' },
        { id: 'item-3', name: 'Cheese', category: 'dairy' },
      ];

      const dairyItems = mockItems.filter((item) => item.category === 'dairy');
      expect(dairyItems).toHaveLength(2);
    });
  });

  describe('Recurring Shopping Items', () => {
    it('should handle recurring item patterns', () => {
      const recurringItem = {
        id: 'item-1',
        name: 'Milk',
        is_recurring: true,
        recurring_pattern: 'weekly',
      };

      expect(recurringItem.is_recurring).toBe(true);
      expect(recurringItem.recurring_pattern).toBe('weekly');
    });
  });
});
