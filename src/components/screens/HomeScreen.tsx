import React, { useState, useEffect, useRef } from 'react';
import { Product, Ingredient, UserPreferences, ScanHistoryRecord } from '../../types/scanner';
import { 
  Scan, 
  Utensils, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight, 
  BookOpen, 
  Layers, 
  Search, 
  Barcode, 
  Loader2, 
  Globe, 
  CheckCircle2, 
  ExternalLink,
  ShoppingBag,
  Zap,
  X,
  TrendingUp
} from 'lucide-react';
import { AssessmentBadge } from '../common/AssessmentBadge';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import {
  SafeScanAPI,
  LiveSearchResultItem,
  QuickCommercePlatform,
  buildBlinkitSearchUrl,
  buildInstamartSearchUrl,
} from '../../services/apiClient';
import {
  filterLocalQuickCommerceSuggestions,
  convertCatalogItemToProduct,
  resolveNormalizedCategoryGroup,
} from '../../data/quickCommerceCatalog';
import {
  resolveExactProductImage,
  isAuthenticProductImageUrl,
  resolveFallbackProductSvg,
} from '../../utils/productImageGenerator';

interface Props {
  onScanFood: () => void;
  onScanCosmetics: () => void;
  onScanFruit: () => void;
  onOpenProduct: (product: Product, method?: 'camera' | 'barcode' | 'upload' | 'demo' | 'search' | 'fruit') => void;
  onOpenIngredient: (ingredient: Ingredient) => void;
  onNavigateToHistory: () => void;
  onNavigateToProfile: () => void;
  recentProducts: { record: ScanHistoryRecord; product: Product }[];
  ingredientOfTheDay: Ingredient;
  userPreferences: UserPreferences;
}

