import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopControllerBar } from './components/TopControllerBar';
import { Navbar } from './components/Navbar';
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
import { BillingCounterView } from './components/BillingCounterView';
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
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Prototype Environment Controller Bar */}
      <TopControllerBar />

      {viewMode === 'admin' ? (
        <AdminDashboard />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Customer Top Bar */}
          <Navbar />

          {/* Quick Categories Navigation Strip */}
          <CategoryNav />

          {/* Dynamic Customer Page Views */}
          <main className="flex-1">
            {customerTab === 'home' && <StorefrontView />}
            {customerTab === 'deals' && <DealsView />}
            {customerTab === 'billing' && <BillingCounterView />}
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
