// =============================================================================
// RatingBadge — Reusable DRRS rating badge (C-1, S-2, etc.)
// =============================================================================

interface RatingBadgeProps {
  rating: string;
}

function getBadgeColors(rating: string): {
  bg: string;
  border: string;
  text: string;
} {
  const level = rating.split('-')[1];
  switch (level) {
    case '1':
      return {
        bg: 'rgba(74, 222, 128, 0.15)',
        border: 'rgba(74, 222, 128, 0.3)',
        text: '#4ade80',
      };
    case '2':
      return {
        bg: 'rgba(251, 191, 36, 0.15)',
        border: 'rgba(251, 191, 36, 0.3)',
        text: '#fbbf24',
      };
    case '3':
      return {
        bg: 'rgba(251, 146, 60, 0.15)',
        border: 'rgba(251, 146, 60, 0.3)',
        text: '#fb923c',
      };
    case '4':
    default:
      return {
        bg: 'rgba(248, 113, 113, 0.15)',
        border: 'rgba(248, 113, 113, 0.3)',
        text: '#f87171',
      };
  }
}

export default function RatingBadge({ rating }: RatingBadgeProps) {
  const colors = getBadgeColors(rating);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.5px',
        padding: '2px 8px',
        borderRadius: 'var(--radius)',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        whiteSpace: 'nowrap',
      }}
    >
      {rating}
    </span>
  );
}
