import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Flame, 
  Sparkles, 
  Plus, 
  UtensilsCrossed, 
  Clock, 
  QrCode, 
  Check, 
  ShoppingBag,
  Info,
  Star,
  Soup,
  CookingPot,
  Coffee,
  IceCream,
  Beef,
  Fish,
  Salad,
  Pizza,
  Beer,
  Wine,
  Apple,
  Carrot,
  Egg,
  Layers,
  Tag,
  ArrowRight
} from 'lucide-react';
import { MenuCategory, MenuItem, Order, OrderItem, RestaurantConfig } from '../../types';
import { DishCustomizationModal } from './DishCustomizationModal';

interface CustomerMenuProps {
  menuItems: MenuItem[];
  onAddToCart: (orderItem: OrderItem) => void;
  tableNumber: number;
  onSelectTable: (table: number) => void;
  config: RestaurantConfig;
  lang: 'km' | 'en';
  currency: 'USD' | 'KHR';
  activeOrders: Order[];
  onViewOrderStatus: (order: Order) => void;
  onOpenCart: () => void;
  cartCount: number;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  UtensilsCrossed,
  Star,
  Soup,
  Flame,
  Beef,
  CookingPot,
  Coffee,
  IceCream,
  Fish,
  Salad,
  Pizza,
  Beer,
  Wine,
  Apple,
  Carrot,
  Egg,
  Layers,
  Sparkles,
  Tag,
};

export const getCategoryIconComponent = (iconName?: string): React.FC<{ className?: string }> => {
  if (!iconName) return UtensilsCrossed;
  return ICON_MAP[iconName] || UtensilsCrossed;
};

const DEFAULT_CATEGORIES = [
  { key: 'all', label_en: 'All Menu', label_km: 'ទាំងអស់', icon: UtensilsCrossed },
  { key: 'popular', label_en: 'Chef Specials', label_km: 'ពេញនិយម', icon: Star },
  { key: 'soup', label_en: 'Khmer Soups', label_km: 'ស៊ុប & សម្ល', icon: Soup },
  { key: 'stirfry', label_en: 'Wok Stir-fry', label_km: 'ម្ហូបឆា', icon: Flame },
  { key: 'grill', label_en: 'Grill & BBQ', label_km: 'ម្ហូបអាំង', icon: Beef },
  { key: 'rice_noodle', label_en: 'Rice & Noodles', label_km: 'បាយ & មី', icon: CookingPot },
  { key: 'drinks', label_en: 'Drinks & Coffee', label_km: 'ភេសជ្ជៈ & កាហ្វេ', icon: Coffee },
  { key: 'dessert', label_en: 'Desserts', label_km: 'បង្អែមខ្មែរ', icon: IceCream },
];

