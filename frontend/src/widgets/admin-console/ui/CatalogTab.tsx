import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCatalog } from '@/entities/product';
import { LOW_STOCK_THRESHOLD } from '@/shared/config/store';
import { AddProductDialog, useProductActions } from '@/features/product-admin';

export function CatalogTab() {
  const { products } = useCatalog();
  const { updateStock, deleteProduct } = useProductActions();
  const [showAddProduct, setShowAddProduct] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-stone-900">Store Catalog Management</h3>
          <p className="text-xs text-stone-500">{products.length} products listed</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddProduct(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-800"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[600px] text-left text-xs">
          <thead className="border-b border-stone-200 bg-stone-50 text-[10px] text-stone-500 uppercase">
            <tr>
              <th scope="col" className="p-3.5">Product</th>
              <th scope="col" className="p-3.5">Category</th>
              <th scope="col" className="p-3.5">Price / MRP</th>
              <th scope="col" className="p-3.5">Stock</th>
              <th scope="col" className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.map((prod) => (
              <tr key={prod.id} className="hover:bg-stone-50/80">
                <td className="p-3.5">
                  <div className="flex items-center gap-3">
                    <img src={prod.image} alt="" className="h-9 w-9 shrink-0 rounded bg-stone-100 object-contain p-0.5" />
                    <div className="min-w-0">
                      <span className="block font-bold text-stone-900">{prod.name}</span>
                      <span className="text-[10px] text-stone-400">{prod.brand} · {prod.unit}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3.5 text-stone-600">{prod.category}</td>
                <td className="p-3.5 font-bold text-stone-900 tabular-nums">
                  ₹{prod.discountPrice}{' '}
                  <span className="text-[11px] font-normal text-stone-400 line-through">₹{prod.price}</span>{' '}
                  <span className="text-[10px] text-emerald-700">({prod.discount}% off)</span>
                </td>
                <td className="p-3.5">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-black ${
                      prod.stock <= LOW_STOCK_THRESHOLD ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {prod.stock} in stock
                  </span>
                </td>
                <td className="p-3.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      const val = window.prompt(`Update shelf stock for ${prod.name}:`, String(prod.stock));
                      if (val !== null) void updateStock(prod.id, parseInt(val, 10) || 0);
                    }}
                    className="mr-3 cursor-pointer font-bold text-stone-600 hover:text-emerald-700"
                  >
                    Edit Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove "${prod.name}" from store catalog?`)) void deleteProduct(prod.id);
                    }}
                    className="cursor-pointer font-bold text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddProduct && <AddProductDialog onClose={() => setShowAddProduct(false)} />}
    </div>
  );
}
