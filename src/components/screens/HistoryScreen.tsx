import React, { useState } from 'react';
import { ScanHistoryRecord, Product, ProductType } from '../../types/scanner';
import { Search, Trash2, RotateCcw, ChevronRight, Filter, Calendar, Camera, Barcode, Upload, Sparkles, Inbox, Apple } from 'lucide-react';
import { AssessmentBadge } from '../common/AssessmentBadge';

interface Props {
  historyRecords: ScanHistoryRecord[];
  allProducts: Product[];
  onOpenProduct: (product: Product) => void;
  onClearHistory: () => void;
  onRestoreHistory: () => void;
  onDeleteRecord?: (recordId: string) => void;
  onNavigateToScan: () => void;
}

export const HistoryScreen: React.FC<Props> = ({
  historyRecords,
  allProducts,
  onOpenProduct,
  onClearHistory,
  onRestoreHistory,
  onDeleteRecord,
  onNavigateToScan,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | ProductType>('all');
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);

  // Map history records to actual product objects
  const enrichedHistory = historyRecords
    .map((record) => {
      const product = allProducts.find((p) => p.id === record.productId);
      return product ? { record, product } : null;
    })
    .filter((item): item is { record: ScanHistoryRecord; product: Product } => !!item);

  // Filter by category and search term
  const filteredHistory = enrichedHistory.filter(({ product }) => {
    const matchesType = filterType === 'all' || product.type === filterType;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery);

    return matchesType && matchesSearch;
  });

  const getMethodIcon = (method: ScanHistoryRecord['method']) => {
    switch (method) {
      case 'camera':
        return <Camera size={13} className="text-emerald-700" />;
      case 'barcode':
        return <Barcode size={13} className="text-stone-700" />;
      case 'upload':
        return <Upload size={13} className="text-teal-700" />;
      case 'demo':
        return <Sparkles size={13} className="text-amber-700" />;
      case 'search':
        return <Search size={13} className="text-blue-700" />;
      case 'fruit':
        return <Apple size={13} className="text-emerald-700" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header and Clear Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Scan History
          </h1>
          <p className="text-xs text-stone-500">
            Review past scans, safety assessments, and inspected ingredients
          </p>
        </div>

        {historyRecords.length > 0 ? (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        ) : (
          <button
            onClick={onRestoreHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw size={14} />
            <span>Restore Demo Records</span>
          </button>
        )}
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by product name, brand, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center p-1 bg-stone-200/70 rounded-xl shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({enrichedHistory.length})
          </button>
          <button
            onClick={() => setFilterType('food')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterType === 'food'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Food
          </button>
          <button
            onClick={() => setFilterType('cosmetics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              filterType === 'cosmetics'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Cosmetics
          </button>
          <button
            onClick={() => setFilterType('fruit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'fruit'
                ? 'bg-white text-emerald-950 shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Apple size={12} className="text-emerald-700" />
            <span>Fruit</span>
          </button>
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map(({ record, product }) => (
            <div
              key={record.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenProduct(product)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenProduct(product);
                }
              }}
              className="w-full text-left p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-600/40 hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200/60"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                      {product.brand}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-[10px] text-stone-500">{product.category}</span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 group-hover:text-emerald-900 transition-colors truncate">
                    {product.name}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                    <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded text-[10px] font-medium">
                      {getMethodIcon(record.method)}
                      <span>
                        {record.method === 'search'
                          ? 'Internet Search'
                          : record.method === 'fruit'
                          ? 'Fruit Ripeness Scan'
                          : `${record.method} scan`}
                      </span>
                    </span>
                    {product.barcode && (
                      <span className="font-mono text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                        #{product.barcode}
                      </span>
                    )}
                    <span>{record.scannedAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <AssessmentBadge assessment={product.assessment} size="sm" />
                {onDeleteRecord && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecord(record.id);
                    }}
                    title="Remove from history"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <ChevronRight
                  size={16}
                  className="text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-stone-300 space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Inbox size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">No scan records found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No products match your search query "${searchQuery}".`
                : 'You have cleared your scan history or haven\'t scanned any products yet.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onRestoreHistory}
              className="px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            >
              Restore Demo Scans
            </button>
            <button
              onClick={onNavigateToScan}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
            >
              Scan New Product
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Clearing History */}
      {showConfirmClear && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="font-bold text-stone-900 text-base">Clear All Scan History?</h3>
              <p className="text-xs text-stone-600 mt-1">
                This will remove all {historyRecords.length} recorded product scans from your local prototype session. You can restore demo records anytime.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowConfirmClear(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
