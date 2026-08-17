import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy,
  getDoc
} from 'firebase/firestore';
import { MenuItem, Order, RestaurantConfig } from '../types';
import firebaseConfigJson from '../../firebase-applet-config.json';

export const firebaseConfig = {
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  measurementId: firebaseConfigJson.measurementId || 'G-S6WFBXJ7WX',
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics if in browser environment
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore with custom database ID if specified, or default
export const db = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const isFirebaseConnected = true;

// --- CHEF USERNAME / NAME IDENTIFIER HELPER ---
export const formatChefEmailFromName = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  // Convert alphanumeric or generate deterministic hash for Unicode / Khmer script
  const cleanAscii = trimmed.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanAscii.length >= 2) {
    return `${cleanAscii}@kitchen.local`;
  }
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) - hash) + trimmed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(36);
  return `chef_${hex}@kitchen.local`;
};

// --- FIREBASE AUTHENTICATION HELPERS ---

/**
 * Log in with Google Account (Popup).
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('ផ្ទាំងចូលគណនី Google ត្រូវបានបិទ (Google sign-in popup was closed).');
    }
    if (err.code === 'auth/cancelled-popup-request') {
      throw new Error('សំណើចូល Google ត្រូវបានបោះបង់ (Google sign-in request cancelled).');
    }
    throw new Error(err.message || 'ការចូលដោយប្រើ Google មិនបានសម្រេច (Failed to sign in with Google).');
  }
};

/**
 * Log in strictly with existing Email & Password on Firebase Auth.
 * If user does not exist or is not registered, login is rejected.
 */
export const loginFirebaseUser = async (
  email: string, 
  password: string
): Promise<User> => {
  const cleanEmail = email.trim().toLowerCase();
  
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return cred.user;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      throw new Error('គណនី Email នេះមិនទាន់បានចុះឈ្មោះក្នុងប្រព័ន្ធ Firebase ទេ! អ្នកមិនអាចចូលបានឡើយ (Email not registered on Firebase).');
    }
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
      throw new Error('Email មិនទាន់បានចុះឈ្មោះលើ Firebase ឬលេខសម្ងាត់ Password មិនត្រឹមត្រូវទេ! (Email not registered or invalid password).');
    }
    if (err.code === 'auth/wrong-password') {
      throw new Error('លេខសម្ងាត់ Password មិនត្រឹមត្រូវទេ។ សូមព្យាយាមម្តងទៀត! (Incorrect password).');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('ទម្រង់ Email មិនត្រឹមត្រូវទេ (Invalid email address format).');
    }
    if (err.code === 'auth/user-disabled') {
      throw new Error('គណនីនេះត្រូវបានផ្អាកដំណើរការ (Account disabled).');
    }
    if (err.code === 'auth/too-many-requests') {
      throw new Error('ការព្យាយាមចូលច្រើនដងពេក។ សូមរង់ចាំបន្តិចសិន! (Too many attempts. Please try again later).');
    }
    
    throw new Error(err.message || 'ការចូលមិនបានជោគជ័យ។ សូមពិនិត្យ Email & Password ឡើងវិញ!');
  }
};

/**
 * Chef logs in strictly with Chef Name and Password.
 */
export const loginChefByNameAndPassword = async (
  name: string,
  password: string
): Promise<User> => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('សូមបញ្ចូលឈ្មោះចុងភៅ! (Please enter chef name)');
  }
  if (!password) {
    throw new Error('សូមបញ្ចូលលេខសម្ងាត់! (Please enter password)');
  }

  const candidateEmail = formatChefEmailFromName(trimmed);

  try {
    const user = await loginFirebaseUser(candidateEmail, password);
    return user;
  } catch (primaryErr: any) {
    // If name was direct email, bubble up
    if (trimmed.includes('@')) {
      throw primaryErr;
    }
    
    const cleanAscii = trimmed.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanAscii && `${cleanAscii}@kitchen.local` !== candidateEmail) {
      try {
        const user = await loginFirebaseUser(`${cleanAscii}@kitchen.local`, password);
        return user;
      } catch {}
    }

    throw new Error(`ការចូលបរាជ័យ៖ មិនមានឈ្មោះចុងភៅ «${trimmed}» ឬ Password មិនត្រឹមត្រូវ! (Chef name "${trimmed}" not registered by Admin or invalid password)`);
  }
};

/**
 * Backwards-compatible alias that calls loginFirebaseUser
 */
export const loginOrCreateFirebaseUser = async (
  email: string, 
  password: string
): Promise<{ user: User; isNewUser: boolean }> => {
  const user = await loginFirebaseUser(email, password);
  return { user, isNewUser: false };
};

export const registerFirebaseUser = async (email: string, password: string): Promise<User> => {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  return cred.user;
};

/**
 * Creates a new Chef or Staff Firebase Auth account on behalf of the Admin
 * without terminating or logging out the Admin's active session.
 */
