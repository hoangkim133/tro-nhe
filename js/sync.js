/**
 * Sync - Auto-sync with Google Sheets via Apps Script
 * Offline-first: queue changes when offline, sync when online
 */
const Sync = (() => {
    const QUEUE_KEY = 'nhatro_sync_queue';
    let isSyncing = false;

    function getScriptUrl() {
        const settings = Store.getSettings();
        return settings.scriptUrl || '';
    }

    function getSecret() {
        const settings = Store.getSettings();
        return settings.appSecret || '';
    }

    function updateSyncDot(state) {
        const dot = document.querySelector('.sync-dot');
        if (!dot) return;
        dot.className = 'sync-dot' + (state ? ' ' + state : '');
    }

    // --- Queue Management ---
    function getQueue() {
        try {
            const raw = localStorage.getItem(QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveQueue(queue) {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }

    function enqueue(data) {
        const queue = getQueue();
        // Replace last item if exists (we always sync full state)
        queue.length = 0;
        queue.push({
            data: data,
            timestamp: new Date().toISOString()
        });
        saveQueue(queue);

        // Try to sync immediately
        if (navigator.onLine) {
            processQueue();
        } else {
            updateSyncDot('offline');
        }
    }

    async function processQueue() {
        const url = getScriptUrl();
        const secret = getSecret();
        if (!url || !secret) return;

        const queue = getQueue();
        if (queue.length === 0) return;
        if (isSyncing) return;

        isSyncing = true;
        updateSyncDot('syncing');

        try {
            const item = queue[queue.length - 1]; // Latest state
            const payload = JSON.stringify({
                action: 'sync',
                secret: secret,
                data: item.data,
                timestamp: item.timestamp
            });

            // Google Apps Script redirects POST (302), which causes CORS issues
            // Solution: send as form data and follow redirects
            const response = await fetch(url, {
                method: 'POST',
                body: payload,
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                }
            });

            // If CORS blocks the redirect, try no-cors mode (fire-and-forget)
            if (!response.ok && response.type !== 'opaque') {
                throw new Error('Response not ok');
            }

            if (response.type === 'opaque') {
                // no-cors mode: assume success since we can't read the response
                saveQueue([]);
                updateSyncDot('');
            } else {
                const result = await response.json();
                if (result.success) {
                    saveQueue([]);
                    updateSyncDot('');
                } else {
                    console.error('Sync error:', result.error);
                    updateSyncDot('offline');
                }
            }
        } catch (e) {
            console.warn('Sync fetch failed, retrying with no-cors:', e.message);
            // Fallback: no-cors mode (fire and forget)
            try {
                const item = queue[queue.length - 1];
                await fetch(getScriptUrl(), {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({
                        action: 'sync',
                        secret: getSecret(),
                        data: item.data,
                        timestamp: item.timestamp
                    }),
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    }
                });
                // With no-cors we can't verify, but data likely went through
                saveQueue([]);
                updateSyncDot('');
                console.log('Sync sent (no-cors fallback)');
            } catch (e2) {
                console.error('Sync completely failed:', e2);
                updateSyncDot('offline');
            }
        } finally {
            isSyncing = false;
        }
    }

    async function restore() {
        const url = getScriptUrl();
        const secret = getSecret();
        if (!url || !secret) {
            throw new Error('Chưa cài đặt kết nối Google Sheets');
        }

        try {
            const response = await fetch(url + '?action=restore&secret=' + encodeURIComponent(secret));
            if (!response.ok) throw new Error('Lỗi kết nối');

            const result = await response.json();
            if (result.success && result.data) {
                Store.importData(result.data);
                saveQueue([]); // Clear queue after restore
                updateSyncDot('');
                return true;
            } else {
                throw new Error(result.error || 'Lỗi khôi phục dữ liệu');
            }
        } catch (e) {
            updateSyncDot('offline');
            throw e;
        }
    }

    // --- Init: listen for online/offline events ---
    function init() {
        window.addEventListener('online', () => {
            updateSyncDot('');
            processQueue();
        });

        window.addEventListener('offline', () => {
            updateSyncDot('offline');
        });

        // Initial state
        if (!navigator.onLine) {
            updateSyncDot('offline');
        } else {
            // Try to sync any pending queue
            processQueue();
        }
    }

    return { enqueue, restore, init, processQueue };
})();
