import { formatMs, useCountdown } from '../lib/timer';

type Props = {
  endsAt: number | null;
  isLeader: boolean;
  onSkip: () => void;
  label?: string;
};

export function Timer({ endsAt, isLeader, onSkip, label }: Props) {
  const remaining = useCountdown(endsAt);
  return (
    <div className="timer">
      {label && <span className="timer-label">{label}</span>}
      <span className="timer-value" aria-live="polite">
        {endsAt ? formatMs(remaining) : '--:--'}
      </span>
      {isLeader && (
        <button className="btn btn-ghost" onClick={onSkip}>
          Skip ahead
        </button>
      )}
    </div>
  );
}
