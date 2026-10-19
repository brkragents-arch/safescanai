import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductType, UserPreferences } from '../../types/scanner';
import {
  Scale,
  ArrowRight,
  Plus,
  X,
  Utensils,
  Sparkles,
  Tag,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { AssessmentBadge } from '../common/AssessmentBadge';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import {
  QUICK_COMMERCE_PRODUCTS,
  resolveNormalizedCategoryGroup,
} from '../../data/quickCommerceCatalog';
import {
  buildBlinkitSearchUrl,
  buildInstamartSearchUrl,
  buildAmazonSearchUrl,
} from '../../services/apiClient';
import {
  resolveExactProductImage,
  isAuthenticProductImageUrl,
  resolveFallbackProductSvg,
} from '../../utils/productImageGenerator';
import { isCosmeticOrPersonalCare } from '../../utils/productClassifier';

interface Props {
  initialProductId?: string;
  allProducts: Product[];
  userPreferences: UserPreferences;
  onOpenProduct: (product: Product) => void;
}

export const CompareScreen: React.FC<Props> = ({
  initialProductId,
  allProducts,
  userPreferences,
  onOpenProduct,
}) => {
  // Merge allProducts with QUICK_COMMERCE_PRODUCTS so every sub-category has multiple same-category peers
  const mergedProducts = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of allProducts) {
      map.set(p.id, p);
    }
    for (const qp of QUICK_COMMERCE_PRODUCTS) {
      if (!map.has(qp.id)) {
        map.set(qp.id, qp);
      }
    }
    return Array.from(map.values());
  }, [allProducts]);

  // Resolve initial product if provided
  const initialProduct = useMemo(() => {
    if (!initialProductId) return undefined;
    return mergedProducts.find((p) => p.id === initialProductId);
  }, [initialProductId, mergedProducts]);

  const [activeType, setActiveType] = useState<'food' | 'cosmetics'>(() => {
    if (initialProduct) {
      return initialProduct.type === 'cosmetics' ? 'cosmetics' : 'food';
    }
    return 'food';
  });

  const [activeCategoryGroup, setActiveCategoryGroup] = useState<string>(() => {
    if (initialProduct) {
      return resolveNormalizedCategoryGroup(initialProduct);
    }
    return 'Instant Noodles & Pasta';
  });

  // Available sub-categories for the active broad tab ('food' or 'cosmetics')
  const categoryGroupsForTab = useMemo(() => {
    const groups = new Set<string>();
    for (const p of mergedProducts) {
      const pBroadType = p.type === 'cosmetics' ? 'cosmetics' : 'food';
      if (pBroadType === activeType) {
        groups.add(resolveNormalizedCategoryGroup(p));
      }
    }
    return Array.from(groups);
  }, [mergedProducts, activeType]);

  // Strictly filter pool by the exact same sub-category!
  const sameCategoryPool = useMemo(() => {
    return mergedProducts.filter((p) => {
      const pBroadType = p.type === 'cosmetics' ? 'cosmetics' : 'food';
      return (
        pBroadType === activeType &&
        resolveNormalizedCategoryGroup(p) === activeCategoryGroup
      );
    });
  }, [mergedProducts, activeType, activeCategoryGroup]);

  // Selected products to compare (up to 3, strictly within the same category)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialProduct) {
      const targetCat = resolveNormalizedCategoryGroup(initialProduct);
      const peers = mergedProducts.filter(
        (p) => p.id !== initialProduct.id && resolveNormalizedCategoryGroup(p) === targetCat
      );
      return [initialProduct.id, ...peers.slice(0, 2).map((p) => p.id)].filter(Boolean);
    }
    const defaultPool = mergedProducts.filter(
      (p) => resolveNormalizedCategoryGroup(p) === 'Instant Noodles & Pasta'
    );
    return defaultPool.slice(0, 3).map((p) => p.id);
  });

  // Sync when initialProductId changes (e.g. user clicks "Compare Alternatives" on a scanned/searched product)
  useEffect(() => {
    if (!initialProduct) return;
    const broadType = initialProduct.type === 'cosmetics' ? 'cosmetics' : 'food';
    const targetCat = resolveNormalizedCategoryGroup(initialProduct);
    setActiveType(broadType);
    setActiveCategoryGroup(targetCat);

    const peers = mergedProducts.filter(
      (p) => p.id !== initialProduct.id && resolveNormalizedCategoryGroup(p) === targetCat
    );
    // Prioritize cleaner/lower-concern alternatives in the same category
    const sortedPeers = [...peers].sort((a, b) => {
      const rank = { low: 0, moderate: 1, high: 2, insufficient: 3 };
      return (rank[a.assessment] ?? 1) - (rank[b.assessment] ?? 1);
    });
    setSelectedIds([initialProduct.id, ...sortedPeers.slice(0, 2).map((p) => p.id)]);
  }, [initialProduct, mergedProducts]);

  // Switch broad tab ('food' | 'cosmetics')
  const handleTypeChange = (type: 'food' | 'cosmetics') => {
    setActiveType(type);
    const firstCat =
      type === 'food' ? 'Instant Noodles & Pasta' : 'Shampoos & Hair Care';
    const availableCats = Array.from(
      new Set(
        mergedProducts
          .filter((p) => (p.type === 'cosmetics' ? 'cosmetics' : 'food') === type)
          .map((p) => resolveNormalizedCategoryGroup(p))
      )
    );
    const chosenCat = availableCats.includes(firstCat)
      ? firstCat
      : availableCats[0] || firstCat;
    setActiveCategoryGroup(chosenCat);

    const pool = mergedProducts.filter(
      (p) =>
        (p.type === 'cosmetics' ? 'cosmetics' : 'food') === type &&
        resolveNormalizedCategoryGroup(p) === chosenCat
    );
    setSelectedIds(pool.slice(0, 3).map((p) => p.id));
  };

  // Switch specific sub-category (e.g. Dairy & Milk, Biscuits & Cookies, Shampoos & Hair Care, etc.)
  const handleCategoryGroupChange = (catGroup: string) => {
    setActiveCategoryGroup(catGroup);
    const pool = mergedProducts.filter(
      (p) =>
        (p.type === 'cosmetics' ? 'cosmetics' : 'food') === activeType &&
        resolveNormalizedCategoryGroup(p) === catGroup
    );
    setSelectedIds(pool.slice(0, 3).map((p) => p.id));
  };

  const handleAddProduct = (id: string) => {
    if (selectedIds.length < 3 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRemoveProduct = (id: string) => {
    if (selectedIds.length > 1) {
      setSelectedIds(selectedIds.filter((pId) => pId !== id));
    }
  };

  // Strictly ensure comparedProducts only belong to activeCategoryGroup
  const comparedProducts = useMemo(() => {
    const matched = selectedIds
      .map((id) => sameCategoryPool.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
    if (matched.length > 0) return matched;
    return sameCategoryPool.slice(0, 2);
  }, [selectedIds, sameCategoryPool]);

  // Dynamic comparison takeaway tailored to the active sub-category and selected products
  const dynamicTakeaway = useMemo(() => {
    if (comparedProducts.length === 0) return '';
    const rank = { low: 0, moderate: 1, high: 2, insufficient: 3 };
    const sortedBySafety = [...comparedProducts].sort(
      (a, b) => (rank[a.assessment] ?? 1) - (rank[b.assessment] ?? 1)
    );
    const safest = sortedBySafety[0];

    if (activeType === 'food') {
      const sortedSugar = [...comparedProducts].sort(
        (a, b) => (a.nutrition?.addedSugar ?? 0) - (b.nutrition?.addedSugar ?? 0)
      );
      const sortedFiber = [...comparedProducts].sort(
        (a, b) => (b.nutrition?.fiber ?? 0) - (a.nutrition?.fiber ?? 0)
      );
      const lowestSugarItem = sortedSugar[0];
      const highestFiberItem = sortedFiber[0];

      return `Within the "${activeCategoryGroup}" category on Blinkit & Swiggy Instamart, ${safest.name} (${safest.brand}) offers the cleanest ingredient profile (${safest.assessment.toUpperCase()} concern). ${
        lowestSugarItem?.nutrition !== undefined
          ? `${lowestSugarItem.name} has the lowest added sugar (${lowestSugarItem.nutrition.addedSugar}g per serving)`
          : ''
      }${
        highestFiberItem?.nutrition !== undefined
          ? `, while ${highestFiberItem.name} provides ${highestFiberItem.nutrition.fiber}g of dietary fiber.`
          : '.'
      }`;
    } else {
      const fragranceFreeItems = comparedProducts.filter(
        (p) => p.cosmeticProfile?.fragranceFree
      );
      return `Within the "${activeCategoryGroup}" category on Blinkit & Swiggy Instamart, ${safest.name} (${safest.brand}) leads with a ${safest.assessment.toUpperCase()}-concern formulation (${safest.ingredients.length} screened INCI ingredients). ${
        fragranceFreeItems.length > 0
          ? `${fragranceFreeItems.map((p) => p.name).join(' and ')} ${
              fragranceFreeItems.length === 1 ? 'is' : 'are'
            } fragrance-free and best suited for reactive or sensitive skin.`
          : 'Compare surfactant systems and preservatives above to match your skin tolerance.'
      }`;
    }
  }, [comparedProducts, activeType, activeCategoryGroup]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header and Broad Domain Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold mb-1">
            <CheckCircle2 size={12} className="text-emerald-700" />
            <span>Strict Same-Category Comparison · Blinkit &amp; Instamart Verified</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Side-by-Side Product Comparison
          </h1>
          <p className="text-xs text-stone-500">
            Comparing products strictly within <strong className="text-stone-800">{activeCategoryGroup}</strong> using official Blinkit &amp; Swiggy Instamart ingredients
          </p>
        </div>

        {/* Broad Type Switcher */}
        <div className="flex items-center p-1 bg-stone-200/70 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => handleTypeChange('food')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeType === 'food'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Utensils size={14} />
            <span>Food &amp; Grocery</span>
          </button>
          <button
            onClick={() => handleTypeChange('cosmetics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeType === 'cosmetics'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles size={14} />
            <span>Cosmetics &amp; Personal Care</span>
          </button>
        </div>
      </div>

      {/* Sub-Category Selector Bar (Ensures Apples-to-Apples Same-Category Comparison) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Tag size={13} className="text-emerald-700" />
            <span>Select Product Category (Same-Category Lock Active):</span>
          </span>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Active: {activeCategoryGroup} ({sameCategoryPool.length} items)
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categoryGroupsForTab.map((group) => {
            const isActive = group === activeCategoryGroup;
            return (
              <button
                key={group}
                onClick={() => handleCategoryGroupChange(group)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200/80'
                }`}
              >
                {group}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Selection Chips within the SAME Sub-Category */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-stone-100 rounded-2xl border border-stone-200 text-xs">
        <span className="font-bold text-stone-700 mr-1">
          Compare {activeCategoryGroup} ({comparedProducts.length}/3):
        </span>
        {sameCategoryPool.map((p) => {
          const isSelected = comparedProducts.some((cp) => cp.id === p.id);
          return (
            <button
              key={p.id}
              onClick={() => (isSelected ? handleRemoveProduct(p.id) : handleAddProduct(p.id))}
              disabled={!isSelected && comparedProducts.length >= 3}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                  : comparedProducts.length >= 3
                  ? 'opacity-40 cursor-not-allowed bg-white text-stone-400 border-stone-200'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-700 hover:text-emerald-900'
              }`}
            >
              <span className="truncate max-w-[180px]">{p.name}</span>
              {isSelected ? <X size={12} /> : <Plus size={12} />}
            </button>
          );
        })}
      </div>

      {/* Comparison Grid */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div
          className={`grid grid-cols-1 ${
            comparedProducts.length === 1
              ? 'md:grid-cols-1'
              : comparedProducts.length === 2
              ? 'md:grid-cols-2'
              : 'md:grid-cols-3'
          } divide-y md:divide-y-0 md:divide-x divide-stone-200`}
        >
          {comparedProducts.map((product) => {
            const blinkitUrl =
              product.quickCommerce?.blinkitUrl || buildBlinkitSearchUrl(product.name);
            const instamartUrl =
              product.quickCommerce?.instamartUrl || buildInstamartSearchUrl(product.name);
            const blinkitPrice =
              product.quickCommerce?.blinkitPrice || product.samplePrice.split(' ')[0] || '₹99';
            const instamartPrice =
              product.quickCommerce?.instamartPrice || product.samplePrice.split(' ')[0] || '₹95';
            const amazonUrl =
              product.quickCommerce?.amazonUrl || buildAmazonSearchUrl(product.name);
            const amazonPrice =
              product.quickCommerce?.amazonPrice || product.samplePrice.split(' ')[0] || '₹89';

            return (
              <div key={product.id} className="p-5 flex flex-col justify-between space-y-5">
                {/* Product Header */}
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                    <img
                      src={
                        isAuthenticProductImageUrl(product.image)
                          ? product.image
                          : resolveExactProductImage({
                              name: product.name,
                              brand: product.brand,
                              category: product.category,
                              type: product.type,
                            })
                      }
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = resolveFallbackProductSvg({
                          name: product.name,
                          brand: product.brand,
                          category: product.category,
                          type: product.type,
                        });
                      }}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain bg-white p-2"
                    />
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/95 text-stone-800 shadow-xs">
                        {product.brand}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-100 shadow-xs">
                        {resolveNormalizedCategoryGroup(product)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base leading-snug">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <AssessmentBadge assessment={product.assessment} size="sm" />
                      <span className="text-xs font-mono font-bold text-stone-600">
                        {product.samplePrice}
                      </span>
                    </div>
                  </div>

                  {/* Quick-Commerce Blinkit, Instamart & Amazon Direct Links */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <a
                      href={blinkitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-[10px] font-bold text-amber-950 transition-colors"
                      title="View on Blinkit"
                    >
                      <span className="truncate">⚡ {blinkitPrice}</span>
                      <ExternalLink size={9} className="text-amber-700 shrink-0 ml-0.5" />
                    </a>
                    <a
                      href={instamartUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200/80 text-[10px] font-bold text-orange-950 transition-colors"
                      title="View on Swiggy Instamart"
                    >
                      <span className="truncate">🛒 {instamartPrice}</span>
                      <ExternalLink size={9} className="text-orange-700 shrink-0 ml-0.5" />
                    </a>
                    <a
                      href={amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-stone-50 hover:bg-amber-50 border border-stone-200 text-[10px] font-bold text-stone-900 transition-colors"
                      title="Search on Amazon.in"
                    >
                      <span className="truncate">📦 {amazonPrice}</span>
                      <ExternalLink size={9} className="text-stone-600 shrink-0 ml-0.5" />
                    </a>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                    {product.assessmentSummary}
                  </p>
                </div>

                {/* Assessment Metrics */}
                <div className="space-y-4 text-xs divide-y divide-stone-100">
                  {/* Blinkit & Instamart Collected Ingredients */}
                  <div className="pt-3 first:pt-0">
                    <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] block mb-1.5">
                      Blinkit / Instamart Ingredients ({product.ingredients.length})
                    </span>
                    <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-3">
                      {product.ingredients.map((ing) => ing.name).join(', ')}
                    </p>
                  </div>

                  {/* Potential Concerns */}
                  <div className="pt-3">
                    <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] block mb-1.5">
                      Concerns of Note ({product.potentialConcerns.length})
                    </span>
                    <ul className="space-y-1">
                      {product.potentialConcerns.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-stone-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                          <span>
                            <strong className="text-stone-900 font-semibold">{c.title}:</strong>{' '}
                            {c.explanation}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Allergen & Preference Compatibility */}
                  <div className="pt-3">
                    <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] block mb-1.5">
                      Declared Allergens
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {product.allergens.map((alg, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200"
                        >
                          {alg}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Nutrition Comparison (Food Only — Never for Toothpaste, Cosmetics, or Personal Care) */}
                  {!isCosmeticOrPersonalCare(product) && product.type === 'food' && product.nutrition && (
                    <div className="pt-3">
                      <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] block mb-1.5">
                        Nutrition Breakdown ({product.nutrition.servingSize})
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-stone-50 rounded-lg border border-stone-200">
                          <span className="text-[10px] text-stone-500 block">Calories</span>
                          <span className="font-mono font-bold text-stone-900 text-sm">
                            {product.nutrition.calories}
                          </span>
                        </div>
                        <div className="p-2 bg-stone-50 rounded-lg border border-stone-200">
                          <span className="text-[10px] text-stone-500 block">Added Sugar</span>
                          <span
                            className={`font-mono font-bold text-sm ${
                              product.nutrition.addedSugar > 8 ? 'text-amber-800' : 'text-stone-900'
                            }`}
                          >
                            {product.nutrition.addedSugar}g
                          </span>
                        </div>
                        <div className="p-2 bg-stone-50 rounded-lg border border-stone-200">
                          <span className="text-[10px] text-stone-500 block">Sodium</span>
                          <span
                            className={`font-mono font-bold text-sm ${
                              product.nutrition.sodium > 300 ? 'text-rose-700' : 'text-stone-900'
                            }`}
                          >
                            {product.nutrition.sodium}mg
                          </span>
                        </div>
                        <div className="p-2 bg-stone-50 rounded-lg border border-stone-200">
                          <span className="text-[10px] text-stone-500 block">Fiber</span>
                          <span className="font-mono font-bold text-emerald-800 text-sm">
                            {product.nutrition.fiber}g
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cosmetic & Personal Care Suitability (Cosmetics, Toothpastes, Shampoos) */}
                  {isCosmeticOrPersonalCare(product) && (
                    <div className="pt-3">
                      <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] block mb-1.5">
                        Personal Care &amp; Safety Profile
                      </span>
                      <div className="space-y-1">
                        <div className="flex justify-between py-0.5">
                          <span className="text-stone-500">Sensitive Tolerance:</span>
                          <span className="font-semibold capitalize text-stone-900">
                            {product.cosmeticProfile?.sensitiveSkin || 'Suitable'}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-stone-500">Fragrance Free:</span>
                          <span className="font-semibold text-stone-900">
                            {product.cosmeticProfile?.fragranceFree ?? !product.allergens.some((a) => a.toLowerCase().includes('fragrance'))
                              ? 'Yes (Clean)'
                              : 'Contains Fragrance'}
                          </span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-stone-500">Harsh Sulfates (SLS):</span>
                          <span className="font-semibold text-stone-900">
                            {product.ingredients.some((i) => /lauryl sulfate|sls/i.test(`${i.name} ${i.inciOrAltNames.join(' ')}`))
                              ? 'Contains SLS'
                              : 'SLS-Free'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* View Full Report Button */}
                <button
                  onClick={() => onOpenProduct(product)}
                  className="w-full mt-4 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View Full Ingredient Report</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Category-Specific Decision Summary Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-stone-900 to-emerald-950 text-white space-y-3 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <Scale size={18} />
          <span>Decision Intelligence: {activeCategoryGroup} Comparison Takeaway</span>
        </div>
        <p className="text-xs text-stone-200 leading-relaxed">{dynamicTakeaway}</p>
      </div>

      <DisclaimerBanner />
    </div>
  );
};
