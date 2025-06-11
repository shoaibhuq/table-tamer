import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface ActivityEvent {
  type:
    | "event_created"
    | "event_deleted"
    | "event_updated"
    | "guests_imported"
    | "tables_assigned"
    | "event_completed"
    | "table_created"
    | "tables_created"
    | "guest_added"
    | "guest_deleted"
    | "table_deleted"
    | "tables_deleted"
    | "profile_updated";
  title: string;
  description: string;
  eventId?: string;
  eventName?: string;
  metadata?: Record<string, unknown>;
}

export class AnalyticsService {
  /**
   * Log an activity event to Firestore
   */
  static async logActivity(
    userId: string,
    activity: ActivityEvent
  ): Promise<void> {
    try {
      await addDoc(collection(db, "activity"), {
        ...activity,
        userId,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
      // Don't throw error - analytics shouldn't break the app
    }
  }

  /**
   * Log event creation
   */
  static async logEventCreated(
    userId: string,
    eventId: string,
    eventName: string
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "event_created",
      title: `Created event "${eventName}"`,
      description: "New event created successfully",
      eventId,
      eventName,
      metadata: {
        action: "create",
        resource: "event",
      },
    });
  }

  /**
   * Log guest import
   */
  static async logGuestsImported(
    userId: string,
    eventId: string,
    eventName: string,
    guestCount: number
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "guests_imported",
      title: `Imported ${guestCount} guests`,
      description: `Successfully imported ${guestCount} guests to "${eventName}"`,
      eventId,
      eventName,
      metadata: {
        action: "import",
        resource: "guests",
        count: guestCount,
      },
    });
  }

  /**
   * Log table assignment
   */
  static async logTablesAssigned(
    userId: string,
    eventId: string,
    eventName: string,
    tableCount: number,
    guestCount: number
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "tables_assigned",
      title: `Assigned ${guestCount} guests to ${tableCount} tables`,
      description: `Table assignments completed for "${eventName}"`,
      eventId,
      eventName,
      metadata: {
        action: "assign",
        resource: "tables",
        tableCount,
        guestCount,
      },
    });
  }

  /**
   * Log event completion
   */
  static async logEventCompleted(
    userId: string,
    eventId: string,
    eventName: string
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "event_completed",
      title: `Completed event "${eventName}"`,
      description: "All guests assigned and event finalized",
      eventId,
      eventName,
      metadata: {
        action: "complete",
        resource: "event",
      },
    });
  }

  /**
   * Log table creation
   */
  static async logTableCreated(
    userId: string,
    eventId: string,
    eventName: string,
    tableName: string
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "table_created",
      title: `Created table "${tableName}"`,
      description: `New table added to "${eventName}"`,
      eventId,
      eventName,
      metadata: {
        action: "create",
        resource: "table",
        tableName,
      },
    });
  }

  /**
   * Log guest addition
   */
  static async logGuestAdded(
    userId: string,
    eventId: string,
    eventName: string,
    guestName: string
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "guest_added",
      title: `Added guest "${guestName}"`,
      description: `New guest added to "${eventName}"`,
      eventId,
      eventName,
      metadata: {
        action: "create",
        resource: "guest",
        guestName,
      },
    });
  }

  /**
   * Log guest deletion
   */
  static async logGuestDeleted(
    userId: string,
    eventId: string,
    eventName: string,
    guestName: string
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "guest_deleted",
      title: `Removed guest "${guestName}"`,
      description: `Guest removed from "${eventName}"`,
      eventId,
      eventName,
      metadata: {
        action: "delete",
        resource: "guest",
        guestName,
      },
    });
  }

  /**
   * Log table deletion
   */
  static async logTableDeleted(
    userId: string,
    eventId: string,
    eventName: string,
    tableName: string
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "table_deleted",
      title: `Deleted table "${tableName}"`,
      description: `Table removed from "${eventName}"`,
      eventId,
      eventName,
      metadata: {
        action: "delete",
        resource: "table",
        tableName,
      },
    });
  }

  /**
   * Log event deletion
   */
  static async logEventDeleted(
    userId: string,
    eventId: string,
    eventName: string
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "event_deleted",
      title: `Deleted event "${eventName}"`,
      description: "Event permanently removed",
      eventId,
      eventName,
      metadata: {
        action: "delete",
        resource: "event",
      },
    });
  }

  /**
   * Log event update
   */
  static async logEventUpdated(
    userId: string,
    eventId: string,
    eventName: string,
    changes: string[]
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "event_updated",
      title: `Updated event "${eventName}"`,
      description: `Modified: ${changes.join(", ")}`,
      eventId,
      eventName,
      metadata: {
        action: "update",
        resource: "event",
        changes,
      },
    });
  }

  /**
   * Log multiple tables creation
   */
  static async logTablesCreated(
    userId: string,
    eventId: string,
    eventName: string,
    tableCount: number
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "tables_created",
      title: `Created ${tableCount} tables`,
      description: `Generated ${tableCount} tables for "${eventName}"`,
      eventId,
      eventName,
      metadata: {
        action: "create",
        resource: "tables",
        count: tableCount,
      },
    });
  }

  /**
   * Log multiple tables deletion
   */
  static async logTablesDeleted(
    userId: string,
    eventId: string,
    eventName: string,
    tableCount: number
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "tables_deleted",
      title: `Deleted ${tableCount} tables`,
      description: `Removed ${tableCount} tables from "${eventName}"`,
      eventId,
      eventName,
      metadata: {
        action: "delete",
        resource: "tables",
        count: tableCount,
      },
    });
  }

  /**
   * Log profile update
   */
  static async logProfileUpdated(
    userId: string,
    changes: string[]
  ): Promise<void> {
    await this.logActivity(userId, {
      type: "profile_updated",
      title: "Updated profile settings",
      description: `Modified: ${changes.join(", ")}`,
      metadata: {
        action: "update",
        resource: "profile",
        changes,
      },
    });
  }
}

