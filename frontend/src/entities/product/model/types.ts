export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  /** MRP in INR. */
  price: number;
  /** Selling price in INR. */
  discountPrice: number;
  /** Percentage off MRP. */
  discount: number;
  stock: number;
  rating: number;
  reviewsCount?: number;
  featured?: boolean;
  isOffer?: boolean;
  image: string;
  description: string;
  mfg: string;
  origin: string;
  expiry: string;
  fssaiNumber?: string;
}
