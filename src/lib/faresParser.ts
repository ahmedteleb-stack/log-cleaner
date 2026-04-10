import { parseCSV, ParsedRow } from './csvParser';
import { safeParseBookingResponse, type BookingResponse } from '../models/WegoBookingModel';

export interface FlightLeg {
  departureAirportCode: string;
  arrivalAirportCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  airlineCodes: string[];
  stopoversCount: number;
  cabin: string;
  departureDateTime: string;
  arrivalDateTime: string;
}

export interface PriceBreakdown {
  totalAmount: string;
  totalOriginalAmount: string;
  totalTaxAmount: string;
  totalBookingFee: string;
  totalInsuranceAmount: string;
  totalSeatAmount: string;
  totalMealAmount: string;
  totalBaggageAmount: string;
  currencyCode: string;
}

export interface PaymentMethod {
  name: string;
  code: string;
  cardType: string;
  feeAmount: string;
  feePercentage: string;
  feeCurrency: string;
}

export interface InsurancePackage {
  type: string;
  title: string;
  supplier: string;
  amount: string;
  currency: string;
}

export interface AncillarySupport {
  legId: string;
  seatSupported: boolean;
  mealSupported: boolean;
  baggageSupported: boolean;
}

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
  origin: string;
  // From response — revalidate
  route: string;
  legs: FlightLeg[];
  totalPrice: string;
  currencyCode: string;
  priceChanged: string;
  oldPrice: string;
  newPrice: string;
  cabin: string;
  providerCode: string;
  // From response — passenger-info / addons
  bookingRef: string;
  priceBreakdown: PriceBreakdown | null;
  expiredAt: string;
  insurancePackages: InsurancePackage[];
  // From response — payments
  paymentMethods: PaymentMethod[];
  paymentMethodsCount: string;
  // From response — ancillaries
  ancillarySupport: AncillarySupport[];
  // From response — status
  responseCode: string;
  paymentExtension: string;
  // From response — compare
  compareFareCount: string;
  // From requestbody
  requestBodySummary: string;
  // Raw
  _raw: ParsedRow;
  _rawResponseBody: string;
  _rawRequestBody: string;
  bookingDetails?: BookingResponse | null;
}

function extractEndpointType(url: string): string {
  if (url.includes('/ancillaries/seats-availability')) return 'Seats Availability';
  if (url.includes('/ancillaries/baggages/availability')) return 'Baggage Availability';
  if (url.includes('/ancillaries/baggages/assign')) return 'Baggage Assign';
  if (url.includes('/ancillaries/meals/availability')) return 'Meals Availability';
  if (url.includes('/ancillaries/meals/assign')) return 'Meals Assign';
  if (url.includes('/ancillaries/assign-seats')) return 'Assign Seats';
  if (url.includes('/ancillaries')) return 'Ancillaries';
  if (url.includes('/revalidate')) return 'Revalidate';
  if (url.includes('/compare')) return 'Compare';
  if (url.includes('/payments/order-data')) return 'Order Data';
  if (url.includes('/payments/options')) return 'Payment Options';
  if (url.includes('/payments')) return 'Payments';
  if (url.includes('/addons/confirm')) return 'Addons Confirm';
  if (url.includes('/addons/insurance')) return 'Addons Insurance';
  if (url.includes('/addons')) return 'Addons';
  if (url.includes('/status')) return 'Status';
  if (url.includes('/v2/details') || url.includes('/details')) return 'Details';
  if (url.includes('/passenger-info')) return 'Passenger Info';
  if (url.includes('/fare/') && !url.includes('/revalidate') && !url.includes('/compare')) return 'Fare';
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

function parseErrorField(raw: string): string {
  if (!raw) return '';
  const msgMatch = raw.match(/message=([^,}]+)/);
  return msgMatch ? msgMatch[1].trim() : raw.slice(0, 100);
}

function tryParseJSON(body: string): any {
  if (!body) return null;
  try { return JSON.parse(body); } catch { return null; }
}

