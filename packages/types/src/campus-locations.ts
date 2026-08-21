// ─────────────────────────────────────────────────────────────────────────
// Campus Bytes — authoritative campus delivery locations (NIMS University).
//
// SINGLE SOURCE OF TRUTH. Imported by the web selector, checkout, the backend
// validator, and the restaurant/admin dashboards. Do NOT maintain a second list
// anywhere. Students may only deliver to one of these approved locations —
// arbitrary/outside addresses are rejected by the backend.
// ─────────────────────────────────────────────────────────────────────────

export type DeliveryLocationType = 'hostel' | 'gate' | 'university';

export const HOSTELS = [
  'Sunstone',
  'Magnolia',
  'Saphire',
  'Camelia',
  'Larimar',
  'Jasmine',
  'Topaz',
  'ONYX',
  'All Natt',
  'Dressden',
  'Emrald',
  'Oppen Heimer',
  'Vrindavan AREA',
  'Shivajiii',
  'Primus',
  'Imperial',
  'Rosewood',
  'Garnet',
] as const;

export const GATES = [
  'Gate No. 1',
  'Gate No. 2',
  'Gate No. 3',
  'Gate No. 4',
  'Gate No. 5',
] as const;

export const UNIVERSITY_LOCATIONS = [
  'NIMS Medical College',
  'Library',
  'BPT College',
  'Paramedical',
  'LAW College',
  'NIMS School',
  'Marik',
  'NIET',
  'Advance NIET',
  'NIMS Hospital',
  'Cricket Ground',
  'Nursing Ground',
  'Nursing College',
  'Dental College',
  'Pharmacy College',
  'Innovation Center',
  'CASA Bella',
  '5 NO. Gate Area',
  'White PG Hostels',
  'Auditorium',
  'Opel',
  'Administrative Block',
] as const;

/** All approved delivery locations grouped by type (drives the selector UI). */
export const CAMPUS_DELIVERY_LOCATIONS: Record<DeliveryLocationType, readonly string[]> = {
  hostel: HOSTELS,
  gate: GATES,
  university: UNIVERSITY_LOCATIONS,
};

export const DELIVERY_LOCATION_TYPE_LABELS: Record<DeliveryLocationType, string> = {
  hostel: 'Hostel',
  university: 'University Location',
  gate: 'Gate',
};

/** True when `name` is an approved location for the given `type`. */
export function isValidDeliveryLocation(type: string, name: string): type is DeliveryLocationType {
  const list = CAMPUS_DELIVERY_LOCATIONS[type as DeliveryLocationType];
  return Array.isArray(list) && list.includes(name);
}

/** Only hostels carry a room number. */
export function locationTypeRequiresRoom(type: DeliveryLocationType): boolean {
  return type === 'hostel';
}
