import { parseCSV, ParsedRow } from './csvParser';

// ── Types ──

export interface FlattenedSupplierEntry {
  // Row-level fields (same CSV schema as integration)
  ipcc: string;
  method: string;
  providerBrandedFaresCount: string;
  requestedAt: string;
  status: string;
  timeInMs: string;
  type: string;
  url: string;
  brandedFareId: string;
  msFareId: string;
  wegoRef: string;
  orderId: string;
  itineraryRef: string;
  queueNumber: string;
  hasError: boolean;
  errorMessage: string;
  timestamp: string;
  date: string;

  // Extracted from request/response bodies
  route: string;
  summary: string;
  passengers: SupplierPassenger[];
  journeys: SupplierJourney[];
  breakdown: SupplierBreakdown | null;
  seatMapInfo: SupplierSeatMapInfo | null;
  ssrInfo: SupplierSSRInfo[];
  paymentInfo: SupplierPaymentInfo | null;
  commitInfo: SupplierCommitInfo | null;

  // Raw
  _raw: ParsedRow;
  _rawRequestBody: string;
  _rawResponseBody: string;
}

export interface SupplierPassenger {
  passengerKey: string;
  firstName: string;
  lastName: string;
  title: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  type: string;
}

export interface SupplierJourney {
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  flightNumber: string;
  carrierCode: string;
  stops: number;
  fareClass: string;
  fareBasisCode: string;
  productClass: string;
}

export interface SupplierBreakdown {
  balanceDue: number;
  totalAmount: number;
  totalCharged: number;
  totalTax: number;
  currencyCode: string;
  passengerCharges: SupplierCharge[];
}

export interface SupplierCharge {
  amount: number;
  code: string;
  detail: string;
  currencyCode: string;
  foreignAmount: number;
  foreignCurrencyCode: string;
}

export interface SupplierSeatMapInfo {
  equipmentType: string;
  equipmentName: string;
  origin: string;
  destination: string;
  availableUnits: number;
  compartmentCount: number;
}

export interface SupplierSSRInfo {
  ssrCode: string;
  ssrType: string;
  name: string;
  price: number;
  available: number | null;
  limitPerPassenger: number;
}

export interface SupplierPaymentInfo {
  paymentMethodCode: string;
  paymentMethodType: string;
  amount: number;
  currencyCode: string;
  status: string;
  accountNumber: string;
}

export interface SupplierCommitInfo {
  recordLocator: string;
  state: string;
  currencyCode: string;
  totalCost: number;
  pnrAmount: number;
}

// ── Type labels and icons ──

export const SUPPLIER_TYPE_LABELS: Record<string, { icon: string; label: string; source: 'user' | 'system' }> = {
  // Generic patterns — will be matched by prefix/suffix later
};

export function getSupplierTypeInfo(type: string): { icon: string; label: string; source: 'user' | 'system' } {
  // Trip/booking
  if (type.includes('TRIP_SELL') || type.includes('TRIP_ADD')) return { icon: '🎫', label: 'Trip Sell', source: 'system' };
  if (type.includes('REVALIDATE_1')) return { icon: '🔄', label: 'Revalidate (Price)', source: 'system' };
  if (type.includes('REVALIDATE_2') || type.includes('BOOKING_QUOTE')) return { icon: '💰', label: 'Booking Quote', source: 'system' };
  if (type.includes('PASSENGERS') || type.includes('PASSENGER')) return { icon: '👤', label: 'Set Passengers', source: 'user' };
  if (type.includes('SSR_AVAILABILITY')) return { icon: '🧳', label: 'SSR Availability', source: 'system' };
  if (type.includes('SEATS_AVAILABILITY') || type.includes('SEAT_MAP')) return { icon: '💺', label: 'Seat Map', source: 'system' };
  if (type.includes('COMMIT') || type.includes('CONFIRM')) return { icon: '✅', label: 'Commit Booking', source: 'user' };
  if (type.includes('ADD_PAYMENT') || type.includes('PAYMENT')) return { icon: '💳', label: 'Add Payment', source: 'user' };
  if (type.includes('CANCEL') || type.includes('VOID')) return { icon: '❌', label: 'Cancel', source: 'user' };
  if (type.includes('TICKET')) return { icon: '🎟️', label: 'Ticketing', source: 'system' };
  if (type.includes('SSR_SELL') || type.includes('SSR_ADD')) return { icon: '📦', label: 'Add SSR', source: 'user' };
  if (type.includes('SEAT_ASSIGN') || type.includes('ASSIGN_SEAT')) return { icon: '✅', label: 'Assign Seat', source: 'user' };
  if (type.includes('PNR') || type.includes('RETRIEVE') || type.includes('GET_BOOKING')) return { icon: '🔍', label: 'Retrieve PNR', source: 'system' };
  if (type.includes('QUEUE')) return { icon: '📥', label: 'Queue', source: 'system' };

  // Fallback: strip known airline prefixes
  const stripped = type
    .replace(/^(JAZEERA|SABRE|AMADEUS|GALILEO|TRAVELPORT|KIWI|NDC|TRAVELFUSION|FARELOGIX|MYSTIFLY|AERTICKET)_/i, '')
    .replace(/_/g, ' ');
  return { icon: '📄', label: stripped, source: 'system' };
}

