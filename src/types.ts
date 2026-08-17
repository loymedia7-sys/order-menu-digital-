export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export type TenantPlan = 'free' | 'normal' | 'pro';
export type TenantRole = 'admin' | 'chef' | 'waiter' | 'staff' | 'manager';

export interface TenantInfo {
  id: string; // tenantId (e.g. 'shop_123' or slug)
  shopName: string;
  shopName_km?: string;
  slug: string; // e.g. 'loyy-restaurant'
  ownerUid: string;
  plan: TenantPlan;
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  phone?: string;
  logoUrl?: string;
  openTime?: string;
  closeTime?: string;
  address_km?: string;
  address_en?: string;
  tablesCount?: number;
  exchangeRate?: number;
  telegramEnabled?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  ttsEnabled?: boolean;
}

export interface TenantUserProfile {
  uid: string;
  email: string;
  tenantId: string;
  role: TenantRole;
  displayName?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface TenantStaffMember {
  uid: string;
  email: string;
  name: string;
  role: TenantRole;
  pin?: string;
  station?: string;
  status: 'active' | 'inactive';
  joinedAt: string;
}

export interface CategoryItem {
  id: string; // e.g. 'soup', 'popular', 'stirfry', 'seafood', 'breakfast', 'beverages'
  name_km: string;
  name_en: string;
  icon?: string; // e.g. 'Star', 'Soup', 'Flame', 'Beef', 'CookingPot', 'Coffee', 'IceCream', 'Fish', 'Salad', 'Pizza', 'Beer', 'Sparkles', 'UtensilsCrossed'
  description_km?: string;
  description_en?: string;
  order?: number;
}

export type MenuCategory = 
  | 'popular'
  | 'soup'
  | 'stirfry'
  | 'grill'
  | 'rice_noodle'
  | 'drinks'
  | 'dessert'
  | string;

export interface MenuItem {
  id: string;
  name_km: string;
  name_en: string;
  description_km: string;
  description_en: string;
  price: number; // in USD
  category: MenuCategory;
  imageUrl: string;
  available: boolean;
  stockQuantity?: number;
  costPrice?: number;
  sku?: string;
  spicyLevelOptions?: boolean;
  sweetnessOptions?: boolean;
  popular?: boolean;
  prepTimeMinutes?: number;
}

export interface OrderItem {
  itemId: string;
  name_km: string;
  name_en: string;
  price: number;
  quantity: number;
  selectedSpicy?: string;
  selectedSweetness?: string;
  notes?: string;
  itemTotal: number;
}

export interface Order {
  id: string;
  orderNumber: number;
  tableNumber: number;
  items: OrderItem[];
  total: number; // USD
  total_khr: number; // KHR
  status: OrderStatus;
  createdAt: string; // ISO string
  restaurantId: string;
  announced: boolean; // Tracks whether kitchen Khmer speech alert has fired
  printed: boolean; // Tracks whether RawBT print job has triggered
  customerName?: string;
  customerNote?: string;
  paymentMethod?: 'cash' | 'aba_khqr' | 'pending';
  telegramSent?: boolean;
}

export interface RegisteredAdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'superadmin' | 'admin' | 'manager' | 'kitchen';
  registeredAt: string;
  lastLoginAt?: string;
  status: 'active' | 'suspended';
  createdVia: 'firebase' | 'api' | 'admin_portal';
  notes?: string;
}

export interface AllDatabasePayload {
  status: 'success';
  timestamp: string;
  serverVersion: string;
  restaurant: RestaurantConfig;
  menu: MenuItem[];
  categories: CategoryItem[];
  orders: Order[];
  registeredUsers: RegisteredAdminUser[];
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    totalRevenueUSD: number;
    totalRevenueKHR: number;
    totalMenuItems: number;
    categoriesCount: number;
    registeredAdminsCount: number;
  };
}

export interface RestaurantConfig {
  id: string;
  name_km: string;
  name_en: string;
  address_km: string;
  address_en: string;
  phone: string;
  logoUrl?: string;
  openTime?: string;
  closeTime?: string;
  wifiName?: string;
  wifiPassword?: string;
  plan?: TenantPlan;
  chefName?: string;
  chefPassword?: string;
  tablesCount: number;
  exchangeRate: number; // 1 USD = KHR (e.g. 4100)
  apiKey?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramEnabled: boolean;
  printerType: '58mm' | '80mm';
  printerAutoPrint: boolean;
  printerEncoding: 'UTF-8' | 'GB18030';
  ttsVoice: 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir';
  ttsSpeed: number;
  ttsEnabled: boolean;
  bellAlertEnabled: boolean;
  passwords?: {
    chef?: string;
    admin?: string;
    table_qr?: string;
  };
  chefPin?: string;
  adminPin?: string;
  tableQrPin?: string;
  categories?: CategoryItem[];
}

export interface TTSRequest {
  tableNumber: number;
  itemCount?: number;
  orderTotal?: number;
  customText?: string;
  voiceName?: string;
}

export interface TTSResponse {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  sampleRate?: number;
  text: string;
  source: 'gemini' | 'cache' | 'synthetic';
}

export interface TelegramNotifyRequest {
  orderId: string;
  tableNumber: number;
  items: OrderItem[];
  total: number;
  total_khr: number;
  customerNote?: string;
}
