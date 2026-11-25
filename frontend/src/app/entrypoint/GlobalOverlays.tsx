import { LoginModal } from '@/features/auth';
import { ReceiptModal } from '@/features/order-receipt';
import { TakeBillModal } from '@/features/take-bill';
import { CartDrawer } from '@/widgets/cart-drawer';
import { CheckoutModal } from '@/widgets/checkout-modal';
import { ProductQuickView } from '@/widgets/product-quick-view';
import { ToastContainer } from '@/shared/ui/toast';

/** Dialogs and drawers that can open from anywhere in the app. */
export function GlobalOverlays() {
  return (
    <>
      <CartDrawer />
      <ProductQuickView />
      <CheckoutModal />
      <ReceiptModal />
      <TakeBillModal />
      <LoginModal />
      <ToastContainer />
    </>
  );
}
