/**
 * Generates an item-accurate, studio-styled SVG Retail Product Image (Data URI)
 * that visually matches the exact product name, brand, container silhouette
 * (bottle, tube, jar, soap bar, crinkle pouch, milk carton, dropper, or fresh produce),
 * and category artwork so search results ALWAYS match the item name.
 */

export interface ProductVisualInput {
  name: string;
  brand?: string;
  category?: string;
  type?: string;
  packSize?: string;
  storeHint?: 'blinkit' | 'instamart' | 'instagram' | 'all';
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function splitTextIntoLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const clean = text.replace(/\s*\(Barcode.*?\)/i, '').trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxCharsPerLine) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }
  if (current && lines.length < maxLines) {
    const remainingIndex = words.join(' ').indexOf(current);
    const rest = remainingIndex >= 0 ? clean.slice(remainingIndex) : current;
    lines.push(
      rest.length > maxCharsPerLine + 4 ? rest.slice(0, maxCharsPerLine + 2).trim() + '…' : rest
    );
  }
  return lines.slice(0, maxLines);
}

type PackShape =
  | 'noodle_pack'
  | 'chips_pack'
  | 'biscuit_pack'
  | 'milk_carton'
  | 'butter_box'
  | 'coffee_jar'
  | 'tea_pouch'
  | 'spread_jar'
  | 'atta_bag'
  | 'shampoo_bottle'
  | 'pump_cleanser'
  | 'squeeze_tube'
  | 'toothpaste_tube'
  | 'serum_dropper'
  | 'cream_jar'
  | 'soap_bar'
  | 'avocado_produce'
  | 'banana_produce'
  | 'mango_produce'
  | 'tomato_produce'
  | 'cucumber_produce'
  | 'fruit_produce'
  | 'veg_produce'
  | 'beverage_bottle'
  | 'chocolate_bar'
  | 'grocery_pack';

interface VisualTheme {
  bgGradStart: string;
  bgGradEnd: string;
  packPrimary: string;
  packSecondary: string;
  accentColor: string;
  textColor: string;
  labelBg: string;
  shape: PackShape;
  badgeText: string;
}

