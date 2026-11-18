/** Shows which commit and build date are running, so a deploy can be verified from the page itself. */
export function BuildBadge({ className = '' }: { className?: string }) {
  return (
    <p
      className={`text-center text-xs font-semibold tracking-wide text-stone-300 tabular-nums ${className}`}
      data-testid="build-version"
    >
      Version {__APP_BUILD__}
    </p>
  );
}
