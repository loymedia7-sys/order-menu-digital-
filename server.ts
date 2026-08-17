import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { initialMenuItems, initialRestaurantConfig } from './src/data/initialData';
import { MenuItem, Order, RestaurantConfig, TTSResponse, RegisteredAdminUser, AllDatabasePayload } from './src/types';
import { getKhmerNumberWord, getKhmerDigits, getKhmerOrderAnnouncement } from './src/lib/khmerNumerals';

// In-memory persistent database for the full-stack session
let menuItems: MenuItem[] = [...initialMenuItems];
let restaurantConfig: RestaurantConfig = { 
  ...initialRestaurantConfig,
  apiKey: initialRestaurantConfig.apiKey || 'tableqr_live_sec_8923kjd'
};

// Initial registered admin accounts authorized for login & external management
let registeredUsers: RegisteredAdminUser[] = [
  {
    id: 'usr_owner_01',
    email: 'jirouvu05@gmail.com',
    name: 'Jirou (Owner & Superadmin)',
    role: 'superadmin',
    registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date().toISOString(),
    status: 'active',
    createdVia: 'firebase',
    notes: 'Primary Restaurant Owner & Superadmin Account',
  },
  {
    id: 'usr_admin_02',
    email: 'admin@restaurant.com',
    name: 'Restaurant Admin',
    role: 'admin',
    registeredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    createdVia: 'admin_portal',
    notes: 'General Restaurant Manager',
  },
  {
    id: 'usr_chef_03',
    email: 'kitchen@restaurant.com',
    name: 'Executive Head Chef',
    role: 'kitchen',
    registeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    createdVia: 'admin_portal',
    notes: 'Kitchen station lead',
  }
];

let orders: Order[] = [
  {
    id: 'ord_sample_1',
    orderNumber: 101,
    tableNumber: 5,
    items: [
      {
        itemId: 'menu_01',
        name_km: 'សម្លម្ជូរគ្រឿងសាច់គោ',
        name_en: 'Khmer Beef Sour Soup (Kroeung)',
        price: 4.50,
        quantity: 1,
        selectedSpicy: 'ហឹរមធ្យម (Medium)',
        notes: 'សូមដាក់ស្លឹកត្រកួនច្រើនបន្តិច',
        itemTotal: 4.50,
      },
      {
        itemId: 'menu_02',
        name_km: 'ឡុកឡាក់សាច់គោបាយពងទា',
        name_en: 'Beef Lok Lak with Fried Egg & Rice',
        price: 5.00,
        quantity: 1,
        selectedSpicy: 'ហឹរតិច (Mild)',
        itemTotal: 5.00,
      },
      {
        itemId: 'menu_09',
        name_km: 'តែបៃតងដោះគោទឹកកក',
        name_en: 'Khmer Style Iced Green Tea with Sweet Milk',
        price: 1.50,
        quantity: 2,
        selectedSweetness: 'ផ្អែមល្មម (50%)',
        itemTotal: 3.00,
      }
    ],
    total: 12.50,
    total_khr: 51250,
    status: 'new',
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    restaurantId: 'rest_01',
    announced: false,
    printed: false,
    customerName: 'Sokha Ly',
    customerNote: 'សូមធ្វើប្រញាប់បន្តិច ឃ្លានខ្លាំង',
    paymentMethod: 'aba_khqr',
    telegramSent: true,
  },
  {
    id: 'ord_sample_2',
    orderNumber: 102,
    tableNumber: 3,
    items: [
      {
        itemId: 'menu_03',
        name_km: 'អាម៉ុកត្រីរដូវថ្មីស្លឹកចេក',
        name_en: 'Traditional Fish Amok in Banana Leaf',
        price: 5.50,
        quantity: 2,
        selectedSpicy: 'ហឹរខ្លាំង (Hot)',
        itemTotal: 11.00,
      },
      {
        itemId: 'menu_10',
        name_km: 'កាហ្វេទឹកដោះគោទឹកកកខ្មែរ',
        name_en: 'Authentic Khmer Iced Milk Coffee',
        price: 1.50,
        quantity: 2,
        selectedSweetness: 'ផ្អែមខ្លាំង (100%)',
        itemTotal: 3.00,
      }
    ],
    total: 14.00,
    total_khr: 57400,
    status: 'preparing',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    restaurantId: 'rest_01',
    announced: true,
    printed: true,
    customerName: 'Dara Chan',
    paymentMethod: 'cash',
    telegramSent: true,
  }
];

