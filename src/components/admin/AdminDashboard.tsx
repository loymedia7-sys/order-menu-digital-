import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Check, 
  X, 
  Send, 
  DollarSign, 
  Printer, 
  MessageSquare, 
  QrCode, 
  TrendingUp, 
  Clock, 
  RefreshCw,
  UtensilsCrossed,
  Save,
  Volume2,
  ExternalLink,
  Bot,
  Search,
  CheckCircle2,
  Users,
  Cloud,
  Database,
  UploadCloud,
  Image as ImageIcon,
  Layers,
  CheckCheck,
  KeyRound,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  ChefHat,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  Key,
  FolderTree,
  FolderPlus,
  Soup,
  Flame,
  Beef,
  CookingPot,
  Coffee,
  IceCream,
  Star,
  Fish,
  Salad,
  Pizza,
  Beer,
  Wine,
  Apple,
  Carrot,
  Egg,
  Tag,
  AlertCircle,
  FileText,
  Download,
  LogOut,
  ArrowRight,
  Crown,
  Store,
  Package,
  Menu as MenuIcon,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { CategoryItem, MenuItem, Order, RestaurantConfig, MenuCategory, TenantPlan } from '../../types';
import { defaultCategories } from '../../data/initialData';
import { getCategoryIconComponent } from '../customer/CustomerMenu';
import { DailyReportModal } from './DailyReportModal';
import { User } from 'firebase/auth';
import { 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem, 
  updateRestaurantConfig, 
  sendTelegramNotification, 
  generateAiMenuDish,
  fetchTelegramStatus,
  fetchTelegramUpdates,
  setTelegramChatId
} from '../../services/api';
import { SubscriptionPlansTab } from './SubscriptionPlansTab';
import { StockManagementTab } from './StockManagementTab';
import { ChefCredentialsTab } from './ChefCredentialsTab';
import { StoreProfileTab } from './StoreProfileTab';
import { useTenant } from '../../lib/TenantContext';

const POPULAR_CATEGORY_PRESETS: Array<{ id: string; name_km: string; name_en: string; icon: string; desc_km: string }> = [
  { id: 'seafood', name_km: 'គ្រឿងសមុទ្រស្រស់', name_en: 'Fresh Seafood', icon: 'Fish', desc_km: 'មឹក បង្គា ក្តាម ត្រីដុត និងគ្រឿងសមុទ្រស្រស់ៗ' },
  { id: 'salad', name_km: 'ញាំ & ភ្លាខ្មែរ', name_en: 'Khmer Salads & Raw', icon: 'Salad', desc_km: 'ភ្លាសាច់គោ ញាំត្រយូងចេក ញាំស្វាយ' },
  { id: 'breakfast', name_km: 'អាហារពេលព្រឹក & បបរ', name_en: 'Breakfast & Porridge', icon: 'CookingPot', desc_km: 'បបរស បបរគ្រឿង គុយទាវភ្នំពេញ' },
  { id: 'beers', name_km: 'ស្រាបៀរ & ស្រាក្រឡុក', name_en: 'Beers & Cocktails', icon: 'Beer', desc_km: 'ស្រាបៀរត្រជាក់ ស្រាក្រឡុក និងភេសជ្ជៈប៉ូវកម្លាំង' },
  { id: 'vegetarian', name_km: 'ម្ហូបបួស & បន្លែស្រស់', name_en: 'Vegetarian & Greens', icon: 'Carrot', desc_km: 'ម្ហូបបួសឆ្ងាញ់ៗ និងបន្លែឆាធម្មជាតិ' },
  { id: 'snacks', name_km: 'អាហារសម្រន់ & បំពង', name_en: 'Snacks & Appetizers', icon: 'Pizza', desc_km: 'ប្រហិតបំពង ស្លាបមាន់បំពង ដំឡូងបំពង' },
  { id: 'combo', name_km: 'ឈុតអាហារគ្រួសារ', name_en: 'Family Combo Sets', icon: 'Layers', desc_km: 'ឈុតបាយសម្លសម្រាប់ញ៉ាំជុំគ្រួសារ' },
  { id: 'dessert', name_km: 'បង្អែមខ្មែរ & ការ៉េម', name_en: 'Desserts & Ice Cream', icon: 'IceCream', desc_km: 'បង្អែមគ្រាប់ឈូក បង្អែមបបរសណ្តែក ការ៉េម' },
];

const AVAILABLE_CATEGORY_ICONS = [
  { name: 'Star', label: 'Star / Featured' },
  { name: 'Soup', label: 'Soup / Khmer Curry' },
  { name: 'Flame', label: 'Flame / Stir-fry' },
  { name: 'Beef', label: 'Beef / BBQ Grill' },
  { name: 'CookingPot', label: 'Cooking Pot / Stew' },
  { name: 'Coffee', label: 'Coffee / Drinks' },
  { name: 'IceCream', label: 'Ice Cream / Dessert' },
  { name: 'Fish', label: 'Fish / Seafood' },
  { name: 'Salad', label: 'Salad / Raw Greens' },
  { name: 'Pizza', label: 'Pizza / Fast Food' },
  { name: 'Beer', label: 'Beer / Alcohol' },
  { name: 'Wine', label: 'Wine / Drinks' },
  { name: 'Apple', label: 'Fruit / Fresh' },
  { name: 'Carrot', label: 'Vegetarian / Veggie' },
  { name: 'Egg', label: 'Egg / Breakfast' },
  { name: 'Layers', label: 'Sets / Combos' },
  { name: 'Sparkles', label: 'Chef Specials' },
  { name: 'UtensilsCrossed', label: 'Utensils / General' },
  { name: 'Tag', label: 'Promotion / Tag' },
];
import { 
  uploadToCloudinary, 
  defaultCloudinaryConfig, 
  sampleCloudinaryGallery,
  getOptimizedCloudinaryUrl 
} from '../../lib/cloudinary';
import { isFirebaseConnected } from '../../lib/firebase';
import { TableQRStation } from './TableQRStation';
import { ExternalApiPortal } from './ExternalApiPortal';
import { StaffManagementTab } from './StaffManagementTab';

export type AdminTabType = 'menu' | 'plans' | 'stock' | 'profile' | 'chef_qr' | 'categories' | 'staff' | 'qr' | 'orders' | 'security' | 'api';

