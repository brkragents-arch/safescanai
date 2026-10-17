import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, ScanHistoryRecord, UserPreferences } from '../types/scanner';
import { SUPABASE_CONFIG } from '../config/supabaseConfig';

export const DEFAULT_SUPABASE_URL = 'https://yolzjswhzhylduujkyrn.supabase.co';

function getEnvVar(key: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key] as string;
    }
  } catch (e) {}
  return '';
}

function isRealKey(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return (
    trimmed.length > 15 &&
    !trimmed.startsWith('PASTE_YOUR_') &&
    trimmed !== 'your-supabase-anon-public-key'
  );
}

let cachedClient: SupabaseClient | null = null;
let runtimeAnonKey: string = '';

export function configureSupabaseRuntimeKey(anonKey: string) {
  runtimeAnonKey = anonKey.trim();
  cachedClient = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('safescan_supabase_key', runtimeAnonKey);
    }
  } catch (e) {}
}

export function getSupabaseConfig() {
  const url =
    SUPABASE_CONFIG.projectUrl ||
    getEnvVar('SUPABASE_URL') ||
    getEnvVar('VITE_SUPABASE_URL') ||
    DEFAULT_SUPABASE_URL;

  let storedBrowserKey = '';
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      storedBrowserKey = window.localStorage.getItem('safescan_supabase_key') || '';
    }
  } catch (e) {}

  const isServerSide = typeof window === 'undefined';

  const candidateKeys = [
    ...(isServerSide
      ? [
          getEnvVar('SUPABASE_SECRET_KEY'),
          getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
        ]
      : []),
    runtimeAnonKey,
    storedBrowserKey,
    getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY'),
    getEnvVar('VITE_SUPABASE_ANON_KEY'),
    getEnvVar('SUPABASE_PUBLISHABLE_KEY'),
    getEnvVar('SUPABASE_ANON_KEY'),
    SUPABASE_CONFIG.publishableKey,
  ];

  const validKey = candidateKeys.find((k) => isRealKey(k)) || '';

  return {
    url,
    key: validKey,
    isConfigured: Boolean(url && validKey),
  };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}

// ---------------------------------------------------------------------------
// Mappers between TypeScript Product and Supabase `public.products` table row
// ---------------------------------------------------------------------------
export function mapProductToRow(product: Product) {
  const safeType =
    product.type === 'cosmetics'
      ? 'cosmetics'
      : product.type === 'fruit' || product.type === 'vegetable' || product.type === 'produce'
      ? 'fruit'
      : 'food';

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    type: safeType,
    category: product.category,
    image: product.image,
    barcode: product.barcode || '',
    assessment: product.assessment,
    assessment_headline: product.assessmentHeadline || '',
    assessment_summary: product.assessmentSummary || '',
    confidence: product.confidence || 'High',
    allergens: product.allergens || [],
    nutrition: product.nutrition || null,
    cosmetic_profile: product.cosmeticProfile || null,
    fruit_ripeness: product.fruitProfile || null,
    ingredients: product.ingredients || [],
    potential_concerns: product.potentialConcerns || [],
    sample_price: product.samplePrice || '',
    comparison_alternatives: product.comparisonAlternatives || [],
    quick_commerce: product.quickCommerce || null,
    is_sample_demonstration: Boolean(product.isSampleDemonstration),
    regulatory_notice: product.regulatoryNotice || '',
    updated_at: new Date().toISOString(),
  };
}

export function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    type: row.type,
    category: row.category,
    image: row.image,
    barcode: row.barcode || '',
    assessment: row.assessment,
    assessmentHeadline: row.assessment_headline || '',
    assessmentSummary: row.assessment_summary || '',
    confidence: row.confidence || 'High',
    allergens: Array.isArray(row.allergens) ? row.allergens : [],
    nutrition: row.nutrition || undefined,
    cosmeticProfile: row.cosmetic_profile || undefined,
    fruitProfile: row.fruit_ripeness || undefined,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    potentialConcerns: Array.isArray(row.potential_concerns) ? row.potential_concerns : [],
    samplePrice: row.sample_price || '',
    comparisonAlternatives: Array.isArray(row.comparison_alternatives)
      ? row.comparison_alternatives
      : [],
    quickCommerce: row.quick_commerce || undefined,
    isSampleDemonstration: Boolean(row.is_sample_demonstration),
    regulatoryNotice: row.regulatory_notice || '',
  };
}

// ---------------------------------------------------------------------------
// Database Operations for Products, Scan History & User Preferences
// ---------------------------------------------------------------------------
export async function upsertProductToSupabase(product: Product): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client
      .from('products')
      .upsert(mapProductToRow(product), { onConflict: 'id' });
    return !error;
  } catch (e) {
    return false;
  }
}

export async function seedProductsToSupabase(products: Product[]): Promise<number> {
  const client = getSupabaseClient();
  if (!client || products.length === 0) return 0;
  try {
    const rows = products.map(mapProductToRow);
    const { error } = await client.from('products').upsert(rows, { onConflict: 'id' });
    if (error) return 0;
    return rows.length;
  } catch (e) {
    return 0;
  }
}

export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(200);
    if (error || !data) return null;
    return data.map(mapRowToProduct);
  } catch (e) {
    return null;
  }
}

export async function upsertScanHistoryToSupabase(
  record: ScanHistoryRecord,
  userId = 'default_user'
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const safeMethod =
      record.method === 'vegetable' || record.method === 'produce'
        ? 'fruit'
        : record.method;
    const { error } = await client.from('scan_history').upsert(
      {
        id: record.id,
        user_id: userId,
        product_id: record.productId,
        timestamp: record.scannedAt,
        method: safeMethod,
        saved: true,
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch (e) {
    return false;
  }
}

export async function fetchScanHistoryFromSupabase(
  userId = 'default_user'
): Promise<ScanHistoryRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('scan_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      productId: row.product_id,
      scannedAt: row.timestamp,
      method: row.method,
    }));
  } catch (e) {
    return null;
  }
}

export async function upsertUserPreferencesToSupabase(
  prefs: UserPreferences,
  userId = 'default_user'
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('user_preferences').upsert(
      {
        user_id: userId,
        food_allergies: prefs.foodAllergies,
        dietary_preferences: prefs.dietaryPreferences,
        skin_type: prefs.skinType,
        cosmetic_sensitivities: prefs.cosmeticSensitivities,
        avoid_ingredients: prefs.avoidIngredients,
        units: prefs.units,
        language: prefs.language,
        privacy_local_only: prefs.privacyLocalOnly,
        analytics_consent: prefs.analyticsConsent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    return !error;
  } catch (e) {
    return false;
  }
}

export async function fetchUserPreferencesFromSupabase(
  userId = 'default_user'
): Promise<UserPreferences | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      foodAllergies: Array.isArray(data.food_allergies) ? data.food_allergies : [],
      dietaryPreferences: Array.isArray(data.dietary_preferences) ? data.dietary_preferences : [],
      skinType: data.skin_type || 'sensitive',
      cosmeticSensitivities: Array.isArray(data.cosmetic_sensitivities)
        ? data.cosmetic_sensitivities
        : [],
      avoidIngredients: Array.isArray(data.avoid_ingredients) ? data.avoid_ingredients : [],
      units: data.units || 'metric',
      language: data.language || 'English',
      privacyLocalOnly: Boolean(data.privacy_local_only),
      analyticsConsent: Boolean(data.analytics_consent),
    };
  } catch (e) {
    return null;
  }
}
