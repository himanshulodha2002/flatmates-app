/**
 * Validation utility functions for forms and inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Required field validation
 */
export function validateRequired(
  value: string,
  fieldName: string = 'This field'
): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
}

/**
 * Number validation (positive)
 */
export function validatePositiveNumber(
  value: string | number,
  fieldName: string = 'Value'
): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (num <= 0) {
    return { isValid: false, error: `${fieldName} must be greater than 0` };
  }

  return { isValid: true };
}

/**
 * Amount validation (currency)
 */
export function validateAmount(amount: string | number): ValidationResult {
  const result = validatePositiveNumber(amount, 'Amount');
  if (!result.isValid) {
    return result;
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check for reasonable max amount (e.g., $1 million)
  if (num > 1000000) {
    return { isValid: false, error: 'Amount seems unusually large' };
  }

  // Check for too many decimal places
  const decimalPlaces = amount.toString().split('.')[1]?.length || 0;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Amount can have at most 2 decimal places' };
  }

  return { isValid: true };
}

/**
 * Text length validation
 */
export function validateLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'Field'
): ValidationResult {
  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at most ${maxLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Date validation (not in past)
 */
export function validateFutureDate(
  date: Date | string,
  fieldName: string = 'Date'
): ValidationResult {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dateObj < today) {
    return { isValid: false, error: `${fieldName} cannot be in the past` };
  }

  return { isValid: true };
}

/**
 * URL validation
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
}

/**
 * Phone number validation (basic)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Basic validation - at least 10 digits
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }

  return { isValid: true };
}

/**
 * Validate expense split (total should equal 100% or expense amount)
 */
export function validateExpenseSplit(
  splits: { amount: number }[],
  totalAmount: number,
  splitType: 'equal' | 'custom' | 'percentage'
): ValidationResult {
  if (splits.length === 0) {
    return { isValid: false, error: 'At least one person must be added to the split' };
  }

  const sumOfSplits = splits.reduce((sum, split) => sum + split.amount, 0);

  if (splitType === 'percentage') {
    if (Math.abs(sumOfSplits - 100) > 0.01) {
      return { isValid: false, error: 'Split percentages must add up to 100%' };
    }
  } else {
    // Custom or equal splits - check if sum equals total amount
    if (Math.abs(sumOfSplits - totalAmount) > 0.01) {
      return {
        isValid: false,
        error: `Split amounts must add up to $${totalAmount.toFixed(2)}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Format error message from API response
 */
export function formatApiError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.data?.detail) {
    if (typeof error.data.detail === 'string') {
      return error.data.detail;
    }
    if (Array.isArray(error.data.detail)) {
      return error.data.detail.map((e: any) => e.msg || e.message).join(', ');
    }
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.status === 401) {
    return 'Unauthorized. Please log in again.';
  }

  if (error?.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error?.status === 404) {
    return 'The requested resource was not found.';
  }

  if (error?.status === 500) {
    return 'Server error. Please try again later.';
  }

  if (error?.status === 'FETCH_ERROR' || error?.originalStatus === 'FETCH_ERROR') {
    return 'Network error. Please check your internet connection.';
  }

  return 'An unexpected error occurred. Please try again.';
}
