import { useState, type FormEvent } from 'react';
import { landingImages } from '@/shared/config';
import { Modal } from '@/shared/ui/Modal';
import { ACCEPTED_IMAGE_TYPES, type Product } from '@/entities/product';
import { useProductActions } from '../model/useProductActions';

const CATEGORY_OPTIONS = [
  'Atta, Rice & Dal',
  'Cooking Oil & Ghee',
  'Spices & Masalas',
  'Dairy & Breakfast',
  'Snacks & Biscuits',
  'Household & Cleaning',
  'Personal Care',
] as const;

const INPUT_CLASS = 'w-full rounded-xl border border-stone-200 p-2.5 focus:border-emerald-600 focus:outline-none';
const LABEL_CLASS = 'mb-1 block font-semibold text-stone-700';

interface AddProductDialogProps {
  onClose: () => void;
}

export function AddProductDialog({ onClose }: AddProductDialogProps) {
  const { addProduct } = useProductActions();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0]);
  const [brand, setBrand] = useState('Fortune');
  const [unit, setUnit] = useState('1 kg');
  const [mrp, setMrp] = useState('180');
  const [salePrice, setSalePrice] = useState('155');
  const [stock, setStock] = useState('25');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    const mrpValue = parseInt(mrp, 10) || 100;
    const saleValue = parseInt(salePrice, 10) || 90;
    const discount = Math.max(0, Math.round(((mrpValue - saleValue) / mrpValue) * 100));
    const product: Product = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      category,
      brand: brand.trim(),
      unit: unit.trim(),
      price: mrpValue,
      discountPrice: saleValue,
      discount,
      stock: parseInt(stock, 10) || 20,
      rating: 4.8,
      reviewsCount: 1,
      featured: false,
      isOffer: discount > 10,
      image: landingImages.hero,
      description: 'Sourced directly from authorized wholesale Mandi distributor for Sri Nidhi Store.',
      mfg: `${brand} Ltd`,
      origin: 'India',
      expiry: '12 Months',
    };

    void addProduct(product, imageFile);
    onClose();
  };

  return (
    <Modal label="Add new kirana product" onClose={onClose}>
      <div className="p-6">
        <h3 className="mb-4 text-base font-black text-stone-900">Add New Kirana Product</h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label htmlFor="product-name" className={LABEL_CLASS}>Product Name *</label>
            <input
              id="product-name"
              type="text"
              required
              placeholder="e.g. Fortune Kachi Ghani Mustard Oil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label htmlFor="product-category" className={LABEL_CLASS}>Category</label>
              <select id="product-category" value={category} onChange={(e) => setCategory(e.target.value)} className={`${INPUT_CLASS} bg-white`}>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="product-brand" className={LABEL_CLASS}>Brand</label>
              <input id="product-brand" type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={INPUT_CLASS} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="product-unit" className={LABEL_CLASS}>Unit / Pack</label>
              <input id="product-unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label htmlFor="product-mrp" className={LABEL_CLASS}>MRP (₹)</label>
              <input id="product-mrp" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label htmlFor="product-sale" className={LABEL_CLASS}>Sale Price (₹)</label>
              <input id="product-sale" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className={INPUT_CLASS} />
            </div>
          </div>

          <div>
            <label htmlFor="product-stock" className={LABEL_CLASS}>Initial Stock (Units)</label>
            <input id="product-stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={INPUT_CLASS} />
          </div>

          <div>
            <label htmlFor="product-photo" className={LABEL_CLASS}>Product photo (optional, JPEG / PNG / WebP, max 3 MB)</label>
            <input
              id="product-photo"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-stone-200 p-2 text-xs file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:font-semibold file:text-emerald-800"
            />
          </div>

          <div className="flex gap-2 pt-3">
            <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-xl bg-stone-200 py-2.5 font-bold text-stone-700 hover:bg-stone-300">
              Cancel
            </button>
            <button type="submit" className="flex-1 cursor-pointer rounded-xl bg-emerald-700 py-2.5 font-bold text-white hover:bg-emerald-800">
              Save to Store
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
