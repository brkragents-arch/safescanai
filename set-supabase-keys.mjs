// Usage:  node set-supabase-keys.mjs
// Prompts for keys interactively (so they never land in your shell history)
// and MERGES them into .env (gitignored) without touching other values such as GEMINI_API_KEY.
import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { createClient } from '@supabase/supabase-js';

const projectUrl = 'https://yolzjswhzhylduujkyrn.supabase.co';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const publishableKey = (await rl.question('Supabase Publishable key (sb_publishable_... / anon): ')).trim();
const secretKey = (
  await rl.question('Supabase Secret key (optional, server-only — press Enter to skip): ')
).trim();
rl.close();

if (!publishableKey || publishableKey.startsWith('sb_secret_')) {
  console.error('❌ Please enter your Publishable (anon) key — not the Secret key.');
  process.exit(1);
}

const envPath = path.resolve('.env');
const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const updates = {
  SUPABASE_URL: projectUrl,
  VITE_SUPABASE_URL: projectUrl,
  SUPABASE_PUBLISHABLE_KEY: publishableKey,
  VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  // Secret key: NO `VITE_` prefix → never bundled into the browser.
  ...(secretKey ? { SUPABASE_SECRET_KEY: secretKey } : {}),
};

let content = existing;
for (const [k, v] of Object.entries(updates)) {
  const safe = String(v).replace(/[\r\n"]/g, '');
  const line = `${k}="${safe}"`;
  const re = new RegExp(`^${k}=.*$`, 'm');
  content = re.test(content) ? content.replace(re, () => line) : `${content.trimEnd()}\n${line}\n`;
}
fs.writeFileSync(envPath, content, 'utf8');
console.log('🔒 Keys merged into .env (gitignored). Restart the dev server to pick them up.');

const supabase = createClient(projectUrl, publishableKey);
const { error } = await supabase.from('products').select('id').limit(1);
console.log(error ? `⚠️ Connection test error: ${error.message}` : `✅ Verified connection to ${projectUrl}`);