function extractRevalidateData(data: any) {
  const defaults = { route: '', legs: [] as FlightLeg[], totalPrice: '', currencyCode: '', priceChanged: '', oldPrice: '', newPrice: '', cabin: '', providerCode: '' };
  if (!data?.trip) return defaults;

  const rawLegs = data.trip.legs || [];
  const legs: FlightLeg[] = rawLegs.map((l: any) => ({
    departureAirportCode: l.departureAirportCode || '',
    arrivalAirportCode: l.arrivalAirportCode || '',
    departureTime: l.departureTime || '',
    arrivalTime: l.arrivalTime || '',
    duration: l.duration || '',
    airlineCodes: l.airlineCodes || [],
    stopoversCount: l.stopoversCount || 0,
    cabin: l.cabinCode || '',
    departureDateTime: l.departureDateTime || '',
    arrivalDateTime: l.arrivalDateTime || '',
  }));

  const route = legs.map(l => `${l.departureAirportCode} → ${l.arrivalAirportCode}`).join(' · ');
  const pi = data.priceInfo || {};
  const cabin = data.trip.cabinCode || legs[0]?.cabin || '';

  return {
    route,
    legs,
    totalPrice: pi.newTotalAmount?.toString() || pi.oldTotalAmount?.toString() || '',
    currencyCode: pi.currencyCode || '',
    priceChanged: pi.priceChanged != null ? String(pi.priceChanged) : '',
    oldPrice: pi.oldTotalAmount?.toString() || '',
    newPrice: pi.newTotalAmount?.toString() || '',
    cabin,
    providerCode: data.trip.providerCode || '',
  };
}

function extractPriceBreakdown(price: any): PriceBreakdown | null {
  if (!price) return null;
  return {
    totalAmount: price.totalAmount?.toString() || '',
    totalOriginalAmount: price.totalOriginalAmount?.toString() || '',
    totalTaxAmount: price.totalTaxAmount?.toString() || '',
    totalBookingFee: price.totalBookingFee?.toString() || '',
    totalInsuranceAmount: price.totalInsuranceAmount?.toString() || '',
    totalSeatAmount: price.totalSeatAmount?.toString() || '',
    totalMealAmount: price.totalMealAmount?.toString() || '',
    totalBaggageAmount: price.totalBaggageAmount?.toString() || '',
    currencyCode: price.currencyCode || '',
  };
}

function extractPassengerInfoData(data: any) {
  return {
    bookingRef: data.bookingRef || '',
    paymentorderid: data.paymentOrderId || '',
    priceBreakdown: extractPriceBreakdown(data.price),
    expiredAt: data.expiredAt || '',
    insurancePackages: (data.insurancePackages || []).map((p: any) => ({
      type: p.type || '',
      title: p.title || '',
      supplier: p.supplier || '',
      amount: p.price?.amount?.toString() || '',
      currency: p.price?.currencyCode || '',
    })),
  };
}

function extractPaymentsData(data: any) {
  const methods: PaymentMethod[] = (data.paymentMethods || []).map((m: any) => ({
    name: m.name || '',
    code: m.code || '',
    cardType: m.cardType || '',
    feeAmount: m.fee?.amount?.toString() || '',
    feePercentage: m.fee?.percentage?.toString() || '',
    feeCurrency: m.fee?.currencyCode || '',
  }));
  return { paymentMethods: methods, paymentMethodsCount: methods.length.toString() };
}

function extractAncillariesData(data: any) {
  const support: AncillarySupport[] = (data.segmentAncillaries || []).map((s: any) => ({
    legId: s.legId || '',
    seatSupported: !!s.isSeatSelectionSupported,
    mealSupported: !!s.isMealSelectionSupported,
    baggageSupported: !!s.isBaggageSelectionSupported,
  }));
  return { ancillarySupport: support };
}

function extractStatusData(data: any) {
  return {
    bookingRef: data.bookingRef || '',
    responseCode: data.responseCode?.toString() || '',
    paymentExtension: data.paymentExtension != null ? String(data.paymentExtension) : '',
    expiredAt: data.expiredAt || '',
  };
}

function extractAddonsData(data: any) {
  return {
    bookingRef: data.bookingRef || '',
    paymentorderid: data.paymentOrderId || '',
    priceBreakdown: extractPriceBreakdown(data),
    expiredAt: '',
    insurancePackages: (data.insurancePackages || []).map((p: any) => ({
      type: p.type || '',
      title: p.title || '',
      supplier: p.supplier || '',
      amount: p.amount?.toString() || p.price?.amount?.toString() || '',
      currency: p.currencyCode || p.price?.currencyCode || '',
    })),
  };
}