let nextOrderNumber = 103;

// Cache for generated Khmer TTS audio to guarantee instant zero-latency speech for common table numbers
const ttsAudioCache = new Map<string, string>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Universal CORS Middleware for external Admin Panels & Mobile Apps
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, Accept, X-Requested-With, X-Admin-Client');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Lazy Gemini Client
  function getGeminiClient(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Helper to calculate real-time analytics for all database payload
  function calculateDatabaseStats() {
    const totalRevenueUSD = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
    const totalRevenueKHR = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? (o.total_khr || Math.round(o.total * restaurantConfig.exchangeRate)) : 0), 0);
    const activeOrders = orders.filter(o => o.status === 'new' || o.status === 'preparing' || o.status === 'ready').length;
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'served').length;

    return {
      totalOrders: orders.length,
      activeOrders,
      completedOrders,
      totalRevenueUSD: Number(totalRevenueUSD.toFixed(2)),
      totalRevenueKHR,
      totalMenuItems: menuItems.length,
      categoriesCount: restaurantConfig.categories?.length || 0,
      registeredAdminsCount: registeredUsers.length,
    };
  }

  // --- API Routes ---

  // Health check & Server Status
  app.get(['/api/health', '/api/v1/health'], (req, res) => {
    res.json({
      status: 'online',
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      ordersCount: orders.length,
      menuCount: menuItems.length,
      registeredUsersCount: registeredUsers.length,
      apiKeyConfigured: Boolean(restaurantConfig.apiKey),
    });
  });

  // =========================================================================
  // 🌟 1. ALL DATABASE & SYNC API (For External Admin Panels)
  // =========================================================================

  /**
   * GET /api/v1/database/all or /api/v1/sync
   * Unified single endpoint that returns entire database in one JSON payload
   */
  app.get(['/api/v1/database/all', '/api/v1/sync', '/api/external/database'], (req, res) => {
    const payload: AllDatabasePayload = {
      status: 'success',
      timestamp: new Date().toISOString(),
      serverVersion: '1.2.0',
      restaurant: restaurantConfig,
      menu: menuItems,
      categories: restaurantConfig.categories || [],
      orders,
      registeredUsers,
      stats: calculateDatabaseStats(),
    };
    res.json(payload);
  });

  /**
   * POST /api/v1/database/import
   * Allows external admin panel to bulk import/restore menu items, categories, or config
   */
  app.post(['/api/v1/database/import', '/api/v1/sync/bulk'], (req, res) => {
    const { menu, categories, restaurant, config: incomingConfig } = req.body;
    let importedItemsCount = 0;
    
    if (Array.isArray(menu)) {
      menuItems = menu;
      importedItemsCount = menu.length;
    }
    if (Array.isArray(categories)) {
      restaurantConfig.categories = categories;
    }
    if (restaurant || incomingConfig) {
      restaurantConfig = { ...restaurantConfig, ...(restaurant || incomingConfig) };
    }

    res.json({
      success: true,
      message: 'Database imported successfully from external admin panel',
      importedMenuCount: importedItemsCount,
      totalOrders: orders.length,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/v1/stats or /api/v1/analytics
   * Business statistics, top dishes & sales breakdown
   */
  app.get(['/api/v1/stats', '/api/v1/analytics'], (req, res) => {
    const stats = calculateDatabaseStats();
    
    // Calculate top selling dishes
    const dishSalesMap = new Map<string, { name_km: string; name_en: string; totalQuantity: number; revenue: number }>();
    orders.forEach(ord => {
      if (ord.status !== 'cancelled') {
        ord.items.forEach(it => {
          const current = dishSalesMap.get(it.itemId) || {
            name_km: it.name_km,
            name_en: it.name_en,
            totalQuantity: 0,
            revenue: 0,
          };
          current.totalQuantity += it.quantity;
          current.revenue += it.price * it.quantity;
          dishSalesMap.set(it.itemId, current);
        });
      }
    });

    const topSellingDishes = Array.from(dishSalesMap.entries())
      .map(([itemId, val]) => ({ itemId, ...val, revenue: Number(val.revenue.toFixed(2)) }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      summary: stats,
      topSellingDishes,
      activeOrdersList: orders.filter(o => o.status === 'new' || o.status === 'preparing' || o.status === 'ready'),
    });
  });

  // =========================================================================
  // 🌟 2. REGISTERED LOGIN EMAILS & AUTHENTICATION MANAGEMENT API
  // =========================================================================

  /**
   * GET /api/v1/auth/emails or /api/v1/users
   * Take all emails that were registered to log in
   */
  app.get(['/api/v1/auth/emails', '/api/v1/users', '/api/auth/registered-emails'], (req, res) => {
    res.json({
      status: 'success',
      count: registeredUsers.length,
      users: registeredUsers,
      emails: registeredUsers.map(u => u.email),
    });
  });

  /**
   * GET /api/v1/auth/emails/list
   * Returns clean array of authorized email strings for quick validation
   */
  app.get('/api/v1/auth/emails/list', (req, res) => {
    res.json(registeredUsers.map(u => u.email));
  });

  /**
   * POST /api/v1/auth/verify-email
   * Verify if an email is registered & active to log into the admin system
   */
  app.post(['/api/v1/auth/verify-email', '/api/auth/verify'], (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (user) {
      return res.json({
        registered: true,
        allowedToLogin: user.status === 'active',
        status: user.status,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          registeredAt: user.registeredAt,
          lastLoginAt: user.lastLoginAt,
        },
      });
    }

    res.json({
      registered: false,
      allowedToLogin: false,
      message: 'This email is not registered in the system.',
    });
  });

  /**
   * POST /api/v1/auth/emails or /api/v1/users
   * Register a new email authorized to log in
   */
  app.post(['/api/v1/auth/emails', '/api/v1/users', '/api/auth/register-email'], (req, res) => {
    const { email, name, role, notes, createdVia } = req.body;
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
    
    if (existing) {
      // Update existing user record
      existing.name = name || existing.name;
      existing.role = role || existing.role;
      existing.notes = notes || existing.notes;
      existing.status = 'active';
      return res.json({
        success: true,
        message: 'Existing registered user updated successfully',
        user: existing,
      });
    }

    const newUser: RegisteredAdminUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      role: (role as any) || 'admin',
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'active',
      createdVia: createdVia || 'api',
      notes: notes || 'Registered via External Admin API',
    };

    registeredUsers.push(newUser);
    res.status(201).json({
      success: true,
      message: 'New admin email registered successfully',
      user: newUser,
    });
  });

  /**
   * POST /api/v1/auth/record-login
   * Records a login event for an email
   */
  app.post('/api/v1/auth/record-login', (req, res) => {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let user = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (user) {
      user.lastLoginAt = new Date().toISOString();
      if (name && !user.name) user.name = name;
    } else {
      user = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        role: 'admin',
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        status: 'active',
        createdVia: 'firebase',
      };
      registeredUsers.push(user);
    }

    res.json({ success: true, user });
  });

  /**
   * PUT /api/v1/users/:id
   * Update user permissions, role, status or notes
   */
  app.put(['/api/v1/users/:id', '/api/users/:id'], (req, res) => {
    const { id } = req.params;
    const user = registeredUsers.find(u => u.id === id || u.email.toLowerCase() === id.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'Registered user not found' });
    }

    const { name, role, status, notes } = req.body;
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (notes !== undefined) user.notes = notes;

    res.json({ success: true, user });
  });

  /**
   * DELETE /api/v1/users/:id or /api/v1/auth/emails/:email
   * Remove a registered email
   */
  app.delete(['/api/v1/users/:id', '/api/v1/auth/emails/:email', '/api/users/:id'], (req, res) => {
    const param = (req.params.id || req.params.email || '').toLowerCase();
    const initialLen = registeredUsers.length;
    registeredUsers = registeredUsers.filter(u => u.id !== param && u.email.toLowerCase() !== param);

    if (registeredUsers.length === initialLen) {
      return res.status(404).json({ error: 'User/Email not found' });
    }

    res.json({ success: true, message: 'User/Email removed from registered list', remainingCount: registeredUsers.length });
  });

  // =========================================================================
  // 🌟 3. REST API DOCUMENTATION & DIRECTORY ENDPOINT
  // =========================================================================
  app.get('/api/v1', (req, res) => {
    res.json({
      name: 'TableQR & Kitchen Digital Restaurant API',
      version: '1.2.0',
      description: 'Universal REST API for External Admin Panels, Mobile POS, and Database Sync',
      endpoints: {
        allDatabaseSync: {
          method: 'GET',
          path: '/api/v1/database/all',
          description: 'Returns all collections (menu, orders, categories, restaurant config, registered users, stats) in one unified JSON payload',
        },
        registeredEmails: {
          method: 'GET',
          path: '/api/v1/auth/emails',
          description: 'Lists all registered emails authorized to log in',
        },
        verifyEmail: {
          method: 'POST',
          path: '/api/v1/auth/verify-email',
          description: 'Checks if an email is registered and active',
          bodyExample: { email: 'admin@restaurant.com' },
        },
        registerEmail: {
          method: 'POST',
          path: '/api/v1/auth/emails',
          description: 'Registers a new email authorized for login',
          bodyExample: { email: 'manager@restaurant.com', name: 'Manager', role: 'admin' },
        },
        menuCollection: {
          method: 'GET / POST / PUT / DELETE',
          path: '/api/v1/menu',
          description: 'Full CRUD operations on menu dishes',
        },
        ordersCollection: {
          method: 'GET / POST / PATCH',
          path: '/api/v1/orders',
          description: 'Live order stream, status changes & table ordering',
        },
        categoriesCollection: {
          method: 'GET / POST / PUT / DELETE',
          path: '/api/v1/categories',
          description: 'Manage menu categories and ordering',
        },
        restaurantConfig: {
          method: 'GET / PUT',
          path: '/api/v1/restaurant',
          description: 'Restaurant details, exchange rate, print & telegram settings',
        },
        statsAnalytics: {
          method: 'GET',
          path: '/api/v1/stats',
          description: 'Real-time sales, revenue in USD & KHR, and top dishes',
        },
      }
    });
  });

  // 1. Restaurant Config & Categories
  app.get('/api/restaurant', (req, res) => {
    res.json(restaurantConfig);
  });

  app.put('/api/restaurant', (req, res) => {
    restaurantConfig = {
      ...restaurantConfig,
      ...req.body,
    };
    res.json(restaurantConfig);
  });

  app.get('/api/categories', (req, res) => {
    res.json(restaurantConfig.categories || []);
  });

  app.put('/api/categories', (req, res) => {
    if (Array.isArray(req.body)) {
      restaurantConfig.categories = req.body;
      return res.json(restaurantConfig.categories);
    }
    res.status(400).json({ error: 'Categories must be an array' });
  });

  app.post('/api/categories', (req, res) => {
    const { id, name_km, name_en, icon, description_km, description_en } = req.body;
    const catId = (id || name_en || `cat_${Date.now()}`).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newCategory = {
      id: catId,
      name_km: name_km || 'ប្រភេទថ្មី',
      name_en: name_en || 'New Category',
      icon: icon || 'UtensilsCrossed',
      description_km: description_km || '',
      description_en: description_en || '',
      order: (restaurantConfig.categories?.length || 0) + 1,
    };
    if (!restaurantConfig.categories) {
      restaurantConfig.categories = [];
    }
    // Check if ID already exists
    const existingIndex = restaurantConfig.categories.findIndex(c => c.id === catId);
    if (existingIndex >= 0) {
      restaurantConfig.categories[existingIndex] = { ...restaurantConfig.categories[existingIndex], ...newCategory };
    } else {
      restaurantConfig.categories.push(newCategory);
    }
    res.status(201).json(newCategory);
  });

  app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    if (restaurantConfig.categories) {
      restaurantConfig.categories = restaurantConfig.categories.filter(c => c.id !== id);
    }
    res.json({ success: true, id });
  });

  // 2. Menu Items CRUD
  app.get('/api/menu', (req, res) => {
    res.json(menuItems);
  });

  app.post('/api/menu', (req, res) => {
    const newItem: MenuItem = {
      id: `menu_${Date.now()}`,
      name_km: req.body.name_km || 'មុខម្ហូបថ្មី',
      name_en: req.body.name_en || 'New Dish',
      description_km: req.body.description_km || '',
      description_en: req.body.description_en || '',
      price: Number(req.body.price) || 0,
      category: req.body.category || 'popular',
      imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      available: req.body.available !== undefined ? req.body.available : true,
      spicyLevelOptions: Boolean(req.body.spicyLevelOptions),
      sweetnessOptions: Boolean(req.body.sweetnessOptions),
      popular: Boolean(req.body.popular),
      prepTimeMinutes: Number(req.body.prepTimeMinutes) || 10,
    };
    menuItems.unshift(newItem);
    res.status(201).json(newItem);
  });

  app.put('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    const index = menuItems.findIndex(m => m.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    menuItems[index] = {
      ...menuItems[index],
      ...req.body,
    };
    res.json(menuItems[index]);
  });

  app.delete('/api/menu/:id', (req, res) => {
    const { id } = req.params;
    menuItems = menuItems.filter(m => m.id !== id);
    res.json({ success: true, id });
  });

  // 3. Orders Management
  app.get('/api/orders', (req, res) => {
    const filterId = (req.query.restaurantId || req.query.tenantId || req.query.shop) as string;
    if (filterId && filterId !== 'all') {
      const filtered = orders.filter(o => !o.restaurantId || o.restaurantId === filterId || o.restaurantId === 'main-restaurant');
      return res.json(filtered);
    }
    res.json(orders);
  });

  app.post('/api/orders', (req, res) => {
    const tableNumber = Number(req.body.tableNumber) || 1;
    const items = req.body.items || [];
    const total = Number(req.body.total) || 0;
    const exchangeRate = restaurantConfig.exchangeRate || 4100;
    const total_khr = req.body.total_khr !== undefined ? Number(req.body.total_khr) : Math.round(total * exchangeRate);
    const targetShopId = req.body.restaurantId || req.body.tenantId || restaurantConfig.id || 'main-restaurant';
    const orderId = req.body.id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber: req.body.orderNumber || nextOrderNumber++,
      tableNumber,
      items,
      total,
      total_khr,
      status: req.body.status || 'new',
      createdAt: req.body.createdAt || new Date().toISOString(),
      restaurantId: targetShopId,
      announced: req.body.announced !== undefined ? Boolean(req.body.announced) : false, // Kitchen TTS will trigger on this!
      printed: req.body.printed !== undefined ? Boolean(req.body.printed) : false,
      customerName: req.body.customerName || `Table ${tableNumber} Guest`,
      customerNote: req.body.customerNote || '',
      paymentMethod: req.body.paymentMethod || 'cash',
      telegramSent: false,
    };

    const existingIdx = orders.findIndex(o => o.id === orderId);
    if (existingIdx >= 0) {
      orders[existingIdx] = { ...orders[existingIdx], ...newOrder };
    } else {
      orders.unshift(newOrder);
    }

    // Auto-trigger Telegram notification in background if configured
    if (restaurantConfig.telegramEnabled && (restaurantConfig.telegramBotToken || restaurantConfig.telegramChatId)) {
      sendTelegramAlert(newOrder, restaurantConfig).then(success => {
        if (success) newOrder.telegramSent = true;
      }).catch(err => console.warn('Background Telegram dispatch warning:', err));
    }

    res.status(201).json(newOrder);
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    let order = orders.find(o => o.id === id);
    if (!order) {
      order = {
        id,
        orderNumber: nextOrderNumber++,
        tableNumber: 1,
        items: [],
        total: 0,
        total_khr: 0,
        status: status || 'new',
        createdAt: new Date().toISOString(),
        restaurantId: restaurantConfig.id,
        announced: false,
        printed: false,
        customerName: 'Guest',
        customerNote: '',
        paymentMethod: 'cash',
        telegramSent: false,
      };
      orders.unshift(order);
    } else {
      order.status = status || order.status;
    }
    res.json(order);
  });

  app.patch('/api/orders/:id/announced', (req, res) => {
    const { id } = req.params;
    const { announced } = req.body;
    let order = orders.find(o => o.id === id);
    if (!order) {
      order = {
        id,
        orderNumber: nextOrderNumber++,
        tableNumber: 1,
        items: [],
        total: 0,
        total_khr: 0,
        status: 'new',
        createdAt: new Date().toISOString(),
        restaurantId: restaurantConfig.id,
        announced: announced !== undefined ? Boolean(announced) : true,
        printed: false,
        customerName: 'Guest',
        customerNote: '',
        paymentMethod: 'cash',
        telegramSent: false,
      };
      orders.unshift(order);
    } else {
      order.announced = announced !== undefined ? Boolean(announced) : true;
    }
    res.json(order);
  });

  app.patch('/api/orders/:id/printed', (req, res) => {
    const { id } = req.params;
    const { printed } = req.body;
    let order = orders.find(o => o.id === id);
    if (!order) {
      order = {
        id,
        orderNumber: nextOrderNumber++,
        tableNumber: 1,
        items: [],
        total: 0,
        total_khr: 0,
        status: 'new',
        createdAt: new Date().toISOString(),
        restaurantId: restaurantConfig.id,
        announced: true,
        printed: printed !== undefined ? Boolean(printed) : true,
        customerName: 'Guest',
        customerNote: '',
        paymentMethod: 'cash',
        telegramSent: false,
      };
      orders.unshift(order);
    } else {
      order.printed = printed !== undefined ? Boolean(printed) : true;
    }
    res.json(order);
  });

  // 4. Gemini Khmer TTS API Endpoint
  // Spec: Calls Gemini TTS API (gemini-3.1-flash-tts-preview) -> Native Cambodian Khmer pronunciation for ALL table numbers (1 to 100+)
  app.post('/api/tts/khmer-order', async (req, res) => {
    const tableNumber = Number(req.body.tableNumber) || 1;
    const voice = req.body.voiceName || restaurantConfig.ttsVoice || 'Kore';
    
    // Generate native Khmer phonetic words (e.g. តុលេខមួយ, តុលេខពីរ, តុលេខបី, តុលេខបួន, តុលេខប្រាំ, ...)
    const announcement = getKhmerOrderAnnouncement(tableNumber);
    const khmerSentence = req.body.customText || announcement.naturalSentence;

    const cacheKey = `${tableNumber}_${voice}_${khmerSentence}`;
    if (ttsAudioCache.has(cacheKey)) {
      const cachedAudio = ttsAudioCache.get(cacheKey)!;
      const response: TTSResponse = {
        success: true,
        audioBase64: cachedAudio,
        mimeType: 'audio/pcm;rate=24000',
        sampleRate: 24000,
        text: khmerSentence,
        source: 'cache',
      };
      return res.json(response);
    }

    try {
      const ai = getGeminiClient();
      if (!ai) {
        // Fallback response with clean phonetic text for Web Speech synthesis
        return res.json({
          success: true,
          text: khmerSentence,
          source: 'synthetic',
        });
      }

      // Prompt Gemini TTS for authentic Cambodian Khmer pronunciation
      const prompt = `Say clearly, warmly, and naturally in Cambodian Khmer language for a restaurant kitchen alert: ${khmerSentence}`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const audioBase64 = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioBase64) {
        ttsAudioCache.set(cacheKey, audioBase64);
        return res.json({
          success: true,
          audioBase64,
          mimeType: 'audio/pcm;rate=24000',
          sampleRate: 24000,
          text: khmerSentence,
          source: 'gemini',
        });
      } else {
        return res.json({
          success: true,
          text: khmerSentence,
          source: 'synthetic',
        });
      }
    } catch (err: any) {
      console.warn(`Gemini TTS error for Table ${tableNumber}, using fallback:`, err.message);
      return res.json({
        success: true,
        text: khmerSentence,
        source: 'synthetic',
      });
    }
  });

  // Warmup TTS endpoint for all tables (Table 1 to 20)
  app.post('/api/tts/warmup', async (req, res) => {
    const maxTables = Number(req.body.maxTables) || 10;
    const voice = req.body.voiceName || restaurantConfig.ttsVoice || 'Kore';
    const warmed: number[] = [];

    const ai = getGeminiClient();
    if (ai) {
      for (let t = 1; t <= Math.min(maxTables, 20); t++) {
        const sentence = getKhmerOrderAnnouncement(t).naturalSentence;
        const key = `${t}_${voice}_${sentence}`;
        if (!ttsAudioCache.has(key)) {
          try {
            const prompt = `Say clearly, warmly, and naturally in Cambodian Khmer language for a restaurant kitchen alert: ${sentence}`;
            const gRes = await ai.models.generateContent({
              model: 'gemini-3.1-flash-tts-preview',
              contents: [{ parts: [{ text: prompt }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                },
              },
            });
            const b64 = gRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (b64) {
              ttsAudioCache.set(key, b64);
              warmed.push(t);
            }
          } catch (e) {
            // Ignore background warmup errors
          }
        } else {
          warmed.push(t);
        }
      }
    }
    res.json({ success: true, cachedCount: ttsAudioCache.size, warmedTables: warmed });
  });

  // 5. Telegram Notification Endpoint & Bot Integration Helper
  app.get('/api/telegram/status', async (req, res) => {
    const token = restaurantConfig.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '8803104030:AAGFfYRXV78zuDB_7BciMyzINBFsFPpThxM';
    try {
      if (!token) {
        return res.json({ configured: false, bot: null, error: 'No token configured' });
      }
      const telegramRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await telegramRes.json();
      if (data.ok) {
        res.json({
          configured: true,
          bot: data.result,
          chatId: restaurantConfig.telegramChatId,
          telegramEnabled: restaurantConfig.telegramEnabled,
        });
      } else {
        res.json({
          configured: false,
          bot: null,
          error: data.description || 'Invalid Telegram Bot Token',
        });
      }
    } catch (err: any) {
      res.json({ configured: false, error: err.message });
    }
  });

  app.get('/api/telegram/updates', async (req, res) => {
    const token = restaurantConfig.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '8803104030:AAGFfYRXV78zuDB_7BciMyzINBFsFPpThxM';
    try {
      if (!token) {
        return res.status(400).json({ error: 'Telegram Bot Token not configured' });
      }
      const telegramRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const data = await telegramRes.json();
      if (data.ok && Array.isArray(data.result)) {
        // Extract unique chats from updates
        const chatsMap = new Map<string, any>();
        for (const update of data.result) {
          const msg = update.message || update.channel_post || update.my_chat_member;
          if (msg && msg.chat) {
            const c = msg.chat;
            chatsMap.set(String(c.id), {
              id: String(c.id),
              title: c.title || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.username || `Chat ${c.id}`,
              type: c.type,
              username: c.username || '',
              lastDate: msg.date ? new Date(msg.date * 1000).toISOString() : null,
              lastText: msg.text || '(Action/Join)',
            });
          }
        }
        res.json({
          success: true,
          chats: Array.from(chatsMap.values()),
        });
      } else {
        res.json({ success: false, error: data.description || 'Failed to fetch updates' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/telegram/set-chat-id', async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }
    restaurantConfig.telegramChatId = String(chatId);
    restaurantConfig.telegramEnabled = true;

    // Send a confirmation greeting
    const token = restaurantConfig.telegramBotToken || '8803104030:AAGFfYRXV78zuDB_7BciMyzINBFsFPpThxM';
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🎉 <b>ភ្ជាប់ប្រព័ន្ធជោគជ័យ / Bot Connected!</b>\n━━━━━━━━━━━━━━━━━━━━\n🇰🇭 <b>${restaurantConfig.name_km}</b> (${restaurantConfig.name_en})\n🔔 ការកម្មង់ថ្មីៗពីអតិថិជនស្កេន QR តាមតុ នឹងត្រូវបានផ្ញើមកកាន់ទីនេះភ្លាមៗ!\n\n<i>Live Kitchen Dispatch Bot is Ready!</i>`,
          parse_mode: 'HTML',
        }),
      });
    } catch (e) {
      console.warn('Welcome message failed:', e);
    }

    res.json({ success: true, config: restaurantConfig });
  });

  app.post('/api/telegram/notify', async (req, res) => {
    const { orderId, tableNumber, items, total, total_khr, customerNote } = req.body;
    const order = orders.find(o => o.id === orderId);

    try {
      const success = await sendTelegramAlert({
        orderNumber: order ? order.orderNumber : 999,
        tableNumber,
        items,
        total,
        total_khr: total_khr || Math.round(total * restaurantConfig.exchangeRate),
        customerNote,
        createdAt: new Date().toISOString(),
      }, restaurantConfig);

      if (order) order.telegramSent = true;
      res.json({ 
        success: true, 
        message: restaurantConfig.telegramChatId 
          ? 'Telegram alert dispatched to kitchen group successfully!' 
          : 'Telegram alert prepared (Add Chat ID to send directly to your Telegram app)!', 
        simulated: !restaurantConfig.telegramChatId 
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 6. AI Dish Suggester using Gemini 3.6 Flash
  app.post('/api/ai/suggest-dish', async (req, res) => {
    const promptText = req.body.prompt || 'A popular authentic Cambodian dish';
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          name_km: 'សាច់គោអាំងទឹកប្រហុក',
          name_en: 'Grilled Beef with Prahok Sauce',
          description_km: 'សាច់គោបន្ទះអាំងស្រួយ ទឹកប្រហុកជូរហឹរ បន្លែស្រស់',
          description_en: 'Tender marinated grilled beef served with authentic prahok dip',
          price: 5.50,
          category: 'grill',
          spicyLevelOptions: true,
          prepTimeMinutes: 12,
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Generate a single authentic Cambodian restaurant dish recipe with both accurate Khmer script (name_km, description_km) and English (name_en, description_en), suggested price in USD, and category (soup, stirfry, grill, rice_noodle, drinks, or dessert). User request: "${promptText}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name_km: { type: Type.STRING, description: 'Accurate Khmer dish name in Khmer script' },
              name_en: { type: Type.STRING, description: 'English dish name' },
              description_km: { type: Type.STRING, description: 'Khmer description' },
              description_en: { type: Type.STRING, description: 'English description' },
              price: { type: Type.NUMBER, description: 'Price in USD (e.g. 4.50)' },
              category: { type: Type.STRING, description: 'Category: soup, stirfry, grill, rice_noodle, drinks, or dessert' },
              spicyLevelOptions: { type: Type.BOOLEAN },
              prepTimeMinutes: { type: Type.INTEGER },
            },
            required: ['name_km', 'name_en', 'description_km', 'description_en', 'price', 'category'],
          },
        },
      });

      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);
    } catch (err: any) {
      console.warn('AI dish generation error:', err);
      res.status(500).json({ error: 'AI generation failed' });
    }
  });

  // Helper for Telegram message formatting & dispatch
  async function sendTelegramAlert(orderData: any, config: RestaurantConfig): Promise<boolean> {
    const itemsText = (orderData.items || []).map((it: any) => {
      const tags = [it.selectedSpicy, it.selectedSweetness, it.notes].filter(Boolean).join(' | ');
      return `🍲 <b>${it.quantity}x ${it.name_km}</b> (${it.name_en})\n   ↳ $${(it.price * it.quantity).toFixed(2)}${tags ? ` <i>[${tags}]</i>` : ''}`;
    }).join('\n');

    const formattedMessage = [
      `🔔 <b>ការកម្មង់ថ្មីពីតុលេខ #${orderData.tableNumber}!</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📋 <b>កូដកម្មង់ / Order:</b> #${orderData.orderNumber || 'NEW'}`,
      `⏰ <b>ម៉ោង:</b> ${new Date(orderData.createdAt || Date.now()).toLocaleTimeString()}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      itemsText,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💰 <b>សរុប / Total:</b> $${Number(orderData.total).toFixed(2)} (${Number(orderData.total_khr || 0).toLocaleString()} ៛)`,
      orderData.customerNote ? `📝 <b>ចំណាំពីភ្ញៀវ:</b> ${orderData.customerNote}` : '',
      `━━━━━━━━━━━━━━━━━━━━`,
      `📍 <i>${config.name_en} • Kitchen Live Bot</i>`
    ].filter(Boolean).join('\n');

    if (config.telegramBotToken && config.telegramChatId) {
      const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: formattedMessage,
          parse_mode: 'HTML',
        }),
      });
      return res.ok;
    }

    console.log('[TELEGRAM DISPATCH SIMULATOR]\n' + formattedMessage);
    return true;
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TableQR Kitchen & Menu server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
