import { describe, it, expect } from 'vitest';
import { prettyLabel } from '@/lib/address-format';

describe('prettyLabel', () => {
  it('title-cases an all-caps Georef nomenclatura', () => {
    expect(prettyLabel('AVENIDA CORRIENTES 1234')).toBe('Avenida Corrientes 1234');
  });

  it('keeps Spanish connectors lowercase mid-string', () => {
    expect(prettyLabel('CIUDAD AUTÓNOMA DE BUENOS AIRES')).toBe('Ciudad Autónoma de Buenos Aires');
  });

  it('preserves house numbers and postal codes', () => {
    expect(prettyLabel('SAN MARTÍN 500, C1264AAN')).toBe('San Martín 500, C1264AAN');
  });

  it('capitalizes a leading connector', () => {
    expect(prettyLabel('LA PLATA')).toBe('La Plata');
  });

  it('title-cases digit-bearing words that are not house numbers or postal codes', () => {
    expect(prettyLabel('RUTA 2 KM8')).toBe('Ruta 2 Km8');
  });
});
