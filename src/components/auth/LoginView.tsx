import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  UtensilsCrossed,
  Globe,
  LayoutDashboard,
  ShieldAlert,
  QrCode,
  ChefHat
} from 'lucide-react';
import { loginFirebaseUser, loginWithGoogle } from '../../lib/firebase';
import { recordLoginEvent } from '../../services/api';
import { RestaurantConfig } from '../../types';
import { User } from 'firebase/auth';

interface LoginViewProps {
  onLoginSuccess: (user: User, targetView?: 'admin') => void;
  lang: 'km' | 'en';
  onToggleLang: () => void;
  config: RestaurantConfig;
  onOpenRegisterShop?: () => void;
  onContinueAsGuest?: () => void;
  onOpenStaffPin?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  lang,
  onToggleLang,
  config,
  onContinueAsGuest,
}) => {
  // Focus on Admin Login only (Chef scans QR code generated on Admin Dashboard)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setStatusMessage({
        type: 'error',
        text: lang === 'km' ? 'សូមបញ្ចូលអាសយដ្ឋាន Email Admin!' : 'Please enter admin email address!',
      });
      return;
    }
    if (!password) {
      setStatusMessage({
        type: 'error',
        text: lang === 'km' ? 'សូមបញ្ចូលលេខសម្ងាត់ Password!' : 'Please enter your password!',
      });
      return;
    }
    if (password.length < 6) {
      setStatusMessage({
        type: 'error',
        text: lang === 'km' ? 'លេខសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ ខ្ទង់!' : 'Password must be at least 6 characters!',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage({
      type: 'info',
      text: lang === 'km' ? 'កំពុងផ្ទៀងផ្ទាត់គណនី Admin...' : 'Verifying Admin credentials...',
    });

    try {
      const user = await loginFirebaseUser(identifier, password);
      
      // Auto-record login event in database for registered users API
      recordLoginEvent(user.email || identifier, user.displayName || 'Admin').catch(() => {});

      setStatusMessage({
        type: 'success',
        text: lang === 'km' ? 'ចូលប្រើប្រាស់ជោគជ័យ! កំពុងបើកផ្ទាំងគ្រប់គ្រង Admin Dashboard...' : 'Admin login successful! Redirecting to Admin Dashboard...',
      });

      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(user, 'admin');
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage({
        type: 'error',
        text: err.message || (
          lang === 'km' 
            ? 'ការចូលបរាជ័យ៖ Email មិនទាន់បានចុះឈ្មោះ ឬ Password មិនត្រឹមត្រូវ!' 
            : 'Login failed: Email not registered or invalid password!'
        ),
      });
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMessage({
      type: 'info',
      text: lang === 'km' ? 'កំពុងផ្ទៀងផ្ទាត់គណនី Google...' : 'Connecting to Google...',
    });

    try {
      const user = await loginWithGoogle();
      recordLoginEvent(user.email || 'google_user', user.displayName || 'Google User').catch(() => {});

      setStatusMessage({
        type: 'success',
        text: lang === 'km' ? 'ចូលគណនី Google ជោគជ័យ! កំពុងបើកផ្ទាំងគ្រប់គ្រង...' : 'Google login successful! Opening Dashboard...',
      });

      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(user, 'admin');
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage({
        type: 'error',
        text: err.message || (lang === 'km' ? 'ការចូលដោយប្រើ Google មិនបានសម្រេច!' : 'Google sign-in was not completed!'),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 flex flex-col justify-between text-stone-100 p-4 sm:p-6 md:p-8">
      {/* Top Header Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-lg">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg font-kulen tracking-wide text-amber-400">
              {lang === 'km' ? (config.name_km || config.name_en || 'Loyy Restaurant') : (config.name_en || 'Loyy Restaurant')}
            </h1>
            <p className="text-[11px] text-stone-400 font-battambang">
              {lang === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងភោជនីយដ្ឋានឌីជីថល' : 'Digital Restaurant Management System'}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <button
          id="login-lang-toggle-btn"
          type="button"
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white text-xs font-bold transition shadow-xs cursor-pointer font-khmer"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span>{lang === 'km' ? 'ភាសាខ្មែរ (KM)' : 'English (EN)'}</span>
        </button>
      </div>

      {/* Main Centered Login Box */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white text-stone-900 rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
          
          {/* Card Header */}
          <div className="p-6 relative text-white bg-gradient-to-r from-stone-900 via-purple-950 to-stone-900">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl flex items-center justify-center font-bold shadow-xl shrink-0 bg-purple-600 text-white">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-extrabold text-xl font-kulen tracking-wide text-white">
                  {lang === 'km' ? 'ចូលផ្ទាំងគ្រប់គ្រង Admin Login' : 'Admin Dashboard Login'}
                </h2>
                <p className="text-xs text-stone-300 font-battambang mt-1">
                  {lang === 'km' 
                    ? 'សូមបញ្ចូល Email និង Password គណនីគ្រប់គ្រងរបស់អ្នក' 
                    : 'Sign in with your registered Admin credentials or Google'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-7 space-y-5">
            
            {/* Status Alert */}
            {statusMessage && (
              <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border font-battambang animate-in fade-in ${
                statusMessage.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                {statusMessage.type === 'info' && <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0 mt-0.5" />}
                <span className="font-medium leading-relaxed">{statusMessage.text}</span>
              </div>
            )}

            {/* Google Sign-in for Admin */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-amber-400 text-stone-800 rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-3 transition active:scale-98 cursor-pointer font-khmer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
                </svg>
                <span>{lang === 'km' ? 'ចូលដោយប្រើគណនី Google (Google Login)' : 'Sign In with Google'}</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-px bg-stone-200 flex-1" />
                <span className="text-[11px] font-bold text-stone-400 font-battambang uppercase">
                  {lang === 'km' ? 'ឬចូលដោយ Email & Password' : 'or with email & password'}
                </span>
                <div className="h-px bg-stone-200 flex-1" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Admin Email */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="main-login-identifier" 
                  className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-khmer uppercase tracking-wider"
                >
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>{lang === 'km' ? 'អាសយដ្ឋាន Email Admin' : 'Admin Email Address'}</span>
                </label>
                <div className="relative">
                  <input
                    id="main-login-identifier"
                    type="email"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (statusMessage) setStatusMessage(null);
                    }}
                    placeholder="admin@restaurant.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-2xs"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="main-login-password" 
                    className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-khmer uppercase tracking-wider"
                  >
                    <Lock className="w-3.5 h-3.5 text-purple-600" />
                    <span>{lang === 'km' ? 'លេខសម្ងាត់ Password' : 'Password'}</span>
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {lang === 'km' ? 'យ៉ាងហោច ៦ ខ្ទង់' : 'Min 6 chars'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="main-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (statusMessage) setStatusMessage(null);
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-11 py-3 bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-2xs"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Chef Scan QR Notice */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2.5 font-battambang">
                <ChefHat className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950 font-kulen">
                    {lang === 'km' ? 'សម្រាប់ចុងភៅ (Kitchen Chef):' : 'For Kitchen Chefs:'}
                  </p>
                  <p className="leading-snug text-amber-900">
                    {lang === 'km'
                      ? 'ចុងភៅមិនបាច់វាយពាក្យសម្ងាត់ទេ! គ្រាន់តែស្កេន QR Code ដែលម្ចាស់ហាងព្រីនចេញពីផ្ទាំងគ្រប់គ្រង Admin Dashboard គឺចូលប្រើប្រាស់បានភ្លាមៗ។'
                      : 'Chefs do not need manual password login. Simply scan the Kitchen Fast-Login QR Code generated on the Admin Dashboard.'}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="main-login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed font-khmer cursor-pointer mt-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{lang === 'km' ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{lang === 'km' ? 'ចូលផ្ទាំងគ្រប់គ្រង Admin (Open Admin Dashboard)' : 'Sign In to Admin Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Guest Customer Dining Menu Exit */}
              {onContinueAsGuest && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onContinueAsGuest}
                    className="text-[11px] text-stone-500 hover:text-stone-800 font-battambang underline cursor-pointer"
                  >
                    {lang === 'km' ? '← ទៅកាន់ម៉ឺនុយភ្ញៀវកម្មង់ (Customer Menu)' : '← Open Customer Dining Menu'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-stone-500 font-battambang py-2">
        <p>© {new Date().getFullYear()} {(config.name_km || config.name_en || 'Loyy Restaurant')} • Powered by Firebase Authentication</p>
      </div>
    </div>
  );
};
