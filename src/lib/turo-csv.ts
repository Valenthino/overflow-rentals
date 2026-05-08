import type { Trip, TripStatus } from '@/types/database';
import { parseDollar } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CsvParseWarning {
  line: number;
  field: string;
  reason: string;
}

export interface CsvParseResult {
  rows: Partial<Trip>[];
  warnings: CsvParseWarning[];
  detectedHeaders: string[];
}

export interface VehicleNameParts {
  display: string;
  make: string | null;
  model: string | null;
  year: number | null;
  ownerName: string | null;
  licensePlate: string | null;
}

/**
 * Top-level entry point: parse a Turo CSV export into partial Trip rows.
 *
 * Handles:
 *   - quoted fields with escaped quotes ("")
 *   - Turo's discount/extras/fee subcolumns (summed into consolidated buckets)
 *   - vehicle names with owner-prefix (`{Owner}'s {Make} {Model} (BC #PLATE)`)
 *   - mixed date formats (`YYYY-MM-DD`, `M/D/YYYY`, `M/D/YY`)
 *   - status synonyms (`booked`/`reserved` → `upcoming`, etc.)
 */
export function parseTuroCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return { rows: [], warnings: [], detectedHeaders: [] };

  const headerCells = parseCsvLine(lines[0]);
  const headers = headerCells.map(normaliseHeader);
  const results: Partial<Trip>[] = [];
  const warnings: CsvParseWarning[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0 || values.every((v) => !v)) continue;

    const { row, lineWarnings } = parseRow(headers, values, i + 1);
    warnings.push(...lineWarnings);
    results.push(row);
  }

  return { rows: results, warnings, detectedHeaders: headerCells };
}

/**
 * Parse a Turo "Vehicle" column value into structured parts.
 *
 * Examples:
 *   "WENDSONGDO PRISCA's Subaru (BC #SK365R)"
 *     → { display: 'Subaru', make: 'Subaru', model: null, year: null,
 *         ownerName: 'WENDSONGDO PRISCA', licensePlate: 'SK365R' }
 *   "John's 2024 Tesla Model 3 (CA #ABC123)"
 *     → { display: '2024 Tesla Model 3', make: 'Tesla', model: 'Model 3', year: 2024,
 *         ownerName: 'John', licensePlate: 'ABC123' }
 *   "Acme Rentals LLC's Honda Civic"
 *     → { display: 'Honda Civic', make: 'Honda', model: 'Civic', year: null,
 *         ownerName: 'Acme Rentals LLC', licensePlate: null }
 *   "2018 Toyota Camry"
 *     → { display: '2018 Toyota Camry', make: 'Toyota', model: 'Camry', year: 2018,
 *         ownerName: null, licensePlate: null }
 */
