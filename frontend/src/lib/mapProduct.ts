import type { Product } from '../types';

/** Map backend catalog product → proto Product shape */
export function mapApiProduct(p: any): Product {
  const selling = Number(p.sellingPrice ?? p.discountPrice ?? 0);
  const mrp = Number(p.mrp ?? p.price ?? selling);
  const discount =
    p.discount != null
      ? Number(p.discount)
      : mrp > selling && mrp > 0
        ? Math.round(((mrp - selling) / mrp) * 100)
        : 0;

  return {
    id: String(p.id),
    name: p.name,
    category: p.categoryName || p.category || 'General',
    brand: p.brand || '',
    unit: p.packLabel || p.unit || '1 Piece',
    price: mrp,
    discountPrice: selling,
    discount,
    stock: Number(p.stockQuantity ?? p.stock ?? 0),
    rating: Number(p.rating ?? 4.5),
    reviewsCount: Number(p.reviewsCount ?? 0),
    featured: Boolean(p.featured),
    isOffer: Boolean(p.isOffer) || discount > 0,
    image:
      p.imageUrl ||
      p.image ||
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    description: p.description || `${p.name} from Sri Nidhi Store.`,
    mfg: p.mfg || p.brand || '',
    origin: p.origin || 'India',
    expiry: p.expiry || '',
    fssaiNumber: p.fssaiNumber || '',
  };
}

/** Map proto Product → backend admin create/update body */
export function toApiProductBody(product: Partial<Product> & { name?: string }) {
  return {
    name: product.name,
    brand: product.brand || '',
    imageUrl: product.image || '',
    packLabel: product.unit || '1 Piece',
    sellingPrice: product.discountPrice ?? product.price ?? 0,
    mrp: product.price ?? null,
    stockQuantity: product.stock ?? 0,
    isVisible: true,
    badgeText: product.isOffer ? 'Offer' : '',
    description: product.description || '',
    featured: Boolean(product.featured),
    isOffer: Boolean(product.isOffer),
    mfg: product.mfg || '',
    origin: product.origin || 'India',
    expiry: product.expiry || '',
    fssaiNumber: product.fssaiNumber || '',
  };
}
