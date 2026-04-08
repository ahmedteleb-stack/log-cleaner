export interface ParsedRow {
  [key: string]: string;
}

export interface ParsedSearch {
  [key: string]: string | ParsedSearch[] | undefined;
}

export interface FlattenedLogEntry {
  // Original fields
  is_cached: string;
  locale: string;
  processing_time: string;
  provider_code: string;
  requests_count: string;
  timestamp: string;
  total: string;
  trips_count: string;
  valid: string;
  date: string;
  // Extracted from search
  route: string;
  departure_city: string;
  arrival_city: string;
  outbound_date: string;
  return_date: string;
  trip_type: string;
  cabin: string;
  adults_count: string;
  children_count: string;
  infants_count: string;
  currency_code: string;
  device_type: string;
  app_type: string;
  site_code: string;
  search_id: string;
  user_logged_in: string;
  number_of_legs: string;
  // Raw for detail view
  _raw_search: string;
  _raw: ParsedRow;
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
  const inner = raw.slice(1, -1);
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
      // skip
    } else {
      current += char;
    }
  }

  return objects;
}

export function flattenLogEntry(row: ParsedRow): FlattenedLogEntry {
  const searchRaw = row.search || '';
  const parsed = parseSearchField(searchRaw);
  const legs = parsed.legs as ParsedSearch[] | undefined;

  let departureCity = '';
  let arrivalCity = '';
  let outboundDate = '';
  let returnDate = '';
  let route = '';

  if (legs && Array.isArray(legs) && legs.length > 0) {
    departureCity = String(legs[0].departure_city_code || '');
    arrivalCity = String(legs[0].arrival_city_code || '');
    outboundDate = String(legs[0].outbound_date || '');
    if (legs.length > 1) {
      returnDate = String(legs[1].outbound_date || '');
    }
    route = legs.map(l => `${l.departure_city_code} → ${l.arrival_city_code}`).join(' · ');
  }

  return {
    is_cached: row.is_cached || '',
    locale: row.locale || '',
    processing_time: row.processing_time || '',
    provider_code: row.provider_code || '',
    requests_count: row.requests_count || '',
    timestamp: row.timestamp || '',
    total: row.total || '',
    trips_count: row.trips_count || '',
    valid: row.valid || '',
    date: row.date || '',
    route,
    departure_city: departureCity,
    arrival_city: arrivalCity,
    outbound_date: outboundDate,
    return_date: returnDate,
    trip_type: String(parsed.trip_type || ''),
    cabin: String(parsed.cabin || ''),
    adults_count: String(parsed.adults_count || ''),
    children_count: String(parsed.children_count || ''),
    infants_count: String(parsed.infants_count || ''),
    currency_code: String(parsed.currency_code || ''),
    device_type: String(parsed.device_type || ''),
    app_type: String(parsed.app_type || ''),
    site_code: String(parsed.site_code || ''),
    search_id: String(parsed.id || ''),
    user_logged_in: String(parsed.user_logged_in || ''),
    number_of_legs: String(parsed.number_of_legs || ''),
    _raw_search: searchRaw,
    _raw: row,
  };
}
