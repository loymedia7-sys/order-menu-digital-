import React, { useState } from 'react';
import { 
  ChefHat, 
  KeyRound, 
  QrCode, 
  Printer, 
  Copy, 
  Check, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';
import { RestaurantConfig } from '../../types';

interface ChefCredentialsTabProps {
  config: RestaurantConfig;
  onUpdateConfig: (newConfig: RestaurantConfig) => Promise<void>;
  lang: 'km' | 'en';
  tenantId: string;
}

export const ChefCredentialsTab: React.FC<ChefCredentialsTabProps> = ({
  config,
  onUpdateConfig,
  lang,
  tenantId,
}) => {
  const [chefName, setChefName] = useState<string>(config.chefName || 'ចុងភៅដារ៉ា (Chef Dara)');
  const [chefPassword, setChefPassword] = useState<string>(config.chefPassword || config.passwords?.chef || config.chefPin || 'chef1234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate Fast-Login QR Code URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://smartmenu.app';
  const chefLoginUrl = `${origin}/?chef_login=1&shop=${encodeURIComponent(tenantId || config.id || 'main-restaurant')}&auth_chef=${encodeURIComponent(chefName)}&p=${encodeURIComponent(chefPassword)}`;
  
  // Google Chart QR Generator API URL for high-res clean QR
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(chefLoginUrl)}&bgcolor=ffffff&color=0c0a09&margin=10`;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chefName.trim() || !chefPassword) {
      setFeedback(lang === 'km' ? 'សូមបំពេញឈ្មោះចុងភៅ និងលេខសម្ងាត់!' : 'Please enter chef name and password!');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateConfig({
        ...config,
        chefName: chefName.trim(),
        chefPassword: chefPassword,
        passwords: {
          ...config.passwords,
          chef: chefPassword,
        },
        chefPin: chefPassword,
      });
      setFeedback(lang === 'km' ? 'បានរក្សាទុកគណនីចុងភៅ និងបង្កើត QR កូដថ្មីរួចរាល់!' : 'Saved chef credentials & generated new Fast-Login QR Code!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(err?.message || 'Error saving credentials');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(chefLoginUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrintChefQr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chef Fast-Login QR Code - ${config.name_en || 'SmartMenu'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;700&family=Koulen&display=swap');
            body {
              font-family: 'Kantumruy Pro', sans-serif;
              text-align: center;
              padding: 30px;
              background-color: #fff;
              color: #0c0a09;
            }
            .card {
              border: 3px solid #0c0a09;
              border-radius: 24px;
              padding: 24px;
              max-width: 360px;
              margin: 0 auto;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .header-tag {
              background: #f59e0b;
              color: #0c0a09;
              font-family: 'Koulen', cursive;
              font-size: 16px;
              padding: 4px 16px;
              border-radius: 20px;
              display: inline-block;
              margin-bottom: 12px;
            }
            h1 {
              font-family: 'Koulen', cursive;
              font-size: 24px;
              margin: 4px 0 8px 0;
            }
            p {
              font-size: 12px;
              color: #444;
              margin: 4px 0 16px 0;
            }
            img {
              width: 240px;
              height: 240px;
              border-radius: 16px;
              border: 1px solid #e5e5e5;
            }
            .credentials {
              background: #f5f5f4;
              border-radius: 12px;
              padding: 10px;
              margin-top: 16px;
              font-size: 12px;
              text-align: left;
            }
            .credentials div {
              margin: 3px 0;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header-tag">KITCHEN TABLET ACCESS</div>
            <h1>${config.name_km || 'SmartMenu Kitchen'}</h1>
            <p>ស្កេន QR កូដនេះលើទូរស័ព្ទ ឬ iPad ដើម្បីចូលអេក្រង់ផ្ទះបាយភ្លាមៗ</p>
            <img src="${qrCodeImageUrl}" alt="Chef Login QR" />
            <div class="credentials">
              <div><strong>👨‍🍳 ឈ្មោះចុងភៅ:</strong> ${chefName}</div>
              <div><strong>🔑 លេខសម្ងាត់:</strong> ${chefPassword}</div>
              <div><strong>🏪 ហាង:</strong> ${config.name_en || tenantId}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-5 sm:p-6 rounded-3xl border border-stone-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg font-kulen tracking-wide text-white">
              {lang === 'km' ? 'គណនីចុងភៅ & QR Scan ចូលផ្ទះបាយ (Chef Credentials & Fast QR Login)' : 'Chef Credentials & Quick-Login QR Station'}
            </h2>
            <p className="text-xs text-stone-300 font-battambang">
              {lang === 'km'
                ? 'កំណត់ឈ្មោះ និងលេខសម្ងាត់ចុងភៅ ព្រមទាំងបង្កើតប័ណ្ណ QR កូដសម្រាប់ចុងភៅស្កេនចូលអេក្រង់ Kitchen Tablet ភ្លាមៗ'
                : 'Set chef credentials and print a quick-login QR code for kitchen tablets.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrintChefQr}
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold px-4 py-2.5 rounded-2xl text-xs transition shadow-md active:scale-95 flex items-center justify-center gap-2 font-khmer cursor-pointer shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>{lang === 'km' ? 'ព្រីនប័ណ្ណ QR ចុងភៅ' : 'Print Chef QR Placard'}</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form to Set Chef Name & Password */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-stone-900 font-kulen">
              {lang === 'km' ? 'កំណត់ឈ្មោះ & លេខសម្ងាត់ចុងភៅ' : 'Set Chef Name & Password'}
            </h3>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-4">
            {/* Chef Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'ឈ្មោះចុងភៅ (Chef Name / Identifier)' : 'Chef Name / Station'}
              </label>
              <div className="relative">
                <ChefHat className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={chefName}
                  onChange={(e) => setChefName(e.target.value)}
                  placeholder="e.g. ចុងភៅដារ៉ា ឬ Main Chef 1"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <p className="text-[10px] text-stone-400 font-battambang">
                {lang === 'km' ? 'ឈ្មោះនេះប្រើសម្រាប់ចុងភៅវាយបញ្ចូលពេល Login ដោយដៃ' : 'Used when logging in manually via username.'}
              </p>
            </div>

            {/* Chef Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'លេខសម្ងាត់ចុងភៅ (Chef Password)' : 'Chef Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={chefPassword}
                  onChange={(e) => setChefPassword(e.target.value)}
                  placeholder="e.g. chef1234"
                  className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-stone-400 font-battambang">
                {lang === 'km' ? 'លេខសម្ងាត់យ៉ាងហោចណាស់ ៤-៦ ខ្ទង់ (អក្សរ ឬលេខ)' : 'At least 4-6 characters for kitchen login.'}
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-stone-900 hover:bg-black text-white py-3 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-md active:scale-98 flex items-center justify-center gap-2 font-khmer cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>{isSaving ? (lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (lang === 'km' ? 'រក្សាទុកព័ត៌មានចុងភៅ' : 'Save Chef Account')}</span>
              </button>
            </div>
          </form>

          {/* Direct Link Copy */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 font-kulen">
              <span>{lang === 'km' ? 'តំណភ្ជាប់ចូលផ្ទះបាយរហ័ស' : 'Fast-Login Direct Link'}</span>
              {copied && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> {lang === 'km' ? 'បានចម្លង!' : 'Copied!'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={chefLoginUrl}
                className="w-full bg-stone-100 text-stone-600 text-xs px-3 py-2 rounded-xl border border-stone-200 font-mono truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 p-2 rounded-xl border border-stone-300 transition active:scale-95 shrink-0"
                title="Copy URL"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Printable Chef QR Code Placard */}
        <div className="bg-stone-900 text-white p-6 rounded-3xl border border-stone-800 shadow-xl flex flex-col items-center justify-between text-center space-y-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider font-kulen">
              <Zap className="w-3 h-3 fill-stone-950" />
              <span>Chef Fast-Login QR</span>
            </span>
            <h3 className="text-base sm:text-lg font-extrabold font-kulen text-white pt-1">
              {lang === 'km' ? 'ស្កេន QR ចូលអេក្រង់ផ្ទះបាយភ្លាមៗ' : 'Scan QR for Instant Kitchen Access'}
            </h3>
            <p className="text-xs text-stone-400 font-battambang">
              {lang === 'km'
                ? 'ចុងភៅគ្រាន់តែបើកកាមេរ៉ាស្កេនលើ Tablet/ទូរស័ព្ទ ប្រព័ន្ធនឹងបើកអេក្រង់ផ្ទះបាយភ្លាម'
                : 'Kitchen staff can scan this with any phone/iPad to log in immediately without typing passwords.'}
            </p>
          </div>

          {/* High-Contrast Scannable QR Frame */}
          <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-amber-500/80">
            <img
              src={qrCodeImageUrl}
              alt="Chef Quick-Login QR"
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
            />
          </div>

          {/* Quick Info & Action Buttons */}
          <div className="w-full space-y-3 pt-2">
            <div className="bg-stone-950/80 p-3 rounded-2xl border border-stone-800 text-left text-xs font-battambang text-stone-300 space-y-1">
              <div><strong className="text-amber-400">👨‍🍳 ឈ្មោះ:</strong> {chefName}</div>
              <div><strong className="text-amber-400">🔑 លេខសម្ងាត់:</strong> {chefPassword}</div>
              <div><strong className="text-amber-400">🏪 ហាង:</strong> {config.name_km || config.name_en || tenantId}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintChefQr}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 py-2.5 rounded-xl text-xs font-extrabold transition shadow-md active:scale-95 flex items-center justify-center gap-2 font-khmer cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'km' ? 'ព្រីនប័ណ្ណ QR បិទជញ្ជាំង' : 'Print QR Placard'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2.5 rounded-xl text-xs font-bold transition border border-stone-700 active:scale-95 flex items-center gap-1.5 font-khmer cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{lang === 'km' ? 'ចម្លង Link' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
