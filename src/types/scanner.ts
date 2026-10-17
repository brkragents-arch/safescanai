export type ProductType = 'food' | 'cosmetics' | 'fruit' | 'vegetable' | 'produce';

export type AssessmentLevel = 'low' | 'moderate' | 'high' | 'insufficient';

export type EvidenceLevel = 'High' | 'Moderate' | 'Limited' | 'Insufficient';

export interface IngredientSource {
  name: string;
  authority: string;
  yearPlaceholder: string;
  url?: string;
}

export interface IngredientOneMgData {
  searchUrl: string;
  clinicalMonograph: string;
  safetyAdvice: {
    alcohol?: string;
    pregnancy?: string;
    breastfeeding?: string;
    skinSensitivity?: string;
    liverKidney?: string;
  };
  commonUses: string[];
  reportedSideEffects: string[];
  verifiedStatus: string;
}

export interface Ingredient {
  id: string;
  name: string;
  inciOrAltNames: string[];
  purpose: string;
  category: 'Base' | 'Active' | 'Emollient' | 'Preservative' | 'Sweetener' | 'Allergen' | 'Texture' | 'Filter' | 'Flavoring' | 'Nutrient';
  concernLevel: 'low' | 'moderate' | 'high' | 'insufficient';
  concernSummary: string;
  exposureContext: string;
  evidenceLevel: EvidenceLevel;
  regulatoryStatus: string;
  whyThisMatters: string;
  isAllergen: boolean;
  allergenType?: string;
  isIrritantOrSensitivity?: boolean;
  sensitivityTags?: string[];
  sources: IngredientSource[];
  oneMgData?: IngredientOneMgData;
}

export interface FoodNutrition {
  servingSize: string;
  calories: number;
  totalFat: number;
  saturatedFat: number;
  sodium: number; // mg
  totalCarb: number;
  fiber: number;
  totalSugar: number;
  addedSugar: number;
  protein: number;
}

export interface CosmeticSuitability {
  drySkin: 'suitable' | 'caution' | 'not-recommended';
  oilySkin: 'suitable' | 'caution' | 'not-recommended';
  combinationSkin: 'suitable' | 'caution' | 'not-recommended';
  sensitiveSkin: 'suitable' | 'caution' | 'not-recommended';
  acneProne: 'suitable' | 'caution' | 'not-recommended';
  comedogenicRating: number; // 0 to 5
  fragranceFree: boolean;
  alcoholFree: boolean;
  essentialOilFree: boolean;
  sunProtectionFactor?: string;
}

export interface PotentialConcern {
  title: string;
  severity: 'low' | 'moderate' | 'high';
  explanation: string;
  evidenceStrength: 'High' | 'Moderate' | 'Limited';
  regulatoryContext: string;
}

export interface FruitColorAnalysis {
  dominantHex: string;
  secondaryHex: string;
  hueDescription: string;
  colorUniformity: 'Uniform' | 'Mottled' | 'Speckled' | 'Variegated';
  greenPercentage: number;
  yellowPercentage: number;
  brownPercentage: number;
}

export interface FruitTextureAnalysis {
  surfaceDescription: string;
  firmnessLevel: 'Very Firm (Underripe)' | 'Yields Slightly (Ready)' | 'Soft & Tender (Peak)' | 'Overly Soft / Mushy' | 'Crisp & Turgid (Fresh)' | 'Slightly Wilted';
  firmnessScore: number; // 1 to 10
  skinIntegrity: 'Pristine' | 'Natural Sugar Spots' | 'Minor Scars' | 'Bruised / Indented' | 'Glossy & Smooth';
  wrinklingOrDesiccation: 'None' | 'Slight' | 'Moderate' | 'Noticeable';
}

export interface FruitRipenessAssessment {
  stage: 'Unripe' | 'Early Ripe' | 'Peak Ripe' | 'Overripe' | 'Spoiled' | 'Fresh Harvest' | 'Crisp & Hydrated';
  ripenessPercentage: number; // 0 - 100%
  sweetnessBrix: string; // e.g. "14° - 16° Brix"
  ripenessSummary: string;
  daysToOptimalOrSpoilage: string;
  storageRecommendation: string;
  edibilityStatus: 'Ready to Eat' | 'Wait 2-3 Days' | 'Best for Baking / Smoothies' | 'Do Not Consume' | 'Crisp for Cooking / Salad';
  nutritionalHighlights: string[];
}

export interface FruitProfile {
  fruitName: string;
  produceType?: 'fruit' | 'vegetable';
  variety?: string;
  colorAnalysis: FruitColorAnalysis;
  textureAnalysis: FruitTextureAnalysis;
  ripeness: FruitRipenessAssessment;
  qualityGrade: 'Grade A (Premium)' | 'Grade B (Standard)' | 'Culinary Grade' | 'Discard' | 'Fresh Farm Produce';
  oneMgHealthProfile: {
    oneMgSearchUrl: string;
    ayurvedicOrNutraceuticalContext: string;
    keyActiveCompounds: string[];
    healthBenefits: string[];
    dietaryCautions?: string;
  };
}

export interface SourceGuidelinesAudit {
  categoryType: 'moisturizer' | 'powder' | 'hair_dye' | 'toothpaste' | 'shampoo' | 'deodorant' | 'body_wash' | 'soap' | 'beverage' | 'general';
  redFlagsFound: string[];
  safeActivesFound: string[];
  phLevel?: string;
  status: 'Compliant' | 'Red Flag Alert' | 'Pure Botanical' | 'Clean Formulation';
  summary: string;
}

export interface QuickCommerceStoreInfo {
  blinkitUrl: string;
  instamartUrl: string;
  blinkitPrice?: string;
  instamartPrice?: string;
  blinkitEta?: string;
  instamartEta?: string;
  packSize?: string;
  availableOn: ('blinkit' | 'instamart')[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: ProductType;
  category: string;
  image: string;
  barcode: string;
  assessment: AssessmentLevel;
  assessmentHeadline: string;
  assessmentSummary: string;
  confidence: 'High' | 'Moderate' | 'Provisional';
  allergens: string[];
  nutrition?: FoodNutrition;
  cosmeticProfile?: CosmeticSuitability;
  fruitProfile?: FruitProfile;
  ingredients: Ingredient[];
  potentialConcerns: PotentialConcern[];
  samplePrice: string;
  comparisonAlternatives: string[]; // IDs of products
  isSampleDemonstration: boolean;
  regulatoryNotice: string;
  countryOfOrigin?: string;
  manufacturerDetails?: string;
  fssaiLicenseNumber?: string;
  oneMgProductUrl?: string;
  sourceGuidelinesAudit?: SourceGuidelinesAudit;
  quickCommerce?: QuickCommerceStoreInfo;
}

export interface UserPreferences {
  foodAllergies: string[];
  dietaryPreferences: string[];
  skinType: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';
  cosmeticSensitivities: string[];
  avoidIngredients: string[];
  units: 'metric' | 'imperial';
  language: string;
  privacyLocalOnly: boolean;
  analyticsConsent: boolean;
}

export interface ScanHistoryRecord {
  id: string;
  productId: string;
  scannedAt: string;
  method: 'camera' | 'barcode' | 'upload' | 'demo' | 'search' | 'fruit' | 'vegetable' | 'produce';
  query?: string;
}

export type ActiveScreen = 
  | 'home'
  | 'scan'
  | 'product-detail'
  | 'ingredient-detail'
  | 'compare'
  | 'history'
  | 'profile';

