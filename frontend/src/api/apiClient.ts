import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useSalesStore } from '../store/useSalesStore';

// Dynamic API URL matching NestJS port 3000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout for cold-start on free tier
});

// Interceptor to inject JWT token dynamically from Zustand store
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Sync offline sales to the backend database
export async function syncOfflineSales() {
  const { offlineSalesQueue, clearOfflineSalesQueue } = useSalesStore.getState();
  const { isOffline } = useAuthStore.getState();

  if (isOffline || offlineSalesQueue.length === 0) return;

  console.log(`🔄 Syncing ${offlineSalesQueue.length} offline sales to server...`);
  
  try {
    for (const sale of offlineSalesQueue) {
      await apiClient.post('/sales/offline', {
        customerId: sale.customerId,
        items: sale.items.map((i) => ({
          productId: i.productId,
          batchId: i.batchId,
          qty: i.qty,
          price: i.price,
        })),
        total: sale.total,
        paid: sale.paid,
        createdAt: sale.createdAt,
      });
    }

    clearOfflineSalesQueue();
    console.log('✅ Offline sales synced successfully!');
  } catch (error) {
    console.error('❌ Failed to sync some offline sales:', error);
  }
}

// Automatically sync when browser comes back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineSales();
  });
}
