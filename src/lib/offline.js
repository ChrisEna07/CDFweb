// Simple offline queue using localStorage
const QUEUE_KEY = 'supabase_offline_queue'

export const offlineQueue = {
    add: (table, action, payload) => {
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
        queue.push({ table, action, payload, timestamp: new Date().toISOString() })
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
        window.dispatchEvent(new Event('offline-queue-updated'))
    },
    
    get: () => JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'),
    
    clear: () => localStorage.removeItem(QUEUE_KEY),
    
    sync: async (supabase) => {
        const queue = offlineQueue.get()
        if (queue.length === 0) return
        
        console.log(`Sincronizando ${queue.length} acciones offline...`)
        
        for (const item of queue) {
            try {
                if (item.action === 'INSERT') {
                    await supabase.from(item.table).insert(item.payload)
                } else if (item.action === 'UPDATE') {
                    await supabase.from(item.table).update(item.payload.data).eq('id', item.payload.id)
                }
            } catch (e) {
                console.error("Error sincronizando item:", item, e)
                // En un sistema real, querríamos re-encolar o manejar el error
            }
        }
        
        offlineQueue.clear()
        window.dispatchEvent(new Event('offline-queue-updated'))
        return true
    }
}