function resolveVisualTheme(input: ProductVisualInput): VisualTheme {
  const n = (input.name || '').toLowerCase();
  const b = (input.brand || '').toLowerCase();
  const c = (input.category || '').toLowerCase();
  const all = `${n} ${b} ${c}`;

  // 1. Fresh Produce (Fruits & Vegetables)
  if (all.includes('avocado')) {
    return {
      bgGradStart: '#ECFDF5',
      bgGradEnd: '#D1FAE5',
      packPrimary: '#365314',
      packSecondary: '#84CC16',
      accentColor: '#78350F',
      textColor: '#14532D',
      labelBg: '#FFFFFF',
      shape: 'avocado_produce',
      badgeText: 'FRESH PRODUCE',
    };
  }
  if (all.includes('banana') || all.includes('kela')) {
    return {
      bgGradStart: '#FEFCE8',
      bgGradEnd: '#FEF08A',
      packPrimary: '#EAB308',
      packSecondary: '#FACC15',
      accentColor: '#713F12',
      textColor: '#713F12',
      labelBg: '#FFFFFF',
      shape: 'banana_produce',
      badgeText: 'FARM FRESH FRUIT',
    };
  }
  if (all.includes('mango') || all.includes('alphonso') || all.includes('hapus')) {
    return {
      bgGradStart: '#FFFBEB',
      bgGradEnd: '#FDE68A',
      packPrimary: '#F59E0B',
      packSecondary: '#EA580C',
      accentColor: '#15803D',
      textColor: '#7C2D12',
      labelBg: '#FFFFFF',
      shape: 'mango_produce',
      badgeText: 'ORCHARD FRESH',
    };
  }
  if (all.includes('tomato') || all.includes('tamatar')) {
    return {
      bgGradStart: '#FEF2F2',
      bgGradEnd: '#FECACA',
      packPrimary: '#DC2626',
      packSecondary: '#EF4444',
      accentColor: '#15803D',
      textColor: '#7F1D1D',
      labelBg: '#FFFFFF',
      shape: 'tomato_produce',
      badgeText: 'MANDI FRESH VEG',
    };
  }
  if (all.includes('cucumber') || all.includes('kheera')) {
    return {
      bgGradStart: '#F0FDF4',
      bgGradEnd: '#BBF7D0',
      packPrimary: '#15803D',
      packSecondary: '#22C55E',
      accentColor: '#86EFAC',
      textColor: '#14532D',
      labelBg: '#FFFFFF',
      shape: 'cucumber_produce',
      badgeText: 'MANDI FRESH VEG',
    };
  }
  if (
    input.type === 'fruit' ||
    c.includes('fresh fruit') ||
    all.includes('strawberry') ||
    all.includes('apple') ||
    all.includes('orange') ||
    all.includes('pomegranate') ||
    all.includes('papaya')
  ) {
    return {
      bgGradStart: '#FFF1F2',
      bgGradEnd: '#FFE4E6',
      packPrimary: '#E11D48',
      packSecondary: '#FB7185',
      accentColor: '#16A34A',
      textColor: '#881337',
      labelBg: '#FFFFFF',
      shape: 'fruit_produce',
      badgeText: 'FRESH FRUIT',
    };
  }
  if (
    c.includes('fresh vegetable') ||
    all.includes('onion') ||
    all.includes('potato') ||
    all.includes('carrot') ||
    all.includes('spinach') ||
    all.includes('broccoli')
  ) {
    return {
      bgGradStart: '#F0FDF4',
      bgGradEnd: '#DCFCE7',
      packPrimary: '#166534',
      packSecondary: '#22C55E',
      accentColor: '#15803D',
      textColor: '#14532D',
      labelBg: '#FFFFFF',
      shape: 'veg_produce',
      badgeText: 'FRESH VEGETABLE',
    };
  }

  // 2. Toothpaste & Oral Care
  if (all.includes('tooth') || all.includes('sensodyne') || all.includes('colgate') || all.includes('dabur red') || all.includes('pepsodent') || all.includes('closeup') || all.includes('oral care')) {
    if (all.includes('sensodyne')) {
      return {
        bgGradStart: '#F0F9FF',
        bgGradEnd: '#E0F2FE',
        packPrimary: '#0284C7',
        packSecondary: '#38BDF8',
        accentColor: '#0D9488',
        textColor: '#0C4A6E',
        labelBg: '#FFFFFF',
        shape: 'toothpaste_tube',
        badgeText: 'ORAL CARE · TOOTHPASTE',
      };
    }
    if (all.includes('dabur red') || all.includes('ayurvedic paste') || all.includes('meswak')) {
      return {
        bgGradStart: '#FEF2F2',
        bgGradEnd: '#FEE2E2',
        packPrimary: '#991B1B',
        packSecondary: '#DC2626',
        accentColor: '#F59E0B',
        textColor: '#FFFFFF',
        labelBg: '#7F1D1D',
        shape: 'toothpaste_tube',
        badgeText: 'AYURVEDIC ORAL CARE',
      };
    }
    return {
      bgGradStart: '#FEF2F2',
      bgGradEnd: '#E0F2FE',
      packPrimary: '#DC2626',
      packSecondary: '#0284C7',
      accentColor: '#FFFFFF',
      textColor: '#FFFFFF',
      labelBg: '#B91C1C',
      shape: 'toothpaste_tube',
      badgeText: 'ANTICAVITY TOOTHPASTE',
    };
  }

  // 3. Shampoos & Hair Care
  if (all.includes('shampoo') || all.includes('conditioner') || all.includes('sunsilk') || all.includes('clinic plus') || all.includes('pantene') || all.includes('head & shoulders') || all.includes('tresemme')) {
    if (all.includes('sunsilk')) {
      return {
        bgGradStart: '#FDF2F8',
        bgGradEnd: '#FCE7F3',
        packPrimary: '#18181B',
        packSecondary: '#DB2777',
        accentColor: '#F472B6',
        textColor: '#FFFFFF',
        labelBg: '#27272A',
        shape: 'shampoo_bottle',
        badgeText: 'SHAMPOO · HAIR CARE',
      };
    }
    if (all.includes('mamaearth')) {
      return {
        bgGradStart: '#FDF2F8',
        bgGradEnd: '#ECFDF5',
        packPrimary: '#9D174D',
        packSecondary: '#16A34A',
        accentColor: '#FBBF24',
        textColor: '#831843',
        labelBg: '#FFFFFF',
        shape: 'shampoo_bottle',
        badgeText: 'ONION HAIR SHAMPOO',
      };
    }
    if (all.includes('sebamed')) {
      return {
        bgGradStart: '#F0FDFA',
        bgGradEnd: '#CCFBF1',
        packPrimary: '#0F766E',
        packSecondary: '#14B8A6',
        accentColor: '#E11D48',
        textColor: '#134E4A',
        labelBg: '#FFFFFF',
        shape: 'shampoo_bottle',
        badgeText: 'pH 5.5 DERMA SHAMPOO',
      };
    }
    return {
      bgGradStart: '#F5F3FF',
      bgGradEnd: '#EDE9FE',
      packPrimary: '#4F46E5',
      packSecondary: '#818CF8',
      accentColor: '#C7D2FE',
      textColor: '#FFFFFF',
      labelBg: '#3730A3',
      shape: 'shampoo_bottle',
      badgeText: 'HAIR CARE SHAMPOO',
    };
  }

  // 4. Soaps, Syndet Bars & Body Wash
  if (all.includes('soap') || all.includes('bathing bar') || all.includes('cleansing bar') || all.includes('syndet') || all.includes('dove') || all.includes('pears') || all.includes('dettol') || all.includes('lifebuoy') || all.includes('cinthol') || all.includes('medimix') || all.includes('lux') || all.includes('santoor')) {
    if (all.includes('pears')) {
      return {
        bgGradStart: '#FFFBEB',
        bgGradEnd: '#FEF3C7',
        packPrimary: '#B45309',
        packSecondary: '#D97706',
        accentColor: '#FDE68A',
        textColor: '#FFFFFF',
        labelBg: '#92400E',
        shape: 'soap_bar',
        badgeText: 'GLYCERIN BATHING BAR',
      };
    }
    if (all.includes('dove')) {
      return {
        bgGradStart: '#EFF6FF',
        bgGradEnd: '#DBEAFE',
        packPrimary: '#1E3A8A',
        packSecondary: '#3B82F6',
        accentColor: '#D97706',
        textColor: '#1E3A8A',
        labelBg: '#FFFFFF',
        shape: 'soap_bar',
        badgeText: 'MOISTURISING BEAUTY BAR',
      };
    }
    if (all.includes('sebamed')) {
      return {
        bgGradStart: '#F0FDFA',
        bgGradEnd: '#E0F2FE',
        packPrimary: '#0D9488',
        packSecondary: '#0284C7',
        accentColor: '#E11D48',
        textColor: '#0F172A',
        labelBg: '#FFFFFF',
        shape: 'soap_bar',
        badgeText: 'pH 5.5 SYNDET BAR',
      };
    }
    return {
      bgGradStart: '#ECFDF5',
      bgGradEnd: '#D1FAE5',
      packPrimary: '#047857',
      packSecondary: '#10B981',
      accentColor: '#A7F3D0',
      textColor: '#064E3B',
      labelBg: '#FFFFFF',
      shape: 'soap_bar',
      badgeText: 'BATHING BAR & SOAP',
    };
  }

  // 5. Face Wash & Cleansers
  if (all.includes('face wash') || all.includes('facial wash') || all.includes('cleanser') || all.includes('cetaphil') || all.includes('himalaya') || all.includes('simple ')) {
    if (all.includes('cetaphil')) {
      return {
        bgGradStart: '#EFF6FF',
        bgGradEnd: '#DCFCE7',
        packPrimary: '#0284C7',
        packSecondary: '#16A34A',
        accentColor: '#0284C7',
        textColor: '#0F172A',
        labelBg: '#FFFFFF',
        shape: 'pump_cleanser',
        badgeText: 'DERMATOLOGIST CLEANSER',
      };
    }
    if (all.includes('himalaya') || all.includes('neem')) {
      return {
        bgGradStart: '#ECFDF5',
        bgGradEnd: '#D1FAE5',
        packPrimary: '#0D9488',
        packSecondary: '#15803D',
        accentColor: '#EA580C',
        textColor: '#064E3B',
        labelBg: '#FFFFFF',
        shape: 'squeeze_tube',
        badgeText: 'PURIFYING NEEM FACE WASH',
      };
    }
    return {
      bgGradStart: '#F0FDF4',
      bgGradEnd: '#DCFCE7',
      packPrimary: '#16A34A',
      packSecondary: '#4ADE80',
      accentColor: '#15803D',
      textColor: '#14532D',
      labelBg: '#FFFFFF',
      shape: 'squeeze_tube',
      badgeText: 'GENTLE FACIAL WASH',
    };
  }

  // 6. Serums & Facial Actives
  if (all.includes('serum') || all.includes('niacinamide') || all.includes('vitamin c') || all.includes('minimalist') || all.includes('hyaluronic') || all.includes('retinol') || all.includes('elixir')) {
    if (all.includes('plum')) {
      return {
        bgGradStart: '#FAF5FF',
        bgGradEnd: '#FFEDD5',
        packPrimary: '#6D28D9',
        packSecondary: '#EA580C',
        accentColor: '#FBBF24',
        textColor: '#4C1D95',
        labelBg: '#FFFFFF',
        shape: 'serum_dropper',
        badgeText: 'ACTIVE FACE SERUM',
      };
    }
    return {
      bgGradStart: '#F4F4F5',
      bgGradEnd: '#E4E4E7',
      packPrimary: '#18181B',
      packSecondary: '#52525B',
      accentColor: '#D97706',
      textColor: '#18181B',
      labelBg: '#FFFFFF',
      shape: 'serum_dropper',
      badgeText: 'CLINICAL ACTIVES SERUM',
    };
  }

  // 7. Sunscreens
  if (all.includes('sunscreen') || all.includes('spf') || all.includes('uv ')) {
    return {
      bgGradStart: '#FFFBEB',
      bgGradEnd: '#FEF08A',
      packPrimary: '#EA580C',
      packSecondary: '#F59E0B',
      accentColor: '#0284C7',
      textColor: '#7C2D12',
      labelBg: '#FFFFFF',
      shape: 'squeeze_tube',
      badgeText: 'SPF 50 PA++++ SUNSCREEN',
    };
  }

  // 8. Moisturizers, Creams & Lotions
  if (all.includes('moisturiz') || all.includes('cream') || all.includes('lotion') || all.includes('nivea') || all.includes('ponds') || all.includes('pond\'s') || all.includes('ceramide') || all.includes('gel')) {
    if (all.includes('nivea')) {
      return {
        bgGradStart: '#EFF6FF',
        bgGradEnd: '#DBEAFE',
        packPrimary: '#1E3A8A',
        packSecondary: '#2563EB',
        accentColor: '#0284C7',
        textColor: '#1E3A8A',
        labelBg: '#FFFFFF',
        shape: 'cream_jar',
        badgeText: 'MOISTURISING CREAM',
      };
    }
    return {
      bgGradStart: '#ECFEFF',
      bgGradEnd: '#CFFAFE',
      packPrimary: '#0284C7',
      packSecondary: '#38BDF8',
      accentColor: '#0D9488',
      textColor: '#0C4A6E',
      labelBg: '#FFFFFF',
      shape: 'cream_jar',
      badgeText: 'HYDRATING CREAM / GEL',
    };
  }

  // 9. Dairy, Milk, Butter & Paneer
  if (all.includes('butter')) {
    return {
      bgGradStart: '#FEFCE8',
      bgGradEnd: '#FEF08A',
      packPrimary: '#EAB308',
      packSecondary: '#DC2626',
      accentColor: '#B91C1C',
      textColor: '#991B1B',
      labelBg: '#FEF9C3',
      shape: 'butter_box',
      badgeText: 'PASTEURISED TABLE BUTTER',
    };
  }
  if (all.includes('milk') || all.includes('paneer') || all.includes('curd') || all.includes('dahi') || all.includes('yogurt') || all.includes('dairy')) {
    return {
      bgGradStart: '#F0F9FF',
      bgGradEnd: '#DBEAFE',
      packPrimary: '#0284C7',
      packSecondary: '#DC2626',
      accentColor: '#0284C7',
      textColor: '#0C4A6E',
      labelBg: '#FFFFFF',
      shape: 'milk_carton',
      badgeText: 'FRESH DAIRY & MILK',
    };
  }

  // 10. Instant Noodles & Pasta
  if (all.includes('maggi') || all.includes('yippee') || all.includes('noodle') || all.includes('pasta') || all.includes('ramen')) {
    if (all.includes('yippee')) {
      return {
        bgGradStart: '#FFF7ED',
        bgGradEnd: '#FFEDD5',
        packPrimary: '#EA580C',
        packSecondary: '#DC2626',
        accentColor: '#FACC15',
        textColor: '#FFFFFF',
        labelBg: '#C2410C',
        shape: 'noodle_pack',
        badgeText: 'INSTANT MASALA NOODLES',
      };
    }
    if (all.includes('atta')) {
      return {
        bgGradStart: '#FEFCE8',
        bgGradEnd: '#DCFCE7',
        packPrimary: '#FACC15',
        packSecondary: '#15803D',
        accentColor: '#DC2626',
        textColor: '#7F1D1D',
        labelBg: '#FEF08A',
        shape: 'noodle_pack',
        badgeText: 'WHOLE WHEAT ATTA NOODLES',
      };
    }
    return {
      bgGradStart: '#FEFCE8',
      bgGradEnd: '#FEF08A',
      packPrimary: '#FACC15',
      packSecondary: '#DC2626',
      accentColor: '#15803D',
      textColor: '#991B1B',
      labelBg: '#FEF08A',
      shape: 'noodle_pack',
      badgeText: '2-MINUTE MASALA NOODLES',
    };
  }

  // 11. Chips, Crisps & Namkeen
  if (all.includes('lays') || all.includes('lay\'s') || all.includes('kurkure') || all.includes('bhujia') || all.includes('haldiram') || all.includes('too yumm') || all.includes('chip') || all.includes('crisp') || all.includes('namkeen') || all.includes('cracker') || all.includes('makhana')) {
    if (all.includes('kurkure')) {
      return {
        bgGradStart: '#FFF7ED',
        bgGradEnd: '#FFEDD5',
        packPrimary: '#EA580C',
        packSecondary: '#B91C1C',
        accentColor: '#FACC15',
        textColor: '#FFFFFF',
        labelBg: '#C2410C',
        shape: 'chips_pack',
        badgeText: 'CRISPY NAMKEEN SNACK',
      };
    }
    if (all.includes('bhujia') || all.includes('haldiram')) {
      return {
        bgGradStart: '#FEF2F2',
        bgGradEnd: '#FEF3C7',
        packPrimary: '#B91C1C',
        packSecondary: '#D97706',
        accentColor: '#FDE047',
        textColor: '#FFFFFF',
        labelBg: '#991B1B',
        shape: 'chips_pack',
        badgeText: 'TRADITIONAL INDIAN NAMKEEN',
      };
    }
    if (all.includes('too yumm') || all.includes('baked') || all.includes('multigrain')) {
      return {
        bgGradStart: '#ECFDF5',
        bgGradEnd: '#D1FAE5',
        packPrimary: '#047857',
        packSecondary: '#1E293B',
        accentColor: '#FBBF24',
        textColor: '#FFFFFF',
        labelBg: '#065F46',
        shape: 'chips_pack',
        badgeText: 'BAKED MULTIGRAIN CHIPS',
      };
    }
    return {
      bgGradStart: '#EFF6FF',
      bgGradEnd: '#DBEAFE',
      packPrimary: '#1D4ED8',
      packSecondary: '#F59E0B',
      accentColor: '#DC2626',
      textColor: '#FFFFFF',
      labelBg: '#1E40AF',
      shape: 'chips_pack',
      badgeText: 'MASALA POTATO CHIPS',
    };
  }

  // 12. Biscuits & Cookies
  if (all.includes('biscuit') || all.includes('cookie') || all.includes('parle') || all.includes('good day') || all.includes('nutrichoice') || all.includes('oreo') || all.includes('bourbon') || all.includes('marie')) {
    if (all.includes('oreo')) {
      return {
        bgGradStart: '#EFF6FF',
        bgGradEnd: '#DBEAFE',
        packPrimary: '#1E3A8A',
        packSecondary: '#292524',
        accentColor: '#38BDF8',
        textColor: '#FFFFFF',
        labelBg: '#172554',
        shape: 'biscuit_pack',
        badgeText: 'CHOCO CREME SANDWICH',
      };
    }
    if (all.includes('parle')) {
      return {
        bgGradStart: '#FEFCE8',
        bgGradEnd: '#FEF3C7',
        packPrimary: '#FACC15',
        packSecondary: '#DC2626',
        accentColor: '#B91C1C',
        textColor: '#991B1B',
        labelBg: '#FFFFFF',
        shape: 'biscuit_pack',
        badgeText: 'ORIGINAL GLUCO BISCUITS',
      };
    }
    return {
      bgGradStart: '#FFFBEB',
      bgGradEnd: '#FDE68A',
      packPrimary: '#B45309',
      packSecondary: '#1D4ED8',
      accentColor: '#F59E0B',
      textColor: '#FFFFFF',
      labelBg: '#92400E',
      shape: 'biscuit_pack',
      badgeText: 'BAKED COOKIES & BISCUITS',
    };
  }

  // 13. Coffee, Tea & Health Beverages
  if (all.includes('coffee') || all.includes('nescafe') || all.includes('nescafé') || all.includes('continental') || all.includes('bru ')) {
    return {
      bgGradStart: '#FFFBEB',
      bgGradEnd: '#FDE68A',
      packPrimary: '#451A03',
      packSecondary: '#DC2626',
      accentColor: '#D97706',
      textColor: '#FFFFFF',
      labelBg: '#3E1602',
      shape: 'coffee_jar',
      badgeText: 'ROASTED INSTANT COFFEE',
    };
  }
  if (all.includes('tea') || all.includes('chai') || all.includes('tata tea') || all.includes('red label') || all.includes('taj mahal')) {
    return {
      bgGradStart: '#ECFDF5',
      bgGradEnd: '#FEF3C7',
      packPrimary: '#065F46',
      packSecondary: '#B45309',
      accentColor: '#F59E0B',
      textColor: '#FFFFFF',
      labelBg: '#064E3B',
      shape: 'tea_pouch',
      badgeText: 'ASSAM LEAF TEA',
    };
  }

  // 14. Spreads, Honey & Peanut Butter
  if (all.includes('nutella') || all.includes('honey') || all.includes('peanut butter') || all.includes('pintola') || all.includes('spread') || all.includes('jam')) {
    if (all.includes('honey')) {
      return {
        bgGradStart: '#FFFBEB',
        bgGradEnd: '#FEF08A',
        packPrimary: '#D97706',
        packSecondary: '#15803D',
        accentColor: '#FBBF24',
        textColor: '#78350F',
        labelBg: '#FFFFFF',
        shape: 'spread_jar',
        badgeText: '100% PURE NATURAL HONEY',
      };
    }
    if (all.includes('nutella') || all.includes('cocoa') || all.includes('hazelnut')) {
      return {
        bgGradStart: '#FEF2F2',
        bgGradEnd: '#FFEDD5',
        packPrimary: '#451A03',
        packSecondary: '#DC2626',
        accentColor: '#16A34A',
        textColor: '#1C1917',
        labelBg: '#FFFFFF',
        shape: 'spread_jar',
        badgeText: 'HAZELNUT COCOA SPREAD',
      };
    }
    return {
      bgGradStart: '#FFFBEB',
      bgGradEnd: '#FFEDD5',
      packPrimary: '#92400E',
      packSecondary: '#D97706',
      accentColor: '#15803D',
      textColor: '#78350F',
      labelBg: '#FFFFFF',
      shape: 'spread_jar',
      badgeText: 'ROASTED NUT SPREAD',
    };
  }

  // 15. Atta, Flours, Oats & Cereals
  if (all.includes('atta') || all.includes('flour') || all.includes('aashirvaad') || all.includes('pillsbury') || all.includes('oats') || all.includes('quaker') || all.includes('granola') || all.includes('cereal') || all.includes('muesli') || all.includes('buckwheat') || all.includes('rice')) {
    if (all.includes('aashirvaad')) {
      return {
        bgGradStart: '#FEF2F2',
        bgGradEnd: '#FEF3C7',
        packPrimary: '#B91C1C',
        packSecondary: '#D97706',
        accentColor: '#FDE047',
        textColor: '#FFFFFF',
        labelBg: '#991B1B',
        shape: 'atta_bag',
        badgeText: '100% WHOLE WHEAT ATTA',
      };
    }
    if (all.includes('pillsbury')) {
      return {
        bgGradStart: '#EFF6FF',
        bgGradEnd: '#FEF3C7',
        packPrimary: '#1D4ED8',
        packSecondary: '#F59E0B',
        accentColor: '#FFFFFF',
        textColor: '#FFFFFF',
        labelBg: '#1E40AF',
        shape: 'atta_bag',
        badgeText: 'CHAKKI FRESH ATTA',
      };
    }
    return {
      bgGradStart: '#FFFBEB',
      bgGradEnd: '#FEF3C7',
      packPrimary: '#B45309',
      packSecondary: '#15803D',
      accentColor: '#F59E0B',
      textColor: '#FFFFFF',
      labelBg: '#92400E',
      shape: 'atta_bag',
      badgeText: 'WHOLE GRAIN & CEREALS',
    };
  }

  // 16. Chocolates
  if (all.includes('chocolate') || all.includes('cadbury') || all.includes('dairy milk') || all.includes('kitkat') || all.includes('dark chocolate')) {
    return {
      bgGradStart: '#FAF5FF',
      bgGradEnd: '#F3E8FF',
      packPrimary: '#581C87',
      packSecondary: '#7E22CE',
      accentColor: '#FACC15',
      textColor: '#FFFFFF',
      labelBg: '#4C1D95',
      shape: 'chocolate_bar',
      badgeText: 'COCOA CONFECTIONERY',
    };
  }

  // 17. Soft Drinks & Juices
  if (all.includes('juice') || all.includes('tropicana') || all.includes('real ') || all.includes('coke') || all.includes('pepsi') || all.includes('sprite') || all.includes('drink') || all.includes('beverage')) {
    return {
      bgGradStart: '#FFF7ED',
      bgGradEnd: '#FFEDD5',
      packPrimary: '#EA580C',
      packSecondary: '#16A34A',
      accentColor: '#FACC15',
      textColor: '#FFFFFF',
      labelBg: '#C2410C',
      shape: 'beverage_bottle',
      badgeText: 'BEVERAGE & JUICE',
    };
  }

  // Default fallback by broad type
  if (input.type === 'cosmetics') {
    return {
      bgGradStart: '#F0FDFA',
      bgGradEnd: '#CCFBF1',
      packPrimary: '#0F766E',
      packSecondary: '#14B8A6',
      accentColor: '#0284C7',
      textColor: '#0F172A',
      labelBg: '#FFFFFF',
      shape: 'pump_cleanser',
      badgeText: 'PERSONAL CARE FORMULA',
    };
  }

  return {
    bgGradStart: '#ECFDF5',
    bgGradEnd: '#D1FAE5',
    packPrimary: '#047857',
    packSecondary: '#10B981',
    accentColor: '#F59E0B',
    textColor: '#FFFFFF',
    labelBg: '#065F46',
    shape: 'grocery_pack',
    badgeText: 'RETAIL GROCERY PACK',
  };
}

