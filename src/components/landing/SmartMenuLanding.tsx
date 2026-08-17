import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  ChefHat, 
  LayoutDashboard, 
  QrCode, 
  Volume2, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Globe, 
  Store, 
  Zap, 
  Clock, 
  Phone, 
  Package, 
  DollarSign, 
  ShieldCheck, 
  Printer, 
  MessageSquare, 
  TrendingUp, 
  Flame,
  Star,
  Users,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { RestaurantConfig, TenantPlan } from '../../types';

interface SmartMenuLandingProps {
  onLoginDashboard: () => void;
  onLoginKitchen: () => void;
  onRegisterShop?: () => void;
  lang: 'km' | 'en';
  onToggleLang: () => void;
  config: RestaurantConfig;
  isLoggingIn?: boolean;
}

export const SmartMenuLanding: React.FC<SmartMenuLandingProps> = ({
  onLoginDashboard,
  onLoginKitchen,
  lang,
  onToggleLang,
  config,
  isLoggingIn = false,
}) => {
  const [selectedPlanTab, setSelectedPlanTab] = useState<TenantPlan>('pro');

  const plans = [
    {
      id: 'free' as TenantPlan,
      name_en: 'Free Starter',
      name_km: 'ឥតគិតថ្លៃ (Free)',
      price: '$0',
      period: '/ month',
      badge_en: 'Static Showcase',
      badge_km: 'ម៉ឺនុយមើលរូបភាព',
      description_en: 'Best for small cafes or restaurants wanting a modern digital image menu showcase without kitchen ordering.',
      description_km: 'ស័ក្តិសមសម្រាប់ហាងកាហ្វេ និងភោជនីយដ្ឋានដែលចង់ដាក់តាំងម៉ឺនុយឌីជីថលស្អាតៗ បង្ហាញរូបភាព និងតម្លៃមុខម្ហូប។',
      popular: false,
      color: 'stone',
      features_en: [
        'Digital QR Menu Showcase (High-res food photos & prices)',
        'Custom Restaurant Logo, Name & Phone number',
        'Set Opening & Closing hours',
        'Bilingual Khmer & English menu',
        'Customer search & category filters',
        'Table QR Codes generator (View-only)',
        '❌ No order-to-chef feature',
        '❌ No live kitchen tablet sync',
      ],
      features_km: [
        'ម៉ឺនុយឌីជីថល QR បង្ហាញរូបភាព និងតម្លៃម្ហូបកម្រិតច្បាស់',
        'ដាក់ឈ្មោះហាង ឡូហ្គោផ្ទាល់ខ្លួន និងលេខទូរស័ព្ទ',
        'កំណត់ម៉ោងបើក និងម៉ោងបិទទ្វារហាង',
        'គាំទ្រ ២ ភាសា (ខ្មែរ និង អង់គ្លេស)',
        'ប្រព័ន្ធស្វែងរក និងបែងចែកប្រភេទមុខម្ហូប',
        'បង្កើតប័ណ្ណ QR កូដដាក់លើតុ (សម្រាប់មើលម៉ឺនុយ)',
        '❌ មិនមានមុខងារផ្ញើការកម្មង់ទៅផ្ទះបាយ',
        '❌ មិនមានអេក្រង់ចុងភៅ Kitchen Tablet',
      ],
      cta_en: 'Get Started Free',
      cta_km: 'ចាប់ផ្តើមប្រើដោយឥតគិតថ្លៃ',
    },
    {
      id: 'normal' as TenantPlan,
      name_en: 'Normal Standard',
      name_km: 'ស្តង់ដារ (Normal)',
      price: '$7.99',
      period: '/ month',
      badge_en: 'Full Ordering System',
      badge_km: 'កម្មង់ដល់ផ្ទះបាយ',
      description_en: 'Full digital ordering from customer mobile straight to chef kitchen tablet with order tracking and billing.',
      description_km: 'ប្រព័ន្ធកម្មង់ពេញលេញ ភ្ញៀវស្កេនកូដកម្មង់ភ្លាមៗ ទៅដល់អេក្រង់ចុងភៅ និងតាមដានស្ថានភាពម្ហូប។',
      popular: false,
      color: 'blue',
      features_en: [
        'Everything in Free Plan',
        'Instant Table QR Scan-to-Order to Chef',
        'Live Chef Kitchen Tablet Display (KDS)',
        'Real-time Order Status Tracking for customers',
        'PP587 Thermal Receipt Printing (RawBT Protocol)',
        'Telegram Bot Instant Order Notifications',
        'Up to 30 Tables & Custom Categories',
        'Daily Revenue Analytics & History',
      ],
      features_km: [
        'មុខងារទាំងអស់ដែលមានក្នុងគម្រោង Free',
        'ភ្ញៀវស្កេន QR លើតុកម្មង់ទៅចុងភៅភ្លាមៗ',
        'អេក្រង់ចុងភៅ Kitchen Tablet ទទួលការកម្មង់ Live',
        'ភ្ញៀវតាមដានស្ថានភាពម្ហូប (បានទទួល, កំពុងចម្អិន, រួចរាល់)',
        'ព្រីនវិក្កយបត្រម៉ាស៊ីនកម្ដៅ PP587 (RawBT Ready)',
        'តេឡេក្រាម Bot ផ្ញើសារដំណឹងការកម្មង់ភ្លាមៗ',
        'ដាក់បានរហូតដល់ ៣០ តុ & បង្កើតប្រភេទម្ហូបផ្ទាល់ខ្លួន',
        'របាយការណ៍លក់ និងប្រវត្តិវិក្កយបត្រ',
      ],
      cta_en: 'Subscribe Normal ($7.99)',
      cta_km: 'ជ្រើសរើសកញ្ចប់ $7.99/ខែ',
    },
    {
      id: 'pro' as TenantPlan,
      name_en: 'Pro Business AI',
      name_km: 'អាជីវកម្មកម្រិតខ្ពស់ (Pro)',
      price: '$15.99',
      period: '/ month',
      badge_en: 'AI Khmer Voice + Stock',
      badge_km: 'ពេញលេញបំផុត + ស្តុក + សំឡេងខ្មែរ',
      description_en: 'Ultimate restaurant operating system with AI Khmer Voice announcements, live stock & inventory, and Chef QR fast-login.',
      description_km: 'ប្រព័ន្ធគ្រប់គ្រងភោជនីយដ្ឋានទំនើបបំផុត មានសំឡេងខ្មែរ AI ប្រកាសតុ គ្រប់គ្រងស្តុកម្ហូប និង QR Scan ចូលផ្ទះបាយភ្លាមៗ។',
      popular: true,
      color: 'amber',
      features_en: [
        'Everything in Normal Plan',
        'Natural AI Khmer Voice TTS Announcements ("តុលេខ [X] កម្មង់ថ្មី")',
        'Real-time Stock & Inventory Tracking (In-stock, Low-stock alerts)',
        'Cost Price vs Sale Price Profit Analysis',
        'Chef Fast-Login QR Code (Scan with tablet camera to log in)',
        'Download Daily Sales & Revenue PDF Report',
        'Custom Logo, Wi-Fi & Operating Hours settings',
        'Unlimited Tables & Unlimited Staff accounts',
        '24/7 Priority Support via Telegram/Phone',
      ],
      features_km: [
        'មុខងារទាំងអស់ដែលមានក្នុងគម្រោង Normal',
        'សំឡេងបញ្ញាសិប្បនិម្មិត AI ប្រកាសជាភាសាខ្មែរ (តុលេខ... កម្មង់ថ្មី)',
        'គ្រប់គ្រងស្តុកទំនិញ (ដឹងចំនួននៅសល់, ជូនដំណឹងជិតអស់ស្តុក)',
        'គណនាថ្លៃដើម (Cost Price) និងប្រាក់ចំណេញច្បាស់លាស់',
        'បង្កើតប័ណ្ណ QR កូដសម្រាប់ចុងភៅស្កេនចូលភ្លាមៗ (មិនបាច់វាយលេខកូដ)',
        'ទាញយករបាយការណ៍សង្ខេបចំណូលប្រចាំថ្ងៃជា PDF',
        'ដាក់ Logo ហាង, ម៉ោងបើក-បិទ, និងលេខសម្ងាត់ Wi-Fi',
        'មិនកំណត់ចំនួនតុ & ចំនួនបុគ្គលិកប្រើប្រាស់',
        'សេវាថែទាំអាទិភាព ២៤/៧ តាម Telegram/ទូរស័ព្ទ',
      ],
      cta_en: 'Subscribe Pro ($15.99)',
      cta_km: 'ជ្រើសរើសកញ្ចប់ $15.99/ខែ',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-white">
      {/* 1. Top Navbar */}
      <header className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-stone-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl font-kulen tracking-wider text-white">
                  SmartMenu
                </span>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  v2.5 Pro
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-battambang hidden sm:block">
                {lang === 'km' ? 'ប្រព័ន្ធម៉ឺនុយឌីជីថល & ផ្ទះបាយទំនើបនៅកម្ពុជា' : 'Digital QR Menu & Smart Kitchen KDS'}
              </p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-xs font-bold transition shadow-xs cursor-pointer font-khmer"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'km' ? 'ខ្មែរ (KM)' : 'EN'}</span>
            </button>

            {/* Admin Dashboard Login CTA */}
            <button
              onClick={onLoginDashboard}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-extrabold transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer font-khmer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
              </svg>
              <span>{lang === 'km' ? 'ចូលផ្ទាំងគ្រប់គ្រង (Admin Dashboard)' : 'Admin Dashboard Login'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[400px] h-[250px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>{lang === 'km' ? 'ស្មាតម៉ឺនុយ SmartMenu ជំនាន់ថ្មី គាំទ្រសំឡេងខ្មែរ AI' : 'Next-Gen SmartMenu with AI Khmer Voice Alerts'}</span>
          </div>

          {/* Main Title */}
          <h1 className="max-w-4xl mx-auto text-3xl sm:text-5xl lg:text-6xl font-extrabold font-kulen tracking-tight leading-tight sm:leading-snug text-white">
            {lang === 'km' ? (
              <>
                ប្រព័ន្ធគ្រប់គ្រងម៉ឺនុយ <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">QR លើតុ & ផ្ទះបាយឌីជីថល</span> ឈានមុខគេនៅកម្ពុជា
              </>
            ) : (
              <>
                The #1 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">Table QR Menu & Smart Kitchen</span> Operating System
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300 font-battambang leading-relaxed">
            {lang === 'km' ? (
              'ជួយភោជនីយដ្ឋាន និងហាងកាហ្វេរបស់អ្នក ដំណើរការកាន់តែរលូន៖ ភ្ញៀវស្កេន QR កូដកម្មង់ម្ហូបលើទូរស័ព្ទផ្ទាល់ខ្លួន បញ្ជូនភ្លាមៗទៅអេក្រង់ចុងភៅ Kitchen Tablet ជាមួយសំឡេងប្រកាសខ្មែរ AI គ្រប់គ្រងស្តុកទំនិញ និងទាញយករបាយការណ៍លក់ប្រចាំថ្ងៃ។'
            ) : (
              'Empower your restaurant with seamless contactless table QR ordering, real-time Kitchen Display Screen (KDS), Khmer AI Voice announcements, live inventory control, and thermal receipt printing.'
            )}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4">
            <button
              onClick={onLoginDashboard}
              disabled={isLoggingIn}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-sm sm:text-base shadow-xl shadow-amber-500/25 transition active:scale-95 cursor-pointer font-khmer disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
              </svg>
              <span>{lang === 'km' ? 'ចូលផ្ទាំងគ្រប់គ្រង Admin Dashboard' : 'Admin Dashboard Login'}</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-12 text-left">
            <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white font-kulen">
                {lang === 'km' ? 'ស្កេន QR កូដលើតុ' : 'Table QR Ordering'}
              </h4>
              <p className="text-xs text-stone-400 font-battambang mt-1">
                {lang === 'km' ? 'ភ្ញៀវមើលរូបភាព ជ្រើសរើសកម្រិតហិរ & កម្មង់ភ្លាមៗ' : 'Browse food photos, customize spicy level & order'}
              </p>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mb-3">
                <Volume2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white font-kulen">
                {lang === 'km' ? 'សំឡេងខ្មែរ AI ប្រកាសតុ' : 'AI Khmer Voice TTS'}
              </h4>
              <p className="text-xs text-stone-400 font-battambang mt-1">
                {lang === 'km' ? 'ប្រកាសសំឡេងកណ្ដឹង & សំឡេងខ្មែរដល់ចុងភៅស្វ័យប្រវត្តិ' : 'Automated Khmer voice alerts & chimes in kitchen'}
              </p>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white font-kulen">
                {lang === 'km' ? 'គ្រប់គ្រងស្តុកទំនិញ' : 'Stock & Inventory'}
              </h4>
              <p className="text-xs text-stone-400 font-battambang mt-1">
                {lang === 'km' ? 'តាមដានចំនួននៅសល់ បិទបើកទំនិញ និងគណនាចំណេញ' : 'Track stock levels, mark sold out, calculate margin'}
              </p>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white font-kulen">
                {lang === 'km' ? 'QR Scan ចូលផ្ទះបាយលឿន' : 'Chef QR Fast Login'}
              </h4>
              <p className="text-xs text-stone-400 font-battambang mt-1">
                {lang === 'km' ? 'ចុងភៅស្កេន QR លើទូរស័ព្ទចូលអេក្រង់ផ្ទះបាយភ្លាមៗ' : 'Kitchen staff scans QR to login instantly without typing'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Subscription Plans Section */}
      <section id="pricing-plans" className="py-16 sm:py-24 bg-stone-900/50 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{lang === 'km' ? 'តម្លៃសមរម្យ គ្មានកុងត្រាជាប់កាតព្វកិច្ច' : 'Simple Transparent Pricing'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-kulen text-white tracking-tight">
              {lang === 'km' ? 'កញ្ចប់សេវាកម្ម SmartMenu ទាំង ៣' : 'Choose Your SmartMenu Plan'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 font-battambang">
              {lang === 'km'
                ? 'ជ្រើសរើសកញ្ចប់ដែលស័ក្តិសមជាមួយទំហំហាងរបស់អ្នក ចាប់ពីម៉ឺនុយបង្ហាញរូបភាពធម្មតា (Free) រហូតដល់ប្រព័ន្ធផ្ទះបាយ AI ពេញលេញ (Pro)'
                : 'From simple image menu showcase to full-scale AI automated kitchen operation, select what fits your restaurant best.'}
            </p>
          </div>

          {/* 3 Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isPro = plan.id === 'pro';
              const isNormal = plan.id === 'normal';
              const isFree = plan.id === 'free';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                    isPro
                      ? 'bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : 'bg-stone-900/90 border border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-xs font-black px-4 py-1 rounded-full shadow-md uppercase tracking-wider font-kulen">
                      {lang === 'km' ? 'ពេញនិយមបំផុត (Most Popular)' : 'Most Popular'}
                    </div>
                  )}

                  {/* Plan Top Info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-xl font-kulen text-white">
                        {lang === 'km' ? plan.name_km : plan.name_en}
                      </h3>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isPro ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        isNormal ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-stone-800 text-stone-400 border border-stone-700'
                      }`}>
                        {lang === 'km' ? plan.badge_km : plan.badge_en}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                        {plan.price}
                      </span>
                      <span className="text-stone-400 text-xs font-semibold">
                        {plan.period}
                      </span>
                    </div>

                    <p className="text-xs text-stone-400 font-battambang leading-relaxed min-h-[48px]">
                      {lang === 'km' ? plan.description_km : plan.description_en}
                    </p>

                    <div className="h-px bg-stone-800 my-4" />

                    {/* Features List */}
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider font-kulen">
                        {lang === 'km' ? 'មុខងារដែលទទួលបាន៖' : 'Included Features:'}
                      </span>
                      <ul className="space-y-2 text-xs text-stone-300 font-battambang">
                        {(lang === 'km' ? plan.features_km : plan.features_en).map((feat, idx) => {
                          const isNegative = feat.startsWith('❌');
                          return (
                            <li key={idx} className="flex items-start gap-2">
                              {isNegative ? (
                                <span className="text-stone-500 mt-0.5 shrink-0">✕</span>
                              ) : (
                                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isPro ? 'text-amber-400' : isNormal ? 'text-blue-400' : 'text-emerald-400'}`} />
                              )}
                              <span className={isNegative ? 'text-stone-500 line-through' : ''}>
                                {feat.replace('❌ ', '')}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  {/* Plan CTA Button */}
                  <div className="pt-8">
                    <button
                      onClick={onLoginDashboard}
                      className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-lg active:scale-98 cursor-pointer font-khmer flex items-center justify-center gap-2 ${
                        isPro
                          ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                          : isNormal
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                      }`}
                    >
                      <span>{lang === 'km' ? plan.cta_km : plan.cta_en}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Detailed Feature Breakdown Showcase */}
      <section className="py-16 sm:py-24 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-kulen text-white tracking-tight">
              {lang === 'km' ? 'មុខងារពិសេសៗក្នុងផ្ទាំងគ្រប់គ្រង (Dashboard)' : 'Powerful Features Built for Restaurant Owners'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 font-battambang">
              {lang === 'km'
                ? 'គ្រប់គ្រងហាងរបស់អ្នកបានគ្រប់ទីកន្លែង តាមរយៈទូរស័ព្ទដៃ iPad ឬកុំព្យូទ័រ'
                : 'Manage everything in one central dashboard from any phone, tablet, or desktop.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Branding & Profile */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-kulen text-white">
                {lang === 'km' ? 'ដាក់ឈ្មោះហាង ឡូហ្គោ & ម៉ោងបើក-បិទ' : 'Brand Name, Logo & Operating Hours'}
              </h3>
              <p className="text-xs text-stone-400 font-battambang leading-relaxed">
                {lang === 'km'
                  ? 'អ្នកអាច Upload ឡូហ្គោហាងផ្ទាល់ខ្លួន កំណត់ឈ្មោះជាភាសាខ្មែរ/អង់គ្លេស លេខទូរស័ព្ទទំនាក់ទំនង ម៉ោងបើក និងម៉ោងបិទទ្វារហាង និងលេខកូដ Wi-Fi សម្រាប់ភ្ញៀវ។'
                  : 'Upload your brand logo, configure store name in Khmer & English, contact phone, opening/closing hours, and guest Wi-Fi details.'}
              </p>
            </div>

            {/* Feature 2: Stock & Inventory */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-kulen text-white">
                {lang === 'km' ? 'គ្រប់គ្រងស្តុក & គណនាប្រាក់ចំណេញ' : 'Live Stock & Profit Margins'}
              </h3>
              <p className="text-xs text-stone-400 font-battambang leading-relaxed">
                {lang === 'km'
                  ? 'បញ្ចូលចំនួនស្តុកមុខម្ហូប ទទួលបានដំណឹងពេលទំនិញជិតអស់ កំណត់ថ្លៃដើម (Cost Price) ដើម្បីដឹងប្រាក់ចំណេញសុទ្ធលើមុខម្ហូបនីមួយៗភ្លាមៗ។'
                  : 'Keep stock counts updated, receive low stock alerts, and input cost price to track item profit margins automatically.'}
              </p>
            </div>

            {/* Feature 3: Chef Fast QR Login */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-kulen text-white">
                {lang === 'km' ? 'កំណត់គណនីចុងភៅ & QR Scan ចូល' : 'Chef Credentials & Quick QR Login'}
              </h3>
              <p className="text-xs text-stone-400 font-battambang leading-relaxed">
                {lang === 'km'
                  ? 'ម្ចាស់ហាងអាចបង្កើតឈ្មោះ និងលេខសម្ងាត់ចុងភៅ ព្រមទាំងទាញយកប័ណ្ណ QR កូដសម្រាប់បិទលើជញ្ជាំងផ្ទះបាយ ចុងភៅគ្រាន់តែស្កេនគឺចូលបានភ្លាម។'
                  : 'Set Chef Name and Password, and generate a printable Chef Login QR Code for instant tablet login without typing credentials.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-stone-800 py-10 bg-stone-950 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-white font-kulen">SmartMenu Cambodia</span>
            <span className="text-stone-600">|</span>
            <span className="font-mono">v2.5 Full-Stack</span>
          </div>

          <p className="font-battambang text-stone-500 text-center sm:text-right">
            {lang === 'km' ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង © 2026 SmartMenu. រចនាឡើងសម្រាប់ភោជនីយដ្ឋាននៅកម្ពុជា។' : '© 2026 SmartMenu. All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
};
