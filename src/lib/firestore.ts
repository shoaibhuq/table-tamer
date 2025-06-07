import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "./firebase";

// Type definitions matching your current data structure
export interface Event {
  id: string;
  name: string;
  description?: string | null;
  theme?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  guestCount?: number;
  tableCount?: number;
}

export interface Guest {
  id: string;
  name: string;
  phoneNumber?: string;
  eventId: string;
  userId: string;
  tableId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  color: string;
  eventId: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserSettings {
  userId: string;
  notifications: boolean;
  theme: "light" | "dark";
  language: string;
  updatedAt: Timestamp;
}

// Event Operations
export const eventService = {
  async getPublic(eventId: string): Promise<Event | null> {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      if (eventDoc.exists()) {
        return eventDoc.data() as Event;
      }
      return null;
    } catch (error) {
      console.error("Error in eventService.getPublic:", error);
      throw error;
    }
  },
  async create(
    userId: string,
    eventData: Omit<Event, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const eventRef = doc(collection(db, "events"));
    const event: Event = {
      id: eventRef.id,
      ...eventData,
      userId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(eventRef, event);
    return eventRef.id;
  },

  async get(userId: string, eventId: string): Promise<Event | null> {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (eventDoc.exists()) {
      const data = eventDoc.data() as Event;
      // Verify user owns this event
      if (data.userId === userId) {
        return data;
      }
    }
    return null;
  },

  async list(
    userId: string,
    pageSize = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<Event[]> {
    try {
      console.log("eventService.list called with userId:", userId);

      let q = query(
        collection(db, "events"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      console.log("Executing Firestore query for events...");
      const snapshot = await getDocs(q);
      console.log("Query completed. Found docs:", snapshot.docs.length);

      const events = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Event)
      );
      console.log("Mapped events:", events);

      return events;
    } catch (error) {
      console.error("Error in eventService.list:", error);
      throw error;
    }
  },

  async update(
    userId: string,
    eventId: string,
    updates: Partial<Omit<Event, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (eventDoc.exists() && eventDoc.data().userId === userId) {
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } else {
      throw new Error("Event not found or access denied");
    }
  },

  async delete(userId: string, eventId: string): Promise<void> {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (eventDoc.exists() && eventDoc.data().userId === userId) {
      const batch = writeBatch(db);

      // Delete the event
      batch.delete(eventRef);

      // Delete all guests for this event
      const guestsQuery = query(
        collection(db, "guests"),
        where("eventId", "==", eventId)
      );
      const guestsSnapshot = await getDocs(guestsQuery);
      guestsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete all tables for this event
      const tablesQuery = query(
        collection(db, "tables"),
        where("eventId", "==", eventId)
      );
      const tablesSnapshot = await getDocs(tablesQuery);
      tablesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      await batch.commit();
    } else {
      throw new Error("Event not found or access denied");
    }
  },

  async reset(userId: string, eventId: string): Promise<void> {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (eventDoc.exists() && eventDoc.data().userId === userId) {
      const batch = writeBatch(db);

      // Reset guest table assignments
      const guestsQuery = query(
        collection(db, "guests"),
        where("eventId", "==", eventId)
      );
      const guestsSnapshot = await getDocs(guestsQuery);
      guestsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { tableId: null, updatedAt: serverTimestamp() });
      });

      // Delete all tables for this event
      const tablesQuery = query(
        collection(db, "tables"),
        where("eventId", "==", eventId)
      );
      const tablesSnapshot = await getDocs(tablesQuery);
      tablesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      await batch.commit();
    } else {
      throw new Error("Event not found or access denied");
    }
  },
};

