import { APP_VERSION } from '@/version';

/** Version line shown at the bottom of every page. */
export function BuildBadge({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-xs font-semibold tracking-wide text-stone-300 ${className}`} data-testid="app-version">
      Version {APP_VERSION}
    </p>
  );
}
