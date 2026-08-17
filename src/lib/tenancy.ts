import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  TenantInfo, 
  TenantUserProfile, 
  TenantStaffMember, 
  MenuItem, 
  Order, 
  RestaurantConfig,
  TenantPlan
} from '../types';
import { initialMenuItems, initialRestaurantConfig } from '../data/initialData';

/**
 * Deeply removes all `undefined` values from an object or array to prevent Firestore
 * "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Helper to slugify a shop name into a clean URL slug (e.g. "Loyy Restaurant" -> "loyy-restaurant")
 */
export function generateSlug(shopName: string): string {
  return shopName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `shop-${Date.now().toString(36)}`;
}

// -------------------------------------------------------------
// 1. TENANT CREATION & PROFILE RESOLUTION
// -------------------------------------------------------------

/**
 * Register or onboard a new tenant shop.
 * Creates:
 *  - /tenants/{tenantId}
 *  - /tenants/{tenantId}/settings/restaurant (initial config)
 *  - /tenants/{tenantId}/menu/{itemId} (seed initial menu items)
 *  - /users/{ownerUid} (linking user to tenantId)
 */
export async function createTenantShop(params: {
  ownerUid: string;
  ownerEmail: string;
  shopName: string;
  shopName_km?: string;
  plan?: TenantPlan;
  customSlug?: string;
}): Promise<{ tenantId: string; slug: string }> {
  const { ownerUid, ownerEmail, shopName, shopName_km, plan = 'free' } = params;
  
  const baseSlug = generateSlug(params.customSlug || shopName);
  const tenantId = baseSlug.length > 2 ? baseSlug : `tenant_${Date.now()}`;

  const tenantData: TenantInfo = {
    id: tenantId,
    shopName,
    shopName_km: shopName_km || shopName,
    slug: baseSlug,
    ownerUid,
    plan,
    status: 'active',
    createdAt: new Date().toISOString(),
    tablesCount: 20,
    exchangeRate: 4100,
    telegramEnabled: true,
    ttsEnabled: true
  };

  // 1. Write /tenants/{tenantId}
  await setDoc(doc(db, 'tenants', tenantId), cleanFirestoreData(tenantData));

  // 2. Link user in /users/{uid}
  const userProfile: TenantUserProfile = {
    uid: ownerUid,
    email: ownerEmail.toLowerCase(),
    tenantId,
    role: 'admin',
    displayName: shopName,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'users', ownerUid), cleanFirestoreData(userProfile));

  // 3. Add staff record in /tenants/{tenantId}/staff/{ownerUid}
  const staffMember: TenantStaffMember = {
    uid: ownerUid,
    email: ownerEmail.toLowerCase(),
    name: `${shopName} Admin`,
    role: 'admin',
    status: 'active',
    joinedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'tenants', tenantId, 'staff', ownerUid), cleanFirestoreData(staffMember));

  // 4. Seed initial restaurant configuration under /tenants/{tenantId}/settings/restaurant
  const seedConfig: RestaurantConfig = {
    ...initialRestaurantConfig,
    id: tenantId,
    name_km: shopName_km || shopName,
    name_en: shopName,
    plan: plan
  };
  await setDoc(doc(db, 'tenants', tenantId, 'settings', 'restaurant'), cleanFirestoreData(seedConfig));

  // 5. Seed default menu items under /tenants/{tenantId}/menu/{itemId}
  for (const item of initialMenuItems) {
    await setDoc(doc(db, 'tenants', tenantId, 'menu', item.id), cleanFirestoreData(item));
  }

  return { tenantId, slug: baseSlug };
}

/**
 * Fetch the tenant profile for an authenticated user.
 */
export async function getTenantProfileForUser(uid: string): Promise<TenantUserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as TenantUserProfile;
    }
    return null;
  } catch (err: any) {
    console.info('Note: User profile not found or permissions require update in Firebase Console:', err?.message || err);
    return null;
  }
}

/**
 * Fetch tenant info by tenantId or slug.
 */
export async function getTenantInfo(tenantId: string): Promise<TenantInfo | null> {
  try {
    const tDoc = await getDoc(doc(db, 'tenants', tenantId));
    if (tDoc.exists()) {
      return tDoc.data() as TenantInfo;
    }
    
    // Try finding by slug query
    const q = query(collection(db, 'tenants'), where('slug', '==', tenantId));
    const snaps = await getDocs(q);
    if (!snaps.empty) {
      return snaps.docs[0].data() as TenantInfo;
    }
    return null;
  } catch (err: any) {
    console.info('Note: Tenant info lookup using local fallback:', err?.message || err);
    return null;
  }
}

// -------------------------------------------------------------
// 2. SCOPED REAL-TIME SUBSCRIPTIONS PER TENANT
// -------------------------------------------------------------

/**
 * Subscribe to real-time menu for a specific tenant:
 * /tenants/{tenantId}/menu
 */
