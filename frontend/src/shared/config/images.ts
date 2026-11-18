/** Storefront imagery served from `public/images` (copied to the dist root on build). */
export const landingImages = {
  hero: '/images/hero-store.jpg',
  atta: '/images/product-atta.jpg',
  oil: '/images/product-oil.jpg',
  spices: '/images/product-spices.jpg',
} as const;

export const fallbackProductImage = landingImages.hero;
