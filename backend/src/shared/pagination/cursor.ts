/**
 * Cursor-based pagination utilities (§10.7)
 * Opaque base64 cursor encoding for stable pagination under concurrent writes.
 */

export interface CursorData {
  sortValue: string;
  id: string;
}

export const encodeCursor = (sortValue: string | number | Date, id: string): string => {
  const normalizedValue = sortValue instanceof Date
    ? sortValue.toISOString()
    : String(sortValue);
  
  const payload = JSON.stringify({ v: normalizedValue, i: id });
  return Buffer.from(payload, 'utf-8').toString('base64');
};

export const decodeCursor = (cursorString?: string | null): CursorData | null => {
  if (!cursorString) return null;
  try {
    const decoded = Buffer.from(cursorString, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (typeof parsed.v !== 'string' || typeof parsed.i !== 'string') {
      return null;
    }
    return { sortValue: parsed.v, id: parsed.i };
  } catch (err) {
    return null;
  }
};

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}
