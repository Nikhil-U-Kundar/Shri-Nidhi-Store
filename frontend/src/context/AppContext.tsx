import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Product,
  CartItem,
  Order,
  UserProfile,
  Address,
  KhataTransaction,
  OrderStatus,
  Bill,
} from '../types';
import { initialProducts, initialUser, initialOrders, initialBills } from '../data/mockData';
import { api, clearAuth, getStoredUser, getToken, setAuth } from '../api';
import { mapApiProduct, toApiProductBody } from '../lib/mapProduct';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  viewMode: 'customer' | 'admin';
  customerTab: 'home' | 'deals' | 'billing' | 'account' | 'tracking' | 'khata';
  setCustomerTab: (tab: 'home' | 'deals' | 'billing' | 'account' | 'tracking' | 'khata') => void;
  accountSubTab: 'profile' | 'orders' | 'khata' | 'addresses';
  setAccountSubTab: (subTab: 'profile' | 'orders' | 'khata' | 'addresses') => void;

  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: 'popular' | 'price-low' | 'price-high' | 'discount';
  setSortBy: (sort: 'popular' | 'price-low' | 'price-high' | 'discount') => void;

  products: Product[];
  catalogLoading: boolean;
  refreshCatalog: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  updateProductStock: (id: string, newStock: number) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

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

  isLoggedIn: boolean;
  authRole: 'customer' | 'admin' | null;
  user: UserProfile;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  login: (loginId: string, password: string, role: 'customer' | 'admin') => Promise<void>;
  registerCustomer: (name: string, phone: string) => Promise<void>;
  logout: () => void;
  addAddress: (addr: Omit<Address, 'id'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;

  khataBalance: number;
  khataLedger: KhataTransaction[];
  recordKhataRepayment: (amount: number, note: string) => Promise<void>;
  deductKhataBalance: (amount: number, orderId?: string) => boolean;

  orders: Order[];
  placeOrder: (orderData: {
    deliveryAddress: string;
    deliveryMode: string;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  activeTrackingOrderId: string;
  setActiveTrackingOrderId: (id: string) => void;

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

  bills: Bill[];
  createBill: (
    billData: Omit<Bill, 'id' | 'billNumber' | 'date' | 'time' | 'timestamp'>
  ) => Promise<Bill>;
  deleteBill: (billId: string) => Promise<void>;
  activeBillToTake: Bill | null;
  setActiveBillToTake: (bill: Bill | null) => void;

  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const emptyUser: UserProfile = {
  ...initialUser,
  name: 'Guest',
  phone: '',
  email: '',
  addresses: [],
  khataBalance: 0,
  khataCreditLimit: 10000,
  khataLedger: [],
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customerTab, setCustomerTab] = useState<
    'home' | 'deals' | 'billing' | 'account' | 'tracking' | 'khata'
  >('home');
  const [accountSubTab, setAccountSubTab] = useState<'profile' | 'orders' | 'khata' | 'addresses'>(
    'profile'
  );
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'discount'>(
    'popular'
  );

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [usingMockCatalog, setUsingMockCatalog] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sri_nidhi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const storedUser = getStoredUser();
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getToken()));
  const [authRole, setAuthRole] = useState<'customer' | 'admin' | null>(
    storedUser?.role === 'admin' ? 'admin' : storedUser ? 'customer' : null
  );
  const viewMode: 'customer' | 'admin' = authRole === 'admin' ? 'admin' : 'customer';
  const [user, setUser] = useState<UserProfile>(emptyUser);

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState('ORD-9412');
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [activeBillToTake, setActiveBillToTake] = useState<Bill | null>(null);

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [printReceiptOrder, setPrintReceiptOrder] = useState<Order | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const visibleOnly = authRole !== 'admin';
      const data = await api<{ products: any[] }>(
        `/products${visibleOnly ? '?visible=true' : ''}`
      );
      setUsingMockCatalog(false);
      setProducts(
        data.products?.length
          ? data.products.map(mapApiProduct)
          : initialProducts
      );
    } catch {
      setProducts(initialProducts);
      setUsingMockCatalog(true);
    } finally {
      setCatalogLoading(false);
    }
  }, [authRole]);

  const refreshProfile = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await api<{ user: any }>('/profile/me');
      const u = data.user;
      setAuthRole(u.role === 'admin' ? 'admin' : 'customer');
      setIsLoggedIn(true);
      setUser({
        name: u.name || '',
        phone: u.phone || '',
        email: u.email || '',
        addresses: u.addresses || [],
        khataBalance: Number(u.khataBalance) || 0,
        khataCreditLimit: Number(u.khataCreditLimit) || 10000,
        khataLedger: u.khataLedger || [],
      });
    } catch {
      clearAuth();
      setIsLoggedIn(false);
      setAuthRole(null);
      setUser(emptyUser);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await api<{ orders: Order[] }>('/orders');
      setOrders(data.orders?.length ? data.orders : []);
      if (data.orders?.[0]) setActiveTrackingOrderId(data.orders[0].id);
    } catch {
      /* keep existing */
    }
  }, []);

  const refreshBills = useCallback(async () => {
    if (!getToken() || authRole !== 'admin') return;
    try {
      const data = await api<{ bills: Bill[] }>('/bills');
      if (data.bills) setBills(data.bills);
    } catch {
      /* keep existing */
    }
  }, [authRole]);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    if (getToken()) {
      refreshProfile().then(() => {
        refreshOrders();
      });
    }
  }, [refreshProfile, refreshOrders]);

  useEffect(() => {
    if (authRole === 'admin') refreshBills();
  }, [authRole, refreshBills]);

  useEffect(() => {
    try {
      localStorage.setItem('sri_nidhi_cart', JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const applyAuthSession = async (token: string, authUser: any) => {
    setAuth(token, authUser);
    setIsLoggedIn(true);
    setAuthRole(authUser.role === 'admin' ? 'admin' : 'customer');
    setIsLoginModalOpen(false);
    await refreshProfile();
    await refreshOrders();
    if (authUser.role === 'admin') {
      await refreshBills();
    }
  };

  const login = async (loginId: string, password: string, role: 'customer' | 'admin') => {
    const data = await api<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: loginId, password, role }),
    });
    await applyAuthSession(data.token, data.user);
    addToast(
      data.user.role === 'admin'
        ? 'Signed in as shop owner'
        : `Signed in as ${data.user.name}`,
      'success'
    );
  };

  const registerCustomer = async (name: string, phone: string) => {
    const data = await api<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone }),
    });
    await applyAuthSession(data.token, data.user);
    addToast(`Welcome ${data.user.name}!`, 'success');
  };

  const logout = () => {
    clearAuth();
    setIsLoggedIn(false);
    setAuthRole(null);
    setUser(emptyUser);
    setOrders(initialOrders);
    addToast('Logged out. Browsing as Guest.', 'info');
  };

  const addAddress = async (addr: Omit<Address, 'id'>) => {
    if (getToken()) {
      try {
        const data = await api<{ address: Address }>('/profile/addresses', {
          method: 'POST',
          body: JSON.stringify(addr),
        });
        setUser((prev) => ({
          ...prev,
          addresses: [...prev.addresses, data.address],
        }));
        addToast('New delivery address saved', 'success');
        return;
      } catch (err: any) {
        addToast(err?.message || 'Could not save address', 'error');
        return;
      }
    }
    const newAddr: Address = { ...addr, id: `addr-${Date.now()}` };
    setUser((prev) => ({ ...prev, addresses: [...prev.addresses, newAddr] }));
    addToast('New delivery address saved', 'success');
  };

  const removeAddress = async (id: string) => {
    if (getToken()) {
      try {
        await api(`/profile/addresses/${id}`, { method: 'DELETE' });
      } catch (err: any) {
        addToast(err?.message || 'Could not remove address', 'error');
        return;
      }
    }
    setUser((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((a) => a.id !== id),
    }));
    addToast('Address removed', 'info');
  };

  const recordKhataRepayment = async (amount: number, note: string) => {
    if (getToken()) {
      try {
        await api('/profile/khata/repay', {
          method: 'POST',
          body: JSON.stringify({ amount, note }),
        });
        await refreshProfile();
        addToast(`Recorded ₹${amount} payment to Khata ledger`, 'success');
        return;
      } catch (err: any) {
        addToast(err?.message || 'Could not record payment', 'error');
        return;
      }
    }
    setUser((prev) => {
      const newBal = prev.khataBalance + amount;
      const newTx: KhataTransaction = {
        id: `tx-${Date.now()}`,
        date: 'Today',
        timestamp: Date.now(),
        desc: note || 'Cash Payment recorded at Shop Counter',
        type: 'credit',
        amount,
        balanceAfter: newBal,
      };
      return {
        ...prev,
        khataBalance: newBal,
        khataLedger: [newTx, ...prev.khataLedger],
      };
    });
    addToast(`Recorded ₹${amount} counter payment to Khata ledger`, 'success');
  };

  const deductKhataBalance = (amount: number, _orderId?: string): boolean => {
    if (user.khataBalance < amount) {
      addToast(
        `Insufficient Khata balance (₹${user.khataBalance}). Please choose UPI or COD.`,
        'error'
      );
      return false;
    }
    return true;
  };

  const addToCart = (product: Product, qty = 1) => {
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
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    addToast('Item removed from cart', 'info');
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, it) => sum + it.qty, 0);
  const cartSubtotal = cart.reduce((sum, it) => sum + it.discountPrice * it.qty, 0);
  const cartOriginalTotal = cart.reduce((sum, it) => sum + it.price * it.qty, 0);
  const cartSavings = Math.max(0, cartOriginalTotal - cartSubtotal);
  const deliveryFee = cartSubtotal >= 499 || cartSubtotal === 0 ? 0 : 40;
  const cartFinalTotal = cartSubtotal > 0 ? cartSubtotal + deliveryFee : 0;

  const addProduct = async (product: Product) => {
    if (!usingMockCatalog && getToken() && authRole === 'admin') {
      try {
        const data = await api<{ product: any }>('/admin/products', {
          method: 'POST',
          body: JSON.stringify(toApiProductBody(product)),
        });
        setProducts((prev) => [mapApiProduct(data.product), ...prev]);
        addToast(`Added "${product.name}" to store catalog`, 'success');
        return;
      } catch (err: any) {
        addToast(err?.message || 'Could not add product', 'error');
        return;
      }
    }
    setProducts((prev) => [product, ...prev]);
    addToast(`Added "${product.name}" to store catalog`, 'success');
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!usingMockCatalog && getToken() && authRole === 'admin') {
      try {
        const body: Record<string, unknown> = {};
        if (updates.name !== undefined) body.name = updates.name;
        if (updates.brand !== undefined) body.brand = updates.brand;
        if (updates.image !== undefined) body.imageUrl = updates.image;
        if (updates.unit !== undefined) body.packLabel = updates.unit;
        if (updates.discountPrice !== undefined) body.sellingPrice = updates.discountPrice;
        if (updates.price !== undefined) body.mrp = updates.price;
        if (updates.stock !== undefined) body.stockQuantity = updates.stock;
        if (updates.description !== undefined) body.description = updates.description;
        const data = await api<{ product: any }>(`/admin/products/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        setProducts((prev) => prev.map((p) => (p.id === id ? mapApiProduct(data.product) : p)));
        addToast('Product updated successfully', 'success');
        return;
      } catch (err: any) {
        addToast(err?.message || 'Could not update product', 'error');
        return;
      }
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    addToast('Product updated successfully', 'success');
  };

  const updateProductStock = async (id: string, newStock: number) => {
    await updateProduct(id, { stock: newStock });
  };

  const deleteProduct = async (id: string) => {
    if (!usingMockCatalog && getToken() && authRole === 'admin') {
      try {
        await api(`/admin/products/${id}`, { method: 'DELETE' });
      } catch (err: any) {
        addToast(err?.message || 'Could not delete product', 'error');
        return;
      }
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addToast('Product removed from catalog', 'info');
  };

  const placeOrder = async (orderData: {
    deliveryAddress: string;
    deliveryMode: string;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
  }): Promise<Order> => {
    if (
      (orderData.paymentMethod === 'Kirana Khata (Store Credit)' ||
        orderData.paymentMethod === 'Kirana Khata') &&
      !deductKhataBalance(cartFinalTotal)
    ) {
      throw new Error('Insufficient Khata balance');
    }

    if (getToken() && !usingMockCatalog) {
      try {
        const data = await api<{ order: Order }>('/orders', {
          method: 'POST',
          body: JSON.stringify({
            ...orderData,
            items: cart.map((it) => ({
              productId: it.id,
              qty: it.qty,
              unit: it.unit,
            })),
          }),
        });
        const newOrder = data.order;
        setOrders((prev) => [newOrder, ...prev]);
        clearCart();
        setActiveTrackingOrderId(newOrder.id);
        await refreshCatalog();
        await refreshProfile();
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {
          /* ignore */
        }
        addToast(`Order #${newOrder.id} confirmed!`, 'success');
        return newOrder;
      } catch (err: any) {
        addToast(err?.message || 'Could not place order', 'error');
        throw err;
      }
    }

    // Offline / mock fallback
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      date: 'Just now',
      timestamp: Date.now(),
      items: cart.map((it) => ({
        name: it.name,
        qty: it.qty,
        price: it.discountPrice,
        unit: it.unit,
      })),
      subtotal: cartSubtotal,
      deliveryFee,
      total: cartFinalTotal,
      status: 'Order Placed',
      paymentMethod: orderData.paymentMethod,
      paymentStatus:
        orderData.paymentMethod === 'Cash on Delivery'
          ? 'Pending Cash at Doorstep'
          : orderData.paymentMethod.includes('Khata')
            ? 'Settled via Ledger'
            : 'Paid Online via Gateway',
      deliveryAddress: orderData.deliveryAddress,
      deliveryMode: orderData.deliveryMode,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      estimatedDelivery: 'Within 25-35 minutes',
    };

    setProducts((prev) =>
      prev.map((p) => {
        const cartMatch = cart.find((c) => c.id === p.id);
        if (cartMatch) return { ...p, stock: Math.max(0, p.stock - cartMatch.qty) };
        return p;
      })
    );

    if (orderData.paymentMethod.includes('Khata')) {
      setUser((prev) => {
        const newBal = prev.khataBalance - cartFinalTotal;
        const newTx: KhataTransaction = {
          id: `tx-${Date.now()}`,
          date: 'Today',
          timestamp: Date.now(),
          desc: `Order #${orderId} Grocery Purchase`,
          type: 'debit',
          amount: cartFinalTotal,
          balanceAfter: newBal,
          referenceOrder: orderId,
        };
        return { ...prev, khataBalance: newBal, khataLedger: [newTx, ...prev.khataLedger] };
      });
    }

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setActiveTrackingOrderId(orderId);
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      /* ignore */
    }
    addToast(`Order #${orderId} confirmed!`, 'success');
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (getToken() && authRole === 'admin' && !usingMockCatalog) {
      try {
        const data = await api<{ order: Order }>(`/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        addToast(`Order #${orderId} status updated to: ${status}`, 'info');
        return;
      } catch (err: any) {
        addToast(err?.message || 'Could not update status', 'error');
        return;
      }
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    addToast(`Order #${orderId} status updated to: ${status}`, 'info');
  };

  const createBill = async (
    billData: Omit<Bill, 'id' | 'billNumber' | 'date' | 'time' | 'timestamp'>
  ): Promise<Bill> => {
    if (getToken() && authRole === 'admin' && !usingMockCatalog) {
      try {
        const data = await api<{ bill: Bill }>('/bills', {
          method: 'POST',
          body: JSON.stringify({
            ...billData,
            items: billData.items.map((it) => ({
              productId: it.id.startsWith('bill-') ? undefined : it.id,
              name: it.name,
              unit: it.unit,
              price: it.price,
              qty: it.qty,
            })),
          }),
        });
        setBills((prev) => [data.bill, ...prev]);
        setActiveBillToTake(data.bill);
        await refreshCatalog();
        try {
          confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
        } catch {
          /* ignore */
        }
        addToast(`Bill #${data.bill.billNumber} generated!`, 'success');
        return data.bill;
      } catch (err: any) {
        addToast(err?.message || 'Could not create bill', 'error');
        throw err;
      }
    }

    const now = new Date();
    const billNum = `SN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBill: Bill = {
      ...billData,
      id: `bill-${Date.now()}`,
      billNumber: billNum,
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      timestamp: Date.now(),
    };

    if (newBill.paymentMethod === 'Kirana Khata') {
      setUser((prev) => {
        const newBal = prev.khataBalance - newBill.total;
        return {
          ...prev,
          khataBalance: newBal,
          khataLedger: [
            {
              id: `tx-${Date.now()}`,
              date: 'Today',
              timestamp: Date.now(),
              desc: `Bill #${billNum}`,
              type: 'debit' as const,
              amount: newBill.total,
              balanceAfter: newBal,
              referenceOrder: billNum,
            },
            ...prev.khataLedger,
          ],
        };
      });
    }

    setProducts((prev) =>
      prev.map((p) => {
        const itemMatch = newBill.items.find(
          (bi) => bi.name.toLowerCase().trim() === p.name.toLowerCase().trim()
        );
        if (itemMatch) return { ...p, stock: Math.max(0, p.stock - itemMatch.qty) };
        return p;
      })
    );

    setBills((prev) => [newBill, ...prev]);
    setActiveBillToTake(newBill);
    try {
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
    } catch {
      /* ignore */
    }
    addToast(`Bill #${billNum} generated!`, 'success');
    return newBill;
  };

  const deleteBill = async (billId: string) => {
    if (getToken() && authRole === 'admin' && !usingMockCatalog) {
      try {
        await api(`/bills/${billId}`, { method: 'DELETE' });
      } catch (err: any) {
        addToast(err?.message || 'Could not delete bill', 'error');
        return;
      }
    }
    setBills((prev) => prev.filter((b) => b.id !== billId));
    addToast('Bill removed from archive', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        viewMode,
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
        catalogLoading,
        refreshCatalog,
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
        authRole,
        user,
        isLoginModalOpen,
        setIsLoginModalOpen,
        login,
        registerCustomer,
        logout,
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
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
