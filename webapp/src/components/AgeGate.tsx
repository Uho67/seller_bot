import { useState, ReactNode } from 'react';
import { uk } from '../i18n/uk';

const KEY = 'age_confirmed';

type State = 'unset' | 'confirmed' | 'denied';

function readState(): State {
  const v = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  if (v === '1') return 'confirmed';
  if (v === '0') return 'denied';
  return 'unset';
}

export function AgeGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(readState);

  if (state === 'confirmed') return <>{children}</>;

  if (state === 'denied') {
    return (
      <div className="age-gate age-gate-blocked">
        <p>{uk.ageGate.blocked}</p>
      </div>
    );
  }

  return (
    <div className="age-gate">
      <div className="age-gate-card">
        <h2>{uk.ageGate.question}</h2>
        <div className="age-gate-actions">
          <button
            className="btn btn-primary"
            onClick={() => { localStorage.setItem(KEY, '1'); setState('confirmed'); }}
          >
            {uk.ageGate.yes}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => { localStorage.setItem(KEY, '0'); setState('denied'); }}
          >
            {uk.ageGate.no}
          </button>
        </div>
      </div>
    </div>
  );
}
