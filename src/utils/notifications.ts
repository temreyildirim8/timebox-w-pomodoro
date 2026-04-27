export function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied');
  }
  return Notification.requestPermission();
}

export function hasPermission(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

export function show(title: string, options?: NotificationOptions) {
  if (!hasPermission()) return;
  try {
    new Notification(title, {
      icon: '/vite.svg',
      ...options,
    });
  } catch {
    // Notification creation can fail in some browsers
  }
}