// ── Parsing ──

function tryParse(s: string): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function extractJourneys(data: any): SupplierJourney[] {
  const journeys: SupplierJourney[] = [];
  // Try multiple response/request structures
  const rawJourneys = data?.data?.Trip?.tripAddv4?.journeys
    || data?.data?.journeys
    || data?.journeys
    || [];

  for (const j of rawJourneys) {
    const designator = j.designator || {};
    const segments = j.segments || [];
    const fare = segments[0]?.fares?.[0] || {};

    journeys.push({
      origin: designator.origin || '',
      destination: designator.destination || '',
      departure: designator.departure || '',
      arrival: designator.arrival || '',
      flightNumber: j.identifier?.identifier || segments[0]?.identifier?.identifier || '',
      carrierCode: fare.carrierCode || j.identifier?.carrierCode || segments[0]?.identifier?.carrierCode || '',
      stops: j.stops ?? 0,
      fareClass: fare.classOfService || '',
      fareBasisCode: fare.fareBasisCode || '',
      productClass: fare.productClass || '',
    });
  }
  return journeys;
}

function extractBreakdown(data: any): SupplierBreakdown | null {
  const bd = data?.data?.Trip?.tripAddv4?.breakdown
    || data?.data?.breakdown
    || data?.breakdown;
  if (!bd) return null;

  // Extract charges from passenger fares
  const charges: SupplierCharge[] = [];
  const journeys = data?.data?.journeys || data?.data?.Trip?.tripAddv4?.journeys || [];
  for (const j of journeys) {
    for (const seg of j.segments || []) {
      for (const fare of seg.fares || []) {
        for (const pf of fare.passengerFares || []) {
          for (const sc of pf.serviceCharges || []) {
            if (sc.code) {
              charges.push({
                amount: sc.amount ?? 0,
                code: sc.code || '',
                detail: sc.detail || '',
                currencyCode: sc.currencyCode || '',
                foreignAmount: sc.foreignAmount ?? 0,
                foreignCurrencyCode: sc.foreignCurrencyCode || '',
              });
            }
          }
        }
      }
    }
  }

  return {
    balanceDue: bd.balanceDue ?? 0,
    totalAmount: bd.totalAmount ?? bd.totalToCollect ?? 0,
    totalCharged: bd.totalCharged ?? 0,
    totalTax: bd.journeyTotals?.totalTax ?? 0,
    currencyCode: data?.data?.Trip?.tripAddv4?.currencyCode || '',
    passengerCharges: charges,
  };
}

function extractPassengersFromRequest(data: any): SupplierPassenger[] {
  const passengers: SupplierPassenger[] = [];
  const rawPax = data?.passengers || [];

  for (const p of rawPax) {
    const info = p.passengerInfo || {};
    const name = info.name || {};
    const pInfo = info.info || {};

    passengers.push({
      passengerKey: p.passengerKey || '',
      firstName: name.first || '',
      lastName: name.last || '',
      title: name.title || '',
      gender: pInfo.gender || '',
      dateOfBirth: pInfo.dateOfBirth || '',
      nationality: pInfo.nationality || '',
      type: '', // ADT/CHD/INF not always in passenger request
    });
  }
  return passengers;
}

