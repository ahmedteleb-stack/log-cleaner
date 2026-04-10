<#
.SYNOPSIS  Wego Flight Log Extractor v3 - Fixed
#>
param(
    [string]$CsvPath = "wego-fares-logs-WFSS3FMYYYT26.csv",
    [string]$OutputPath = ""
)

$ErrorActionPreference = "SilentlyContinue"

function Parse-Json([string]$raw) {
    if (-not $raw -or $raw.Trim() -eq '') { return $null }
    try { return ($raw | ConvertFrom-Json) } catch { return $null }
}

function Parse-KVList([string]$text) {
    $r = @{}
    if (-not $text) { return $r }
    foreach ($m in [regex]::Matches($text, '\{name=([^,}]+),\s*value=([^}]*)\}')) {
        $r[$m.Groups[1].Value.Trim()] = $m.Groups[2].Value.Trim()
    }
    return $r
}

# Safe string: ensure we get a real string or $null
function S($v) {
    $s = "$v".Trim()
    if ($s -eq '' -or $s -eq '$null' -or $v -eq $null) { return $null }
    return $s
}

Write-Host "Loading: $CsvPath"
$rows = Import-Csv -Path $CsvPath -Encoding UTF8
Write-Host "Total rows: $($rows.Count)"

# Parse all rows
$parsed = @()
foreach ($row in $rows) {
    $rb = Parse-Json $row.responsebody
    $req = Parse-Json $row.requestbody
    $rbType = if ($rb) { $rb.GetType().Name } else { "null" }
    $parsed += [PSCustomObject]@{
        Row      = $row; URL = $row.url; Method = $row.method
        WegoRef  = $row.wegoref; PayOrderId = $row.paymentorderid; BFareId = $row.brandedfareid
        TS       = $row.timestamp; SC = $row.statuscode
        RB       = $rb; REQ = $req; RBType = $rbType
    }
}

$targetRef = "WFSS3FMYYYT26"

# ── Row classification ────────────────────────────────────────
# 1. Revalidate (latest, for trip+brandedFares) 
$revalRows   = $parsed | Where-Object { $_.URL -match 'v2/fare/revalidate' } | Sort-Object TS -Desc
$revalRow    = $revalRows[0]
# 2. Compare (fallback, has same structure)
$compareRows = $parsed | Where-Object { $_.URL -match 'v2/fare.*compare' } | Sort-Object TS -Desc
$compareRow  = $compareRows[0]
# Use revalidate if available, else compare
$fareRow     = if ($revalRow) { $revalRow } else { $compareRow }
$fareData    = $fareRow.RB  # Has: trip, taxDescs, baggageDescs, feeDescs, brandedFares, utaDescs, termsAndConditionViews

# 3. Status poll
$statusRow   = $parsed | Where-Object { $_.URL -match '/flights/status' -and $_.WegoRef -eq $targetRef } | Sort-Object TS -Desc | Select-Object -First 1
$statusData  = $statusRow.RB  # Has: bookingRef, itinerary(with airlineRef), responseCode, expiredAt

# 4. /passenger-info POST for WFSS (booking creation - has paymentOrderId + price)
$bookingRows = $parsed | Where-Object { $_.URL -match '/passenger-info' -and $_.WegoRef -eq $targetRef } | Sort-Object TS -Desc
$bookingRow  = $bookingRows[0]
$bookingData = $bookingRow.RB  # Has: paymentOrderId, bookingRef, totalAmount, price, createdAt, expiredAt

# 5. Passenger-info POST requestbody (passenger manifest + contact)
$passengerReq = $bookingRow.REQ  # Has: contact, passengers, brandedFareIds, fareId

# 6. Payment creation row
$paymentRow  = $parsed | Where-Object { $_.URL -match '/flights/payments$' -and $_.WegoRef -eq $targetRef } | Sort-Object TS -Desc | Select-Object -First 1
$payData     = $paymentRow.RB  # Has: orderId, bookingRef, currencyCode, totalAmountInCents, statusCode, etc.

# 7. Baggage availability  
$baggageRow  = $parsed | Where-Object { $_.URL -match '/baggages/availability' -and $_.WegoRef -eq $targetRef } | Sort-Object TS -Desc | Select-Object -First 1
$baggageData = $baggageRow.RB  # Has: bookingRef, passengers (with passengerId), baggageInfo

