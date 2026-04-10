import { FlattenedFareEntry } from './faresParser';

export interface ActionMapping {
  icon: string;
  label: string;
  key: string;
}

const ACTION_MAP: { match: (url: string, method: string) => boolean; action: ActionMapping }[] = [
  { match: (u, m) => u.includes('/compare') && m === 'GET', action: { icon: '🔍', label: 'Fare Search', key: 'fare_search' } },
  { match: (u, m) => u.includes('/revalidate') && m === 'GET', action: { icon: '🎫', label: 'Selected Fare Brands', key: 'revalidate' } },
  { match: (u, m) => u.includes('/passenger-info') && m === 'POST', action: { icon: '👤', label: 'Entered Passenger Details', key: 'passenger_info' } },
  { match: (u, m) => u.includes('/seats-availability') && m === 'GET', action: { icon: '💺', label: 'Viewed Seats', key: 'seats_view' } },
  { match: (u, m) => u.includes('/assign-seats') && m === 'POST', action: { icon: '✅', label: 'Selected Seats', key: 'seats_select' } },
  { match: (u, m) => u.includes('/meals/availability') && m === 'GET', action: { icon: '🍽️', label: 'Viewed Meals', key: 'meals_view' } },
  { match: (u, m) => u.includes('/meals/assign') && m === 'POST', action: { icon: '✅', label: 'Selected Meals', key: 'meals_select' } },
  { match: (u, m) => u.includes('/baggages/availability') && m === 'GET', action: { icon: '🧳', label: 'Viewed Baggage', key: 'baggage_view' } },
  { match: (u, m) => u.includes('/baggages/assign') && m === 'POST', action: { icon: '✅', label: 'Added Baggage', key: 'baggage_add' } },
  { match: (u, m) => u.includes('/addons/insurance') && m === 'GET', action: { icon: '🛡️', label: 'Viewed Insurance', key: 'insurance_view' } },
  { match: (u, m) => u.includes('/addons/confirm') && m === 'POST', action: { icon: '✅', label: 'Purchased Insurance', key: 'insurance_confirm' } },
  { match: (u, m) => u.includes('/payments/options') && m === 'GET', action: { icon: '💳', label: 'Viewed Payment Methods', key: 'payment_options' } },
  { match: (u, m) => u.includes('/payments') && m === 'POST' && !u.includes('/options') && !u.includes('/order-data'), action: { icon: '💰', label: 'Initiated Payment', key: 'payment_init' } },
  { match: (u) => u.includes('/ancillaries') && !u.includes('/seats') && !u.includes('/meals') && !u.includes('/baggages') && !u.includes('/assign'), action: { icon: '📦', label: 'Checked Ancillaries', key: 'ancillaries' } },
  { match: (u) => u.includes('/status'), action: { icon: '📊', label: 'Checked Status', key: 'status' } },
  { match: (u) => u.includes('/order-data'), action: { icon: '📋', label: 'Order Data', key: 'order_data' } },
];

export function getAction(entry: FlattenedFareEntry): ActionMapping {
  for (const { match, action } of ACTION_MAP) {
    if (match(entry.endpoint, entry.method)) return action;
  }
  const fallback = entry.endpoint.split('/').pop() || 'Unknown';
  return { icon: '📄', label: fallback, key: fallback };
}

export function getAllActionKeys(): { key: string; label: string; icon: string }[] {
  return ACTION_MAP.map(m => m.action);
}

