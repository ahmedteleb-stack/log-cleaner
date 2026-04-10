#!/usr/bin/env python3
"""
Wego Flight Booking Log Extractor
Parses a Wego API log CSV and produces a comprehensive JSON output
from the final confirmed booking state.
"""

import csv
import json
import re
import sys
import os
from typing import Any, Optional


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def unescape_responsebody(raw: str) -> str:
    """Convert CSV-escaped JSON (doubled double-quotes) back to valid JSON."""
    return raw.replace('""', '"')


def parse_responsebody(raw: str) -> Optional[dict]:
    """Parse an escaped JSON response body, return None on failure."""
    if not raw:
        return None
    try:
        return json.loads(unescape_responsebody(raw))
    except json.JSONDecodeError:
        return None


def parse_kvlist(text: str) -> dict:
    """
    Parse the non-JSON [{name=..., value=...}] format used by requestheaders
    and requestcookies into a plain dict {name: value, ...}.
    """
    result = {}
    if not text:
        return result
    # Each entry: {name=SOMETHING, value=SOMETHING_POSSIBLY_WITH_COMMAS}
    # We iterate matched pairs carefully
    pattern = re.compile(r'\{name=([^,}]+),\s*value=([^}]*)\}')
    for m in pattern.finditer(text):
        name = m.group(1).strip()
        value = m.group(2).strip()
        result[name] = value
    return result


def safe_get(d: Any, *keys, default=None):
    """Safely traverse nested dict/list structures."""
    current = d
    for key in keys:
        if current is None:
            return default
        if isinstance(current, dict):
            current = current.get(key)
        elif isinstance(current, list):
            try:
                current = current[key]
            except (IndexError, TypeError):
                return default
        else:
            return default
    return current if current is not None else default


# ─────────────────────────────────────────────────────────────────────────────
# CSV Loading
# ─────────────────────────────────────────────────────────────────────────────

COLUMNS = [
    'method', 'msfareid', 'paymentorderid', 'requestbody', 'requestcookies',
    'requestheaders', 'responsebody', 'statuscode', 'timestamp', 'url',
    'wegoref', 'error', 'querystring', 'brandedfareid', 'date'
]


