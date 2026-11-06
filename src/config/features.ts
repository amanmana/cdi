/**
 * Application feature flags and development toggles.
 * 
 * DISABLE_TURNSTILE:
 * - Set to true during development to bypass Cloudflare Turnstile widget and validation.
 * - Set to false when ready for production to re-enable Cloudflare Turnstile security.
 */
export const DISABLE_TURNSTILE = true;
