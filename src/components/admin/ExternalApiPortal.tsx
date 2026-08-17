import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Key, 
  Copy, 
  Check, 
  Mail, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Code2, 
  Terminal, 
  Play, 
  ExternalLink, 
  Download, 
  Users, 
  FileJson, 
  Globe, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Server,
  Lock,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { RegisteredAdminUser, RestaurantConfig, AllDatabasePayload } from '../../types';
import { 
  fetchRegisteredUsers, 
  registerAdminEmail, 
  deleteRegisteredUser, 
  verifyLoginEmail,
  fetchAllDatabaseSync,
  fetchDatabaseStats 
} from '../../services/api';

interface ExternalApiPortalProps {
  config: RestaurantConfig;
  lang: 'km' | 'en';
  onUpdateConfig: (updated: Partial<RestaurantConfig>) => void;
}

export const ExternalApiPortal: React.FC<ExternalApiPortalProps> = ({
  config,
  lang,
  onUpdateConfig,
}) => {
  // State for Registered Users
  const [users, setUsers] = useState<RegisteredAdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // New Email Form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'superadmin' | 'kitchen'>('admin');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userActionMessage, setUserActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email Verification Tester state
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // API Tester State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('database_all');
  const [testResponse, setTestResponse] = useState<{ status: number; duration: number; data: any } | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [selectedLangSnippet, setSelectedLangSnippet] = useState<'curl' | 'js' | 'python'>('js');

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-restaurant-app.run.app';
  const apiBaseUrl = `${originUrl}/api/v1`;
  const currentApiKey = config.apiKey || 'tableqr_live_sec_8923kjd';

  // Load registered users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await fetchRegisteredUsers();
      if (data && data.users) {
        setUsers(data.users);
      }
    } catch (err: any) {
      console.warn('Failed to load registered users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setUserActionMessage({
        type: 'error',
        text: lang === 'km' ? 'សូមបញ្ចូលអាសយដ្ឋាន Email ត្រឹមត្រូវ!' : 'Please enter a valid email address!',
      });
      return;
    }

    setIsSubmittingUser(true);
    setUserActionMessage(null);
    try {
      const res = await registerAdminEmail({
        email: newEmail.trim(),
        name: newName.trim() || undefined,
        role: newRole,
        notes: newNotes.trim() || undefined,
      });

      setUserActionMessage({
        type: 'success',
        text: lang === 'km' 
          ? `បានចុះឈ្មោះ Email: ${newEmail} ដោយជោគជ័យ!` 
          : `Successfully registered email: ${newEmail}!`,
      });

      setNewEmail('');
      setNewName('');
      setNewNotes('');
      loadUsers();
    } catch (err: any) {
      setUserActionMessage({
        type: 'error',
        text: err.message || (lang === 'km' ? 'ការចុះឈ្មោះបរាជ័យ' : 'Registration failed'),
      });
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!window.confirm(lang === 'km' ? `តើអ្នកប្រាកដជាចង់លុប Email ${email} នេះមែនទេ?` : `Are you sure you want to remove ${email}?`)) {
      return;
    }

    try {
      await deleteRegisteredUser(id);
      loadUsers();
      setUserActionMessage({
        type: 'success',
        text: lang === 'km' ? `បានលុប ${email} រួចរាល់!` : `Removed ${email} successfully!`,
      });
    } catch (err: any) {
      setUserActionMessage({
        type: 'error',
        text: err.message || 'Failed to remove user',
      });
    }
  };

  const handleTestVerifyEmail = async () => {
    if (!verifyInput.trim()) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyLoginEmail(verifyInput.trim());
      setVerifyResult(result);
    } catch (err: any) {
      setVerifyResult({ error: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  // Run Live API Test
  const handleExecuteApiTest = async (endpointKey: string) => {
    setIsTestingApi(true);
    setTestResponse(null);
    const startTime = performance.now();

    try {
      let url = `${apiBaseUrl}/database/all`;
      let method = 'GET';
      let body: any = null;

      if (endpointKey === 'database_all') {
        url = `${apiBaseUrl}/database/all`;
      } else if (endpointKey === 'emails') {
        url = `${apiBaseUrl}/auth/emails`;
      } else if (endpointKey === 'verify_email') {
        url = `${apiBaseUrl}/auth/verify-email`;
        method = 'POST';
        body = JSON.stringify({ email: users[0]?.email || 'jirouvu05@gmail.com' });
      } else if (endpointKey === 'menu') {
        url = `${apiBaseUrl}/menu`;
      } else if (endpointKey === 'orders') {
        url = `${apiBaseUrl}/orders`;
      } else if (endpointKey === 'stats') {
        url = `${apiBaseUrl}/stats`;
      } else if (endpointKey === 'restaurant') {
        url = `${apiBaseUrl}/restaurant`;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentApiKey,
        },
        body: body,
      });

      const data = await res.json();
      const endTime = performance.now();

      setTestResponse({
        status: res.status,
        duration: Math.round(endTime - startTime),
        data,
      });
    } catch (err: any) {
      const endTime = performance.now();
      setTestResponse({
        status: 500,
        duration: Math.round(endTime - startTime),
        data: { error: err.message },
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleDownloadFullDatabase = async () => {
    try {
      const data = await fetchAllDatabaseSync();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tableqr_full_database_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Download failed');
    }
  };

  // Endpoint Definitions
  const endpointsList = [
    {
      id: 'database_all',
      name: lang === 'km' ? 'ទាញទិន្នន័យទាំងអស់ (All Database Sync)' : 'All Database Unified Sync',
      method: 'GET',
      path: '/api/v1/database/all',
      desc_km: 'ទាញយកតារាងទាំងអស់ក្នុងពេលតែមួយ (Menu, Orders, Categories, Config, Users, Stats)',
      desc_en: 'Fetches entire database in a single comprehensive payload for another admin panel',
    },
    {
      id: 'emails',
      name: lang === 'km' ? 'បញ្ជី Email ដែលបានចុះឈ្មោះ (Registered Emails)' : 'All Registered Login Emails',
      method: 'GET',
      path: '/api/v1/auth/emails',
      desc_km: 'ទាញយកបញ្ជី Email ទាំងអស់ដែលមានសិទ្ធិចូលប្រព័ន្ធ Admin',
      desc_en: 'Returns all administrator emails authorized to log in',
    },
    {
      id: 'verify_email',
      name: lang === 'km' ? 'ផ្ទៀងផ្ទាត់ Email ចូលប្រព័ន្ធ (Verify Login Email)' : 'Verify Registered Email',
      method: 'POST',
      path: '/api/v1/auth/verify-email',
      desc_km: 'ពិនិត្យមើលថាតើ Email មួយត្រូវបានចុះឈ្មោះក្នុងប្រព័ន្ធរួចរាល់ឬនៅ',
      desc_en: 'Checks if an email is registered and allowed to sign in',
    },
    {
      id: 'menu',
      name: lang === 'km' ? 'ទិន្នន័យមុខម្ហូប (Menu Database)' : 'Menu Items Collection',
      method: 'GET',
      path: '/api/v1/menu',
      desc_km: 'ទាញយកមុខម្ហូបទាំងអស់ តម្លៃ និងរូបភាព',
      desc_en: 'List all menu dishes, pricing, options, and availability',
    },
    {
      id: 'orders',
      name: lang === 'km' ? 'ទិន្នន័យការកម្មង់ (Live Orders)' : 'Live Orders Stream',
      method: 'GET',
      path: '/api/v1/orders',
      desc_km: 'ទាញយកការកម្មង់តាមតុទាំងអស់ និងស្ថានភាពចុងក្រោយ',
      desc_en: 'Get all live orders, table numbers, and statuses',
    },
    {
      id: 'stats',
      name: lang === 'km' ? 'ស្ថិតិចំណូល & ការលក់ (Revenue Analytics)' : 'Revenue & Sales Analytics',
      method: 'GET',
      path: '/api/v1/stats',
      desc_km: 'ទាញយកស្ថិតិចំណូលគិតជា $ និង ៛ ព្រមទាំងមុខម្ហូបលក់ដាច់បំផុត',
      desc_en: 'Real-time sales breakdown in USD & KHR and top dishes',
    },
    {
      id: 'restaurant',
      name: lang === 'km' ? 'ព័ត៌មានភោជនីយដ្ឋាន (Restaurant Info)' : 'Restaurant Configuration',
      method: 'GET',
      path: '/api/v1/restaurant',
      desc_km: 'ទាញយកព័ត៌មានឈ្មោះ តុ អត្រាប្តូរប្រាក់ និងការកំណត់',
      desc_en: 'Get restaurant name, exchange rate, and system configuration',
    },
  ];

  const currentEndpointObj = endpointsList.find(e => e.id === selectedEndpoint) || endpointsList[0];

  // Code Snippet Generators
  const getCodeSnippet = (endpoint: typeof currentEndpointObj, type: 'curl' | 'js' | 'python') => {
    const fullUrl = `${apiBaseUrl}${endpoint.path.replace('/api/v1', '')}`;
    if (type === 'curl') {
      if (endpoint.method === 'POST') {
        return `curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${currentApiKey}" \\
  -d '{"email": "admin@restaurant.com"}'`;
      }
      return `curl -X GET "${fullUrl}" \\
  -H "x-api-key: ${currentApiKey}"`;
    }

    if (type === 'js') {
      if (endpoint.method === 'POST') {
        return `// Connect from external Admin Panel (JavaScript / TypeScript)
const response = await fetch("${fullUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${currentApiKey}"
  },
  body: JSON.stringify({
    email: "admin@restaurant.com"
  })
});
const data = await response.json();
console.log("Response:", data);`;
      }
      return `// Connect from external Admin Panel (JavaScript / TypeScript)
const response = await fetch("${fullUrl}", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${currentApiKey}"
  }
});
const data = await response.json();
console.log("Database payload:", data);`;
    }

    if (type === 'python') {
      return `# Python requests library
import requests

url = "${fullUrl}"
headers = {
    "x-api-key": "${currentApiKey}"
}
response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)
print(response.json())`;
    }

    return '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Header Banner & Quick Connect Stats */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <Database className="w-80 h-80 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>REST API v1.2.0 • CORS Enabled (All Origins)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-kulen text-amber-400">
              {lang === 'km' ? 'ច្រកតភ្ជាប់ API & ទិន្នន័យសម្រាប់ Admin ខាងក្រៅ' : 'External Admin API & Database Connect'}
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm font-battambang max-w-2xl leading-relaxed">
              {lang === 'km'
                ? 'ប្រើប្រាស់ API នេះដើម្បីភ្ជាប់ប្រព័ន្ធគ្រប់គ្រង (Admin Panel ផ្សេងទៀត) ឬ Mobile App របស់អ្នកជាមួយទិន្នន័យទាំងអស់ (មុខម្ហូប ការកម្មង់ ស្ថិតិ និង Email ដែលបានចុះឈ្មោះ)។'
                : 'Use these endpoints to connect external admin panels, desktop apps, or mobile dashboards to all database tables and registered login emails.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadFullDatabase}
              className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-stone-700 transition shadow-sm font-khmer cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{lang === 'km' ? 'ទាញយក Database (.json)' : 'Export Full DB (.json)'}</span>
            </button>
            <button
              onClick={() => handleExecuteApiTest('database_all')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 rounded-xl text-xs font-black flex items-center gap-2 transition shadow-md font-khmer cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{lang === 'km' ? 'តេស្ត API ផ្ទាល់' : 'Test API Live'}</span>
            </button>
          </div>
        </div>

        {/* Base URL & API Key Display Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 pt-6 border-t border-stone-800">
          
          {/* API Base URL */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 flex flex-col justify-between gap-1.5">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono">
              API Base URL
            </span>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs sm:text-sm font-mono text-amber-300 truncate selection:bg-amber-500 selection:text-stone-950">
                {apiBaseUrl}
              </code>
              <button
                onClick={() => handleCopy(apiBaseUrl, 'base_url')}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition shrink-0 cursor-pointer"
                title="Copy API Base URL"
              >
                {copiedKey === 'base_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Master API Key */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono">
                Master API Key (x-api-key / Bearer)
              </span>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-mono cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showApiKey ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs sm:text-sm font-mono text-emerald-400 truncate">
                {showApiKey ? currentApiKey : '••••••••••••••••••••••••••••••••'}
              </code>
              <button
                onClick={() => handleCopy(currentApiKey, 'api_key')}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition shrink-0 cursor-pointer"
                title="Copy API Key"
              >
                {copiedKey === 'api_key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Registered Login Emails Management (Take Email that was register to login) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-kulen text-stone-900 flex items-center gap-2">
                <span>{lang === 'km' ? 'បញ្ជី Email ដែលបានចុះឈ្មោះចូលប្រព័ន្ធ' : 'Registered Login Emails'}</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {users.length} Active
                </span>
              </h3>
              <p className="text-xs text-stone-500 font-battambang">
                {lang === 'km' 
                  ? 'គ្រប់គ្រង និងទាញយកបញ្ជី Email ដែលមានសិទ្ធិចូល Admin ឬប្រើប្រាស់តាម API' 
                  : 'Manage & query emails authorized to log in via Firebase or external admin panels'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(JSON.stringify(users.map(u => u.email), null, 2), 'emails_json')}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition font-khmer cursor-pointer"
            >
              {copiedKey === 'emails_json' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{lang === 'km' ? 'ចម្លង Email ទាំងអស់ (JSON)' : 'Copy All Emails'}</span>
            </button>
            <button
              onClick={loadUsers}
              disabled={isLoadingUsers}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
              title="Refresh Emails"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Action Status Notification */}
        {userActionMessage && (
          <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border font-battambang animate-in fade-in ${
            userActionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}>
            {userActionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span className="font-semibold">{userActionMessage.text}</span>
          </div>
        )}

        {/* Add New Email Form */}
        <form onSubmit={handleRegisterEmail} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-700 font-khmer uppercase tracking-wider">
            <Plus className="w-4 h-4 text-amber-600" />
            <span>{lang === 'km' ? 'ចុះឈ្មោះ Email ថ្មីសម្រាប់ចូលប្រព័ន្ធ (Register New Login Email)' : 'Register New Login Email'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1 font-battambang">
                {lang === 'km' ? 'អាសយដ្ឋាន Email *' : 'Email Address *'}
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="admin@restaurant.com"
                required
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1 font-battambang">
                {lang === 'km' ? 'ឈ្មោះអ្នកប្រើប្រាស់ (Name)' : 'Full Name / Title'}
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sokha Ly"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1 font-battambang">
                {lang === 'km' ? 'តួនាទី (Role)' : 'Access Role'}
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="superadmin">Superadmin (ពេញលេញ)</option>
                <option value="admin">Admin (អ្នកគ្រប់គ្រង)</option>
                <option value="manager">Manager (មេការ)</option>
                <option value="kitchen">Kitchen Lead (ចុងភៅ)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1 font-battambang">
                {lang === 'km' ? 'ចំណាំ (Notes)' : 'Internal Notes'}
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Branch Manager"
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmittingUser}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs font-khmer cursor-pointer disabled:opacity-60"
            >
              {isSubmittingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{lang === 'km' ? 'ចុះឈ្មោះ Email នេះ' : 'Authorize & Register Email'}</span>
            </button>
          </div>
        </form>

        {/* Registered Users Table */}
        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 font-bold uppercase tracking-wider text-[10px] font-mono">
              <tr>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Name / Title</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-battambang">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-mono font-bold text-stone-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-stone-800">
                    {user.name || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                      user.role === 'superadmin'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : user.role === 'admin'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : user.role === 'kitchen'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-stone-100 text-stone-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Remove Email"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Email Verification Tool */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-left w-full">
            <span className="text-xs font-bold text-amber-950 font-khmer flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>{lang === 'km' ? 'ឧបករណ៍តេស្តផ្ទៀងផ្ទាត់ Email' : 'Quick Email Verification Tester'}</span>
            </span>
            <p className="text-[11px] text-amber-800 font-battambang">
              {lang === 'km' ? 'សាកល្បងពិនិត្យមើលថាតើ Email មួយអាចចូលប្រព័ន្ធបានដែរឬទេ' : 'Check if an email is registered to log in'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              placeholder="e.g. jirouvu05@gmail.com"
              className="px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium w-full sm:w-64 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleTestVerifyEmail}
              disabled={isVerifying || !verifyInput.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shrink-0 font-khmer cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? 'Checking...' : (lang === 'km' ? 'ផ្ទៀងផ្ទាត់' : 'Verify')}
            </button>
          </div>
        </div>

        {verifyResult && (
          <div className={`p-4 rounded-2xl text-xs border font-mono animate-in fade-in ${
            verifyResult.registered 
              ? 'bg-emerald-50 text-emerald-950 border-emerald-200' 
              : 'bg-red-50 text-red-950 border-red-200'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {verifyResult.registered ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{verifyResult.registered ? 'EMAIL REGISTERED & AUTHORIZED' : 'EMAIL NOT REGISTERED'}</span>
            </div>
            <pre className="text-[11px] overflow-x-auto mt-2 bg-white/70 p-2.5 rounded-xl border border-stone-200">
              {JSON.stringify(verifyResult, null, 2)}
            </pre>
          </div>
        )}

      </div>

      {/* 3. Interactive API Endpoints & Live Code Tester */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-kulen text-stone-900">
                {lang === 'km' ? 'បញ្ជី API Endpoints & កូដតេស្តផ្ទាល់' : 'API Endpoints Reference & Live Tester'}
              </h3>
              <p className="text-xs text-stone-500 font-battambang">
                {lang === 'km' ? 'ជ្រើសរើស Endpoint ដើម្បីសាកល្បង និងចម្លងកូដសម្រាប់ដាក់ក្នុង Admin Panel របស់អ្នក' : 'Select an endpoint to test live and copy ready-to-use code snippets'}
              </p>
            </div>
          </div>
        </div>

        {/* Endpoints Grid Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {endpointsList.map((ep) => {
            const isSelected = selectedEndpoint === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep.id);
                  setTestResponse(null);
                }}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-amber-50/80 border-amber-400 shadow-sm ring-2 ring-amber-400/20'
                    : 'bg-stone-50/80 hover:bg-stone-100 border-stone-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                      ep.method === 'GET' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ep.method}
                    </span>
                    <code className="text-[11px] font-mono text-stone-500">{ep.path}</code>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 font-khmer line-clamp-1">{ep.name}</h4>
                  <p className="text-[11px] text-stone-500 font-battambang line-clamp-2 mt-1">
                    {lang === 'km' ? ep.desc_km : ep.desc_en}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Endpoint Detail Box */}
        <div className="bg-stone-900 rounded-3xl p-5 sm:p-7 text-white space-y-5 border border-stone-800">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                currentEndpointObj.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {currentEndpointObj.method}
              </span>
              <code className="text-sm sm:text-base font-mono text-amber-300 font-bold">
                {apiBaseUrl}{currentEndpointObj.path.replace('/api/v1', '')}
              </code>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExecuteApiTest(currentEndpointObj.id)}
                disabled={isTestingApi}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 text-stone-950 rounded-xl text-xs font-black flex items-center gap-2 transition shadow-md font-khmer cursor-pointer disabled:opacity-50"
              >
                {isTestingApi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{lang === 'km' ? 'សាកល្បង Request (Test)' : 'Run Test Request'}</span>
              </button>
            </div>
          </div>

          {/* Snippet Language Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                {(['js', 'curl', 'python'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedLangSnippet(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      selectedLangSnippet === t
                        ? 'bg-amber-500 text-stone-950'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {t === 'js' ? 'JavaScript / Fetch' : t === 'curl' ? 'cURL' : 'Python'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleCopy(getCodeSnippet(currentEndpointObj, selectedLangSnippet), 'code_snippet')}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedKey === 'code_snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Snippet</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-300 overflow-x-auto leading-relaxed">
                {getCodeSnippet(currentEndpointObj, selectedLangSnippet)}
              </pre>
            </div>
          </div>

          {/* Real-time Response Output */}
          {testResponse && (
            <div className="space-y-2 pt-2 border-t border-stone-800 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md font-bold ${
                    testResponse.status < 400 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400'
                  }`}>
                    HTTP {testResponse.status} OK
                  </span>
                  <span className="text-stone-400">Response time: {testResponse.duration}ms</span>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(testResponse.data, null, 2), 'response_json')}
                  className="text-stone-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedKey === 'response_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy JSON</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-xs font-mono text-emerald-300 max-h-80 overflow-y-auto leading-relaxed">
                {JSON.stringify(testResponse.data, null, 2)}
              </pre>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
