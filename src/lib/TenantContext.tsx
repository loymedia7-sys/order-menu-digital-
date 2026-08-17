import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { 
  TenantInfo, 
  TenantUserProfile, 
  TenantStaffMember,
  TenantRole, 
  TenantPlan,
  RestaurantConfig,
  MenuItem,
  Order
} from '../types';
import { 
  getTenantProfileForUser, 
  getTenantInfo, 
  createTenantShop,
  subscribeTenantMenu,
  subscribeTenantOrders,
  subscribeTenantConfig,
  subscribeTenantStaff,
  addTenantStaffMember,
  deleteTenantStaffMember,
  saveTenantMenuItem,
  deleteTenantMenuItem,
  saveTenantOrder,
  updateTenantOrderStatus,
  saveTenantConfig
} from './tenancy';
import { createChefOrStaffAccountWithoutLoggingOut, formatChefEmailFromName } from './firebase';
import { registerAdminEmail } from '../services/api';
import { initialMenuItems, initialRestaurantConfig } from '../data/initialData';

interface TenantContextType {
  tenantId: string;
  tenantInfo: TenantInfo | null;
  userProfile: TenantUserProfile | null;
  role: TenantRole;
  plan: TenantPlan;
  isOwnerOrAdmin: boolean;
  isChef: boolean;
  isLoadingTenant: boolean;
  menuItems: MenuItem[];
  orders: Order[];
  staffList: TenantStaffMember[];
  config: RestaurantConfig;
  setTenantId: (id: string) => void;
  registerShop: (shopName: string, plan?: TenantPlan) => Promise<{ tenantId: string; slug: string }>;
  registerChefAccount: (data: {
    name: string;
    email?: string;
    password: string;
    role?: TenantRole;
    pin?: string;
    station?: string;
  }) => Promise<{ uid: string; email: string; name: string }>;
  removeStaffMember: (uid: string) => Promise<void>;
  saveMenuDish: (item: MenuItem) => Promise<void>;
  deleteMenuDish: (id: string) => Promise<void>;
  placeTenantOrder: (order: Order) => Promise<void>;
  changeOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  updateConfig: (cfg: RestaurantConfig) => Promise<void>;
  refreshTenantData: () => Promise<void>;
  publicMenuUrl: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const DEFAULT_TENANT_ID = 'main-restaurant';

export const TenantProvider: React.FC<{
  authUser: User | null;
  children: ReactNode;
}> = ({ authUser, children }) => {
  // Read tenant from URL query ?shop=... or path, or fallback to saved / default
  const [tenantId, setTenantIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlShop = params.get('shop') || params.get('tenant');
      if (urlShop) return urlShop;
      
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      if (pathSegments[0] === 'menu' && pathSegments[1]) {
        return pathSegments[1];
      }
      if (pathSegments[0] === 'shop' && pathSegments[1]) {
        return pathSegments[1];
      }
      
      const stored = localStorage.getItem('tableqr_tenant_id');
      if (stored) return stored;
    }
    return DEFAULT_TENANT_ID;
  });

  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [userProfile, setUserProfile] = useState<TenantUserProfile | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState<boolean>(true);

  // Scoped Data
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffList, setStaffList] = useState<TenantStaffMember[]>([]);
  const [config, setConfig] = useState<RestaurantConfig>(initialRestaurantConfig);

  const setTenantId = (newId: string) => {
    setTenantIdState(newId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tableqr_tenant_id', newId);
    }
  };

  // 1. Resolve User profile when logged in
  useEffect(() => {
    let isMounted = true;
    async function resolveUserTenant() {
      if (!authUser) {
        setUserProfile(null);
        return;
      }
      try {
        const profile = await getTenantProfileForUser(authUser.uid);
        if (isMounted && profile) {
          setUserProfile(profile);
          // Automatically switch active tenant to the user's registered shop
          if (profile.tenantId && profile.tenantId !== tenantId) {
            setTenantId(profile.tenantId);
          }
        } else if (isMounted) {
          // Auto-initialize new user store with ឥតគិតថ្លៃ (Free Plan)
          const baseName = authUser.displayName || (authUser.email ? authUser.email.split('@')[0] : 'My Restaurant');
          try {
            const newShop = await createTenantShop({
              ownerUid: authUser.uid,
              ownerEmail: authUser.email || 'admin@restaurant.com',
              shopName: baseName,
              shopName_km: `ភោជនីយដ្ឋាន ${baseName}`,
              plan: 'free'
            });
            if (isMounted) {
              setTenantId(newShop.tenantId);
              setUserProfile({
                uid: authUser.uid,
                email: authUser.email || '',
                tenantId: newShop.tenantId,
                role: 'admin',
                displayName: baseName,
                createdAt: new Date().toISOString()
              });
            }
          } catch (createErr) {
            console.warn('Auto create free shop note:', createErr);
          }
        }
      } catch (e) {
        console.warn('Error resolving user tenant:', e);
      }
    }
    resolveUserTenant();
    return () => { isMounted = false; };
  }, [authUser]);

  // 2. Fetch Tenant Info & Start Real-Time Scoped Subscriptions
  useEffect(() => {
    let isMounted = true;
    setIsLoadingTenant(true);

    async function loadTenantData() {
      try {
        const tInfo = await getTenantInfo(tenantId);
        if (isMounted) {
          setTenantInfo(tInfo);
          if (tInfo) {
            setConfig(prev => ({
              ...prev,
              id: tInfo.id,
              name_en: tInfo.shopName,
              name_km: tInfo.shopName_km || tInfo.shopName,
              tablesCount: tInfo.tablesCount || 20,
              exchangeRate: tInfo.exchangeRate || 4100,
            }));
          }
        }
      } catch (err) {
        console.warn('Tenant data load error:', err);
      } finally {
        if (isMounted) setIsLoadingTenant(false);
      }
    }

    loadTenantData();

    // Subscribe to tenant's real-time collections
    const unsubMenu = subscribeTenantMenu(tenantId, (items) => {
      if (items.length > 0) setMenuItems(items);
    });

    const unsubOrders = subscribeTenantOrders(tenantId, (updatedOrders) => {
      setOrders(prev => {
        // Merge seamlessly with any existing orders
        const map = new Map<string, Order>();
        prev.forEach(o => map.set(o.id, o));
        updatedOrders.forEach(o => map.set(o.id, o));
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return merged;
      });
    });

    // Background HTTP polling fallback (every 3 seconds) to guarantee sync across firewalls/proxies
    const pollInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const res = await fetch(`/api/orders?tenantId=${encodeURIComponent(tenantId)}`);
        if (res.ok) {
          const apiOrders: Order[] = await res.json();
          if (Array.isArray(apiOrders) && apiOrders.length > 0) {
            setOrders(prev => {
              const map = new Map<string, Order>();
              prev.forEach(o => map.set(o.id, o));
              apiOrders.forEach(o => {
                if (!o.restaurantId || o.restaurantId === tenantId || tenantId === 'main-restaurant') {
                  map.set(o.id, o);
                }
              });
              const merged = Array.from(map.values());
              merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              return merged;
            });
          }
        }
      } catch (e) {
        // Non-fatal
      }
    }, 3000);

    const unsubStaff = subscribeTenantStaff(tenantId, (staff) => {
      setStaffList(staff);
    });

    const unsubConfig = subscribeTenantConfig(tenantId, (newCfg) => {
      setConfig(newCfg);
    });

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      unsubMenu();
      unsubOrders();
      unsubStaff();
      unsubConfig();
    };
  }, [tenantId]);

  // Derived role & plan
  const role: TenantRole = userProfile?.role || 'admin';
  const plan: TenantPlan = config.plan || tenantInfo?.plan || 'free';
  const isOwnerOrAdmin = role === 'admin' || role === 'manager';
  const isChef = role === 'chef';

  // Public customer menu link for sharing
  const publicMenuUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?shop=${tenantId}`
    : `https://tableqr.app/?shop=${tenantId}`;

  // Actions with instant local state updates + Firestore background sync
  const registerShop = async (shopName: string, selectedPlan: TenantPlan = 'free') => {
    if (!authUser) {
      throw new Error('You must be logged in with Firebase Auth to register a restaurant shop.');
    }
    const res = await createTenantShop({
      ownerUid: authUser.uid,
      ownerEmail: authUser.email || 'admin@restaurant.com',
      shopName,
      plan: selectedPlan
    });
    setTenantId(res.tenantId);
    return res;
  };

  /**
   * Admin registers a new Chef account with Name & Password.
   * Auto-generates standard kitchen identifier, creates Firebase Auth account
   * without disrupting current admin session, and saves staff record.
   */
  const registerChefAccount = async (data: {
    name: string;
    email?: string;
    password: string;
    role?: TenantRole;
    pin?: string;
    station?: string;
  }) => {
    const cleanName = data.name.trim();
    const cleanEmail = (data.email && data.email.trim()) 
      ? data.email.trim().toLowerCase() 
      : formatChefEmailFromName(cleanName);
    const roleToAssign: TenantRole = data.role || 'chef';

    let uid = `chef_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 1. Create Firebase Auth user credentials using secondary app instance
    try {
      const createdAuth = await createChefOrStaffAccountWithoutLoggingOut(cleanEmail, data.password, cleanName);
      uid = createdAuth.uid;
    } catch (authErr: any) {
      console.warn('Firebase Auth creation notice:', authErr.message);
      // If auth fails because user exists or password rule, bubble error if critical
      if (authErr.message?.includes('already in use') || authErr.message?.includes('at least 6')) {
        throw authErr;
      }
    }

    // 2. Prepare Staff Member record
    const staffMember: TenantStaffMember = {
      uid,
      email: cleanEmail,
      name: cleanName,
      role: roleToAssign,
      pin: data.pin || (roleToAssign === 'chef' ? '1234' : '8888'),
      status: 'active',
      joinedAt: new Date().toISOString()
    };

    // 3. Optimistically update local staff list
    setStaffList((prev) => [staffMember, ...prev.filter(s => s.uid !== uid && s.name.toLowerCase() !== cleanName.toLowerCase())]);

    // 4. Save to Firestore under /tenants/{tenantId}/staff/{uid} and /users/{uid}
    await addTenantStaffMember(tenantId, staffMember);

    // 5. Also register in backend API database so external admin API is aware
    try {
      await registerAdminEmail({
        email: cleanEmail,
        name: cleanName,
        role: roleToAssign === 'chef' ? 'kitchen' : 'admin',
        notes: `Registered Chef by Admin for shop ${tenantId}`
      });
    } catch (e) {
      console.info('Backend registration log:', e);
    }

    return { uid, email: cleanEmail, name: cleanName };
  };

  const removeStaffMember = async (uid: string) => {
    setStaffList((prev) => prev.filter((s) => s.uid !== uid));
    await deleteTenantStaffMember(tenantId, uid);
  };

  const saveMenuDish = async (item: MenuItem) => {
    setMenuItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
    try {
      await saveTenantMenuItem(tenantId, item);
    } catch (e) {
      console.info('Menu item saved to local state');
    }
  };

  const deleteMenuDish = async (id: string) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteTenantMenuItem(tenantId, id);
    } catch (e) {
      console.info('Menu item deleted from local state');
    }
  };

  const placeTenantOrder = async (order: Order) => {
    setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
    try {
      await saveTenantOrder(tenantId, order);
    } catch (e) {
      console.info('Order placed in local state');
    }
  };

  const changeOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    try {
      await updateTenantOrderStatus(tenantId, orderId, status);
    } catch (e) {
      console.info('Order status updated in local state');
    }
  };

  const updateConfig = async (newCfg: RestaurantConfig) => {
    setConfig(newCfg);
    try {
      await saveTenantConfig(tenantId, newCfg);
    } catch (e) {
      console.info('Config updated in local state');
    }
  };

  const refreshTenantData = async () => {
    const tInfo = await getTenantInfo(tenantId);
    if (tInfo) setTenantInfo(tInfo);
  };

  return (
    <TenantContext.Provider
      value={{
        tenantId,
        tenantInfo,
        userProfile,
        role,
        plan,
        isOwnerOrAdmin,
        isChef,
        isLoadingTenant,
        menuItems,
        orders,
        staffList,
        config,
        setTenantId,
        registerShop,
        registerChefAccount,
        removeStaffMember,
        saveMenuDish,
        deleteMenuDish,
        placeTenantOrder,
        changeOrderStatus,
        updateConfig,
        refreshTenantData,
        publicMenuUrl
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
