import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const projectUrl = 'https://yolzjswhzhylduujkyrn.supabase.co';
const publishableKey = (process.argv[2] || '').trim();
const secretKey = (process.argv[3] || '').trim();

if (!publishableKey || publishableKey.includes('YOUR_')) {
  console.error('❌ Please replace YOUR_PUBLISHABLE_KEY with your actual Supabase Publishable (or anon) key.');
  process.exit(1);
}

// Write ONLY to .env (which is in .gitignore so it will NEVER be committed to Git).
// Notice that SUPABASE_SECRET_KEY does NOT have a VITE_ prefix, so Vite never bundles it into the browser!
const envContent = `SUPABASE_URL="${projectUrl}"
VITE_SUPABASE_URL="${projectUrl}"
SUPABASE_PUBLISHABLE_KEY="${publishableKey}"
VITE_SUPABASE_PUBLISHABLE_KEY="${publishableKey}"
SUPABASE_ANON_KEY="${publishableKey}"
VITE_SUPABASE_ANON_KEY="${publishableKey}"
SUPABASE_SECRET_KEY="${secretKey}"
SUPABASE_SERVICE_ROLE_KEY="${secretKey}"
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
`;
fs.writeFileSync(path.resolve('.env'), envContent, 'utf8');

console.log('🔒 Saved keys exclusively to .env (gitignored). Secret key is strictly backend-only!');

// Notify running server on port 3000 to connect & seed all Blinkit & Instamart products immediately
try {
  const res = await fetch('http://localhost:3000/api/supabase/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonKey: secretKey || publishableKey }),
  });
  const data = await res.json();
  console.log(`✅ Connected to ${projectUrl} — Seeded ${data.seededProductsCount || 0} products into Supabase!`);
} catch (err) {
  const supabase = createClient(projectUrl, secretKey || publishableKey);
  const { error } = await supabase.from('products').select('id').limit(1);
  if (error) {
    console.error('⚠️ Supabase connection test returned an error:', error.message);
  } else {
    console.log(`✅ Verified direct connection to ${projectUrl}!`);
  }
}