def load_csv(filepath: str) -> list[dict]:
    rows = []
    with open(filepath, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(dict(row))
    return rows


# ─────────────────────────────────────────────────────────────────────────────
# Row Classification
# ─────────────────────────────────────────────────────────────────────────────

def is_booking_details_url(url: str) -> bool:
    """True if the URL is a booking details GET (the main booking state endpoint)."""
    return bool(re.search(r'/bookings/flights/[A-Z0-9]+$', url or ''))


def classify_rows(rows: list[dict]) -> dict:
    """
    Returns a dict with categorised rows:
      - booking_detail_rows: GET /bookings/flights/{ref} rows
      - status_rows: /status polls
      - anomaly_rows: any with error codes or AUTH_PENDING
      - all_rows: everything
    """
    booking_detail_rows = []
    status_rows = []
    anomaly_rows = []

    for row in rows:
        url = row.get('url', '')
        rb = parse_responsebody(row.get('responsebody', ''))

        # Booking detail rows (main state)
        if re.search(r'/bookings/flights/[A-Z0-9]+$', url or ''):
            booking_detail_rows.append(row)

        # Status poll rows
        if '/flights/status' in (url or ''):
            status_rows.append(row)

        # Anomaly detection
        if rb:
            response_code = rb.get('responseCode')
            payment_status = rb.get('paymentStatus')
            if response_code == 50000 or payment_status == 'AUTH_PENDING':
                anomaly_rows.append(row)

        # Also check error column
        error_val = row.get('error', '')
        if error_val and error_val.strip():
            anomaly_rows.append(row)

    return {
        'booking_detail_rows': booking_detail_rows,
        'status_rows': status_rows,
        'anomaly_rows': anomaly_rows,
        'all_rows': rows,
    }


def find_final_booking_row(booking_detail_rows: list[dict]) -> Optional[dict]:
    """
    Find the final confirmed booking row:
    Priority: paymentStatus=CAPTURED AND status=CONFIRMED
    Fallback: latest booking detail row
    """
    confirmed = []
    for row in booking_detail_rows:
        rb = parse_responsebody(row.get('responsebody', ''))
        if not rb:
            continue
        if rb.get('paymentStatus') == 'CAPTURED' and rb.get('status') == 'CONFIRMED':
            confirmed.append(row)

    if confirmed:
        # Pick the latest one by timestamp
        confirmed.sort(key=lambda r: r.get('timestamp', ''), reverse=True)
        return confirmed[0]

    # Fallback: latest booking detail
    if booking_detail_rows:
        booking_detail_rows.sort(key=lambda r: r.get('timestamp', ''), reverse=True)
        return booking_detail_rows[0]

    return None


# ─────────────────────────────────────────────────────────────────────────────
# Section Extractors
# ─────────────────────────────────────────────────────────────────────────────

def extract_booking_metadata(row: dict, rb: dict) -> dict:
    return {
        "bookingRef": rb.get("bookingRef"),
        "wegoOrderId": row.get("paymentorderid"),
        "status": rb.get("status"),
        "paymentStatus": rb.get("paymentStatus"),
        "refundType": rb.get("refundType"),
        "brandedFareCode": safe_get(rb, "itineraries", 0, "brandedfare", "code"),
        "brandedFareName": safe_get(rb, "itineraries", 0, "brandedfare", "name"),
        "brandedFareUUID": row.get("brandedfareid"),
        "tripId": safe_get(rb, "trip", "id"),
        "isFlightPortalBooking": rb.get("isFlightPortalBooking"),
        "createdAt": safe_get(rb, "payments", 0, "createdAt"),
        "lastSyncedAt": safe_get(rb, "partnerPnrStatuses", 0, "lastSyncedAt"),
    }


def extract_passengers(rb: dict) -> tuple[list[dict], dict]:
    passengers_raw = rb.get("passengers", [])
    contact_raw = rb.get("contact", {})

    passengers = []
    for p in passengers_raw:
        doc = p.get("document") or p.get("passengerDocument") or {}
        passengers.append({
            "id": p.get("id"),
            "type": p.get("type") or p.get("passengerType"),
            "titleType": p.get("titleType") or p.get("title"),
            "firstName": p.get("firstName"),
            "middleName": p.get("middleName"),
            "lastName": p.get("lastName"),
            "dateOfBirth": p.get("dateOfBirth") or p.get("birthday"),
            "nationality": p.get("nationality") or p.get("nationalityCountryCode"),
            "documentType": doc.get("type") or p.get("documentType"),
            "documentId": doc.get("number") or p.get("documentId") or p.get("documentNumber"),
            "passengerId": p.get("passengerId"),
            "frequentFlyers": p.get("frequentFlyers", []),
        })

    contact = {
        "email": contact_raw.get("email"),
        "phonePrefix": contact_raw.get("phonePrefix"),
        "phoneCountryCode": contact_raw.get("countryCode") or contact_raw.get("phoneCountryCode"),
        "phoneNumber": str(contact_raw.get("phoneNumber", "")) if contact_raw.get("phoneNumber") else None,
        "fullName": contact_raw.get("fullName"),
    }

    return passengers, contact


def extract_flight_segment(seg: dict) -> dict:
    return {
        "airlineRef": seg.get("airlineRef"),
        "marketingAirlineCode": seg.get("airlineCode") or seg.get("marketingAirlineCode"),
        "marketingFlightNumber": seg.get("designatorCode") or seg.get("flightNumber"),
        "marketingAirlineName": seg.get("airlineName") or seg.get("marketingAirlineName"),
        "cabin": seg.get("cabin"),
        "designatorCode": seg.get("designatorCode"),
        "brandedfare": seg.get("brandedfare", {}),
        "departureDateTime": seg.get("departureDateTime"),
        "arrivalDateTime": seg.get("arrivalDateTime"),
        "durationMinutes": seg.get("durationMinutes"),
        "overnight": seg.get("durationDays", 0) > 0 if seg.get("durationDays") is not None else None,
        "stopoverDurationMinutes": seg.get("stopoverDurationMinutes"),
        "departureAirportCode": seg.get("departureAirportCode"),
        "arrivalAirportCode": seg.get("arrivalAirportCode"),
        "departureAirportName": seg.get("departureAirportName"),
        "arrivalAirportName": seg.get("arrivalAirportName"),
        "departureCityName": seg.get("departureCityName"),
        "arrivalCityName": seg.get("arrivalCityName"),
        "departureCountryCode": seg.get("departureCountryCode"),
        "arrivalCountryCode": seg.get("arrivalCountryCode"),
        "departureTerminal": seg.get("departureTerminal"),
        "arrivalTerminal": seg.get("arrivalTerminal"),
        "aircraftType": seg.get("aircraftType"),
    }


def extract_leg(leg: dict) -> dict:
    segments = [extract_flight_segment(s) for s in leg.get("segments", [])]
    return {
        "legId": leg.get("id"),
        "status": leg.get("status"),
        "departureAirportCode": leg.get("departureAirportCode"),
        "departureAirportName": safe_get(leg, "segments", 0, "departureAirportName"),
        "departureCityCode": leg.get("departureCityCode"),
        "departureCityName": safe_get(leg, "segments", 0, "departureCityName"),
        "departureCountryCode": safe_get(leg, "segments", 0, "departureCountryCode"),
        "departureCountryName": safe_get(leg, "segments", 0, "departureCountryName"),
        "departureDateTime": leg.get("departureDateTime"),
        "departureDate": leg.get("departureDate"),
        "departureTime": leg.get("departureTime"),
        "arrivalAirportCode": leg.get("arrivalAirportCode"),
        "arrivalAirportName": safe_get(leg, "segments", -1, "arrivalAirportName"),
        "arrivalCityCode": leg.get("arrivalCityCode"),
        "arrivalCityName": safe_get(leg, "segments", -1, "arrivalCityName"),
        "arrivalCountryCode": safe_get(leg, "segments", -1, "arrivalCountryCode"),
        "arrivalCountryName": safe_get(leg, "segments", -1, "arrivalCountryName"),
        "arrivalDateTime": leg.get("arrivalDateTime"),
        "arrivalDate": leg.get("arrivalDate"),
        "arrivalTime": leg.get("arrivalTime"),
        "duration": leg.get("duration"),
        "durationMinutes": leg.get("durationMinutes"),
        "stopoversCount": leg.get("stopoversCount"),
        "airlineCodes": leg.get("airlineCodes", []),
        "allianceCodes": leg.get("allianceCodes", []),
        "stopoverAirportCodes": leg.get("stopoverAirportCodes", []),
        "scheduleChangeType": leg.get("scheduleChangeType"),
        "segments": segments,
    }


def extract_flights(rb: dict) -> dict:
    # Try itineraries[0].legs first (confirmed booking structure)
    legs_source = safe_get(rb, "itineraries", 0, "legs")

    # Fallback to trip.legs (fare comparison structure)
    if not legs_source:
        legs_source = safe_get(rb, "trip", "legs")

    if not legs_source:
        return {"outbound": None, "inbound": None}

    outbound = extract_leg(legs_source[0]) if len(legs_source) > 0 else None
    inbound = extract_leg(legs_source[1]) if len(legs_source) > 1 else None

    return {"outbound": outbound, "inbound": inbound}


def extract_price(rb: dict) -> dict:
    price_raw = safe_get(rb, "itineraries", 0, "price") or {}
    taxes_raw = price_raw.get("taxes", [])

    # Also check policy.taxDescs for richer tax data
    tax_descs = rb.get("policy", {}).get("taxDescs") or rb.get("taxDescs", [])

    taxes = []
    if taxes_raw:
        for t in taxes_raw:
            taxes.append({
                "code": t.get("code"),
                "description": t.get("description"),
                "amount": t.get("amount"),
                "amountUsd": t.get("amountUsd"),
                "currencyCode": t.get("currencyCode"),
            })
    elif tax_descs:
        for t in tax_descs:
            taxes.append({
                "id": t.get("id"),
                "code": t.get("code"),
                "description": t.get("description"),
                "amount": t.get("amount"),
                "amountUsd": t.get("amountUsd"),
                "currencyCode": t.get("currencyCode"),
            })

    payments_raw = rb.get("payments", [])
    payments = []
    for p in payments_raw:
        payments.append({
            "paymentMethodCode": p.get("paymentMethodCode"),
            "paymentMethodName": p.get("paymentMethodName"),
            "cardType": p.get("cardType"),
            "amountInCents": p.get("amountInCents"),
            "amount": p.get("amount"),
            "amountInUsd": p.get("amountInUsd"),
            "chargedAmount": p.get("chargedAmount"),
            "currencyCode": p.get("currencyCode"),
            "chargedCurrencyCode": p.get("chargedCurrencyCode"),
            "status": p.get("status"),
            "paymentFeeAmount": p.get("paymentFeeAmount"),
            "paymentFeeAmountInUsd": p.get("paymentFeeAmountInUsd"),
            "createdAt": p.get("createdAt"),
        })

    # Fallback price from order-level price field
    order_price = rb.get("price") or {}
    
    summary = {
        "userCurrencyCode": price_raw.get("currencyCode") or order_price.get("currencyCode"),
        "userTotalAmount": price_raw.get("userTotalAmount") or price_raw.get("totalAmount") or order_price.get("totalAmount"),
        "userBaseAmount": price_raw.get("userBaseAmount") or price_raw.get("totalOriginalAmount") or order_price.get("totalOriginalAmount"),
        "userTaxAmount": price_raw.get("userTaxAmount") or price_raw.get("totalTaxAmount") or order_price.get("totalTaxAmount"),
        "userBookingAmount": price_raw.get("userBookingAmount") or rb.get("totalAmount"),
        "userTotalBookingFee": price_raw.get("userTotalBookingFee") or price_raw.get("totalBookingFee") or order_price.get("totalBookingFee"),
        "totalAmountInUsd": price_raw.get("totalAmountInUsd") or order_price.get("totalAmountUsd"),
        "baseAmountInUsd": price_raw.get("baseAmountInUsd") or price_raw.get("totalOriginalAmountUsd") or order_price.get("totalOriginalAmountUsd"),
        "taxAmountInUsd": price_raw.get("taxAmountInUsd") or price_raw.get("totalTaxAmountUsd") or order_price.get("totalTaxAmountUsd"),
        "bookingAmountInUsd": price_raw.get("bookingAmountInUsd"),
        "totalBookingFeeInUsd": price_raw.get("totalBookingFeeInUsd") or price_raw.get("totalBookingFeeUsd") or order_price.get("totalBookingFeeUsd"),
    }

    return {
        "summary": summary,
        "taxes": taxes,
        "payment": payments,
    }


def extract_baggage(rb: dict) -> list[dict]:
    # Try policy.baggageDescs (confirmed booking)
    policy = rb.get("policy") or {}
    baggage_descs = policy.get("baggageDescs") or rb.get("baggageDescs", [])

    baggage = []
    for b in baggage_descs:
        baggage.append({
            "id": b.get("id"),
            "type": b.get("type"),
            "weight": b.get("weight"),
            "unit": b.get("unit"),
            "pieceCount": b.get("pieceCount"),
            "weightText": b.get("weightText"),
            "dimensionText": b.get("dimensionText"),
            "included": b.get("included"),
            "source": b.get("source"),
        })

    # Also extract branded fare baggage mapping
    branded_fare_baggage = None
    pass_infos = safe_get(rb, "itineraries", 0, "brandedfare", "passengerInfos")
    if pass_infos:
        branded_fare_baggage = pass_infos[0].get("baggages") if pass_infos else None

    return baggage, branded_fare_baggage


def extract_penalties(rb: dict) -> dict:
    policy = rb.get("policy") or {}
    fee_descs = policy.get("feeDescs") or rb.get("feeDescs", [])

    fees = []
    for f in fee_descs:
        fees.append({
            "id": f.get("id"),
            "type": f.get("type"),
            "amount": f.get("amount"),
        })

    # From itineraries[0].brandedfare.passengerInfos[0].fees (index into feeDescs)
    branded_fare_fees = []
    bf_pass_infos = safe_get(rb, "itineraries", 0, "brandedfare", "passengerInfos")
    if bf_pass_infos:
        raw_fees = bf_pass_infos[0].get("fees", [])
        # These are IDs referencing feeDescs
        fee_desc_map = {f.get("id"): f for f in fee_descs}
        for fee_id in raw_fees:
            if isinstance(fee_id, int):
                fd = fee_desc_map.get(fee_id)
                if fd:
                    branded_fare_fees.append({
                        "type": fd.get("type"),
                        "amount": fd.get("amount"),
                        "feeDescId": fee_id,
                    })
            elif isinstance(fee_id, dict):
                branded_fare_fees.append({
                    "type": fee_id.get("type"),
                    "amount": fee_id.get("amount"),
                    "amountInUsd": fee_id.get("amountInUsd"),
                })

    # Calculated penalties from brandedFares array
    calculated_penalties = []
    branded_fares = rb.get("brandedFares", [])
    for bf in branded_fares:
        bf_id = bf.get("id")
        bf_name = bf.get("brandName")
        for pi in bf.get("passengerInfos", []):
            for pen in pi.get("penalties", []):
                calculated_penalties.append({
                    "brandedFareId": bf_id,
                    "brandedFareName": bf_name,
                    "passengerType": pi.get("type"),
                    "type": pen.get("type"),
                    "amount": pen.get("amount"),
                    "amountUsd": pen.get("amountUsd"),
                    "currencyCode": pen.get("currencyCode"),
                    "conditionsApply": pen.get("conditionsApply"),
                })

    # Also get penalties directly on itinerary branded fare
    itinerary_penalties = []
    it_bf = safe_get(rb, "itineraries", 0, "brandedfare")
    if it_bf:
        for pen in it_bf.get("penalties", []):
            itinerary_penalties.append({
                "type": pen.get("type"),
                "amount": pen.get("amount"),
                "amountInUsd": pen.get("amountInUsd"),
                "currencyCode": pen.get("currencyCode"),
                "conditionsApply": pen.get("conditionsApply"),
            })

    return {
        "fees": fees,
        "branded_fare_fees": branded_fare_fees,
        "itinerary_penalties": itinerary_penalties,
        "calculated_penalties": calculated_penalties,
    }


def extract_fare_rules(rb: dict) -> str:
    """Extract fare rules text from policy.flightFareRules."""
    policy = rb.get("policy") or {}
    fare_rules = policy.get("flightFareRules", [])
    if not fare_rules:
        return None

    rules_text = []
    for rule in fare_rules:
        category = rule.get("category") or rule.get("categoryName") or ""
        text = rule.get("text") or rule.get("content") or ""
        if text:
            rules_text.append(f"[{category}]\n{text}" if category else text)

    # Also check termsAndConditionViews
    terms = rb.get("termsAndConditionViews", [])
    for t in terms:
        leg_id = t.get("legId")
        for tc in t.get("termsAndConditions", []):
            rules_text.append(f"[Leg {leg_id} T&C]: {tc}")

    return "\n\n".join(rules_text) if rules_text else None


def extract_pnr_status(rb: dict) -> dict:
    statuses = rb.get("partnerPnrStatuses", [])
    if not statuses:
        return None

    primary = statuses[0]
    segments = []
    for seg in primary.get("segments", []):
        segments.append({
            "departureAirportCode": seg.get("departureAirportCode"),
            "arrivalAirportCode": seg.get("arrivalAirportCode"),
            "marketingAirlineCode": seg.get("marketingAirlineCode"),
            "marketingFlightNumber": seg.get("marketingFlightNumber"),
            "statusLabel": seg.get("statusLabel"),
            "segmentTicketStatus": seg.get("segmentTicketStatus"),
            "hasScheduleChange": seg.get("hasScheduleChange"),
            "changeType": seg.get("changeType"),
            "scheduleChanges": seg.get("scheduleChanges", []),
        })

    return {
        "overallBookingStatus": primary.get("overallBookingStatus"),
        "overallTicketStatus": primary.get("overallTicketStatus"),
        "hasScheduleChange": primary.get("hasScheduleChange"),
        "lastSyncedAt": primary.get("lastSyncedAt"),
        "segments": segments,
    }


def extract_client_context(row: dict) -> dict:
    headers = parse_kvlist(row.get('requestheaders', ''))
    cookies = parse_kvlist(row.get('requestcookies', ''))

    # Build cookie dict (merge cookie header string if separate cookies not parsed)
    cookie_dict = dict(cookies)
    cookie_header = headers.get('Cookie', '')
    if cookie_header and not cookie_dict:
        # Parse Cookie header string
        for part in cookie_header.split(';'):
            part = part.strip()
            if '=' in part:
                k, v = part.split('=', 1)
                cookie_dict[k.strip()] = v.strip()

    context = {
        "Origin": headers.get('Origin'),
        "User-Agent": headers.get('User-Agent'),
        "X-Country-Code": headers.get('X-Country-Code'),
        "X-User-City": headers.get('X-User-City'),
        "X-Latitude": headers.get('X-Latitude'),
        "X-Longitude": headers.get('X-Longitude'),
        "x-requested-with": headers.get('x-requested-with'),
        "Referer": headers.get('Referer'),
        "CF-IPCountry": headers.get('CF-IPCountry'),
        "CF-Connecting-IP": headers.get('CF-Connecting-IP'),
        "cookies": cookie_dict,
    }
    return context


def extract_anomalies(rows: list[dict]) -> list[dict]:
    anomalies = []
    seen = set()

    for row in rows:
        rb = parse_responsebody(row.get('responsebody', ''))
        timestamp = row.get('timestamp', '')
        url = row.get('url', '')

        is_anomaly = False
        reason = []

        if rb:
            response_code = rb.get('responseCode')
            payment_status = rb.get('paymentStatus')
            error_msg = rb.get('errorMessage') or rb.get('message')

            if response_code == 50000:
                is_anomaly = True
                reason.append(f"responseCode: 50000")
            if payment_status == 'AUTH_PENDING':
                is_anomaly = True
                reason.append(f"paymentStatus: AUTH_PENDING")

            if is_anomaly:
                key = f"{timestamp}:{url}"
                if key not in seen:
                    seen.add(key)
                    anomalies.append({
                        "timestamp": timestamp,
                        "url": url,
                        "paymentStatus": payment_status,
                        "responseCode": response_code,
                        "errorMessage": error_msg,
                        "reasons": reason,
                    })

        error_val = row.get('error', '').strip()
        if error_val:
            key = f"{timestamp}:{url}:error"
            if key not in seen:
                seen.add(key)
                anomalies.append({
                    "timestamp": timestamp,
                    "url": url,
                    "paymentStatus": rb.get('paymentStatus') if rb else None,
                    "responseCode": rb.get('responseCode') if rb else None,
                    "errorMessage": error_val,
                    "reasons": ["error column non-empty"],
                })

    return anomalies


# ─────────────────────────────────────────────────────────────────────────────
# Main Extraction
# ─────────────────────────────────────────────────────────────────────────────

def extract_all(filepath: str) -> dict:
    rows = load_csv(filepath)
    classified = classify_rows(rows)

    booking_detail_rows = classified['booking_detail_rows']
    final_row = find_final_booking_row(booking_detail_rows)

    if not final_row:
        # Try any row with bookingRef and payment info
        for r in rows:
            rb = parse_responsebody(r.get('responsebody', ''))
            if rb and rb.get('bookingRef') and rb.get('status'):
                final_row = r
                break

    if not final_row:
        print("WARNING: No confirmed booking row found. Using first row with a parseable response body.")
        for r in rows:
            rb = parse_responsebody(r.get('responsebody', ''))
            if rb:
                final_row = r
                break

    rb = parse_responsebody(final_row.get('responsebody', '')) if final_row else {}

    # Determine the best client context row (prefer one with full headers)
    context_row = final_row
    for r in rows:
        if r.get('requestheaders') and len(r.get('requestheaders', '')) > 100:
            context_row = r
            break

    # Extract all sections
    booking_metadata = extract_booking_metadata(final_row, rb) if rb else {}
    passengers, contact = extract_passengers(rb) if rb else ([], {})
    flights = extract_flights(rb) if rb else {}
    price = extract_price(rb) if rb else {}
    baggage_list, branded_fare_baggage = extract_baggage(rb) if rb else ([], None)
    penalties = extract_penalties(rb) if rb else {}
    fare_rules = extract_fare_rules(rb) if rb else None
    pnr_status = extract_pnr_status(rb) if rb else None
    client_context = extract_client_context(context_row) if context_row else {}
    anomalies = extract_anomalies(rows)

    # Add branded fare baggage mapping to output
    if branded_fare_baggage is not None:
        penalties["branded_fare_baggage_mapping"] = branded_fare_baggage

    result = {
        "booking_metadata": booking_metadata,
        "passengers": passengers,
        "contact": contact,
        "flights": flights,
        "price": price,
        "baggage": baggage_list,
        "penalties": penalties,
        "fare_rules_summary": fare_rules,
        "pnr_status": pnr_status,
        "client_context": client_context,
        "anomalies": anomalies,
        "_extraction_meta": {
            "source_file": os.path.basename(filepath),
            "total_rows": len(rows),
            "booking_detail_rows_found": len(booking_detail_rows),
            "final_row_url": final_row.get('url') if final_row else None,
            "final_row_timestamp": final_row.get('timestamp') if final_row else None,
            "final_row_status_code": final_row.get('statuscode') if final_row else None,
            "booking_status": rb.get('status') if rb else None,
            "payment_status": rb.get('paymentStatus') if rb else None,
        }
    }

    return result


# ─────────────────────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    if len(sys.argv) < 2:
        # Default to the known CSV file
        csv_path = r'c:\Users\Ahmed.teleb\LogLens\log-cleaner\wego-fares-logs-WFSS3FMYYYT26.csv'
    else:
        csv_path = sys.argv[1]

    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    print(f"Processing: {csv_path}")
    result = extract_all(csv_path)

    json_output = json.dumps(result, indent=2, ensure_ascii=False)

    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(json_output)
        print(f"Output written to: {output_path}")
    else:
        # Write to a file next to the CSV
        base = os.path.splitext(csv_path)[0]
        out_file = base + '_extracted.json'
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(json_output)
        print(f"Output written to: {out_file}")

    # Print summary
    meta = result.get('_extraction_meta', {})
    print(f"\n--- Extraction Summary ---")
    print(f"Total CSV rows: {meta.get('total_rows')}")
    print(f"Booking detail rows found: {meta.get('booking_detail_rows_found')}")
    print(f"Final row URL: {meta.get('final_row_url')}")
    print(f"Booking status: {meta.get('booking_status')}")
    print(f"Payment status: {meta.get('payment_status')}")
    print(f"Anomalies detected: {len(result.get('anomalies', []))}")
    
    bm = result.get('booking_metadata', {})
    print(f"\nBooking Ref: {bm.get('bookingRef')}")
    print(f"WegoOrderId: {bm.get('wegoOrderId')}")
    print(f"Trip ID: {bm.get('tripId')}")
    
    fl = result.get('flights', {})
    ob = fl.get('outbound')
    ib = fl.get('inbound')
    if ob:
        print(f"\nOutbound: {ob.get('departureAirportCode')} → {ob.get('arrivalAirportCode')} on {ob.get('departureDateTime')}")
    if ib:
        print(f"Inbound: {ib.get('departureAirportCode')} → {ib.get('arrivalAirportCode')} on {ib.get('departureDateTime')}")
    
    price_summary = result.get('price', {}).get('summary', {})
    print(f"\nTotal Amount: {price_summary.get('userTotalAmount')} {price_summary.get('userCurrencyCode')}")
    print(f"Total USD: {price_summary.get('totalAmountInUsd')}")
