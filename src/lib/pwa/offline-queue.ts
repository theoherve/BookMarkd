import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { OfflineAction } from "@/types/offline-actions";

const DB_NAME = "bookmarkd-offline";
const DB_VERSION = 1;
const STORE_NAME = "actions";

interface OfflineDB extends DBSchema {
  actions: {
    key: string;
    value: OfflineAction;
    indexes: { createdAt: number };
  };
}

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

const getDB = async (): Promise<IDBPDatabase<OfflineDB>> => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
      });
      store.createIndex("createdAt", "createdAt");
    },
  });

  return dbInstance;
};

export const addOfflineAction = async (
  action: Omit<OfflineAction, "id" | "createdAt" | "retries">,
): Promise<string> => {
  const db = await getDB();
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const fullAction: OfflineAction = {
    ...action,
    id,
    createdAt: Date.now(),
    retries: 0,
  };

  await db.add(STORE_NAME, fullAction);
  return id;
};

export const getPendingActions = async (): Promise<OfflineAction[]> => {
  const db = await getDB();
  const index = db.transaction(STORE_NAME).store.index("createdAt");
  return await index.getAll();
};

export const deleteOfflineAction = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
};

export const updateOfflineAction = async (
  id: string,
  updates: Partial<Pick<OfflineAction, "retries" | "lastError">>,
): Promise<void> => {
  const db = await getDB();
  const action = await db.get(STORE_NAME, id);
  if (!action) {
    return;
  }

  await db.put(STORE_NAME, {
    ...action,
    ...updates,
  });
};

export const clearOfflineActions = async (): Promise<void> => {
  const db = await getDB();
  await db.clear(STORE_NAME);
};