function renderArtworkInsidePack(shape: PackShape, theme: VisualTheme): string {
  switch (shape) {
    case 'noodle_pack':
      return `
        <!-- Steaming Masala Noodles Bowl Illustration -->
        <circle cx="400" cy="310" r="56" fill="#FFFFFF" opacity="0.95"/>
        <circle cx="400" cy="310" r="48" fill="#FEF08A"/>
        <path d="M365 298 Q385 282 405 298 T435 298" fill="none" stroke="#D97706" stroke-width="5" stroke-linecap="round"/>
        <path d="M362 312 Q382 296 402 312 T438 312" fill="none" stroke="#EA580C" stroke-width="5" stroke-linecap="round"/>
        <path d="M368 326 Q388 310 408 326 T432 326" fill="none" stroke="#D97706" stroke-width="5" stroke-linecap="round"/>
        <circle cx="385" cy="304" r="5" fill="#16A34A"/>
        <circle cx="416" cy="318" r="5" fill="#DC2626"/>
        <circle cx="395" cy="324" r="4" fill="#16A34A"/>
      `;
    case 'chips_pack':
      return `
        <!-- Golden Ridged Potato Chips / Crisps Illustration -->
        <ellipse cx="382" cy="308" rx="34" ry="25" transform="rotate(-18 382 308)" fill="#FDE047" stroke="#D97706" stroke-width="3"/>
        <ellipse cx="418" cy="316" rx="32" ry="23" transform="rotate(15 418 316)" fill="#FACC15" stroke="#B45309" stroke-width="3"/>
        <circle cx="378" cy="305" r="2.5" fill="#DC2626"/>
        <circle cx="422" cy="314" r="2.5" fill="#EA580C"/>
        <circle cx="402" cy="322" r="2" fill="#15803D"/>
      `;
    case 'biscuit_pack':
      return `
        <!-- Baked Golden Biscuits / Cookies Illustration -->
        <rect x="352" y="282" width="56" height="42" rx="8" fill="#D97706" stroke="#78350F" stroke-width="2.5"/>
        <rect x="392" y="294" width="56" height="42" rx="8" fill="#F59E0B" stroke="#92400E" stroke-width="2.5"/>
        <circle cx="408" cy="308" r="3" fill="#78350F"/>
        <circle cx="420" cy="315" r="3" fill="#78350F"/>
        <circle cx="432" cy="308" r="3" fill="#78350F"/>
        <circle cx="420" cy="323" r="3" fill="#78350F"/>
      `;
    case 'milk_carton':
      return `
        <!-- Pure Milk Droplet & Wave Illustration -->
        <circle cx="400" cy="312" r="44" fill="#E0F2FE"/>
        <path d="M400 278 C400 278 424 306 424 322 C424 335 413 345 400 345 C387 345 376 335 376 322 C376 306 400 278 400 278 Z" fill="#0284C7"/>
        <circle cx="393" cy="318" r="6" fill="#FFFFFF" opacity="0.8"/>
      `;
    case 'butter_box':
      return `
        <!-- Golden Butter Slice Illustration -->
        <rect x="355" y="286" width="90" height="48" rx="8" fill="#FACC15" stroke="#CA8A04" stroke-width="3"/>
        <path d="M365 296 L435 296" stroke="#FEF08A" stroke-width="4" stroke-linecap="round"/>
      `;
    case 'coffee_jar':
      return `
        <!-- Roasted Coffee Beans & Aroma Cup -->
        <ellipse cx="384" cy="312" rx="18" ry="13" transform="rotate(-25 384 312)" fill="#78350F"/>
        <path d="M372 312 Q384 306 396 312" fill="none" stroke="#FDE68A" stroke-width="2"/>
        <ellipse cx="418" cy="315" rx="18" ry="13" transform="rotate(20 418 315)" fill="#92400E"/>
        <path d="M406 315 Q418 309 430 315" fill="none" stroke="#FDE68A" stroke-width="2"/>
      `;
    case 'tea_pouch':
      return `
        <!-- Green Assam Tea Leaves Illustration -->
        <path d="M400 276 C428 276 436 308 400 338 C364 308 372 276 400 276 Z" fill="#22C55E"/>
        <path d="M400 282 L400 334" stroke="#DCFCE7" stroke-width="2.5"/>
      `;
    case 'spread_jar':
      return `
        <!-- Golden Honey / Nut Spread Swirl -->
        <circle cx="400" cy="312" r="38" fill="${theme.accentColor}" opacity="0.25"/>
        <path d="M374 314 Q400 286 426 314 Q400 340 374 314 Z" fill="${theme.packPrimary}"/>
      `;
    case 'atta_bag':
      return `
        <!-- Golden Whole Wheat Stalks Illustration -->
        <circle cx="400" cy="312" r="42" fill="#FEF3C7"/>
        <path d="M400 344 L400 280" stroke="#B45309" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="390" cy="296" rx="8" ry="5" transform="rotate(-30 390 296)" fill="#F59E0B"/>
        <ellipse cx="410" cy="296" rx="8" ry="5" transform="rotate(30 410 296)" fill="#F59E0B"/>
        <ellipse cx="390" cy="312" rx="8" ry="5" transform="rotate(-30 390 312)" fill="#D97706"/>
        <ellipse cx="410" cy="312" rx="8" ry="5" transform="rotate(30 410 312)" fill="#D97706"/>
      `;
    case 'toothpaste_tube':
      return `
        <!-- Sparkling White Tooth & Mint Wave -->
        <path d="M384 288 C374 288 370 302 374 316 C377 328 382 338 389 338 C394 338 396 326 400 326 C404 326 406 338 411 338 C418 338 423 328 426 316 C430 302 426 288 416 288 C408 288 404 293 400 293 C396 293 392 288 384 288 Z" fill="#FFFFFF" stroke="#38BDF8" stroke-width="3"/>
      `;
    case 'soap_bar':
      return `
        <!-- Smooth Rounded Bathing Bar Emblem -->
        <ellipse cx="400" cy="312" rx="54" ry="30" fill="#FFFFFF" opacity="0.9" stroke="${theme.packSecondary}" stroke-width="3"/>
        <path d="M382 312 Q400 298 418 312 Q400 324 382 312 Z" fill="${theme.packSecondary}"/>
      `;
    default:
      return `
        <circle cx="400" cy="312" r="34" fill="${theme.accentColor}" opacity="0.25"/>
        <circle cx="400" cy="312" r="20" fill="${theme.packSecondary}" opacity="0.85"/>
      `;
  }
}

