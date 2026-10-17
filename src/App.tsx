/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ActiveScreen, 
  Product, 
  Ingredient, 
  UserPreferences, 
  ScanHistoryRecord,
  ProductType 
} from './types/scanner';
import { 
  MOCK_PRODUCTS, 
  INITIAL_USER_PREFERENCES, 
  INGREDIENT_OF_THE_DAY, 
  INITIAL_SCAN_HISTORY 
} from './data/mockProducts';
import { QUICK_COMMERCE_PRODUCTS } from './data/quickCommerceCatalog';
import {
  resolveExactProductImage,
  isAuthenticProductImageUrl,
} from './utils/productImageGenerator';
import {
  fetchProductsFromSupabase,
  fetchScanHistoryFromSupabase,
  fetchUserPreferencesFromSupabase,
  upsertScanHistoryToSupabase,
  upsertUserPreferencesToSupabase,
  deleteScanHistoryFromSupabase,
  clearScanHistoryInSupabase,
} from './services/supabaseService';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { ApiExplorerModal } from './components/common/ApiExplorerModal';
import { HomeScreen } from './components/screens/HomeScreen';
import { ScanScreen } from './components/screens/ScanScreen';
import { ProductResultScreen } from './components/screens/ProductResultScreen';
import { IngredientModal } from './components/screens/IngredientModal';
import { CompareScreen } from './components/screens/CompareScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';

const ensureAccurateProductImage = (p: Product): Product => ({
  ...p,
  image: isAuthenticProductImageUrl(p.image)
    ? p.image
    : resolveExactProductImage({
        name: p.name,
        brand: p.brand,
        category: p.category,
        type: p.type,
      }),
});