// Export convenience methods with proper binding
export const logEventCreated = (
  userId: string,
  eventId: string,
  eventName: string
) => AnalyticsService.logEventCreated(userId, eventId, eventName);

export const logEventDeleted = (
  userId: string,
  eventId: string,
  eventName: string
) => AnalyticsService.logEventDeleted(userId, eventId, eventName);

export const logEventUpdated = (
  userId: string,
  eventId: string,
  eventName: string,
  changes: string[]
) => AnalyticsService.logEventUpdated(userId, eventId, eventName, changes);

export const logGuestsImported = (
  userId: string,
  eventId: string,
  eventName: string,
  guestCount: number
) => AnalyticsService.logGuestsImported(userId, eventId, eventName, guestCount);

export const logTablesAssigned = (
  userId: string,
  eventId: string,
  eventName: string,
  tableCount: number,
  guestCount: number
) =>
  AnalyticsService.logTablesAssigned(
    userId,
    eventId,
    eventName,
    tableCount,
    guestCount
  );

export const logEventCompleted = (
  userId: string,
  eventId: string,
  eventName: string
) => AnalyticsService.logEventCompleted(userId, eventId, eventName);

export const logTableCreated = (
  userId: string,
  eventId: string,
  eventName: string,
  tableName: string
) => AnalyticsService.logTableCreated(userId, eventId, eventName, tableName);

export const logTablesCreated = (
  userId: string,
  eventId: string,
  eventName: string,
  tableCount: number
) => AnalyticsService.logTablesCreated(userId, eventId, eventName, tableCount);

export const logGuestAdded = (
  userId: string,
  eventId: string,
  eventName: string,
  guestName: string
) => AnalyticsService.logGuestAdded(userId, eventId, eventName, guestName);

export const logGuestDeleted = (
  userId: string,
  eventId: string,
  eventName: string,
  guestName: string
) => AnalyticsService.logGuestDeleted(userId, eventId, eventName, guestName);

export const logTableDeleted = (
  userId: string,
  eventId: string,
  eventName: string,
  tableName: string
) => AnalyticsService.logTableDeleted(userId, eventId, eventName, tableName);

export const logTablesDeleted = (
  userId: string,
  eventId: string,
  eventName: string,
  tableCount: number
) => AnalyticsService.logTablesDeleted(userId, eventId, eventName, tableCount);

export const logProfileUpdated = (userId: string, changes: string[]) =>
  AnalyticsService.logProfileUpdated(userId, changes);
