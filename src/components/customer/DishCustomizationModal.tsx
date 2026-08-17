import React, { useState, useEffect } from 'react';
import { X, Flame, Sparkles, Plus, Minus, Check } from 'lucide-react';
import { MenuItem, OrderItem } from '../../types';

interface DishCustomizationModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (orderItem: OrderItem) => void;
  lang: 'km' | 'en';
  currency: 'USD' | 'KHR';
  exchangeRate: number;
}

interface SpicyOption {
  value: string;
  label_en: string;
  label_km: string;
  level: number; // 0 to 3 flames
}

const SPICY_OPTIONS: SpicyOption[] = [
  { value: 'មិនហឹរ (No Spicy)', label_en: 'No Spicy', label_km: 'មិនហឹរ', level: 0 },
  { value: 'ហឹរតិច (Mild)', label_en: 'Mild Spicy', label_km: 'ហឹរតិច', level: 1 },
  { value: 'ហឹរមធ្យម (Medium)', label_en: 'Medium Spicy', label_km: 'ហឹរមធ្យម', level: 2 },
  { value: 'ហឹរខ្លាំង (Extra Hot)', label_en: 'Extra Hot', label_km: 'ហឹរខ្លាំង', level: 3 },
];

const SWEETNESS_OPTIONS = [
  { value: 'ផ្អែមតិច (25%)', label_en: 'Low Sweet (25%)', label_km: 'ផ្អែមតិច (២៥%)' },
  { value: 'ផ្អែមល្មម (50%)', label_en: 'Normal (50%)', label_km: 'ផ្អែមល្មម (៥០%)' },
  { value: 'ផ្អែមដើម (100%)', label_en: 'Original (100%)', label_km: 'ផ្អែមដើម (១០០%)' },
  { value: 'គ្មានស្ករ (0%)', label_en: 'No Sugar (0%)', label_km: 'គ្មានស្ករ (០%)' },
];

export const DishCustomizationModal: React.FC<DishCustomizationModalProps> = ({
  item,
  onClose,
  onAddToCart,
  lang,
  currency,
  exchangeRate,
}) => {
  useEffect(() => {
    if (item) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [item]);

  if (!item) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedSpicy, setSelectedSpicy] = useState<string>(
    item.spicyLevelOptions ? 'ហឹរមធ្យម (Medium)' : ''
  );
  const [selectedSweetness, setSelectedSweetness] = useState<string>(
    item.sweetnessOptions ? 'ផ្អែមល្មម (50%)' : ''
  );
  const [notes, setNotes] = useState('');

  const formatPrice = (usd: number) => {
    if (currency === 'KHR') {
      return `${Math.round(usd * exchangeRate).toLocaleString()} ៛`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const itemTotal = item.price * quantity;

  const handleAdd = () => {
    const orderItem: OrderItem = {
      itemId: item.id,
      name_km: item.name_km,
      name_en: item.name_en,
      price: item.price,
      quantity,
      selectedSpicy: item.spicyLevelOptions ? selectedSpicy : undefined,
      selectedSweetness: item.sweetnessOptions ? selectedSweetness : undefined,
      notes: notes.trim() || undefined,
      itemTotal,
    };
    onAddToCart(orderItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Photo */}
        <div className="relative h-48 sm:h-56 bg-stone-100">
          <img
            src={item.imageUrl}
            alt={item.name_en}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
          {item.prepTimeMinutes && (
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold text-stone-800 shadow-xs">
              ⚡ ~{item.prepTimeMinutes} mins
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-kulen tracking-wide">
              {item.name_km}
            </h2>
            <p className="text-sm font-semibold text-stone-600 font-battambang">
              {item.name_en}
            </p>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed font-battambang">
              {lang === 'km' ? item.description_km : item.description_en}
            </p>
            <div className="mt-2 text-lg font-bold text-amber-700 font-mono">
              {formatPrice(item.price)}
            </div>
          </div>

          {/* Spicy Level Selector */}
          {item.spicyLevelOptions && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 font-kulen">
                <Flame className="w-4 h-4 text-red-500" />
                <span>{lang === 'km' ? 'កម្រិតហឹរ / Spicy Level' : 'Spicy Level'}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SPICY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedSpicy(opt.value)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                      selectedSpicy === opt.value
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="flex items-center text-red-500">
                        {opt.level === 0 ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        ) : (
                          Array.from({ length: opt.level }).map((_, i) => (
                            <Flame key={i} className="w-3 h-3 fill-red-500 text-red-500" />
                          ))
                        )}
                      </span>
                      <span className="font-kulen">{lang === 'km' ? opt.label_km : opt.label_en}</span>
                    </span>
                    {selectedSpicy === opt.value && <Check className="w-3.5 h-3.5 text-amber-700" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sweetness Selector */}
          {item.sweetnessOptions && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 font-kulen">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>{lang === 'km' ? 'កម្រិតជាតិផ្អែម / Sweetness Level' : 'Sweetness Level'}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SWEETNESS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedSweetness(opt.value)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                      selectedSweetness === opt.value
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                    }`}
                  >
                    <span className="font-kulen">{lang === 'km' ? opt.label_km : opt.label_en}</span>
                    {selectedSweetness === opt.value && <Check className="w-3.5 h-3.5 text-amber-700" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Chef Note */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 font-kulen">
              {lang === 'km' ? 'ចំណាំពិសេសជូនចុងភៅ / Special Chef Note' : 'Special Note for Kitchen'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'km' ? 'ឧ. មិនដាក់ខ្ទឹមបារាំង, សុំទឹកក្រូចឆ្មាបន្ថែម...' : 'e.g. No onions, less oil, extra lime...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-battambang"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-2 py-1 shadow-2xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-600"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-bold text-stone-900 text-sm">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Order Button */}
          <button
            id="modal-add-to-cart-btn"
            onClick={handleAdd}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-between text-sm transition active:scale-98 font-kulen tracking-wide"
          >
            <span>{lang === 'km' ? 'ដាក់ចូលកន្ត្រក' : 'Add to Order'}</span>
            <span className="font-mono">{formatPrice(itemTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
