import React, { useEffect } from 'react';
import { X, CheckCircle2, Clock, ChefHat, Bell, Receipt, RefreshCw } from 'lucide-react';
import { Order, RestaurantConfig } from '../../types';

interface OrderStatusModalProps {
  order: Order | null;
  onClose: () => void;
  config: RestaurantConfig;
  lang: 'km' | 'en';
  onCallWaiter?: () => void;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  order,
  onClose,
  config,
  lang,
  onCallWaiter,
}) => {
  useEffect(() => {
    if (order) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [order]);

  if (!order) return null;

  const steps = [
    { key: 'new', label_en: 'Received', label_km: 'បានទទួល' },
    { key: 'preparing', label_en: 'Cooking', label_km: 'កំពុងធ្វើ' },
    { key: 'ready', label_en: 'Ready', label_km: 'រួចរាល់' },
    { key: 'served', label_en: 'Served', label_km: 'បានបម្រើ' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'new': return 0;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'served':
      case 'completed': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(order.status);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-200 font-kulen">
                {lang === 'km' ? 'ស្ថានភាពការកម្មង់' : 'Live Order Status'}
              </span>
              <h3 className="text-lg font-bold font-kulen tracking-wide">
                {lang === 'km' ? `តុលេខ ${order.tableNumber} • កូដ #${order.orderNumber}` : `Table #${order.tableNumber} • Order #${order.orderNumber}`}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-5 bg-stone-50 border-b border-stone-200">
          <div className="relative flex items-center justify-between">
            {/* Background Line */}
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-stone-200 z-0">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step, idx) => {
              const isPast = idx <= currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      isPast
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : 'bg-white border-2 border-stone-300 text-stone-400'
                    } ${isCurrent ? 'animate-bounce' : ''}`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-semibold mt-1.5 font-kulen ${
                    isCurrent ? 'text-emerald-700 font-bold' : 'text-stone-500'
                  }`}>
                    {lang === 'km' ? step.label_km : step.label_en}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900 font-medium">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-battambang">
              {order.status === 'new' && (lang === 'km' ? 'ចុងភៅបានទទួលការកម្មង់រួចហើយ កំពុងត្រៀមគ្រឿងផ្សំ!' : 'Order received! Kitchen is prepping your ingredients.')}
              {order.status === 'preparing' && (lang === 'km' ? 'មុខម្ហូបរបស់អ្នកកំពុងត្រូវបានចម្អិនលើខ្ទះក្តៅៗ' : 'Your dishes are now cooking on the wok & grill.')}
              {order.status === 'ready' && (lang === 'km' ? 'មុខម្ហូបរួចរាល់ហើយ បុគ្គលិកកំពុងលើកជូនតុរបស់អ្នក!' : 'Dishes are ready! Staff is bringing them to your table.')}
              {(order.status === 'served' || order.status === 'completed') && (lang === 'km' ? 'បានបម្រើជូនរួចរាល់! សូមពិសារដោយរីករាយ' : 'Served to your table! Enjoy your meal.')}
            </span>
          </div>
        </div>

        {/* Itemized Order Content */}
        <div className="p-4 max-h-60 overflow-y-auto space-y-2 text-xs">
          <h4 className="font-bold text-stone-700 uppercase tracking-wider text-[11px] font-kulen">
            {lang === 'km' ? 'មុខម្ហូបដែលបានកម្មង់' : 'Ordered Items'}
          </h4>
          <div className="divide-y divide-stone-100">
            {order.items.map((item, i) => (
              <div key={i} className="py-1.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 mr-2">{item.quantity}x</span>
                  <span className="font-semibold text-stone-800 font-kulen">{item.name_km}</span>
                  <span className="text-stone-400 text-[11px] block">{item.name_en}</span>
                </div>
                <span className="font-bold text-stone-900">${item.itemTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm">
            <span className="font-kulen">{lang === 'km' ? 'សរុប' : 'Total'}</span>
            <span className="text-amber-700">${order.total.toFixed(2)} ({order.total_khr.toLocaleString()} ៛)</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center gap-2">
          {onCallWaiter && (
            <button
              onClick={onCallWaiter}
              className="flex-1 flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold py-2.5 px-3 rounded-xl border border-stone-300 transition font-kulen"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'km' ? 'ហៅបុគ្គលិក / គិតលុយ' : 'Call Waiter / Bill'}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-stone-900 hover:bg-black text-white text-xs font-bold py-2.5 px-3 rounded-xl transition font-kulen"
          >
            {lang === 'km' ? 'បិទផ្ទាំង' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
