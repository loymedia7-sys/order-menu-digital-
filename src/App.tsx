import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, AppView } from './components/Navbar';
import { CustomerMenu } from './components/customer/CustomerMenu';
import { CartDrawer } from './components/customer/CartDrawer';
import { OrderStatusModal } from './components/customer/OrderStatusModal';
import { KitchenTablet } from './components/kitchen/KitchenTablet';
import { TableQRStation } from './components/admin/TableQRStation';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PrintReceiptModal } from './components/admin/PrintReceiptModal';
import { StaffLoginModal } from './components/auth/StaffLoginModal';
import { FirebaseLoginModal } from './components/auth/FirebaseLoginModal';
import { LoginView } from './components/auth/LoginView';
import { RegisterShopView } from './components/auth/RegisterShopView';
import { ShopOnboardingModal } from './components/admin/ShopOnboardingModal';
import { SmartMenuLanding } from './components/landing/SmartMenuLanding';
import { MenuItem, Order, OrderItem, RestaurantConfig } from './types';
import { TenantProvider, useTenant } from './lib/TenantContext';
import { subscribeAuthState, logoutFirebaseAuth, loginWithGoogle } from './lib/firebase';
import { createOrder } from './services/api';
import { User } from 'firebase/auth';

function MainAppContent() {
  const {
    tenantId,
    tenantInfo,
    userProfile,
    role,
    plan,
    isOwnerOrAdmin,
    isChef,
    menuItems,
    orders,
    config,
    saveMenuDish,
    deleteMenuDish,
    placeTenantOrder,
    changeOrderStatus,
    updateConfig,
    refreshTenantData
  } = useTenant();

  // Navigation & View Routing: default to landing for unauthenticated users, or query param
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('chef_login') || params.get('auth_chef')) {
        return 'kitchen';
      }
      if (params.get('shop') || params.get('tenant') || params.get('table')) {
        return 'customer';
      }
      if (params.get('view') === 'admin' || params.get('view') === 'dashboard') {
        return 'admin';
      }
      if (params.get('view') === 'login') {
        return 'login';
      }
    }
    return 'landing';
  });

  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);
  const [isFirebaseLoginOpen, setIsFirebaseLoginOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);

  // Table state (read from URL query e.g. ?table=5 if present)
  const [tableNumber, setTableNumber] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('table');
      if (t && !isNaN(Number(t))) {
        return Number(t);
      }
    }
    return 5;
  });

  // Cart & Customer state
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Language & Currency
  const [lang, setLang] = useState<'km' | 'en'>('km');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubAuth = subscribeAuthState((user) => {
      setAuthUser(user);
      if (user && (currentView === 'login' || currentView === 'landing')) {
        setCurrentView('admin');
        setIsFirebaseLoginOpen(false);
      }
    });

    return () => {
      unsubAuth();
    };
  }, [currentView]);

  const handleLogout = async () => {
    try {
      await logoutFirebaseAuth();
      setAuthUser(null);
      setCurrentView('landing');
    } catch (e) {
      console.warn('Logout error:', e);
    }
  };

  const handleLandingDashboardLogin = async () => {
    if (authUser) {
      setCurrentView('admin');
      return;
    }
    setIsGoogleLoggingIn(true);
    try {
      const user = await loginWithGoogle();
      setAuthUser(user);
      setCurrentView('admin');
    } catch (err: any) {
      console.warn('Google sign-in redirection note:', err);
      setCurrentView('login');
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  // Cart Handlers
  const handleAddToCart = (item: OrderItem) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.itemId === item.itemId &&
          i.selectedSpicy === item.selectedSpicy &&
          i.selectedSweetness === item.selectedSweetness &&
          i.notes === item.notes
      );

      if (existingIdx !== -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + item.quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          itemTotal: updated[existingIdx].price * newQty,
        };
        return updated;
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    setCartItems((prev) => {
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: newQty,
        itemTotal: updated[index].price * newQty,
      };
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSubmitOrder = async (orderData: Partial<Order>) => {
    try {
      const itemsToOrder = orderData.items || cartItems;
      const orderTotal = orderData.total !== undefined ? orderData.total : itemsToOrder.reduce((s, i) => s + i.itemTotal, 0);
      const exchangeRate = config.exchangeRate || 4100;
      const orderTotalKhr = orderData.total_khr !== undefined ? orderData.total_khr : Math.round(orderTotal * exchangeRate);

      const newOrder: Order = {
        id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orderNumber: orders.length + 1,
        tableNumber: tableNumber,
        items: itemsToOrder,
        total: orderTotal,
        total_khr: orderTotalKhr,
        status: 'new',
        createdAt: new Date().toISOString(),
        restaurantId: tenantId,
        announced: false,
        printed: false,
        customerName: orderData.customerName || `Table ${tableNumber} Guest`,
        customerNote: orderData.customerNote || '',
        paymentMethod: orderData.paymentMethod || 'cash'
      };

      // 1. Dispatch to TenantContext for instant UI and scoped Firestore sync
      await placeTenantOrder(newOrder);

      // 2. Also send to Express backend /api/orders so Telegram / Server-Side APIs trigger
      try {
        await createOrder(newOrder);
      } catch (err) {
        console.info('Backend order sync note:', err);
      }

      setActiveTrackingOrder(newOrder);
      setCartItems([]);
      setIsCartOpen(false);
    } catch (err) {
      console.error('Submit order failed:', err);
    }
  };

  const totalCartCount = cartItems.reduce((sum, it) => sum + it.quantity, 0);
  const activeKitchenOrdersCount = orders.filter(
    (o) => o.status === 'new' || o.status === 'preparing'
  ).length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased selection:bg-amber-500 selection:text-white">
      {/* Navigation Header (displayed when outside standalone landing / login / register views) */}
      {currentView !== 'login' && currentView !== 'landing' && currentView !== ('register_shop' as any) && (
        <Navbar
          currentView={currentView}
          onViewChange={(view) => {
            // Guard: If chef is logged in and tries to go to admin or table_qr, keep in kitchen
            if (role === 'chef' && (view === 'admin' || view === 'table_qr')) {
              setCurrentView('kitchen');
              return;
            }
            setCurrentView(view);
          }}
          cartItemCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          currentTable={tableNumber}
          onSelectTable={setTableNumber}
          lang={lang}
          onToggleLang={() => setLang((l) => (l === 'km' ? 'en' : 'km'))}
          currency={currency}
          onToggleCurrency={() => setCurrency((c) => (c === 'USD' ? 'KHR' : 'USD'))}
          config={config}
          activeKitchenOrdersCount={activeKitchenOrdersCount}
          onOpenStaffLogin={() => setIsStaffLoginOpen(true)}
          authUser={authUser}
          userRole={role}
          onOpenFirebaseLogin={() => setIsFirebaseLoginOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Main View Router */}
      <main>
        {currentView === 'landing' && (
          <SmartMenuLanding
            onLoginDashboard={handleLandingDashboardLogin}
            onLoginKitchen={() => setCurrentView('kitchen')}
            onRegisterShop={() => setCurrentView('register_shop' as any)}
            lang={lang}
            onToggleLang={() => setLang((l) => (l === 'km' ? 'en' : 'km'))}
            config={config}
            isLoggingIn={isGoogleLoggingIn}
          />
        )}

        {currentView === 'login' && (
          <LoginView
            onLoginSuccess={(user, targetView = 'admin') => {
              setAuthUser(user);
              setCurrentView(targetView === 'kitchen' ? 'kitchen' : 'admin');
            }}
            onContinueAsGuest={() => setCurrentView('customer')}
            lang={lang}
            onToggleLang={() => setLang((l) => (l === 'km' ? 'en' : 'km'))}
            config={config}
          />
        )}

        {currentView === ('register_shop' as any) && (
          <RegisterShopView
            onRegisterSuccess={(newTenantId) => {
              setCurrentView('admin');
            }}
            onSwitchToLogin={() => setCurrentView('login')}
            lang={lang}
          />
        )}

        {currentView === 'customer' && (
          <CustomerMenu
            menuItems={menuItems}
            onAddToCart={handleAddToCart}
            tableNumber={tableNumber}
            onSelectTable={setTableNumber}
            config={config}
            lang={lang}
            currency={currency}
            activeOrders={orders}
            onViewOrderStatus={setActiveTrackingOrder}
            onOpenCart={() => setIsCartOpen(true)}
            cartCount={totalCartCount}
          />
        )}

        {currentView === 'kitchen' && (
          <KitchenTablet
            orders={orders}
            onRefreshOrders={refreshTenantData}
            config={config}
            lang={lang}
            onOpenReceiptModal={setPrintingOrder}
            onStatusChange={changeOrderStatus}
          />
        )}

        {currentView === 'table_qr' && (
          <TableQRStation config={config} lang={lang} tenantId={tenantId} />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            menuItems={menuItems}
            orders={orders}
            config={config}
            onRefreshMenu={refreshTenantData}
            onRefreshOrders={refreshTenantData}
            onRefreshConfig={refreshTenantData}
            lang={lang}
            currency={currency}
            onOpenReceiptModal={setPrintingOrder}
            authUser={authUser}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Cart Drawer Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onSubmitOrder={handleSubmitOrder}
        tableNumber={tableNumber}
        config={config}
        lang={lang}
        currency={currency}
      />

      {/* Live Customer Order Tracker Modal */}
      {activeTrackingOrder && (
        <OrderStatusModal
          order={activeTrackingOrder}
          onClose={() => setActiveTrackingOrder(null)}
          config={config}
          lang={lang}
          onCallWaiter={() => {
            alert(lang === 'km' ? 'បានជូនដំណឹងដល់បុគ្គលិករួចរាល់! បុគ្គលិកនឹងអញ្ជើញមកកាន់តុរបស់អ្នកក្នុងពេលបន្តិចទៀត។' : 'Waiter notified! Staff will arrive at your table shortly.');
          }}
        />
      )}

      {/* Thermal Receipt Print Modal */}
      {printingOrder && (
        <PrintReceiptModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
          config={config}
          lang={lang}
        />
      )}

      {/* Firebase 2-Input Email & Password Admin Login Modal */}
      <FirebaseLoginModal
        isOpen={isFirebaseLoginOpen}
        onClose={() => setIsFirebaseLoginOpen(false)}
        onLoginSuccess={(user) => {
          setAuthUser(user);
          setCurrentView('admin');
          setIsFirebaseLoginOpen(false);
        }}
        lang={lang}
        onSwitchToStaffPin={() => {
          setIsFirebaseLoginOpen(false);
          setIsStaffLoginOpen(true);
        }}
        onContinueAsGuest={() => {
          setIsFirebaseLoginOpen(false);
          setCurrentView('customer');
        }}
      />

      {/* Multi-Tenant Onboarding Modal */}
      <ShopOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        lang={lang}
      />

      {/* Staff & Chef / Admin Login Modal */}
      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
        }}
        lang={lang}
        activeKitchenOrdersCount={activeKitchenOrdersCount}
        config={config}
        onOpenFirebaseLogin={() => {
          setIsStaffLoginOpen(false);
          setIsFirebaseLoginOpen(true);
        }}
        onResetPasswordToDefault={async (targetRole) => {
          try {
            const defaultVal = targetRole === 'admin' ? '8888' : '1234';
            const updatedPasswords = {
              ...(config.passwords || {}),
              [targetRole]: defaultVal,
            };
            const updatedConfig: RestaurantConfig = {
              ...config,
              passwords: updatedPasswords,
              chefPin: targetRole === 'chef' ? defaultVal : (config.chefPin || '1234'),
              adminPin: targetRole === 'admin' ? defaultVal : (config.adminPin || '8888'),
              tableQrPin: targetRole === 'table_qr' ? defaultVal : (config.tableQrPin || '1234'),
            };
            await updateConfig(updatedConfig);
          } catch (e) {
            console.warn('Reset password error:', e);
          }
        }}
      />
    </div>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = subscribeAuthState((user) => setAuthUser(user));
    return () => unsub();
  }, []);

  return (
    <TenantProvider authUser={authUser}>
      <MainAppContent />
    </TenantProvider>
  );
}
