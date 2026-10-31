import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { CategoryNav } from './components/CategoryNav';
import { StorefrontView } from './components/StorefrontView';
import { DealsView } from './components/DealsView';
import { AccountView } from './components/AccountView';
import { OrderTrackingView } from './components/OrderTrackingView';
import { CartDrawer } from './components/CartDrawer';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { CheckoutModal } from './components/CheckoutModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { AdminDashboard } from './components/AdminDashboard';
import { SeoModal } from './components/SeoModal';
import { PrintReceiptModal } from './components/PrintReceiptModal';
import { TakeBillModal } from './components/TakeBillModal';
import { ToastContainer } from './components/ToastContainer';

const MainLayout: React.FC = () => {
  const { viewMode, customerTab } = useApp();

  // Payment gateway simulation trigger
  const [gatewayOrderParams, setGatewayOrderParams] = useState<{
    deliveryAddress: string;
    deliveryMode: string;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
    amount: number;
  } | null>(null);

  const [isRetryingPayment, setIsRetryingPayment] = useState(false);

  return (
    <div className="min-h-screen min-w-0 max-w-full overflow-x-hidden flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-emerald-600 selection:text-white">
      {viewMode === 'admin' ? (
        <AdminDashboard />
      ) : (
        <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
          <Navbar />
          <CategoryNav />
          <main className="flex-1">
            {customerTab === 'home' && <StorefrontView />}
            {customerTab === 'deals' && <DealsView />}
            {customerTab === 'account' && <AccountView />}
            {customerTab === 'tracking' && <OrderTrackingView />}
          </main>
        </div>
      )}

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <ProductQuickViewModal />
      <CheckoutModal
        onTriggerPaymentGateway={(params) => setGatewayOrderParams(params)}
      />
      <PaymentGatewayModal
        orderParams={gatewayOrderParams}
        onClose={() => setGatewayOrderParams(null)}
        onSuccess={() => setGatewayOrderParams(null)}
        onRetry={() => {
          setGatewayOrderParams(null);
          setIsRetryingPayment(true);
        }}
      />
      <PrintReceiptModal />
      <TakeBillModal />
      <LoginModal />
      <SeoModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