export const HomeScreen: React.FC<Props> = ({
  onScanFood,
  onScanCosmetics,
  onScanFruit,
  onOpenProduct,
  onOpenIngredient,
  onNavigateToHistory,
  onNavigateToProfile,
  recentProducts,
  ingredientOfTheDay,
  userPreferences,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<QuickCommercePlatform>('all');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<LiveSearchResultItem[]>([]);
  const [searchError, setSearchError] = useState<string>('');
  const [isResolvingItem, setIsResolvingItem] = useState<boolean>(false);
  const [resolvingStatus, setResolvingStatus] = useState<string>('');

  // Autocomplete Suggestions state
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<LiveSearchResultItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Instant local suggestions + debounced backend suggestions
  useEffect(() => {
    const localMatch = filterLocalQuickCommerceSuggestions(searchQuery, selectedStore);
    setKeywordSuggestions(localMatch.keywordSuggestions);
    setProductSuggestions(localMatch.productSuggestions);
    setHighlightedIndex(-1);

    const timer = setTimeout(async () => {
      try {
        const remote = await SafeScanAPI.getSearchSuggestions(searchQuery, selectedStore);
        if (remote.keywordSuggestions?.length) {
          setKeywordSuggestions(remote.keywordSuggestions);
        }
        const validRemoteProducts = (remote.productSuggestions || []).filter(
          (p) =>
            !p.name.startsWith('Pure Organic ') &&
            !p.name.startsWith('Clean Formulation ')
        );
        if (validRemoteProducts.length) {
          setProductSuggestions(validRemoteProducts);
        }
      } catch (e) {
        // Local suggestions already populated
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedStore]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = async (rawQuery: string, storeOverride?: QuickCommercePlatform) => {
    const query = rawQuery.trim();
    if (!query) return;
    const activeStore = storeOverride || selectedStore;

    setShowSuggestions(false);
    setSearchError('');
    setIsSearching(true);
    setSearchResults([]);

    try {
      // 1. If it's a numeric barcode (e.g. 1009559441 or 12-14 digits)
      if (/^\d{6,16}$/.test(query)) {
        setResolvingStatus(`Looking up barcode ${query} in Blinkit, Instamart & AI registries...`);
        setIsResolvingItem(true);
        const result = await SafeScanAPI.getProductByBarcode(query);
        setIsResolvingItem(false);
        setIsSearching(false);
        onOpenProduct(result.product, 'barcode');
        return;
      }

      // 2. Otherwise run live search across Blinkit, Instamart & global databases
      const data = await SafeScanAPI.searchLiveProducts(query, activeStore);
      const validResults = (data.results || []).filter(
        (p) =>
          !p.name.startsWith('Pure Organic ') &&
          !p.name.startsWith('Clean Formulation ')
      );
      if (validResults.length > 0) {
        setSearchResults(validResults);
      } else {
        const localFallback = filterLocalQuickCommerceSuggestions(query, activeStore).productSuggestions;
        if (localFallback.length > 0) {
          setSearchResults(localFallback);
        } else {
          setSearchError(`No live products found matching "${query}". Try searching by brand, item name, or numeric barcode.`);
        }
      }
    } catch (err: any) {
      const localFallback = filterLocalQuickCommerceSuggestions(query, activeStore).productSuggestions;
      if (localFallback.length > 0) {
        setSearchResults(localFallback);
      } else {
        setSearchError(err?.message || 'Search failed. Please try again.');
      }
    } finally {
      setIsSearching(false);
      setIsResolvingItem(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && highlightedIndex < productSuggestions.length) {
      handleSelectSearchResult(productSuggestions[highlightedIndex]);
      return;
    }
    await executeSearch(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'ArrowDown') {
        setShowSuggestions(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < productSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : productSuggestions.length - 1
      );
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSelectSearchResult = async (item: LiveSearchResultItem) => {
    setShowSuggestions(false);
    setIsResolvingItem(true);
    setResolvingStatus(`Collecting & analyzing Blinkit / Instamart ingredients for ${item.name}...`);

    const subCategory = item.subCategory || resolveNormalizedCategoryGroup(item);
    const exactImage = isAuthenticProductImageUrl(item.image)
      ? item.image
      : resolveExactProductImage({
          name: item.name,
          brand: item.brand,
          category: subCategory,
          type: item.type,
          packSize: item.packSize,
        });

    try {
      const response = await SafeScanAPI.analyzeIngredients({
        text: item.ingredientsText || item.name,
        type: item.type,
        productName: item.name,
        brand: item.brand,
        category: subCategory,
        barcode: item.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        imageUrl: exactImage,
        userPreferences,
      });

      const enrichedProduct: Product = {
        ...response.product,
        name: item.name,
        brand: item.brand,
        category: subCategory,
        image: exactImage,
        quickCommerce: {
          blinkitUrl: item.blinkitUrl || buildBlinkitSearchUrl(item.name),
          instamartUrl: item.instamartUrl || buildInstamartSearchUrl(item.name),
          blinkitPrice: item.blinkitPrice || '₹99',
          instamartPrice: item.instamartPrice || '₹95',
          blinkitEta: item.blinkitEta || '8 mins',
          instamartEta: item.instamartEta || '10 mins',
          packSize: item.packSize,
          availableOn: item.availableOn || ['blinkit', 'instamart'],
        },
      };

      setIsResolvingItem(false);
      setSearchResults([]);
      setSearchQuery('');
      onOpenProduct(enrichedProduct, 'search');
    } catch (err: any) {
      // Fallback to local Blinkit/Instamart ingredient parser so exact item always opens cleanly
      const fallbackProduct = convertCatalogItemToProduct({
        ...item,
        image: exactImage,
        subCategory,
      });
      setIsResolvingItem(false);
      setSearchResults([]);
      setSearchQuery('');
      onOpenProduct(fallbackProduct, 'search');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Greeting Section — Note: overflow-visible on outer section so suggestions dropdown renders cleanly */}
      <section className="relative rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/20">
        {/* Decorative backdrop clipped inside inner wrapper */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute -right-12 -bottom-16 w-64 h-64 rounded-full bg-teal-500/20 blur-3xl" />
        </div>

        <div className="relative z-20 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-emerald-100 font-medium">
              <Sparkles size={14} className="text-emerald-300" />
              <span>Smart Produce &amp; Ingredient Intelligence · Tata 1mg Reference</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-[11px] text-amber-200 font-bold">
              <Zap size={12} className="text-amber-300" />
              <span>Blinkit.com &amp; Swiggy Instamart Integrated</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Know What Goes Into Your Body.
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
            Search any grocery, cosmetic, or fresh fruit across <strong className="text-amber-300">Blinkit.com</strong> &amp; <strong className="text-orange-300">Instamart.com</strong> with live autocomplete suggestions. Inspect allergens, peel ripeness, and Tata 1mg safety monographs before you buy.
          </p>

          {/* Store Filter Tabs + Search Bar with Live Autocomplete Suggestions */}
          <div ref={searchContainerRef} className="pt-2 space-y-2.5 relative">
            {/* Store Filter Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-black/25 backdrop-blur-md border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStore('all');
                    setShowSuggestions(true);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedStore === 'all'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <Globe size={12} />
                  <span>All Stores</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStore('blinkit');
                    setShowSuggestions(true);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedStore === 'blinkit'
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'text-amber-200 hover:bg-white/10'
                  }`}
                >
                  <Zap size={12} />
                  <span>Blinkit.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStore('instamart');
                    setShowSuggestions(true);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedStore === 'instamart'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-orange-200 hover:bg-white/10'
                  }`}
                >
                  <ShoppingBag size={12} />
                  <span>Instamart.com</span>
                </button>
              </div>

              {/* Direct External Store Launchers */}
              <div className="flex items-center gap-2 text-[11px]">
                <a
                  href={buildBlinkitSearchUrl(searchQuery || 'healthy groceries')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 font-semibold transition-colors"
                  title="Search directly on Blinkit.com"
                >
                  <span>⚡ Blinkit.com</span>
                  <ExternalLink size={11} />
                </a>
                <a
                  href={buildInstamartSearchUrl(searchQuery || 'healthy groceries')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-400/30 font-semibold transition-colors"
                  title="Search directly on Swiggy Instamart"
                >
                  <span>🛒 Instamart.com</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-3.5 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    selectedStore === 'blinkit'
                      ? 'Search Blinkit.com products, brands, fruits, or barcodes...'
                      : selectedStore === 'instamart'
                      ? 'Search Swiggy Instamart products, brands, fruits, or barcodes...'
                      : 'Search Blinkit & Instamart products, brands, fruits, or barcodes...'
                  }
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleKeyDown}
                  aria-label="Search Blinkit and Instamart products"
                  aria-expanded={showSuggestions}
                  aria-autocomplete="list"
                  className="w-full pl-10 pr-32 py-3.5 text-xs sm:text-sm rounded-2xl bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-lg font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSuggestions(true);
                    }}
                    className="absolute right-24 p-1.5 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSearching || isResolvingItem || !searchQuery.trim()}
                  className="absolute right-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {isSearching || isResolvingItem ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </div>

              {/* LIVE AUTOCOMPLETE SEARCH SUGGESTIONS DROPDOWN */}
              {showSuggestions && (
                <div
                  className="absolute left-0 right-0 top-full mt-2 bg-white text-stone-900 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-50 max-h-[480px] flex flex-col"
                  role="listbox"
                >
                  {/* Dropdown Header */}
                  <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                      <TrendingUp size={14} className="text-emerald-700" />
                      <span>
                        {searchQuery.trim()
                          ? `Suggestions for "${searchQuery.trim()}" (${
                              selectedStore === 'all' ? 'Blinkit + Instamart' : selectedStore.toUpperCase()
                            })`
                          : 'Trending on Blinkit.com & Swiggy Instamart'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {searchQuery.trim() && (
                        <>
                          <a
                            href={buildBlinkitSearchUrl(searchQuery)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 inline-flex items-center gap-1 transition-colors"
                          >
                            <span>⚡ Blinkit.com</span>
                            <ExternalLink size={10} />
                          </a>
                          <a
                            href={buildInstamartSearchUrl(searchQuery)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-orange-100 hover:bg-orange-200 text-orange-950 border border-orange-300 inline-flex items-center gap-1 transition-colors"
                          >
                            <span>🛒 Instamart.com</span>
                            <ExternalLink size={10} />
                          </a>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowSuggestions(false)}
                        className="text-[11px] text-stone-400 hover:text-stone-700 font-semibold px-1.5 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Suggestions Body */}
                  <div className="overflow-y-auto divide-y divide-stone-100">
                    {/* Keyword Autocomplete Chips */}
                    {keywordSuggestions.length > 0 && (
                      <div className="p-3 bg-stone-50/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                          Suggested Searches
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {keywordSuggestions.map((kw, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSearchQuery(kw);
                                executeSearch(kw);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200 hover:border-emerald-400 transition-all cursor-pointer shadow-2xs"
                            >
                              <Search size={11} className="text-emerald-700" />
                              <span>{kw}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Instant Product Suggestions from Blinkit & Instamart */}
                    <div className="p-2 space-y-1">
                      <div className="px-2 py-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Instant Product Matches · Tap to Analyze Safety
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          ↑↓ Navigate · Enter to Inspect
                        </span>
                      </div>

                      {productSuggestions.map((item, idx) => {
                        const isHighlighted = idx === highlightedIndex;
                        const bUrl = item.blinkitUrl || buildBlinkitSearchUrl(item.name);
                        const iUrl = item.instamartUrl || buildInstamartSearchUrl(item.name);

                        return (
                          <div
                            key={item.id || idx}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onClick={() => handleSelectSearchResult(item)}
                            role="option"
                            aria-selected={isHighlighted}
                            className={`p-2.5 rounded-2xl transition-all flex items-center justify-between gap-3 cursor-pointer border ${
                              isHighlighted
                                ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                                : 'bg-white hover:bg-stone-50 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <img
                                src={
                                  isAuthenticProductImageUrl(item.image)
                                    ? item.image
                                    : resolveExactProductImage(item)
                                }
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = resolveFallbackProductSvg(item);
                                }}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-xl object-contain bg-white p-0.5 border border-stone-200 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                    {item.brand}
                                  </span>
                                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                                    {item.type}
                                  </span>
                                  {item.packSize && (
                                    <span className="text-[10px] text-stone-500 font-mono">
                                      · {item.packSize}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                                  {item.name}
                                </div>

                                {/* Blinkit & Instamart Price & ETA Badges */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {(selectedStore === 'all' || selectedStore === 'blinkit') && (
                                    <a
                                      href={bUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/90 hover:bg-amber-200 text-amber-950 border border-amber-300/80 text-[10px] font-bold transition-colors"
                                      title="View on Blinkit.com"
                                    >
                                      <span>⚡ Blinkit: {item.blinkitPrice || '₹95'}</span>
                                      <span className="text-amber-700 font-normal">({item.blinkitEta || '8 mins'})</span>
                                      <ExternalLink size={9} />
                                    </a>
                                  )}
                                  {(selectedStore === 'all' || selectedStore === 'instamart') && (
                                    <a
                                      href={iUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100/90 hover:bg-orange-200 text-orange-950 border border-orange-300/80 text-[10px] font-bold transition-colors"
                                      title="View on Swiggy Instamart"
                                    >
                                      <span>🛒 Instamart: {item.instamartPrice || '₹92'}</span>
                                      <span className="text-orange-800 font-normal">({item.instamartEta || '10 mins'})</span>
                                      <ExternalLink size={9} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs">
                                <span>Scan Safety</span>
                                <ArrowRight size={11} />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {resolvingStatus && (
                <p className="text-xs text-emerald-200 mt-2 flex items-center gap-1.5 animate-pulse">
                  <Loader2 size={12} className="animate-spin text-emerald-300" />
                  <span>{resolvingStatus}</span>
                </p>
              )}
              {searchError && (
                <p className="text-xs text-rose-200 mt-2 flex items-center gap-1 bg-rose-950/40 p-2 rounded-xl border border-rose-400/30">
                  <AlertCircle size={14} className="text-rose-300 shrink-0" />
                  <span>{searchError}</span>
                </p>
              )}
            </form>
          </div>

          {/* Quick Profile Summary Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-200">
            <span className="text-emerald-300 font-medium">Your Active Profile:</span>
            <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
              {userPreferences.skinType} skin
            </span>
            {userPreferences.foodAllergies.length > 0 && (
              <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                Allergies: {userPreferences.foodAllergies.join(', ')}
              </span>
            )}
            <button
              onClick={onNavigateToProfile}
              className="text-xs text-emerald-300 hover:text-white underline underline-offset-2 ml-1 cursor-pointer"
            >
              Edit filters
            </button>
          </div>
        </div>
      </section>

      {/* Live Search Results Drawer / Card (If active results exist) */}
      {searchResults.length > 0 && (
        <section className="bg-white rounded-3xl border border-emerald-200/90 p-5 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-emerald-700" />
              <h2 className="text-sm font-bold text-stone-900">
                Blinkit &amp; Swiggy Instamart Search Results ({searchResults.length}) — Click to Inspect Safety
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={buildBlinkitSearchUrl(searchQuery)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 inline-flex items-center gap-1"
              >
                <span>⚡ All on Blinkit.com</span>
                <ExternalLink size={11} />
              </a>
              <a
                href={buildInstamartSearchUrl(searchQuery)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-950 border border-orange-300 inline-flex items-center gap-1"
              >
                <span>🛒 All on Instamart.com</span>
                <ExternalLink size={11} />
              </a>
              <button
                onClick={() => {
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((item, idx) => {
              const bUrl = item.blinkitUrl || buildBlinkitSearchUrl(item.name);
              const iUrl = item.instamartUrl || buildInstamartSearchUrl(item.name);
              const itemImg = isAuthenticProductImageUrl(item.image)
                ? item.image
                : resolveExactProductImage(item);
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(item)}
                  className="p-3.5 rounded-2xl bg-stone-50 hover:bg-emerald-50/50 border border-stone-200 hover:border-emerald-600 transition-all text-left flex flex-col justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={itemImg}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = resolveFallbackProductSvg(item);
                      }}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-contain bg-white p-1 shrink-0 border border-stone-200"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block truncate">
                        {item.brand || item.type}
                      </span>
                      <div className="text-xs font-bold text-stone-900 group-hover:text-emerald-900 line-clamp-2">
                        {item.name}
                      </div>
                      {item.packSize && (
                        <span className="text-[10px] text-stone-500 block">
                          Pack: {item.packSize}
                        </span>
                      )}
                      {item.barcode && (
                        <span className="text-[10px] font-mono text-stone-400 block">
                          UPC: #{item.barcode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Commerce Store Links & Safety CTA */}
                  <div className="pt-2 border-t border-stone-200/70 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <a
                        href={bUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-1 px-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>⚡ Blinkit {item.blinkitPrice || '₹95'}</span>
                        <ExternalLink size={9} />
                      </a>
                      <a
                        href={iUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-1 px-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-950 border border-orange-300 text-[10px] font-bold inline-flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>🛒 Instamart {item.instamartPrice || '₹92'}</span>
                        <ExternalLink size={9} />
                      </a>
                    </div>
                    <div className="text-[11px] text-emerald-800 font-bold flex items-center justify-between">
                      <span>Inspect Ingredients &amp; 1mg Safety</span>
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Three Prominent Action Cards */}
      <section aria-labelledby="scan-actions-heading">
        <h2 id="scan-actions-heading" className="sr-only">
          Choose Product Category to Scan
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Scan Fruit Ripeness Card (NEW) */}
          <button
            onClick={onScanFruit}
            className="group text-left p-5 rounded-3xl bg-white border border-stone-200 hover:border-emerald-600/50 hover:shadow-lg hover:shadow-emerald-900/5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-xl">🍎</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                  New Feature
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-900 transition-colors">
                Fruit Ripeness
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Scan peel color chroma, surface texture &amp; firmness. Predicts Brix sweetness &amp; optimal consumption window.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="text-emerald-800 font-medium">Tracks: Color · Texture · Brix</span>
              <ArrowRight size={13} className="text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Scan Food Card */}
          <button
            onClick={onScanFood}
            className="group text-left p-5 rounded-3xl bg-white border border-stone-200 hover:border-emerald-600/50 hover:shadow-lg hover:shadow-emerald-900/5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Utensils size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800 group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight size={14} />
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-900 transition-colors">
                Scan Food
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Analyze nutrition panels, added sugars, sodium density, and major food allergens like nuts and dairy.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="text-amber-800 font-medium">Tracks: Sugars · Sodium · Allergens</span>
              <ArrowRight size={13} className="text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Scan Cosmetics Card */}
          <button
            onClick={onScanCosmetics}
            className="group text-left p-5 rounded-3xl bg-white border border-stone-200 hover:border-emerald-600/50 hover:shadow-lg hover:shadow-emerald-900/5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles size={20} />
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800 group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight size={14} />
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-900 transition-colors">
                Scan Cosmetics
              </h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Decode INCI ingredient lists, pore-clogging comedogenicity, fragrance irritants, and skin barrier suitability.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="text-teal-800 font-medium">Tracks: Skin Types · Fragrance · Filters</span>
              <ArrowRight size={13} className="text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* Quick Access to Sensitivities & Preferences */}
      <section className="p-5 rounded-2xl bg-white border border-stone-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
            <ShieldCheck size={18} className="text-emerald-800" />
            <span>Active Safety & Tolerance Filters</span>
          </div>
          <button
            onClick={onNavigateToProfile}
            className="text-xs font-medium text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
          >
            Manage Preferences
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-medium">Food Allergies</span>
            <span className="text-xs font-bold text-stone-900 mt-0.5 block truncate">
              {userPreferences.foodAllergies.join(', ') || 'None set'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-medium">Dietary Rule</span>
            <span className="text-xs font-bold text-stone-900 mt-0.5 block truncate">
              {userPreferences.dietaryPreferences.join(', ') || 'Standard diet'}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-medium">Skin Type</span>
            <span className="text-xs font-bold text-stone-900 mt-0.5 block capitalize">
              {userPreferences.skinType}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-medium">Avoided Ingredients</span>
            <span className="text-xs font-bold text-stone-900 mt-0.5 block truncate">
              {userPreferences.avoidIngredients.length} flagged chemicals
            </span>
          </div>
        </div>
      </section>

      {/* Recent Scans */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Recent Scans</h2>
            <p className="text-xs text-stone-500">Demo history records scanned in this prototype</p>
          </div>
          <button
            onClick={onNavigateToHistory}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
          >
            View all ({recentProducts.length}) <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recentProducts.map(({ record, product }) => (
            <button
              key={record.id}
              onClick={() => onOpenProduct(product)}
              className="text-left p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-emerald-600/40 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 mb-2.5">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm text-stone-800 shadow-xs">
                      {product.type}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 font-medium truncate">{product.brand}</div>
                <div className="text-sm font-bold text-stone-900 group-hover:text-emerald-900 line-clamp-1">
                  {product.name}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                <AssessmentBadge assessment={product.assessment} size="sm" />
                <span className="text-[10px] text-stone-500 font-mono">{record.scannedAt}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Educational Section: Ingredient of the Day */}
      <section className="p-6 rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-xl shadow-stone-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <BookOpen size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block">
                Educational Deep Dive
              </span>
              <h3 className="text-lg font-bold text-white">Ingredient of the Day: {ingredientOfTheDay.name}</h3>
            </div>
          </div>

          <button
            onClick={() => onOpenIngredient(ingredientOfTheDay)}
            className="px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-white hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            Inspect Science
          </button>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed max-w-3xl">
          {ingredientOfTheDay.whyThisMatters}
        </p>

        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-stone-400 text-[10px] block">Role</span>
            <span className="font-semibold text-emerald-300">{ingredientOfTheDay.category}</span>
          </div>
          <div>
            <span className="text-stone-400 text-[10px] block">Evidence Level</span>
            <span className="font-semibold text-white">{ingredientOfTheDay.evidenceLevel}</span>
          </div>
          <div>
            <span className="text-stone-400 text-[10px] block">Skin Compatibility</span>
            <span className="font-semibold text-emerald-300">All skin types</span>
          </div>
          <div>
            <span className="text-stone-400 text-[10px] block">Regulatory Status</span>
            <span className="font-semibold text-stone-300 truncate block">CIR Verified Safe</span>
          </div>
        </div>
      </section>

      {/* Global Transparency Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
};