export const createChefOrStaffAccountWithoutLoggingOut = async (
  email: string,
  password: string,
  displayName?: string
): Promise<{ uid: string; email: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  const secondaryAppName = `SecondaryAuthApp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
    if (displayName && cred.user) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch (err) {
        console.warn('Profile update notice:', err);
      }
    }
    const uid = cred.user.uid;
    await firebaseSignOut(secondaryAuth);
    return { uid, email: cleanEmail };
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('អាសយដ្ឋាន Email នេះមានក្នុងប្រព័ន្ធ Firebase រួចហើយ! (Email already in use)');
    }
    if (err.code === 'auth/weak-password') {
      throw new Error('លេខសម្ងាត់ត្រូវមានយ៉ាងហោច ៦ ខ្ទង់! (Password must be at least 6 characters)');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('ទម្រង់ Email មិនត្រឹមត្រូវទេ! (Invalid email address format)');
    }
    throw new Error(err.message || 'បរាជ័យក្នុងការបង្កើតគណនីបុគ្គលិក!');
  } finally {
    try {
      const { deleteApp } = await import('firebase/app');
      await deleteApp(secondaryApp);
    } catch {}
  }
};

export const logoutFirebaseAuth = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const subscribeAuthState = (onUserChange: (user: User | null) => void) => {
  return onAuthStateChanged(auth, onUserChange);
};

// --- FIRESTORE MENU ITEMS REPOSITORY ---
export const subscribeFirestoreMenu = (
  onUpdate: (items: MenuItem[]) => void, 
  onError?: (err: Error) => void
) => {
  try {
    const menuRef = collection(db, 'menu');
    return onSnapshot(
      menuRef, 
      (snapshot) => {
        if (!snapshot.empty) {
          const items: MenuItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ ...docSnap.data(), id: docSnap.id } as MenuItem);
          });
          onUpdate(items);
        }
      }, 
      (err) => {
        console.warn('Firestore menu subscription permission or network issue:', err.message);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn('Firestore menu init error:', err);
    return () => {};
  }
};

export const syncMenuItemToFirestore = async (item: MenuItem): Promise<void> => {
  try {
    const itemRef = doc(db, 'menu', item.id);
    await setDoc(itemRef, { ...item }, { merge: true });
  } catch (err: any) {
    console.warn('Failed to sync menu item to Firestore (check rules in Firebase Console):', err.message);
  }
};

export const deleteMenuItemFromFirestore = async (id: string): Promise<void> => {
  try {
    const itemRef = doc(db, 'menu', id);
    await deleteDoc(itemRef);
  } catch (err: any) {
    console.warn('Failed to delete menu item from Firestore:', err.message);
  }
};

// --- FIRESTORE ORDERS REPOSITORY (REAL-TIME KITCHEN & POS SYNC) ---
export const subscribeFirestoreOrders = (
  onUpdate: (orders: Order[]) => void, 
  onError?: (err: Error) => void
) => {
  try {
    const ordersRef = collection(db, 'orders');
    return onSnapshot(
      ordersRef, 
      (snapshot) => {
        const ordersList: Order[] = [];
        snapshot.forEach((docSnap) => {
          ordersList.push({ ...docSnap.data(), id: docSnap.id } as Order);
        });
        // Sort newest first
        ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(ordersList);
      }, 
      (err) => {
        console.warn('Firestore orders subscription permission or network issue:', err.message);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn('Firestore orders init error:', err);
    return () => {};
  }
};

export const syncOrderToFirestore = async (order: Order): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', order.id);
    await setDoc(orderRef, { ...order }, { merge: true });
  } catch (err: any) {
    console.warn('Failed to sync order to Firestore:', err.message);
  }
};

export const updateOrderStatusInFirestore = async (
  orderId: string, 
  status: Order['status']
): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await setDoc(orderRef, { status }, { merge: true });
  } catch (err: any) {
    console.warn('Failed to update order status in Firestore:', err.message);
  }
};

export const updateOrderFlagsInFirestore = async (
  orderId: string, 
  flags: { announced?: boolean; printed?: boolean }
): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await setDoc(orderRef, flags, { merge: true });
  } catch (err: any) {
    console.warn('Failed to update order flags in Firestore:', err.message);
  }
};

// --- FIRESTORE RESTAURANT CONFIG ---
export const subscribeFirestoreConfig = (
  onUpdate: (config: RestaurantConfig) => void,
  onError?: (err: Error) => void
) => {
  try {
    const configRef = doc(db, 'settings', 'restaurant');
    return onSnapshot(
      configRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as RestaurantConfig);
        }
      },
      (err) => {
        console.warn('Firestore config subscription permission or network issue:', err.message);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn('Firestore config subscription error:', err);
    return () => {};
  }
};

export const syncConfigToFirestore = async (config: RestaurantConfig): Promise<void> => {
  try {
    const configRef = doc(db, 'settings', 'restaurant');
    await setDoc(configRef, config, { merge: true });
  } catch (err: any) {
    console.warn('Failed to sync config to Firestore:', err.message);
  }
};
