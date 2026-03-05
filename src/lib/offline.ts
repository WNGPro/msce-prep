import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'msce-prep-offline'
const DB_VERSION = 1

let db: IDBPDatabase | null = null

export async function getDB() {
  if (db) return db
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Offline papers
      if (!database.objectStoreNames.contains('papers')) {
        database.createObjectStore('papers', { keyPath: 'id' })
      }
      // Cached paper files (blobs)
      if (!database.objectStoreNames.contains('paper-files')) {
        database.createObjectStore('paper-files', { keyPath: 'id' })
      }
      // User progress (for sync queue)
      if (!database.objectStoreNames.contains('progress-queue')) {
        const store = database.createObjectStore('progress-queue', { keyPath: 'id', autoIncrement: true })
        store.createIndex('synced', 'synced')
      }
      // Local flashcards
      if (!database.objectStoreNames.contains('flashcards')) {
        database.createObjectStore('flashcards', { keyPath: 'id' })
      }
      // Local exercises
      if (!database.objectStoreNames.contains('exercises')) {
        database.createObjectStore('exercises', { keyPath: 'id' })
      }
      // Test results queue
      if (!database.objectStoreNames.contains('test-queue')) {
        database.createObjectStore('test-queue', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
  return db
}

// ─── Papers ────────────────────────────────────────────────────────────────

export async function savePaperOffline(paper: Record<string, unknown>) {
  const db = await getDB()
  await db.put('papers', paper)
}

export async function getOfflinePapers() {
  const db = await getDB()
  return db.getAll('papers')
}

export async function removePaperOffline(id: string) {
  const db = await getDB()
  await db.delete('papers', id)
}

export async function isPaperSavedOffline(id: string): Promise<boolean> {
  const db = await getDB()
  const paper = await db.get('papers', id)
  return !!paper
}

// ─── Progress Queue (offline sync) ─────────────────────────────────────────

export async function queueProgressUpdate(data: Record<string, unknown>) {
  const db = await getDB()
  await db.add('progress-queue', { ...data, synced: false, created_at: new Date().toISOString() })
}

export async function getPendingQueue() {
  const db = await getDB()
  const all = await db.getAll('progress-queue')
  return all.filter(item => !item.synced)
}

export async function markQueueItemSynced(id: number) {
  const db = await getDB()
  const item = await db.get('progress-queue', id)
  if (item) await db.put('progress-queue', { ...item, synced: true })
}

// ─── Flashcards (offline) ──────────────────────────────────────────────────

export async function saveFlashcardOffline(flashcard: Record<string, unknown>) {
  const db = await getDB()
  await db.put('flashcards', flashcard)
}

export async function getOfflineFlashcards() {
  const db = await getDB()
  return db.getAll('flashcards')
}

// ─── Exercises (offline) ──────────────────────────────────────────────────

export async function saveExerciseOffline(exercise: Record<string, unknown>) {
  const db = await getDB()
  await db.put('exercises', exercise)
}

export async function getOfflineExercises() {
  const db = await getDB()
  return db.getAll('exercises')
}