# Context for headers/cookies
$contextRow  = $parsed | Where-Object { $_.URL -match '/passenger-info' -and $_.WegoRef -eq $targetRef } | Sort-Object TS | Select-Object -First 1
if (-not $contextRow) { $contextRow = $parsed[0] }

# ── Key data objects ──────────────────────────────────────────
$trip         = $fareData.trip              # trip.id, trip.legs[], trip.isDomestic
$taxDescs     = $fareData.taxDescs          # array of {id, code, description, amount, amountUsd, currencyCode}
$baggageDescs = $fareData.baggageDescs      # array of {id, type, weight, unit, pieceCount, included, source}
$feeDescs     = $fareData.feeDescs          # array of {id, type, amount}
$brandedFares = $fareData.brandedFares      # array of branded fare objects
$utaDescs     = $fareData.utaDescs
$tcViews      = $fareData.termsAndConditionViews

# brandedFareIds from booking request
$bfIds = @()
if ($passengerReq -and $passengerReq.brandedFareIds) { $bfIds = $passengerReq.brandedFareIds }

Write-Host "brandedFareIds requested: $($bfIds -join ', ')"

# Find matching branded fares
$leg1BF = $null; $leg2BF = $null
foreach ($bf in $brandedFares) {
    if ($bfIds -contains $bf.id) {
        if ($bf.legId -eq 1) { $leg1BF = $bf }
        elseif ($bf.legId -eq 2) { $leg2BF = $bf }
    }
}

Write-Host "Leg1 BF: $($leg1BF.id) = $($leg1BF.brandName)"
Write-Host "Leg2 BF: $($leg2BF.id) = $($leg2BF.brandName)"

# PNR airlineRef map from status itinerary
$airlineRefMap = @{}
if ($statusData -and $statusData.itinerary -and $statusData.itinerary.legs) {
    foreach ($leg in $statusData.itinerary.legs) {
        foreach ($seg in $leg.segments) {
            if ($seg.airlineRef) {
                $k = "$($seg.departureAirportCode):$($seg.arrivalAirportCode)"
                $airlineRefMap[$k] = $seg.airlineRef
            }
        }
    }
}

# ────────────────────────────────────────────────────────────────────────────
# 1. BOOKING METADATA
# ────────────────────────────────────────────────────────────────────────────

$paymentOrderId  = S($bookingData.paymentOrderId)
$bookingCreatedAt = S($bookingData.createdAt)
$bookingExpiredAt = S($bookingData.expiredAt)
if (-not $bookingExpiredAt -and $statusData) { $bookingExpiredAt = S($statusData.expiredAt) }

$payStatusCode = $null
if ($payData) {
    $payStatusCode = S($payData.statusCode)
}

$bookingStatus = "PENDING"
if ($statusData -and $statusData.responseCode -eq 10000) { $bookingStatus = "CONFIRMED" }

$booking_metadata = [ordered]@{
    bookingRef              = $targetRef
    wegoOrderId             = $paymentOrderId
    status                  = $bookingStatus
    paymentStatus           = if ($payStatusCode) { $payStatusCode } else { "PENDING" }
    refundType              = if ($leg1BF) { S($leg1BF.refundType) } else { $null }
    brandedFareCodeLeg1     = if ($leg1BF) { S($leg1BF.id) } else { $null }
    brandedFareNameLeg1     = if ($leg1BF) { S($leg1BF.brandName) } else { $null }
    brandedFareCodeLeg2     = if ($leg2BF) { S($leg2BF.id) } else { $null }
    brandedFareNameLeg2     = if ($leg2BF) { S($leg2BF.brandName) } else { $null }
    brandedFareUUIDs        = $bfIds
    tripId                  = if ($trip) { S($trip.id) } else { $null }
    isFlightPortalBooking   = $false
    createdAt               = $bookingCreatedAt
    expiredAt               = $bookingExpiredAt
    lastSyncedAt            = $null
    statusPollResponseCode  = if ($statusData) { $statusData.responseCode } else { $null }
}

# ────────────────────────────────────────────────────────────────────────────
# 2. PASSENGERS + CONTACT
# ────────────────────────────────────────────────────────────────────────────

