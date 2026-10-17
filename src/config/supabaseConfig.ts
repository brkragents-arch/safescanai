/**
 * ============================================================================
 * SUPABASE CONFIGURATION
 * ============================================================================
 * Security Best Practice:
 * - Keys are stored in `.env` (which is gitignored and never committed).
 * - Only the Publishable (`anon`) key is exposed to the browser via `VITE_SUPABASE_PUBLISHABLE_KEY`,
 *   which is protected by Supabase Row-Level Security (RLS).
 * - Your Secret (`service_role`) key is stored strictly in `.env` without a `VITE_` prefix,
 *   so it stays 100% on the backend (`server.ts`) and is NEVER sent to the browser.
 */

export const SUPABASE_CONFIG = {
  projectUrl: 'https://yolzjswhzhylduujkyrn.supabase.co',
  publishableKey: 'PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE',
};