export function subscribeTenantMenu(
  tenantId: string,
  onUpdate: (items: MenuItem[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const menuRef = collection(db, 'tenants', tenantId, 'menu');
    return onSnapshot(
      menuRef,
      (snapshot) => {
        const items: MenuItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ ...docSnap.data(), id: docSnap.id } as MenuItem);
        });
        if (items.length > 0) {
          onUpdate(items);
        }
      },
      (err) => {
        console.info(`[Tenant: ${tenantId}] Menu live stream using local state:`, err.message);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.info(`[Tenant: ${tenantId}] Menu init fallback:`, err?.message || err);
    return () => {};
  }
}

/**
 * Save / Update a menu item for a specific tenant.
 */
export async function saveTenantMenuItem(tenantId: string, item: MenuItem): Promise<void> {
  try {
    const itemRef = doc(db, 'tenants', tenantId, 'menu', item.id);
    await setDoc(itemRef, cleanFirestoreData(item), { merge: true });
  } catch (err: any) {
    console.warn(`[Tenant: ${tenantId}] Save menu error:`, err.message);
  }
}

/**
 * Delete a menu item for a specific tenant.
 */
export async function deleteTenantMenuItem(tenantId: string, itemId: string): Promise<void> {
  try {
    const itemRef = doc(db, 'tenants', tenantId, 'menu', itemId);
    await deleteDoc(itemRef);
  } catch (err: any) {
    console.warn(`[Tenant: ${tenantId}] Delete menu error:`, err.message);
  }
}

// BroadcastChannel for sub-millisecond local cross-tab / cross-window sync
const ordersBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('tableqr_live_orders_bus')
  : null;

/**
 * Subscribe to real-time orders for a specific tenant:
 * /tenants/{tenantId}/orders with fallback to /orders and local broadcast
 */
export function subscribeTenantOrders(
  tenantId: string,
  onUpdate: (orders: Order[]) => void,
  onError?: (err: Error) => void
) {
  const activeTenantId = tenantId || 'main-restaurant';
  let cachedOrdersMap = new Map<string, Order>();

  const emitSorted = () => {
    const list = Array.from(cachedOrdersMap.values());
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(list);
  };

  // 1. Cross-tab Broadcast Channel listener
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.type === 'NEW_OR_UPDATED_ORDER') {
      const order = event.data.order as Order;
      if (!order.restaurantId || order.restaurantId === activeTenantId || activeTenantId === 'main-restaurant') {
        cachedOrdersMap.set(order.id, order);
        emitSorted();
      }
    }
  };

  if (ordersBroadcast) {
    ordersBroadcast.addEventListener('message', handleBroadcast);
  }

  // 2. Window CustomEvent listener
  const handleCustomEvent = (e: any) => {
    if (e.detail) {
      const order = e.detail as Order;
      if (!order.restaurantId || order.restaurantId === activeTenantId || activeTenantId === 'main-restaurant') {
        cachedOrdersMap.set(order.id, order);
        emitSorted();
      }
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('tableqr_order_event', handleCustomEvent);
  }

  // 3. Primary Firestore Scoped Listener (/tenants/{tenantId}/orders)
  let unsubFirestorePrimary = () => {};
  try {
    const ordersRef = collection(db, 'tenants', activeTenantId, 'orders');
    unsubFirestorePrimary = onSnapshot(
      ordersRef,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          cachedOrdersMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id } as Order);
        });
        emitSorted();
      },
      (err) => {
        console.info(`[Tenant: ${activeTenantId}] Orders primary live stream notice:`, err.message);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.info(`[Tenant: ${activeTenantId}] Orders primary init fallback:`, err?.message || err);
  }

  // 4. Secondary Firestore Fallback Listener (/orders)
  let unsubFirestoreFallback = () => {};
  try {
    const fallbackRef = collection(db, 'orders');
    unsubFirestoreFallback = onSnapshot(
      fallbackRef,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const ord = { ...docSnap.data(), id: docSnap.id } as Order;
          if (!ord.restaurantId || ord.restaurantId === activeTenantId || activeTenantId === 'main-restaurant') {
            cachedOrdersMap.set(ord.id, ord);
          }
        });
        emitSorted();
      },
      (err) => {
        // Non-fatal
      }
    );
  } catch (e) {
    // Non-fatal
  }

  return () => {
    if (ordersBroadcast) {
      ordersBroadcast.removeEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('tableqr_order_event', handleCustomEvent);
    }
    unsubFirestorePrimary();
    unsubFirestoreFallback();
  };
}

/**
 * Create or sync an order under a specific tenant and backup collections.
 */