$passengers = @()
if ($passengerReq -and $passengerReq.passengers) {
    foreach ($p in $passengerReq.passengers) {
        $doc = $p.passengerDocument
        $pid = $null
        # Try to get passengerId from baggage ancillary response
        if ($baggageData -and $baggageData.passengers) {
            $matchP = $baggageData.passengers | Where-Object { 
                S($_.firstName) -eq S($p.firstName) -and S($_.lastName) -eq S($p.lastName) 
            } | Select-Object -First 1
            if ($matchP) { $pid = S($matchP.passengerId) }
        }
        $passengers += [ordered]@{
            id              = $null
            type            = S($p.type)
            gender          = S($p.gender)
            firstName       = S($p.firstName)
            middleName      = $null
            lastName        = S($p.lastName)
            dateOfBirth     = S($p.dateOfBirth)
            nationality     = S($p.nationalityCountryCode)
            documentType    = if ($doc) { S($doc.type) } else { $null }
            documentId      = if ($doc) { S($doc.number) } else { $null }
            documentExpiry  = if ($doc) { S($doc.expiryDate) } else { $null }
            passengerId     = $pid
            frequentFlyers  = @()
        }
    }
}

$contact = $null
if ($passengerReq -and $passengerReq.contact) {
    $c = $passengerReq.contact
    $contact = [ordered]@{
        email           = S($c.email)
        phonePrefix     = [int]$c.phonePrefix
        phoneCountryCode = S($c.countryCode)
        phoneNumber     = "$($c.phoneNumber)"
        fullName        = S($c.fullName)
    }
}

# ────────────────────────────────────────────────────────────────────────────
# 3. FLIGHTS
# ────────────────────────────────────────────────────────────────────────────

function Build-Segment($seg, $airlineRefMap) {
    $k = "$($seg.departureAirportCode):$($seg.arrivalAirportCode)"
    return [ordered]@{
        airlineRef              = if ($airlineRefMap[$k]) { $airlineRefMap[$k] } else { $null }
        marketingAirlineCode    = S($seg.airlineCode)
        marketingFlightNumber   = S($seg.designatorCode)
        marketingAirlineName    = S($seg.airlineName)
        cabin                   = S($seg.cabin)
        designatorCode          = S($seg.designatorCode)
        departureDateTime       = S($seg.departureDateTime)
        arrivalDateTime         = S($seg.arrivalDateTime)
        durationMinutes         = $seg.durationMinutes
        overnight               = [bool]($seg.durationDays -gt 0)
        stopoverDurationMinutes = $seg.stopoverDurationMinutes
        stopoverDuration        = S($seg.stopoverDuration)
        departureAirportCode    = S($seg.departureAirportCode)
        departureAirportName    = S($seg.departureAirportName)
        departureCityName       = S($seg.departureCityName)
        departureCountryCode    = S($seg.departureCountryCode)
        departureDate           = S($seg.departureDate)
        departureTime           = S($seg.departureTime)
        departureTerminal       = S($seg.departureTerminal)
        arrivalAirportCode      = S($seg.arrivalAirportCode)
        arrivalAirportName      = S($seg.arrivalAirportName)
        arrivalCityName         = S($seg.arrivalCityName)
        arrivalCountryCode      = S($seg.arrivalCountryCode)
        arrivalDate             = S($seg.arrivalDate)
        arrivalTime             = S($seg.arrivalTime)
        arrivalTerminal         = S($seg.arrivalTerminal)
        aircraftType            = S($seg.aircraftType)
        allianceCode            = S($seg.allianceCode)
    }
}

