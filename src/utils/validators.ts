// Common validation patterns used by both client and server.
// Use these patterns to validate email addresses and French phone numbers.
export const EMAIL_REGEX = /^[^\s@]+@[^\s.@]+\.[^\s@]+$/
// French phone numbers:
//  - 0X XX XX XX XX
//  - +33 X XX XX XX XX
// Spaces, dots and dashes are allowed as separators.
export const FR_PHONE_REGEX = /^(?:\+33\s?[1-9](?:[\s.-]?\d{2}){4}|0[1-9](?:[\s.-]?\d{2}){4})$/

/**
 * Validate an email address string.
 * Returns true for valid emails, false otherwise.
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

/**
 * Validate a French telephone number.
 * Returns true for valid numbers, false otherwise.
 */
export function isValidFrenchPhone(value: string): boolean {
  return FR_PHONE_REGEX.test(value.trim())
}
