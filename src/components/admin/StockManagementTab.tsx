import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Minus, 
  Check, 
  AlertTriangle, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  Save, 
  CheckCircle2, 
  RefreshCw,
  SlidersHorizontal,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { MenuItem, CategoryItem, RestaurantConfig } from '../../types';

interface StockManagementTabProps {
  menuItems: MenuItem[];
  categories: CategoryItem[];
  config: RestaurantConfig;
  onSaveMenuItem: (item: MenuItem) => Promise<void>;
  lang: 'km' | 'en';
  currency: 'USD' | 'KHR';
}

export const StockManagementTab: React.FC<StockManagementTabProps> = ({
  menuItems,
  categories,
  config,
  onSaveMenuItem,
  lang,
  currency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
  
  // Local working copy of items for batch edits
  const [itemsStockMap, setItemsStockMap] = useState<Record<string, { stockQuantity: number; costPrice: number; available: boolean }>>(() => {
    const map: Record<string, { stockQuantity: number; costPrice: number; available: boolean }> = {};
    menuItems.forEach((item) => {
      map[item.id] = {
        stockQuantity: item.stockQuantity !== undefined ? item.stockQuantity : 50,
        costPrice: item.costPrice !== undefined ? item.costPrice : Math.round((item.price * 0.45) * 100) / 100,
        available: item.available !== false,
      };
    });
    return map;
  });

  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync when menuItems change
  React.useEffect(() => {
    setItemsStockMap((prev) => {
      const next = { ...prev };
      menuItems.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = {
            stockQuantity: item.stockQuantity !== undefined ? item.stockQuantity : 50,
            costPrice: item.costPrice !== undefined ? item.costPrice : Math.round((item.price * 0.45) * 100) / 100,
            available: item.available !== false,
          };
        }
      });
      return next;
    });
  }, [menuItems]);

  const handleStockChange = (itemId: string, delta: number) => {
    setItemsStockMap((prev) => {
      const current = prev[itemId] || { stockQuantity: 0, costPrice: 0, available: true };
      const nextQty = Math.max(0, current.stockQuantity + delta);
      return {
        ...prev,
        [itemId]: {
          ...current,
          stockQuantity: nextQty,
          available: nextQty > 0 ? current.available : false,
        },
      };
    });
  };

  const handleDirectStockInput = (itemId: string, val: string) => {
    const num = parseInt(val, 10);
    const qty = isNaN(num) ? 0 : Math.max(0, num);
    setItemsStockMap((prev) => {
      const current = prev[itemId] || { stockQuantity: 0, costPrice: 0, available: true };
      return {
        ...prev,
        [itemId]: {
          ...current,
          stockQuantity: qty,
          available: qty > 0 ? current.available : false,
        },
      };
    });
  };

  const handleCostPriceInput = (itemId: string, val: string) => {
    const num = parseFloat(val);
    const cost = isNaN(num) ? 0 : Math.max(0, num);
    setItemsStockMap((prev) => {
      const current = prev[itemId] || { stockQuantity: 0, costPrice: 0, available: true };
      return {
        ...prev,
        [itemId]: {
          ...current,
          costPrice: cost,
        },
      };
    });
  };

  const handleToggleAvailable = (itemId: string) => {
    setItemsStockMap((prev) => {
      const current = prev[itemId] || { stockQuantity: 0, costPrice: 0, available: true };
      return {
        ...prev,
        [itemId]: {
          ...current,
          available: !current.available,
        },
      };
    });
  };

  const handleSaveSingleItem = async (item: MenuItem) => {
    setSavingId(item.id);
    const current = itemsStockMap[item.id] || { stockQuantity: 50, costPrice: 0, available: true };
    try {
      await onSaveMenuItem({
        ...item,
        stockQuantity: current.stockQuantity,
        costPrice: current.costPrice,
        available: current.available,
      });
      setFeedback(lang === 'km' ? `បានរក្សាទុកស្តុក "${item.name_km}" រួចរាល់!` : `Saved stock for "${item.name_en}"!`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      setFeedback(e?.message || 'Error saving stock');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAllItems = async () => {
    setSavingId('ALL');
    try {
      for (const item of menuItems) {
        const current = itemsStockMap[item.id];
        if (current) {
          await onSaveMenuItem({
            ...item,
            stockQuantity: current.stockQuantity,
            costPrice: current.costPrice,
            available: current.available,
          });
        }
      }
      setFeedback(lang === 'km' ? 'បានរក្សាទុកទិន្នន័យស្តុកទាំងអស់ដោយជោគជ័យ!' : 'All stock updates saved successfully!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback(e?.message || 'Error saving stock');
    } finally {
      setSavingId(null);
    }
  };

  // Metrics
  const stockStats = useMemo(() => {
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockItems = 0;

    menuItems.forEach((it) => {
      const s = itemsStockMap[it.id]?.stockQuantity ?? 50;
      const isAvail = itemsStockMap[it.id]?.available ?? true;
      totalStockItems += s;
      if (s === 0 || !isAvail) {
        outOfStockCount++;
      } else if (s <= 10) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    return { inStockCount, lowStockCount, outOfStockCount, totalStockItems };
  }, [menuItems, itemsStockMap]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const current = itemsStockMap[item.id] || { stockQuantity: 50, costPrice: 0, available: true };
      
      // Stock Status Filter
      if (stockStatusFilter === 'in' && (current.stockQuantity <= 10 || !current.available)) return false;
      if (stockStatusFilter === 'low' && (current.stockQuantity === 0 || current.stockQuantity > 10 || !current.available)) return false;
      if (stockStatusFilter === 'out' && current.stockQuantity > 0 && current.available) return false;

      // Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mKm = item.name_km.toLowerCase().includes(q);
        const mEn = item.name_en.toLowerCase().includes(q);
        return mKm || mEn;
      }

      return true;
    });
  }, [menuItems, itemsStockMap, selectedCategory, stockStatusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg font-kulen tracking-wide text-stone-900">
              {lang === 'km' ? 'គ្រប់គ្រងស្តុកទំនិញ & ថ្លៃដើម (Stock & Inventory)' : 'Stock & Inventory Management'}
            </h2>
            <p className="text-xs text-stone-500 font-battambang">
              {lang === 'km'
                ? 'តាមដានចំនួននៅសល់ បិទបើកមុខម្ហូប និងគណនាប្រាក់ចំណេញសុទ្ធលើមុខម្ហូបនីមួយៗ'
                : 'Track in-stock quantities, set low-stock thresholds, and calculate gross profit margins.'}
            </p>
          </div>
        </div>

        <button
          id="save-all-stocks-btn"
          onClick={handleSaveAllItems}
          disabled={savingId === 'ALL'}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition shadow-md active:scale-95 flex items-center justify-center gap-2 font-khmer cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{savingId === 'ALL' ? (lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (lang === 'km' ? 'រក្សាទុកស្តុកទាំងអស់' : 'Save All Changes')}</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-xs font-semibold text-stone-500 flex items-center justify-between">
            <span>{lang === 'km' ? 'មុខម្ហូបសរុប' : 'Total Items'}</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-1">{menuItems.length}</p>
          <span className="text-[11px] text-stone-400 font-medium">
            {stockStats.totalStockItems} {lang === 'km' ? 'ចាន/កែវ ក្នុងស្តុក' : 'portions total'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-700 flex items-center justify-between">
            <span>{lang === 'km' ? 'មានក្នុងស្តុក' : 'In Stock'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stockStats.inStockCount}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">{lang === 'km' ? 'ដំណើរការធម្មតា' : 'Available'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs">
          <div className="text-xs font-semibold text-amber-700 flex items-center justify-between">
            <span>{lang === 'km' ? 'ជិតអស់ស្តុក (≤ 10)' : 'Low Stock (≤10)'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{stockStats.lowStockCount}</p>
          <span className="text-[11px] text-amber-600 font-semibold">{lang === 'km' ? 'គួរទិញបន្ថែម' : 'Needs Restock'}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-2xs">
          <div className="text-xs font-semibold text-red-700 flex items-center justify-between">
            <span>{lang === 'km' ? 'អស់ពីស្តុក' : 'Out of Stock'}</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-700 mt-1">{stockStats.outOfStockCount}</p>
          <span className="text-[11px] text-red-600 font-semibold">{lang === 'km' ? 'ភ្ញៀវមិនអាចកម្មង់' : 'Unavailable'}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'km' ? 'ស្វែងរកតាមឈ្មោះម្ហូប...' : 'Search items to manage stock...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStockStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap font-kulen ${
              stockStatusFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {lang === 'km' ? 'ទាំងអស់' : 'All'}
          </button>
          <button
            onClick={() => setStockStatusFilter('in')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap font-kulen ${
              stockStatusFilter === 'in'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            {lang === 'km' ? 'មានស្តុក' : 'In Stock'}
          </button>
          <button
            onClick={() => setStockStatusFilter('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap font-kulen ${
              stockStatusFilter === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            {lang === 'km' ? 'ជិតអស់ (Low)' : 'Low Stock'}
          </button>
          <button
            onClick={() => setStockStatusFilter('out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap font-kulen ${
              stockStatusFilter === 'out'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            {lang === 'km' ? 'អស់ស្តុក' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* Items Stock List Table / Grid */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="divide-y divide-stone-100">
          {filteredItems.map((item) => {
            const stockData = itemsStockMap[item.id] || { stockQuantity: 50, costPrice: 0, available: true };
            const isSaving = savingId === item.id;
            const profitUsd = Math.max(0, item.price - stockData.costPrice);
            const profitMarginPct = item.price > 0 ? Math.round((profitUsd / item.price) * 100) : 0;
            const isOutOfStock = stockData.stockQuantity === 0 || !stockData.available;
            const isLowStock = stockData.stockQuantity > 0 && stockData.stockQuantity <= 10 && stockData.available;

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition hover:bg-stone-50/70 ${
                  isOutOfStock ? 'bg-red-50/20' : isLowStock ? 'bg-amber-50/20' : ''
                }`}
              >
                {/* Left: Thumbnail & Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                    <img
                      src={item.imageUrl}
                      alt={item.name_en}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isOutOfStock ? (
                      <div className="absolute inset-0 bg-red-950/70 backdrop-blur-2xs flex items-center justify-center text-white text-[9px] font-black uppercase text-center p-0.5">
                        Sold Out
                      </div>
                    ) : isLowStock ? (
                      <div className="absolute bottom-0 inset-x-0 bg-amber-500 text-stone-950 text-[8px] font-black uppercase text-center">
                        Low
                      </div>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm sm:text-base text-stone-900 font-kulen truncate">
                        {item.name_km}
                      </h4>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-mono uppercase">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 font-battambang truncate">
                      {item.name_en}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-0.5">
                      <span className="font-bold text-amber-700 font-mono">
                        {lang === 'km' ? 'តម្លៃលក់' : 'Sale'}: ${item.price.toFixed(2)}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">
                        {lang === 'km' ? 'ចំណេញ' : 'Profit'}: +${profitUsd.toFixed(2)} ({profitMarginPct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Stock Counter & Restock Buttons */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Stock Quantity Controller */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block font-kulen">
                      {lang === 'km' ? 'ចំនួនក្នុងស្តុក' : 'Stock Portions'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStockChange(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs active:scale-95 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={stockData.stockQuantity}
                        onChange={(e) => handleDirectStockInput(item.id, e.target.value)}
                        className={`w-16 text-center font-mono font-black text-sm py-1 rounded-lg border focus:outline-hidden ${
                          isOutOfStock
                            ? 'bg-red-50 border-red-300 text-red-700'
                            : isLowStock
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-stone-300 text-stone-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleStockChange(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs active:scale-95 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Add Pills */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block font-kulen">
                      {lang === 'km' ? 'បន្ថែមរហ័ស' : 'Quick Add'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[5, 10, 50].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => handleStockChange(item.id, qty)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-extrabold font-mono transition active:scale-95"
                        >
                          +{qty}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cost Price ($) */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block font-kulen">
                      {lang === 'km' ? 'ថ្លៃដើម (Cost $)' : 'Cost Price ($)'}
                    </span>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={stockData.costPrice}
                        onChange={(e) => handleCostPriceInput(item.id, e.target.value)}
                        className="w-20 pl-5 pr-2 py-1 text-xs font-mono font-bold bg-white border border-stone-300 rounded-lg focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* In-Stock Toggle Switch */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block font-kulen">
                      {lang === 'km' ? 'ស្ថានភាព' : 'Status'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleAvailable(item.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition font-khmer flex items-center gap-1.5 cursor-pointer ${
                        stockData.available && stockData.stockQuantity > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {stockData.available && stockData.stockQuantity > 0 ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{lang === 'km' ? 'បើកលក់' : 'In Stock'}</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          <span>{lang === 'km' ? 'បិទលក់' : 'Sold Out'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Single Save Button */}
                  <div className="space-y-1 self-end">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveSingleItem(item)}
                      className="bg-stone-900 hover:bg-black text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 font-khmer cursor-pointer"
                      title="Save this item"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSaving ? '...' : (lang === 'km' ? 'រក្សាទុក' : 'Save')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
