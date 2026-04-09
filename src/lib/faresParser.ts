import { parseCSV, ParsedRow } from './csvParser';

export interface FlattenedFareEntry {
  method: string;
  endpoint: string;
  endpointType: string;
  statuscode: string;
  timestamp: string;
  date: string;
  msfareid: string;
  paymentorderid: string;
  wegoref: string;
  brandedfareid: string;
  hasError: boolean;
  errorMessage: string;
  // From headers
  country: string;
  city: string;
  userAgent: string;
  deviceInfo: string;
  authStatus: string;
  clientIp: string;
  // From response (revalidate)
  route: string;
  totalPrice: string;
  currencyCode: string;
  priceChanged: string;
  // Stats
  paymentMethodsCount: string;
  // Raw
  _raw: ParsedRow;
  _rawResponseBody: string;
}

function extractEndpointType(url: string): string {
  if (url.includes('/ancillaries')) return 'Ancillaries';
  if (url.includes('/revalidate')) return 'Revalidate';
  if (url.includes('/payments')) return 'Payments';
  if (url.includes('/addons')) return 'Addons';
  if (url.includes('/status')) return 'Status';
  if (url.includes('/passenger-info')) return 'Passenger Info';
  if (url.includes('/fare/')) return 'Fare';
  return url.split('/').pop() || 'Unknown';
}

function parseHeaderPairs(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /name=([^,}]+),\s*value=([^}]*)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    result[match[1].trim()] = match[2].trim();
  }
  return result;
}

function extractDeviceInfo(ua: string): string {
  if (!ua) return '—';
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'Mac';
  return 'Other';
}

function tryParseResponseBody(body: string, url: string): {
  route: string;
  totalPrice: string;
  currencyCode: string;
  priceChanged: string;
  paymentMethodsCount: string;
} {
  const defaults = { route: '', totalPrice: '', currencyCode: '', priceChanged: '', paymentMethodsCount: '' };
  if (!body) return defaults;
  
  try {
    const data = JSON.parse(body);
    
    if (url.includes('/revalidate') && data.trip) {
      const legs = data.trip.legs || [];
      const route = legs.map((l: any) => `${l.departureAirportCode} → ${l.arrivalAirportCode}`).join(' · ');
      const pi = data.priceInfo || {};
      return {
        route,
        totalPrice: pi.newTotalAmount?.toString() || pi.oldTotalAmount?.toString() || '',
        currencyCode: pi.currencyCode || '',
        priceChanged: pi.priceChanged != null ? String(pi.priceChanged) : '',
        paymentMethodsCount: '',
      };
    }
    
    if (url.includes('/payments') && data.paymentMethods) {
      return { ...defaults, paymentMethodsCount: data.paymentMethods.length.toString() };
    }
    
    return defaults;
  } catch {
    return defaults;
  }
}

function parseErrorField(raw: string): string {
  if (!raw) return '';
  // Format: {message=..., name=..., stacktrace=...}
  const msgMatch = raw.match(/message=([^,}]+)/);
  return msgMatch ? msgMatch[1].trim() : raw.slice(0, 100);
}

export function parseFaresCSV(text: string): FlattenedFareEntry[] {
  const { rows } = parseCSV(text);
  return rows.map(row => flattenFareEntry(row));
}

export function flattenFareEntry(row: ParsedRow): FlattenedFareEntry {
  const url = row.url || '';
  const headers = parseHeaderPairs(row.requestheaders || '');
  const ua = headers['User-Agent'] || '';
  const errorRaw = row.error || '';
  const responseInfo = tryParseResponseBody(row.responsebody || '', url);
  
  return {
    method: row.method || '',
    endpoint: url,
    endpointType: extractEndpointType(url),
    statuscode: row.statuscode || '',
    timestamp: row.timestamp || '',
    date: row.date || '',
    msfareid: row.msfareid || '',
    paymentorderid: row.paymentorderid || '',
    wegoref: row.wegoref || '',
    brandedfareid: row.brandedfareid || '',
    hasError: !!errorRaw,
    errorMessage: parseErrorField(errorRaw),
    country: headers['X-Country-Code'] || '',
    city: headers['X-User-City'] || '',
    userAgent: ua,
    deviceInfo: extractDeviceInfo(ua),
    authStatus: headers['X-AUTH-STATUS'] || '',
    clientIp: headers['True-Client-IP'] || headers['CF-Connecting-IP'] || '',
    route: responseInfo.route,
    totalPrice: responseInfo.totalPrice,
    currencyCode: responseInfo.currencyCode,
    priceChanged: responseInfo.priceChanged,
    paymentMethodsCount: responseInfo.paymentMethodsCount,
    _raw: row,
    _rawResponseBody: row.responsebody || '',
  };
}