interface AdminDashboardProps {
  menuItems: MenuItem[];
  orders: Order[];
  config: RestaurantConfig;
  onRefreshMenu: () => void;
  onRefreshOrders: () => void;
  onRefreshConfig: () => void;
  lang: 'km' | 'en';
  currency: 'USD' | 'KHR';
  onOpenReceiptModal: (order: Order) => void;
  authUser?: User | null;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  menuItems,
  orders,
  config,
  onRefreshMenu,
  onRefreshOrders,
  onRefreshConfig,
  lang,
  currency,
  onOpenReceiptModal,
  authUser,
  onLogout,
}) => {
  const { tenantId, updateConfig: tenantUpdateConfig, saveMenuDish } = useTenant();
  const [activeTab, setActiveTab] = useState<AdminTabType>('menu');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<RestaurantConfig>({ ...config });
  const [botInfo, setBotInfo] = useState<{ username?: string; first_name?: string } | null>(null);
  const [detectedChats, setDetectedChats] = useState<Array<{ id: string; title: string; type: string; username: string; lastDate?: string }>>([]);
  const [isScanningChats, setIsScanningChats] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [cloudinaryUploadNotice, setCloudinaryUploadNotice] = useState<string | null>(null);
  const [testCloudinaryUrl, setTestCloudinaryUrl] = useState<string | null>(null);
  const [isTestingCloudinary, setIsTestingCloudinary] = useState(false);
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);

  // Category Management State
  const [categories, setCategories] = useState<CategoryItem[]>(
    config.categories && config.categories.length > 0 ? config.categories : defaultCategories
  );
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryItem> | null>(null);
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null);
  const [selectedMenuCategoryFilter, setSelectedMenuCategoryFilter] = useState<string>('all');
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');

  // Role Password Management State
  const [showChefPin, setShowChefPin] = useState<boolean>(false);
  const [showAdminPin, setShowAdminPin] = useState<boolean>(false);
  const [showTableQrPin, setShowTableQrPin] = useState<boolean>(false);
  const [chefPinInput, setChefPinInput] = useState<string>(config.passwords?.chef || config.chefPin || '1234');
  const [adminPinInput, setAdminPinInput] = useState<string>(config.passwords?.admin || config.adminPin || '8888');
  const [tableQrPinInput, setTableQrPinInput] = useState<string>(config.passwords?.table_qr || config.tableQrPin || '1234');
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [isSavingPasswords, setIsSavingPasswords] = useState<boolean>(false);

  const handleSavePasswords = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPasswords(true);
    try {
      const updatedConf: RestaurantConfig = {
        ...configForm,
        passwords: {
          chef: chefPinInput,
          admin: adminPinInput,
          table_qr: tableQrPinInput,
        },
        chefPin: chefPinInput,
        adminPin: adminPinInput,
        tableQrPin: tableQrPinInput,
      };
      if (tenantUpdateConfig) {
        await tenantUpdateConfig(updatedConf);
      } else {
        await updateRestaurantConfig(updatedConf);
      }
      setConfigForm(updatedConf);
      setPasswordFeedback(lang === 'km' ? 'បានរក្សាទុកពាក្យសម្ងាត់ដោយជោគជ័យ!' : 'Security PINs saved successfully!');
      setTimeout(() => setPasswordFeedback(null), 3000);
      onRefreshConfig();
    } catch (err: any) {
      setPasswordFeedback(err?.message || 'Error saving PINs');
    } finally {
      setIsSavingPasswords(false);
    }
  };

  useEffect(() => {
    if (editingItem || editingCategory) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [editingItem, editingCategory]);

  useEffect(() => {
    setConfigForm({ ...config });
    if (config.categories && config.categories.length > 0) {
      setCategories(config.categories);
    } else {
      setCategories(defaultCategories);
    }
    setChefPinInput(config.passwords?.chef || config.chefPin || '1234');
    setAdminPinInput(config.passwords?.admin || config.adminPin || '8888');
    setTableQrPinInput(config.passwords?.table_qr || config.tableQrPin || '1234');
    // Check telegram bot status
    fetchTelegramStatus().then(res => {
      if (res.configured && res.bot) {
        setBotInfo(res.bot);
      }
    }).catch(() => {});
  }, [config]);

  // Category Management CRUD Handlers
  const handleSaveCategory = async (cat: Partial<CategoryItem>) => {
    if (!cat.name_km?.trim() && !cat.name_en?.trim()) {
      setCategoryFeedback(lang === 'km' ? 'សូមវាយបញ្ចូលឈ្មោះប្រភេទមុខម្ហូប!' : 'Please enter a category name!');
      return;
    }

    const rawKey = cat.id || cat.name_en || `cat_${Date.now()}`;
    const cleanId = rawKey
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const newCategory: CategoryItem = {
      id: cleanId,
      name_km: cat.name_km?.trim() || cat.name_en?.trim() || 'ប្រភេទថ្មី',
      name_en: cat.name_en?.trim() || cat.name_km?.trim() || 'New Category',
      icon: cat.icon || 'UtensilsCrossed',
      description_km: cat.description_km || '',
      description_en: cat.description_en || '',
      order: cat.order || (categories.length + 1),
    };

    let updatedList: CategoryItem[];
    const existingIndex = categories.findIndex(c => c.id === (cat.id || cleanId));
    if (existingIndex >= 0) {
      updatedList = [...categories];
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...newCategory };
    } else {
      updatedList = [...categories, newCategory];
    }

    setCategories(updatedList);
    const updatedConfig: RestaurantConfig = { ...configForm, categories: updatedList };
    setConfigForm(updatedConfig);
    setEditingCategory(null);

    // If we were adding a category while editing a menu item, auto-select this new category for the item!
    if (editingItem) {
      setEditingItem(prev => (prev ? { ...prev, category: newCategory.id } : prev));
    }

    setIsSavingConfig(true);
    try {
      await updateRestaurantConfig(updatedConfig);
      onRefreshConfig();
      setCategoryFeedback(
        lang === 'km'
          ? `បានរក្សាទុកប្រភេទ «${newCategory.name_km}» ជោគជ័យ!`
          : `Category "${newCategory.name_en}" saved and synchronized to Cloud!`
      );
      setTimeout(() => setCategoryFeedback(null), 4000);
    } catch (err: any) {
      setCategoryFeedback(err.message || 'Failed to save category');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const itemsInCat = menuItems.filter(m => m.category === catId);
    const catToDelete = categories.find(c => c.id === catId);
    const catName = catToDelete ? (lang === 'km' ? catToDelete.name_km : catToDelete.name_en) : catId;

    let confirmMessage = lang === 'km'
      ? `តើអ្នកប្រាកដជាចង់លុបប្រភេទ «${catName}» នេះមែនទេ?`
      : `Are you sure you want to delete category "${catName}"?`;

    if (itemsInCat.length > 0) {
      confirmMessage += lang === 'km'
        ? `\n\n(ចំណាំ: មានមុខម្ហូបចំនួន ${itemsInCat.length} កំពុងស្ថិតក្នុងប្រភេទនេះ។ ពួកវានឹងត្រូវប្តូរទៅប្រភេទ «ពេញនិយម / Chef Specials» ដោយស្វ័យប្រវត្តិ)`
        : `\n\n(Note: There are ${itemsInCat.length} dish(es) in this category. They will be reassigned to "Chef Specials" automatically)`;
    }

    if (!window.confirm(confirmMessage)) return;

    // If dishes exist in this category, reassign them to 'popular'
    if (itemsInCat.length > 0) {
      for (const item of itemsInCat) {
        try {
          await updateMenuItem(item.id, { ...item, category: 'popular' });
        } catch (e) {
          console.warn('Reassign dish warning:', e);
        }
      }
      onRefreshMenu();
    }

    const updatedList = categories.filter(c => c.id !== catId);
    setCategories(updatedList);
    const updatedConfig: RestaurantConfig = { ...configForm, categories: updatedList };
    setConfigForm(updatedConfig);

    setIsSavingConfig(true);
    try {
      await updateRestaurantConfig(updatedConfig);
      onRefreshConfig();
      setCategoryFeedback(
        lang === 'km'
          ? `បានលុបប្រភេទ «${catName}» ជោគជ័យ!`
          : `Category "${catName}" removed successfully!`
      );
      setTimeout(() => setCategoryFeedback(null), 4000);
    } catch (err: any) {
      setCategoryFeedback(err.message || 'Failed to delete category');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleResetCategories = async () => {
    if (!window.confirm(
      lang === 'km' 
        ? 'តើអ្នកចង់កំណត់ប្រភេទមុខម្ហូបទាំងអស់ទៅតាមទម្រង់ស្តង់ដារដើមវិញមែនទេ?' 
        : 'Reset categories to original standard Khmer restaurant defaults?'
    )) {
      return;
    }
    setCategories(defaultCategories);
    const updatedConfig: RestaurantConfig = { ...configForm, categories: defaultCategories };
    setConfigForm(updatedConfig);

    setIsSavingConfig(true);
    try {
      await updateRestaurantConfig(updatedConfig);
      onRefreshConfig();
      setCategoryFeedback(
        lang === 'km'
          ? 'បានកំណត់ប្រភេទស្តង់ដារឡើងវិញជោគជ័យ!'
          : 'Categories reset to original defaults!'
      );
      setTimeout(() => setCategoryFeedback(null), 4000);
    } catch (err: any) {
      setCategoryFeedback(err.message || 'Failed to reset categories');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveIndividualPassword = async (role: 'chef' | 'admin' | 'table_qr', newPinValue: string) => {
    const trimmed = newPinValue.trim();
    if (!trimmed) {
      setPasswordFeedback(lang === 'km' ? 'សូមវាយបញ្ចូលលេខកូដសម្ងាត់យ៉ាងតិច ៤ ខ្ទង់!' : 'Please enter a valid PIN code!');
      return;
    }

    const currentPasswords = configForm.passwords || { chef: '1234', admin: '8888', table_qr: '1234' };
    const updatedPasswords = {
      ...currentPasswords,
      [role]: trimmed,
    };

    const updatedConfig: RestaurantConfig = {
      ...configForm,
      passwords: updatedPasswords,
      chefPin: role === 'chef' ? trimmed : (configForm.chefPin || updatedPasswords.chef),
      adminPin: role === 'admin' ? trimmed : (configForm.adminPin || updatedPasswords.admin),
      tableQrPin: role === 'table_qr' ? trimmed : (configForm.tableQrPin || updatedPasswords.table_qr),
    };

    setConfigForm(updatedConfig);
    setIsSavingConfig(true);
    try {
      await updateRestaurantConfig(updatedConfig);
      onRefreshConfig();
      const roleTitle = role === 'chef' 
        ? (lang === 'km' ? 'ចុងភៅ (Chef)' : 'Chef Tablet') 
        : role === 'admin' 
        ? (lang === 'km' ? 'អ្នកគ្រប់គ្រង (Admin)' : 'Admin Portal') 
        : (lang === 'km' ? 'ប័ណ្ណ QR តុ (Table QR)' : 'Table QR Station');

      setPasswordFeedback(
        lang === 'km'
          ? `បានផ្លាស់ប្តូរលេខសម្ងាត់សម្រាប់ ${roleTitle} ទៅ "${trimmed}" ជោគជ័យ!`
          : `Changed ${roleTitle} password to "${trimmed}" successfully!`
      );
      setTimeout(() => setPasswordFeedback(null), 4500);
    } catch (err: any) {
      setPasswordFeedback(err.message || 'Failed to update password');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleResetIndividualPassword = async (role: 'chef' | 'admin' | 'table_qr') => {
    const defaultVal = role === 'admin' ? '8888' : '1234';
    if (role === 'chef') setChefPinInput(defaultVal);
    if (role === 'admin') setAdminPinInput(defaultVal);
    if (role === 'table_qr') setTableQrPinInput(defaultVal);

    await handleSaveIndividualPassword(role, defaultVal);
  };

  const handleResetAllPasswordsToDefault = async () => {
    const confirmText = lang === 'km'
      ? 'តើអ្នកពិតជាចង់កំណត់ពាក្យសម្ងាត់ទាំងអស់ឡើងវិញទៅលំនាំដើម (Chef: 1234, Admin: 8888, Table QR: 1234) មែនទេ?'
      : 'Are you sure you want to reset ALL role passwords to default (Chef: 1234, Admin: 8888, Table QR: 1234)?';

    if (!window.confirm(confirmText)) {
      return;
    }

    setChefPinInput('1234');
    setAdminPinInput('8888');
    setTableQrPinInput('1234');

    const defaultPasswords = {
      chef: '1234',
      admin: '8888',
      table_qr: '1234',
    };

    const updatedConfig: RestaurantConfig = {
      ...configForm,
      passwords: defaultPasswords,
      chefPin: '1234',
      adminPin: '8888',
      tableQrPin: '1234',
    };

    setConfigForm(updatedConfig);
    setIsSavingConfig(true);
    try {
      await updateRestaurantConfig(updatedConfig);
      onRefreshConfig();
      setPasswordFeedback(
        lang === 'km'
          ? 'បានកំណត់ពាក្យសម្ងាត់ទាំងអស់ឡើងវិញទៅលំនាំដើម (Chef: 1234, Admin: 8888, Table QR: 1234) ជោគជ័យ!'
          : 'All role passwords have been reset to factory defaults (Chef: 1234, Admin: 8888, Table QR: 1234)!'
      );
      setTimeout(() => setPasswordFeedback(null), 5000);
    } catch (err: any) {
      setPasswordFeedback(err.message || 'Failed to reset all passwords');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveAllPasswords = async () => {
    const chefVal = chefPinInput.trim() || '1234';
    const adminVal = adminPinInput.trim() || '8888';
    const tableQrVal = tableQrPinInput.trim() || '1234';

    const updatedPasswords = {
      chef: chefVal,
      admin: adminVal,
      table_qr: tableQrVal,
    };

    const updatedConfig: RestaurantConfig = {
      ...configForm,
      passwords: updatedPasswords,
      chefPin: chefVal,
      adminPin: adminVal,
      tableQrPin: tableQrVal,
    };

    setConfigForm(updatedConfig);
    setIsSavingConfig(true);
    try {
      await updateRestaurantConfig(updatedConfig);
      onRefreshConfig();
      setPasswordFeedback(
        lang === 'km'
          ? 'បានរក្សាទុកពាក្យសម្ងាត់គ្រប់ប្រភេទទាំងអស់ និងធ្វើសមកាលកម្មលើ Cloud ជោគជ័យ!'
          : 'All role passwords saved and synchronized to Cloud in real-time!'
      );
      setTimeout(() => setPasswordFeedback(null), 5000);
    } catch (err: any) {
      setPasswordFeedback(err.message || 'Failed to save passwords');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleFileUploadToCloudinary = async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    setCloudinaryUploadNotice(lang === 'km' ? 'កំពុងបញ្ចូលរូបភាពទៅ Cloudinary (JIRO)...' : 'Uploading to Cloudinary (JIRO)...');
    try {
      const result = await uploadToCloudinary(file, 'JIRO');
      if (result && result.secure_url) {
        setEditingItem(prev => ({
          ...prev,
          imageUrl: result.secure_url,
        }));
        setCloudinaryUploadNotice(lang === 'km' ? 'បញ្ចូលរូបភាពទៅ Cloudinary ជោគជ័យ!' : 'Uploaded to Cloudinary successfully!');
      }
    } catch (err: any) {
      setCloudinaryUploadNotice(err.message || 'Upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleTestUploadCloudinary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsTestingCloudinary(true);
    try {
      const result = await uploadToCloudinary(file, 'JIRO');
      setTestCloudinaryUrl(result.secure_url);
    } catch (err: any) {
      alert(`Cloudinary upload note: ${err.message}`);
    } finally {
      setIsTestingCloudinary(false);
    }
  };

  const handleScanChats = async () => {
    setIsScanningChats(true);
    setTelegramStatus(lang === 'km' ? 'កំពុងស្កេនរក Telegram Group/Chat...' : 'Scanning for active Telegram groups & chats...');
    try {
      const res = await fetchTelegramUpdates();
      if (res.success && res.chats) {
        setDetectedChats(res.chats);
        if (res.chats.length > 0) {
          setTelegramStatus(
            lang === 'km' 
              ? `រកឃើញ ${res.chats.length} Group/Chat! សូមជ្រើសរើសដើម្បីភ្ជាប់` 
              : `Found ${res.chats.length} active chat(s)! Click below to connect.`
          );
        } else {
          setTelegramStatus(
            lang === 'km'
              ? 'មិនទាន់ឃើញសារថ្មីទេ។ សូមចុចបើក @restaurant_menu7_bot ហើយចុច Start ឬផ្ញើសារក្នុង Group ជាមុនសិន!'
              : 'No recent messages found. Please open @restaurant_menu7_bot and click Start or send a message in your group first!'
          );
        }
      } else {
        setTelegramStatus(res.error || 'Failed to scan chats');
      }
    } catch (err: any) {
      setTelegramStatus(err.message || 'Error scanning Telegram chats');
    } finally {
      setIsScanningChats(false);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    try {
      const res = await setTelegramChatId(chatId);
      if (res.success) {
        setConfigForm(prev => ({ ...prev, telegramChatId: chatId, telegramEnabled: true }));
        onRefreshConfig();
        setTelegramStatus(
          lang === 'km' 
            ? `ភ្ជាប់ជាមួយ Chat ID ${chatId} ជោគជ័យ! សារស្វាគមន៍ត្រូវបានផ្ញើទៅកាន់ Telegram` 
            : `Connected to Chat ID ${chatId}! Welcome alert sent to Telegram.`
        );
      }
    } catch (err: any) {
      setTelegramStatus(err.message || 'Failed to connect chat');
    }
  };

  // Sales metrics
  const todayOrders = orders;
  const totalRevenueUsd = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRevenueKhr = Math.round(totalRevenueUsd * config.exchangeRate);
  const activeOrdersCount = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name_km || !editingItem.name_en) return;

    try {
      if (editingItem.id) {
        await updateMenuItem(editingItem.id, editingItem);
      } else {
        await createMenuItem(editingItem as Omit<MenuItem, 'id'>);
      }
      setEditingItem(null);
      onRefreshMenu();
    } catch (err) {
      console.error('Error saving item:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm(lang === 'km' ? 'តើអ្នកប្រាកដជាចង់លុបមុខម្ហូបនេះ?' : 'Are you sure you want to delete this menu item?')) return;
    try {
      await deleteMenuItem(id);
      onRefreshMenu();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleAiGenerateDish = async () => {
    setIsAiGenerating(true);
    try {
      const generated = await generateAiMenuDish(aiPrompt || 'A popular authentic Khmer sour soup or stir fry');
      setEditingItem({
        name_km: generated.name_km || '',
        name_en: generated.name_en || '',
        description_km: generated.description_km || '',
        description_en: generated.description_en || '',
        price: generated.price || 4.50,
        category: (generated.category as MenuCategory) || 'soup',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        available: true,
        spicyLevelOptions: generated.spicyLevelOptions ?? true,
        prepTimeMinutes: generated.prepTimeMinutes ?? 12,
      });
      setAiPrompt('');
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSaveRestaurantConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await updateRestaurantConfig(configForm);
      onRefreshConfig();
      setTelegramStatus(lang === 'km' ? 'រក្សាទុកការកំណត់បានជោគជ័យ!' : 'Settings updated successfully!');
      setTimeout(() => setTelegramStatus(null), 3000);
    } catch (err) {
      console.error('Config save error:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestTelegramAlert = async () => {
    setTelegramStatus(lang === 'km' ? 'កំពុងបញ្ជូនសារតេស្ត...' : 'Dispatching test alert...');
    try {
      const res = await sendTelegramNotification({
        orderId: 'test_order',
        tableNumber: 5,
        items: [
          {
            itemId: 'menu_01',
            name_km: 'សម្លម្ជូរគ្រឿងសាច់គោ',
            name_en: 'Khmer Beef Sour Soup (Kroeung)',
            price: 4.50,
            quantity: 1,
            selectedSpicy: 'ហឹរមធ្យម',
            itemTotal: 4.50,
          },
          {
            itemId: 'menu_09',
            name_km: 'តែបៃតងដោះគោទឹកកក',
            name_en: 'Khmer Iced Green Tea',
            price: 1.50,
            quantity: 2,
            itemTotal: 3.00,
          }
        ],
        total: 7.50,
        total_khr: 30750,
        customerNote: 'តេស្ត Telegram Alert',
      });
      setTelegramStatus(res.message);
    } catch (err: any) {
      setTelegramStatus(err.message || 'Telegram failed');
    }
  };

  const userPlan: TenantPlan = config.plan || 'free';

  const PLAN_WEIGHTS: Record<TenantPlan, number> = {
    free: 1,
    normal: 2,
    pro: 3,
  };

  const hasPlanAccess = (current: TenantPlan, required?: TenantPlan): boolean => {
    if (!required) return true;
    return (PLAN_WEIGHTS[current] || 1) >= (PLAN_WEIGHTS[required] || 1);
  };

  interface AdminNavItem {
    id: AdminTabType;
    label_km: string;
    label_en: string;
    icon: React.ComponentType<any>;
    badge?: string;
    badgeColor?: string;
    color: string;
    requiredPlan?: TenantPlan;
  }

  interface AdminNavSection {
    title_km: string;
    title_en: string;
    items: AdminNavItem[];
  }

  const navSections: AdminNavSection[] = [
    {
      title_km: 'សេវាកម្ម & ហាង',
      title_en: 'Store & Plans',
      items: [
        {
          id: 'plans',
          label_km: 'កញ្ចប់សេវា & ការជាវ',
          label_en: 'Plans & Pricing',
          icon: Crown,
          badge: userPlan.toUpperCase(),
          badgeColor: userPlan === 'pro' 
            ? 'bg-amber-500 text-stone-950 font-black' 
            : userPlan === 'normal' 
              ? 'bg-blue-600 text-white font-bold' 
              : 'bg-stone-200 text-stone-700 font-bold',
          color: 'text-amber-500',
        },
        {
          id: 'profile',
          label_km: 'ព័ត៌មានហាង & LOGO',
          label_en: 'Brand & Hours',
          icon: Store,
          color: 'text-amber-600',
        },
        {
          id: 'stock',
          label_km: 'គ្រប់គ្រងស្តុក',
          label_en: 'Stock & Inventory',
          icon: Package,
          color: 'text-emerald-500',
          requiredPlan: 'normal',
        },
      ],
    },
    {
      title_km: 'មុខម្ហូប & ប័ណ្ណតារាង',
      title_en: 'Menu & Tables',
      items: [
        {
          id: 'menu',
          label_km: 'គ្រប់គ្រងមុខម្ហូប',
          label_en: 'Menu Items',
          icon: UtensilsCrossed,
          badge: `${menuItems.length}`,
          badgeColor: 'bg-stone-100 text-stone-700 border border-stone-200',
          color: 'text-amber-600',
        },
        {
          id: 'categories',
          label_km: 'ប្រភេទមុខម្ហូប',
          label_en: 'Categories',
          icon: FolderTree,
          badge: `${categories.length}`,
          badgeColor: 'bg-stone-100 text-stone-700 border border-stone-200',
          color: 'text-emerald-600',
        },
        {
          id: 'qr',
          label_km: 'ប័ណ្ណ QR កូដលើតុ',
          label_en: 'Table QR Cards',
          icon: QrCode,
          badge: `${config.tablesCount} តុ`,
          badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200',
          color: 'text-blue-600',
        },
      ],
    },
    {
      title_km: 'ប្រតិបត្តិការ & បុគ្គលិក',
      title_en: 'Operations',
      items: [
        {
          id: 'chef_qr',
          label_km: 'គណនីចុងភៅ & QR',
          label_en: 'Chef Login & QR',
          icon: ChefHat,
          color: 'text-purple-500',
          requiredPlan: 'normal',
        },
        {
          id: 'staff',
          label_km: 'បុគ្គលិក & សិទ្ធិ',
          label_en: 'Staff & Roles',
          icon: Users,
          color: 'text-amber-600',
          requiredPlan: 'pro',
        },
        {
          id: 'orders',
          label_km: 'ប្រវត្តិការកម្មង់',
          label_en: 'Order History',
          icon: Clock,
          badge: activeOrdersCount > 0 ? `${activeOrdersCount} ថ្មី` : `${todayOrders.length}`,
          badgeColor: activeOrdersCount > 0 ? 'bg-emerald-500 text-white animate-pulse font-bold' : 'bg-stone-100 text-stone-700',
          color: 'text-stone-700',
          requiredPlan: 'normal',
        },
      ],
    },
    {
      title_km: 'ប្រព័ន្ធ & សុវត្ថិភាព',
      title_en: 'System & Security',
      items: [
        {
          id: 'security',
          label_km: 'ពាក្យសម្ងាត់ & សុវត្ថិភាព',
          label_en: 'Security & PINs',
          icon: KeyRound,
          color: 'text-amber-700',
        },
        {
          id: 'api',
          label_km: 'តភ្ជាប់ API & ទិន្នន័យ',
          label_en: 'External API & DB',
          icon: Database,
          color: 'text-amber-500',
          requiredPlan: 'pro',
        },
      ],
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 pb-24">
      {/* Top Status & Quick Action Bar */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
            title="Toggle Sidebar Menu"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-sm sm:text-base text-stone-900 font-khmer">
                {lang === 'km' ? 'ផ្ទាំងគ្រប់គ្រងហាង (Admin Dashboard)' : 'Restaurant Admin Dashboard'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Verified</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 uppercase font-mono">
                <span>Shop: {config.id || 'main-restaurant'}</span>
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono">
              {authUser?.email ? authUser.email : 'admin@restaurant.com'} • {lang === 'km' ? 'សិទ្ធិពេញលេញលើការគ្រប់គ្រងហាង' : 'Full Store Management'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Customer Public Menu Link Preview */}
          <a
            href={`/?shop=${config.id || 'main-restaurant'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition font-khmer"
            title="Open Customer Live Menu"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'បើកម៉ឺនុយអតិថិជន' : 'Customer Menu'}</span>
          </a>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 border border-stone-200 hover:border-red-200 rounded-xl text-xs font-bold transition shadow-2xs font-khmer cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'ចាកចេញ' : 'Sign Out'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout: Sidebar Menu + Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Mobile Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR NAVIGATION */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white p-4 border-r border-stone-200 shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out
          lg:static lg:w-72 lg:shrink-0 lg:rounded-3xl lg:border lg:shadow-xs lg:translate-x-0 lg:z-10 lg:max-h-[calc(100vh-140px)] lg:sticky lg:top-24
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="space-y-5">
            {/* Sidebar Brand Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center gap-3">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt={config.name_en}
                    className="w-11 h-11 rounded-xl object-cover bg-white/10 p-0.5 border border-white/20 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-base shrink-0 font-kulen">
                    {(config.name_km || config.name_en || 'SM').charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm text-amber-400 font-kulen truncate">
                    {config.name_km || 'ស្មាតម៉ឺនុយ'}
                  </h3>
                  <p className="text-[11px] text-stone-300 font-medium truncate">
                    {config.name_en || 'Smart Restaurant'}
                  </p>
                </div>
              </div>

              {/* Current Subscription Plan Card in Sidebar */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] text-stone-300 font-medium">
                    {lang === 'km' ? 'កញ្ចប់សេវា:' : 'Plan:'}
                  </span>
                  <span className={`text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded-md ${
                    config.plan === 'pro'
                      ? 'bg-amber-400 text-stone-950'
                      : config.plan === 'normal'
                        ? 'bg-blue-500 text-white'
                        : 'bg-stone-700 text-amber-300'
                  }`}>
                    {config.plan || 'free'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('plans');
                    setMobileSidebarOpen(false);
                  }}
                  className="text-[10px] font-bold text-amber-300 hover:text-amber-200 underline font-khmer cursor-pointer"
                >
                  {lang === 'km' ? 'ប្តូរកញ្ចប់' : 'Upgrade'}
                </button>
              </div>
            </div>

            {/* Nav Group Items */}
            <nav className="space-y-4">
              {navSections.map((sec, secIdx) => (
                <div key={secIdx} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-stone-400 font-battambang">
                    {lang === 'km' ? sec.title_km : sec.title_en}
                  </div>
                  <div className="space-y-1">
                    {sec.items.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activeTab === item.id;
                      const isLocked = item.requiredPlan && !hasPlanAccess(userPlan, item.requiredPlan);
                      
                      return (
                        <button
                          key={item.id}
                          id={`${item.id}-sidebar-btn`}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition active:scale-98 cursor-pointer font-kulen tracking-wide text-left ${
                            isActive
                              ? 'bg-amber-500 text-stone-950 shadow-sm ring-1 ring-amber-400/80 font-black'
                              : isLocked
                              ? 'text-stone-400 hover:text-stone-600 hover:bg-stone-50 bg-stone-50/50'
                              : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-stone-950' : isLocked ? 'text-stone-400' : item.color}`} />
                            <span className={`truncate ${isLocked ? 'line-through opacity-70' : ''}`}>
                              {lang === 'km' ? item.label_km : item.label_en}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {isLocked && (
                              <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md bg-stone-200 text-stone-600">
                                <Lock className="w-2.5 h-2.5" />
                                <span>{item.requiredPlan}</span>
                              </span>
                            )}
                            {item.badge && !isLocked && (
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                isActive ? 'bg-stone-950 text-amber-400' : (item.badgeColor || 'bg-stone-200 text-stone-800')
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 mt-4 border-t border-stone-200 space-y-2">
            <a
              href={`/?shop=${config.id || 'main-restaurant'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold font-khmer transition"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'km' ? 'មើលម៉ឺនុយភ្ញៀវផ្ទាល់' : 'Live Guest Menu'}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
            </a>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold font-khmer transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? 'ចាកចេញពីប្រព័ន្ធ' : 'Sign Out'}</span>
              </button>
            )}
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0 space-y-6 w-full">

          {/* Metrics Header */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>{lang === 'km' ? 'ចំណូលថ្ងៃនេះ (USD)' : "Today's Revenue"}</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900 mt-1">
                ${totalRevenueUsd.toFixed(2)}
              </p>
              <span className="text-xs text-stone-400 font-medium">
                {totalRevenueKhr.toLocaleString()} ៛
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>{lang === 'km' ? 'ការកម្មង់សរុប' : 'Total Orders'}</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900 mt-1">
                {todayOrders.length}
              </p>
              <span className="text-xs text-emerald-600 font-semibold">
                {activeOrdersCount} {lang === 'km' ? 'កំពុងដំណើរការ' : 'Active'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>{lang === 'km' ? 'មុខម្ហូបក្នុងម៉ឺនុយ' : 'Menu Items'}</span>
                <UtensilsCrossed className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900 mt-1">
                {menuItems.length}
              </p>
              <span className="text-xs text-stone-400 font-medium">
                {config.tablesCount} {lang === 'km' ? 'តុទាំងអស់' : 'Tables'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>{lang === 'km' ? 'ម៉ាស៊ីនព្រីន PP587' : 'PP587 Thermal'}</span>
                <Printer className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-stone-900 mt-1">
                {config.printerType} ESC/POS
              </p>
              <span className="text-xs text-emerald-600 font-semibold">
                RawBT Protocol Ready
              </span>
            </div>
          </div>

          {/* Daily Report PDF Download Action Banner */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-stone-900 text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-amber-300 font-bold shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base font-kulen tracking-wide text-white">
                  {lang === 'km' ? 'របាយការណ៍លក់ប្រចាំថ្ងៃ PDF (Daily Sales & Revenue Report)' : 'Daily Revenue & Order Sales Report'}
                </h3>
                <p className="text-xs text-amber-100 font-battambang">
                  {lang === 'km'
                    ? `ការកម្មង់សរុបថ្ងៃនេះចំនួន ${todayOrders.length} • ចំណូលសរុប $${totalRevenueUsd.toFixed(2)} (${totalRevenueKhr.toLocaleString()} ៛)`
                    : `Today's total orders: ${todayOrders.length} • Gross revenue: $${totalRevenueUsd.toFixed(2)}`}
                </p>
              </div>
            </div>

            <button
              id="open-daily-report-pdf-btn"
              onClick={() => setShowDailyReportModal(true)}
              className="w-full sm:w-auto bg-white hover:bg-amber-50 text-amber-950 font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-lg active:scale-95 flex items-center justify-center gap-2 font-khmer shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-700" />
              <span>{lang === 'km' ? 'ទាញយករបាយការណ៍ PDF' : 'Download Report PDF'}</span>
            </button>
          </div>

          {/* ACTIVE TAB VIEWS */}
          {(() => {
            // Find if activeTab requires a plan higher than userPlan
            let currentItemRequiredPlan: TenantPlan | undefined;
            for (const sec of navSections) {
              const it = sec.items.find(i => i.id === activeTab);
              if (it && it.requiredPlan) {
                currentItemRequiredPlan = it.requiredPlan;
                break;
              }
            }

            if (currentItemRequiredPlan && !hasPlanAccess(userPlan, currentItemRequiredPlan)) {
              return (
                <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl text-center space-y-6 max-w-xl mx-auto my-8 animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold mx-auto border border-amber-500/20 shadow-inner">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                      <Crown className="w-3.5 h-3.5 text-amber-700" />
                      <span>{currentItemRequiredPlan.toUpperCase()} PLAN REQUIRED</span>
                    </span>
                    <h3 className="font-extrabold text-xl font-kulen tracking-wide text-stone-900">
                      {lang === 'km' ? 'មុខងារនេះតម្រូវឱ្យទិញកញ្ចប់បន្ថែម' : 'Feature Locked: Upgrade Required'}
                    </h3>
                    <p className="text-xs text-stone-500 font-battambang leading-relaxed">
                      {lang === 'km'
                        ? `មុខងារនេះត្រូវការកញ្ចប់សេវា «${currentItemRequiredPlan.toUpperCase()}» ឬខ្ពស់ជាងនេះ។ កញ្ចប់បច្ចុប្បន្នរបស់អ្នកគឺ «${userPlan.toUpperCase()}»។ សូមទិញកញ្ចប់បន្ថែមដើម្បីប្រើប្រាស់មុខងារនេះ!`
                        : `This feature is available exclusively on the ${currentItemRequiredPlan.toUpperCase()} plan or higher. Your current plan is ${userPlan.toUpperCase()}. Upgrade today to unlock full capabilities!`}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs font-khmer shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      <span>{lang === 'km' ? 'ទិញកញ្ចប់សេវា (Upgrade Plan)' : 'Upgrade Subscription Plan'}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('menu')}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs font-khmer transition cursor-pointer"
                    >
                      {lang === 'km' ? 'ត្រឡប់ទៅម៉ឺនុយ' : 'Back to Menu'}
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })()}

      {/* Tab: Subscription Plans & Pricing */}
      {activeTab === 'plans' && (
        <SubscriptionPlansTab
          config={config}
          onUpdateConfig={async (newCfg) => {
            if (tenantUpdateConfig) {
              await tenantUpdateConfig(newCfg);
            } else {
              await updateRestaurantConfig(newCfg);
            }
            onRefreshConfig();
          }}
          lang={lang}
        />
      )}

      {/* Tab: Stock & Inventory Management */}
      {activeTab === 'stock' && (
        <StockManagementTab
          menuItems={menuItems}
          categories={categories}
          config={config}
          onSaveMenuItem={async (updatedItem) => {
            if (saveMenuDish) {
              await saveMenuDish(updatedItem);
            } else {
              await updateMenuItem(updatedItem.id, updatedItem);
            }
            onRefreshMenu();
          }}
          lang={lang}
          currency={currency}
        />
      )}

      {/* Tab: Store Brand & Profile Settings */}
      {activeTab === 'profile' && (
        <StoreProfileTab
          config={config}
          onUpdateConfig={async (newCfg) => {
            if (tenantUpdateConfig) {
              await tenantUpdateConfig(newCfg);
            } else {
              await updateRestaurantConfig(newCfg);
            }
            onRefreshConfig();
          }}
          lang={lang}
        />
      )}

      {/* Tab: Chef Credentials & Quick-Login QR Station */}
      {activeTab === 'chef_qr' && (
        <ChefCredentialsTab
          config={config}
          onUpdateConfig={async (newCfg) => {
            if (tenantUpdateConfig) {
              await tenantUpdateConfig(newCfg);
            } else {
              await updateRestaurantConfig(newCfg);
            }
            onRefreshConfig();
          }}
          lang={lang}
          tenantId={tenantId || config.id || 'main-restaurant'}
        />
      )}

      {/* Tab 1: Menu Management */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="font-bold text-base text-stone-900 font-kulen tracking-wide">
                {lang === 'km' ? 'បញ្ជីមុខម្ហូបក្នុងហាង' : 'Restaurant Menu Catalog'}
              </h3>
              <p className="text-xs text-stone-500 font-battambang">
                {lang === 'km' ? 'កែសម្រួល បន្ថែមមុខម្ហូបថ្មី ឬប្រើ AI ដើម្បីបង្កើតមុខម្ហូបខ្មែរស្វ័យប្រវត្តិ' : 'Add, edit, or use Gemini AI to generate authentic Khmer dishes'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="open-ai-dish-btn"
                onClick={() => handleAiGenerateDish()}
                disabled={isAiGenerating}
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiGenerating ? 'Gemini AI...' : (lang === 'km' ? 'AI បង្កើតមុខម្ហូប' : 'Gemini AI Dish')}</span>
              </button>

              <button
                id="add-new-dish-btn"
                onClick={() => setEditingItem({
                  name_km: '',
                  name_en: '',
                  description_km: '',
                  description_en: '',
                  price: 4.00,
                  category: (categories[0]?.id || 'soup') as MenuCategory,
                  imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
                  available: true,
                  spicyLevelOptions: true,
                  prepTimeMinutes: 10,
                })}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? 'បន្ថែមមុខម្ហូបថ្មី' : 'Add New Item'}</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills in Menu Table */}
          <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-stone-200 overflow-x-auto">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setSelectedMenuCategoryFilter('all')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedMenuCategoryFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? 'ទាំងអស់' : 'All'} ({menuItems.length})</span>
              </button>

              {categories.map((cat) => {
                const count = menuItems.filter(m => m.category === cat.id).length;
                const IconComponent = getCategoryIconComponent(cat.icon);
                const isSelected = selectedMenuCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedMenuCategoryFilter(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 font-kulen ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{lang === 'km' ? cat.name_km : cat.name_en}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition font-kulen"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'គ្រប់គ្រងប្រភេទ' : 'Manage Categories'}</span>
            </button>
          </div>

          {/* Menu Table / List */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 uppercase font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">{lang === 'km' ? 'រូបភាព' : 'Photo'}</th>
                    <th className="p-3.5">{lang === 'km' ? 'ឈ្មោះមុខម្ហូប (ខ្មែរ & English)' : 'Dish Names'}</th>
                    <th className="p-3.5">{lang === 'km' ? 'ប្រភេទ' : 'Category'}</th>
                    <th className="p-3.5">{lang === 'km' ? 'តម្លៃ' : 'Price'}</th>
                    <th className="p-3.5">{lang === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                    <th className="p-3.5 text-right">{lang === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {menuItems
                    .filter((item) => {
                      if (selectedMenuCategoryFilter === 'all') return true;
                      if (selectedMenuCategoryFilter === 'popular') return item.popular || item.category === 'popular';
                      return item.category === selectedMenuCategoryFilter;
                    })
                    .map((item) => {
                      const itemCat = categories.find(c => c.id === item.category);
                      const CatIcon = itemCat ? getCategoryIconComponent(itemCat.icon) : UtensilsCrossed;
                      return (
                        <tr key={item.id} className="hover:bg-stone-50/80 transition">
                          <td className="p-3">
                            <img
                              src={item.imageUrl}
                              alt={item.name_en}
                              className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-stone-900 block font-khmer text-sm">
                              {item.name_km}
                            </span>
                            <span className="text-stone-500 font-semibold">{item.name_en}</span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-md text-[11px] font-kulen">
                              <CatIcon className="w-3 h-3 text-amber-700" />
                              <span>{itemCat ? (lang === 'km' ? itemCat.name_km : itemCat.name_en) : item.category}</span>
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-amber-700 block">${item.price.toFixed(2)}</span>
                            <span className="text-[10px] text-stone-400">
                              {Math.round(item.price * config.exchangeRate).toLocaleString()} ៛
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.available ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {item.available ? 'Available' : 'Sold Out'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Category Management */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Categories Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FolderTree className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-lg text-stone-900 font-kulen tracking-wide">
                  {lang === 'km' ? 'គ្រប់គ្រងប្រភេទមុខម្ហូប (Category Management)' : 'Menu Categories & Tags'}
                </h3>
              </div>
              <p className="text-xs text-stone-500 font-battambang mt-1">
                {lang === 'km' 
                  ? 'អ្នកគ្រប់គ្រងអាចបង្កើតប្រភេទថ្មី កែសម្រួលឈ្មោះជាភាសាខ្មែរ/អង់គ្លេស ដូរបង្ហាញរូប Icon និងរៀបចំប៊ូតុង Filter លើទំព័រម៉ឺនុយភ្ញៀវ' 
                  : 'Manage custom categories, change icons, edit Khmer/English labels, and organize customer menu filters'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetCategories}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? 'កំណត់ប្រភេទដើមវិញ' : 'Reset Defaults'}</span>
              </button>

              <button
                id="add-category-btn"
                type="button"
                onClick={() => setEditingCategory({
                  id: '',
                  name_km: '',
                  name_en: '',
                  icon: 'UtensilsCrossed',
                  description_km: '',
                  description_en: '',
                  order: categories.length + 1,
                })}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition active:scale-95 font-kulen"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{lang === 'km' ? '+ បង្កើតប្រភេទថ្មី' : '+ Add New Category'}</span>
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {categoryFeedback && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold animate-fade-in font-battambang">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{categoryFeedback}</span>
            </div>
          )}

          {/* Search and stats bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                placeholder={lang === 'km' ? 'ស្វែងរកប្រភេទមុខម្ហូប...' : 'Search categories...'}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-battambang"
              />
              {categorySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCategorySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span>{lang === 'km' ? 'ចំនួនសរុប:' : 'Total:'}</span>
              <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md font-mono">
                {categories.length} {lang === 'km' ? 'ប្រភេទ' : 'Categories'}
              </span>
              <span>•</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-mono">
                {menuItems.length} {lang === 'km' ? 'មុខម្ហូបសរុប' : 'Total Dishes'}
              </span>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories
              .filter((c) => {
                if (!categorySearchQuery) return true;
                const q = categorySearchQuery.toLowerCase();
                return (
                  c.name_km.toLowerCase().includes(q) ||
                  c.name_en.toLowerCase().includes(q) ||
                  c.id.toLowerCase().includes(q)
                );
              })
              .map((cat, idx) => {
                const IconComponent = getCategoryIconComponent(cat.icon);
                const itemsInThisCategory = menuItems.filter(m => m.category === cat.id);

                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-300 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-stone-900 text-sm font-khmer flex items-center gap-1.5">
                              <span>{cat.name_km}</span>
                              <span className="text-[10px] text-stone-400 font-mono">#{idx + 1}</span>
                            </h4>
                            <p className="text-xs text-stone-500 font-semibold">{cat.name_en}</p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{cat.id}</span>
                        </span>
                      </div>

                      {/* Description or Khmer note */}
                      {cat.description_km && (
                        <p className="text-[11px] text-stone-500 font-battambang line-clamp-2 mb-2 bg-stone-50 p-2 rounded-lg">
                          {cat.description_km}
                        </p>
                      )}

                      {/* Dishes count pill */}
                      <div className="flex items-center justify-between text-xs py-2 border-t border-stone-100 mt-2">
                        <span className="text-stone-500 font-medium">
                          {lang === 'km' ? 'មុខម្ហូបក្នុងប្រភេទនេះ:' : 'Dishes in category:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMenuCategoryFilter(cat.id);
                            setActiveTab('menu');
                          }}
                          className="font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md transition text-xs flex items-center gap-1"
                        >
                          <UtensilsCrossed className="w-3 h-3" />
                          <span>{itemsInThisCategory.length} {lang === 'km' ? 'មុខម្ហូប' : 'Dishes'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 mt-2">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(cat)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{lang === 'km' ? 'កែសម្រួល' : 'Edit'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{lang === 'km' ? 'លុប' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Quick Add Preset Categories Section */}
          <div className="bg-gradient-to-br from-amber-50/70 via-stone-50 to-emerald-50/50 p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-stone-900 font-kulen tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'km' ? 'បន្ថែមប្រភេទពេញនិយមរហ័ស (Quick Presets)' : 'Quick-Add Popular Khmer Categories'}</span>
                </h4>
                <p className="text-xs text-stone-500 font-battambang">
                  {lang === 'km' ? 'ចុចតែម្តងដើម្បីបញ្ចូលប្រភេទមុខម្ហូបខ្មែរបន្ថែមទៀតទៅក្នុងហាង' : 'Click any preset to add it directly to your restaurant'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {POPULAR_CATEGORY_PRESETS.map((preset) => {
                const isAlreadyAdded = categories.some(c => c.id === preset.id);
                const PresetIcon = getCategoryIconComponent(preset.icon);

                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => handleSaveCategory({
                      id: preset.id,
                      name_km: preset.name_km,
                      name_en: preset.name_en,
                      icon: preset.icon,
                      description_km: preset.desc_km,
                      order: categories.length + 1,
                    })}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                      isAlreadyAdded
                        ? 'bg-stone-100/70 border-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                        : 'bg-white hover:bg-emerald-50 border-stone-200 hover:border-emerald-300 text-stone-800 shadow-2xs hover:shadow-xs active:scale-95'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-800 flex items-center justify-center shrink-0">
                      <PresetIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold font-khmer truncate">
                        {preset.name_km}
                      </p>
                      <p className="text-[10px] text-stone-500 font-medium truncate">
                        {isAlreadyAdded ? (lang === 'km' ? '✓ មានរួចហើយ' : '✓ Added') : `+ ${preset.name_en}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Staff & Chef Accounts Management */}
      {activeTab === 'staff' && (
        <StaffManagementTab lang={lang} />
      )}

      {/* Tab 2: Table QR Cards */}
      {activeTab === 'qr' && (
        <TableQRStation config={config} lang={lang} tenantId={config.id} />
      )}

      {/* Tab 3: Order History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-stone-900 font-khmer">
                {lang === 'km' ? 'ប្រវត្តិការកម្មង់តាមតុទាំងអស់' : 'All Order Transactions'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDailyReportModal(true)}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition font-khmer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? 'របាយការណ៍លក់ PDF' : 'Daily Report PDF'}</span>
                </button>

                <button
                  onClick={onRefreshOrders}
                  className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-semibold bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 uppercase font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Order #</th>
                    <th className="p-3.5">{lang === 'km' ? 'តុ' : 'Table'}</th>
                    <th className="p-3.5">{lang === 'km' ? 'មុខម្ហូប' : 'Items'}</th>
                    <th className="p-3.5">{lang === 'km' ? 'សរុប' : 'Total'}</th>
                    <th className="p-3.5">{lang === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                    <th className="p-3.5">{lang === 'km' ? 'ម៉ោង' : 'Time'}</th>
                    <th className="p-3.5 text-right">{lang === 'km' ? 'ព្រីន' : 'Receipt'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/80 transition">
                      <td className="p-3 font-mono font-bold text-stone-900">
                        #{order.orderNumber}
                      </td>
                      <td className="p-3">
                        <span className="bg-stone-900 text-white font-bold px-2 py-0.5 rounded-md text-[11px]">
                          Table #{order.tableNumber}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-800">
                          {order.items.length} {lang === 'km' ? 'មុខ' : 'items'}
                        </span>
                        <p className="text-[11px] text-stone-500 font-khmer truncate max-w-xs">
                          {order.items.map(i => `${i.quantity}x ${i.name_km}`).join(', ')}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-900">${order.total.toFixed(2)}</span>
                        <span className="text-[10px] text-stone-400 block">
                          {order.total_khr.toLocaleString()} ៛
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.status === 'new'
                            ? 'bg-red-50 text-red-700'
                            : order.status === 'preparing'
                            ? 'bg-amber-50 text-amber-700'
                            : order.status === 'ready'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-stone-500 text-[11px]">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onOpenReceiptModal(order)}
                          className="p-1.5 text-stone-700 hover:bg-stone-100 rounded-lg inline-flex items-center gap-1 border border-stone-200 text-xs font-semibold"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-500" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Role Passwords & Security Management */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-2xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-stone-900 font-khmer">
                      {lang === 'km' ? 'ការគ្រប់គ្រងពាក្យសម្ងាត់ & សុវត្ថិភាពចូលគណនី' : 'Role Passwords & Security Management'}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Cloud Synced</span>
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-battambang">
                    {lang === 'km' 
                      ? 'អ្នកគ្រប់គ្រង (Admin) អាចផ្លាស់ប្តូរ និងកំណត់ឡើងវិញ (Reset) ពាក្យសម្ងាត់សម្រាប់ប្រភេទនីមួយៗបានគ្រប់ពេល'
                      : 'Admin can customize and reset passwords/PINs for each role anytime with instant multi-device synchronization.'}
                  </p>
                </div>
              </div>

              {/* Master Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAllPasswordsToDefault}
                  className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3.5 py-2 rounded-xl text-xs border border-stone-300 transition active:scale-95 shadow-2xs font-khmer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                  <span>{lang === 'km' ? 'Reset ទាំងអស់ទៅលំនាំដើម' : 'Reset All to Default'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAllPasswords}
                  disabled={isSavingConfig}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95 shadow-md font-khmer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingConfig ? 'Saving...' : (lang === 'km' ? 'រក្សាទុកទាំងអស់' : 'Save All Passwords')}</span>
                </button>
              </div>
            </div>

            {/* Feedback alert */}
            {passwordFeedback && (
              <div className="mt-4 p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 font-battambang animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{passwordFeedback}</span>
              </div>
            )}

            {/* Chef Email Registration CTA */}
            <div className="mt-4 p-4 bg-amber-50/80 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-950 text-xs sm:text-sm font-khmer">
                    {lang === 'km' ? 'ចង់ចុះឈ្មោះ Email & Password ផ្ទាល់ខ្លួនសម្រាប់ចុងភៅ?' : 'Need to register individual Chef Email & Password accounts?'}
                  </h4>
                  <p className="text-[11px] text-amber-800 font-battambang">
                    {lang === 'km' 
                      ? 'អ្នកអាចបង្កើតគណនី Email និង Password ដាច់ដោយឡែកសម្រាប់ចុងភៅម្នាក់ៗនៅក្នុងផ្ទាំង "បុគ្គលិក & ចុងភៅ"'
                      : 'You can create individual email and password credentials for each chef in the Staff & Chefs tab.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 font-khmer shadow-xs shrink-0 cursor-pointer"
              >
                <span>{lang === 'km' ? 'ទៅកាន់ផ្ទាំងបុគ្គលិក & ចុងភៅ' : 'Open Staff & Chef Tab'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3 Role Password Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Chef Tablet Password */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm font-khmer">
                        {lang === 'km' ? '១. ពាក្យសម្ងាត់ចុងភៅ (Chef)' : '1. Chef Kitchen PIN'}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-semibold block">Kitchen Tablet Display</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-mono px-2 py-0.5 rounded-md font-bold">
                    Default: 1234
                  </span>
                </div>

                <p className="text-xs text-stone-500 font-battambang">
                  {lang === 'km' 
                    ? 'លេខកូដសម្រាប់បុគ្គលិកចុងភៅចូលមើលការកម្មង់ និងចុច Done / ធ្វើរួច'
                    : 'PIN code for kitchen staff to view live incoming orders and mark dishes ready.'}
                </p>

                {/* Input & Toggle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-700 block font-khmer">
                    {lang === 'km' ? 'លេខសម្ងាត់ចុងភៅបច្ចុប្បន្ន:' : 'Configured Chef PIN:'}
                  </label>
                  <div className="relative">
                    <input
                      type={showChefPin ? 'text' : 'password'}
                      value={chefPinInput}
                      onChange={(e) => setChefPinInput(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full py-2.5 px-3.5 pr-10 bg-stone-50 rounded-xl border border-stone-300 font-mono text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowChefPin(!showChefPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showChefPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleResetIndividualPassword('chef')}
                  className="flex-1 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs border border-stone-300 transition flex items-center justify-center gap-1 font-khmer"
                >
                  <RotateCcw className="w-3 h-3 text-stone-500" />
                  <span>{lang === 'km' ? 'Reset (1234)' : 'Reset Default'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveIndividualPassword('chef', chefPinInput)}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1 font-khmer"
                >
                  <Save className="w-3 h-3" />
                  <span>{lang === 'km' ? 'រក្សាទុក Chef' : 'Save Chef'}</span>
                </button>
              </div>
            </div>

            {/* Card 2: Admin Dashboard Password */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm font-khmer">
                        {lang === 'km' ? '២. ពាក្យសម្ងាត់ Admin (Manager)' : '2. Admin Portal PIN'}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-semibold block">Full POS & Settings Access</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 font-mono px-2 py-0.5 rounded-md font-bold">
                    Default: 8888
                  </span>
                </div>

                <p className="text-xs text-stone-500 font-battambang">
                  {lang === 'km' 
                    ? 'លេខកូដសម្រាប់ម្ចាស់ហាង និងអ្នកគ្រប់គ្រងកែសម្រួលមុខម្ហូប ការកំណត់ និង Telegram'
                    : 'PIN code for restaurant manager to edit menu, prices, receipts, and configurations.'}
                </p>

                {/* Input & Toggle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-700 block font-khmer">
                    {lang === 'km' ? 'លេខសម្ងាត់ Admin បច្ចុប្បន្ន:' : 'Configured Admin PIN:'}
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPin ? 'text' : 'password'}
                      value={adminPinInput}
                      onChange={(e) => setAdminPinInput(e.target.value)}
                      placeholder="e.g. 8888"
                      className="w-full py-2.5 px-3.5 pr-10 bg-stone-50 rounded-xl border border-stone-300 font-mono text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPin(!showAdminPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleResetIndividualPassword('admin')}
                  className="flex-1 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs border border-stone-300 transition flex items-center justify-center gap-1 font-khmer"
                >
                  <RotateCcw className="w-3 h-3 text-stone-500" />
                  <span>{lang === 'km' ? 'Reset (8888)' : 'Reset Default'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveIndividualPassword('admin', adminPinInput)}
                  className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1 font-khmer"
                >
                  <Save className="w-3 h-3" />
                  <span>{lang === 'km' ? 'រក្សាទុក Admin' : 'Save Admin'}</span>
                </button>
              </div>
            </div>

            {/* Card 3: Table QR & Waiter Password */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-sm font-khmer">
                        {lang === 'km' ? '៣. ពាក្យសម្ងាត់ប័ណ្ណ QR តុ' : '3. Table QR Station PIN'}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-semibold block">Table QR Generation & Print</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 font-mono px-2 py-0.5 rounded-md font-bold">
                    Default: 1234
                  </span>
                </div>

                <p className="text-xs text-stone-500 font-battambang">
                  {lang === 'km' 
                    ? 'លេខកូដសម្រាប់បុគ្គលិករត់តុចូលមើលប័ណ្ណ QR កូដលើតុ និងព្រីន QR ដាក់លើតុ'
                    : 'PIN code for waitstaff to manage table cards and print thermal QR stickers.'}
                </p>

                {/* Input & Toggle */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-700 block font-khmer">
                    {lang === 'km' ? 'លេខសម្ងាត់ Table QR បច្ចុប្បន្ន:' : 'Configured Table QR PIN:'}
                  </label>
                  <div className="relative">
                    <input
                      type={showTableQrPin ? 'text' : 'password'}
                      value={tableQrPinInput}
                      onChange={(e) => setTableQrPinInput(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full py-2.5 px-3.5 pr-10 bg-stone-50 rounded-xl border border-stone-300 font-mono text-sm font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTableQrPin(!showTableQrPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showTableQrPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => handleResetIndividualPassword('table_qr')}
                  className="flex-1 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs border border-stone-300 transition flex items-center justify-center gap-1 font-khmer"
                >
                  <RotateCcw className="w-3 h-3 text-stone-500" />
                  <span>{lang === 'km' ? 'Reset (1234)' : 'Reset Default'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveIndividualPassword('table_qr', tableQrPinInput)}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1 font-khmer"
                >
                  <Save className="w-3 h-3" />
                  <span>{lang === 'km' ? 'រក្សាទុក QR' : 'Save QR'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Security Guide & Testing Box */}
          <div className="bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 shadow-md space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-900 flex items-center justify-center font-bold">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm font-khmer text-amber-400">
                  {lang === 'km' ? 'សេចក្តីណែនាំអំពីសុវត្ថិភាព និងការសាកល្បង (Security Guide)' : 'Role Security & Access Guidelines'}
                </h4>
                <p className="text-[11px] text-stone-300 font-battambang">
                  {lang === 'km' ? 'របៀបប្រើប្រាស់លេខកូដសម្ងាត់សម្រាប់ឧបករណ៍ក្នុងហាង' : 'How configured PINs protect kitchen, POS, and printing stations'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-stone-300">
              <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60">
                <span className="font-bold text-amber-300 block mb-1 font-khmer">👨‍🍳 សម្រាប់ចុងភៅ:</span>
                <p className="text-[11px] font-battambang">
                  {lang === 'km' 
                    ? 'បុគ្គលិកផ្ទះបាយប្រើប្រាស់លេខកូដនេះដើម្បីបើកអេក្រង់ Kitchen Tablet។ ពួកគេមិនអាចលុប ឬកែតម្លៃមុខម្ហូបបានឡើយ។'
                    : 'Kitchen staff enter this PIN on tablet to manage orders without accessing financial settings.'}
                </p>
              </div>

              <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60">
                <span className="font-bold text-purple-300 block mb-1 font-khmer">🛡️ សម្រាប់ម្ចាស់ហាង (Admin):</span>
                <p className="text-[11px] font-battambang">
                  {lang === 'km' 
                    ? 'លេខកូដការពារខ្ពស់បំផុតសម្រាប់ចូលផ្ទាំងគ្រប់គ្រង ការកំណត់ប្រាក់ និង Telegram Bot។'
                    : 'Master PIN providing full control over restaurant catalog, thermal printer, and passwords.'}
                </p>
              </div>

              <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60">
                <span className="font-bold text-blue-300 block mb-1 font-khmer">📱 សម្រាប់ប័ណ្ណ QR តុ:</span>
                <p className="text-[11px] font-battambang">
                  {lang === 'km' 
                    ? 'បុគ្គលិករត់តុអាចមើលតារាង QR តុ និងព្រីន QR Sticker សម្រាប់បិទលើតុនីមួយៗ។'
                    : 'Allows floor staff to generate and print table QR stickers for dining customers.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Security & Passwords */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg font-kulen tracking-wide text-stone-900">
                {lang === 'km' ? 'ពាក្យសម្ងាត់ & សុវត្ថិភាព (Security PINs)' : 'Role Security & Password Controls'}
              </h2>
              <p className="text-xs text-stone-500 font-battambang">
                {lang === 'km'
                  ? 'កំណត់លេខសម្ងាត់សម្រាប់ចូលផ្ទាំងគ្រប់គ្រង Admin បុគ្គលិក និងប័ណ្ណ QR កូដ'
                  : 'Manage access PINs for Administrator, Staff, and Table QR Station.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePasswords} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 font-kulen">
                {lang === 'km' ? 'លេខសម្ងាត់ Admin PIN (លំនាំដើម 8888)' : 'Admin Dashboard PIN (Default: 8888)'}
              </label>
              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 font-kulen">
                {lang === 'km' ? 'លេខសម្ងាត់ Table QR Station PIN (លំនាំដើម 1234)' : 'Table QR Station PIN (Default: 1234)'}
              </label>
              <input
                type="password"
                value={tableQrPinInput}
                onChange={(e) => setTableQrPinInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingPasswords}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-md active:scale-95 flex items-center justify-center gap-2 font-khmer cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingPasswords ? (lang === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (lang === 'km' ? 'រក្សាទុកលេខសម្ងាត់' : 'Save Security PINs')}</span>
            </button>

            {passwordFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordFeedback}</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 7: External API & Database Connect */}
      {activeTab === 'api' && (
        <ExternalApiPortal
          config={configForm}
          lang={lang}
          onUpdateConfig={async (updated) => {
            const newConf = { ...configForm, ...updated };
            setConfigForm(newConf);
            await updateRestaurantConfig(newConf);
            onRefreshConfig();
          }}
        />
      )}

        </div>
      </div>

      {/* Edit / Add Menu Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm font-khmer">
                {editingItem.id
                  ? (lang === 'km' ? 'កែសម្រួលមុខម្ហូប' : 'Edit Menu Item')
                  : (lang === 'km' ? 'បន្ថែមមុខម្ហូបថ្មី' : 'Add New Menu Item')}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 rounded-lg hover:bg-stone-800 text-stone-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div>
                <label className="block font-bold text-stone-700 mb-1 font-khmer">
                  {lang === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ (Khmer Name)' : 'Khmer Dish Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. សម្លម្ជូរគ្រឿងសាច់គោ"
                  value={editingItem.name_km || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name_km: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-khmer text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {lang === 'km' ? 'ឈ្មោះជាភាសាអង់គ្លេស (English Name)' : 'English Dish Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khmer Beef Sour Soup"
                  value={editingItem.name_en || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name_en: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {lang === 'km' ? 'តម្លៃ (USD)' : 'Price (USD)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={editingItem.price || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-700">
                      {lang === 'km' ? 'ប្រភេទមុខម្ហូប (Category)' : 'Category'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory({
                          id: '',
                          name_km: '',
                          name_en: '',
                          icon: 'UtensilsCrossed',
                          description_km: '',
                          description_en: '',
                          order: categories.length + 1,
                        });
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] inline-flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'km' ? '+ បង្កើតប្រភេទថ្មី' : '+ New Category'}</span>
                    </button>
                  </div>
                  <select
                    value={editingItem.category || (categories[0]?.id || 'soup')}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as MenuCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-khmer text-xs"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name_km} ({cat.name_en})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-stone-700 text-xs">
                    {lang === 'km' ? 'រូបភាពមុខម្ហូប (Cloudinary CDN / URL)' : 'Dish Image (Cloudinary CDN / URL)'}
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    <Cloud className="w-3 h-3" />
                    <span>Cloudinary ({defaultCloudinaryConfig.cloudName} / {defaultCloudinaryConfig.keyName})</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 space-y-1.5">
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={editingItem.imageUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono"
                    />

                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-1.5 px-3 rounded-xl border border-stone-300 flex items-center justify-center gap-1.5 transition text-xs">
                        <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
                        <span>{isUploadingImage ? 'Uploading...' : (lang === 'km' ? 'Upload ទៅ Cloudinary' : 'Upload File to Cloudinary')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingImage}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUploadToCloudinary(f);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {cloudinaryUploadNotice && (
                      <p className="text-[11px] text-sky-700 font-medium">
                        {cloudinaryUploadNotice}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-1 border border-stone-200 rounded-xl overflow-hidden h-20 bg-stone-50 flex items-center justify-center relative">
                    {editingItem.imageUrl ? (
                      <img
                        src={editingItem.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-stone-400 text-[10px]">
                        <ImageIcon className="w-5 h-5 mx-auto opacity-50 mb-0.5" />
                        <span>No image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Cloudinary Sample Presets */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    {lang === 'km' ? 'ឬជ្រើសរើសរូបគំរូ Cloudinary:' : 'Or pick high-res Khmer food preset:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleCloudinaryGallery.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, imageUrl: preset.url })}
                        className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium px-2 py-1 rounded-lg border border-stone-200 transition"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 font-khmer">
                  {lang === 'km' ? 'ការពិពណ៌នាជាភាសាខ្មែរ' : 'Description (Khmer)'}
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description_km || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description_km: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-khmer"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={editingItem.spicyLevelOptions ?? false}
                    onChange={(e) => setEditingItem({ ...editingItem, spicyLevelOptions: e.target.checked })}
                    className="rounded-sm"
                  />
                  <span>{lang === 'km' ? 'ជម្រើសកម្រិតហឹរ' : 'Spicy Options'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={editingItem.available ?? true}
                    onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                    className="rounded-sm"
                  />
                  <span>{lang === 'km' ? 'មានលក់ (In Stock)' : 'In Stock'}</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Add Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm font-khmer">
                  {editingCategory.id
                    ? (lang === 'km' ? 'កែសម្រួលប្រភេទមុខម្ហូប' : 'Edit Menu Category')
                    : (lang === 'km' ? 'បង្កើតប្រភេទមុខម្ហូបថ្មី' : 'Create New Menu Category')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="w-7 h-7 rounded-lg hover:bg-emerald-700 text-emerald-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveCategory(editingCategory);
              }}
              className="p-5 overflow-y-auto space-y-4 text-xs flex-1"
            >
              {/* Khmer Name */}
              <div>
                <label className="block font-bold text-stone-700 mb-1 font-khmer">
                  {lang === 'km' ? 'ឈ្មោះប្រភេទជាភាសាខ្មែរ (Khmer Category Name)' : 'Khmer Category Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. គ្រឿងសមុទ្រស្រស់, ម្ហូបបួស, បង្អែម..."
                  value={editingCategory.name_km || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingCategory(prev => ({
                      ...prev,
                      name_km: val,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-khmer text-sm"
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {lang === 'km' ? 'ឈ្មោះជាភាសាអង់គ្លេស (English Name)' : 'English Category Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Seafood, Khmer Salads, Beers..."
                  value={editingCategory.name_en || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingCategory(prev => {
                      const autoKey = !prev?.id ? val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : prev.id;
                      return {
                        ...prev,
                        name_en: val,
                        id: prev?.id || autoKey,
                      };
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              {/* Category Slug / Key */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {lang === 'km' ? 'កូដសម្គាល់ប្រភេទ (Category ID Key)' : 'Category ID Key (slug)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. seafood, vegetarian, cocktails..."
                  value={editingCategory.id || ''}
                  onChange={(e) => setEditingCategory(prev => ({
                    ...prev,
                    id: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                  }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-xs bg-stone-50"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {lang === 'km' ? 'កូដសម្គាល់សម្រាប់ប្រព័ន្ធ និង database' : 'System key used in database filters'}
                </p>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block font-bold text-stone-700 mb-1.5">
                  {lang === 'km' ? 'ជ្រើសរើសរូបតំណាង (Category Icon)' : 'Select Category Icon'}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 max-h-36 overflow-y-auto">
                  {AVAILABLE_CATEGORY_ICONS.map((ic) => {
                    const IconComp = getCategoryIconComponent(ic.name);
                    const isSelected = (editingCategory.icon || 'UtensilsCrossed') === ic.name;

                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setEditingCategory(prev => ({ ...prev, icon: ic.name }))}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs scale-105'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                        title={ic.label}
                      >
                        <IconComp className="w-5 h-5 mb-1" />
                        <span className="text-[9px] font-medium truncate w-full text-center">
                          {ic.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-stone-700 mb-1 font-khmer">
                  {lang === 'km' ? 'ការពិពណ៌នាបន្ថែម (Khmer Description)' : 'Khmer Description / Subtitle'}
                </label>
                <textarea
                  rows={2}
                  placeholder="ឧ. គ្រឿងសមុទ្រស្រស់ៗ មឹក បង្គា ក្តាម ត្រីដុត..."
                  value={editingCategory.description_km || ''}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, description_km: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-khmer"
                />
              </div>

              {/* Preview Banner */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
                {(() => {
                  const PreviewIcon = getCategoryIconComponent(editingCategory.icon || 'UtensilsCrossed');
                  return (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <PreviewIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-stone-900 text-xs font-khmer truncate">
                          {editingCategory.name_km || (lang === 'km' ? 'ឈ្មោះជាភាសាខ្មែរ' : 'Khmer Name')}
                        </p>
                        <p className="text-[10px] text-stone-500 font-medium truncate">
                          {editingCategory.name_en || 'English Name'} • <span className="font-mono">{editingCategory.id || 'slug'}</span>
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs"
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? 'រក្សាទុកប្រភេទ' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Report PDF Modal */}
      {showDailyReportModal && (
        <DailyReportModal
          orders={orders}
          config={config}
          lang={lang}
          onClose={() => setShowDailyReportModal(false)}
        />
      )}
    </div>
  );
};
