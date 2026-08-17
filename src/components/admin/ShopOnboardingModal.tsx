import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  Crown, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Check, 
  Store,
  Share2,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useTenant } from '../../lib/TenantContext';
import { TenantPlan } from '../../types';

interface ShopOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'km' | 'en';
}

export const ShopOnboardingModal: React.FC<ShopOnboardingModalProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const { registerShop, tenantId, tenantInfo, publicMenuUrl } = useTenant();
  const [shopName, setShopName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan>('pro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ tenantId: string; slug: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setErrorMsg(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះភោជនីយដ្ឋាន ឬហាងរបស់អ្នក' : 'Please enter your restaurant/shop name');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await registerShop(shopName.trim(), selectedPlan);
      setCreatedResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create shop tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicMenuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white p-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl font-kulen tracking-wide text-amber-400">
                {lang === 'km' ? 'បង្កើតហាងថ្មី (New Restaurant Shop)' : 'Create New Tenant Shop'}
              </h2>
              <p className="text-xs text-stone-300 font-battambang mt-0.5">
                {lang === 'km' ? 'បំបែកទិន្នន័យដាច់ដោយឡែក (100% Isolated Data & Menu)' : 'Dedicated workspace & customer menu link'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {createdResult ? (
            <div className="space-y-4 text-center py-2 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-extrabold text-lg text-stone-900 font-kulen">
                  {lang === 'km' ? 'បង្កើតហាងបានជោគជ័យ!' : 'Restaurant Shop Created!'}
                </h3>
                <p className="text-xs text-stone-500 font-battambang mt-1">
                  {lang === 'km' 
                    ? `ហាង «${shopName}» ត្រូវបានបង្កើតដោយជោគជ័យ ជាមួយកម្រិត Plan: ${selectedPlan.toUpperCase()}`
                    : `Your isolated tenant workspace is live with ${selectedPlan.toUpperCase()} plan.`}
                </p>
              </div>

              {/* Public Menu Link Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 font-khmer">
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'km' ? 'តំណភ្ជាប់ម៉ឺនុយសម្រាប់អតិថិជន' : 'Customer Public Menu URL'}</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    LIVE
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicMenuUrl}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-sm shadow-md transition font-khmer cursor-pointer mt-2"
              >
                {lang === 'km' ? 'បើកផ្ទាំងគ្រប់គ្រង Admin Dashboard' : 'Open Admin Dashboard'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Shop Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1 font-khmer">
                  <Store className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'km' ? 'ឈ្មោះភោជនីយដ្ឋាន / ហាង' : 'Restaurant / Shop Name'}</span>
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={lang === 'km' ? 'ឧ. ឡូយ ភោជនីយដ្ឋាន & កាហ្វេ' : 'e.g. Loyy Khmer Restaurant'}
                  required
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Plan Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1 font-khmer">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'km' ? 'កញ្ចប់សេវាកម្ម (Subscription Plan)' : 'Select Plan'}</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', name: 'Normal', icon: Zap, desc: '10 Tables, POS' },
                    { id: 'pro', name: 'Pro', icon: Sparkles, desc: 'TTS Voice, Telegram' },
                    { id: 'max', name: 'Max', icon: Crown, desc: 'Unlimited & Multi-staff' },
                  ].map((p) => {
                    const isSelected = selectedPlan === p.id;
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlan(p.id as TenantPlan)}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/50 text-amber-950'
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold font-mono uppercase">{p.name}</span>
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-600' : 'text-stone-400'}`} />
                        </div>
                        <span className="text-[10px] text-stone-500 font-sans mt-2">{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-tenancy Isolation Note */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {lang === 'km'
                    ? 'ប្រព័ន្ធនឹងបង្កើត Tenant ID ថ្មីដោយស្វ័យប្រវត្តិ។ មុខម្ហូប ការកម្មង់ និងការកំណត់ទាំងអស់ត្រូវបានបំបែកដាច់ដោយឡែក ១០០%។'
                    : 'A dedicated tenantId will be created. All menu items and orders are logically isolated.'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition"
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lang === 'km' ? 'កំពុងបង្កើត...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{lang === 'km' ? 'បង្កើតហាងថ្មី' : 'Create Shop'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
