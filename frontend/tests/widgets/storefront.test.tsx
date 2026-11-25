import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCatalog } from '@/entities/product';
import { useNavigation } from '@/shared/lib/navigation';
import { CartDrawer } from '@/widgets/cart-drawer';
import { CategoryNav } from '@/widgets/category-nav';
import { HeroBanner } from '@/widgets/hero-banner';
import { ProductCatalog } from '@/widgets/product-catalog';
import { ProductGrid } from '@/widgets/product-catalog/ui/ProductGrid';
import { ProductQuickView } from '@/widgets/product-quick-view';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';
import { MobileMenu } from '@/widgets/site-header/ui/MobileMenu';
import { UserMenu } from '@/widgets/site-header/ui/UserMenu';
import { TrustStrip } from '@/widgets/trust-strip';
import { apiProduct, product, renderApp } from '../helpers';

const catalog = { 'GET /products': { products: [apiProduct()] } };
const inCart = [{ ...product(), qty: 1 }];

function Probe() {
  const { selectedCategory, quickViewProduct } = useCatalog();
  const { isCartOpen, isCheckoutOpen, setCartOpen } = useNavigation();
  return (
    <>
      <button onClick={() => setCartOpen(true)}>show-cart</button>
      <output>
        {`category=${selectedCategory};quick=${quickViewProduct?.name ?? ''};cart=${isCartOpen};checkout=${isCheckoutOpen}`}
      </output>
    </>
  );
}
const state = () => screen.getByRole('status').textContent;

describe('CartDrawer', () => {
  const view = (cart: unknown[]) =>
    renderApp(
      <>
        <Probe />
        <CartDrawer />
      </>,
      { cart }
    );

  it('stays closed until asked, then shows totals and moves to checkout', async () => {
    const { user } = view(inCart);
    expect(screen.queryByText('Your Grocery Basket')).toBeNull();
    await user.click(screen.getByText('show-cart'));
    expect(screen.getByText('Your Grocery Basket')).toBeTruthy();
    expect(screen.getByText('₹40')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Proceed to Express Checkout/ }));
    expect(state()).toContain('cart=false;checkout=true');
  });

  it('shows an empty basket', async () => {
    const { user } = view([]);
    await user.click(screen.getByText('show-cart'));
    expect(screen.getByText('Your basket is empty')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Close cart' }));
    expect(screen.queryByText('Your basket is empty')).toBeNull();
  });
});

describe('catalog widgets', () => {
  it('CategoryNav selects a category and returns home', async () => {
    const { user } = renderApp(
      <>
        <Probe />
        <CategoryNav />
      </>,
      { path: '/deals', routes: catalog }
    );
    const nav = screen.getByRole('navigation', { name: 'Grocery categories' });
    await user.click(await within(nav).findByRole('button', { name: /Atta, Rice & Dal/ }));
    expect(state()).toContain('category=Atta, Rice & Dal');
    expect(window.location.pathname).toBe('/');
  });

  it('ProductCatalog lists products and sorts', async () => {
    renderApp(<ProductCatalog />, { routes: catalog });
    expect(await screen.findByRole('heading', { name: 'Test Atta' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Sort by:'), { target: { value: 'price-low' } });
    expect((screen.getByLabelText('Sort by:') as HTMLSelectElement).value).toBe('price-low');
  });

  it('ProductGrid opens the quick view', async () => {
    const { user } = renderApp(
      <>
        <Probe />
        <ProductGrid products={[product()]} />
      </>
    );
    await user.click(screen.getByRole('button', { name: 'Quick view Test Atta' }));
    expect(state()).toContain('quick=Test Atta');
  });

  it('ProductQuickView shows details, adds to cart and closes', async () => {
    const { user } = renderApp(
      <>
        <ProductGrid products={[product()]} />
        <ProductQuickView />
      </>
    );
    await user.click(screen.getByRole('button', { name: 'Quick view Test Atta' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Fresh atta')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: /Add/ }));
    await waitFor(() => expect(localStorage.getItem('sri_nidhi_cart')).toContain('p1'));
    await user.click(within(dialog).getByRole('button', { name: 'Close product details' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('landing widgets', () => {
  it('HeroBanner links to deals', async () => {
    const { user } = renderApp(<HeroBanner />);
    await user.click(screen.getByRole('button', { name: /View Weekend Offers/ }));
    expect(window.location.pathname).toBe('/deals');
  });

  it('TrustStrip lists the store promises', () => {
    renderApp(<TrustStrip />);
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(1);
  });

  it('SiteFooter filters by category', async () => {
    const { user } = renderApp(
      <>
        <Probe />
        <SiteFooter />
      </>
    );
    const button = within(screen.getByRole('navigation', { name: 'Footer categories' })).getAllByRole('button')[0];
    await user.click(button);
    expect(state()).not.toContain('category=All Products');
  });
});

describe('site header', () => {
  it('shows the cart count, opens deals and the cart', async () => {
    const { user } = renderApp(
      <>
        <Probe />
        <SiteHeader />
      </>,
      { cart: inCart }
    );
    await user.click(screen.getByRole('button', { name: 'Cart with 1 items' }));
    expect(state()).toContain('cart=true');
    await user.click(screen.getByRole('button', { name: /Weekend Deals/ }));
    expect(window.location.pathname).toBe('/deals');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('navigation', { name: 'Main menu' })).toBeTruthy();
  });

  it('MobileMenu navigates to pages by URL', async () => {
    const onClose = vi.fn();
    const { user } = renderApp(<MobileMenu onClose={onClose} />, { role: 'customer' });
    await user.click(screen.getByRole('button', { name: /Track Order/ }));
    expect(window.location.pathname).toBe('/orders');
    await user.click(screen.getByRole('button', { name: /My Orders/ }));
    expect(window.location.pathname).toBe('/account/orders');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('UserMenu offers sign in to guests', () => {
    renderApp(<UserMenu />);
    expect(screen.getByText('Guest')).toBeTruthy();
  });

  it('UserMenu opens account sections and signs out', async () => {
    const { user } = renderApp(<UserMenu />, { role: 'customer' });
    await user.click(await screen.findByRole('button', { name: /Welcome,/ }));
    await user.click(screen.getByText('Kirana Khata Ledger'));
    expect(window.location.pathname).toBe('/account/khata');
    await user.click(screen.getByRole('button', { name: /Welcome,/ }));
    await user.click(screen.getByText('Sign Out'));
    expect(localStorage.getItem('sns_token')).toBeNull();
  });
});
