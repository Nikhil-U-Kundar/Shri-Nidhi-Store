/** Turn a thrown value into a message for the user, falling back when it carries none. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
