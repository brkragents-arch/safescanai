import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './src/config/supabaseConfig.ts';

dotenv.config();

const url = process.env.SUPABASE_URL || SUPABASE_CONFIG.projectUrl || 'https://yolzjswhzhylduujkyrn.supabase.co';
const key =
  process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SECRET_KEY.includes('PASTE_YOUR_')
    ? process.env.SUPABASE_SECRET_KEY
    : process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const searchTerm = (process.argv[2] || '').trim();

if (!key || key.includes('PASTE_YOUR_')) {
  console.log('⚠️ Tip: Run `node set-supabase-keys.mjs "YOUR_PUBLISHABLE_KEY"` first if checking from terminal.');
  process.exit(1);
}

const supabase = createClient(url, key);

let query = supabase
  .from('products')
  .select('id, name, brand, category, assessment, blinkit_price, instamart_price');

if (searchTerm) {
  query = query.ilike('name', `%${searchTerm}%`);
} else {
  query = query.limit(10);
}

const { data, error } = await query;

if (error) {
  console.error('❌ Error querying Supabase:', error.message);
} else {
  console.log(`\n✅ Found ${data.length} record(s) in Supabase (https://yolzjswhzhylduujkyrn.supabase.co):`);
  console.table(data);
}
