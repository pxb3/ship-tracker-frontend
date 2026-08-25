import { describe, it, expect } from 'vitest';
import {
  formatNavStatus,
  extractCoordinates,
  extractShipId,
  getShipName,
  NAV_STATUS_LABELS,
} from './shipFormatters';

describe('formatNavStatus', () => {
  it('returns "—" for null/undefined', () => {
    expect(formatNavStatus(null)).toBe('—');
    expect(formatNavStatus(undefined)).toBe('—');
  });

  it('maps known status codes to labels', () => {
    expect(formatNavStatus(0)).toBe(NAV_STATUS_LABELS[0]);
    expect(formatNavStatus('1')).toBe(NAV_STATUS_LABELS[1]);
  });

  it('returns the raw value stringified when not a number', () => {
    expect(formatNavStatus('foo')).toBe('foo');
  });

  it('returns the number as string when code is unknown', () => {
    expect(formatNavStatus(99)).toBe('99');
  });
});

describe('extractCoordinates', () => {
  it('extracts lon/lat from standard fields', () => {
    expect(extractCoordinates({ longitude: 1.5, latitude: 2.5 })).toEqual({ lon: 1.5, lat: 2.5 });
  });

  it('falls back to alternate field names', () => {
    expect(extractCoordinates({ lng: 3, lat: 4 })).toEqual({ lon: 3, lat: 4 });
    expect(extractCoordinates({ long: 5, latitude: 6 })).toEqual({ lon: 5, lat: 6 });
  });

  it('returns null when coordinates are missing or not numbers', () => {
    expect(extractCoordinates({})).toBeNull();
    expect(extractCoordinates({ longitude: '1', latitude: 2 })).toBeNull();
  });
});

describe('extractShipId', () => {
  it('extracts id, mmsi, or MMSI in priority order', () => {
    expect(extractShipId({ id: 'a', mmsi: 'b' })).toBe('a');
    expect(extractShipId({ mmsi: 'b' })).toBe('b');
    expect(extractShipId({ MMSI: 'c' })).toBe('c');
  });

  it('returns null when no identifier is present', () => {
    expect(extractShipId({})).toBeNull();
  });
});

describe('getShipName', () => {
  it('extracts name from known fields', () => {
    expect(getShipName({ name: 'Titanic' })).toBe('Titanic');
    expect(getShipName({ ShipName: 'Queen Mary' })).toBe('Queen Mary');
    expect(getShipName({ shipName: 'Costa' })).toBe('Costa');
  });

  it('returns "Unknown" when no name is present', () => {
    expect(getShipName({})).toBe('Unknown');
  });
});
