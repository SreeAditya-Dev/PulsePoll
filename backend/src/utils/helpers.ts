import crypto from 'crypto';

/*
  Server-side fingerprint validation helper.
  We hash the raw fingerprint from the client to normalize it
  and avoid storing overly long strings.
*/
export function hashFingerprint(rawFingerprint: string): string {
  return crypto
    .createHash('sha256')
    .update(rawFingerprint)
    .digest('hex')
    .substring(0, 64);
}

/*
  Sanitize user input to prevent XSS and injection.
  Strip HTML tags, trim whitespace, enforce max length.
*/
export function sanitizeText(input: string, maxLength: number): string {
  if (!input || typeof input !== 'string') return '';

  let cleaned = input
    .replace(/<[^>]*>/g, '')     // strip html tags
    .replace(/&[a-z]+;/gi, '')   // strip html entities
    .trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/*
  Generate a short, URL-safe share code.
  Uses nanoid-style approach but with a custom safe alphabet
  (no ambiguous chars like 0/O, 1/l/I).
*/
const SAFE_ALPHABET = '2345679abcdefghjkmnpqrstuvwxyz';

export function generateShareCode(length: number = 8): string {
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += SAFE_ALPHABET[bytes[i] % SAFE_ALPHABET.length];
  }
  return code;
}