function Build-Leg($leg, $airlineRefMap) {
    $segs = @()
    if ($leg.segments) { foreach ($s in $leg.segments) { $segs += Build-Segment $s $airlineRefMap } }
    $first = if ($segs.Count -gt 0) { $segs[0] } else { $null }
    $last  = if ($segs.Count -gt 0) { $segs[$segs.Count-1] } else { $null }
    return [ordered]@{
        legId                   = $leg.id
        status                  = $null
        departureAirportCode    = if ($first) { $first.departureAirportCode } else { $null }
        departureAirportName    = if ($first) { $first.departureAirportName } else { $null }
        departureCityCode       = $null
        departureCityName       = if ($first) { $first.departureCityName } else { $null }
        departureCountryCode    = if ($first) { $first.departureCountryCode } else { $null }
        departureDateTime       = S($leg.departureDateTime)
        departureDate           = S($leg.departureDate)
        departureTime           = S($leg.departureTime)
        arrivalAirportCode      = if ($last) { $last.arrivalAirportCode } else { $null }
        arrivalAirportName      = if ($last) { $last.arrivalAirportName } else { $null }
        arrivalCityCode         = $null
        arrivalCityName         = if ($last) { $last.arrivalCityName } else { $null }
        arrivalCountryCode      = if ($last) { $last.arrivalCountryCode } else { $null }
        arrivalDateTime         = S($leg.arrivalDateTime)
        arrivalDate             = S($leg.arrivalDate)
        arrivalTime             = S($leg.arrivalTime)
        duration                = S($leg.duration)
        durationMinutes         = $leg.durationMinutes
        stopoversCount          = $leg.stopoversCount
        airlineCodes            = if ($leg.airlineCodes) { @($leg.airlineCodes) } else { @() }
        allianceCodes           = if ($leg.allianceCodes) { @($leg.allianceCodes) } else { @() }
        stopoverAirportCodes    = if ($leg.stopoverAirportCodes) { @($leg.stopoverAirportCodes) } else { @() }
        overnight               = [bool]$leg.overnight
        scheduleChangeType      = S($leg.scheduleChangeType)
        stopoverDurationMinutes = $leg.stopoverDurationMinutes
        segments                = $segs
    }
}

$tripLegs = @()
if ($trip -and $trip.legs) { $tripLegs = $trip.legs }

$outbound = $null; $inbound = $null
if ($tripLegs.Count -ge 1) { $outbound = Build-Leg $tripLegs[0] $airlineRefMap }
if ($tripLegs.Count -ge 2) { $inbound  = Build-Leg $tripLegs[1] $airlineRefMap }

# Add branded fare details to legs
if ($outbound -and $leg1BF) { $outbound['brandedFare'] = [ordered]@{ id=$leg1BF.id; name=$leg1BF.brandName; refundType=$leg1BF.refundType } }
if ($inbound  -and $leg2BF) { $inbound['brandedFare']  = [ordered]@{ id=$leg2BF.id; name=$leg2BF.brandName; refundType=$leg2BF.refundType } }

# ────────────────────────────────────────────────────────────────────────────
# 4. PRICE AND PAYMENT
# ────────────────────────────────────────────────────────────────────────────

$combPrice = $bookingData.price
$leg1PI    = if ($leg1BF -and $leg1BF.passengerInfos) { $leg1BF.passengerInfos[0] } else { $null }
$leg2PI    = if ($leg2BF -and $leg2BF.passengerInfos) { $leg2BF.passengerInfos[0] } else { $null }
$leg1Price = if ($leg1PI) { $leg1PI.price } else { $null }
$leg2Price = if ($leg2PI) { $leg2PI.price } else { $null }

$totalSAR = $null; $totalUSD = $null
if ($combPrice -and $combPrice.totalAmount) { $totalSAR = [double]$combPrice.totalAmount }
elseif ($bookingData -and $bookingData.totalAmount) { $totalSAR = [double]$bookingData.totalAmount }
if ($combPrice -and $combPrice.totalAmountUsd) { $totalUSD = [double]$combPrice.totalAmountUsd }

# Tax list
$taxList = @()
if ($taxDescs) {
    foreach ($t in $taxDescs) {
        $taxList += [ordered]@{
            id          = $t.id
            code        = S($t.code)
            description = S($t.description)
            amount      = [double]$t.amount
            amountUsd   = [double]$t.amountUsd
            currencyCode = S($t.currencyCode)
        }
    }
}

# Taxes assigned to each leg branded fare (by id reference)
function Get-TaxRefs($piObj, $taxDescs) {
    $result = @()
    if (-not $piObj -or -not $piObj.taxes) { return $result }
    $tdMap = @{}; foreach ($t in $taxDescs) { $tdMap[[int]$t.id] = $t }
    foreach ($tid in $piObj.taxes) {
        $t = $tdMap[[int]$tid]
        if ($t) { $result += [ordered]@{ id=$t.id; code=S($t.code); description=S($t.description); amount=[double]$t.amount; amountUsd=[double]$t.amountUsd } }
    }
    return $result
}

$leg1Taxes = Get-TaxRefs $leg1PI $taxDescs
$leg2Taxes = Get-TaxRefs $leg2PI $taxDescs

