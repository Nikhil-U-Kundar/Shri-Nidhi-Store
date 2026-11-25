import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/entities/user';
import { NewAddressForm, useAddressActions } from '@/features/address-book';

export function AddressesSection() {
  const { user } = useAuth();
  const { removeAddress } = useAddressActions();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-stone-900">Saved Addresses</h3>
          <p className="text-xs text-stone-500">Manage local addresses in Sector 14</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Address</span>
          </button>
        )}
      </div>

      {showForm && (
        <NewAddressForm
          defaultTitle="Office"
          submitLabel="Save Address"
          onCancel={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
          withLandmark
        />
      )}

      {user.addresses.length === 0 && !showForm && (
        <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-xs text-stone-500">
          No saved addresses yet.
        </p>
      )}

      <ul className="space-y-2.5">
        {user.addresses.map((addr) => (
          <li key={addr.id} className="flex items-start justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-xs">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-stone-900">{addr.title}</span>
                {addr.isDefault && (
                  <span className="rounded bg-emerald-100 px-1.5 py-px text-[10px] font-bold text-emerald-800">DEFAULT</span>
                )}
              </div>
              <p className="mt-1 break-words text-stone-600">{addr.text}</p>
              {addr.landmark && <p className="mt-0.5 text-[11px] text-stone-400">Landmark: {addr.landmark}</p>}
            </div>
            {user.addresses.length > 1 && (
              <button
                type="button"
                onClick={() => void removeAddress(addr.id)}
                className="shrink-0 cursor-pointer rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove ${addr.title} address`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
