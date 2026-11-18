import { HeroBanner } from '@/widgets/hero-banner';
import { ProductCatalog } from '@/widgets/product-catalog';
import { SiteFooter } from '@/widgets/site-footer';
import { TrustStrip } from '@/widgets/trust-strip';

export function StorefrontPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <HeroBanner />
      <ProductCatalog />
      <TrustStrip />
      <SiteFooter />
    </div>
  );
}