# Payment
$paymentsOut = @()
if ($payData) {
    $cents = $payData.totalAmountInCents
    $amt   = if ($cents) { [math]::Round([double]$cents / 100, 2) } else { $null }
    $paymentsOut += [ordered]@{
        paymentMethodCode   = S($payData.paymentMethodCode)
        paymentMethodName   = $null
        cardType            = $null
        amountInCents       = $cents
        amount              = $amt
        amountInUsd         = $null
        chargedAmount       = $null
        currencyCode        = S($payData.currencyCode)
        chargedCurrencyCode = S($payData.currencyCode)
        status              = S($payData.statusCode)
        paymentFeeAmount    = $null
        paymentFeeAmountInUsd = $null
        createdAt           = S($payData.createdAt)
        orderId             = S($payData.orderId)
        id                  = S($payData.id)
        threeDsEnabled      = [bool]$payData.threeDsEnabled
        redirectLink        = S($payData.redirectLink)
        bookingExpiredAt    = S($payData.bookingExpiredAt)
    }
}

$priceSummary = [ordered]@{
    userCurrencyCode        = "SAR"
    userTotalAmount         = $totalSAR
    userTotalAmountRaw      = if ($bookingData) { $bookingData.totalAmount } else { $null }
    userBaseAmountLeg1      = if ($leg1Price) { [double]$leg1Price.totalOriginalAmount } else { $null }
    userBaseAmountLeg2      = if ($leg2Price) { [double]$leg2Price.totalOriginalAmount } else { $null }
    userTaxAmountLeg1       = if ($leg1Price) { [double]$leg1Price.totalTaxAmount } else { $null }
    userTaxAmountLeg2       = if ($leg2Price) { [double]$leg2Price.totalTaxAmount } else { $null }
    userBookingFeeTotal     = if ($combPrice -and $combPrice.totalBookingFee) { [double]$combPrice.totalBookingFee } else { 0.0 }
    totalAmountInUsd        = $totalUSD
    baseAmountLeg1Usd       = if ($leg1Price) { [double]$leg1Price.totalOriginalAmountUsd } else { $null }
    baseAmountLeg2Usd       = if ($leg2Price) { [double]$leg2Price.totalOriginalAmountUsd } else { $null }
    taxAmountLeg1Usd        = if ($leg1Price) { [double]$leg1Price.totalTaxAmountUsd } else { $null }
    taxAmountLeg2Usd        = if ($leg2Price) { [double]$leg2Price.totalTaxAmountUsd } else { $null }
    totalInsuranceAmount    = if ($combPrice -and $combPrice.totalInsuranceAmount) { [double]$combPrice.totalInsuranceAmount } else { 0.0 }
    totalSeatAmount         = if ($combPrice -and $combPrice.totalSeatAmount) { [double]$combPrice.totalSeatAmount } else { 0.0 }
    totalMealAmount         = if ($combPrice -and $combPrice.totalMealAmount) { [double]$combPrice.totalMealAmount } else { 0.0 }
    priceInfo               = $fareData.priceInfo
    leg1BrandedFarePrice    = $leg1Price
    leg2BrandedFarePrice    = $leg2Price
    leg1Taxes               = $leg1Taxes
    leg2Taxes               = $leg2Taxes
}

$price = [ordered]@{ summary = $priceSummary; taxes = $taxList; payment = $paymentsOut }

# ────────────────────────────────────────────────────────────────────────────
# 5. BAGGAGE
# ────────────────────────────────────────────────────────────────────────────

$baggageList = @()
if ($baggageDescs) {
    foreach ($b in $baggageDescs) {
        $baggageList += [ordered]@{
            id            = $b.id
            type          = S($b.type)
            weight        = if ($b.weight -ne $null) { [int]$b.weight } else { $null }
            unit          = S($b.unit)
            pieceCount    = if ($b.pieceCount -ne $null) { [int]$b.pieceCount } else { $null }
            weightText    = $null
            dimensionText = $null
            included      = [bool]$b.included
            source        = S($b.source)
        }
    }
}

# Branded fare baggage mapping (baggages are arrays of leg segment baggage IDs)
$bfBaggageMap = [ordered]@{}
if ($leg1PI -and $leg1PI.baggages) { $bfBaggageMap['leg1_VALUE_baggageIds'] = $leg1PI.baggages }
if ($leg2PI -and $leg2PI.baggages) { $bfBaggageMap['leg2_ECONOMY_COMFORT_baggageIds'] = $leg2PI.baggages }

