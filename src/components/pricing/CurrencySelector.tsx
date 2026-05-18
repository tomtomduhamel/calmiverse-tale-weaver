import React from 'react';
import { CURRENCIES, Currency } from '@/lib/currency';

interface Props {
  value: Currency;
  onChange: (c: Currency) => void;
}

export const CurrencySelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted">
      {(Object.keys(CURRENCIES) as Currency[]).map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
              active ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={active}
            aria-label={`Afficher les prix en ${CURRENCIES[c].label}`}
          >
            <span aria-hidden="true">{CURRENCIES[c].flag}</span>
            <span className="uppercase">{CURRENCIES[c].suffix}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CurrencySelector;