function summarizeRequestBody(body: string): string {
  if (!body) return '';
  const data = tryParseJSON(body);
  if (!data) return body.slice(0, 80);
  const keys = Object.keys(data);
  if (keys.length <= 3) return keys.map(k => `${k}: ${JSON.stringify(data[k]).slice(0, 40)}`).join(', ');
  return `{${keys.join(', ')}}`;
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
  const responseBody = row.responsebody || '';
  const requestBody = row.requestbody || '';
  const data = tryParseJSON(responseBody);

  // Base entry
  const entry: FlattenedFareEntry = {
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
    origin: headers['Origin'] || '',
    route: '',
    legs: [],
    totalPrice: '',
    currencyCode: '',
    priceChanged: '',
    oldPrice: '',
    newPrice: '',
    cabin: '',
    providerCode: '',
    bookingRef: '',
    priceBreakdown: null,
    expiredAt: '',
    insurancePackages: [],
    paymentMethods: [],
    paymentMethodsCount: '',
    ancillarySupport: [],
    responseCode: '',
    paymentExtension: '',
    compareFareCount: '',
    requestBodySummary: summarizeRequestBody(requestBody),
    _raw: row,
    _rawResponseBody: responseBody,
    _rawRequestBody: requestBody,
    bookingDetails: null,
  };

  if (!data) return entry;

  // Enrich based on endpoint type
  if (url.includes('/revalidate')) {
    const rv = extractRevalidateData(data);
    Object.assign(entry, rv);
  } else if (url.includes('/passenger-info')) {
    const pi = extractPassengerInfoData(data);
    entry.bookingRef = pi.bookingRef;
    entry.paymentorderid = entry.paymentorderid || pi.paymentorderid;
    entry.priceBreakdown = pi.priceBreakdown;
    entry.expiredAt = pi.expiredAt;
    entry.insurancePackages = pi.insurancePackages;
    if (pi.priceBreakdown) {
      entry.totalPrice = pi.priceBreakdown.totalAmount;
      entry.currencyCode = pi.priceBreakdown.currencyCode;
    }
  } else if (url.includes('/payments') && !url.includes('/order-data') && !url.includes('/options')) {
    const pm = extractPaymentsData(data);
    entry.paymentMethods = pm.paymentMethods;
    entry.paymentMethodsCount = pm.paymentMethodsCount;
  } else if (url.includes('/payments/options')) {
    const pm = extractPaymentsData(data);
    entry.paymentMethods = pm.paymentMethods;
    entry.paymentMethodsCount = pm.paymentMethodsCount;
  } else if (url.includes('/ancillaries') && !url.includes('/seats') && !url.includes('/baggages') && !url.includes('/meals') && !url.includes('/assign')) {
    const anc = extractAncillariesData(data);
    entry.ancillarySupport = anc.ancillarySupport;
  } else if (url.includes('/status')) {
    const st = extractStatusData(data);
    entry.bookingRef = st.bookingRef;
    entry.responseCode = st.responseCode;
    entry.paymentExtension = st.paymentExtension;
    entry.expiredAt = st.expiredAt;
  } else if (url.includes('/addons')) {
    const ad = extractAddonsData(data);
    entry.bookingRef = ad.bookingRef;
    entry.paymentorderid = entry.paymentorderid || ad.paymentorderid;
    entry.priceBreakdown = ad.priceBreakdown;
    entry.insurancePackages = ad.insurancePackages;
    if (ad.priceBreakdown) {
      entry.totalPrice = ad.priceBreakdown.totalAmount;
      entry.currencyCode = ad.priceBreakdown.currencyCode;
    }
  } else if (url.includes('/compare')) {
    const fares = data.fares || data.results || [];
    entry.compareFareCount = Array.isArray(fares) ? fares.length.toString() : '';
  } else if (url.includes('/v2/details') || url.includes('/details')) {
    const result = safeParseBookingResponse(responseBody);
    if (result.success) {
      entry.bookingDetails = result.data as BookingResponse;
    } else {
      console.warn("Failed to parse /v2/details", result.error);
      // Even if parse fails totally, we might want to attach a partial object if possible,
      // but Zod handles that.
      entry.bookingDetails = data as unknown as BookingResponse; 
    }
  }

  return entry;
}
