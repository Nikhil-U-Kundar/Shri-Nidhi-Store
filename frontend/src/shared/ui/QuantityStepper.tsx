import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  quantity: number;
  itemName: string;
  onDecrement: () => void;
  onIncrement: () => void;
  size?: 'sm' | 'md';
}

const SIZE_CLASSES = {
  sm: { button: 'h-7 w-7', icon: 'h-3.5 w-3.5', count: 'min-w-6 text-xs' },
  md: { button: 'h-9 w-9', icon: 'h-4 w-4', count: 'min-w-8 text-sm' },
} as const;

export function QuantityStepper({
  quantity,
  itemName,
  onDecrement,
  onIncrement,
  size = 'sm',
}: QuantityStepperProps) {
  const classes = SIZE_CLASSES[size];
  const buttonClass = `${classes.button} flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100`;

  return (
    <div className="flex items-center justify-between gap-1 rounded-xl border border-emerald-300 bg-emerald-50 p-0.5 sm:p-1">
      <button type="button" onClick={onDecrement} className={buttonClass} aria-label={`Decrease ${itemName}`}>
        <Minus className={classes.icon} />
      </button>
      <span className={`${classes.count} text-center font-black tabular-nums text-emerald-950`}>
        {quantity}
      </span>
      <button type="button" onClick={onIncrement} className={buttonClass} aria-label={`Increase ${itemName}`}>
        <Plus className={classes.icon} />
      </button>
    </div>
  );
}
