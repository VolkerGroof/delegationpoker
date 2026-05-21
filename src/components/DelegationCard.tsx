import { DELEGATION_LEVELS, DelegationLevel } from '../lib/types';

type Props = {
  level?: DelegationLevel;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  disabled?: boolean;
};

const SIZE_CSS: Record<NonNullable<Props['size']>, string> = {
  sm: 'card card-sm',
  md: 'card card-md',
  lg: 'card card-lg',
};

export function DelegationCard({
  level,
  faceDown,
  selected,
  onClick,
  size = 'md',
  showLabel = false,
  disabled = false,
}: Props) {
  const meta = level ? DELEGATION_LEVELS[level - 1] : null;
  const src = faceDown || !meta ? '/cards/back.png' : meta.image;
  const cls = [
    SIZE_CSS[size],
    selected ? 'card-selected' : '',
    onClick && !disabled ? 'card-clickable' : '',
    disabled ? 'card-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={cls}
      onClick={disabled ? undefined : onClick}
      disabled={disabled || !onClick}
      aria-pressed={selected || undefined}
    >
      <img src={src} alt={meta ? meta.name : 'Card back'} draggable={false} />
      {showLabel && meta && !faceDown && (
        <div className="card-label">
          <strong>{meta.name}</strong>
          <span>{meta.tagline}</span>
        </div>
      )}
    </button>
  );
}