# Ancillary baggage check result
$ancillaryBaggage = $null
if ($baggageData -and $baggageData.baggageInfo) { $ancillaryBaggage = $baggageData.baggageInfo }

# Airline baggage disclaimers
$airlineDisclaimers = $null
if ($fareData -and $fareData.airlineDisclaimerDescs) { $airlineDisclaimers = $fareData.airlineDisclaimerDescs }

# ────────────────────────────────────────────────────────────────────────────
# 6. PENALTIES AND FEES
# ────────────────────────────────────────────────────────────────────────────

$fees = @()
if ($feeDescs) {
    foreach ($f in $feeDescs) {
        $fees += [ordered]@{ id = $f.id; type = S($f.type); amount = [double]$f.amount }
    }
}

# Branded fare level penalties
$directPenalties = @()
foreach ($bf in @($leg1BF, $leg2BF) | Where-Object { $_ }) {
    if ($bf.penalties) {
        foreach ($pen in $bf.penalties) {
            $directPenalties += [ordered]@{
                brandedFareId   = S($bf.id)
                brandedFareName = S($bf.brandName)
                legId           = $bf.legId
                type            = S($pen.type)
                amount          = if ($pen.amount -ne $null) { [double]$pen.amount } else { $null }
                amountUsd       = if ($pen.amountUsd -ne $null) { [double]$pen.amountUsd } else { $null }
                currencyCode    = S($pen.currencyCode)
                conditionsApply = [bool]$pen.conditionsApply
            }
        }
    }
}

# Passenger-info level penalties
$passengerPenalties = @()
foreach ($bf in @($leg1BF, $leg2BF) | Where-Object { $_ }) {
    if ($bf.passengerInfos) {
        foreach ($pi3 in $bf.passengerInfos) {
            if ($pi3.penalties) {
                foreach ($pen in $pi3.penalties) {
                    $passengerPenalties += [ordered]@{
                        brandedFareId   = S($bf.id)
                        brandedFareName = S($bf.brandName)
                        legId           = $bf.legId
                        passengerType   = S($pi3.type)
                        type            = S($pen.type)
                        amount          = if ($pen.amount -ne $null) { [double]$pen.amount } else { $null }
                        amountUsd       = if ($pen.amountUsd -ne $null) { [double]$pen.amountUsd } else { $null }
                        currencyCode    = S($pen.currencyCode)
                        conditionsApply = [bool]$pen.conditionsApply
                    }
                }
            }
        }
    }
}

# Fees reference from passenger info
$bfFees = @()
$feeDescMap = @{}; if ($feeDescs) { foreach ($f in $feeDescs) { $feeDescMap[[int]$f.id] = $f } }
foreach ($pi3 in @($leg1PI, $leg2PI) | Where-Object { $_ }) {
    if ($pi3.fees -is [array]) {
        foreach ($fid in $pi3.fees) {
            $fd = $feeDescMap[[int]$fid]
            if ($fd) { $bfFees += [ordered]@{ type = S($fd.type); amount = [double]$fd.amount; feeDescId = [int]$fid } }
        }
    }
}

$penalties = [ordered]@{
    fees                        = $fees
    branded_fare_direct_penalties = $directPenalties
    passenger_level_penalties   = $passengerPenalties
    branded_fare_fee_refs       = $bfFees
    branded_fare_baggage_ids    = $bfBaggageMap
    ancillary_baggage_check     = $ancillaryBaggage
}

# ────────────────────────────────────────────────────────────────────────────
# 7. FARE RULES SUMMARY
# ────────────────────────────────────────────────────────────────────────────

$fareRulesLines = @()

# Terms & Conditions per leg
if ($tcViews) {
    foreach ($t in $tcViews) {
        $lid = $t.legId
        if ($t.termsAndConditions -and $t.termsAndConditions.Count -gt 0) {
            $fareRulesLines += "--- Leg $lid Terms & Conditions ---"
            foreach ($tc in $t.termsAndConditions) { $fareRulesLines += "  $tc" }
            $fareRulesLines += ""
        }
    }
}

