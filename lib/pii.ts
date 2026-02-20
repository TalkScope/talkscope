/**
 * TalkScope PII Redaction Engine
 * Automatically removes sensitive personal data from transcripts before storage.
 */

type RedactionResult = {
  redacted: string;
  hits: Record<string, number>;
};

const PATTERNS: Array<{ name: string; re: RegExp; replace: string }> = [
  // Credit / debit card numbers
  { name: "credit_card",    re: /\b(?:\d[ -]?){13,16}\b/g,                                              replace: "[CARD-REDACTED]" },
  // SSN (US)
  { name: "ssn",            re: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,                                    replace: "[SSN-REDACTED]" },
  // Phone numbers
  { name: "phone",          re: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,        replace: "[PHONE-REDACTED]" },
  // Email addresses
  { name: "email",          re: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,                   replace: "[EMAIL-REDACTED]" },
  // IP addresses
  { name: "ip_address",     re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,                                         replace: "[IP-REDACTED]" },
  // CVV / CVC codes
  { name: "cvv",            re: /\b(?:cvv|cvc|security code)\s*:?\s*\d{3,4}\b/gi,                       replace: "[CVV-REDACTED]" },
  // Bank account numbers
  { name: "bank_account",   re: /\baccount\s*(?:number|#|no\.?)?\s*:?\s*\d{8,17}\b/gi,                  replace: "[ACCOUNT-REDACTED]" },
  // Dates of birth
  { name: "dob",            re: /\b(?:born|dob|date of birth|birthday)\s*:?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi, replace: "[DOB-REDACTED]" },
  // Passwords / PINs
  { name: "credential",     re: /\b(?:password|pin|secret)\s*:?\s*\S+/gi,                               replace: "[CREDENTIAL-REDACTED]" },
];

export function redactPII(transcript: string): RedactionResult {
  let redacted = transcript;
  const hits: Record<string, number> = {};

  for (const { name, re, replace } of PATTERNS) {
    const matches = redacted.match(re);
    if (matches && matches.length > 0) {
      hits[name] = matches.length;
      redacted = redacted.replace(re, replace);
    }
  }

  return { redacted, hits };
}

export function redactionSummary(hits: Record<string, number>): string {
  const parts = Object.entries(hits).map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`);
  if (!parts.length) return "No PII detected";
  return `Redacted: ${parts.join(", ")}`;
}