export async function saveTenantOrder(tenantId: string, order: Order): Promise<void> {
  const activeTenantId = tenantId || 'main-restaurant';
  const cleanedOrder = cleanFirestoreData({ ...order, restaurantId: activeTenantId });

  // 1. Broadcast immediately to any open tabs/screens on this client
  try {
    if (ordersBroadcast) {
      ordersBroadcast.postMessage({ type: 'NEW_OR_UPDATED_ORDER', order: cleanedOrder });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tableqr_order_event', { detail: cleanedOrder }));
    }
  } catch (e) {}

  // 2. Save to Scoped Firestore collection (/tenants/{tenantId}/orders/{orderId})
  try {
    const orderRef = doc(db, 'tenants', activeTenantId, 'orders', order.id);
    await setDoc(orderRef, cleanedOrder, { merge: true });
  } catch (err: any) {
    console.warn(`[Tenant: ${activeTenantId}] Save order error:`, err.message);
  }

  // 3. Also sync to flat legacy /orders/{orderId} as fallback for universal listeners
  try {
    const legacyRef = doc(db, 'orders', order.id);
    await setDoc(legacyRef, cleanedOrder, { merge: true });
  } catch (e) {
    // Non-fatal
  }
}

/**
 * Update order status for a specific tenant.
 */
export async function updateTenantOrderStatus(
  tenantId: string,
  orderId: string,
  status: Order['status']
): Promise<void> {
  const activeTenantId = tenantId || 'main-restaurant';
  try {
    const orderRef = doc(db, 'tenants', activeTenantId, 'orders', orderId);
    await setDoc(orderRef, { status }, { merge: true });
  } catch (err: any) {
    console.warn(`[Tenant: ${activeTenantId}] Update order status error:`, err.message);
  }

  try {
    const legacyRef = doc(db, 'orders', orderId);
    await setDoc(legacyRef, { status }, { merge: true });
  } catch (e) {
    // Non-fatal
  }
}

/**
 * Subscribe to restaurant settings / config for a specific tenant:
 * /tenants/{tenantId}/settings/restaurant
 */
export function subscribeTenantConfig(
  tenantId: string,
  onUpdate: (config: RestaurantConfig) => void,
  onError?: (err: Error) => void
) {
  try {
    const configRef = doc(db, 'tenants', tenantId, 'settings', 'restaurant');
    return onSnapshot(
      configRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as RestaurantConfig);
        }
      },
      (err) => {
        console.info(`[Tenant: ${tenantId}] Config live stream using local state:`, err.message);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.info(`[Tenant: ${tenantId}] Config init fallback:`, err?.message || err);
    return () => {};
  }
}

/**
 * Save restaurant config for a specific tenant.
 */
export async function saveTenantConfig(tenantId: string, config: RestaurantConfig): Promise<void> {
  try {
    const configRef = doc(db, 'tenants', tenantId, 'settings', 'restaurant');
    await setDoc(configRef, cleanFirestoreData({ ...config, id: tenantId }), { merge: true });
  } catch (err: any) {
    console.warn(`[Tenant: ${tenantId}] Save config error:`, err.message);
  }
}

/**
 * Subscribe to staff list for a specific tenant:
 * /tenants/{tenantId}/staff
 */
export function subscribeTenantStaff(
  tenantId: string,
  onUpdate: (staff: TenantStaffMember[]) => void
) {
  try {
    const staffRef = collection(db, 'tenants', tenantId, 'staff');
    return onSnapshot(staffRef, (snapshot) => {
      const list: TenantStaffMember[] = [];
      snapshot.forEach((d) => list.push({ ...d.data(), uid: d.id } as TenantStaffMember));
      onUpdate(list);
    }, (err) => {
      console.info(`[Tenant: ${tenantId}] Staff subscription fallback:`, err.message);
    });
  } catch (err: any) {
    console.info('Staff subscribe fallback:', err?.message || err);
    return () => {};
  }
}

/**
 * Add or register a staff member (e.g. Chef, Waiter, Manager) for a tenant.
 */
export async function addTenantStaffMember(
  tenantId: string,
  member: TenantStaffMember
): Promise<void> {
  try {
    const staffRef = doc(db, 'tenants', tenantId, 'staff', member.uid);
    await setDoc(staffRef, cleanFirestoreData(member), { merge: true });

    // Also sync to global /users/{uid} so auth login routes to correct role and tenant
    const userRef = doc(db, 'users', member.uid);
    const userProfile: TenantUserProfile = {
      uid: member.uid,
      email: member.email.toLowerCase(),
      tenantId,
      role: member.role,
      displayName: member.name,
      createdAt: member.joinedAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    await setDoc(userRef, cleanFirestoreData(userProfile), { merge: true });
  } catch (err: any) {
    console.warn(`[Tenant: ${tenantId}] Save staff member error:`, err.message);
  }
}

/**
 * Delete a staff member from a tenant.
 */
export async function deleteTenantStaffMember(
  tenantId: string,
  staffUid: string
): Promise<void> {
  try {
    const staffRef = doc(db, 'tenants', tenantId, 'staff', staffUid);
    await deleteDoc(staffRef);
  } catch (err: any) {
    console.warn(`[Tenant: ${tenantId}] Delete staff member error:`, err.message);
  }
}


