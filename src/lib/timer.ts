import { useEffect, useState } from 'react';

export function useCountdown(endsAt: number | null): number {
  const [remaining, setRemaining] = useState(() =>
    endsAt ? Math.max(0, endsAt - Date.now()) : 0,
  );
  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAt]);
  return remaining;
}

export function formatMs(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
