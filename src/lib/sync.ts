import { supabase } from './supabase'
import { getPendingQueue, markQueueItemSynced } from './offline'

/**
 * Syncs all pending offline test results and progress updates
 * to Supabase when the user comes back online.
 * Call this once on app mount.
 */
export function initOfflineSync() {
  if (typeof window === 'undefined') return

  // Sync when the page loads (in case they were offline before)
  if (navigator.onLine) syncPendingData()

  // Sync when connection is restored
  window.addEventListener('online', () => {
    console.log('[MSCE Prep] Back online — syncing offline data...')
    syncPendingData()
  })
}

async function syncPendingData() {
  try {
    const queue = await getPendingQueue()
    if (!queue || queue.length === 0) return

    console.log(`[MSCE Prep] Syncing ${queue.length} pending item(s)...`)

    for (const item of queue) {
      const { id, synced, ...data } = item as Record<string, any>

      // Determine the table from the data shape
      if ('test_type' in data) {
        // Test result
        const { error } = await supabase.from('test_results').insert(data)
        if (!error) await markQueueItemSynced(id)
      } else if ('is_completed' in data && 'paper_id' in data) {
        // Paper progress
        const { error } = await supabase
          .from('user_paper_progress')
          .upsert(data, { onConflict: 'user_id,paper_id' })
        if (!error) await markQueueItemSynced(id)
      }
    }

    console.log('[MSCE Prep] Offline sync complete.')
  } catch (err) {
    console.warn('[MSCE Prep] Sync failed:', err)
  }
}