export default function App() {
  // Navigation & View state
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [scanInitialType, setScanInitialType] = useState<ProductType>('food');
  const [selectedProduct, setSelectedProduct] = useState<Product>(() =>
    ensureAccurateProductImage(MOCK_PRODUCTS[0])
  );
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [compareInitialProductId, setCompareInitialProductId] = useState<string | undefined>(undefined);
  
  // App data state: dynamic products catalog (mock + Blinkit/Instamart catalog + any searched/scanned products)
  const [allProducts, setAllProducts] = useState<Product[]>(() => {
    const baseCatalog = [...MOCK_PRODUCTS].map(ensureAccurateProductImage);
    for (const qp of QUICK_COMMERCE_PRODUCTS) {
      if (!baseCatalog.some((p) => p.id === qp.id)) {
        baseCatalog.push(ensureAccurateProductImage(qp));
      }
    }
    try {
      const stored = localStorage.getItem('safescan_products');
      if (stored) {
        const parsed = (JSON.parse(stored) as Product[]).map(ensureAccurateProductImage);
        const combined = [...parsed];
        for (const bp of baseCatalog) {
          if (!combined.some((p) => p.id === bp.id)) {
            combined.push(bp);
          }
        }
        return combined;
      }
    } catch (e) {}
    return baseCatalog;
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem('safescan_preferences');
      if (stored) {
        const parsed = JSON.parse(stored) as UserPreferences;
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return INITIAL_USER_PREFERENCES;
  });
  
  // App scan history state: persisted in localStorage so search/scan items are saved
  const [scanHistory, setScanHistory] = useState<ScanHistoryRecord[]>(() => {
    try {
      const stored = localStorage.getItem('safescan_history');
      if (stored) {
        const parsed = JSON.parse(stored) as ScanHistoryRecord[];
        if (parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_SCAN_HISTORY;
  });

  // Hydrate from Supabase (`https://yolzjswhzhylduujkyrn.supabase.co`) on startup.
  // Products are read-only for the public key; history & preferences are private
  // to this visitor's anonymous Supabase user (RLS: user_id = auth.uid()).
  useEffect(() => {
    (async () => {
      const remoteProducts = await fetchProductsFromSupabase();
      if (remoteProducts && remoteProducts.length > 0) {
        setAllProducts((prev) => {
          const map = new Map<string, Product>();
          for (const rp of remoteProducts) map.set(rp.id, ensureAccurateProductImage(rp));
          for (const lp of prev) {
            if (!map.has(lp.id)) map.set(lp.id, ensureAccurateProductImage(lp));
          }
          return Array.from(map.values());
        });
      }

      const remoteHistory = await fetchScanHistoryFromSupabase();
      if (remoteHistory) {
        // Make sure every product referenced by history is available to open
        if (remoteHistory.products.length > 0) {
          setAllProducts((prev) => {
            const map = new Map<string, Product>(prev.map((p) => [p.id, p]));
            for (const sp of remoteHistory.products) {
              if (!map.has(sp.id)) map.set(sp.id, ensureAccurateProductImage(sp));
            }
            return Array.from(map.values());
          });
        }

        if (remoteHistory.records.length > 0) {
          setScanHistory((localHistory) => {
            // Push any local-only records (made before DB was reachable) up to Supabase
            const remoteIds = new Set(remoteHistory.records.map((r) => r.id));
            const localOnly = localHistory.filter(
              (r) => !remoteIds.has(r.id) && !INITIAL_SCAN_HISTORY.some((i) => i.id === r.id)
            );
            for (const r of localOnly) upsertScanHistoryToSupabase(r);
            const merged = [...localOnly, ...remoteHistory.records];
            try {
              localStorage.setItem('safescan_history', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      }

      const remotePrefs = await fetchUserPreferencesFromSupabase();
      if (remotePrefs) {
        setUserPreferences(remotePrefs);
        try {
          localStorage.setItem('safescan_preferences', JSON.stringify(remotePrefs));
        } catch (e) {}
      }
    })();
  }, []);
  
  // Toggle device frame preview (Mobile frame vs Full Responsive Desktop)
  const [isMobileDeviceFrame, setIsMobileDeviceFrame] = useState<boolean>(false);
  // Toggle API Explorer Modal
  const [isApiConsoleOpen, setIsApiConsoleOpen] = useState<boolean>(false);

  // Navigation handlers
  const handleNavigate = (screen: ActiveScreen) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartScanFood = () => {
    setScanInitialType('food');
    setActiveScreen('scan');
  };

  const handleStartScanCosmetics = () => {
    setScanInitialType('cosmetics');
    setActiveScreen('scan');
  };

  const handleStartScanFruit = () => {
    setScanInitialType('fruit');
    setActiveScreen('scan');
  };

  const handleOpenProduct = (
    product: Product,
    method: 'camera' | 'barcode' | 'upload' | 'demo' | 'search' | 'fruit' = 'search'
  ) => {
    const normalizedProduct = ensureAccurateProductImage(product);

    // 1. Save product into allProducts catalog + Supabase
    setAllProducts((prev) => {
      const exists = prev.some((p) => p.id === normalizedProduct.id);
      const updated = exists
        ? prev.map((p) => (p.id === normalizedProduct.id ? normalizedProduct : p))
        : [normalizedProduct, ...prev];
      try {
        localStorage.setItem('safescan_products', JSON.stringify(updated.slice(0, 50)));
      } catch (e) {}
      return updated;
    });
    // Note: products are NOT written from the browser any more (public key is read-only
    // on `products`). The product is stored as a snapshot inside the history row instead.

    // 2. Add to scan history with timestamp + Supabase (private to this visitor)
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newRecord: ScanHistoryRecord = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: normalizedProduct.id,
      scannedAt: `${now.toLocaleDateString([], { day: '2-digit', month: 'short' })}, ${timeFormatted}`,
      method,
    };

    // Older entries for the same product are replaced by the new one (locally and in DB)
    const replacedRecords = scanHistory.filter((r) => r.productId === normalizedProduct.id);
    setScanHistory((prev) => {
      const filtered = prev.filter((r) => r.productId !== normalizedProduct.id);
      const updated = [newRecord, ...filtered];
      try {
        localStorage.setItem('safescan_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    upsertScanHistoryToSupabase(newRecord, normalizedProduct);
    for (const r of replacedRecords) deleteScanHistoryFromSupabase(r.id);

    setSelectedProduct(normalizedProduct);
    setActiveScreen('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductScanned = (
    product: Product,
    method: 'camera' | 'barcode' | 'upload' | 'demo' | 'search' | 'fruit'
  ) => {
    handleOpenProduct(product, method);
  };

  const handleDeleteHistoryItem = (recordId: string) => {
    setScanHistory((prev) => {
      const updated = prev.filter((r) => r.id !== recordId);
      try {
        localStorage.setItem('safescan_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    deleteScanHistoryFromSupabase(recordId);
  };

  const handleOpenIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
  };

  const handleCompareAlternatives = (product: Product) => {
    setCompareInitialProductId(product.id);
    setActiveScreen('compare');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    setScanHistory([]);
    try {
      localStorage.removeItem('safescan_history');
    } catch (e) {}
    clearScanHistoryInSupabase();
  };

  const handleRestoreHistory = () => {
    setScanHistory(INITIAL_SCAN_HISTORY);
    try {
      localStorage.setItem('safescan_history', JSON.stringify(INITIAL_SCAN_HISTORY));
    } catch (e) {}
  };

  const handleSavePreferences = (updated: UserPreferences) => {
    setUserPreferences(updated);
    try {
      localStorage.setItem('safescan_preferences', JSON.stringify(updated));
    } catch (e) {}
    upsertUserPreferencesToSupabase(updated);
  };

  const handleResetPreferences = () => {
    setUserPreferences(INITIAL_USER_PREFERENCES);
    try {
      localStorage.setItem('safescan_preferences', JSON.stringify(INITIAL_USER_PREFERENCES));
    } catch (e) {}
    upsertUserPreferencesToSupabase(INITIAL_USER_PREFERENCES);
  };

  // Recent scans resolved for home dashboard dynamically from allProducts
  const recentProducts = scanHistory.slice(0, 5).map((record) => {
    const product = allProducts.find((p) => p.id === record.productId) || allProducts[0];
    return { record, product };
  }).filter((item) => !!item.product);

  // Render current screen content
  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return (
          <HomeScreen
            onScanFood={handleStartScanFood}
            onScanCosmetics={handleStartScanCosmetics}
            onScanFruit={handleStartScanFruit}
            onOpenProduct={handleOpenProduct}
            onOpenIngredient={handleOpenIngredient}
            onNavigateToHistory={() => handleNavigate('history')}
            onNavigateToProfile={() => handleNavigate('profile')}
            recentProducts={recentProducts}
            ingredientOfTheDay={INGREDIENT_OF_THE_DAY}
            userPreferences={userPreferences}
          />
        );
      case 'scan':
        return (
          <ScanScreen
            initialType={scanInitialType}
            availableProducts={allProducts}
            userPreferences={userPreferences}
            onProductScanned={handleProductScanned}
            onOpenApiConsole={() => setIsApiConsoleOpen(true)}
            onCancel={() => handleNavigate('home')}
          />
        );
      case 'product-detail':
        return (
          <ProductResultScreen
            product={selectedProduct}
            userPreferences={userPreferences}
            onBack={() => handleNavigate('home')}
            onOpenIngredient={handleOpenIngredient}
            onCompareAlternatives={handleCompareAlternatives}
          />
        );
      case 'compare':
        return (
          <CompareScreen
            initialProductId={compareInitialProductId}
            allProducts={allProducts}
            userPreferences={userPreferences}
            onOpenProduct={handleOpenProduct}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            historyRecords={scanHistory}
            allProducts={allProducts}
            onOpenProduct={handleOpenProduct}
            onClearHistory={handleClearHistory}
            onRestoreHistory={handleRestoreHistory}
            onDeleteRecord={handleDeleteHistoryItem}
            onNavigateToScan={() => handleNavigate('scan')}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            preferences={userPreferences}
            onSavePreferences={handleSavePreferences}
            onResetPreferences={handleResetPreferences}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        isMobileDeviceFrame={isMobileDeviceFrame}
        onToggleDeviceFrame={() => setIsMobileDeviceFrame(!isMobileDeviceFrame)}
        onOpenApiConsole={() => setIsApiConsoleOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex justify-center py-4 sm:py-8 px-2 sm:px-6">
        {isMobileDeviceFrame ? (
          /* Mobile Device Frame Simulation (390px viewport container) */
          <div className="w-full max-w-[400px] bg-stone-50 rounded-[44px] shadow-2xl border-[8px] border-stone-800 overflow-hidden flex flex-col min-h-[820px] relative">
            {/* Phone Speaker & Camera Notch */}
            <div className="w-full h-8 bg-stone-800 flex items-center justify-center shrink-0">
              <div className="w-20 h-4 bg-stone-900 rounded-full flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-stone-700" />
                <div className="w-8 h-1 rounded-full bg-stone-700" />
              </div>
            </div>

            {/* Inner Mobile Scroll Area */}
            <main className="flex-1 overflow-y-auto p-4 pb-20">
              {renderScreen()}
            </main>

            {/* In-Frame Bottom Navigation */}
            <div className="shrink-0">
              <BottomNav activeScreen={activeScreen} onNavigate={handleNavigate} />
            </div>
          </div>
        ) : (
          /* Standard Responsive Web Layout (max-w-6xl) */
          <main className="w-full max-w-6xl">
            {renderScreen()}
          </main>
        )}
      </div>

      {/* Mobile Fixed Bottom Navigation (for actual mobile devices) */}
      {!isMobileDeviceFrame && (
        <BottomNav activeScreen={activeScreen} onNavigate={handleNavigate} />
      )}

      {/* Global Ingredient Inspection Modal */}
      {selectedIngredient && (
        <IngredientModal
          ingredient={selectedIngredient}
          userPreferences={userPreferences}
          onClose={() => setSelectedIngredient(null)}
        />
      )}

      {/* Global REST API Console & Explorer Modal */}
      <ApiExplorerModal
        isOpen={isApiConsoleOpen}
        onClose={() => setIsApiConsoleOpen(false)}
      />
    </div>
  );
}
