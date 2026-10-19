import { Product } from '../types/scanner';

/**
 * Universal regex pattern matching cosmetics, personal care, oral care, hair care,
 * skin care, and hygiene products.
 */
export const PERSONAL_CARE_COSMETIC_REGEX =
  /toothpaste|dental|oral care|mouthwash|tooth powder|dentifrice|colgate|sensodyne|dabur red|pepsodent|meswak|vicco|cream|lotion|serum|hair|shampoo|conditioner|face wash|cleanser|sunscreen|soap|moisturiz|indica|glow & lovely|glow and lovely|fair & lovely|fair and lovely|lipstick|kajal|mascara|makeup|dye|colorant|body wash|shower gel|deodorant|antiperspirant|perfume|cologne|fragrance|talc|powder|petroleum jelly|vaseline|lip balm|pomade|aftershave|shaving/i;

/**
 * Returns true if a product or query represents cosmetics or personal care
 * (e.g., toothpaste, mouthwash, shampoo, soap, moisturizer, cosmetics).
 */
export function isCosmeticOrPersonalCare(
  productOrDetails:
    | Product
    | {
        type?: string;
        name?: string;
        category?: string;
        subCategory?: string;
        cosmeticProfile?: any;
        ingredientsText?: string;
      }
): boolean {
  if (productOrDetails.type === 'cosmetics') return true;
  if ('cosmeticProfile' in productOrDetails && Boolean(productOrDetails.cosmeticProfile)) return true;

  const itemAsAny = productOrDetails as any;
  const subCat = typeof itemAsAny.subCategory === 'string' ? itemAsAny.subCategory : '';
  const ingText = typeof itemAsAny.ingredientsText === 'string' ? itemAsAny.ingredientsText : '';
  const ingredientsList = Array.isArray(itemAsAny.ingredients)
    ? itemAsAny.ingredients.map((i: any) => `${i?.name || ''} ${i?.category || ''}`).join(' ')
    : '';

  const combined = `${productOrDetails.name || ''} ${productOrDetails.category || ''} ${subCat} ${ingText} ${ingredientsList}`;

  return PERSONAL_CARE_COSMETIC_REGEX.test(combined);
}
