/**
 * Global Regex Validation Utility
 * Standardized patterns for data integrity across the platform.
 */

// RFC 5322 Official Standard for Email Validation
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Minimum 8 characters, at least one uppercase letter, one number and one special character (any non-alphanumeric)
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Allows standard international (+xxx) and 10+ digit national prefixes.
export const PHONE_REGEX = /^(?:\+?\d{1,3})?[-. (]*\d{3}[-. )]*\d{3}[-. ]*\d{4}$/;

// Name allows letters, spaces, hyphens and apostrophes, no numbers or special symbols.
export const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/;

// Positive floating point numbers (e.g., for prices)
export const PRICE_REGEX = /^(0|[1-9]\d*)(\.\d+)?$/;

export const validateEmail = (email) => EMAIL_REGEX.test(email);
export const validatePassword = (password) => PASSWORD_REGEX.test(password);
export const validatePhone = (phone) => PHONE_REGEX.test(phone);
export const validateName = (name) => NAME_REGEX.test(name);
export const validatePrice = (price) => PRICE_REGEX.test(price) && parseFloat(price) > 0;
