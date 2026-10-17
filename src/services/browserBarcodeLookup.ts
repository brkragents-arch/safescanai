import { Product, Ingredient } from '../types/scanner';

/**
 * Browser-side barcode lookup against Open Food Facts / Open Beauty Facts.
 * Used as a fallback when the SafeScan backend (`/api/barcode/:code`) is not
 * available — e.g. on the static GitHub Pages deployment.
 * Both APIs allow CORS requests from browsers.
 */

const ALLERGEN_KEYWORDS: Record<string, string> = {
  milk: 'Dairy', whey: 'Dairy', casein: 'Dairy', butter: 'Dairy', cheese: 'Dairy', lactose: 'Dairy',
  wheat: 'Gluten / Wheat', gluten: 'Gluten / Wheat', barley: 'Gluten / Wheat', rye: 'Gluten / Wheat',
  peanut: 'Peanuts', almond: 'Tree Nuts', cashew: 'Tree Nuts', walnut: 'Tree Nuts', hazelnut: 'Tree Nuts',
  pistachio: 'Tree Nuts', soy: 'Soy', soya: 'Soy', egg: 'Eggs', fish: 'Fish', shrimp: 'Shellfish',
  sesame: 'Sesame', fragrance: 'Fragrance Allergens', parfum: 'Fragrance Allergens',
};

const HIGH_CONCERN = ['bht', 'bha', 'red 40', 'yellow 5', 'yellow 6', 'paraben', 'oxybenzone', 'sodium lauryl sulfate'];

function onlyHttps(url?: string): string {
  return typeof url === 'string' && url.startsWith('https://') ? url : '';
}

function parseIngredients(text: string): { ingredients: Ingredient[]; allergens: string[]; worst: Product['assessment'] } {
  const allergens: string[] = [];
  let worst: Product['assessment'] = 'low';
  const names = text
    .split(/[,;\n•]+/)
    .map((s) => s.trim().replace(/[_*]/g, '').replace(/\.$/, ''))
    .filter((s) => s.length > 1)
    .slice(0, 60);

  const ingredients = names.map((name, idx): Ingredient => {
    const lower = name.toLowerCase();
    let isAllergen = false;
    let allergenType = '';
    let concernLevel: Ingredient['concernLevel'] = 'low';
    for (const [kw, type] of Object.entries(ALLERGEN_KEYWORDS)) {
      if (lower.includes(kw)) {
        isAllergen = true;
        allergenType = type;
        concernLevel = 'moderate';
        if (!allergens.includes(type)) allergens.push(type);
      }
    }
    if (HIGH_CONCERN.some((h) => lower.includes(h))) {
      concernLevel = 'high';
      worst = 'high';
    }
    return {
      id: `ing_cam_${idx}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      inciOrAltNames: [name],
      purpose: isAllergen ? 'Declared allergen' : 'Declared ingredient',
      category: isAllergen ? 'Allergen' : 'Base',
      concernLevel,
      concernSummary: isAllergen
        ? `Contains ${allergenType}; avoid if sensitive.`
        : 'Listed on the product label.',
      exposureContext: 'Standard commercial concentration.',
      evidenceLevel: 'Moderate',
      regulatoryStatus: 'As declared by manufacturer',
      whyThisMatters: isAllergen ? `Relevant for ${allergenType} sensitivity.` : 'Part of the formulation.',
      isAllergen,
      allergenType: allergenType || undefined,
      sources: [
        {
          name: 'Tata 1mg Monograph Search',
          authority: '1mg.com',
          yearPlaceholder: 'Live',
          url: `https://www.1mg.com/search/all?name=${encodeURIComponent(name)}`,
        },
      ],
    };
  });

  if (allergens.length > 0 && worst === 'low') worst = 'moderate';
  return { ingredients, allergens, worst };
}

export async function lookupBarcodeInBrowser(rawCode: string): Promise<Product | null> {
  const code = rawCode.replace(/\D/g, '');
  if (!/^\d{6,14}$/.test(code)) return null;

  const sources: { host: string; type: 'food' | 'cosmetics'; label: string }[] = [
    { host: 'https://world.openfoodfacts.org', type: 'food', label: 'Open Food Facts' },
    { host: 'https://world.openbeautyfacts.org', type: 'cosmetics', label: 'Open Beauty Facts' },
  ];

  for (const src of sources) {
    try {
      const res = await fetch(`${src.host}/api/v2/product/${code}.json`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.status !== 1 || !data.product) continue;
      const p = data.product;

      const name: string = p.product_name || p.product_name_en || 'Scanned Product';
      const brand: string = (p.brands || 'Unknown Brand').split(',')[0].trim();
      const ingText: string = p.ingredients_text_en || p.ingredients_text || '';
      const parsed = parseIngredients(ingText || '');
      const n = p.nutriments || {};

      return {
        id: `cam_${code}`,
        name,
        brand,
        type: src.type,
        category: (p.categories || (src.type === 'food' ? 'Packaged Food' : 'Personal Care')).split(',')[0].trim(),
        image: onlyHttps(p.image_front_url || p.image_url),
        barcode: code,
        assessment: ingText ? parsed.worst : 'insufficient',
        assessmentHeadline: `${src.label} record · ${name}`,
        assessmentSummary: ingText
          ? `Scanned via camera. ${parsed.ingredients.length} ingredients found in ${src.label}.`
          : `Product found in ${src.label}, but no ingredient list is published yet.`,
        confidence: ingText ? 'Moderate' : 'Provisional',
        allergens: parsed.allergens.length ? parsed.allergens : ['No major allergens flagged'],
        nutrition:
          src.type === 'food'
            ? {
                servingSize: '100 g',
                calories: Math.round(n['energy-kcal_100g'] || 0),
                totalFat: n.fat_100g || 0,
                saturatedFat: n['saturated-fat_100g'] || 0,
                sodium: Math.round((n.sodium_100g || 0) * 1000),
                totalCarb: n.carbohydrates_100g || 0,
                fiber: n.fiber_100g || 0,
                totalSugar: n.sugars_100g || 0,
                addedSugar: 0,
                protein: n.proteins_100g || 0,
              }
            : undefined,
        ingredients: parsed.ingredients,
        potentialConcerns: [],
        samplePrice: '',
        comparisonAlternatives: [],
        isSampleDemonstration: false,
        regulatoryNotice: `Data from ${src.label} (community database). Always check the physical label.`,
      };
    } catch (e) {
      // try next source
    }
  }
  return null;
}