// Guest Operations
export const guestService = {
  async listPublic(eventId: string): Promise<Guest[]> {
    try {
      const q = query(
        collection(db, "guests"),
        where("eventId", "==", eventId),
        orderBy("name", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Guest)
      );
    } catch (error) {
      console.error("Error in guestService.listPublic:", error);
      throw error;
    }
  },
  async create(
    userId: string,
    guestData: Omit<Guest, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const guestRef = doc(collection(db, "guests"));
    const guest: Guest = {
      id: guestRef.id,
      ...guestData,
      userId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(guestRef, guest);
    return guestRef.id;
  },

  async bulkCreate(
    userId: string,
    guests: Omit<Guest, "id" | "userId" | "createdAt" | "updatedAt">[]
  ): Promise<string[]> {
    const batch = writeBatch(db);
    const ids: string[] = [];

    guests.forEach((guestData) => {
      const guestRef = doc(collection(db, "guests"));
      const guest: Guest = {
        id: guestRef.id,
        ...guestData,
        userId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      batch.set(guestRef, guest);
      ids.push(guestRef.id);
    });

    await batch.commit();
    return ids;
  },

  async list(userId: string, eventId?: string): Promise<Guest[]> {
    let q = query(collection(db, "guests"), where("userId", "==", userId));

    if (eventId) {
      q = query(q, where("eventId", "==", eventId));
    }

    q = query(q, orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Guest));
  },

  async update(
    userId: string,
    guestId: string,
    updates: Partial<Omit<Guest, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    const guestRef = doc(db, "guests", guestId);
    const guestDoc = await getDoc(guestRef);

    if (guestDoc.exists() && guestDoc.data().userId === userId) {
      // Handle undefined tableId by deleting the field
      const updateData = { ...updates, updatedAt: serverTimestamp() };
      if ("tableId" in updates && updates.tableId === undefined) {
        // Use deleteField for undefined tableId to properly remove the field
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tableId: _, ...otherUpdates } = updateData;
        await updateDoc(guestRef, {
          ...otherUpdates,
          tableId: deleteField(),
        });
      } else {
        await updateDoc(guestRef, updateData);
      }
    } else {
      throw new Error("Guest not found or access denied");
    }
  },

  async delete(userId: string, guestIds: string[]): Promise<void> {
    const batch = writeBatch(db);

    for (const guestId of guestIds) {
      const guestRef = doc(db, "guests", guestId);
      const guestDoc = await getDoc(guestRef);

      if (guestDoc.exists() && guestDoc.data().userId === userId) {
        batch.delete(guestRef);
      }
    }

    await batch.commit();
  },
};

// Table Operations
export const tableService = {
  async listPublic(eventId: string): Promise<Table[]> {
    try {
      const q = query(
        collection(db, "tables"),
        where("eventId", "==", eventId),
        orderBy("createdAt", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Table)
      );
    } catch (error) {
      console.error("Error in tableService.listPublic:", error);
      throw error;
    }
  },
  async create(
    userId: string,
    tableData: Omit<Table, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const tableRef = doc(collection(db, "tables"));
    const table: Table = {
      id: tableRef.id,
      ...tableData,
      userId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(tableRef, table);
    return tableRef.id;
  },

  async list(userId: string, eventId: string): Promise<Table[]> {
    const q = query(
      collection(db, "tables"),
      where("userId", "==", userId),
      where("eventId", "==", eventId),
      orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Table));
  },

  async update(
    userId: string,
    tableId: string,
    updates: Partial<Omit<Table, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    const tableRef = doc(db, "tables", tableId);
    const tableDoc = await getDoc(tableRef);

    if (tableDoc.exists() && tableDoc.data().userId === userId) {
      await updateDoc(tableRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } else {
      throw new Error("Table not found or access denied");
    }
  },

  async delete(userId: string, tableIds: string[]): Promise<void> {
    const batch = writeBatch(db);

    for (const tableId of tableIds) {
      const tableRef = doc(db, "tables", tableId);
      const tableDoc = await getDoc(tableRef);

      if (tableDoc.exists() && tableDoc.data().userId === userId) {
        batch.delete(tableRef);

        // Also remove table assignments from guests
        const guestsQuery = query(
          collection(db, "guests"),
          where("tableId", "==", tableId)
        );
        const guestsSnapshot = await getDocs(guestsQuery);
        guestsSnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {
            tableId: null,
            updatedAt: serverTimestamp(),
          });
        });
      }
    }

    await batch.commit();
  },
};

// User Settings Operations
export const settingsService = {
  async get(userId: string): Promise<UserSettings | null> {
    const settingsDoc = await getDoc(doc(db, "userSettings", userId));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as UserSettings;
    }
    return null;
  },

  async update(
    userId: string,
    settings: Partial<Omit<UserSettings, "userId">>
  ): Promise<void> {
    const settingsRef = doc(db, "userSettings", userId);
    await setDoc(
      settingsRef,
      {
        userId,
        ...settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },
};
