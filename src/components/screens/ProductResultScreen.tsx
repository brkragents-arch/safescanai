import React from 'react';
import { Product, Ingredient, UserPreferences } from '../../types/scanner';
import { 
  ArrowLeft, 
  Scale, 
  ShieldAlert, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ChevronRight, 
  ExternalLink,
  Flame,
  Droplets,
  HeartCrack,
  Smile,
  ShieldCheck,
  AlertOctagon,
  Apple,
  Palette,
  Clock,
  Activity,
  Layers
} from 'lucide-react';
import { AssessmentBadge } from '../common/AssessmentBadge';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import {
  resolveExactProductImage,
  isAuthenticProductImageUrl,
  resolveFallbackProductSvg,
} from '../../utils/productImageGenerator';
import { buildAmazonSearchUrl } from '../../services/apiClient';
import { isCosmeticOrPersonalCare } from '../../utils/productClassifier';

interface Props {
  product: Product;
  userPreferences: UserPreferences;
  onBack: () => void;
  onOpenIngredient: (ingredient: Ingredient) => void;
  onCompareAlternatives: (product: Product) => void;
}

export const ProductResultScreen: React.FC<Props> = ({
  product,
  userPreferences,
  onBack,
  onOpenIngredient,
  onCompareAlternatives,
}) => {
  // Strict cosmetic and personal care classification guard (e.g. toothpaste, shampoo, lotions, cosmetics)
  const isCosmeticProduct = isCosmeticOrPersonalCare(product);

  const effectiveCosmeticProfile =
    product.cosmeticProfile ||
    (isCosmeticProduct
      ? {
          drySkin: 'suitable' as const,
          oilySkin: 'suitable' as const,
          combinationSkin: 'suitable' as const,
          sensitiveSkin: 'suitable' as const,
          acneProne: 'suitable' as const,
          comedogenicRating: 1,
          fragranceFree: !product.allergens.some((a) => a.toLowerCase().includes('fragrance')),
          alcoholFree: true,
          essentialOilFree: true,
        }
      : undefined);

  // Personalized suitability analysis
  const allergenConflicts = product.allergens.filter((allergen) =>
    userPreferences.foodAllergies.some((userAllergy) =>
      allergen.toLowerCase().includes(userAllergy.toLowerCase())
    )
  );

  const isLowSodiumConflict =
    !isCosmeticProduct &&
    (product.type === 'food' || product.type === 'fruit') &&
    product.nutrition &&
    product.nutrition.sodium > 300 &&
    userPreferences.dietaryPreferences.includes('Low Sodium');

  const isLowSugarConflict =
    !isCosmeticProduct &&
    (product.type === 'food' || product.type === 'fruit') &&
    product.nutrition &&
    product.nutrition.addedSugar > 8 &&
    userPreferences.dietaryPreferences.includes('Low Sugar');

  const isFragranceConflict =
    isCosmeticProduct &&
    effectiveCosmeticProfile &&
    !effectiveCosmeticProfile.fragranceFree &&
    userPreferences.cosmeticSensitivities.includes('Fragrance');

  const avoidedIngredientHits = product.ingredients.filter((ing) =>
    userPreferences.avoidIngredients.some((avoid) =>
      ing.name.toLowerCase().includes(avoid.toLowerCase()) ||
      ing.inciOrAltNames.some((alt) => alt.toLowerCase().includes(avoid.toLowerCase()))
    )
  );

  const hasPersonalConcern =
    allergenConflicts.length > 0 ||
    isLowSodiumConflict ||
    isLowSugarConflict ||
    isFragranceConflict ||
    avoidedIngredientHits.length > 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Scanner</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-1 rounded">
            UPC: {product.barcode}
          </span>
          <button
            onClick={() => onCompareAlternatives(product)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <Scale size={14} />
            <span>{product.type === 'food' ? 'Compare Alternatives' : 'Find Alternatives'}</span>
          </button>
        </div>
      </div>

      {/* Main Product Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="grid md:grid-cols-12 gap-6 p-6">
          {/* Product Image Column */}
          <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden bg-white border border-stone-200/80">
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
              className="w-full h-full object-contain p-3"
            />
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-stone-900/90 text-white backdrop-blur-md">
                {product.category}
              </span>
              {product.isSampleDemonstration ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/90 text-stone-800 shadow-xs">
                  Demo Sample
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                  AI Grounded Record
                </span>
              )}
            </div>
          </div>

          {/* Product Info & Overall Assessment Column */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  {product.brand}
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  Confidence: {product.confidence}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-stone-900 leading-snug">
                {product.name}
              </h1>

              <div className="mt-3 flex items-center gap-2">
                <AssessmentBadge assessment={product.assessment} size="md" />
                <span className="text-xs text-stone-500">{product.samplePrice}</span>
              </div>

              <p className="mt-3 text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                {product.assessmentSummary}
              </p>
            </div>

            {/* Quick Allergen / Sensitivity Strip */}
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Declared Alerts:
              </span>
              {product.allergens.map((alg, i) => (
                <span
                  key={i}
                  className="text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-md"
                >
                  {alg}
                </span>
              ))}
            </div>

            {/* Quick Commerce Store Integration (Blinkit.com & Swiggy Instamart) */}
            <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                Quick Commerce:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={
                    product.quickCommerce?.blinkitUrl ||
                    `https://blinkit.com/s/?q=${encodeURIComponent(
                      product.name.replace(/\s*\(Barcode.*?\)/i, '').trim()
                    )}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold transition-colors shadow-2xs"
                >
                  <span>⚡ Blinkit.com</span>
                  {product.quickCommerce?.blinkitPrice && (
                    <span className="font-mono">({product.quickCommerce.blinkitPrice})</span>
                  )}
                  <ExternalLink size={12} />
                </a>
                <a
                  href={
                    product.quickCommerce?.instamartUrl ||
                    `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(
                      product.name.replace(/\s*\(Barcode.*?\)/i, '').trim()
                    )}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-950 border border-orange-300 text-xs font-bold transition-colors shadow-2xs"
                >
                  <span>🛒 Instamart.com</span>
                  {product.quickCommerce?.instamartPrice && (
                    <span className="font-mono">({product.quickCommerce.instamartPrice})</span>
                  )}
                  <ExternalLink size={12} />
                </a>
                <a
                  href={
                    product.quickCommerce?.amazonUrl ||
                    buildAmazonSearchUrl(
                      product.name.replace(/\s*\(Barcode.*?\)/i, '').trim()
                    )
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-900 border border-stone-300 text-xs font-bold transition-colors shadow-2xs"
                >
                  <span>📦 Amazon.in</span>
                  {product.quickCommerce?.amazonPrice && (
                    <span className="font-mono">({product.quickCommerce.amazonPrice})</span>
                  )}
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Suitability Card (Matches user preferences) */}
      <div
        className={`p-5 rounded-3xl border transition-all ${
          hasPersonalConcern
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-sm mb-2">
          {hasPersonalConcern ? (
            <AlertTriangle size={18} className="text-amber-700" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-700" />
          )}
          <span>Personal Suitability Analysis (Based on Your Active Profile)</span>
        </div>

        {hasPersonalConcern ? (
          <div className="space-y-2 text-xs">
            <p className="leading-relaxed">
              Based on your configured dietary and sensitivity profile, this product triggers potential match warnings:
            </p>
            <ul className="space-y-1.5 pl-1">
              {allergenConflicts.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-rose-800 font-semibold">
                  <AlertOctagon size={14} className="shrink-0" />
                  <span>Allergen Conflict: Contains {c}</span>
                </li>
              ))}
              {isLowSodiumConflict && (
                <li className="flex items-center gap-2 text-amber-900 font-medium">
                  <AlertTriangle size={14} className="shrink-0 text-amber-700" />
                  <span>Sodium Conflict: {product.nutrition?.sodium}mg exceeds your Low Sodium preference threshold.</span>
                </li>
              )}
              {isLowSugarConflict && (
                <li className="flex items-center gap-2 text-amber-900 font-medium">
                  <AlertTriangle size={14} className="shrink-0 text-amber-700" />
                  <span>Added Sugar Conflict: {product.nutrition?.addedSugar}g exceeds your Low Sugar preference threshold.</span>
                </li>
              )}
              {isFragranceConflict && (
                <li className="flex items-center gap-2 text-amber-900 font-medium">
                  <AlertTriangle size={14} className="shrink-0 text-amber-700" />
                  <span>Fragrance Conflict: Contains fragrance components contrary to your Fragrance-Free sensitivity filter.</span>
                </li>
              )}
              {avoidedIngredientHits.map((hit, i) => (
                <li key={i} className="flex items-center gap-2 text-amber-900 font-medium">
                  <AlertTriangle size={14} className="shrink-0 text-amber-700" />
                  <span>Avoidance Match: Contains flagged ingredient “{hit.name}”.</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-emerald-900 leading-relaxed">
            Good news! No direct conflicts detected with your declared allergies ({userPreferences.foodAllergies.join(', ') || 'None'}), your dietary rules, or your cosmetic sensitivity profile.
          </p>
        )}
      </div>

      {/* Fruit Ripeness, Color & Texture Analyzer Dashboard */}
      {product.fruitProfile && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 text-[11px] font-bold mb-1">
                <Apple size={14} className="text-emerald-700" />
                <span>Fruit Ripeness & Texture Scanner</span>
              </div>
              <h2 className="text-xl font-extrabold text-stone-900">
                {product.fruitProfile.fruitName} ({product.fruitProfile.variety || 'Fresh Harvest'})
              </h2>
              <p className="text-xs text-stone-500">Optical color chromaticity, surface texture & post-harvest maturity</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-stone-100 text-stone-800 rounded-xl border border-stone-200">
                {product.fruitProfile.qualityGrade}
              </span>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-600 text-white rounded-xl shadow-xs">
                {product.fruitProfile.ripeness.edibilityStatus}
              </span>
            </div>
          </div>

          {/* 1. Interactive Ripeness & Sweetness Meter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Ripeness Stage & Maturity Index
              </span>
              <span className="text-xs font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                {product.fruitProfile.ripeness.stage} ({product.fruitProfile.ripeness.ripenessPercentage}%)
              </span>
            </div>

            {/* Visual Gauge Bar */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-full bg-stone-100 rounded-full overflow-hidden flex p-0.5 border border-stone-200/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lime-500 via-amber-400 to-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, product.fruitProfile.ripeness.ripenessPercentage))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-stone-400 px-1">
                <span className={product.fruitProfile.ripeness.stage === 'Unripe' ? 'text-lime-700 font-bold' : ''}>Unripe (10-30%)</span>
                <span className={product.fruitProfile.ripeness.stage === 'Early Ripe' ? 'text-amber-700 font-bold' : ''}>Early (30-60%)</span>
                <span className={product.fruitProfile.ripeness.stage === 'Peak Ripe' ? 'text-emerald-700 font-bold' : ''}>Peak Ripe (60-95%)</span>
                <span className={product.fruitProfile.ripeness.stage === 'Overripe' ? 'text-rose-700 font-bold' : ''}>Overripe (95%+)</span>
              </div>
            </div>

            <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200/80 leading-relaxed">
              {product.fruitProfile.ripeness.ripenessSummary}
            </p>
          </div>

          {/* 2. Color Palette & Surface Texture Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color & Chroma Card */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                  <Palette size={16} className="text-amber-600" />
                  <span>Color & Chroma Breakdown</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-700">
                  {product.fruitProfile.colorAnalysis.colorUniformity}
                </span>
              </div>

              {/* Swatches */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl shadow-xs border border-white/50"
                    style={{ backgroundColor: product.fruitProfile.colorAnalysis.dominantHex }}
                    title={`Dominant: ${product.fruitProfile.colorAnalysis.dominantHex}`}
                  />
                  <div>
                    <span className="text-[10px] text-stone-400 block font-semibold">Dominant</span>
                    <span className="text-xs font-mono font-bold text-stone-800">
                      {product.fruitProfile.colorAnalysis.dominantHex}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl shadow-xs border border-white/50"
                    style={{ backgroundColor: product.fruitProfile.colorAnalysis.secondaryHex }}
                    title={`Secondary: ${product.fruitProfile.colorAnalysis.secondaryHex}`}
                  />
                  <div>
                    <span className="text-[10px] text-stone-400 block font-semibold">Secondary</span>
                    <span className="text-xs font-mono font-bold text-stone-800">
                      {product.fruitProfile.colorAnalysis.secondaryHex}
                    </span>
                  </div>
                </div>
              </div>

              {/* Percentage breakdown */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-stone-600">
                  <span>Green: <strong>{product.fruitProfile.colorAnalysis.greenPercentage}%</strong></span>
                  <span>Yellow/Gold: <strong>{product.fruitProfile.colorAnalysis.yellowPercentage}%</strong></span>
                  <span>Brown/Red: <strong>{product.fruitProfile.colorAnalysis.brownPercentage}%</strong></span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden flex bg-stone-200">
                  <div className="bg-lime-600 h-full" style={{ width: `${product.fruitProfile.colorAnalysis.greenPercentage}%` }} />
                  <div className="bg-amber-400 h-full" style={{ width: `${product.fruitProfile.colorAnalysis.yellowPercentage}%` }} />
                  <div className="bg-amber-900 h-full" style={{ width: `${product.fruitProfile.colorAnalysis.brownPercentage}%` }} />
                </div>
              </div>

              <p className="text-[11px] text-stone-600 italic">
                "{product.fruitProfile.colorAnalysis.hueDescription}"
              </p>
            </div>

            {/* Surface Texture & Tactile Firmness Card */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                  <Activity size={16} className="text-emerald-700" />
                  <span>Texture & Firmness Scale</span>
                </div>
                <span className="text-xs font-extrabold text-stone-900 font-mono bg-white px-2 py-0.5 rounded border border-stone-200">
                  {product.fruitProfile.textureAnalysis.firmnessScore} / 10
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Firmness Level:</span>
                  <strong className="text-stone-900">{product.fruitProfile.textureAnalysis.firmnessLevel}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Skin Integrity:</span>
                  <strong className="text-stone-900">{product.fruitProfile.textureAnalysis.skinIntegrity}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Desiccation / Wrinkling:</span>
                  <strong className="text-stone-900">{product.fruitProfile.textureAnalysis.wrinklingOrDesiccation}</strong>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed bg-white p-2.5 rounded-xl border border-stone-200/60">
                {product.fruitProfile.textureAnalysis.surfaceDescription}
              </p>
            </div>
          </div>

          {/* 3. Sweetness Brix & Shelf Life Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                Estimated Sugar / Brix Index
              </span>
              <p className="text-sm font-extrabold text-amber-950 font-mono">
                {product.fruitProfile.ripeness.sweetnessBrix}
              </p>
              <span className="text-[11px] text-amber-800/90 mt-1 block">
                Reflects natural starch conversion into aromatic glucose & fructose.
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 block mb-1">
                Optimal Shelf Life & Storage
              </span>
              <p className="text-xs font-bold text-teal-950">
                {product.fruitProfile.ripeness.daysToOptimalOrSpoilage}
              </p>
              <p className="text-[11px] text-teal-800 mt-1 leading-relaxed">
                {product.fruitProfile.ripeness.storageRecommendation}
              </p>
            </div>
          </div>

          {/* 4. Tata 1mg Clinical & Health Monograph */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/60 via-stone-50 to-orange-50/30 border border-rose-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Tata 1mg Health & Clinical Monograph</span>
              </div>
              <a
                href={product.fruitProfile.oneMgHealthProfile.oneMgSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-white hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                <span>View on 1mg.com</span>
                <span className="text-xs">↗</span>
              </a>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              {product.fruitProfile.oneMgHealthProfile.ayurvedicOrNutraceuticalContext}
            </p>

            <div className="space-y-1.5 text-xs">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] font-bold text-stone-700">Key Bioactive Compounds:</span>
                {product.fruitProfile.oneMgHealthProfile.keyActiveCompounds.map((comp, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-semibold bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-800"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/90 border border-rose-100 text-[11px] text-stone-700 space-y-1">
              <span className="font-bold text-stone-900 block">Documented 1mg Health Benefits:</span>
              <ul className="list-disc list-inside space-y-0.5 text-stone-600 pl-1">
                {product.fruitProfile.oneMgHealthProfile.healthBenefits.map((ben, idx) => (
                  <li key={idx}>{ben}</li>
                ))}
              </ul>
              {product.fruitProfile.oneMgHealthProfile.dietaryCautions && (
                <p className="text-[10px] text-amber-900 font-medium pt-1">
                  Caution: {product.fruitProfile.oneMgHealthProfile.dietaryCautions}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product-Specific Nutrition Panel (FOOD ONLY) */}
      {!isCosmeticProduct && (product.type === 'food' || product.type === 'fruit') && product.nutrition && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Nutrition Summary</h2>
              <p className="text-xs text-stone-500">Per Serving Size: {product.nutrition.servingSize}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md">
              FDA 21 CFR 101.9 Format
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Calories</span>
              <span className="text-2xl font-extrabold text-stone-900 mt-0.5 block font-mono">
                {product.nutrition.calories}
              </span>
              <span className="text-[10px] text-stone-400">kcal</span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Added Sugar</span>
              <span className={`text-2xl font-extrabold mt-0.5 block font-mono ${
                product.nutrition.addedSugar > 8 ? 'text-amber-800' : 'text-stone-900'
              }`}>
                {product.nutrition.addedSugar}g
              </span>
              <span className="text-[10px] text-stone-500">
                {Math.round((product.nutrition.addedSugar / 50) * 100)}% Daily Value
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Sodium</span>
              <span className={`text-2xl font-extrabold mt-0.5 block font-mono ${
                product.nutrition.sodium > 300 ? 'text-rose-700' : 'text-stone-900'
              }`}>
                {product.nutrition.sodium}mg
              </span>
              <span className="text-[10px] text-stone-500">
                {Math.round((product.nutrition.sodium / 2300) * 100)}% Daily Value
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Sat. Fat</span>
              <span className="text-2xl font-extrabold text-stone-900 mt-0.5 block font-mono">
                {product.nutrition.saturatedFat}g
              </span>
              <span className="text-[10px] text-stone-500">
                {Math.round((product.nutrition.saturatedFat / 20) * 100)}% Daily Value
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Fiber</span>
              <span className="text-2xl font-extrabold text-emerald-800 mt-0.5 block font-mono">
                {product.nutrition.fiber}g
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">Soluble Fiber</span>
            </div>
          </div>
        </div>
      )}

      {/* Product-Specific Cosmetic Profile (COSMETICS) */}
      {isCosmeticProduct && effectiveCosmeticProfile && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Dermatological &amp; Skin Compatibility</h2>
              <p className="text-xs text-stone-500">Suitability assessment across major skin conditions</p>
            </div>
            {effectiveCosmeticProfile.sunProtectionFactor && (
              <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-lg">
                {effectiveCosmeticProfile.sunProtectionFactor}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Dry Skin</span>
              <span className="text-xs font-bold mt-1 block capitalize text-stone-900">
                {effectiveCosmeticProfile.drySkin}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Oily Skin</span>
              <span className="text-xs font-bold mt-1 block capitalize text-stone-900">
                {effectiveCosmeticProfile.oilySkin}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Sensitive Skin</span>
              <span className="text-xs font-bold mt-1 block capitalize text-emerald-800">
                {effectiveCosmeticProfile.sensitiveSkin}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Acne-Prone</span>
              <span className="text-xs font-bold mt-1 block capitalize text-stone-900">
                {effectiveCosmeticProfile.acneProne}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-semibold text-stone-500 block">Comedogenic</span>
              <span className="text-lg font-extrabold text-stone-900 mt-0.5 block font-mono">
                {effectiveCosmeticProfile.comedogenicRating} / 5
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 text-xs">
            <span className={`px-2.5 py-1 rounded-md font-medium ${
              effectiveCosmeticProfile.fragranceFree ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {effectiveCosmeticProfile.fragranceFree ? '✓ 100% Fragrance-Free' : '⚠ Contains Fragrance'}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-medium">
              {effectiveCosmeticProfile.alcoholFree ? '✓ Drying Alcohol Free' : 'Contains Simple Alcohol'}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-medium">
              {effectiveCosmeticProfile.essentialOilFree ? '✓ Essential Oil Free' : 'Contains Essential Oils'}
            </span>
          </div>
        </div>
      )}

      {/* Harmful Ingredient & Chemical Analysis for Cosmetics & Personal Care */}
      {isCosmeticProduct && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={20} className="text-amber-800" />
              <div>
                <h2 className="text-lg font-bold text-stone-900">Harmful Ingredient &amp; Chemical Analysis</h2>
                <p className="text-xs text-stone-500">Toxicological screening for harsh sulfates, parabens, endocrine disruptors &amp; irritants</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg">
              {product.ingredients.filter((i) => i.concernLevel === 'high' || i.concernLevel === 'moderate').length} Monitored Compounds
            </span>
          </div>

          {/* Quick Screening Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {(() => {
              const ingNames = product.ingredients.map((i) => `${i.name} ${i.inciOrAltNames.join(' ')}`.toLowerCase()).join(' ');
              const hasSLS = /lauryl sulfate|sls|sodium laureth sulfate/i.test(ingNames);
              const hasParabens = /paraben/i.test(ingNames);
              const hasPhthalates = /phthalate/i.test(ingNames);
              const hasTriclosan = /triclosan|triclocarban/i.test(ingNames);
              const hasFormaldehyde = /formaldehyde|dmdm hydantoin|quaternium-15|imidazolidinyl/i.test(ingNames);
              const hasSyntheticColor = /ci \d+|fd&c|d&c|red \d+|yellow \d+|blue \d+/i.test(ingNames);
              const hasFragrance = /fragrance|parfum|perfume|aroma/i.test(ingNames);
              const hasMicroplastics = /polyethylene|carbomer|dimethicone/i.test(ingNames);

              const screens = [
                { label: 'Sulfates (SLS/SLES)', detected: hasSLS, risk: 'Drying / Oral & Skin Irritant' },
                { label: 'Parabens', detected: hasParabens, risk: 'Endocrine Disruption Risk' },
                { label: 'Triclosan / Microbicides', detected: hasTriclosan, risk: 'Antimicrobial Resistance' },
                { label: 'Formaldehyde Donors', detected: hasFormaldehyde, risk: 'Carcinogen & Strong Allergen' },
                { label: 'Phthalates', detected: hasPhthalates, risk: 'Reproductive Toxicity Risk' },
                { label: 'Synthetic Dyes / Colorants', detected: hasSyntheticColor, risk: 'Potential Skin Sensitizer' },
                { label: 'Fragrance / Parfum', detected: hasFragrance, risk: 'Contact Dermatitis Trigger' },
                { label: 'Microplastics / Polymers', detected: hasMicroplastics, risk: 'Environmental / Membrane Impact' },
              ];

              return screens.map((s, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    s.detected
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold truncate">{s.label}</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        s.detected ? 'bg-rose-600 text-white' : 'bg-emerald-700 text-white'
                      }`}
                    >
                      {s.detected ? 'Detected' : 'Free'}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-600 leading-tight">
                    {s.detected ? `Flagged: ${s.risk}` : 'Not detected in declared formulation'}
                  </p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Potential Concerns with Plain Explanations */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-stone-700" />
          <h2 className="text-lg font-bold text-stone-900">
            {isCosmeticProduct ? 'Toxicological Concerns & Chemical Benchmark' : 'Potential Concerns & Scientific Context'}
          </h2>
        </div>

        <div className="space-y-3">
          {product.potentialConcerns.map((concern, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-stone-900 text-sm">{concern.title}</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-stone-200/70 text-stone-700">
                  Evidence: {concern.evidenceStrength}
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">{concern.explanation}</p>
              <div className="text-[11px] text-stone-500 font-mono pt-1">
                Benchmark: {concern.regulatoryContext}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Ingredient Breakdown */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              Ingredient Inspection ({product.ingredients.length})
            </h2>
            <p className="text-xs text-stone-500">Tap any ingredient for toxicological & regulatory details</p>
          </div>
          <span className="text-xs text-emerald-800 font-semibold">Interactive</span>
        </div>

        <div className="divide-y divide-stone-100">
          {product.ingredients.map((ing) => (
            <button
              key={ing.id}
              onClick={() => onOpenIngredient(ing)}
              className="w-full text-left py-3.5 flex items-center justify-between gap-4 hover:bg-stone-50 px-2 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-stone-900 group-hover:text-emerald-900">
                    {ing.name}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    {ing.category}
                  </span>
                  <a
                    href={ing.oneMgData?.searchUrl || `https://www.1mg.com/search/all?name=${encodeURIComponent(ing.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded transition-colors inline-flex items-center gap-0.5"
                    title="View clinical monograph on Tata 1mg"
                  >
                    <span>1mg Monograph</span>
                    <span className="text-[10px]">↗</span>
                  </a>
                  {ing.isAllergen && (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Allergen
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 truncate">{ing.purpose}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <AssessmentBadge assessment={ing.concernLevel} size="sm" />
                <ChevronRight size={16} className="text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Compare CTA Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
        <div>
          <h3 className="font-bold text-base text-white">Compare with Clean Alternatives</h3>
          <p className="text-xs text-emerald-200 mt-0.5">
            Evaluate side-by-side against lower-sodium, allergen-free, or fragrance-free alternatives.
          </p>
        </div>
        <button
          onClick={() => onCompareAlternatives(product)}
          className="px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
        >
          Compare Alternatives
        </button>
      </div>

      {/* Visible Informational Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
};
