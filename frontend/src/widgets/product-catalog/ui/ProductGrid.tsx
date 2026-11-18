import { AddToCartControl } from '@/features/cart-actions';
import { ProductCard, useCatalog, type Product } from '@/entities/product';

interface ProductGridProps {
  products: Product[];
}

/** Responsive product grid: 2 columns on phones, up to 5 on large screens. */
export function ProductGrid({ products }: ProductGridProps) {
  const { setQuickViewProduct } = useCatalog();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onOpen={() => setQuickViewProduct(product)}
          action={<AddToCartControl product={product} />}
        />
      ))}
    </div>
  );
}
