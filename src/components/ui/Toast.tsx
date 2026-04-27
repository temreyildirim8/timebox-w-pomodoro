import { useState, useEffect } from 'react';

interface ToastData {
  id: number;
  message: string;
  type: 'error' | 'success';
}

let toastId = 0;

export function showToast(message: string, type: 'error' | 'success' = 'error') {
  const id = ++toastId;
  const event = new CustomEvent('show-toast', { detail: { id, message, type } });
  window.dispatchEvent(event);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handleShowToast = (e: CustomEvent<ToastData>) => {
      const newToast = { id: e.detail.id, message: e.detail.message, type: e.detail.type };
      setToasts(prev => [...prev, newToast]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== e.detail.id));
      }, 3000);
    };

    window.addEventListener('show-toast', handleShowToast as EventListener);
    return () => window.removeEventListener('show-toast', handleShowToast as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}