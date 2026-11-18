import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Address } from '@/entities/user';
import { STORE } from '@/shared/config/store';
import { useAddressActions } from '../model/useAddressActions';

const ADDRESS_TITLES = ['Home', 'Office', 'Parents'] as const;

interface NewAddressFormProps {
  defaultTitle: string;
  onSaved: (address: Address) => void;
  onCancel: () => void;
  /** Show the optional landmark field (used at checkout). */
  withLandmark?: boolean;
  submitLabel?: string;
}

export function NewAddressForm({
  defaultTitle,
  onSaved,
  onCancel,
  withLandmark = false,
  submitLabel = 'Save Address',
}: NewAddressFormProps) {
  const { addAddress } = useAddressActions();
  const [title, setTitle] = useState(defaultTitle);
  const [text, setText] = useState('');
  const [landmark, setLandmark] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    const saved = await addAddress({
      title,
      text: text.trim(),
      landmark: landmark.trim(),
      pincode: STORE.pincode,
      isDefault: false,
    });
    if (saved) onSaved(saved);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs">
      <div className="flex items-center justify-between font-bold text-stone-900">
        <span>New Delivery Location</span>
        <button type="button" onClick={onCancel} className="cursor-pointer p-1 text-stone-400 hover:text-stone-600" aria-label="Cancel new address">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ADDRESS_TITLES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTitle(option)}
            className={`cursor-pointer rounded-lg border py-1.5 text-center font-semibold ${
              title === option ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="address-text" className="mb-1 block font-medium text-stone-600">Street Address, Flat / House No *</label>
        <textarea
          id="address-text"
          required
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Flat 104, Tower B, Belapu, industrial Area"
          className="w-full rounded-xl border border-stone-200 bg-white p-2.5 focus:border-emerald-600 focus:outline-none"
        />
      </div>

      {withLandmark && (
        <div>
          <label htmlFor="address-landmark" className="mb-1 block font-medium text-stone-600">Nearby Landmark (Optional)</label>
          <input
            id="address-landmark"
            type="text"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="e.g. Opposite Main Market SBI Branch"
            className="w-full rounded-xl border border-stone-200 bg-white p-2.5 focus:border-emerald-600 focus:outline-none"
          />
        </div>
      )}

      <button type="submit" className="w-full cursor-pointer rounded-xl bg-emerald-700 py-2.5 font-bold text-white hover:bg-emerald-800">
        {submitLabel}
      </button>
    </form>
  );
}
