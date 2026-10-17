import React, { useState, useEffect } from 'react';
import { Product, ProductType, UserPreferences } from '../../types/scanner';
import { 
  Camera, 
  Upload, 
  Barcode, 
  Flashlight, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Info, 
  ArrowRight,
  Terminal,
  FileText,
  Search,
  Globe,
  Apple,
  Zap,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
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
  initialType?: ProductType;
  availableProducts: Product[];
  userPreferences?: UserPreferences;
  onProductScanned: (product: Product, method: 'camera' | 'barcode' | 'upload' | 'demo' | 'search' | 'fruit') => void;
  onOpenApiConsole: () => void;
  onCancel: () => void;
}

export const ScanScreen: React.FC<Props> = ({
  initialType = 'food',
  availableProducts,
  userPreferences,
  onProductScanned,
  onOpenApiConsole,
  onCancel,
}) => {
  const [selectedType, setSelectedType] = useState<ProductType>(initialType);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [flashlightOn, setFlashlightOn] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  
  // Modals & custom input
  const [showBarcodeModal, setShowBarcodeModal] = useState<boolean>(false);
  const [barcodeModalTab, setBarcodeModalTab] = useState<'barcode' | 'internet-search'>('barcode');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [manualError, setManualError] = useState<string>('');
  
  // Internet & Quick-Commerce live search state
  const [liveSearchQuery, setLiveSearchQuery] = useState<string>('');
  const [liveStoreFilter, setLiveStoreFilter] = useState<QuickCommercePlatform>('all');
  const [liveSearchResults, setLiveSearchResults] = useState<LiveSearchResultItem[]>([]);
  const [liveKeywordSuggestions, setLiveKeywordSuggestions] = useState<string[]>([]);
  const [isLiveSearching, setIsLiveSearching] = useState<boolean>(false);

  useEffect(() => {
    const local = filterLocalQuickCommerceSuggestions(liveSearchQuery, liveStoreFilter);
    setLiveKeywordSuggestions(local.keywordSuggestions);
    setLiveSearchResults(local.productSuggestions);

    const timer = setTimeout(async () => {
      try {
        const remote = await SafeScanAPI.getSearchSuggestions(liveSearchQuery, liveStoreFilter);
        if (remote.keywordSuggestions?.length) {
          setLiveKeywordSuggestions(remote.keywordSuggestions);
        }
        const validRemote = (remote.productSuggestions || []).filter(
          (p) =>
            !p.name.startsWith('Pure Organic ') &&
            !p.name.startsWith('Clean Formulation ')
        );
        if (validRemote.length) {
          setLiveSearchResults(validRemote);
        }
      } catch (e) {}
    }, 180);

    return () => clearTimeout(timer);
  }, [liveSearchQuery, liveStoreFilter]);

  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('Custom Formulation');
  const [customBrand, setCustomBrand] = useState<string>('Independent Label');
  const [customIngredients, setCustomIngredients] = useState<string>(
    'Water, Vegetable Glycerin, Niacinamide, Phytosqualane, Ceramide NP, Phenoxyethanol, Fragrance, Red 40'
  );
  const [customError, setCustomError] = useState<string>('');

  // Fruit scanner state
  const [showFruitModal, setShowFruitModal] = useState<boolean>(false);

  const FRUIT_SAMPLES = [
    {
      id: 'avocado_ripe',
      name: 'Hass Avocado (Peak Ripe 88%)',
      variety: 'Hass',
      image: '/src/assets/images/ripe_hass_avocado_1792163056391.jpg',
      ripeness: 'Peak Ripe (88%)',
      stage: 'Peak Ripe',
      status: 'Ready to Eat',
      colorHint: 'Dark pebbled rind with lime-green buttery flesh',
      textureHint: 'Yields slightly to gentle pressure · Firmness 6/10',
    },
    {
      id: 'avocado_unripe',
      name: 'Hass Avocado (Underripe 25%)',
      variety: 'Hass (Green)',
      image: '/src/assets/images/ripe_hass_avocado_1792163056391.jpg',
      ripeness: 'Unripe (25%)',
      stage: 'Unripe',
      status: 'Wait 4-6 Days',
      colorHint: 'Grass green skin, zero anthocyanin darkening',
      textureHint: 'Rock hard, unyielding rigid skin · Firmness 9/10',
    },
    {
      id: 'banana_ripe',
      name: 'Cavendish Bananas (Sweet Spotted 92%)',
      variety: 'Cavendish',
      image: '/src/assets/images/ripe_bananas_1792163068325.jpg',
      ripeness: 'Peak Ripe (92%)',
      stage: 'Peak Ripe',
      status: 'Ready to Eat',
      colorHint: 'Golden yellow with brown sugar freckles',
      textureHint: 'Tender yielding peel, 15.5° Brix sweetness',
    },
    {
      id: 'banana_green',
      name: 'Cavendish Bananas (Green Underripe 18%)',
      variety: 'Cavendish (Green)',
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80',
      ripeness: 'Unripe (18%)',
      stage: 'Unripe',
      status: 'Wait 4-6 Days',
      colorHint: 'Chartreuse green with rigid angular seams',
      textureHint: 'High resistant starch, firm and dense · Firmness 9/10',
    },
    {
      id: 'mango_alphonso',
      name: 'Alphonso Mango (Golden Ripe 94%)',
      variety: 'Alphonso / Hapus',
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80',
      ripeness: 'Peak Ripe (94%)',
      stage: 'Peak Ripe',
      status: 'Ready to Eat',
      colorHint: 'Saffron golden yellow with orange blush',
      textureHint: 'Aromatic floral bouquet, silken pulp · 18.2° Brix',
    },
    {
      id: 'strawberry_fresh',
      name: 'Garden Strawberries (Peak Fresh 95%)',
      variety: 'Camarosa',
      image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&auto=format&fit=crop&q=80',
      ripeness: 'Peak Ripe (95%)',
      stage: 'Peak Ripe',
      status: 'Ready to Eat',
      colorHint: 'Deep saturated ruby red with golden achenes',
      textureHint: 'Plump, glossy skin, high vitamin C · 10.5° Brix',
    },
  ];

  const handleScanFruit = async (sampleId?: string, imageBase64?: string) => {
    setIsAnalyzing(true);
    setAnalysisStep('Sampling fruit peel chromaticity & color spectrum...');

    const timer1 = setTimeout(() => {
      setAnalysisStep('Analyzing surface pebbling, skin texture & firmness score...');
    }, 600);

    const timer2 = setTimeout(() => {
      setAnalysisStep('Calculating Brix sugar index & days to peak ripeness...');
    }, 1200);

    const timer3 = setTimeout(() => {
      setAnalysisStep('Cross-referencing Tata 1mg Fresh Produce Monograph...');
    }, 1800);

    try {
      const response = await SafeScanAPI.scanFruit({
        sampleId,
        imageBase64,
        userPreferences,
      });

      setTimeout(() => {
        setIsAnalyzing(false);
        setShowFruitModal(false);
        onProductScanned(response.product, 'fruit');
      }, 2300);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsAnalyzing(false);
      setManualError(err?.message || 'Fruit analysis failed. Please try again.');
    }
  };

  const handleFruitImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleScanFruit(undefined, base64);
    };
    reader.readAsDataURL(file);
  };

  // Filter demo items by type
  const typeProducts = availableProducts.filter((p) => p.type === selectedType);

  // Trigger simulated scan sequence for demo items
  const startSimulatedAnalysis = (targetProduct: Product, method: 'camera' | 'barcode' | 'upload' | 'demo') => {
    setIsAnalyzing(true);
    setAnalysisStep('Aligning optical sensor...');

    const timer1 = setTimeout(() => {
      setAnalysisStep('Extracting ingredient text (OCR)...');
    }, 600);

    const timer2 = setTimeout(() => {
      setAnalysisStep('Querying SafeScan REST API & Registries...');
    }, 1300);

    const timer3 = setTimeout(() => {
      setAnalysisStep('Checking personalized allergens & preferences...');
    }, 2000);

    const timer4 = setTimeout(() => {
      setIsAnalyzing(false);
      onProductScanned(targetProduct, method);
    }, 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = barcodeInput.trim();
    if (!cleanCode) return;

    setManualError('');
    setIsAnalyzing(true);
    setAnalysisStep(`Querying live registries & AI internet intelligence for barcode ${cleanCode}...`);

    try {
      const result = await SafeScanAPI.getProductByBarcode(cleanCode);
      setShowBarcodeModal(false);
      setIsAnalyzing(false);
      // Immediately open result and record to scan history
      onProductScanned(result.product, 'barcode');
    } catch (err: any) {
      setIsAnalyzing(false);
      setManualError(err?.message || `Failed to process barcode ${cleanCode}.`);
    }
  };

  const handleLiveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = liveSearchQuery.trim();
    if (!cleanQ) return;
    setIsLiveSearching(true);
    setManualError('');

    try {
      const data = await SafeScanAPI.searchLiveProducts(cleanQ, liveStoreFilter);
      const validResults = (data.results || []).filter(
        (p) =>
          !p.name.startsWith('Pure Organic ') &&
          !p.name.startsWith('Clean Formulation ')
      );
      if (validResults.length > 0) {
        setLiveSearchResults(validResults);
      } else {
        const localFallback = filterLocalQuickCommerceSuggestions(cleanQ, liveStoreFilter).productSuggestions;
        setLiveSearchResults(localFallback);
      }
    } catch (err: any) {
      const localFallback = filterLocalQuickCommerceSuggestions(cleanQ, liveStoreFilter).productSuggestions;
      setLiveSearchResults(localFallback);
    } finally {
      setIsLiveSearching(false);
    }
  };

  const handleSelectLiveResult = async (item: LiveSearchResultItem) => {
    setIsAnalyzing(true);
    setAnalysisStep(`Collecting & analyzing Blinkit & Instamart ingredients for ${item.name}...`);

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

      setShowBarcodeModal(false);
      setIsAnalyzing(false);
      onProductScanned(enrichedProduct, 'search');
    } catch (err: any) {
      const fallbackProduct = convertCatalogItemToProduct({
        ...item,
        image: exactImage,
        subCategory,
      });
      setShowBarcodeModal(false);
      setIsAnalyzing(false);
      onProductScanned(fallbackProduct, 'search');
    }
  };

  const handleCustomAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError('');
    if (!customIngredients.trim()) {
      setCustomError('Please enter at least one ingredient');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep('Sending payload to POST /api/analyze...');

    try {
      const response = await SafeScanAPI.analyzeIngredients({
        text: customIngredients,
        type: selectedType,
        productName: customName || 'Custom Formulation',
        brand: customBrand || 'Custom Brand',
        userPreferences,
      });

      setShowCustomModal(false);
      setIsAnalyzing(false);
      onProductScanned(response.product, 'upload');
    } catch (err: any) {
      setIsAnalyzing(false);
      setCustomError(err?.message || 'Analysis failed. Please check your backend connection.');
    }
  };

  const handleDemoPreset = (product: Product) => {
    startSimulatedAnalysis(product, 'demo');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Top Category Segmented Tabs & API trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
              {selectedType === 'fruit' ? 'Fruit Ripeness Scanner' : 'Safety Scanner'}
            </h1>
            <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold">
              {selectedType === 'fruit' ? 'Color & Texture AI Vision' : 'Live Registries & AI Connected'}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            {selectedType === 'fruit'
              ? 'Scan fruit peel color palette, surface texture & ripeness level'
              : 'Aim camera at ingredient label or barcode'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* API Console Button */}
          <button
            onClick={onOpenApiConsole}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-colors cursor-pointer shadow-xs"
            title="Open API Explorer Console"
          >
            <Terminal size={14} className="text-emerald-700" />
            <span>API Docs</span>
          </button>

          {/* 3-Way Tab Selector */}
          <div className="flex items-center p-1 bg-stone-200/70 rounded-xl" role="tablist">
            <button
              onClick={() => setSelectedType('fruit')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedType === 'fruit'
                  ? 'bg-white text-emerald-950 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              role="tab"
              aria-selected={selectedType === 'fruit'}
            >
              <Apple size={13} className="text-emerald-700" />
              <span>Fruit</span>
            </button>
            <button
              onClick={() => setSelectedType('food')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedType === 'food'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              role="tab"
              aria-selected={selectedType === 'food'}
            >
              Food
            </button>
            <button
              onClick={() => setSelectedType('cosmetics')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedType === 'cosmetics'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              role="tab"
              aria-selected={selectedType === 'cosmetics'}
            >
              Cosmetics
            </button>
          </div>
        </div>
      </div>

      {/* Camera Viewport Simulation */}
      <div className="relative aspect-[4/5] sm:aspect-[4/3] rounded-3xl overflow-hidden bg-stone-950 shadow-2xl border-4 border-stone-800 flex flex-col justify-between p-5 text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-950 to-black opacity-90" />
        
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Controls Overlay */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-emerald-400">
            {selectedType === 'fruit' ? 'COLOR & TEXTURE COMPUTER VISION · TATA 1MG' : 'OPEN REGISTRIES · REAL-TIME AI'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFlashlightOn(!flashlightOn)}
              className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                flashlightOn ? 'bg-amber-400 text-stone-950' : 'bg-black/60 text-white hover:bg-black/80'
              }`}
              title="Toggle Flashlight"
              aria-label="Toggle flashlight"
            >
              <Flashlight size={16} />
            </button>
            <button
              onClick={() => setHasPermission(!hasPermission)}
              className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
              title="Simulate Camera Permission State"
              aria-label="Toggle simulated camera permission"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Center Scanner Reticle */}
        {hasPermission ? (
          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            <div className={`relative ${selectedType === 'fruit' ? 'w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-emerald-400/40' : 'w-64 h-64 sm:w-80 sm:h-64 rounded-2xl border-2 border-white/20'} flex items-center justify-center overflow-hidden transition-all`}>
              {selectedType !== 'fruit' && (
                <>
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                </>
              )}

              {selectedType === 'fruit' && (
                <div className="absolute inset-4 rounded-full border border-dashed border-emerald-300/30 animate-pulse pointer-events-none" />
              )}

              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-scan-laser pointer-events-none" />

              {!isAnalyzing ? (
                <div className="text-center px-4 py-2 rounded-xl bg-black/40 backdrop-blur-xs border border-white/10 text-xs text-stone-200">
                  <p className="font-semibold text-white">
                    {selectedType === 'fruit' ? 'Position fruit inside reticle' : 'Center barcode or label text'}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {selectedType === 'fruit'
                      ? 'Evaluates peel color chroma, skin texture & ripeness stage'
                      : 'Queries Open Food Facts & Open Beauty Facts'}
                  </p>
                </div>
              ) : (
                <div className="text-center px-4 py-3 rounded-2xl bg-black/80 backdrop-blur-md border border-emerald-500/40 text-xs text-emerald-200 space-y-2 animate-in zoom-in-95">
                  <RefreshCw size={24} className="mx-auto text-emerald-400 animate-spin" />
                  <p className="font-bold text-white text-sm">{analysisStep}</p>
                  <p className="text-[10px] text-emerald-300/80 font-mono">
                    {selectedType === 'fruit' ? 'Analyzing color chromatics & tactile firmness...' : 'Backend API searching internet...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative z-10 text-center my-auto p-6 bg-black/80 rounded-2xl border border-red-500/30 max-w-sm mx-auto">
            <AlertCircle size={36} className="mx-auto text-rose-400 mb-2" />
            <h3 className="font-bold text-white text-base">Camera Access Restricted</h3>
            <p className="text-xs text-stone-300 mt-1">
              Simulated permission denied. In actual usage, camera access enables optical recognition.
            </p>
            <button
              onClick={() => setHasPermission(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Grant Simulated Access
            </button>
          </div>
        )}

        <div className="relative z-10 text-center">
          <p className="text-[11px] text-stone-400 bg-black/50 py-1 px-3 rounded-full inline-block backdrop-blur-xs">
            {selectedType === 'fruit'
              ? 'Ripeness & texture analysis grounded in USDA produce standards and Tata 1mg'
              : 'Live internet product lookups powered by Open Food Facts & SafeScan AI'}
          </p>
        </div>
      </div>

      {/* Interactive Action Buttons */}
      {selectedType === 'fruit' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Fruit Varieties Picker */}
          <button
            onClick={() => setShowFruitModal(true)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-600/40 hover:bg-stone-50 transition-colors cursor-pointer text-center group min-h-[72px]"
          >
            <Apple size={18} className="text-emerald-700 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-semibold text-stone-800">Fruit Varieties</span>
            <span className="text-[10px] text-stone-500">6 Tested Produce Types</span>
          </button>

          {/* Instant Scan Avocado */}
          <button
            onClick={() => handleScanFruit('avocado_ripe')}
            disabled={isAnalyzing}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-600/40 hover:bg-emerald-50/30 transition-all cursor-pointer text-center group min-h-[72px]"
          >
            <Camera size={18} className="text-stone-700 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-semibold text-stone-800">Scan Avocado</span>
            <span className="text-[10px] text-emerald-800 font-bold">Peak Ripe 88%</span>
          </button>

          {/* Instant Scan Banana */}
          <button
            onClick={() => handleScanFruit('banana_ripe')}
            disabled={isAnalyzing}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-600/40 hover:bg-amber-50/30 transition-all cursor-pointer text-center group min-h-[72px]"
          >
            <Sparkles size={18} className="text-amber-600 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-semibold text-stone-800">Scan Banana</span>
            <span className="text-[10px] text-amber-800 font-bold">Sweet Freckles 92%</span>
          </button>

          {/* Upload Fruit Photo */}
          <label
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-600/40 hover:bg-stone-50 transition-colors cursor-pointer text-center group min-h-[72px]"
            title="Upload fruit photo from gallery or camera"
          >
            <Upload size={18} className="text-stone-700 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-semibold text-stone-800">Upload Fruit</span>
            <span className="text-[10px] text-stone-500">AI Vision Inspection</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFruitImageUpload}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Enter Barcode / Internet Search */}
          <button
            onClick={() => {
              setBarcodeModalTab('barcode');
              setShowBarcodeModal(true);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-600/40 hover:bg-stone-50 transition-colors cursor-pointer text-center group min-h-[72px]"
          >
            <Barcode size={18} className="text-stone-700 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-semibold text-stone-800">Barcode Lookup</span>
            <span className="text-[10px] text-stone-500">Live Global Registry</span>
          </button>

          {/* Live Internet Search */}
          <button
            onClick={() => {
              setBarcodeModalTab('internet-search');
              setShowBarcodeModal(true);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-600/40 hover:bg-stone-50 transition-colors cursor-pointer text-center group min-h-[72px]"
          >
            <Globe size={18} className="text-teal-700 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-semibold text-stone-800">Search Internet</span>
            <span className="text-[10px] text-stone-500">By Brand / Item Name</span>
          </button>

          {/* Custom Ingredient AI Analyzer (POST /api/analyze) */}
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-600/40 hover:bg-emerald-50/30 transition-all cursor-pointer text-center group min-h-[72px]"
          >
            <FileText size={18} className="text-emerald-700 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-semibold text-stone-800">Paste Label Text</span>
            <span className="text-[10px] text-stone-500">POST /api/analyze</span>
          </button>

          {/* Upload Button */}
          <label
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-600/40 hover:bg-stone-50 transition-colors cursor-pointer text-center group min-h-[72px]"
            title="Upload label photo from gallery"
          >
            <Upload size={18} className="text-stone-700 group-hover:scale-110 transition-transform mb-1" />
            <span className="text-xs font-semibold text-stone-800">Upload Label</span>
            <span className="text-[10px] text-stone-500">Image File OCR</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={() => {
                const demo = typeProducts[0] || availableProducts[0];
                startSimulatedAnalysis(demo, 'upload');
              }}
            />
          </label>
        </div>
      )}

      {/* Fruit Presets Strip or Preloaded Catalog Strip */}
      {selectedType === 'fruit' ? (
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
              <Apple size={15} className="text-emerald-700" />
              <span>Calibrated Fruit Samples (Color &amp; Texture Tested):</span>
            </span>
            <span className="text-emerald-800 font-mono text-[11px]">6 produce varieties</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-2.5">
            {FRUIT_SAMPLES.map((fruit) => (
              <button
                key={fruit.id}
                onClick={() => handleScanFruit(fruit.id)}
                disabled={isAnalyzing}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-emerald-200/70 hover:border-emerald-700 hover:shadow-xs transition-all text-left cursor-pointer group disabled:opacity-50"
              >
                <img
                  src={fruit.image}
                  alt={fruit.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover bg-stone-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide truncate">
                      {fruit.variety}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      fruit.stage === 'Unripe'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}>
                      {fruit.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 truncate group-hover:text-emerald-900">
                    {fruit.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 truncate">{fruit.textureHint}</p>
                </div>
                <ArrowRight size={14} className="text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-800">Preloaded Indexed Catalog:</span>
            <span className="text-stone-500 font-mono text-[11px]">{typeProducts.length} items in /api/products</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            {typeProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => handleDemoPreset(p)}
                disabled={isAnalyzing}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-700 hover:shadow-xs transition-all text-left cursor-pointer group disabled:opacity-50"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide block truncate">
                    {p.brand}
                  </span>
                  <span className="text-xs font-bold text-stone-900 block truncate group-hover:text-emerald-900">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-stone-500 block truncate font-mono">
                    UPC: {p.barcode}
                  </span>
                </div>
                <ArrowRight size={14} className="text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clearly visible demonstration disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
        <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold text-amber-950">Safety Architecture:</strong> SafeScan AI REST endpoints execute real-time allergen screening and toxicological classification against FALCPA, FDA 21 CFR, and EU Cosmetic regulations.
        </p>
      </div>

      {/* Custom Ingredient AI Analysis Modal */}
      {showCustomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Live AI Ingredient Analysis</h3>
                  <p className="text-[11px] text-stone-500">Calls POST /api/analyze with real-time parsing</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCustomAnalyzeSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 uppercase block mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="e.g. Daily Repair Cream"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 uppercase block mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="e.g. CleanLab"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-700 uppercase block mb-1">
                  Ingredients List (Paste from label)
                </label>
                <textarea
                  rows={4}
                  value={customIngredients}
                  onChange={(e) => setCustomIngredients(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-stone-300 font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  placeholder="Water, Glycerin, Dimethicone, Fragrance, Parabens, Red 40, Phenoxyethanol..."
                />
                {customError && <p className="text-xs text-rose-600 mt-1">{customError}</p>}
              </div>

              {/* Sample presets for instant testing */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-stone-500 block">
                  Quick Sample Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomName('Radiance Ceramide Serum');
                      setCustomBrand('DermCare');
                      setCustomIngredients('Water, Glycerin, Niacinamide, Ceramide NP, Squalane, Phenoxyethanol, Fragrance, Red 40');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                  >
                    Cosmetics with Fragrance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomName('Peanut Butter Protein Bar');
                      setCustomBrand('NutriPower');
                      setCustomIngredients('Roasted peanuts, whey protein isolate, date paste, palm oil, sea salt, disodium inosinate');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                  >
                    Food with Peanut &amp; Whey
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Analyze with SafeScan AI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Barcode & Live Internet Search Dialog */}
      {showBarcodeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={20} className="text-emerald-800" />
                <h3 className="font-bold text-stone-900 text-lg">Global Product &amp; Barcode Lookup</h3>
              </div>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setBarcodeModalTab('barcode')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  barcodeModalTab === 'barcode' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Lookup by Barcode / UPC
              </button>
              <button
                type="button"
                onClick={() => setBarcodeModalTab('internet-search')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  barcodeModalTab === 'internet-search' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Search Internet by Product Name
              </button>
            </div>

            {/* Tab 1: Barcode Lookup */}
            {barcodeModalTab === 'barcode' && (
              <div className="space-y-3">
                <p className="text-xs text-stone-600">
                  Enter any UPC, EAN, or GTIN barcode. Queries the live international Open Food Facts &amp; Open Beauty Facts database.
                </p>

                <form onSubmit={handleBarcodeSubmit} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. 3017620422003 (Nutella), 079357318924, or 1009559441"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 font-mono"
                      autoFocus
                    />
                    {manualError && (
                      <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{manualError}</p>
                        </div>
                        <div className="pt-1 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBarcodeModalTab('internet-search');
                              setLiveSearchQuery(barcodeInput);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Search size={13} />
                            <span>Search Internet by Product Name</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowBarcodeModal(false);
                              setCustomName(`Product #${barcodeInput}`);
                              setShowCustomModal(true);
                            }}
                            className="py-1.5 px-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-medium text-xs transition-colors cursor-pointer"
                          >
                            Paste Ingredients
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                      Try Real Worldwide Barcodes from Database:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5 text-xs max-h-44 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => setBarcodeInput('1009559441')}
                        className="p-2.5 text-left rounded-xl bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-300 flex items-center justify-between cursor-pointer group shadow-2xs"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-emerald-950 block truncate">Barcode 1009559441 (AI Internet Intelligence)</span>
                          <span className="text-[10px] text-emerald-800">Grounds exact record from online registries</span>
                        </div>
                        <span className="font-mono text-emerald-900 bg-white/80 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded shrink-0">1009559441</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBarcodeInput('3017620422003')}
                        className="p-2 text-left rounded-lg bg-stone-50 hover:bg-emerald-50 border border-stone-200 flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate font-medium text-stone-900">Nutella Hazelnut Spread (Global OFF)</span>
                        <span className="font-mono text-stone-500 text-[11px] shrink-0">3017620422003</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBarcodeInput('3337872412486')}
                        className="p-2 text-left rounded-lg bg-stone-50 hover:bg-emerald-50 border border-stone-200 flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate font-medium text-stone-900">La Roche-Posay Toleriane (Global OBF)</span>
                        <span className="font-mono text-stone-500 text-[11px] shrink-0">3337872412486</span>
                      </button>
                      {availableProducts.slice(0, 3).map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => setBarcodeInput(prod.barcode)}
                          className="p-2 text-left rounded-lg bg-stone-50 hover:bg-emerald-50 border border-stone-200 flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{prod.name}</span>
                          <span className="font-mono text-stone-500 text-[11px] shrink-0 ml-2">{prod.barcode}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setShowBarcodeModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAnalyzing}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
                    >
                      Lookup Live Barcode
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Live Internet & Quick-Commerce Search (Blinkit & Instamart) */}
            {barcodeModalTab === 'internet-search' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-stone-600">
                    Search across <strong className="text-amber-700">Blinkit.com</strong> &amp; <strong className="text-orange-700">Swiggy Instamart</strong> catalogs with live suggestions.
                  </p>
                  <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-stone-100 border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setLiveStoreFilter('all')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                        liveStoreFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveStoreFilter('blinkit')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                        liveStoreFilter === 'blinkit' ? 'bg-amber-400 text-stone-950 shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      ⚡ Blinkit
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveStoreFilter('instamart')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                        liveStoreFilter === 'instamart' ? 'bg-orange-500 text-white shadow-2xs' : 'text-stone-600'
                      }`}
                    >
                      🛒 Instamart
                    </button>
                  </div>
                </div>

                <form onSubmit={handleLiveSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search Blinkit & Instamart (e.g. Amul, Maggi, Cetaphil, Minimalist)..."
                      value={liveSearchQuery}
                      onChange={(e) => setLiveSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLiveSearching}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    {isLiveSearching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                    <span>Search</span>
                  </button>
                </form>

                {/* Live Autocomplete Keyword Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                  <span className="font-semibold text-stone-700 mr-1">Suggestions:</span>
                  {liveKeywordSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setLiveSearchQuery(item);
                        SafeScanAPI.searchLiveProducts(item, liveStoreFilter).then((d) =>
                          setLiveSearchResults(d.results || [])
                        );
                      }}
                      className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200 text-stone-800 cursor-pointer transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {/* Results & Product Suggestions list */}
                <div className="space-y-2 max-h-64 overflow-y-auto pt-1">
                  {liveSearchResults.map((prod) => {
                    const bUrl = prod.blinkitUrl || buildBlinkitSearchUrl(prod.name);
                    const iUrl = prod.instamartUrl || buildInstamartSearchUrl(prod.name);
                    return (
                      <div
                        key={prod.id}
                        className="p-3 rounded-2xl bg-stone-50 border border-stone-200 hover:border-emerald-700 flex items-center justify-between gap-3 text-left transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={
                              isAuthenticProductImageUrl(prod.image)
                                ? prod.image
                                : resolveExactProductImage(prod)
                            }
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = resolveFallbackProductSvg(prod);
                            }}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-contain bg-white p-0.5 shrink-0 border border-stone-200"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-emerald-800 block truncate">
                              {prod.brand}
                            </span>
                            <h4 className="text-xs font-bold text-stone-900 truncate">{prod.name}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <a
                                href={bUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 text-[9px] font-bold"
                              >
                                <span>⚡ Blinkit {prod.blinkitPrice || '₹95'}</span>
                                <ExternalLink size={8} />
                              </a>
                              <a
                                href={iUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-100 text-orange-950 border border-orange-300 text-[9px] font-bold"
                              >
                                <span>🛒 Instamart {prod.instamartPrice || '₹92'}</span>
                                <ExternalLink size={8} />
                              </a>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectLiveResult(prod)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                          Inspect
                        </button>
                      </div>
                    );
                  })}
                  {liveSearchResults.length === 0 && liveSearchQuery && !isLiveSearching && (
                    <div className="p-4 text-center text-xs text-stone-500">
                      No online products found matching “{liveSearchQuery}”. Try a broader brand name.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fruit Varieties & Ripeness Selection Modal */}
      {showFruitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Apple size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">Fruit Ripeness &amp; Texture Scanner</h3>
                  <p className="text-[11px] text-stone-500">Color chromaticity, skin pebbling, firmness &amp; Tata 1mg health monographs</p>
                </div>
              </div>
              <button
                onClick={() => setShowFruitModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Select one of our calibrated produce samples to run instant optical texture &amp; color analysis, or upload a photo of your own fresh fruit to evaluate freshness.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {FRUIT_SAMPLES.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-emerald-600 flex flex-col justify-between space-y-3 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={f.image}
                      alt={f.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover bg-white shrink-0 border border-stone-200"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                        {f.variety}
                      </span>
                      <h4 className="text-xs font-bold text-stone-900 leading-snug">{f.name}</h4>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        f.stage === 'Unripe' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-500 space-y-0.5 pt-1 border-t border-stone-200/50">
                    <p><strong className="text-stone-700">Peel Color:</strong> {f.colorHint}</p>
                    <p><strong className="text-stone-700">Texture:</strong> {f.textureHint}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleScanFruit(f.id)}
                    disabled={isAnalyzing}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Scan This Fruit
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Fruit Photo Upload Option */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-emerald-950 block">Have a real fruit right now?</span>
                <span className="text-emerald-800 text-[11px]">Upload a photo from your camera or photo gallery for AI vision analysis.</span>
              </div>
              <label className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold cursor-pointer shrink-0 text-center">
                <span>Upload Fruit Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFruitImageUpload}
                />
              </label>
            </div>

            {/* 1mg Produce Monograph Note */}
            <div className="p-3 rounded-xl bg-stone-100 text-[11px] text-stone-600 flex items-center justify-between gap-2">
              <span>All nutritional data &amp; health recommendations verified against Tata 1mg produce monographs.</span>
              <a
                href="https://www.1mg.com/"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-rose-700 hover:underline shrink-0"
              >
                1mg.com ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
