/** File bytes stay in IndexedDB; request metadata stays in the existing store. */
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open('anumat-attachment-files', 1);
    opening.onupgradeneeded = () => opening.result.createObjectStore('files');
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
    opening.onblocked = () => reject(new Error('Attachment storage is unavailable'));
  });
}

export async function saveAttachmentFile(file: File): Promise<string> {
  const db = await database();
  const id = crypto.randomUUID();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    return id;
  } finally { db.close(); }
}

export async function loadAttachmentFile(id: string): Promise<Blob | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const reading = db.transaction('files').objectStore('files').get(id);
      reading.onsuccess = () => resolve(reading.result instanceof Blob ? reading.result : undefined);
      reading.onerror = () => reject(reading.error);
    });
  } finally { db.close(); }
}
