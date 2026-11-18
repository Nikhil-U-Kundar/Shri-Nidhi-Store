/** Shows which commit and build date are running, so a deploy can be verified from the page itself. */
export function BuildBadge({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-[10px] tracking-wider text-stone-400 tabular-nums ${className}`} data-testid="build-version">
      Build {__APP_BUILD__}
    </p>
  );
}