function extractSeatMapInfo(data: any): SupplierSeatMapInfo | null {
  const seatMaps = data?.data || data;
  if (!Array.isArray(seatMaps) || seatMaps.length === 0) return null;
  const sm = seatMaps[0]?.seatMap;
  if (!sm) return null;

  return {
    equipmentType: sm.equipmentType || '',
    equipmentName: sm.name || '',
    origin: sm.departureStation || '',
    destination: sm.arrivalStation || '',
    availableUnits: sm.availableUnits ?? 0,
    compartmentCount: Object.keys(sm.decks?.['1']?.compartments || {}).length,
  };
}

function extractSSRInfo(data: any): SupplierSSRInfo[] {
  const ssrs: SupplierSSRInfo[] = [];
  const availability = data?.data?.ssrAvailabilityv2;
  if (!availability) return ssrs;

  const journeySsrs = availability.journeySsrs || [];
  for (const js of journeySsrs) {
    for (const ssr of js.ssrs || []) {
      // Get price from first passenger
      const firstPax = ssr.passengersAvailability?.[0];
      const price = firstPax?.value?.price ?? 0;

      ssrs.push({
        ssrCode: ssr.ssrCode || '',
        ssrType: ssr.ssrType || '',
        name: ssr.name || '',
        price,
        available: ssr.available,
        limitPerPassenger: ssr.limitPerPassenger ?? 0,
      });
    }
  }
  return ssrs;
}

function extractPaymentInfo(data: any): SupplierPaymentInfo | null {
  const reqData = data;
  if (!reqData) return null;

  // Try different payment structures
  const payments = reqData.payments || [];
  const payment = payments[0] || reqData;

  if (!payment.paymentMethodCode && !payment.amount) return null;

  return {
    paymentMethodCode: payment.paymentMethodCode || payment.methodCode || '',
    paymentMethodType: payment.paymentMethodType || '',
    amount: payment.amount ?? 0,
    currencyCode: payment.currencyCode || '',
    status: payment.status || '',
    accountNumber: payment.accountNumber || payment.accountNumberId || '',
  };
}

function extractCommitInfo(data: any): SupplierCommitInfo | null {
  const booking = data?.data?.Booking?.bookingCommitv2
    || data?.data?.bookingCommit
    || data?.data;

  if (!booking) return null;

  return {
    recordLocator: booking.recordLocator || data?.data?.recordLocator || '',
    state: booking.state !== undefined ? String(booking.state) : '',
    currencyCode: booking.currencyCode || '',
    totalCost: booking.totalCost ?? 0,
    pnrAmount: booking.pnrAmount ?? 0,
  };
}

function buildSummary(entry: FlattenedSupplierEntry): string {
  if (entry.hasError && entry.errorMessage) return `❌ ${entry.errorMessage}`;

  if (entry.journeys.length > 0) {
    const j = entry.journeys[0];
    return `${j.carrierCode}${j.flightNumber} ${j.origin}→${j.destination} ${j.fareClass ? `(${j.fareClass})` : ''}`.trim();
  }

  if (entry.passengers.length > 0) {
    return entry.passengers.map(p => `${p.title} ${p.firstName} ${p.lastName}`).join(', ');
  }

  if (entry.commitInfo?.recordLocator) {
    return `PNR: ${entry.commitInfo.recordLocator}`;
  }

  if (entry.seatMapInfo) {
    return `${entry.seatMapInfo.origin}→${entry.seatMapInfo.destination} (${entry.seatMapInfo.equipmentType}, ${entry.seatMapInfo.availableUnits} seats)`;
  }

  if (entry.ssrInfo.length > 0) {
    return entry.ssrInfo.map(s => s.name).join(', ');
  }

  if (entry.paymentInfo) {
    return `${entry.paymentInfo.paymentMethodCode} — ${entry.paymentInfo.amount} ${entry.paymentInfo.currencyCode}`;
  }

  return '';
}

