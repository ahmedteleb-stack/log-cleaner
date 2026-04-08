export interface ParsedRow {
  [key: string]: string;
}

export interface ParsedSearch {
  [key: string]: string | ParsedSearch[] | undefined;
}

export function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: ParsedRow = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export function parseSearchField(raw: string): ParsedSearch {
  if (!raw || !raw.startsWith('{')) return {};

  const inner = raw.slice(1, -1);
  const result: ParsedSearch = {};
  let depth = 0;
  let current = '';
  const parts: string[] = [];

  for (const char of inner) {
    if (char === '[' || char === '{') depth++;
    if (char === ']' || char === '}') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());

  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;
    const key = part.slice(0, eqIndex).trim();
    const value = part.slice(eqIndex + 1).trim();

    if (value.startsWith('[{')) {
      // Parse array of objects
      const items = parseArrayOfObjects(value);
      result[key] = items;
    } else if (value === '[]') {
      result[key] = '—';
    } else {
      result[key] = value || '—';
    }
  }

  return result;
}

function parseArrayOfObjects(raw: string): ParsedSearch[] {
  const inner = raw.slice(1, -1); // remove outer []
  const objects: ParsedSearch[] = [];
  let depth = 0;
  let current = '';

  for (const char of inner) {
    if (char === '{') {
      if (depth === 0) current = '';
      depth++;
      if (depth > 1) current += char;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        objects.push(parseSearchField(`{${current}}`));
      } else {
        current += char;
      }
    } else if (char === ',' && depth === 0) {
      // skip comma between objects
    } else {
      current += char;
    }
  }

  return objects;
}
