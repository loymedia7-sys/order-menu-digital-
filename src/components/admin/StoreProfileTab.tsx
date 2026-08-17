import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Upload, 
  Image as ImageIcon, 
  Phone, 
  Clock, 
  MapPin, 
  DollarSign, 
  Wifi, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { RestaurantConfig } from '../../types';

interface StoreProfileTabProps {
  config: RestaurantConfig;
  onUpdateConfig: (newConfig: RestaurantConfig) => Promise<void>;
  lang: 'km' | 'en';
}

export const StoreProfileTab: React.FC<StoreProfileTabProps> = ({
  config,
  onUpdateConfig,
  lang,
}) => {
  const [formData, setFormData] = useState<RestaurantConfig>({
    ...config,
    name_km: config.name_km || '',
    name_en: config.name_en || '',
    phone: config.phone || '',
    logoUrl: config.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    openTime: config.openTime || '07:00',
    closeTime: config.closeTime || '22:00',
    wifiName: config.wifiName || 'SmartMenu_Guest_5G',
    wifiPassword: config.wifiPassword || 'smartmenu8888',
    address_km: config.address_km || '',
    address_en: config.address_en || '',
    tablesCount: config.tablesCount || 20,
    exchangeRate: config.exchangeRate || 4100,
  });

  // Sync state if config is updated externally (e.g. initial Firestore load or tenant change)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...config,
      name_km: config.name_km ?? prev.name_km,
      name_en: config.name_en ?? prev.name_en,
      logoUrl: config.logoUrl ?? prev.logoUrl,
    }));
  }, [config]);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for instant client & cloud storage
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_km.trim() && !formData.name_en.trim()) {
      setFeedback(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះហាងរបស់អ្នក!' : 'Please enter restaurant name!');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateConfig(formData);
      setFeedback(lang === 'km' ? 'បានរក្សាទុកព័ត៌មានហាង & ឡូហ្គោដោយជោគជ័យ!' : 'Successfully saved store profile and logo!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback(e?.message || 'Error saving store profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-base sm:text-lg font-kulen tracking-wide text-stone-900">
              {lang === 'km' ? 'ព័ត៌មានហាង ឡូហ្គោ & ម៉ោងបើក-បិទ (Store Brand & Hours)' : 'Brand, Logo & Operating Hours Profile'}
            </h2>
            <p className="text-xs text-stone-500 font-battambang">
              {lang === 'km'
                ? 'កំណត់ឈ្មោះហាង ឡូហ្គោ លេខទូរស័ព្ទ ម៉ោងបើក-បិទ និងព័ត៌មាន Wi-Fi សម្រាប់បង្ហាញលើម៉ឺនុយ និងវិក្កយបត្រ'
                : 'Configure brand logo, store name, phone numbers, operating hours, and customer Wi-Fi.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition shadow-md active:scale-95 flex items-center justify-center gap-2 font-khmer cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? (lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (lang === 'km' ? 'រក្សាទុកព័ត៌មានហាង' : 'Save Store Profile')}</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Brand Logo Upload & Preview */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4 flex flex-col items-center text-center">
          <h3 className="font-extrabold text-sm font-kulen text-stone-900 self-start">
            {lang === 'km' ? 'ឡូហ្គោហាង (Brand Logo)' : 'Restaurant Logo'}
          </h3>

          {/* Logo Circle Preview */}
          <div className="relative w-36 h-36 rounded-3xl border-4 border-amber-500/30 overflow-hidden bg-stone-100 shadow-lg flex items-center justify-center group">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt="Store Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <Store className="w-12 h-12 text-stone-400" />
            )}
          </div>

          {/* Upload Button */}
          <div className="w-full space-y-2">
            <label className="w-full cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-800 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-stone-300 active:scale-95 font-khmer">
              <Upload className="w-4 h-4 text-amber-600" />
              <span>{lang === 'km' ? 'Upload ឡូហ្គោពីម៉ាស៊ីន' : 'Upload Logo Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileUpload}
                className="hidden"
              />
            </label>

            {/* Direct Image URL input */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-stone-500 font-kulen block">
                {lang === 'km' ? 'ឬបញ្ចូលតំណភ្ជាប់រូបភាព Logo URL' : 'Or Image URL'}
              </label>
              <input
                type="url"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <p className="text-[11px] text-stone-400 font-battambang text-left pt-2 border-t border-stone-100">
            {lang === 'km'
              ? 'ឡូហ្គោនេះនឹងបង្ហាញលើម៉ឺនុយភ្ញៀវ អេក្រង់ចុងភៅ និងលើវិក្កយបត្រព្រីន'
              : 'Appears on customer menu, kitchen header, and printed thermal receipts.'}
          </p>
        </div>

        {/* Center & Right Column: Store Names, Phone, Operating Hours, WiFi */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-5">
          <h3 className="font-extrabold text-sm font-kulen text-stone-900 border-b border-stone-100 pb-3">
            {lang === 'km' ? 'ព័ត៌មានទូទៅ & ម៉ោងដំណើរការ' : 'General Information & Hours'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Khmer Brand Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'ឈ្មោះហាងជាភាសាខ្មែរ (Brand Name KM)' : 'Restaurant Name (Khmer)'}
              </label>
              <input
                type="text"
                value={formData.name_km}
                onChange={(e) => setFormData({ ...formData, name_km: e.target.value })}
                placeholder="e.g. ភោជនីយដ្ឋាន ស្មាតម៉ឺនុយ"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-kulen"
              />
            </div>

            {/* English Brand Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'ឈ្មោះហាងជាភាសាអង់គ្លេស (Brand Name EN)' : 'Restaurant Name (English)'}
              </label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="e.g. SmartMenu Restaurant"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'លេខទូរស័ព្ទទាក់ទង (Phone Number)' : 'Contact Phone Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="012 888 999 / 098 777 666"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Tables Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'ចំនួនតុសរុប (Total Tables)' : 'Total Number of Tables'}
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.tablesCount}
                onChange={(e) => setFormData({ ...formData, tablesCount: Math.max(1, parseInt(e.target.value, 10) || 20) })}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Opening Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'ម៉ោងបើកទ្វារ (Open Time)' : 'Opening Time'}
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Closing Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'ម៉ោងបិទទ្វារ (Close Time)' : 'Closing Time'}
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Wi-Fi Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'ឈ្មោះ Wi-Fi ភ្ញៀវ (Guest Wi-Fi)' : 'Guest Wi-Fi Name'}
              </label>
              <div className="relative">
                <Wifi className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.wifiName || ''}
                  onChange={(e) => setFormData({ ...formData, wifiName: e.target.value })}
                  placeholder="e.g. SmartMenu_Guest_5G"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Wi-Fi Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'លេខសម្ងាត់ Wi-Fi (Wi-Fi Password)' : 'Wi-Fi Password'}
              </label>
              <input
                type="text"
                value={formData.wifiPassword || ''}
                onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                placeholder="e.g. smartmenu8888"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Exchange Rate (KHR/USD) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'អត្រាប្តូរប្រាក់ (1 USD = KHR)' : 'Exchange Rate (1 USD = KHR)'}
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="10"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: parseInt(e.target.value, 10) || 4100 })}
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-stone-700 font-kulen block">
                {lang === 'km' ? 'អាសយដ្ឋានហាង (Restaurant Address)' : 'Restaurant Address'}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  value={formData.address_km}
                  onChange={(e) => setFormData({ ...formData, address_km: e.target.value, address_en: e.target.value })}
                  placeholder="ផ្លូវលេខ ៥១ (ផ្លូវប៉ាស្ទ័រ), សង្កាត់បឹងកេងកង១, ភ្នំពេញ"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-battambang"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-md active:scale-98 flex items-center justify-center gap-2 font-khmer cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? (lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (lang === 'km' ? 'រក្សាទុកការកែប្រែទាំងអស់' : 'Save Changes')}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
