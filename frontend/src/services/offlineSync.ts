/**
 * Offline synchronization service for TimeTracker
 * Handles background sync and offline data management
 */

interface OfflineEntry {
  id: string;
  data: any;
  token: string | null;
  timestamp: string;
  url: string;
  method: string;
  retryCount?: number;
}

interface OfflineData {
  key: string;
  data: any;
  timestamp: string;
}

class OfflineSyncService {
  private dbName = 'timetracker-offline';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;

  async initialize() {
    this.db = await this.openDB();
    this.setupServiceWorkerSync();
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('pending_entries')) {
          db.createObjectStore('pending_entries', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('offline_data')) {
          db.createObjectStore('offline_data', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('cached_projects')) {
          db.createObjectStore('cached_projects', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('cached_tasks')) {
          db.createObjectStore('cached_tasks', { keyPath: 'id' });
        }
      };
    });
  }

  private setupServiceWorkerSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register periodic sync for background sync
        (registration as any).sync.register('sync-time-entries');
      });
    }
  }

  async storeOfflineTimeEntry(data: any, token: string | null, url: string) {
    if (!this.db) await this.initialize();

    const entry: OfflineEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      token,
      timestamp: new Date().toISOString(),
      url,
      method: 'POST',
      retryCount: 0
    };

    const transaction = this.db!.transaction(['pending_entries'], 'readwrite');
    const store = transaction.objectStore('pending_entries');
    await store.add(entry);

    console.log('Stored offline time entry:', entry.id);
  }

  async getPendingEntries(): Promise<OfflineEntry[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_entries'], 'readonly');
      const store = transaction.objectStore('pending_entries');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingEntry(id: string) {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['pending_entries'], 'readwrite');
    const store = transaction.objectStore('pending_entries');
    await store.delete(id);
  }

  async updatePendingEntry(entry: OfflineEntry) {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['pending_entries'], 'readwrite');
    const store = transaction.objectStore('pending_entries');
    await store.put(entry);
  }

  async syncPendingEntries() {
    const pendingEntries = await this.getPendingEntries();
    const failedEntries: OfflineEntry[] = [];

    for (const entry of pendingEntries) {
      try {
        const response = await fetch(entry.url, {
          method: entry.method,
          headers: {
            'Content-Type': 'application/json',
            ...(entry.token && { 'Authorization': `Bearer ${entry.token}` })
          },
          body: JSON.stringify(entry.data)
        });

        if (response.ok) {
          await this.removePendingEntry(entry.id);
          console.log('Successfully synced entry:', entry.id);
        } else {
          entry.retryCount = (entry.retryCount || 0) + 1;
          if (entry.retryCount < 3) {
            failedEntries.push(entry);
          } else {
            await this.removePendingEntry(entry.id);
            console.warn('Max retries reached for entry:', entry.id);
          }
        }
      } catch (error) {
        entry.retryCount = (entry.retryCount || 0) + 1;
        if (entry.retryCount < 3) {
          failedEntries.push(entry);
        } else {
          await this.removePendingEntry(entry.id);
          console.error('Failed to sync entry after max retries:', entry.id, error);
        }
      }
    }

    // Update failed entries with retry count
    for (const entry of failedEntries) {
      await this.updatePendingEntry(entry);
    }

    return {
      synced: pendingEntries.length - failedEntries.length,
      failed: failedEntries.length
    };
  }

  async storeOfflineData(key: string, data: any) {
    if (!this.db) await this.initialize();

    const offlineData: OfflineData = {
      key,
      data,
      timestamp: new Date().toISOString()
    };

    const transaction = this.db!.transaction(['offline_data'], 'readwrite');
    const store = transaction.objectStore('offline_data');
    await store.put(offlineData);
  }

  async getOfflineData(key: string): Promise<any | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readonly');
      const store = transaction.objectStore('offline_data');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async cacheProjects(projects: any[]) {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['cached_projects'], 'readwrite');
    const store = transaction.objectStore('cached_projects');

    // Clear existing cache
    await store.clear();

    // Store new projects
    for (const project of projects) {
      await store.add(project);
    }
  }

  async getCachedProjects(): Promise<any[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_projects'], 'readonly');
      const store = transaction.objectStore('cached_projects');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheTasks(tasks: any[]) {
    if (!this.db) await this.initialize();

    const transaction = this.db!.transaction(['cached_tasks'], 'readwrite');
    const store = transaction.objectStore('cached_tasks');

    // Clear existing cache
    await store.clear();

    // Store new tasks
    for (const task of tasks) {
      await store.add(task);
    }
  }

  async getCachedTasks(): Promise<any[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_tasks'], 'readonly');
      const store = transaction.objectStore('cached_tasks');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  setupOnlineListener(callback: (isOnline: boolean) => void) {
    window.addEventListener('online', () => {
      callback(true);
      this.syncPendingEntries();
    });

    window.addEventListener('offline', () => {
      callback(false);
    });
  }

  async getOfflineStats() {
    const pendingEntries = await this.getPendingEntries();
    return {
      pendingEntries: pendingEntries.length,
      isOnline: this.isOnline(),
      lastSync: await this.getOfflineData('lastSyncTime')
    };
  }
}

// Export singleton instance
export const offlineSync = new OfflineSyncService();

// Initialize on module load
if (typeof window !== 'undefined') {
  offlineSync.initialize();
}

export default offlineSync;