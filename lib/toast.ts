export let pendingToast: string | null = null;

export function setPendingToast(msg: string) {
  pendingToast = msg;
}

export function consumePendingToast(): string | null {
  const msg = pendingToast;
  pendingToast = null;
  return msg;
}
