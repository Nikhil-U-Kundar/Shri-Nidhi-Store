export const CATALOG_SECTION_ID = 'catalog';

/** Smoothly scroll the product catalog into view, if it is on the page. */
export function scrollToCatalog(): void {
  document.getElementById(CATALOG_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
