/**
 * Deduplication utility for log entries.
 * Groups entries by a fingerprint (URL + method + requestBody) and considers
 * entries as duplicates ONLY if they share the exact same millisecond timestamp.
 */

export interface DeduplicatedEntry<T> {
  entry: T;
  duplicateCount: number;
  isDuplicate: boolean;
}

/**
 * Generates a fingerprint string from the key fields of an entry.
 * Two entries with the same fingerprint AND the same timestamp are considered duplicates.
 */
function getFingerprint(url: string, method: string, requestBody: string): string {
  // Use a simple concatenation — identical content = identical fingerprint
  return `${method}|${url}|${requestBody}`;
}

/**
 * Deduplicates fares log entries.
 * Only entries with identical URL + method + requestBody AND exact same ms timestamp are dupes.
 */
export function deduplicateFares<T extends { endpoint: string; method: string; _rawRequestBody: string; timestamp: string }>(
  entries: T[]
): DeduplicatedEntry<T>[] {
  return deduplicateGeneric(
    entries,
    (e) => getFingerprint(e.endpoint, e.method, e._rawRequestBody),
    (e) => e.timestamp
  );
}

/**
 * Deduplicates integration log entries.
 * Only entries with identical URL + method + requestBody AND exact same ms timestamp are dupes.
 */
export function deduplicateIntegration<T extends { url: string; method: string; _rawRequestBody: string; requestedAt: string; timestamp: string }>(
  entries: T[]
): DeduplicatedEntry<T>[] {
  return deduplicateGeneric(
    entries,
    (e) => getFingerprint(e.url, e.method, e._rawRequestBody),
    (e) => e.requestedAt || e.timestamp
  );
}

/**
 * Generic deduplication: groups by fingerprint + exact timestamp.
 * The first occurrence is kept; subsequent duplicates are marked.
 */
function deduplicateGeneric<T>(
  entries: T[],
  getKey: (entry: T) => string,
  getTimestamp: (entry: T) => string
): DeduplicatedEntry<T>[] {
  // Group by (fingerprint + exact timestamp)
  const groups = new Map<string, number[]>();

  for (let i = 0; i < entries.length; i++) {
    const fp = getKey(entries[i]);
    const ts = getTimestamp(entries[i]);
    const groupKey = `${fp}|||${ts}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(i);
  }

  // Build result: first in each group is the primary, rest are duplicates
  const result: DeduplicatedEntry<T>[] = entries.map((entry, i) => ({
    entry,
    duplicateCount: 0,
    isDuplicate: false,
  }));

  for (const indices of groups.values()) {
    if (indices.length > 1) {
      // First entry gets the count
      result[indices[0]].duplicateCount = indices.length - 1;
      // Remaining entries are marked as duplicates
      for (let j = 1; j < indices.length; j++) {
        result[indices[j]].isDuplicate = true;
      }
    }
  }

  return result;
}
