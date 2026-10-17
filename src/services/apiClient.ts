import { Product, Ingredient, UserPreferences, ProductType } from '../types/scanner';
import { lookupBarcodeInBrowser } from './browserBarcodeLookup';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  aiEngineActive: boolean;
  totalIndexedProducts: number;
  features: {
    barcodeLookup: boolean;
    openFoodFactsIntegration: boolean;
    openBeautyFactsIntegration: boolean;
    liveInternetSearch: boolean;
    ingredientAnalysis: boolean;
    allergenScreening: boolean;
    productComparison: boolean;
    geminiLiveParsing: boolean;
  };
}

export interface AnalyzePayload {
  text: string;
  type?: ProductType;
  productName?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  imageUrl?: string;
  userPreferences?: UserPreferences;
}

export interface AnalyzeResponse {
  success: boolean;
  method: string;
  product: Product;
}

export type QuickCommercePlatform = 'all' | 'blinkit' | 'instamart' | 'amazon';

export interface LiveSearchResultItem {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  image: string;
  ingredientsText: string;
  category: string;
  subCategory?: string;
  type: ProductType;
  packSize?: string;
  blinkitPrice?: string;
  instamartPrice?: string;
  amazonPrice?: string;
  blinkitEta?: string;
  instamartEta?: string;
  amazonEta?: string;
  blinkitUrl?: string;
  instamartUrl?: string;
  amazonUrl?: string;
  availableOn?: ('blinkit' | 'instamart' | 'amazon')[];
}

export interface SearchSuggestionsResponse {
  query: string;
  store: QuickCommercePlatform;
  keywordSuggestions: string[];
  productSuggestions: LiveSearchResultItem[];
}

export function buildBlinkitSearchUrl(query: string): string {
  return `https://blinkit.com/s/?q=${encodeURIComponent(query.trim())}`;
}

export function buildInstamartSearchUrl(query: string): string {
  return `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query.trim())}`;
}

export function buildAmazonSearchUrl(query: string): string {
  return `https://www.amazon.in/s?k=${encodeURIComponent(query.trim())}`;
}

export const SafeScanAPI = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async getProducts(params?: { type?: ProductType; search?: string; assessment?: string }): Promise<{ count: number; products: Product[] }> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    if (params?.assessment) query.set('assessment', params.assessment);

    const res = await fetch(`/api/products?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async getProductById(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async getProductByBarcode(code: string): Promise<{ found: boolean; source?: string; product: Product }> {
    let backendError = '';
    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`);
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      if (res.ok && isJson) return res.json();
      if (isJson) {
        const err = await res.json().catch(() => ({}));
        backendError = err.message || '';
      }
    } catch (e) {
      // backend not reachable (e.g. static GitHub Pages deployment)
    }

    // Fallback: query Open Food Facts / Open Beauty Facts straight from the browser
    const product = await lookupBarcodeInBrowser(code);
    if (product) return { found: true, source: 'open-facts-browser', product };
    throw new Error(backendError || `Barcode ${code} was not found in Open Food Facts or Open Beauty Facts.`);
  },

  async searchLiveProducts(
    query: string,
    store: QuickCommercePlatform = 'all'
  ): Promise<{ query: string; store?: string; count: number; results: LiveSearchResultItem[] }> {
    const params = new URLSearchParams({ q: query, store });
    const res = await fetch(`/api/search-live?${params.toString()}`);
    if (!res.ok) throw new Error(`Search error ${res.status}`);
    return res.json();
  },

  async getSearchSuggestions(
    query: string,
    store: QuickCommercePlatform = 'all'
  ): Promise<SearchSuggestionsResponse> {
    const params = new URLSearchParams({ q: query, store });
    const res = await fetch(`/api/suggestions?${params.toString()}`);
    if (!res.ok) throw new Error(`Suggestions error ${res.status}`);
    return res.json();
  },

  async analyzeIngredients(payload: AnalyzePayload): Promise<AnalyzeResponse> {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Analysis failed with status ${res.status}`);
    }
    return res.json();
  },

  async compareProducts(productIds: string[]): Promise<{ comparedProducts: Product[]; comparisonSummary: string }> {
    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds }),
    });
    if (!res.ok) throw new Error(`Comparison failed with status ${res.status}`);
    return res.json();
  },

  async getIngredientOfTheDay(): Promise<Ingredient> {
    const res = await fetch('/api/ingredient-of-the-day');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async scanProduce(payload: {
    imageBase64?: string;
    produceName?: string;
    sampleId?: string;
    produceType?: 'fruit' | 'vegetable';
    userPreferences?: UserPreferences;
  }): Promise<{ success: boolean; method: string; product: Product }> {
    const res = await fetch('/api/produce-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Produce analysis failed with status ${res.status}`);
    }
    return res.json();
  },

  async scanFruit(payload: {
    imageBase64?: string;
    fruitName?: string;
    sampleId?: string;
    userPreferences?: UserPreferences;
  }): Promise<{ success: boolean; method: string; product: Product }> {
    return this.scanProduce({
      imageBase64: payload.imageBase64,
      produceName: payload.fruitName,
      sampleId: payload.sampleId,
      produceType: 'fruit',
      userPreferences: payload.userPreferences,
    });
  },
};