# UTAs (policy attributes: baggage, change, cancellation policies, lounge)
if ($utaDescs) {
    $fareRulesLines += "--- Policy Attributes (UTAs) ---"
    foreach ($u in $utaDescs) {
        $attrStr = ""
        if ($u.attributes) {
            $parts = @()
            $u.attributes.PSObject.Properties | ForEach-Object { $parts += "$($_.Name)=$($_.Value)" }
            $attrStr = " [$($parts -join ', ')]"
        }
        $fareRulesLines += "  ID=$($u.id) type=$($u.type) key=$($u.key) code=$($u.code)$attrStr"
    }
}

$fare_rules_summary = if ($fareRulesLines.Count -gt 0) { $fareRulesLines -join "`n" } else { $null }

# ────────────────────────────────────────────────────────────────────────────
# 8. PNR STATUS
# ────────────────────────────────────────────────────────────────────────────

$pnr_status = $null
if ($statusData) {
    $itinSegs = @()
    if ($statusData.itinerary -and $statusData.itinerary.legs) {
        foreach ($leg in $statusData.itinerary.legs) {
            foreach ($seg in $leg.segments) {
                $itinSegs += [ordered]@{
                    departureAirportCode  = S($seg.departureAirportCode)
                    arrivalAirportCode    = S($seg.arrivalAirportCode)
                    airlineRef            = S($seg.airlineRef)
                    isTechnicalStop       = [bool]$seg.isTechnicalStop
                    marketingAirlineCode  = $null
                    marketingFlightNumber = $null
                    statusLabel           = $null
                    segmentTicketStatus   = $null
                    hasScheduleChange     = $null
                    changeType            = $null
                    scheduleChanges       = @()
                }
            }
        }
    }
    $pnr_status = [ordered]@{
        overallBookingStatus  = if ($statusData.responseCode -eq 10000) { "CONFIRMED" } else { "UNKNOWN" }
        overallTicketStatus   = $null
        hasScheduleChange     = $false
        lastSyncedAt          = $null
        expiredAt             = S($statusData.expiredAt)
        responseCode          = $statusData.responseCode
        paymentExtension      = $statusData.paymentExtension
        itinerarySegments     = $itinSegs
    }
}

# ────────────────────────────────────────────────────────────────────────────
# 9. CLIENT CONTEXT
# ────────────────────────────────────────────────────────────────────────────

$headers = Parse-KVList $contextRow.Row.requestheaders
$cookies = Parse-KVList $contextRow.Row.requestcookies
if ($cookies.Count -eq 0 -and $headers['Cookie']) {
    foreach ($part in $headers['Cookie'] -split ';') {
        $part = $part.Trim()
        if ($part -match '^([^=]+)=(.*)$') { $cookies[$Matches[1].Trim()] = $Matches[2].Trim() }
    }
}

$client_context = [ordered]@{
    "Origin"           = S($headers['Origin'])
    "User-Agent"       = S($headers['User-Agent'])
    "X-Country-Code"   = S($headers['X-Country-Code'])
    "X-User-City"      = S($headers['X-User-City'])
    "X-Latitude"       = S($headers['X-Latitude'])
    "X-Longitude"      = S($headers['X-Longitude'])
    "x-requested-with" = S($headers['x-requested-with'])
    "Referer"          = S($headers['Referer'])
    "CF-IPCountry"     = S($headers['CF-IPCountry'])
    "CF-Connecting-IP" = S($headers['CF-Connecting-IP'])
    "cookies"          = $cookies
}

# ────────────────────────────────────────────────────────────────────────────
# 10. ANOMALIES
# ────────────────────────────────────────────────────────────────────────────

$anomalies = @()
$seen = @{}
foreach ($pr in $parsed) {
    $rb2 = $pr.RB
    if ($rb2 -and -not ($rb2 -is [array])) {
        $rc = $rb2.responseCode; $ps = $rb2.paymentStatus
        $msg = if ($rb2.errorMessage) { S($rb2.errorMessage) } elseif ($rb2.message) { S($rb2.message) } else { $null }
        $reasons = @()
        if ($rc -eq 50000) { $reasons += "responseCode=50000" }
        if ($ps -eq 'AUTH_PENDING') { $reasons += "paymentStatus=AUTH_PENDING" }
        if ($reasons.Count -gt 0) {
            $key = "$($pr.TS):$($pr.URL)"
            if (-not $seen[$key]) {
                $seen[$key] = $true
                $anomalies += [ordered]@{ timestamp=$pr.TS; url=$pr.URL; paymentStatus=S($ps); responseCode=$rc; errorMessage=$msg; reasons=$reasons }
            }
        }
    }
    $errVal = $pr.Row.error
    if ($errVal -and $errVal.Trim()) {
        $key = "$($pr.TS):$($pr.URL):error"
        if (-not $seen[$key]) {
            $seen[$key] = $true
            $anomalies += [ordered]@{ timestamp=$pr.TS; url=$pr.URL; paymentStatus=$null; responseCode=$null; errorMessage=$errVal.Trim(); reasons=@("error column non-empty") }
        }
    }
}

