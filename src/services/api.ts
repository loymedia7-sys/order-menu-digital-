import { MenuItem, Order, OrderStatus, RestaurantConfig, TTSResponse, TelegramNotifyRequest, RegisteredAdminUser, AllDatabasePayload } from '../types';
import { 
  syncMenuItemToFirestore, 
  deleteMenuItemFromFirestore, 
  syncOrderToFirestore, 
  updateOrderStatusInFirestore, 
  updateOrderFlagsInFirestore,
  syncConfigToFirestore 
} from '../lib/firebase';

export const API_BASE = '/api';

// =========================================================================
// 🌟 1. ALL DATABASE & SYNC API
// =========================================================================

export async function fetchAllDatabaseSync(): Promise<AllDatabasePayload> {
  const res = await fetch(`${API_BASE}/v1/database/all`);
  if (!res.ok) throw new Error('Failed to fetch full database sync');
  return res.json();
}

export async function fetchDatabaseStats(): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/stats`);
  if (!res.ok) throw new Error('Failed to fetch database analytics');
  return res.json();
}

// =========================================================================
// 🌟 2. REGISTERED LOGIN EMAILS & USER MANAGEMENT API
// =========================================================================

export async function fetchRegisteredUsers(): Promise<{ status: string; count: number; users: RegisteredAdminUser[]; emails: string[] }> {
  const res = await fetch(`${API_BASE}/v1/auth/emails`);
  if (!res.ok) throw new Error('Failed to fetch registered emails');
  return res.json();
}

export async function verifyLoginEmail(email: string): Promise<{ registered: boolean; allowedToLogin: boolean; user?: RegisteredAdminUser; message?: string }> {
  const res = await fetch(`${API_BASE}/v1/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Email verification request failed');
  return res.json();
}

export async function registerAdminEmail(payload: { email: string; name?: string; role?: string; notes?: string }): Promise<{ success: boolean; user: RegisteredAdminUser }> {
  const res = await fetch(`${API_BASE}/v1/auth/emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to register email');
  }
  return res.json();
}

export async function updateRegisteredUser(id: string, updates: Partial<RegisteredAdminUser>): Promise<{ success: boolean; user: RegisteredAdminUser }> {
  const res = await fetch(`${API_BASE}/v1/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update registered user');
  return res.json();
}

export async function deleteRegisteredUser(idOrEmail: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/v1/users/${encodeURIComponent(idOrEmail)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete registered user');
  return res.json();
}

export async function recordLoginEvent(email: string, name?: string): Promise<{ success: boolean; user: RegisteredAdminUser }> {
  try {
    const res = await fetch(`${API_BASE}/v1/auth/record-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('Record login fallback:', e);
  }
  return { success: false, user: null as any };
}

// =========================================================================
// 🌟 3. RESTAURANT CORE APIS
// =========================================================================

export async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE}/menu`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}

export async function createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to create menu item');
  const savedItem: MenuItem = await res.json();
  // Sync to Firestore cloud database
  syncMenuItemToFirestore(savedItem).catch(err => console.warn('Firestore menu sync notice:', err));
  return savedItem;
}

export async function updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to update menu item');
  const updatedItem: MenuItem = await res.json();
  // Sync to Firestore cloud database
  syncMenuItemToFirestore(updatedItem).catch(err => console.warn('Firestore menu update notice:', err));
  return updatedItem;
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/menu/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete menu item');
  // Sync deletion to Firestore cloud database
  deleteMenuItemFromFirestore(id).catch(err => console.warn('Firestore menu delete notice:', err));
  return res.json();
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw new Error('Failed to submit order');
  const newOrder: Order = await res.json();
  // Sync to Firestore cloud database
  syncOrderToFirestore(newOrder).catch(err => console.warn('Firestore order sync notice:', err));
  return newOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  // Always sync to Firestore cloud database
  updateOrderStatusInFirestore(id, status).catch(err => console.warn('Firestore status update notice:', err));
  try {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Local API update status fallback:', e);
  }
  return { id, status } as any;
}

export async function markOrderAnnounced(id: string, announced = true): Promise<Order> {
  // Always update Firestore
  updateOrderFlagsInFirestore(id, { announced }).catch(() => {});
  try {
    const res = await fetch(`${API_BASE}/orders/${id}/announced`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announced }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Local API mark announced fallback:', e);
  }
  return { id, announced } as any;
}

export async function markOrderPrinted(id: string, printed = true): Promise<Order> {
  // Always update Firestore
  updateOrderFlagsInFirestore(id, { printed }).catch(() => {});
  try {
    const res = await fetch(`${API_BASE}/orders/${id}/printed`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printed }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Local API mark printed fallback:', e);
  }
  return { id, printed } as any;
}

export async function fetchRestaurantConfig(): Promise<RestaurantConfig> {
  const res = await fetch(`${API_BASE}/restaurant`);
  if (!res.ok) throw new Error('Failed to fetch restaurant config');
  return res.json();
}

export async function updateRestaurantConfig(config: Partial<RestaurantConfig>): Promise<RestaurantConfig> {
  const res = await fetch(`${API_BASE}/restaurant`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update restaurant config');
  const updated = await res.json();
  syncConfigToFirestore(updated).catch(err => console.warn('Firestore config sync notice:', err));
  return updated;
}

export async function fetchCategories(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function saveCategories(categories: any[]): Promise<any[]> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categories),
  });
  if (!res.ok) throw new Error('Failed to save categories');
  return res.json();
}

export async function generateKhmerOrderTTS(
  tableNumber: number,
  itemCount?: number,
  orderTotal?: number,
  voiceName?: string
): Promise<TTSResponse> {
  const res = await fetch(`${API_BASE}/tts/khmer-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableNumber, itemCount, orderTotal, voiceName }),
  });
  if (!res.ok) throw new Error('TTS generation failed');
  return res.json();
}

export async function sendTelegramNotification(payload: TelegramNotifyRequest): Promise<{ success: boolean; message: string; simulated?: boolean }> {
  const res = await fetch(`${API_BASE}/telegram/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Telegram notification failed');
  return res.json();
}

export async function fetchTelegramStatus(): Promise<{
  configured: boolean;
  bot?: { id: number; is_bot: boolean; first_name: string; username: string };
  chatId?: string;
  telegramEnabled?: boolean;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/telegram/status`);
  if (!res.ok) throw new Error('Failed to fetch Telegram status');
  return res.json();
}

export async function fetchTelegramUpdates(): Promise<{
  success: boolean;
  chats?: Array<{ id: string; title: string; type: string; username: string; lastDate?: string; lastText?: string }>;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/telegram/updates`);
  if (!res.ok) throw new Error('Failed to fetch Telegram updates');
  return res.json();
}

export async function setTelegramChatId(chatId: string): Promise<{ success: boolean; config: RestaurantConfig }> {
  const res = await fetch(`${API_BASE}/telegram/set-chat-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId }),
  });
  if (!res.ok) throw new Error('Failed to set Telegram Chat ID');
  return res.json();
}

export async function generateAiMenuDish(prompt: string): Promise<Partial<MenuItem>> {
  const res = await fetch(`${API_BASE}/ai/suggest-dish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error('AI dish generation failed');
  return res.json();
}
