import { APP_VERSION, BUILD_LABEL } from '@/version';

/** Version line shown at the bottom of every page. */
export function BuildBadge({ className = '' }: { className?: string }) {
  return (
    <p
      className={`text-center text-xs font-semibold tracking-wide text-stone-300 tabular-nums ${className}`}
      data-testid="build-version"
    >
      Version {APP_VERSION} · build {BUILD_LABEL}
    </p>
  );
}
