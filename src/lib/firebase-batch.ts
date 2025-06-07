import { writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

interface BatchOperation {
  type: "update" | "create" | "delete";
  collection: string;
  id: string;
  data?: Record<string, unknown>;
}

interface BatchUpdateOptions {
  maxBatchSize?: number;
  delayBetweenBatches?: number;
  maxRetries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: Required<BatchUpdateOptions> = {
  maxBatchSize: 50, // Firebase Firestore limit is 500, but we use 50 for better performance
  delayBetweenBatches: 100, // 100ms delay between batches
  maxRetries: 3,
  retryDelay: 1000, // 1 second initial retry delay
};

/**
 * Sleep utility function
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Exponential backoff utility
 */
const exponentialBackoff = (attempt: number, baseDelay: number): number => {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000); // Max 10 seconds
};

/**
 * Chunked batch update with rate limiting and retry logic
 */
export async function executeBatchUpdates(
  operations: BatchOperation[],
  options: BatchUpdateOptions = {}
): Promise<{ success: boolean; errors: string[]; processedCount: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  let processedCount = 0;

  if (operations.length === 0) {
    return { success: true, errors: [], processedCount: 0 };
  }

  // Split operations into chunks
  const chunks = chunkArray(operations, opts.maxBatchSize);

  console.log(
    `Processing ${operations.length} operations in ${chunks.length} chunks`
  );

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    let retryCount = 0;
    let chunkSuccess = false;

    while (retryCount <= opts.maxRetries && !chunkSuccess) {
      try {
        if (retryCount > 0) {
          const delay = exponentialBackoff(retryCount - 1, opts.retryDelay);
          console.log(
            `Retrying chunk ${chunkIndex + 1} (attempt ${
              retryCount + 1
            }) after ${delay}ms`
          );
          await sleep(delay);
        }

        await executeChunk(chunk, chunkIndex + 1, chunks.length);
        processedCount += chunk.length;
        chunkSuccess = true;

        // Delay between chunks to avoid rate limiting
        if (chunkIndex < chunks.length - 1) {
          await sleep(opts.delayBetweenBatches);
        }
      } catch (error) {
        retryCount++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        if (retryCount > opts.maxRetries) {
          errors.push(
            `Chunk ${chunkIndex + 1} failed after ${
              opts.maxRetries
            } retries: ${errorMessage}`
          );
          console.error(`Chunk ${chunkIndex + 1} failed permanently:`, error);
        } else {
          console.warn(
            `Chunk ${chunkIndex + 1} failed (attempt ${retryCount}):`,
            error
          );
        }
      }
    }
  }

  const success = errors.length === 0;
  console.log(
    `Batch operation completed. Success: ${success}, Processed: ${processedCount}/${operations.length}`
  );

  return { success, errors, processedCount };
}

/**
 * Execute a single chunk of operations
 */
async function executeChunk(
  operations: BatchOperation[],
  chunkNumber: number,
  totalChunks: number
): Promise<void> {
  console.log(
    `Processing chunk ${chunkNumber}/${totalChunks} with ${operations.length} operations`
  );

  const batch = writeBatch(db);

  for (const operation of operations) {
    const docRef = doc(db, operation.collection, operation.id);

    switch (operation.type) {
      case "update":
        if (operation.data) {
          batch.update(docRef, {
            ...operation.data,
            updatedAt: serverTimestamp(),
          });
        }
        break;

      case "create":
        if (operation.data) {
          batch.set(docRef, {
            ...operation.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        break;

      case "delete":
        batch.delete(docRef);
        break;
    }
  }

  await batch.commit();
  console.log(`Chunk ${chunkNumber}/${totalChunks} completed successfully`);
}

/**
 * Utility function to chunk an array
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Helper function to create guest assignment update operations
 */
export function createGuestAssignmentOperations(
  guestUpdates: Array<{ guestId: string; tableId: string | null }>
): BatchOperation[] {
  return guestUpdates.map(({ guestId, tableId }) => ({
    type: "update" as const,
    collection: "guests",
    id: guestId,
    data: {
      tableId: tableId || null,
    },
  }));
}

/**
 * Helper function to create table update operations
 */
export function createTableUpdateOperations(
  tableUpdates: Array<{ tableId: string; updates: Record<string, unknown> }>
): BatchOperation[] {
  return tableUpdates.map(({ tableId, updates }) => ({
    type: "update" as const,
    collection: "tables",
    id: tableId,
    data: updates,
  }));
}

/**
 * Helper function to create table creation operations
 */
export function createTableCreationOperations(
  tables: Array<{ id: string; data: Record<string, unknown> }>
): BatchOperation[] {
  return tables.map(({ id, data }) => ({
    type: "create" as const,
    collection: "tables",
    id,
    data,
  }));
}

/**
 * Specialized function for bulk guest assignment updates
 */
export async function bulkUpdateGuestAssignments(
  guestUpdates: Array<{ guestId: string; tableId: string | null }>,
  options?: BatchUpdateOptions
): Promise<{ success: boolean; errors: string[]; processedCount: number }> {
  const operations = createGuestAssignmentOperations(guestUpdates);
  return executeBatchUpdates(operations, {
    maxBatchSize: 100, // Higher batch size for simple updates
    delayBetweenBatches: 50, // Shorter delay for assignment updates
    ...options,
  });
}

/**
 * Optimized batch save for assignment page
 */
export async function saveAssignmentChanges(
  guestChanges: Array<{ guestId: string; tableId: string | null }>,
  tableChanges: Array<{
    tableId: string;
    updates: Record<string, unknown>;
  }> = []
): Promise<{ success: boolean; errors: string[]; totalProcessed: number }> {
  const allOperations: BatchOperation[] = [
    ...createGuestAssignmentOperations(guestChanges),
    ...createTableUpdateOperations(tableChanges),
  ];

  if (allOperations.length === 0) {
    return { success: true, errors: [], totalProcessed: 0 };
  }

  console.log(
    `Saving ${guestChanges.length} guest assignments and ${tableChanges.length} table updates`
  );

  const result = await executeBatchUpdates(allOperations, {
    maxBatchSize: 75, // Balanced batch size
    delayBetweenBatches: 100, // Small delay between batches
    maxRetries: 3,
    retryDelay: 1000,
  });

  return {
    success: result.success,
    errors: result.errors,
    totalProcessed: result.processedCount,
  };
}