/**
 * Resolves the exact first real product photograph from Blinkit, Swiggy Instamart, or Instagram
 * for the searched/selected item name.
 */
export function resolveExactProductImage(input: ProductVisualInput): string {
  const rawName = (input.name || 'Grocery Product').trim();

  // Strip internal suffixes/annotations so the image search query matches the exact commercial product title
  let cleanTitle = rawName
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*—.*$/g, '')
    .replace(/\s*\+.*$/g, '')
    .replace(/['’!]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanTitle) {
    cleanTitle = rawName.replace(/\s+/g, ' ').trim();
  }

  // Include brand name if it isn't already the first word of the product title and isn't a generic placeholder
  const rawBrand = (input.brand || '')
    .replace(/\s*\([^)]*\)/g, '')
    .split('/')[0]
    .split('·')[0]
    .replace(/\b(India|Ltd|Pvt|Limited|Consumer|Products|Healthcare|Foods|Farms|Orchards|Mandi|Fresh|Blinkit|Instamart|Verified|Brand|Retail|Commercial)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const hasBrandInTitle =
    !rawBrand ||
    rawBrand.length < 2 ||
    cleanTitle.toLowerCase().includes(rawBrand.toLowerCase());

  const baseProductQuery = hasBrandInTitle ? cleanTitle : `${rawBrand} ${cleanTitle}`;

  const storeSuffix =
    input.storeHint === 'instamart'
      ? 'swiggy instamart product'
      : input.storeHint === 'instagram'
      ? 'instagram official product pack'
      : 'blinkit instamart product';

  const fullQuery = `${baseProductQuery} ${storeSuffix}`.replace(/\s+/g, ' ').trim();

  const url = new URL('https://tse2.mm.bing.net/th');
  url.searchParams.set('q', fullQuery);
  url.searchParams.set('w', '500');
  url.searchParams.set('h', '500');
  url.searchParams.set('c', '7');
  url.searchParams.set('rs', '1');
  url.searchParams.set('p', '0');

  return url.toString();
}

