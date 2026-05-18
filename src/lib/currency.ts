/**
 * Multi-currency support: CAD (default for Québec), USD, EUR.
 * Stripe prices are configured with currency_options for all 3,
 * so we pass `currency` to the checkout session and Stripe picks the right amount.
 */
export type Currency = 'cad' | 'usd' | 'eur';

const STORAGE_KEY = 'calmi-currency';

export const CURRENCIES: Record<Currency, { label: string; symbol: string; suffix: string; flag: string }> = {
  cad: { label: 'Dollar canadien', symbol: '$', suffix: 'CAD', flag: '🇨🇦' },
  usd: { label: 'Dollar américain', symbol: '$', suffix: 'USD', flag: '🇺🇸' },
  eur: { label: 'Euro', symbol: '€', suffix: 'EUR', flag: '🇪🇺' },
};

/**
 * Indicative display rates from CAD base.
 * Stripe charges the exact amount configured per currency on its side;
 * these are only for displaying approximate prices in the UI.
 */
const RATES_FROM_CAD: Record<Currency, number> = {
  cad: 1,
  usd: 0.73,
  eur: 0.68,
};

export function detectDefaultCurrency(): Currency {
  if (typeof window === 'undefined') return 'cad';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
    if (saved && saved in CURRENCIES) return saved;
  } catch {
    /* ignore */
  }
  const lang = (navigator.language || 'fr-CA').toLowerCase();
  if (lang.includes('-ca') || lang === 'fr-ca' || lang === 'en-ca') return 'cad';
  if (lang.includes('-us') || lang === 'en-us') return 'usd';
  return 'eur';
}

export function saveCurrency(currency: Currency): void {
  try {
    localStorage.setItem(STORAGE_KEY, currency);
  } catch {
    /* ignore */
  }
}

/** Convert a CAD-base amount into the chosen display currency (rounded to 2 decimals). */
export function convertFromCad(amountCad: number, currency: Currency): number {
  return Math.round(amountCad * RATES_FROM_CAD[currency] * 100) / 100;
}

export function formatPrice(amountCad: number, currency: Currency): string {
  const value = convertFromCad(amountCad, currency);
  const { symbol, suffix } = CURRENCIES[currency];
  if (currency === 'eur') return `${value.toFixed(2)} ${symbol}`;
  return `${value.toFixed(2)}${symbol} ${suffix}`;
}
