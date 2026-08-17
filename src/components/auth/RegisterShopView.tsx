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
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  ChefHat
} from 'lucide-react';
import { registerFirebaseUser } from '../../lib/firebase';
import { createTenantShop } from '../../lib/tenancy';
import { TenantPlan } from '../../types';

interface RegisterShopViewProps {
  onRegisterSuccess: (tenantId: string) => void;
  onSwitchToLogin: () => void;
  lang: 'km' | 'en';
}

export const RegisterShopView: React.FC<RegisterShopViewProps> = ({
  onRegisterSuccess,
  onSwitchToLogin,
  lang
}) => {
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan>('pro');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setErrorMsg(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះភោជនីយដ្ឋាន/ហាងរបស់អ្នក!' : 'Please enter your restaurant/shop name!');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg(lang === 'km' ? 'សូមបំពេញ Email និង Password ឲ្យបានគ្រប់គ្រាន់!' : 'Please enter both Email and Password!');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(lang === 'km' ? 'លេខសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ ខ្ទង់!' : 'Password must be at least 6 characters!');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(lang === 'km' ? 'លេខសម្ងាត់ផ្ទៀងផ្ទាត់មិនត្រូវគ្នាទេ!' : 'Passwords do not match!');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Create Firebase Auth user
      const user = await registerFirebaseUser(email, password);

      // 2. Create dedicated tenant shop in Firestore: /tenants/{tenantId} & link /users/{uid}
      const result = await createTenantShop({
        ownerUid: user.uid,
        ownerEmail: user.email || email,
        shopName: shopName.trim(),
        plan: selectedPlan
      });

      onRegisterSuccess(result.tenantId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-stone-100">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-xl mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-kulen tracking-wide text-amber-400">
            {lang === 'km' ? 'ចុះឈ្មោះបង្កើតហាងថ្មី (SaaS Tenant)' : 'Create Restaurant Shop'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 font-battambang">
            {lang === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងភោជនីយដ្ឋានឌីជីថល TableQR Multi-Tenant' : 'Dedicated Digital Menu & POS Workspace'}
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white text-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Shop Name */}
            <div className="space-y-1">
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
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Admin Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1 font-khmer">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'km' ? 'អ៊ីមែលអ្នកគ្រប់គ្រង (Admin Email)' : 'Admin Email Address'}</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@restaurant.com"
                required
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1 font-khmer">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'km' ? 'លេខសម្ងាត់' : 'Password'}</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1 font-khmer">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'km' ? 'ផ្ទៀងផ្ទាត់' : 'Confirm'}</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Subscription Plan selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1 font-khmer">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'km' ? 'កញ្ចប់សេវាកម្ម (Plan Tier)' : 'Select Plan Tier'}</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', name: 'Normal', icon: Zap, desc: 'POS & Menu' },
                  { id: 'pro', name: 'Pro', icon: Sparkles, desc: 'TTS + Bot' },
                  { id: 'max', name: 'Max', icon: Crown, desc: 'Multi-Staff' },
                ].map((p) => {
                  const isSelected = selectedPlan === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p.id as TenantPlan)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/50 text-amber-950 font-bold'
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase">{p.name}</span>
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-600' : 'text-stone-400'}`} />
                      </div>
                      <span className="text-[9px] text-stone-500 mt-1">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-khmer mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'km' ? 'កំពុងបង្កើតហាង...' : 'Provisioning Tenant Shop...'}</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>{lang === 'km' ? 'ចុះឈ្មោះ & បង្កើតហាងភ្លាមៗ' : 'Register & Launch Shop'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login link */}
          <div className="text-center pt-2 border-t border-stone-100 text-xs text-stone-600 font-battambang">
            <span>{lang === 'km' ? 'មានគណនីរួចហើយ?' : 'Already registered?'} </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
            >
              {lang === 'km' ? 'ចូលប្រើប្រាស់ (Sign In)' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
