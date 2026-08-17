import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  ChefHat, 
  LayoutDashboard, 
  QrCode, 
  ShoppingBag, 
  Globe, 
  DollarSign,
  Settings,
  ShieldCheck, 
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { RestaurantConfig } from '../types';
import { User } from 'firebase/auth';

export type AppView = 'landing' | 'login' | 'register' | 'customer' | 'kitchen' | 'admin' | 'table_qr';

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  currentTable: number;
  onSelectTable: (table: number) => void;
  lang: 'km' | 'en';
  onToggleLang: () => void;
  currency: 'USD' | 'KHR';
  onToggleCurrency: () => void;
  config: RestaurantConfig;
  activeKitchenOrdersCount: number;
  onOpenStaffLogin: () => void;
  authUser?: User | null;
  userRole?: 'admin' | 'chef' | 'waiter' | 'staff' | 'manager';
  onOpenFirebaseLogin?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  cartItemCount,
  onOpenCart,
  currentTable,
  onSelectTable,
  lang,
  onToggleLang,
  currency,
  onToggleCurrency,
  config,
  activeKitchenOrdersCount,
  onOpenStaffLogin,
  authUser,
  userRole = 'admin',
  onOpenFirebaseLogin,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isChefUser = userRole === 'chef' || currentView === 'kitchen';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 shadow-xs">
      {/* Top Utility Bar */}
      <div className="hidden sm:flex max-w-7xl mx-auto px-3 sm:px-6 py-1.5 items-center justify-between border-b border-stone-100 text-xs text-stone-600">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-kulen text-[11px]">{lang === 'km' ? 'ប្រព័ន្ធកម្មង់ឌីជីថល' : 'Digital Tabletop POS'}</span>
          </span>
          <span className="text-stone-300">|</span>
          <span className="flex items-center gap-1 font-kulen text-stone-600 text-xs">
            {config.name_km || 'ភោជនីយដ្ឋាន ស្មាតម៉ឺនុយ'} {config.name_en ? `(${config.name_en})` : ''}
          </span>
        </div>

        {/* Global Controls: Table Selector, Currency, Language */}
        <div className="flex items-center gap-2">
          {/* Table quick selector */}
          <div className="flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200">
            <span className="text-stone-500 font-semibold text-[11px] font-kulen">
              {lang === 'km' ? 'តុ:' : 'Table:'}
            </span>
            <select
              id="global-table-select"
              value={currentTable}
              onChange={(e) => onSelectTable(Number(e.target.value))}
              className="bg-transparent font-bold text-stone-900 focus:outline-hidden cursor-pointer text-xs font-kulen"
            >
              {Array.from({ length: config.tablesCount || 20 }, (_, i) => i + 1).map((t) => (
                <option key={t} value={t}>
                  {lang === 'km' ? `តុ ${t}` : `T-${t}`}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Toggle */}
          <button
            id="currency-toggle-btn"
            onClick={onToggleCurrency}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 font-semibold text-stone-800 transition text-xs font-mono"
            title="Toggle USD / KHR"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currency}</span>
          </button>

          {/* Language Toggle */}
          <button
            id="lang-toggle-btn"
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 font-semibold text-stone-800 transition text-xs"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-kulen">{lang === 'km' ? 'ខ្មែរ' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Main Brand & Clean Action Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand Logo & Title */}
        <div 
          onClick={() => onViewChange('customer')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition shrink-0 overflow-hidden border border-amber-400/30">
            <img
              src={config.logoUrl || './p'}
              alt={config.name_en || 'Store Logo'}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg text-stone-900 tracking-tight font-kulen block leading-tight">
              {lang === 'km' ? (config.name_km || 'ភោជនីយដ្ឋាន ស្មាតម៉ឺនុយ') : (config.name_en || 'SmartMenu')}
            </span>
            <p className="text-[10px] sm:text-[11px] text-stone-500 leading-none font-battambang mt-0.5">
              {lang === 'km' ? `តុលេខ #${currentTable} • កម្មង់តាមទូរស័ព្ទ` : `Table #${currentTable} • Phone Order`}
            </p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Mode Notice for Chef/Admin/TableQR */}
          {currentView !== 'customer' && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 px-2 py-1 rounded-xl">
              {currentView === 'kitchen' && (
                <ChefHat className="w-3.5 h-3.5 text-amber-700" />
              )}
              {currentView === 'admin' && (
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              )}
              {currentView === 'table_qr' && (
                <QrCode className="w-3.5 h-3.5 text-blue-700" />
              )}
              
              <span className="text-[11px] font-bold text-stone-800 font-kulen hidden sm:inline">
                {currentView === 'kitchen' ? (lang === 'km' ? 'ចុងភៅ' : 'Chef') : currentView === 'admin' ? (lang === 'km' ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard') : 'QR Mode'}
              </span>

              <button
                onClick={() => onViewChange('customer')}
                className="ml-1 text-[10px] bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 px-1.5 py-0.5 rounded-md font-bold transition flex items-center gap-0.5 font-kulen"
                title="Return to Customer Menu"
              >
                <LogOut className="w-2.5 h-2.5" />
                <span>{lang === 'km' ? 'ចេញ' : 'Exit'}</span>
              </button>
            </div>
          )}

          {/* Quick Mobile Bar Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition"
            title="Table & Currency Menu"
          >
            <SlidersHorizontal className="w-4 h-4 text-stone-600" />
          </button>

          {/* Firebase Authenticated User Status */}
          {authUser && (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl shadow-2xs">
              {isChefUser ? (
                <div className="flex items-center gap-1 text-left">
                  <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    <ChefHat className="w-3.5 h-3.5" />
                  </div>
                  <div className="hidden md:block leading-tight">
                    <span className="text-[10px] font-bold text-amber-950 block truncate max-w-[130px]">
                      {authUser.email || 'Chef Account'}
                    </span>
                    <span className="text-[9px] text-amber-700 font-semibold uppercase">
                      {lang === 'km' ? 'ចុងភៅ' : 'Chef'}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onViewChange('admin')}
                  className="flex items-center gap-1 hover:opacity-80 text-left transition cursor-pointer"
                  title={`Logged in as ${authUser.email}`}
                >
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="hidden md:block leading-tight">
                    <span className="text-[10px] font-bold text-purple-900 block truncate max-w-[130px]">
                      {authUser.email}
                    </span>
                    <span className="text-[9px] text-purple-600 font-semibold uppercase">
                      {lang === 'km' ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard'}
                    </span>
                  </div>
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1 hover:bg-amber-100 text-stone-700 hover:text-red-600 rounded-lg transition cursor-pointer"
                  title={lang === 'km' ? 'ចាកចេញ (Log Out)' : 'Log Out'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Settings & Staff / Chef / Admin Login Icon Button (Hidden for Chef, Customer view, and on mobile) */}
          {!isChefUser && currentView !== 'customer' && (
            <button
              id="staff-settings-btn"
              onClick={onOpenStaffLogin}
              className={`hidden sm:flex items-center justify-center sm:gap-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition shadow-2xs border cursor-pointer ${
                currentView !== 'customer'
                  ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
              }`}
              title="Settings & Staff PIN"
            >
              <Settings className="w-4 h-4 text-stone-700" />
              <span className="font-kulen">
                {lang === 'km' ? 'ការកំណត់' : 'Settings'}
              </span>
            </button>
          )}

          {/* Cart Trigger (visible in customer view) */}
          {currentView === 'customer' && (
            <button
              id="open-cart-header-btn"
              onClick={onOpenCart}
              className="relative flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-black text-white px-3 sm:px-3.5 h-9 sm:h-auto sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95 font-kulen"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{lang === 'km' ? 'កន្ត្រក' : 'Cart'}</span>
              {cartItemCount > 0 && (
                <span className="bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded-full text-xs font-bold font-mono leading-tight">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Responsive Mobile Quick Menu Dropdown for Table, Currency & Language */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-stone-50 border-t border-stone-200 px-3 py-2.5 flex items-center justify-between gap-2 text-xs">
          {/* Table quick selector */}
          <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-2xs flex-1">
            <span className="text-stone-500 font-medium text-[11px] font-kulen">
              {lang === 'km' ? 'តុ:' : 'Table:'}
            </span>
            <select
              value={currentTable}
              onChange={(e) => {
                onSelectTable(Number(e.target.value));
                setIsMobileMenuOpen(false);
              }}
              className="bg-transparent font-bold text-stone-900 focus:outline-hidden cursor-pointer text-xs font-kulen w-full"
            >
              {Array.from({ length: config.tablesCount || 20 }, (_, i) => i + 1).map((t) => (
                <option key={t} value={t}>
                  {lang === 'km' ? `តុ ${t}` : `Table ${t}`}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Toggle */}
          <button
            onClick={() => {
              onToggleCurrency();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 font-semibold text-stone-800 shadow-2xs transition text-xs font-mono"
            title="Toggle Currency"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currency}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => {
              onToggleLang();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 font-semibold text-stone-800 shadow-2xs transition text-xs"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-kulen">{lang === 'km' ? 'ខ្មែរ' : 'EN'}</span>
          </button>
        </div>
      )}
    </header>
  );
};