export function parseVehicleName(raw: string): VehicleNameParts {
  const empty: VehicleNameParts = {
    display: '',
    make: null,
    model: null,
    year: null,
    ownerName: null,
    licensePlate: null,
  };
  if (!raw) return empty;

  let working = raw.trim();
  let ownerName: string | null = null;
  let licensePlate: string | null = null;

  // Step 1: pull off owner/business prefix.
  // Matches "Owner Name's …" using straight or curly apostrophes. The owner
  // segment is greedy up to the LAST apostrophe-S so business names like
  // "Acme Rentals LLC's" still capture in full.
  const ownerMatch = working.match(/^(.+?)[’'‘]s\s+(.+)$/);
  if (ownerMatch) {
    ownerName = ownerMatch[1].trim();
    working = ownerMatch[2].trim();
  }

  // Step 2: pull license plate from trailing "(BC #ABC123)" / "(CA #ABC-123)".
  const plateMatch = working.match(/\s*\(([A-Z]{1,3})?\s*#\s*([A-Z0-9-]+)\)\s*$/i);
  if (plateMatch) {
    licensePlate = plateMatch[2].toUpperCase();
    working = working.replace(plateMatch[0], '').trim();
  }

  // Step 3: detect a 4-digit year either as a prefix ("2015 Subaru Outback")
  // or a suffix ("Subaru Outback 2015"). Turo's "Vehicle name" column uses
  // the suffix form.
  let year: number | null = null;
  const yearPrefix = working.match(/^((?:19|20)\d{2})\s+/);
  const yearSuffix = working.match(/\s+((?:19|20)\d{2})$/);
  if (yearPrefix) {
    year = parseInt(yearPrefix[1], 10);
  } else if (yearSuffix) {
    year = parseInt(yearSuffix[1], 10);
  }

  // Step 4: heuristic make/model extraction from the cleaned display string,
  // with the year stripped from either end.
  const display = working;
  const stripped = display
    .replace(/^(?:19|20)\d{2}\s+/, '')
    .replace(/\s+(?:19|20)\d{2}$/, '')
    .trim();
  const tokens = stripped.split(/\s+/);
  let make: string | null = null;
  let model: string | null = null;
  if (tokens.length >= 1) make = capitalize(tokens[0]);
  if (tokens.length >= 2) model = tokens.slice(1).map(capitalize).join(' ');

  return { display, make, model, year, ownerName, licensePlate };
}

// ---------------------------------------------------------------------------
// Internal helpers (kept private — exported separately for the trips screen
// to keep its inline parser path until it migrates here).
// ---------------------------------------------------------------------------

/** Parse a single CSV line respecting quoted fields and `""` escaped quotes. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

const HEADER_MAP: Record<string, string> = {
  reservation_id: 'reservation_id',
  reservation: 'reservation_id',
  guest: 'guest_name',
  guest_name: 'guest_name',
  vehicle: '_vehicle_raw',
  vehicle_name: 'vehicle_name',
  vehicle_id: '_vehicle_external_id',
  vin: '_vin',
  status: 'status',
  trip_status: 'status',
  trip_start: 'start_date',
  start_date: 'start_date',
  start: 'start_date',
  trip_end: 'end_date',
  end_date: 'end_date',
  end: 'end_date',
  pickup_location: 'pickup_location',
  pickup: 'pickup_location',
  return_location: 'return_location',
  return: 'return_location',
  checkin_odometer: 'checkin_odometer',
  checkout_odometer: 'checkout_odometer',
  distance_traveled: '_distance',
  distance: '_distance',
  trip_days: 'days',
  days: 'days',
  trip_price: 'trip_price',
  price: 'trip_price',
  boost_price: '_extras_bucket',
  extras: '_extras_bucket',
  excess_distance: '_extras_bucket',
  '3day_discount': '_discount_bucket',
  '1week_discount': '_discount_bucket',
  '2week_discount': '_discount_bucket',
  '3week_discount': '_discount_bucket',
  '1month_discount': '_discount_bucket',
  '2month_discount': '_discount_bucket',
  '3month_discount': '_discount_bucket',
  nonrefundable_discount: '_discount_bucket',
  early_bird_discount: '_discount_bucket',
  host_promotional_credit: '_discount_bucket',
  total_discounts: '_discount_bucket',
  discounts: '_discount_bucket',
  cancellation_fee: '_other_fees_bucket',
  additional_usage: '_other_fees_bucket',
  late_fee: '_other_fees_bucket',
  improper_return_fee: '_other_fees_bucket',
  airport_operations_fee: '_other_fees_bucket',
  airport_parking_credit: '_other_fees_bucket',
  tolls_tickets: '_other_fees_bucket',
  ontrip_ev_charging: '_other_fees_bucket',
  posttrip_ev_charging: '_other_fees_bucket',
  smoking: '_other_fees_bucket',
  cleaning: '_other_fees_bucket',
  fines_paid_to_host: '_other_fees_bucket',
  gas_reimbursement: '_other_fees_bucket',
  gas_fee: '_other_fees_bucket',
  other_fees: '_other_fees_bucket',
  delivery: 'delivery_fee',
  delivery_fee: 'delivery_fee',
  sales_tax: 'sales_tax',
  tax: 'sales_tax',
  host_fee: 'host_fee',
  turo_fee: 'host_fee',
  total_earnings: 'total_earnings',
  earnings: 'total_earnings',
  your_earnings: 'total_earnings',
  host_earnings: 'total_earnings',
  source: 'source',
  notes: 'notes',
};

const DIRECT_NUMERIC_FIELDS = new Set([
  'trip_price', 'delivery_fee', 'sales_tax', 'host_fee', 'total_earnings',
]);

const BUCKET_FIELDS = new Set([
  '_discount_bucket', '_extras_bucket', '_other_fees_bucket',
]);

function normaliseHeader(raw: string): string {
  const lower = raw
    .toLowerCase()
    .replace(/&/g, '_')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  return HEADER_MAP[lower] ?? lower;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [m, d, y] = parts;
    const month = m.padStart(2, '0');
    const day = d.padStart(2, '0');
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${month}-${day}`;
  }
  return null;
}

function parseStatus(raw: string): TripStatus {
  const norm = raw.toLowerCase().trim().replace(/[\s\-_]+/g, '');
  if (['upcoming', 'booked', 'reserved', 'confirmed'].includes(norm)) return 'upcoming';
  if (['active', 'inprogress', 'ongoing'].includes(norm)) return 'active';
  if (['completed', 'done', 'finished', 'past'].includes(norm)) return 'completed';
  if (['cancelled', 'canceled'].includes(norm)) return 'cancelled';
  return 'completed';
}

function parseRow(
  headers: string[],
  values: string[],
  lineNo: number,
): { row: Partial<Trip>; lineWarnings: CsvParseWarning[] } {
  const lineWarnings: CsvParseWarning[] = [];
  const row: Record<string, unknown> = {};
  let discountSum = 0;
  let extrasSum = 0;
  let otherFeesSum = 0;
  let vehicleRaw = '';
  let vehicleNameClean = '';
  const distanceTraveled: number[] = [];

  const parseIntCell = (raw: string, field: string): number => {
    const cleaned = raw.replace(/[^0-9-]/g, '');
    if (!cleaned || cleaned === '-') {
      lineWarnings.push({ line: lineNo, field, reason: `Non-numeric "${raw}" — defaulted to 0` });
      return 0;
    }
    const num = parseInt(cleaned, 10);
    if (!Number.isFinite(num)) {
      lineWarnings.push({ line: lineNo, field, reason: `Non-numeric "${raw}" — defaulted to 0` });
      return 0;
    }
    return num;
  };

  headers.forEach((header, idx) => {
    const val = idx < values.length ? values[idx] : '';
    if (!val) return;

    if (header === '_vehicle_raw') { vehicleRaw = val; return; }
    if (header === 'vehicle_name') { vehicleNameClean = val; return; }
    if (header === '_vehicle_external_id' || header === '_vin') return;
    if (header === '_distance') {
      const n = parseInt(val.replace(/[^0-9]/g, ''), 10);
      if (Number.isFinite(n) && n > 0) distanceTraveled.push(n);
      return;
    }

    if (BUCKET_FIELDS.has(header)) {
      const n = parseDollar(val);
      if (header === '_discount_bucket') discountSum += Math.abs(n);
      else if (header === '_extras_bucket') extrasSum += Math.abs(n);
      else if (header === '_other_fees_bucket') otherFeesSum += n;
      return;
    }

    if (DIRECT_NUMERIC_FIELDS.has(header)) {
      const n = parseDollar(val);
      row[header] = header === 'sales_tax' ? Math.abs(n) : n;
      return;
    }

    switch (header) {
      case 'days':
      case 'checkin_odometer':
      case 'checkout_odometer':
        row[header] = parseIntCell(val, header);
        break;
      case 'start_date':
      case 'end_date':
        row[header] = parseDate(val);
        break;
      case 'status':
        row[header] = parseStatus(val);
        break;
      default:
        row[header] = val;
        break;
    }
  });

  // Prefer the explicit "vehicle name" column when Turo provides it; otherwise
  // run our intelligent parser on the messy "vehicle" column.
  if (vehicleNameClean) {
    row.vehicle_name = vehicleNameClean;
  } else if (vehicleRaw) {
    row.vehicle_name = parseVehicleName(vehicleRaw).display;
  }

  row.total_discounts = discountSum;
  row.extras = extrasSum;
  row.other_fees = otherFeesSum;

  const numericDefaults = ['trip_price', 'total_discounts', 'extras', 'delivery_fee', 'other_fees', 'sales_tax', 'host_fee', 'total_earnings', 'days'] as const;
  numericDefaults.forEach((f) => {
    if (row[f] === undefined) row[f] = 0;
  });

  if (!row.status) row.status = 'completed';

  if (distanceTraveled.length > 0) {
    const km = distanceTraveled[0];
    const existing = typeof row.notes === 'string' ? row.notes + ' · ' : '';
    row.notes = `${existing}Distance: ${km} km`;
  }

  return { row: row as Partial<Trip>, lineWarnings };
}

function capitalize(token: string): string {
  if (!token) return token;
  // Preserve fully-uppercase trim levels like "GT", "RS", "Si", "AWD", "EV".
  if (/^[A-Z0-9]{2,5}$/.test(token)) return token;
  return token[0].toUpperCase() + token.slice(1).toLowerCase();
}