function buildRoute(journeys: SupplierJourney[]): string {
  if (journeys.length === 0) return '';
  return journeys.map(j => `${j.origin} → ${j.destination}`).join(' · ');
}

export function parseSupplierCSV(text: string): FlattenedSupplierEntry[] {
  const { rows } = parseCSV(text);
  const entries = rows.map(row => flattenSupplierEntry(row));
  // Sort chronologically
  entries.sort((a, b) => {
    const ta = new Date(a.requestedAt || a.timestamp || 0).getTime();
    const tb = new Date(b.requestedAt || b.timestamp || 0).getTime();
    return ta - tb;
  });
  return entries;
}

export function flattenSupplierEntry(row: ParsedRow): FlattenedSupplierEntry {
  const reqBody = row.requestbody || row.request_body || '';
  const respBody = row.responsebody || row.response_body || '';
  const reqData = tryParse(reqBody);
  const respData = tryParse(respBody);
  const errorRaw = row.error || row.errors || '';
  const type = row.type || '';

  // Extract journeys from response (trip sell, revalidate) or request
  let journeys: SupplierJourney[] = [];
  if (respData) journeys = extractJourneys(respData);
  if (journeys.length === 0 && reqData) journeys = extractJourneys(reqData);

  // Extract breakdown
  let breakdown: SupplierBreakdown | null = null;
  if (respData) breakdown = extractBreakdown(respData);

  // Passengers from request
  let passengers: SupplierPassenger[] = [];
  if (type.includes('PASSENGER')) {
    passengers = extractPassengersFromRequest(reqData);
  }

  // Seat map from response
  let seatMapInfo: SupplierSeatMapInfo | null = null;
  if (type.includes('SEAT')) {
    seatMapInfo = extractSeatMapInfo(respData);
  }

  // SSR from response
  let ssrInfo: SupplierSSRInfo[] = [];
  if (type.includes('SSR')) {
    ssrInfo = extractSSRInfo(respData);
  }

  // Payment from request
  let paymentInfo: SupplierPaymentInfo | null = null;
  if (type.includes('PAYMENT')) {
    paymentInfo = extractPaymentInfo(reqData);
  }

  // Commit from response
  let commitInfo: SupplierCommitInfo | null = null;
  if (type.includes('COMMIT') || type.includes('CONFIRM')) {
    commitInfo = extractCommitInfo(respData);
  }

  const hasError = !!errorRaw || (parseInt(row.status || '200') >= 400);
  let errorMessage = '';
  if (errorRaw) {
    errorMessage = typeof errorRaw === 'string' ? errorRaw.split('\n')[0].slice(0, 200) : String(errorRaw);
  }

  const route = buildRoute(journeys);

  const entry: FlattenedSupplierEntry = {
    ipcc: row.ipcc || '',
    method: row.method || '',
    providerBrandedFaresCount: row.providerbrandedfarescount || row.provider_branded_fares_count || '',
    requestedAt: row.requestedat || row.requested_at || '',
    status: row.status || '',
    timeInMs: row.timeinms || row.time_in_ms || '',
    type,
    url: row.url || '',
    brandedFareId: row.brandedfareid || row.branded_fare_id || '',
    msFareId: row.msfareid || row.ms_fare_id || '',
    wegoRef: row.wegoref || row.wego_ref || '',
    orderId: row.orderid || row.order_id || '',
    itineraryRef: row.itineraryref || row.itinerary_ref || '',
    queueNumber: row.queuenumber || row.queue_number || '',
    hasError,
    errorMessage,
    timestamp: row.timestamp || '',
    date: row.date || '',

    route,
    summary: '',
    passengers,
    journeys,
    breakdown,
    seatMapInfo,
    ssrInfo,
    paymentInfo,
    commitInfo,

    _raw: row,
    _rawRequestBody: reqBody,
    _rawResponseBody: respBody,
  };

  entry.summary = buildSummary(entry);
  return entry;
}
