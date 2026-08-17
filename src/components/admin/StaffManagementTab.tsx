import React, { useState } from 'react';
import { 
  ChefHat, 
  UserPlus, 
  Trash2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  UtensilsCrossed, 
  KeyRound, 
  Mail, 
  Lock, 
  User, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Briefcase,
  HelpCircle,
  QrCode,
  ArrowRight,
  Shield,
  Loader2
} from 'lucide-react';
import { useTenant } from '../../lib/TenantContext';
import { TenantRole, TenantStaffMember } from '../../types';

interface StaffManagementTabProps {
  lang: 'km' | 'en';
}

export const StaffManagementTab: React.FC<StaffManagementTabProps> = ({ lang }) => {
  const { 
    tenantId, 
    tenantInfo, 
    staffList, 
    registerChefAccount, 
    removeStaffMember, 
    publicMenuUrl 
  } = useTenant();

  // Registration Form State: STRICTLY Name + Password + Role
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<TenantRole>('chef');
  const [station, setStation] = useState('Main Kitchen (ផ្ទះបាយធំ)');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recentlyCreated, setRecentlyCreated] = useState<{
    name: string;
    email: string;
    password: string;
    role: TenantRole;
    pin: string;
    station: string;
  } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | TenantRole>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  // Generate random strong password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789#@!';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    setShowPassword(true);
  };

  // Submit new chef / staff with Name and Password only
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setFormError(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះចុងភៅ!' : 'Please enter chef name!');
      return;
    }
    if (!password || password.length < 6) {
      setFormError(lang === 'km' ? 'លេខសម្ងាត់ Password ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ!' : 'Password must be at least 6 characters!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerChefAccount({
        name: cleanName,
        password,
        role,
        pin: '1234',
        station: station.trim()
      });

      setRecentlyCreated({
        name: cleanName,
        email: res.email,
        password,
        role,
        pin: '1234',
        station: station.trim()
      });

      // Clear inputs
      setName('');
      setPassword('');
      setStation('Main Kitchen (ផ្ទះបាយធំ)');
    } catch (err: any) {
      setFormError(err.message || (lang === 'km' ? 'បរាជ័យក្នុងការចុះឈ្មោះគណនី!' : 'Failed to register account!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy credentials to clipboard
  const handleCopyCredentials = (creds: { name: string; email?: string; password?: string; pin?: string; role: string; station?: string }) => {
    const text = `🍽️ ${tenantInfo?.shopName || 'Restaurant'} - ${lang === 'km' ? 'គណនីចុងភៅសម្រាប់ចូល Login' : 'Chef Login Credentials'}
👤 ${lang === 'km' ? 'ឈ្មោះចុងភៅ (Name)' : 'Chef Name'}: ${creds.name}
🔑 ${lang === 'km' ? 'លេខសម្ងាត់ (Password)' : 'Password'}: ${creds.password || '(As registered)'}
🏷️ ${lang === 'km' ? 'តួនាទី (Role)' : 'Role'}: ${creds.role.toUpperCase()}
📍 ${lang === 'km' ? 'ផ្នែក (Station)' : 'Station'}: ${creds.station || 'Main Kitchen'}
🌐 ${lang === 'km' ? 'ចូលអេក្រង់ចុងភៅតាមរយៈ' : 'Login at'}: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedId(creds.name);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Delete staff member
  const handleDelete = async (uid: string, staffName: string) => {
    if (!window.confirm(
      lang === 'km' 
        ? `តើអ្នកប្រាកដជាចង់លុបគណនី "${staffName}" នេះចេញពីបញ្ជីបុគ្គលិក?`
        : `Are you sure you want to remove staff account "${staffName}"?`
    )) {
      return;
    }

    setDeletingUid(uid);
    try {
      await removeStaffMember(uid);
    } catch (e: any) {
      alert(`Error removing staff: ${e.message}`);
    } finally {
      setDeletingUid(null);
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.station && s.station.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = filterRole === 'all' || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-stone-950 text-white p-5 sm:p-6 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-950/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg font-kulen tracking-wide text-white">
                {lang === 'km' ? 'គ្រប់គ្រងគណនីបុគ្គលិក & ចុងភៅ' : 'Chef & Staff Account Management'}
              </h3>
              <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono font-bold">
                {staffList.length} {lang === 'km' ? 'គណនី' : 'Accounts'}
              </span>
            </div>
            <p className="text-xs text-amber-100/80 font-battambang mt-0.5">
              {lang === 'km' 
                ? 'Admin បង្កើតគណនីចុងភៅដោយប្រើតែ «ឈ្មោះ» និង «លេខសម្ងាត់ Password» យ៉ាងងាយស្រួល'
                : 'Admin registers chefs using only "Name" and "Password" for quick and simple kitchen access'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-amber-300 uppercase font-mono block">Active Shop</span>
            <span className="text-xs font-bold text-white font-khmer">{tenantInfo?.shopName || tenantId}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Registration Form on Left, Active List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: REGISTRATION FORM (NAME + PASSWORD ONLY) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-stone-900 text-sm font-kulen tracking-wide">
                  {lang === 'km' ? 'ចុះឈ្មោះចុងភៅថ្មី (Name & Password)' : 'Register New Chef (Name & Password)'}
                </h4>
                <p className="text-[11px] text-stone-500 font-battambang">
                  {lang === 'km' ? 'ត្រូវការតែ ឈ្មោះ និង លេខសម្ងាត់ ប៉ុណ្ណោះ' : 'Requires only Name and Password'}
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs flex items-start gap-2 border border-red-200 font-battambang animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Chef Name */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 font-khmer flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'km' ? 'ឈ្មោះចុងភៅ (Chef Name) *' : 'Chef Name *'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'km' ? 'ឧ. Sokha ឬ ពិសិដ្ឋ' : 'e.g. Sokha or Chef Meng'}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700 font-khmer flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lang === 'km' ? 'លេខសម្ងាត់ Password *' : 'Password *'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-amber-700 hover:text-amber-900 font-bold inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>{lang === 'km' ? 'បង្កើតកូដស្វ័យប្រវត្តិ' : 'Auto Generate'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">
                  {lang === 'km' ? 'យ៉ាងហោច ៦ ខ្ទង់' : 'Min 6 characters'}
                </span>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 font-khmer flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'km' ? 'តួនាទី (Role) *' : 'Role *'}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('chef')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      role === 'chef'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <ChefHat className={`w-4 h-4 ${role === 'chef' ? 'text-amber-600' : 'text-stone-400'}`} />
                    <div>
                      <span className="block font-khmer text-xs">{lang === 'km' ? 'ចុងភៅ (Chef)' : 'Chef'}</span>
                      <span className="text-[9px] text-stone-500 block">Kitchen Tablet</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('waiter')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      role === 'waiter'
                        ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-500/20'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <UtensilsCrossed className={`w-4 h-4 ${role === 'waiter' ? 'text-blue-600' : 'text-stone-400'}`} />
                    <div>
                      <span className="block font-khmer text-xs">{lang === 'km' ? 'រត់តុ (Waiter)' : 'Waiter'}</span>
                      <span className="text-[9px] text-stone-500 block">Floor Staff</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Station / Area */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 font-khmer flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'km' ? 'ផ្នែក / កន្លែងធ្វើការ (Station)' : 'Station / Area'}</span>
                </label>
                <select
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-khmer"
                >
                  <option value="Main Kitchen (ផ្ទះបាយធំ)">Main Kitchen (ផ្ទះបាយធំ)</option>
                  <option value="BBQ & Grill (ផ្នែកអាំង & ដុត)">BBQ & Grill (ផ្នែកអាំង & ដុត)</option>
                  <option value="Soup & Noodle Station (ផ្នែកសម្ល & គុយទាវ)">Soup & Noodle Station (ផ្នែកសម្ល & គុយទាវ)</option>
                  <option value="Drink & Dessert Bar (បារភេសជ្ជៈ & បង្អែម)">Drink & Dessert Bar (បារភេសជ្ជៈ & បង្អែម)</option>
                  <option value="Dining Floor (សាលទទួលភ្ញៀវ)">Dining Floor (សាលទទួលភ្ញៀវ)</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition disabled:opacity-60 font-khmer cursor-pointer pt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'km' ? 'កំពុងបង្កើតគណនី...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{lang === 'km' ? 'ចុះឈ្មោះចុងភៅ (Register Chef)' : 'Register Chef Account'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recently Created Credentials Notification Box */}
          {recentlyCreated && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold font-khmer">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'km' ? 'បានចុះឈ្មោះជោគជ័យ!' : 'Account Created Successfully!'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCredentials(recentlyCreated)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 font-khmer shadow-xs cursor-pointer"
                >
                  {copiedId === recentlyCreated.name ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'km' ? 'បានចម្លង!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{lang === 'km' ? 'ចម្លងព័ត៌មាន' : 'Copy Credentials'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-200 text-xs space-y-1.5 text-stone-800">
                <p className="flex justify-between items-center"><span className="text-emerald-900 font-bold font-khmer">{lang === 'km' ? 'ឈ្មោះចុងភៅ' : 'Chef Name'}:</span> <strong className="font-mono text-sm text-stone-950 bg-stone-100 px-2 py-0.5 rounded-md">{recentlyCreated.name}</strong></p>
                <p className="flex justify-between items-center"><span className="text-emerald-900 font-bold font-khmer">{lang === 'km' ? 'លេខសម្ងាត់ Password' : 'Password'}:</span> <strong className="font-mono text-sm text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">{recentlyCreated.password}</strong></p>
                <p className="flex justify-between items-center text-[11px]"><span className="text-stone-500">{lang === 'km' ? 'តួនាទី' : 'Role'}:</span> <span className="font-bold uppercase text-stone-700">{recentlyCreated.role}</span></p>
              </div>

              <p className="text-[11px] text-emerald-800 font-battambang">
                {lang === 'km'
                  ? '💡 ចុងភៅអាចយក ឈ្មោះ និង Password នេះទៅ Login ចូល Kitchen Tablet បានភ្លាមៗ។'
                  : '💡 Chef can use this Name and Password to sign in directly on the Kitchen Tablet login screen.'}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIVE STAFF & CHEFS DIRECTORY */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
            
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-stone-900 text-sm sm:text-base font-kulen tracking-wide">
                  {lang === 'km' ? 'បញ្ជីចុងភៅ & បុគ្គលិកក្នុងហាង' : 'Staff & Chef Directory'}
                </h4>
                <p className="text-[11px] text-stone-500 font-battambang">
                  {lang === 'km' ? 'គណនីទាំងអស់ដែលមានសិទ្ធិចូលប្រើប្រាស់ប្រព័ន្ធ' : 'Active authorized accounts for this restaurant'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Role Filter */}
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 font-khmer cursor-pointer"
                >
                  <option value="all">{lang === 'km' ? 'ទាំងអស់ (All Roles)' : 'All Roles'}</option>
                  <option value="chef">{lang === 'km' ? 'ចុងភៅ (Chef)' : 'Chef'}</option>
                  <option value="waiter">{lang === 'km' ? 'រត់តុ (Waiter)' : 'Waiter'}</option>
                  <option value="manager">{lang === 'km' ? 'អ្នកគ្រប់គ្រង (Manager)' : 'Manager'}</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'km' ? 'ស្វែងរកតាមឈ្មោះ ឬផ្នែក...' : 'Search by name or station...'}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Staff Cards List */}
            {filteredStaff.length === 0 ? (
              <div className="text-center py-10 px-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                <ChefHat className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <h5 className="font-bold text-stone-700 text-sm font-khmer">
                  {lang === 'km' ? 'មិនទាន់មានគណនីចុងភៅនៅឡើយទេ' : 'No staff accounts registered yet'}
                </h5>
                <p className="text-xs text-stone-500 font-battambang mt-1 max-w-sm mx-auto">
                  {lang === 'km'
                    ? 'សូមបំពេញទម្រង់បែបបទនៅខាងឆ្វេង (ឈ្មោះ & Password) ដើម្បីបង្កើតគណនីសម្រាប់ចុងភៅដំបូងរបស់អ្នក។'
                    : 'Use the form on the left to register a chef with Name and Password.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStaff.map((staff) => {
                  const isChef = staff.role === 'chef';
                  const isManager = staff.role === 'manager';

                  return (
                    <div
                      key={staff.uid}
                      className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-2xs ${
                          isChef 
                            ? 'bg-amber-600' 
                            : isManager 
                            ? 'bg-purple-600' 
                            : 'bg-blue-600'
                        }`}>
                          {isChef ? <ChefHat className="w-5 h-5" /> : isManager ? <ShieldCheck className="w-5 h-5" /> : <UtensilsCrossed className="w-5 h-5" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-extrabold text-stone-900 text-sm font-khmer">
                              {staff.name}
                            </h5>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isChef 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : isManager 
                                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {staff.role}
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md font-semibold">
                              Active
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
                            <span className="text-stone-400">{lang === 'km' ? 'ឈ្មោះ Login' : 'Login Name'}:</span>
                            <span className="font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded-md">{staff.name}</span>
                          </div>

                          {staff.station && (
                            <div className="text-[11px] text-stone-600 font-battambang flex items-center gap-1">
                              <span className="text-amber-700 font-semibold">📍 {staff.station}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(staff)}
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-amber-50 text-stone-700 hover:text-amber-800 border border-stone-200 hover:border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1 font-khmer cursor-pointer"
                          title="Copy login details"
                        >
                          {copiedId === staff.name ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[11px] text-emerald-700">{lang === 'km' ? 'ចម្លង' : 'Copied'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-stone-500" />
                              <span className="text-[11px]">{lang === 'km' ? 'ចម្លង' : 'Copy'}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={deletingUid === staff.uid}
                          onClick={() => handleDelete(staff.uid, staff.name)}
                          className="p-1.5 bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-600 border border-stone-200 hover:border-red-200 rounded-xl transition cursor-pointer"
                          title="Delete staff account"
                        >
                          {deletingUid === staff.uid ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chef Login Guide Box */}
          <div className="bg-stone-900 text-white p-5 rounded-3xl border border-stone-800 shadow-md space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-900 flex items-center justify-center font-bold">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm font-kulen tracking-wide text-amber-400">
                  {lang === 'km' ? 'របៀបដែលចុងភៅ Login ចូលប្រើប្រាស់ (Chef Login Instructions)' : 'How Chefs Access the Kitchen Tablet'}
                </h4>
                <p className="text-[11px] text-stone-300 font-battambang">
                  {lang === 'km' ? 'ចុងភៅចូល Login ដោយប្រើតែ «ឈ្មោះ» និង «លេខសម្ងាត់ Password» ប៉ុណ្ណោះ' : 'Chefs log in simply by entering their Name and Password'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-300 pt-1">
              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700/60">
                <span className="font-bold text-amber-300 block mb-1 font-khmer">ជំហានទី ១:</span>
                <p className="text-[11px] font-battambang">
                  {lang === 'km'
                    ? 'បើកកម្មវិធីភោជនីយដ្ឋាន ហើយចូលទៅកាន់ផ្ទាំង "ផ្ទះបាយ (Kitchen Login)"'
                    : 'Open the app and select the "Kitchen Login" tab'}
                </p>
              </div>

              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700/60">
                <span className="font-bold text-amber-300 block mb-1 font-khmer">ជំហានទី ២:</span>
                <p className="text-[11px] font-battambang">
                  {lang === 'km'
                    ? 'វាយបញ្ចូល «ឈ្មោះចុងភៅ» និង «Password» ដែល Admin បានចុះឈ្មោះជូន'
                    : 'Enter the Chef Name and Password provided by Admin'}
                </p>
              </div>

              <div className="bg-stone-800/80 p-3 rounded-2xl border border-stone-700/60">
                <span className="font-bold text-amber-300 block mb-1 font-khmer">ជំហានទី ៣:</span>
                <p className="text-[11px] font-battambang">
                  {lang === 'km'
                    ? 'ប្រព័ន្ធនឹងបើកផ្ទាំង Kitchen Tablet ផ្ទាល់ ដើម្បីមើល និងគ្រប់គ្រងការកម្មង់តាម Real-time'
                    : 'The live Kitchen Tablet order board opens immediately with real-time incoming orders'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