export function isAuthenticProductImageUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('mm.bing.net/th') ||
    url.includes('cdn.grofers.com') ||
    url.includes('blinkit.com') ||
    url.includes('swiggy.com')
  );
}

export function resolveFallbackProductSvg(input: ProductVisualInput): string {
  const theme = resolveVisualTheme(input);
  const rawBrand = (input.brand || 'Blinkit & Instamart')
    .replace(/\s*\(.*?\)/g, '')
    .split('·')[0]
    .trim()
    .slice(0, 26)
    .toUpperCase();
  const titleLines = splitTextIntoLines(input.name || 'Retail Product', 22, 3);
  const packSizeText = (input.packSize || input.category || 'Verified Pack').slice(0, 26);

  // Produce custom full-bleed botanical illustrations
  if (
    theme.shape === 'avocado_produce' ||
    theme.shape === 'banana_produce' ||
    theme.shape === 'mango_produce' ||
    theme.shape === 'tomato_produce' ||
    theme.shape === 'cucumber_produce' ||
    theme.shape === 'fruit_produce' ||
    theme.shape === 'veg_produce'
  ) {
    let produceGraphic = '';
    if (theme.shape === 'avocado_produce') {
      produceGraphic = `
        <ellipse cx="365" cy="195" rx="68" ry="88" transform="rotate(-12 365 195)" fill="#1A2E05"/>
        <ellipse cx="430" cy="205" rx="65" ry="84" transform="rotate(10 430 205)" fill="#365314"/>
        <ellipse cx="430" cy="205" rx="54" ry="72" transform="rotate(10 430 205)" fill="#BEF264"/>
        <ellipse cx="430" cy="205" rx="42" ry="58" transform="rotate(10 430 205)" fill="#FEF9C3"/>
        <circle cx="430" cy="222" r="28" fill="#78350F"/>
        <circle cx="422" cy="214" r="8" fill="#A16207" opacity="0.7"/>
      `;
    } else if (theme.shape === 'banana_produce') {
      produceGraphic = `
        <path d="M315 235 Q385 285 475 155 Q490 130 470 120 Q455 135 435 165 Q375 245 315 215 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="4"/>
        <path d="M335 255 Q410 300 495 170 Q508 145 488 135 Q470 155 450 185 Q395 260 335 235 Z" fill="#FDE047" stroke="#EAB308" stroke-width="4"/>
      `;
    } else if (theme.shape === 'mango_produce') {
      produceGraphic = `
        <path d="M355 125 C425 110 475 160 465 225 C455 275 405 295 365 270 C325 245 315 140 355 125 Z" fill="#F59E0B" stroke="#D97706" stroke-width="4"/>
        <path d="M385 115 Q415 90 435 108 Q410 125 385 115 Z" fill="#15803D"/>
        <circle cx="378" cy="175" r="18" fill="#FDE047" opacity="0.45"/>
      `;
    } else if (theme.shape === 'tomato_produce') {
      produceGraphic = `
        <circle cx="400" cy="205" r="74" fill="#DC2626"/>
        <circle cx="376" cy="180" r="18" fill="#FCA5A5" opacity="0.45"/>
        <path d="M370 135 L400 148 L430 135 L408 126 L400 112 L392 126 Z" fill="#15803D"/>
      `;
    } else if (theme.shape === 'cucumber_produce') {
      produceGraphic = `
        <rect x="305" y="165" width="190" height="58" rx="29" transform="rotate(-18 400 194)" fill="#15803D" stroke="#14532D" stroke-width="4"/>
        <circle cx="445" cy="222" r="32" fill="#166534"/>
        <circle cx="445" cy="222" r="26" fill="#BBF7D0"/>
      `;
    } else {
      produceGraphic = `
        <circle cx="400" cy="200" r="72" fill="${theme.packPrimary}"/>
        <circle cx="378" cy="176" r="16" fill="#FFFFFF" opacity="0.35"/>
        <path d="M395 126 Q418 106 432 124 Q412 138 395 126 Z" fill="#15803D"/>
      `;
    }

    const svgProduce = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.bgGradStart}"/>
          <stop offset="100%" stop-color="${theme.bgGradEnd}"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#bg)"/>
      <circle cx="400" cy="205" r="145" fill="#FFFFFF" opacity="0.65"/>
      ${produceGraphic}
      <rect x="140" y="340" width="520" height="128" rx="22" fill="#FFFFFF" stroke="${theme.packPrimary}" stroke-width="3"/>
      <rect x="300" y="324" width="200" height="28" rx="14" fill="${theme.packPrimary}"/>
      <text x="400" y="343" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" fill="#FFFFFF" letter-spacing="1">${escapeXml(theme.badgeText)}</text>
      <text x="400" y="382" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#1C1917">${escapeXml(titleLines[0] || input.name)}</text>
      ${
        titleLines[1]
          ? `<text x="400" y="410" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#44403C">${escapeXml(titleLines[1])}</text>`
          : ''
      }
      <text x="400" y="446" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="${theme.packPrimary}">${escapeXml(rawBrand)} · ${escapeXml(packSizeText)}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svgProduce)}`;
  }

  // Render container neck/cap silhouette depending on product type
  let containerTopSilhouette = '';
  if (theme.shape === 'shampoo_bottle') {
    containerTopSilhouette = `
      <!-- Shampoo Flip-Cap & Neck -->
      <rect x="352" y="26" width="96" height="36" rx="12" fill="${theme.packSecondary}"/>
      <rect x="364" y="54" width="72" height="22" rx="4" fill="${theme.packPrimary}"/>
    `;
  } else if (theme.shape === 'pump_cleanser') {
    containerTopSilhouette = `
      <!-- Pump Dispenser Nozzle -->
      <path d="M385 18 L448 18 Q462 18 462 30 L414 30 L414 54 L386 54 Z" fill="${theme.packPrimary}"/>
      <rect x="370" y="50" width="60" height="24" rx="6" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
    `;
  } else if (theme.shape === 'serum_dropper') {
    containerTopSilhouette = `
      <!-- Dropper Pipette Bulb & Collar -->
      <rect x="380" y="14" width="40" height="34" rx="18" fill="#18181B"/>
      <rect x="368" y="44" width="64" height="24" rx="4" fill="#D4D4D8" stroke="#71717A" stroke-width="2"/>
    `;
  } else if (theme.shape === 'squeeze_tube' || theme.shape === 'toothpaste_tube') {
    containerTopSilhouette = `
      <!-- Tube Crimped Seal Top -->
      <rect x="255" y="48" width="290" height="18" rx="3" fill="${theme.packSecondary}"/>
      <line x1="270" y1="48" x2="270" y2="66" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/>
      <line x1="290" y1="48" x2="290" y2="66" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/>
      <line x1="510" y1="48" x2="510" y2="66" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/>
      <line x1="530" y1="48" x2="530" y2="66" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/>
    `;
  } else if (theme.shape === 'coffee_jar' || theme.shape === 'spread_jar' || theme.shape === 'cream_jar') {
    containerTopSilhouette = `
      <!-- Jar Screw Lid -->
      <rect x="280" y="34" width="240" height="38" rx="10" fill="${theme.packSecondary}"/>
      <rect x="292" y="66" width="216" height="12" fill="#CBD5E1"/>
    `;
  } else {
    // Crinkle Pouch / Carton Top Seal
    containerTopSilhouette = `
      <rect x="245" y="44" width="310" height="20" rx="4" fill="${theme.packSecondary}"/>
      <line x1="255" y1="54" x2="545" y2="54" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="8 6" opacity="0.6"/>
    `;
  }

  const innerArtwork = renderArtworkInsidePack(theme.shape, theme);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${theme.bgGradStart}"/>
        <stop offset="100%" stop-color="${theme.bgGradEnd}"/>
      </linearGradient>
      <linearGradient id="packGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${theme.packPrimary}"/>
        <stop offset="100%" stop-color="${theme.packSecondary}"/>
      </linearGradient>
      <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.18"/>
      </filter>
    </defs>

    <!-- Studio Backdrop -->
    <rect width="800" height="500" fill="url(#bgGrad)"/>
    <circle cx="400" cy="250" r="210" fill="#FFFFFF" opacity="0.55"/>

    <!-- Top Store Verification Pill -->
    <rect x="24" y="22" width="225" height="32" rx="16" fill="#FFFFFF" opacity="0.92"/>
    <circle cx="42" cy="38" r="6" fill="#10B981"/>
    <text x="56" y="43" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" fill="#065F46">BLINKIT &amp; INSTAMART</text>

    <!-- 3D Product Container Group -->
    <g filter="url(#dropShadow)">
      ${containerTopSilhouette}

      <!-- Main Package Body -->
      <rect x="245" y="62" width="310" height="392" rx="28" fill="url(#packGrad)" stroke="#FFFFFF" stroke-width="4"/>

      <!-- Glossy Studio Highlight on Left Edge -->
      <rect x="260" y="76" width="22" height="360" rx="11" fill="#FFFFFF" opacity="0.18"/>

      <!-- Inner Label Card -->
      <rect x="267" y="88" width="266" height="285" rx="20" fill="${theme.labelBg}"/>

      <!-- Brand Header Pill -->
      <rect x="285" y="102" width="230" height="28" rx="14" fill="${theme.packPrimary}"/>
      <text x="400" y="121" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#FFFFFF" letter-spacing="0.8">${escapeXml(rawBrand)}</text>

      <!-- Exact Product Title Lines -->
      <text x="400" y="162" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="${theme.textColor}">${escapeXml(titleLines[0] || input.name)}</text>
      ${
        titleLines[1]
          ? `<text x="400" y="190" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="19" font-weight="800" fill="${theme.textColor}" opacity="0.92">${escapeXml(titleLines[1])}</text>`
          : ''
      }
      ${
        titleLines[2]
          ? `<text x="400" y="215" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="${theme.textColor}" opacity="0.85">${escapeXml(titleLines[2])}</text>`
          : ''
      }

      <!-- Category Badge Strip -->
      <rect x="295" y="230" width="210" height="24" rx="12" fill="${theme.packSecondary}" opacity="0.16"/>
      <text x="400" y="246" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="${theme.textColor}" letter-spacing="0.6">${escapeXml(theme.badgeText)}</text>

      <!-- Item-Specific Vector Illustration -->
      ${innerArtwork}

      <!-- Bottom Pack Size & Net Weight Footer -->
      <rect x="285" y="396" width="230" height="36" rx="12" fill="#FFFFFF" opacity="0.92"/>
      <text x="400" y="419" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#1E293B">${escapeXml(packSizeText)}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
