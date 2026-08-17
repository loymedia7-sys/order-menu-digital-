import React, { useState } from 'react';
import { 
  X, 
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
  KeyRound,
  ChefHat,
  ShieldAlert
} from 'lucide-react';
import { loginFirebaseUser } from '../../lib/firebase';
import { User } from 'firebase/auth';

interface FirebaseLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  lang: 'km' | 'en';
  onSwitchToStaffPin?: () => void;
  onContinueAsGuest?: () => void;
}

export const FirebaseLoginModal: React.FC<FirebaseLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  lang,
  onSwitchToStaffPin,
  onContinueAsGuest,
}) => {
  // EXACTLY 2 INPUTS: Email and Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatusMessage({
        type: 'error',
        text: lang === 'km' ? 'សូមបញ្ចូលអាសយដ្ឋាន Email!' : 'Please enter your email address!',
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
      text: lang === 'km' ? 'កំពុងផ្ទៀងផ្ទាត់គណនីលើ Firebase...' : 'Verifying account on Firebase Auth...',
    });

    try {
      const user = await loginFirebaseUser(email, password);
      
      setStatusMessage({
        type: 'success',
        text: lang === 'km'
          ? 'ចូលប្រើប្រាស់ជោគជ័យ! កំពុងបើកផ្ទាំងគ្រប់គ្រង Admin...'
          : 'Logged in successfully! Redirecting to Admin Dashboard...',
      });

      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(user);
        onClose();
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage({
        type: 'error',
        text: err.message || (lang === 'km' ? 'ការចូលបរាជ័យ៖ Email មិនទាន់បានចុះឈ្មោះ ឬ Password មិនត្រឹមត្រូវ!' : 'Login failed: Email not registered on Firebase or invalid password!'),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-lg shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl font-kulen tracking-wide text-amber-400">
                {lang === 'km' ? 'ចូលផ្ទាំងគ្រប់គ្រង (Admin Login)' : 'Admin Portal Login'}
              </h3>
              <p className="text-xs text-stone-300 font-battambang mt-0.5">
                {lang === 'km' 
                  ? 'ផ្ទៀងផ្ទាត់ជាមួយ Firebase • ចូលទៅ Admin ដោយស្វ័យប្រវត្តិ' 
                  : 'Firebase Auth verification • Auto-redirects to Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Login Form Body (Strictly 2 Inputs: Email & Password) */}
        <div className="p-6 space-y-4">
          
          {/* Status Message Notification */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border font-battambang animate-in fade-in ${
              statusMessage.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}>
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0 mt-0.5" />}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* INPUT 1: Email */}
            <div className="space-y-1.5">
              <label 
                htmlFor="firebase-login-email" 
                className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-khmer uppercase tracking-wider"
              >
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'km' ? 'អាសយដ្ឋាន Email' : 'Email Address'}</span>
              </label>
              <div className="relative">
                <input
                  id="firebase-login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
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

            {/* INPUT 2: Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="firebase-login-password" 
                  className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-khmer uppercase tracking-wider"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'km' ? 'លេខសម្ងាត់ Password' : 'Password'}</span>
                </label>
                <span className="text-[10px] text-stone-400 font-mono">
                  {lang === 'km' ? 'យ៉ាងហោច ៦ ខ្ទង់' : 'Min 6 chars'}
                </span>
              </div>
              <div className="relative">
                <input
                  id="firebase-login-password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Strict Firebase Registered User Note */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-[11px] text-stone-600 flex items-start gap-2 font-battambang">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {lang === 'km' 
                  ? 'គណនីត្រូវតែបានចុះឈ្មោះក្នុងប្រព័ន្ធ Firebase ជាមុនសិន។ Email ដែលមិនទាន់ចុះឈ្មោះមិនអាចចូលបានឡើយ។' 
                  : 'Account must be registered on Firebase. Unregistered emails are prevented from logging in.'}
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="firebase-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed font-khmer cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{lang === 'km' ? 'កំពុងដំណើរការ...' : 'Authenticating with Firebase...'}</span>
                </>
              ) : (
                <>
                  <span>{lang === 'km' ? 'ចូលផ្ទាំងគ្រប់គ្រង Admin' : 'Sign In to Admin Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
