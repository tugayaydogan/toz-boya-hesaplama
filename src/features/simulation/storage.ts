import type { CompletedJobRecord } from "./types";

const DATABASE_NAME = "industrial-weighing-simulator";

const DATABASE_VERSION = 1;

const STORE_NAME = "completedJobs";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });

        store.createIndex("completedAt", "completedAt", {
          unique: false,
        });

        store.createIndex("workOrderNo", "workOrderNo", {
          unique: false,
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveCompletedJob(job: CompletedJobRecord): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

    store.put(job);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();

      reject(transaction.error);
    };
  });
}

export async function getCompletedJobs(): Promise<CompletedJobRecord[]> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");

    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      const jobs = request.result as CompletedJobRecord[];

      /*
            En yeni kayıt en üstte.
          */
      jobs.sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      );

      database.close();

      resolve(jobs);
    };

    request.onerror = () => {
      database.close();

      reject(request.error);
    };
  });
}

export async function clearCompletedJobs(): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

    store.clear();

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();

      reject(transaction.error);
    };
  });
}
