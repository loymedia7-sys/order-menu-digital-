import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, QrCode, DollarSign, FileText, Send } from 'lucide-react';
import { Order, OrderItem, RestaurantConfig } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onSubmitOrder: (orderData: Partial<Order>) => Promise<void>;
  tableNumber: number;
  config: RestaurantConfig;
  lang: 'km' | 'en';
  currency: 'USD' | 'KHR';
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitOrder,
  tableNumber,
  config,
  lang,
  currency,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'aba_khqr'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalUsd = cartItems.reduce((sum, it) => sum + it.itemTotal, 0);
  const totalKhr = Math.round(totalUsd * config.exchangeRate);

  const formatPrice = (usd: number) => {
    if (currency === 'KHR') {
      return `${Math.round(usd * config.exchangeRate).toLocaleString()} ៛`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitOrder({
        tableNumber,
        items: cartItems,
        total: totalUsd,
        total_khr: totalKhr,
        customerName: customerName.trim() || `Table #${tableNumber} Guest`,
        customerNote: customerNote.trim() || undefined,
        paymentMethod,
      });
      onClearCart();
      onClose();
    } catch (err) {
      console.error('Submit order error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base font-kulen tracking-wide">
                  {lang === 'km' ? 'កន្ត្រកកម្មង់' : 'Your Order Cart'}
                </h3>
                <p className="text-xs text-amber-400 font-semibold font-kulen">
                  {lang === 'km' ? `តុលេខ ${tableNumber}` : `Table #${tableNumber}`} • {cartItems.length} {lang === 'km' ? 'មុខម្ហូប' : 'items'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-stone-800 text-stone-300 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-100">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 p-6 space-y-3">
                <ShoppingBag className="w-12 h-12 text-stone-300 stroke-[1.5]" />
                <p className="font-bold text-stone-700 font-kulen">
                  {lang === 'km' ? 'កន្ត្រករបស់អ្នកនៅទទេ' : 'Your cart is empty'}
                </p>
                <p className="text-xs text-stone-400 max-w-xs font-battambang">
                  {lang === 'km' ? 'សូមជ្រើសរើសមុខម្ហូបពីម៉ឺនុយដើម្បីកម្មង់' : 'Select delicious dishes from the menu to start your order'}
                </p>
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div key={`${item.itemId}-${idx}`} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-stone-900 font-kulen tracking-wide">
                      {item.name_km}
                    </h4>
                    <p className="text-xs text-stone-500 font-medium font-battambang">
                      {item.name_en}
                    </p>
                    
                    {/* Custom tags */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selectedSpicy && (
                        <span className="text-[10px] font-semibold bg-red-50 text-red-700 px-1.5 py-0.5 rounded-sm border border-red-200">
                          {item.selectedSpicy}
                        </span>
                      )}
                      {item.selectedSweetness && (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-sm border border-blue-200">
                          {item.selectedSweetness}
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5 text-stone-500" />
                          <span>{item.notes}</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs font-bold text-amber-700">
                      {formatPrice(item.itemTotal)}
                    </div>
                  </div>

                  {/* Quantity and Remove */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-200 rounded-l-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-200 rounded-r-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(idx)}
                      className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form details & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3.5">
              {/* Optional Guest Name & Table Note */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={lang === 'km' ? 'ឈ្មោះភ្ញៀវ (បើមាន)' : 'Your name / nickname (optional)'}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-battambang"
                />
                <input
                  type="text"
                  placeholder={lang === 'km' ? 'ចំណាំទូទៅសម្រាប់ចុងភៅ...' : 'Overall note for the kitchen...'}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-battambang"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  {lang === 'km' ? 'វិធីទូទាត់ប្រាក់ / Payment Method' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition ${
                      paymentMethod === 'cash'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'km' ? 'ទូទាត់សាច់ប្រាក់' : 'Cash at Table'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('aba_khqr')}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition ${
                      paymentMethod === 'aba_khqr'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                        : 'border-stone-200 bg-white text-stone-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-red-600" />
                    <span>{lang === 'km' ? 'ABA KHQR ស្កេន' : 'KHQR Pay'}</span>
                  </button>
                </div>
              </div>

              {/* Price summary */}
              <div className="pt-2 border-t border-stone-200 space-y-1 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>{lang === 'km' ? 'សរុប (USD)' : 'Total (USD)'}</span>
                  <span className="font-bold text-stone-900">${totalUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>{lang === 'km' ? 'សរុបប្រាក់រៀល (KHR)' : 'Total (KHR)'}</span>
                  <span className="font-bold text-emerald-700">{totalKhr.toLocaleString()} ៛</span>
                </div>
              </div>

              {/* Free Plan Static Menu Notice */}
              {config.plan === 'free' ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs text-amber-950 font-battambang">
                  <span className="font-bold font-kulen block text-amber-900">
                    {lang === 'km' ? '📢 គម្រោងឥតគិតថ្លៃ (Free Plan): សម្រាប់តែមើលម៉ឺនុយ' : '📢 Free Plan: Static Digital Showcase'}
                  </span>
                  <p className="text-[11px] leading-relaxed text-stone-600">
                    {lang === 'km'
                      ? 'ហាងកំពុងប្រើគម្រោង Free។ សូមហៅបុគ្គលិកដើម្បីកម្មង់ផ្ទាល់ ឬម្ចាស់ហាងអាចដំឡើងទៅកញ្ចប់ Normal / Pro ក្នុងផ្ទាំងគ្រប់គ្រង ដើម្បីបើកការកម្មង់ដល់ផ្ទះបាយភ្លាមៗ!'
                      : 'This store is on the Free Starter plan (view only). Please call restaurant staff to place your order, or upgrade store to Normal/Pro in Dashboard to unlock kitchen ordering.'}
                  </p>
                </div>
              ) : (
                /* Submit Order Button for Normal & Pro plans */
                <button
                  id="place-order-submit-btn"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-between text-sm transition active:scale-98 font-kulen tracking-wide cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? (lang === 'km' ? 'កំពុងបញ្ជូន...' : 'Sending...')
                        : (lang === 'km' ? 'បញ្ជូនការកម្មង់ទៅចុងភៅ' : 'Send Order to Kitchen')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-100 font-bold font-mono">${totalUsd.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