// Extract human-readable summary text from request/response bodies
export function extractSummary(entry: FlattenedFareEntry): string[] {
  const lines: string[] = [];
  const action = getAction(entry);
  const reqData = tryParse(entry._rawRequestBody);
  const respData = tryParse(entry._rawResponseBody);

  switch (action.key) {
    case 'fare_search': {
      if (respData?.brandedFares) {
        const fares = respData.brandedFares;
        const grouped = new Map<number, any[]>();
        for (const f of fares) {
          const leg = f.legId ?? 0;
          if (!grouped.has(leg)) grouped.set(leg, []);
          grouped.get(leg)!.push(f);
        }
        for (const [legId, frs] of grouped) {
          lines.push(`Leg ${legId}: ${frs.map((f: any) => `${f.brandName} (${Number(f.price?.totalAmount || 0).toLocaleString()} ${f.price?.currencyCode || ''})`).join(' · ')}`);
        }
      }
      if (respData?.trip?.legs) {
        for (const l of respData.trip.legs) {
          lines.push(`✈ ${l.departureAirportCode} → ${l.arrivalAirportCode} | ${(l.airlineCodes || []).join(',')} | ${l.departureTime || ''}`);
        }
      }
      break;
    }
    case 'revalidate': {
      if (entry.legs.length) {
        for (const l of entry.legs) {
          lines.push(`✈ ${l.departureAirportCode} → ${l.arrivalAirportCode} | ${l.airlineCodes.join(',')} | Dep ${l.departureTime}`);
        }
      }
      if (entry.totalPrice) {
        lines.push(`💰 Total: ${Number(entry.totalPrice).toLocaleString()} ${entry.currencyCode}`);
      }
      if (entry.priceChanged === 'true') {
        lines.push(`⚠️ Price changed: ${Number(entry.oldPrice).toLocaleString()} → ${Number(entry.newPrice).toLocaleString()} ${entry.currencyCode}`);
      }
      if (respData?.brandedFares) {
        lines.push(`Fare brands: ${respData.brandedFares.map((f: any) => f.brandName).join(', ')}`);
      }
      break;
    }
    case 'passenger_info': {
      if (reqData?.passengers) {
        for (const p of reqData.passengers) {
          const name = `${p.firstName} ${p.lastName}`.trim();
          lines.push(`👤 ${name} | ${p.gender} | DOB: ${p.dateOfBirth} | ${p.passengerDocument?.type}: ${p.passengerDocument?.number}`);
        }
      }
      if (reqData?.contact) {
        lines.push(`📧 ${reqData.contact.email} | 📱 +${reqData.contact.phonePrefix}${reqData.contact.phoneNumber}`);
      }
      if (reqData?.brandedFareIds) {
        lines.push(`Selected fare IDs: ${reqData.brandedFareIds.join(', ')}`);
      }
      break;
    }
    case 'seats_view': {
      if (respData?.passengers) {
        lines.push(`Passengers: ${respData.passengers.map((p: any) => `${p.firstName} ${p.lastName}`).join(', ')}`);
      }
      if (respData?.seatInfo) {
        for (const seg of respData.seatInfo) {
          const availCount = seg.seats?.length || 0;
          lines.push(`${seg.segmentId}: ${availCount} seats available`);
        }
      }
      break;
    }
    case 'seats_select': {
      if (reqData?.seatInfo) {
        for (const seg of reqData.seatInfo) {
          const segId = seg.segmentId || '';
          for (const s of seg.seats || []) {
            const name = formatPassengerId(s.passengerId);
            lines.push(`${segId}: ${name} → Seat ${s.seatNumber}`);
          }
        }
      }
      if (respData?.totalAmount) {
        lines.push(`💰 Seat cost: ${Number(respData.totalAmount).toLocaleString()} ${respData.currencyCode || ''}`);
      }
      break;
    }
    case 'meals_view': {
      if (respData?.segmentsMealInfo || respData?.mealInfo) {
        const segments = respData.segmentsMealInfo || respData.mealInfo || [];
        for (const seg of segments) {
          const mealCount = seg.meals?.length || seg.passengerMealInfo?.reduce((s: number, p: any) => s + (p.meals?.length || 0), 0) || 0;
          lines.push(`${seg.segmentId}: ${mealCount} meal options`);
        }
      }
      break;
    }
    case 'meals_select': {
      if (reqData?.segmentsMealInfo) {
        for (const seg of reqData.segmentsMealInfo) {
          for (const pax of seg.passengerMealInfo || []) {
            const name = formatPassengerId(pax.passengerId);
            const meals = (pax.meals || []).map((m: any) => m.mealCode).join(', ');
            lines.push(`${seg.segmentId}: ${name} → ${meals}`);
          }
        }
      }
      if (respData?.totalAmount) {
        lines.push(`💰 Meal cost: ${Number(respData.totalAmount).toLocaleString()} ${respData.currencyCode || ''}`);
      }
      break;
    }
    case 'baggage_view': {
      if (respData?.legBaggageInfo) {
        for (const leg of respData.legBaggageInfo) {
          const opts = leg.baggageOptions?.length || leg.passengerBaggageInfos?.length || 0;
          lines.push(`${leg.legId}: ${opts} baggage options`);
        }
      }
      break;
    }
    case 'baggage_add': {
      if (reqData?.legBaggageInfo) {
        for (const leg of reqData.legBaggageInfo) {
          for (const pax of leg.passengerBaggageInfos || []) {
            const name = formatPassengerId(pax.passengerId);
            for (const b of pax.baggages || []) {
              lines.push(`${leg.legId}: ${name} added ${b.weight}${b.unit} ${b.baggageType}`);
            }
          }
        }
      }
      if (respData?.totalAmount) {
        lines.push(`💰 Baggage cost: ${Number(respData.totalAmount).toLocaleString()} ${respData.currencyCode || ''}`);
      }
      break;
    }
    case 'insurance_view': {
      if (Array.isArray(respData)) {
        for (const ins of respData) {
          lines.push(`🛡️ ${ins.type}: ${ins.title || ins.uuid} — ${ins.price ? `${Number(ins.price.amount).toLocaleString()} ${ins.price.currencyCode}` : ''}`);
        }
      } else if (entry.insurancePackages.length) {
        for (const ins of entry.insurancePackages) {
          lines.push(`🛡️ ${ins.type}: ${ins.title} — ${ins.amount ? `${Number(ins.amount).toLocaleString()} ${ins.currency}` : ''}`);
        }
      }
      break;
    }
    case 'insurance_confirm': {
      if (reqData?.insurances) {
        lines.push(`Confirmed ${reqData.insurances.length} insurance package(s)`);
      }
      if (respData?.insurancePackages) {
        for (const ins of respData.insurancePackages) {
          lines.push(`🛡️ ${ins.type}: ${ins.title}`);
        }
      }
      if (respData?.totalAmount) {
        lines.push(`💰 Total with insurance: ${Number(respData.totalAmount).toLocaleString()} ${respData.currencyCode || ''}`);
      }
      break;
    }
    case 'payment_options': {
      if (entry.paymentMethods.length) {
        const zeroPct = entry.paymentMethods.filter(m => m.feePercentage === '0' || m.feePercentage === '0.0');
        lines.push(`${entry.paymentMethods.length} payment methods available`);
        if (zeroPct.length) {
          lines.push(`No-fee options: ${zeroPct.map(m => m.name).join(', ')}`);
        }
      }
      break;
    }
    case 'payment_init': {
      if (respData?.paymentMethodCode) {
        lines.push(`Method: ${respData.paymentMethodCode} (${respData.scheme || respData.cardType || ''})`);
      }
      if (respData?.totalAmountInCents) {
        lines.push(`💰 Charged: ${(respData.totalAmountInCents / 100).toLocaleString()} ${respData.currencyCode || ''}`);
      }
      if (respData?.bookingRef) {
        lines.push(`Booking: ${respData.bookingRef}`);
      }
      if (respData?.threeDsEnabled !== undefined) {
        lines.push(`3DS: ${respData.threeDsEnabled ? 'Enabled' : 'Disabled'}`);
      }
      break;
    }
    case 'ancillaries': {
      if (entry.ancillarySupport.length) {
        for (const a of entry.ancillarySupport) {
          const supported = [a.seatSupported && 'Seats', a.mealSupported && 'Meals', a.baggageSupported && 'Baggage'].filter(Boolean).join(', ');
          lines.push(`${a.legId}: ${supported || 'None'}`);
        }
      }
      break;
    }
    case 'status': {
      if (entry.bookingRef) lines.push(`Booking: ${entry.bookingRef}`);
      if (entry.responseCode) lines.push(`Status code: ${entry.responseCode}`);
      if (entry.expiredAt) lines.push(`Expires: ${new Date(entry.expiredAt).toLocaleString()}`);
      break;
    }
  }

  return lines;
}

function formatPassengerId(id: string): string {
  if (!id) return 'Unknown';
  // FAHADTALAL:AL:19820531 → FAHAD TALAL
  const parts = id.split(':');
  // Try to split camelcase-like name
  const raw = parts[0] || '';
  return raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)/g, ' $1').trim();
}

function tryParse(s: string): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
