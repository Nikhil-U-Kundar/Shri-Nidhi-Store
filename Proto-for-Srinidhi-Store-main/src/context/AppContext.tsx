import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Product, CartItem, Order, UserProfile, Address, KhataTransaction, OrderStatus, Bill } from '../types';
import { initialProducts, initialUser, initialOrders, initialBills } from '../data/mockData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Navigation & Modes
  viewMode: 'customer' | 'admin';
  setViewMode: (mode: 'customer' | 'admin') => void;
  toggleViewMode: () => void;
  customerTab: 'home' | 'deals' | 'billing' | 'account' | 'tracking' | 'khata';
  setCustomerTab: (tab: 'home' | 'deals' | 'billing' | 'account' | 'tracking' | 'khata') => void;
  accountSubTab: 'profile' | 'orders' | 'khata' | 'addresses';
  setAccountSubTab: (subTab: 'profile' | 'orders' | 'khata' | 'addresses') => void;

  // Search & Filters
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: 'popular' | 'price-low' | 'price-high' | 'discount';
  setSortBy: (sort: 'popular' | 'price-low' | 'price-high' | 'discount') => void;

  // Catalog
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  updateProductStock: (id: string, newStock: number) => void;
  deleteProduct: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  updateCartItemQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartOriginalTotal: number;
  cartSavings: number;
  deliveryFee: number;
  cartFinalTotal: number;

  // Auth & User
  isLoggedIn: boolean;
  user: UserProfile;
  loginAsDemo: () => void;
  loginAsCustom: (phone: string, name?: string) => void;
  logout: () => void;
  toggleAuthSimulation: () => void;
  addAddress: (addr: Omit<Address, 'id'>) => void;
  removeAddress: (id: string) => void;

  // Khata Store Credit
  khataBalance: number;
  khataLedger: KhataTransaction[];
  recordKhataRepayment: (amount: number, note: string) => void;
  deductKhataBalance: (amount: number, orderId?: string) => boolean;

  // Orders & Tracking
  orders: Order[];
  placeOrder: (orderData: {
    deliveryAddress: string;
    deliveryMode: string;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  activeTrackingOrderId: string;
  setActiveTrackingOrderId: (id: string) => void;

  // Modals
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  isSeoModalOpen: boolean;
  setIsSeoModalOpen: (open: boolean) => void;
  selectedProductDetail: Product | null;
  setSelectedProductDetail: (product: Product | null) => void;
  printReceiptOrder: Order | null;
  setPrintReceiptOrder: (order: Order | null) => void;
  // Billing Counter & Bill Generator (Create Bill & Take Bill)
  bills: Bill[];
  createBill: (billData: Omit<Bill, 'id' | 'billNumber' | 'date' | 'time' | 'timestamp'>) => Bill;
  deleteBill: (billId: string) => void;
  activeBillToTake: Bill | null;
  setActiveBillToTake: (bill: Bill | null) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>('customer');
  const [customerTab, setCustomerTab] = useState<'home' | 'deals' | 'billing' | 'account' | 'tracking' | 'khata'>('home');
  const [accountSubTab, setAccountSubTab] = useState<'profile' | 'orders' | 'khata' | 'addresses'>('profile');

  // Search & Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All Products');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'discount'>('popular');

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('apna_kirana_products');
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('apna_kirana_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User & Auth
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('apna_kirana_auth');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('apna_kirana_user');
      return saved ? JSON.parse(saved) : initialUser;
    } catch {
      return initialUser;
    }
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('apna_kirana_orders');
      return saved ? JSON.parse(saved) : initialOrders;
    } catch {
      return initialOrders;
    }
  });

  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string>('ORD-9412');

  // Bills (Counter Billing & POS)
  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const saved = localStorage.getItem('sri_nidhi_bills');
      return saved ? JSON.parse(saved) : initialBills;
    } catch {
      return initialBills;
    }
  });

  const [activeBillToTake, setActiveBillToTake] = useState<Bill | null>(null);

  // Modals
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [printReceiptOrder, setPrintReceiptOrder] = useState<Order | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // LocalStorage Sync
  useEffect(() => {
    try {
      localStorage.setItem('sri_nidhi_bills', JSON.stringify(bills));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [bills]);
  useEffect(() => {
    try {
      localStorage.setItem('apna_kirana_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('apna_kirana_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('apna_kirana_auth', isLoggedIn ? 'true' : 'false');
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem('apna_kirana_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('apna_kirana_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [orders]);

  // Toast Helpers
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // View Mode
  const toggleViewMode = () => {
    setViewMode((prev) => {
      const next = prev === 'customer' ? 'admin' : 'customer';
      addToast(
        next === 'admin'
          ? 'Switched to Sri Nidhi Store Operations Console'
          : 'Returned to Sri Nidhi Storefront',
        'info'
      );
      return next;
    });
  };

  // Auth Helpers
  const loginAsDemo = () => {
    setIsLoggedIn(true);
    addToast('Signed in as Rahul Sharma (+91 98765 43210)', 'success');
  };

  const loginAsCustom = (phone: string, name?: string) => {
    setUser((prev) => ({
      ...prev,
      phone,
      name: name || prev.name
    }));
    setIsLoggedIn(true);
    addToast(`Signed in with ${phone}`, 'success');
  };

  const logout = () => {
    setIsLoggedIn(false);
    addToast('Logged out. You are now browsing as Guest with open pricing.', 'info');
  };

  const toggleAuthSimulation = () => {
    if (isLoggedIn) {
      logout();
    } else {
      loginAsDemo();
    }
  };

  const addAddress = (addr: Omit<Address, 'id'>) => {
    const newAddr: Address = {
      ...addr,
      id: `addr-${Date.now()}`
    };
    setUser((prev) => ({
      ...prev,
      addresses: [...prev.addresses, newAddr]
    }));
    addToast('New delivery address saved', 'success');
  };

  const removeAddress = (id: string) => {
    setUser((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((a) => a.id !== id)
    }));
    addToast('Address removed', 'info');
  };

  // Khata Store Credit Logic
  const recordKhataRepayment = (amount: number, note: string) => {
    setUser((prev) => {
      const newBal = prev.khataBalance + amount;
      const newTx: KhataTransaction = {
        id: `tx-${Date.now()}`,
        date: 'Today',
        timestamp: Date.now(),
        desc: note || 'Cash Payment recorded at Shop Counter (Shop 12)',
        type: 'credit',
        amount,
        balanceAfter: newBal
      };
      return {
        ...prev,
        khataBalance: newBal,
        khataLedger: [newTx, ...prev.khataLedger]
      };
    });
    addToast(`Recorded ₹${amount} counter payment to Khata ledger`, 'success');
  };

  const deductKhataBalance = (amount: number, orderId?: string): boolean => {
    if (user.khataBalance < amount) {
      addToast(`Insufficient Khata balance (₹${user.khataBalance}). Please choose UPI or COD.`, 'error');
      return false;
    }
    setUser((prev) => {
      const newBal = prev.khataBalance - amount;
      const newTx: KhataTransaction = {
        id: `tx-${Date.now()}`,
        date: 'Today',
        timestamp: Date.now(),
        desc: `Order #${orderId || 'NEW'} Grocery Purchase`,
        type: 'debit',
        amount,
        balanceAfter: newBal,
        referenceOrder: orderId
      };
      return {
        ...prev,
        khataBalance: newBal,
        khataLedger: [newTx, ...prev.khataLedger]
      };
    });
    return true;
  };

  // Cart Logic
  const addToCart = (product: Product, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, { ...product, qty }];
    });
    addToast(`Added ${product.name} to basket`, 'success');
  };

  const updateCartItemQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    addToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, it) => sum + it.qty, 0);
  const cartSubtotal = cart.reduce((sum, it) => sum + it.discountPrice * it.qty, 0);
  const cartOriginalTotal = cart.reduce((sum, it) => sum + it.price * it.qty, 0);
  const cartSavings = Math.max(0, cartOriginalTotal - cartSubtotal);
  // Free delivery above ₹499
  const deliveryFee = cartSubtotal >= 499 || cartSubtotal === 0 ? 0 : 40;
  const cartFinalTotal = cartSubtotal > 0 ? cartSubtotal + deliveryFee : 0;

  // Catalog CRUD
  const addProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
    addToast(`Added "${product.name}" to store catalog`, 'success');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    addToast('Product updated successfully', 'success');
  };

  const updateProductStock = (id: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
    );
    addToast('Stock level updated', 'success');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addToast('Product removed from catalog', 'info');
  };

  // Orders
  const placeOrder = (orderData: {
    deliveryAddress: string;
    deliveryMode: string;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
  }): Order => {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      date: 'Just now',
      timestamp: Date.now(),
      items: cart.map((it) => ({
        name: it.name,
        qty: it.qty,
        price: it.discountPrice,
        unit: it.unit
      })),
      subtotal: cartSubtotal,
      deliveryFee,
      total: cartFinalTotal,
      status: 'Order Placed',
      paymentMethod: orderData.paymentMethod,
      paymentStatus:
        orderData.paymentMethod === 'Cash on Delivery'
          ? 'Pending Cash at Doorstep'
          : orderData.paymentMethod === 'Kirana Khata (Store Credit)'
          ? 'Settled via Ledger'
          : 'Paid Online via Gateway',
      deliveryAddress: orderData.deliveryAddress,
      deliveryMode: orderData.deliveryMode,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      estimatedDelivery: 'Within 25-35 minutes'
    };

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const cartMatch = cart.find((c) => c.id === p.id);
        if (cartMatch) {
          return { ...p, stock: Math.max(0, p.stock - cartMatch.qty) };
        }
        return p;
      })
    );

    // If payment is via Khata, deduct
    if (orderData.paymentMethod === 'Kirana Khata (Store Credit)') {
      deductKhataBalance(cartFinalTotal, orderId);
    }

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setActiveTrackingOrderId(orderId);

    // Celebratory confetti burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    addToast(`Order #${orderId} confirmed! Dispatched from Sector 14 store.`, 'success');
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    addToast(`Order #${orderId} status updated to: ${status}`, 'info');
  };

  // Billing Counter Methods
  const createBill = (billData: Omit<Bill, 'id' | 'billNumber' | 'date' | 'time' | 'timestamp'>): Bill => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const billNum = `SN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBill: Bill = {
      ...billData,
      id: `bill-${Date.now()}`,
      billNumber: billNum,
      date: dateStr,
      time: timeStr,
      timestamp: Date.now()
    };

    // If payment method is Kirana Khata, deduct from user's khata ledger
    if (newBill.paymentMethod === 'Kirana Khata') {
      deductKhataBalance(newBill.total, newBill.billNumber);
    }

    // Deduct stock for matching products
    setProducts((prev) =>
      prev.map((p) => {
        const itemMatch = newBill.items.find(
          (bi) => bi.name.toLowerCase().trim() === p.name.toLowerCase().trim()
        );
        if (itemMatch) {
          return { ...p, stock: Math.max(0, p.stock - itemMatch.qty) };
        }
        return p;
      })
    );

    setBills((prev) => [newBill, ...prev]);
    setActiveBillToTake(newBill);

    // Confetti
    try {
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
    } catch {}

    addToast(`Bill #${billNum} generated! Ready to Take Bill / Print.`, 'success');
    return newBill;
  };

  const deleteBill = (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
    addToast('Bill removed from archive', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        viewMode,
        setViewMode,
        toggleViewMode,
        customerTab,
        setCustomerTab,
        accountSubTab,
        setAccountSubTab,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        products,
        addProduct,
        updateProduct,
        updateProductStock,
        deleteProduct,
        cart,
        addToCart,
        updateCartItemQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        cartOriginalTotal,
        cartSavings,
        deliveryFee,
        cartFinalTotal,
        isLoggedIn,
        user,
        loginAsDemo,
        loginAsCustom,
        logout,
        toggleAuthSimulation,
        addAddress,
        removeAddress,
        khataBalance: user.khataBalance,
        khataLedger: user.khataLedger,
        recordKhataRepayment,
        deductKhataBalance,
        orders,
        placeOrder,
        updateOrderStatus,
        activeTrackingOrderId,
        setActiveTrackingOrderId,
        bills,
        createBill,
        deleteBill,
        activeBillToTake,
        setActiveBillToTake,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        isSeoModalOpen,
        setIsSeoModalOpen,
        selectedProductDetail,
        setSelectedProductDetail,
        printReceiptOrder,
        setPrintReceiptOrder,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
