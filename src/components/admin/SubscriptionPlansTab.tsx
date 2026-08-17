import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Star, 
  Zap, 
  ShieldCheck, 
  Flame, 
  Crown, 
  ArrowRight, 
  Check, 
  X,
  CreditCard,
  Building2,
  AlertCircle
} from 'lucide-react';
import { RestaurantConfig, TenantPlan } from '../../types';

interface SubscriptionPlansTabProps {
  config: RestaurantConfig;
  onUpdateConfig: (newConfig: RestaurantConfig) => Promise<void>;
  lang: 'km' | 'en';
}

export const SubscriptionPlansTab: React.FC<SubscriptionPlansTabProps> = ({
  config,
  onUpdateConfig,
  lang,
}) => {
  const currentPlan: TenantPlan = config.plan || 'free';
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan>(currentPlan);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<TenantPlan | null>(null);

  const confirmUpgrade = async (plan: TenantPlan) => {
    setIsUpdating(true);
    try {
      await onUpdateConfig({
        ...config,
        plan: plan,
      });
      setSelectedPlan(plan);
      setCheckoutPlan(null);
      setFeedback(
        lang === 'km'
          ? `🎉 បានជាវ និងដំឡើងកញ្ចប់សេវាទៅកាន់ ${plan.toUpperCase()} ដោយជោគជ័យ! មុខងារទាំងអស់ត្រូវបានបើកដំណើរការភ្លាមៗ។`
          : `🎉 Successfully subscribed & upgraded to ${plan.toUpperCase()} plan! All tier features are unlocked immediately.`
      );
      setTimeout(() => setFeedback(null), 5000);
    } catch (e: any) {
      setFeedback(e?.message || 'Error updating plan');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectPlan = (plan: TenantPlan) => {
    if (plan === currentPlan) return;
    if (plan === 'free') {
      confirmUpgrade('free');
    } else {
      setCheckoutPlan(plan);
    }
  };

  const plansList = [
    {
      id: 'free' as TenantPlan,
      name_en: 'Free Starter',
      name_km: 'ឥតគិតថ្លៃ (Free)',
      price: '$0',
      period: '/ month',
      badge_en: 'Static Menu Showcase',
      badge_km: 'ម៉ឺនុយមើលរូបភាព',
      desc_en: 'Static digital menu showcase with food photos & prices. View dishes only (no kitchen order placement).',
      desc_km: 'ម៉ឺនុយឌីជីថលស្អាតៗ បង្ហាញរូបភាព និងតម្លៃម្ហូប។ ភ្ញៀវមើលមុខម្ហូបប៉ុណ្ណោះ មិនមានផ្ញើការកម្មង់ទៅចុងភៅទេ។',
      color: 'stone',
      features_en: [
        'Digital QR Menu Showcase (Photos & Prices)',
        'Custom Restaurant Logo, Name & Phone',
        'Set Opening & Closing hours',
        'Bilingual Khmer & English',
        'Customer Search & Category filter',
        'Table QR Codes for viewing',
        '❌ No live ordering to kitchen',
        '❌ No chef kitchen tablet display',
        '❌ No AI voice alerts',
      ],
      features_km: [
        'ម៉ឺនុយឌីជីថល QR បង្ហាញរូបភាព និងតម្លៃម្ហូប',
        'ដាក់ឈ្មោះហាង ឡូហ្គោ និងលេខទូរស័ព្ទ',
        'កំណត់ម៉ោងបើក និងបិទទ្វារហាង',
        'គាំទ្រ ២ ភាសា (ខ្មែរ និង អង់គ្លេស)',
        'ស្វែងរក និងជ្រើសរើសប្រភេទម្ហូប',
        'បង្កើតប័ណ្ណ QR កូដសម្រាប់មើលលើតុ',
        '❌ មិនមានផ្ញើការកម្មង់ទៅផ្ទះបាយ',
        '❌ មិនមានអេក្រង់ចុងភៅ Kitchen Tablet',
        '❌ មិនមានសំឡេងប្រកាសខ្មែរ AI',
      ],
    },
    {
      id: 'normal' as TenantPlan,
      name_en: 'Normal Standard',
      name_km: 'ស្តង់ដារ (Normal)',
      price: '$7.99',
      period: '/ month',
      badge_en: 'Full Ordering System',
      badge_km: 'កម្មង់ដល់ផ្ទះបាយ Live',
      desc_en: 'Contactless Table QR Scan-to-Order straight to Chef Kitchen Tablet, order tracking, and receipt printing.',
      desc_km: 'ភ្ញៀវស្កេន QR កូដលើតុកម្មង់ភ្លាមៗ ទៅដល់អេក្រង់ចុងភៅ Kitchen Tablet តាមដានស្ថានភាពម្ហូប និងព្រីនវិក្កយបត្រ។',
      color: 'blue',
      features_en: [
        'Everything in Free Plan',
        'Table QR Scan-to-Order to Kitchen',
        'Live Chef Kitchen Display (KDS)',
        'Live Order Status Tracking for customers',
        'Thermal PP587 Receipt Printing (RawBT)',
        'Telegram Bot instant order notifications',
        'Up to 30 Tables management',
        'Order history & sales totals',
        '❌ No AI Khmer Voice TTS speech',
        '❌ No advanced stock inventory',
      ],
      features_km: [
        'មុខងារទាំងអស់ក្នុងគម្រោង Free',
        'ភ្ញៀវស្កេន QR លើតុកម្មង់ទៅចុងភៅភ្លាមៗ',
        'អេក្រង់ចុងភៅ Kitchen Tablet ទទួលការកម្មង់ Live',
        'ភ្ញៀវតាមដានស្ថានភាពម្ហូប (បានទទួល, កំពុងចម្អិន, រួចរាល់)',
        'ព្រីនវិក្កយបត្រម៉ាស៊ីនកម្ដៅ PP587',
        'តេឡេក្រាម Bot ផ្ញើសារដំណឹងការកម្មង់ភ្លាមៗ',
        'គ្រប់គ្រងរហូតដល់ ៣០ តុ',
        'ប្រវត្តិការកម្មង់ និងចំណូលលក់',
        '❌ មិនមានសំឡេង AI ខ្មែរប្រកាសតុ',
        '❌ មិនមានគ្រប់គ្រងស្តុកកម្រិតខ្ពស់',
      ],
    },
    {
      id: 'pro' as TenantPlan,
      name_en: 'Pro Business AI',
      name_km: 'អាជីវកម្មកម្រិតខ្ពស់ (Pro)',
      price: '$15.99',
      period: '/ month',
      badge_en: 'AI Khmer Voice + Stock',
      badge_km: 'ពេញលេញបំផុត + ស្តុក + សំឡេងខ្មែរ',
      desc_en: 'All-inclusive restaurant OS with AI Khmer Voice TTS Announcements, live stock control, and Chef Fast QR Login.',
      desc_km: 'ប្រព័ន្ធគ្រប់គ្រងភោជនីយដ្ឋានទំនើបបំផុត មានសំឡេងខ្មែរ AI ប្រកាសតុ គ្រប់គ្រងស្តុកទំនិញ និង QR Scan ចូលផ្ទះបាយភ្លាមៗ។',
      popular: true,
      color: 'amber',
      features_en: [
        'Everything in Normal Plan',
        'AI Khmer Voice TTS Announcements ("តុលេខ... កម្មង់ថ្មី")',
        'Real-time Stock & Inventory Management',
        'Cost Price vs Sale Price profit margin calculator',
        'Chef Fast-Login QR Code Generator',
        'Download Daily Sales & Revenue PDF Report',
        'Custom Logo, Wi-Fi & Operating hours',
        'Unlimited Tables & Staff accounts',
        '24/7 Priority Support on Telegram',
      ],
      features_km: [
        'មុខងារទាំងអស់ក្នុងគម្រោង Normal',
        'សំឡេង AI ខ្មែរប្រកាសដល់ចុងភៅ (តុលេខ... កម្មង់ថ្មី)',
        'គ្រប់គ្រងស្តុកទំនិញ & ដឹងចំនួននៅសល់',
        'គណនាថ្លៃដើម និងប្រាក់ចំណេញសុទ្ធលើមុខម្ហូប',
        'បង្កើតប័ណ្ណ QR កូដសម្រាប់ចុងភៅស្កេនចូលភ្លាមៗ',
        'ទាញយករបាយការណ៍សង្ខេបចំណូល PDF ប្រចាំថ្ងៃ',
        'ដាក់ Logo ហាង, ម៉ោងបើក-បិទ និង Wi-Fi',
        'មិនកំណត់ចំនួនតុ & ចំនួនគណនីបុគ្គលិក',
        'សេវាថែទាំអាទិភាព ២៤/៧',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-5 sm:p-6 rounded-3xl border border-stone-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-extrabold font-kulen tracking-wide text-white">
              {lang === 'km' ? 'កញ្ចប់សេវាកម្ម & ការជាវ (Subscription Plans)' : 'Subscription Plans & Tier Management'}
            </h2>
          </div>
          <p className="text-xs text-stone-300 font-battambang">
            {lang === 'km'
              ? 'ជ្រើសរើស ឬប្តូរកញ្ចប់សេវាសម្រាប់ហាងរបស់អ្នក ដើម្បីបើកមុខងារកម្មង់ដល់ផ្ទះបាយ សំឡេងប្រកាសខ្មែរ AI និងគ្រប់គ្រងស្តុក'
              : 'Switch your active store plan to unlock table ordering, AI Khmer voice alerts, and stock management.'}
          </p>
        </div>

        {/* Current Active Plan Badge */}
        <div className="bg-stone-950/80 border border-amber-500/40 px-4 py-2.5 rounded-2xl flex items-center gap-3 shrink-0 shadow-inner">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
              {lang === 'km' ? 'កញ្ចប់សកម្មបច្ចុប្បន្ន' : 'Current Active Plan'}
            </span>
            <span className="text-sm font-extrabold text-amber-400 font-kulen uppercase">
              {currentPlan === 'pro' ? 'Pro Business ($15.99)' : currentPlan === 'normal' ? 'Normal Standard ($7.99)' : 'Free Starter ($0)'}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 3 Interactive Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {plansList.map((plan) => {
          const isActive = currentPlan === plan.id;
          const isPro = plan.id === 'pro';
          const isNormal = plan.id === 'normal';

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 ${
                isActive
                  ? 'bg-stone-900 text-white border-2 border-amber-500 shadow-2xl ring-2 ring-amber-500/30'
                  : 'bg-white text-stone-900 border border-stone-200 hover:border-stone-300 shadow-xs'
              }`}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-950 text-[10px] font-black px-3 py-0.5 rounded-full shadow-md uppercase tracking-wider font-kulen flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{lang === 'km' ? 'កំពុងប្រើប្រាស់' : 'Active Plan'}</span>
                </div>
              )}

              {/* Popular Tag for Pro */}
              {!isActive && plan.popular && (
                <div className="absolute -top-3 right-4 bg-purple-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-md uppercase tracking-wider font-kulen">
                  {lang === 'km' ? 'ពេញនិយម' : 'Popular'}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`font-extrabold text-lg font-kulen ${isActive ? 'text-white' : 'text-stone-900'}`}>
                    {lang === 'km' ? plan.name_km : plan.name_en}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    isPro ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    isNormal ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                    'bg-stone-100 text-stone-600 border border-stone-200'
                  }`}>
                    {lang === 'km' ? plan.badge_km : plan.badge_en}
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl sm:text-4xl font-black font-mono ${isActive ? 'text-white' : 'text-stone-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-xs font-semibold ${isActive ? 'text-stone-400' : 'text-stone-500'}`}>
                    {plan.period}
                  </span>
                </div>

                <p className={`text-xs font-battambang leading-relaxed min-h-[40px] ${isActive ? 'text-stone-300' : 'text-stone-600'}`}>
                  {lang === 'km' ? plan.desc_km : plan.desc_en}
                </p>

                <div className={`h-px my-3 ${isActive ? 'bg-stone-800' : 'bg-stone-100'}`} />

                {/* Feature Bullet List */}
                <div className="space-y-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-kulen ${isActive ? 'text-stone-400' : 'text-stone-500'}`}>
                    {lang === 'km' ? 'មុខងារដែលទទួលបាន៖' : 'Features Included:'}
                  </span>
                  <ul className="space-y-1.5 text-xs font-battambang">
                    {(lang === 'km' ? plan.features_km : plan.features_en).map((feat, idx) => {
                      const isNegative = feat.startsWith('❌');
                      return (
                        <li key={idx} className="flex items-start gap-1.5">
                          {isNegative ? (
                            <span className="text-stone-400 text-[10px] mt-0.5 shrink-0">✕</span>
                          ) : (
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-amber-400' : 'text-emerald-600'}`} />
                          )}
                          <span className={`${isNegative ? 'text-stone-400 line-through' : isActive ? 'text-stone-200' : 'text-stone-700'}`}>
                            {feat.replace('❌ ', '')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  type="button"
                  disabled={isActive || isUpdating}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 font-khmer cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-black cursor-default'
                      : isPro
                      ? 'bg-stone-900 hover:bg-black text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'km' ? 'កញ្ចប់សកម្មបច្ចុប្បន្ន' : 'Currently Active'}</span>
                    </>
                  ) : (
                    <>
                      <span>{lang === 'km' ? `ជ្រើសរើសកញ្ចប់ (${plan.price})` : `Select Plan (${plan.price})`}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix Note */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <h4 className="font-bold text-xs sm:text-sm text-stone-900 font-kulen">
            {lang === 'km' ? 'របៀបដំណើរការនៃកញ្ចប់ Free vs Normal vs Pro' : 'How Free, Normal, and Pro Plans Work'}
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-battambang text-stone-600">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <span className="font-bold text-stone-900 block font-kulen mb-1">១. កញ្ចប់ Free ($0)</span>
            ភ្ញៀវស្កេន QR ឃើញរូបភាព និងតម្លៃម្ហូបស្អាតៗ (Static Digital Menu) ប៉ុន្តែប៊ូតុងកម្មង់ទៅផ្ទះបាយត្រូវបិទ។
          </div>
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
            <span className="font-bold text-blue-900 block font-kulen mb-1">២. កញ្ចប់ Normal ($7.99)</span>
            បើកដំណើរការកម្មង់លើតុ (Table QR Ordering) បញ្ជូនទៅអេក្រង់ចុងភៅ Kitchen Tablet ព្រីនវិក្កយបត្រ និងតេឡេក្រាម Bot។
          </div>
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
            <span className="font-bold text-amber-900 block font-kulen mb-1">៣. កញ្ចប់ Pro ($15.99)</span>
            មុខងារពេញលេញបំផុត រួមទាំងសំឡេង AI ខ្មែរប្រកាសតុ គ្រប់គ្រងស្តុកទំនិញ គណនាប្រាក់ចំណេញ និង Chef Fast QR Login។
          </div>
        </div>
      </div>

      {/* Subscription Checkout Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold ${
                  checkoutPlan === 'pro' ? 'bg-amber-500 text-stone-950' : 'bg-blue-600 text-white'
                }`}>
                  {checkoutPlan === 'pro' ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 font-kulen">
                    {lang === 'km' ? 'បញ្ជាក់ការជាវកញ្ចប់សេវាកម្ម' : 'Confirm Subscription Plan'}
                  </h3>
                  <p className="text-xs text-stone-500 font-battambang">
                    {checkoutPlan === 'pro' ? 'Pro Business Plan ($15.99 / month)' : 'Normal Standard Plan ($7.99 / month)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutPlan(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-600 font-semibold font-battambang">
                  {lang === 'km' ? 'កញ្ចប់ដែលបានជ្រើសរើស' : 'Selected Plan'}:
                </span>
                <span className="font-bold text-stone-900 font-kulen uppercase">
                  {checkoutPlan === 'pro' ? 'Pro Business' : 'Normal Standard'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-600 font-semibold font-battambang">
                  {lang === 'km' ? 'តម្លៃប្រចាំខែ' : 'Billing Amount'}:
                </span>
                <span className="text-lg font-black text-amber-700 font-mono">
                  {checkoutPlan === 'pro' ? '$15.99' : '$7.99'} <span className="text-xs font-normal text-stone-500">/ month</span>
                </span>
              </div>
              <div className="text-[11px] text-stone-600 font-battambang border-t border-amber-200/60 pt-2">
                {checkoutPlan === 'pro'
                  ? (lang === 'km' ? '✨ បើកដំណើរការសំឡេងខ្មែរ AI ប្រកាសតុ គ្រប់គ្រងស្តុកទំនិញ និងគណនាប្រាក់ចំណេញ។' : '✨ Unlocks AI Khmer Voice TTS, full inventory & profit tracking.')
                  : (lang === 'km' ? '✨ បើកដំណើរការកម្មង់លើតុដល់អេក្រង់ចុងភៅ Kitchen Tablet & ព្រីនវិក្កយបត្រ។' : '✨ Unlocks Table QR live ordering to Chef tablet & receipts.')}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition font-khmer cursor-pointer"
              >
                {lang === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => confirmUpgrade(checkoutPlan)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition shadow-lg active:scale-98 font-khmer flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  checkoutPlan === 'pro'
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {isUpdating
                    ? (lang === 'km' ? 'កំពុងដំណើរការ...' : 'Upgrading...')
                    : (lang === 'km' ? 'ជាវ & បើកមុខងារភ្លាមៗ' : 'Subscribe & Unlock Now')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
