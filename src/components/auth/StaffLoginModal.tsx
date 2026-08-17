import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChefHat, 
  ShieldCheck, 
  KeyRound, 
  QrCode, 
  UtensilsCrossed, 
  Check, 
  AlertCircle, 
  Lock, 
  Unlock,
  Settings,
  ArrowRight,
  LogOut,
  Eye,
  EyeOff,
  RotateCcw,
  Mail,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { AppView } from '../Navbar';
import { RestaurantConfig } from '../../types';
import { loginFirebaseUser, loginChefByNameAndPassword } from '../../lib/firebase';
import { User } from 'firebase/auth';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  lang: 'km' | 'en';
  activeKitchenOrdersCount: number;
  config?: RestaurantConfig;
  onResetPasswordToDefault?: (role: 'chef' | 'admin' | 'table_qr') => void;
  onOpenFirebaseLogin?: () => void;
  onLoginSuccess?: (user: User) => void;
}

export type LoginRole = 'chef' | 'admin' | 'table_qr';
export type LoginMethod = 'pin' | 'email';

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  lang,
  activeKitchenOrdersCount,
  config,
  onResetPasswordToDefault,
  onOpenFirebaseLogin,
  onLoginSuccess,
}) => {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('pin');
  const [selectedRole, setSelectedRole] = useState<LoginRole>('chef');
  
  // PIN state
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Email & Password login state (Admin registered credentials)
  const [chefEmail, setChefEmail] = useState<string>('');
  const [chefPassword, setChefPassword] = useState<string>('');
  const [showChefPassword, setShowChefPassword] = useState<boolean>(false);
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Dynamic configured PINs per role with fallback defaults
  const activePins: Record<LoginRole, string> = {
    chef: config?.passwords?.chef || config?.chefPin || '1234',
    admin: config?.passwords?.admin || config?.adminPin || '8888',
    table_qr: config?.passwords?.table_qr || config?.tableQrPin || '1234',
  };

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage('');
      setIsSuccess(false);
      setResetSuccessMessage(null);
      setEmailStatusMessage(null);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, selectedRole, loginMethod]);

  if (!isOpen) return null;

  const currentRolePin = activePins[selectedRole];

  const handleDigit = (digit: string) => {
    if (pin.length < 12) {
      setPin((prev) => prev + digit);
      setErrorMessage('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  const executeLogin = (role: LoginRole) => {
    setIsSuccess(true);
    setTimeout(() => {
      if (role === 'chef') {
        onSelectView('kitchen');
      } else if (role === 'admin') {
        onSelectView('admin');
      } else {
        onSelectView('table_qr');
      }
      setIsSuccess(false);
      setPin('');
      onClose();
    }, 350);
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetPin = activePins[selectedRole];
    
    // Accept matching configured PIN, default factory fallback, or master override 8888/1234/0000
    if (
      pin === targetPin ||
      (selectedRole === 'chef' && (pin === '1234' || pin === '0000')) ||
      (selectedRole === 'admin' && (pin === '8888' || pin === '0000')) ||
      (selectedRole === 'table_qr' && (pin === '1234' || pin === '0000'))
    ) {
      executeLogin(selectedRole);
    } else {
      setErrorMessage(
        lang === 'km' 
          ? `លេខសម្ងាត់មិនត្រឹមត្រូវ! (លេខកូដបច្ចុប្បន្ន: ${targetPin})` 
          : `Incorrect Password/PIN! (Current: ${targetPin})`
      );
    }
  };

  const handleChefEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chefEmail.trim()) {
      setEmailStatusMessage({
        type: 'error',
        text: lang === 'km' ? 'សូមបញ្ចូលឈ្មោះចុងភៅ!' : 'Please enter chef name!',
      });
      return;
    }
    if (!chefPassword) {
      setEmailStatusMessage({
        type: 'error',
        text: lang === 'km' ? 'សូមបញ្ចូលលេខសម្ងាត់ Password!' : 'Please enter chef password!',
      });
      return;
    }

    setIsEmailLoading(true);
    setEmailStatusMessage(null);

    try {
      const user = await loginChefByNameAndPassword(chefEmail, chefPassword);
      setEmailStatusMessage({
        type: 'success',
        text: lang === 'km'
          ? 'ចូលប្រើប្រាស់ជោគជ័យ! កំពុងបើកអេក្រង់ចុងភៅ...'
          : 'Chef login successful! Opening kitchen tablet...',
      });

      setTimeout(() => {
        setIsEmailLoading(false);
        if (onLoginSuccess) onLoginSuccess(user);
        onSelectView('kitchen');
        onClose();
      }, 400);
    } catch (err: any) {
      setIsEmailLoading(false);
      setEmailStatusMessage({
        type: 'error',
        text: err.message || (lang === 'km' ? 'ឈ្មោះចុងភៅមិនទាន់បានចុះឈ្មោះ ឬ Password មិនត្រឹមត្រូវ!' : 'Login failed: Chef name not registered or invalid password!'),
      });
    }
  };

  const handleQuickLogin = (role: LoginRole) => {
    setSelectedRole(role);
    executeLogin(role);
  };

  const handleQuickResetThisRole = () => {
    const defaultVal = selectedRole === 'admin' ? '8888' : '1234';
    if (onResetPasswordToDefault) {
      onResetPasswordToDefault(selectedRole);
    }
    setPin(defaultVal);
    setResetSuccessMessage(
      lang === 'km'
        ? `បានកំណត់ពាក្យសម្ងាត់ឡើងវិញទៅលំនាំដើម (${defaultVal})`
        : `Password reset to factory default (${defaultVal})`
    );
    setTimeout(() => setResetSuccessMessage(null), 3500);
  };

  const handleExitToCustomer = () => {
    onSelectView('customer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg font-khmer flex items-center gap-2">
                <span>{lang === 'km' ? 'ផ្ទាំងចូលចុងភៅ & បុគ្គលិក' : 'Chef & Staff Portal'}</span>
              </h3>
              <p className="text-[11px] text-stone-300 font-battambang">
                {lang === 'km' ? 'ចូលដោយប្រើ Email/Password (Admin ចុះឈ្មោះ) ឬ PIN' : 'Login via Admin-registered Email or PIN'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Mode Notice (if logged into chef/admin) */}
        {currentView !== 'customer' && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold font-battambang">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {lang === 'km' ? 'កំពុងស្ថិតក្នុង:' : 'Active View:'}{' '}
                <strong className="text-amber-800 uppercase font-khmer">
                  {currentView === 'kitchen' ? (lang === 'km' ? 'ចុងភៅ (Chef)' : 'Kitchen Tablet') : currentView === 'admin' ? (lang === 'km' ? 'អ្នកគ្រប់គ្រង (Admin)' : 'Admin Dashboard') : 'QR Station'}
                </strong>
              </span>
            </div>
            <button
              onClick={handleExitToCustomer}
              className="flex items-center gap-1 text-[11px] bg-white hover:bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg border border-amber-300 font-bold transition shadow-2xs font-khmer cursor-pointer"
            >
              <LogOut className="w-3 h-3 text-stone-500" />
              <span>{lang === 'km' ? 'ទៅម៉ឺនុយភ្ញៀវ' : 'Customer View'}</span>
            </button>
          </div>
        )}

        {/* Login Method Toggle: PIN vs Email & Password */}
        <div className="p-3 bg-stone-100 border-b border-stone-200 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('pin');
              setErrorMessage('');
              setEmailStatusMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-khmer transition flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMethod === 'pin'
                ? 'bg-white text-amber-900 shadow-xs border border-amber-300'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === 'km' ? 'ចូលដោយកូដ PIN រហ័ស' : 'Quick Role PIN'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMethod('email');
              setErrorMessage('');
              setEmailStatusMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-khmer transition flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMethod === 'email'
                ? 'bg-white text-amber-900 shadow-xs border border-amber-300'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === 'km' ? 'Email & Password ចុងភៅ' : 'Chef Email & Password'}</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">

          {/* METHOD 1: EMAIL & PASSWORD LOGIN (CHEF / STAFF) */}
          {loginMethod === 'email' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 font-battambang flex items-start gap-2">
                <ChefHat className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950 font-khmer">
                    {lang === 'km' ? 'ចូលប្រើប្រាស់សម្រាប់ចុងភៅ & ផ្ទះបាយ' : 'Chef & Kitchen Staff Login'}
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {lang === 'km'
                      ? 'គណនីចុងភៅត្រូវបានបង្កើត និងផ្ដល់ជូនដោយ Admin នៅក្នុង Admin Dashboard។ មិនមានការចុះឈ្មោះជាសាធារណៈឡើយ។'
                      : 'Chef accounts are registered by the Admin in the Admin Dashboard. Public registration is disabled.'}
                  </p>
                </div>
              </div>

              {emailStatusMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border font-battambang animate-in fade-in ${
                  emailStatusMessage.type === 'error'
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span className="font-medium">{emailStatusMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleChefEmailLogin} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 font-khmer flex items-center gap-1.5">
                    <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lang === 'km' ? 'ឈ្មោះចុងភៅ (Chef Name)' : 'Chef Name'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={chefEmail}
                    onChange={(e) => setChefEmail(e.target.value)}
                    placeholder={lang === 'km' ? 'ឧ. Sokha ឬ ពិសិដ្ឋ' : 'e.g. Sokha or Chef Meng'}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 font-khmer flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lang === 'km' ? 'លេខសម្ងាត់ Password' : 'Password'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showChefPassword ? 'text' : 'password'}
                      required
                      value={chefPassword}
                      onChange={(e) => setChefPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowChefPassword(!showChefPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                    >
                      {showChefPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isEmailLoading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60 font-khmer cursor-pointer mt-2"
                >
                  {isEmailLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{lang === 'km' ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Logging in...'}</span>
                    </>
                  ) : (
                    <>
                      <ChefHat className="w-4 h-4" />
                      <span>{lang === 'km' ? 'ចូលអេក្រង់ផ្ទះបាយ (Kitchen Tablet)' : 'Sign In as Chef'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* METHOD 2: PIN KEYPAD LOGIN */}
          {loginMethod === 'pin' && (
            <>
              {/* Role Selection Cards */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block font-khmer">
                    {lang === 'km' ? 'ជ្រើសរើសប្រភេទគណនី (Login Type):' : 'Select Login Type:'}
                  </label>
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-mono font-semibold">
                    PIN: {currentRolePin}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Chef Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('chef');
                      setErrorMessage('');
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      selectedRole === 'chef'
                        ? 'border-amber-600 bg-amber-50/90 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                        <ChefHat className="w-4 h-4" />
                      </div>
                      {selectedRole === 'chef' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="mt-1.5">
                      <div className="font-extrabold text-xs text-stone-900 font-khmer">
                        {lang === 'km' ? 'ចុងភៅ' : 'Chef'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-battambang truncate">
                        {lang === 'km' ? 'អេក្រង់ផ្ទះបាយ' : 'Kitchen'}
                      </div>
                      {activeKitchenOrdersCount > 0 && (
                        <span className="mt-1 inline-block bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          {activeKitchenOrdersCount} new
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Admin Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('admin');
                      setErrorMessage('');
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'border-purple-600 bg-purple-50/90 shadow-xs ring-2 ring-purple-500/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      {selectedRole === 'admin' && <Check className="w-4 h-4 text-purple-600" />}
                    </div>
                    <div className="mt-1.5">
                      <div className="font-extrabold text-xs text-stone-900 font-khmer">
                        {lang === 'km' ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-battambang truncate">
                        {lang === 'km' ? 'គ្រប់គ្រងហាង' : 'User Dashboard'}
                      </div>
                    </div>
                  </button>

                  {/* Table QR Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('table_qr');
                      setErrorMessage('');
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      selectedRole === 'table_qr'
                        ? 'border-blue-600 bg-blue-50/90 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <QrCode className="w-4 h-4" />
                      </div>
                      {selectedRole === 'table_qr' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="mt-1.5">
                      <div className="font-extrabold text-xs text-stone-900 font-khmer">
                        {lang === 'km' ? 'ប័ណ្ណ QR' : 'Table QRs'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-battambang truncate">
                        {lang === 'km' ? 'ព្រីន QR តុ' : 'Print Station'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick One-Click Unlock Button */}
              <div>
                <button
                  id="quick-role-login-btn"
                  type="button"
                  onClick={() => handleQuickLogin(selectedRole)}
                  className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer ${
                    selectedRole === 'chef'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : selectedRole === 'admin'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span className="font-khmer">{lang === 'km' ? 'កំពុងចូល...' : 'Logging in...'}</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span className="font-khmer">
                        {lang === 'km'
                          ? `ចូលទៅកាន់ ${selectedRole === 'chef' ? 'អេក្រង់ចុងភៅ (Chef)' : selectedRole === 'admin' ? 'ផ្ទាំងគ្រប់គ្រង (Admin)' : 'ប័ណ្ណ QR តុ'}`
                          : `Open ${selectedRole === 'chef' ? 'Chef Tablet' : selectedRole === 'admin' ? 'Admin Dashboard' : 'Table QR Station'}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* PIN keypad and Password Box */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1 font-battambang">
                    <Lock className="w-3.5 h-3.5 text-stone-500" />
                    <span>
                      {lang === 'km' ? 'វាយបញ្ចូលពាក្យសម្ងាត់ (Enter PIN):' : 'Enter Role Password / PIN:'}
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-stone-500 hover:text-stone-800 font-semibold inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-stone-200 rounded-md transition cursor-pointer"
                      title="Toggle Password View"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3 text-stone-600" /> : <Eye className="w-3 h-3 text-stone-600" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickResetThisRole}
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition cursor-pointer"
                      title="Reset this role PIN to default"
                    >
                      <RotateCcw className="w-3 h-3 text-amber-600" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Input / Display Field */}
                <form onSubmit={handlePinSubmit} className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder={lang === 'km' ? `វាយបញ្ចូលលេខសម្ងាត់ (កូដ: ${currentRolePin})` : `Enter PIN (Current: ${currentRolePin})`}
                    className="w-full text-center py-2.5 px-4 bg-white rounded-xl border border-stone-300 font-mono text-base font-bold tracking-widest text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                  />
                </form>

                {/* Reset Notice */}
                {resetSuccessMessage && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5 font-battambang border border-emerald-200 animate-in fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{resetSuccessMessage}</span>
                  </div>
                )}

                {/* Error notice */}
                {errorMessage && (
                  <div className="p-2 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-1.5 font-battambang border border-red-200 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Keypad Grid */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleDigit(num)}
                      className="py-2.5 bg-white hover:bg-amber-50 active:bg-amber-100 text-stone-800 font-bold rounded-xl border border-stone-200 text-sm shadow-2xs transition cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigit('0')}
                    className="py-2.5 bg-white hover:bg-amber-50 active:bg-amber-100 text-stone-800 font-bold rounded-xl border border-stone-200 text-sm shadow-2xs transition cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePinSubmit()}
                    className="py-2.5 bg-stone-900 hover:bg-black text-amber-400 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>OK</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Quick Customer Menu Exit */}
          <div className="pt-1 flex items-center justify-between text-xs text-stone-500">
            <button
              type="button"
              onClick={handleExitToCustomer}
              className="hover:text-amber-700 font-medium flex items-center gap-1.5 transition font-battambang cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'km' ? 'ម៉ឺនុយសម្រាប់ភ្ញៀវកម្មង់ (Customer Menu)' : 'Customer Dining Menu'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 font-medium font-battambang cursor-pointer"
            >
              {lang === 'km' ? 'បិទ (Close)' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