# ────────────────────────────────────────────────────────────────────────────
# ASSEMBLE + WRITE
# ────────────────────────────────────────────────────────────────────────────

$output = [ordered]@{
    booking_metadata   = $booking_metadata
    passengers         = $passengers
    contact            = $contact
    flights            = [ordered]@{ outbound = $outbound; inbound = $inbound }
    price              = $price
    baggage            = $baggageList
    airline_disclaimers = $airlineDisclaimers
    penalties          = $penalties
    fare_rules_summary = $fare_rules_summary
    pnr_status         = $pnr_status
    client_context     = $client_context
    anomalies          = $anomalies
    _extraction_meta   = [ordered]@{
        source_file           = (Split-Path $CsvPath -Leaf)
        total_rows            = $rows.Count
        target_booking_ref    = $targetRef
        extraction_timestamp  = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        data_sources          = [ordered]@{
            fare_data_url    = $fareRow.URL;     fare_data_ts     = $fareRow.TS
            status_url       = $statusRow.URL;   status_ts        = $statusRow.TS
            booking_post_url = $bookingRow.URL;  booking_post_ts  = $bookingRow.TS
            payment_url      = if ($paymentRow) { $paymentRow.URL } else { $null }; payment_ts = if ($paymentRow) { $paymentRow.TS } else { $null }
        }
        note = "This CSV contains pre-confirmation booking flow logs. Final CONFIRMED+CAPTURED state not present. Status CONFIRMED inferred from /flights/status responseCode=10000."
    }
}

if (-not $OutputPath) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($CsvPath)
    $dir  = [System.IO.Path]::GetDirectoryName((Resolve-Path $CsvPath))
    $OutputPath = Join-Path $dir "${base}_extracted.json"
}

[System.IO.File]::WriteAllText($OutputPath, ($output | ConvertTo-Json -Depth 30), [System.Text.Encoding]::UTF8)
Write-Host "Output: $OutputPath"

Write-Host ""
Write-Host "===== EXTRACTION SUMMARY ====="
Write-Host "Booking Ref      : $($booking_metadata.bookingRef)"
Write-Host "WegoOrderId      : $($booking_metadata.wegoOrderId)"
Write-Host "Trip ID          : $($booking_metadata.tripId)"
Write-Host "Status           : $($booking_metadata.status)"
Write-Host "Payment Status   : $($booking_metadata.paymentStatus)"
Write-Host "Leg1 BrandedFare : $($booking_metadata.brandedFareNameLeg1)"
Write-Host "Leg2 BrandedFare : $($booking_metadata.brandedFareNameLeg2)"
if ($outbound) { Write-Host "Outbound         : $($outbound.departureAirportCode) -> $($outbound.arrivalAirportCode) ($($outbound.departureDateTime))" }
if ($inbound)  { Write-Host "Inbound          : $($inbound.departureAirportCode) -> $($inbound.arrivalAirportCode) ($($inbound.departureDateTime))" }
if ($passengers.Count -gt 0) { Write-Host "Passenger        : $($passengers[0].firstName) $($passengers[0].lastName) (DOB: $($passengers[0].dateOfBirth))" }
if ($contact)  { Write-Host "Contact          : $($contact.email) / +$($contact.phonePrefix)$($contact.phoneNumber)" }
Write-Host "Total (SAR)      : $($priceSummary.userTotalAmount)"
Write-Host "Total (USD)      : $($priceSummary.totalAmountInUsd)"
Write-Host "Baggage descs    : $($baggageList.Count)"
Write-Host "Tax entries      : $($taxList.Count)"
Write-Host "Anomalies        : $($anomalies.Count)"
Write-Host "=============================="
