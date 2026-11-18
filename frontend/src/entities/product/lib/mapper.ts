import { fallbackProductImage } from '@/shared/config/images';
import type { Product } from '../model/types';

/** Shape of a product row as returned by the Sri Nidhi API. */
export interface ApiProduct {
  id: number | string;
  name: string;
  brand?: string | null;
  category?: string | null;
  categoryName?: string | null;
  unit?: string | null;
  packLabel?: string | null;
  price?: number | string | null;
  mrp?: number | string | null;
  discountPrice?: number | string | null;
  sellingPrice?: number | string | null;
  discount?: number | string | null;
  stock?: number | string | null;
  stockQuantity?: number | string | null;
  rating?: number | string | null;
  reviewsCount?: number | string | null;
  featured?: boolean;
  isOffer?: boolean;
  image?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  mfg?: string | null;
  origin?: string | null;
  expiry?: string | null;
  fssaiNumber?: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

/** Uploaded photos come back as /api/... paths; make them absolute so they load from the deployed site. */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith('/api/') ? `${API_BASE}${url}` : url;
}

/** Convert an API product into the storefront's Product shape. */
export function mapApiProduct(p: ApiProduct): Product {
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
    image: resolveImageUrl(p.imageUrl || p.image) || fallbackProductImage,
    description: p.description || `${p.name} from Sri Nidhi Store.`,
    mfg: p.mfg || p.brand || '',
    origin: p.origin || 'India',
    expiry: p.expiry || '',
    fssaiNumber: p.fssaiNumber || '',
  };
}

/** Request body for creating a product in the admin catalog. */
export function toApiProductBody(product: Partial<Product>): Record<string, unknown> {
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

/** Request body for a partial update; only the fields the caller supplied are sent. */
export function toApiProductPatch(updates: Partial<Product>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.brand !== undefined) body.brand = updates.brand;
  if (updates.image !== undefined) body.imageUrl = updates.image;
  if (updates.unit !== undefined) body.packLabel = updates.unit;
  if (updates.discountPrice !== undefined) body.sellingPrice = updates.discountPrice;
  if (updates.price !== undefined) body.mrp = updates.price;
  if (updates.stock !== undefined) body.stockQuantity = updates.stock;
  if (updates.description !== undefined) body.description = updates.description;
  return body;
}
