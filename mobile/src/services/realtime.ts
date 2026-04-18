import api from './api';
import { useAppStore } from '../stores/appStore';

let timer: ReturnType<typeof setInterval> | null = null;

export function startRealtimePolling(role: 'WORKER' | 'LENDER' | 'ADMIN' | undefined): void {
  if (!role) return;
  if (timer) clearInterval(timer);

  timer = setInterval(async () => {
    try {
      if (role === 'WORKER') {
        const { data } = await api.get('/access/requests', { params: { status: 'PENDING' } });
        const pending = (data?.data || []).length;
        if (pending > 0) {
          useAppStore.getState().addNotification({
            title: 'Access request update',
            message: `${pending} pending lender request(s)`,
          });
        }
      }

      if (role === 'LENDER') {
        const { data } = await api.get('/verify/lender/dashboard');
        const pending = data?.data?.stats?.pendingRequests || 0;
        if (pending > 0) {
          useAppStore.getState().addNotification({
            title: 'Lender queue',
            message: `${pending} worker request(s) pending`,
          });
        }
      }

      if (role === 'ADMIN') {
        const { data } = await api.get('/verify/admin/health');
        const pendingLenders = data?.data?.users?.pendingLenders || 0;
        if (pendingLenders > 0) {
          useAppStore.getState().addNotification({
            title: 'Admin approval needed',
            message: `${pendingLenders} lender profile(s) pending approval`,
          });
        }
      }
    } catch (_error) {
      // Silent fail for background polling.
    }
  }, 30000);
}

export function stopRealtimePolling(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
