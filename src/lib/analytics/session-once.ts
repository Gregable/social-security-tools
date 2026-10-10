/**
 * Returns true the first time it is called for `key` in this tab's session
 * (sessionStorage: one per tab, kept across reloads), false afterwards. Used
 * to send an analytics event once per session rather than once per mount.
 *
 * If storage is unavailable (blocked, or full) it returns true, so the event
 * may be counted again rather than lost or crashing the component.
 */
export function claimOncePerSession(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  key: string
): boolean {
  try {
    if (storage.getItem(key) === 'true') return false;
    storage.setItem(key, 'true');
    return true;
  } catch {
    return true;
  }
}