export const CustomerMenu: React.FC<CustomerMenuProps> = ({
  menuItems,
  onAddToCart,
  tableNumber,
  onSelectTable,
  config,
  lang,
  currency,
  activeOrders,
  onViewOrderStatus,
  onOpenCart,
  cartCount,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // Dynamic Categories from Restaurant Config
  const categoryList = useMemo(() => {
    const list: Array<{ key: string; label_en: string; label_km: string; icon: React.FC<{ className?: string }> }> = [
      { key: 'all', label_en: 'All Menu', label_km: 'ទាំងអស់', icon: UtensilsCrossed },
    ];

    if (config.categories && config.categories.length > 0) {
      config.categories.forEach(cat => {
        list.push({
          key: cat.id,
          label_en: cat.name_en,
          label_km: cat.name_km,
          icon: getCategoryIconComponent(cat.icon),
        });
      });
    } else {
      DEFAULT_CATEGORIES.slice(1).forEach(cat => {
        list.push(cat);
      });
    }
    return list;
  }, [config.categories]);

  // Find most recent active order for this specific table
  const tableOrder = useMemo(() => {
    return activeOrders.find(
      (o) => o.tableNumber === tableNumber && o.status !== 'completed' && o.status !== 'cancelled'
    );
  }, [activeOrders, tableNumber]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'popular') {
          if (!item.popular) return false;
        } else if (item.category !== selectedCategory) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKm = item.name_km.toLowerCase().includes(q) || item.description_km.toLowerCase().includes(q);
        const matchEn = item.name_en.toLowerCase().includes(q) || item.description_en.toLowerCase().includes(q);
        return matchKm || matchEn;
      }

      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const formatPrice = (usd: number) => {
    if (currency === 'KHR') {
      return `${Math.round(usd * config.exchangeRate).toLocaleString()} ៛`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.spicyLevelOptions || item.sweetnessOptions) {
      setCustomizingItem(item);
    } else {
      const orderItem: OrderItem = {
        itemId: item.id,
        name_km: item.name_km,
        name_en: item.name_en,
        price: item.price,
        quantity: 1,
        itemTotal: item.price,
      };
      onAddToCart(orderItem);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 space-y-4 pb-28">
      {/* Restaurant Header Info Bar */}
      {(config.logoUrl || config.openTime || config.phone || config.plan) && (
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt="Logo"
                className="w-12 h-12 rounded-xl object-cover border border-stone-200 shadow-2xs shrink-0 bg-stone-50"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-2xs shrink-0">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
            )}
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-stone-900 font-kulen tracking-wide">
                {lang === 'km' ? (config.name_km || 'ភោជនីយដ្ឋាន ស្មាតម៉ឺនុយ') : (config.name_en || 'SmartMenu Restaurant')}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-stone-500 font-battambang">
                {config.openTime && config.closeTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{config.openTime} - {config.closeTime}</span>
                  </span>
                )}
                {config.phone && (
                  <span>• Tel: {config.phone}</span>
                )}
                {config.wifiName && (
                  <span className="hidden md:inline">• Wi-Fi: {config.wifiName}</span>
                )}
              </div>
            </div>
          </div>

          {/* Active Plan Order Capability Badge */}
          {config.plan === 'free' ? (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold font-kulen flex items-center gap-1.5 shrink-0 self-start sm:self-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'km' ? 'ម៉ឺនុយរូបភាពឌីជីថល (Static Menu)' : 'Digital Menu Showcase'}</span>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-3.5 py-1.5 rounded-xl text-xs font-bold font-kulen flex items-center gap-2 shrink-0 self-start sm:self-center shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>
                {lang === 'km' 
                  ? `តុលេខ #${tableNumber} • ស្កេនកម្មង់ផ្ទាល់ទៅចុងភៅ` 
                  : `Table #${tableNumber} • Self-Order to Chef Live`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Top Toolbar: Table Selector with Icon & Clean Live Order Tracking */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Table Selector with Icon */}
        <div className="flex items-center gap-2 bg-white border border-stone-200 shadow-2xs px-3 py-1.5 rounded-xl self-start">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-600 font-kulen">
              {lang === 'km' ? 'តុ:' : 'Table:'}
            </span>
            <select
              value={tableNumber}
              onChange={(e) => onSelectTable(Number(e.target.value))}
              className="bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs px-2.5 py-1 rounded-lg border border-stone-300 focus:outline-hidden cursor-pointer font-kulen"
            >
              {Array.from({ length: config.tablesCount || 20 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {lang === 'km' ? `តុ ${num}` : `Table ${num}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Order Live Tracker - Clean Responsive Layout without Dot */}
        {tableOrder && (
          <div 
            onClick={() => onViewOrderStatus(tableOrder)}
            className="flex-1 md:max-w-xl bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2.5 cursor-pointer transition shadow-2xs"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-bold text-emerald-950 font-kulen tracking-wide">
                  {lang === 'km' ? 'កំពុងដំណើរការការកម្មង់ #' : 'Active Order #'}
                  {tableOrder.orderNumber}
                </span>
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-emerald-200/90 text-emerald-900 font-bold whitespace-nowrap font-kulen">
                  {tableOrder.status === 'new' && (lang === 'km' ? 'បានទទួល' : 'Received')}
                  {tableOrder.status === 'preparing' && (lang === 'km' ? 'កំពុងចម្អិន' : 'Cooking')}
                  {tableOrder.status === 'ready' && (lang === 'km' ? 'រួចរាល់' : 'Ready')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-800 font-battambang mt-0.5 leading-snug">
                {tableOrder.status === 'new' && (lang === 'km' ? 'ចុងភៅបានទទួលការកម្មង់' : 'Kitchen received order')}
                {tableOrder.status === 'preparing' && (lang === 'km' ? 'កំពុងចម្អិនលើខ្ទះក្តៅៗ' : 'Cooking in kitchen')}
                {tableOrder.status === 'ready' && (lang === 'km' ? 'រួចរាល់ហើយ កំពុងលើកជូន' : 'Ready to serve')}
              </p>
            </div>
            
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg shrink-0 shadow-2xs font-kulen whitespace-nowrap">
              <span>{lang === 'km' ? 'ពិនិត្យស្ថានភាព' : 'Track Order'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* Search & Category Filter Navigation */}
      <div className="space-y-3 sticky top-16 z-30 bg-stone-50/95 backdrop-blur py-2">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'km' ? 'ស្វែងរកមុខម្ហូប (ស៊ុប, ឡុកឡាក់, អាម៉ុក, ភេសជ្ជៈ...)' : 'Search dishes, soups, stir-fry, drinks...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
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

        {/* Category Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categoryList.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
                  isSelected
                    ? 'bg-amber-600 text-white ring-2 ring-amber-600/30'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span className="font-kulen tracking-wider">{lang === 'km' ? cat.label_km : cat.label_en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setCustomizingItem(item)}
            className="group bg-white rounded-xl sm:rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
          >
            {/* Image Frame */}
            <div className="relative h-28 sm:h-44 bg-stone-100 overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.name_en}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              
              {/* Badges */}
              <div className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 flex flex-col gap-1">
                {item.popular && (
                  <span className="bg-amber-500 text-stone-950 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-stone-950" />
                    <span>POPULAR</span>
                  </span>
                )}
                {item.prepTimeMinutes && (
                  <span className="bg-stone-900/80 backdrop-blur text-white text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>~{item.prepTimeMinutes}m</span>
                  </span>
                )}
              </div>

              {/* Spicy Indicator */}
              {item.spicyLevelOptions && (
                <div className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 bg-red-500/90 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden xs:inline sm:inline">Spicy</span>
                </div>
              )}
            </div>

            {/* Card Details */}
            <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-1 sm:space-y-2">
              <div>
                <h3 className="font-bold text-xs sm:text-base text-stone-900 group-hover:text-amber-700 transition font-kulen tracking-wide line-clamp-1">
                  {item.name_km}
                </h3>
                <h4 className="text-[10px] sm:text-xs font-semibold text-stone-600 line-clamp-1 font-battambang">
                  {item.name_en}
                </h4>
                <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 sm:mt-1 line-clamp-2 leading-relaxed font-battambang hidden sm:block">
                  {lang === 'km' ? item.description_km : item.description_en}
                </p>
              </div>

              {/* Price & Add to Cart button */}
              <div className="pt-1.5 sm:pt-2 flex items-center justify-between border-t border-stone-100">
                <div>
                  <span className="text-xs sm:text-base font-extrabold text-amber-700 block leading-tight font-mono">
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-stone-400 font-medium">
                    {currency === 'USD' 
                      ? `${Math.round(item.price * config.exchangeRate).toLocaleString()} ៛` 
                      : `$${item.price.toFixed(2)}`}
                  </span>
                </div>

                <button
                  id={`add-item-${item.id}-btn`}
                  onClick={(e) => handleQuickAdd(item, e)}
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-600 flex items-center justify-center transition shadow-2xs active:scale-95 shrink-0"
                  title="Add to order"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Cart Bar (Visible on mobile/tablet when items in cart) */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom-5">
          <button
            id="floating-cart-bar-btn"
            onClick={onOpenCart}
            className="w-full bg-stone-900 hover:bg-black text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-stone-700 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs">
                {cartCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold font-kulen tracking-wide">
                  {lang === 'km' ? 'ពិនិត្យកន្ត្រក & កម្មង់' : 'View Cart & Order'}
                </p>
                <p className="text-[10px] text-stone-400">
                  {lang === 'km' ? `តុលេខ ${tableNumber}` : `Table #${tableNumber}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-stone-800 px-3 py-1.5 rounded-xl font-kulen">
              <span>{lang === 'km' ? 'បញ្ជូន' : 'Proceed'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Dish Customization Modal */}
      {customizingItem && (
        <DishCustomizationModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={onAddToCart}
          lang={lang}
          currency={currency}
          exchangeRate={config.exchangeRate}
        />
      )}
    </div>
  );
};
