import { useClassificationStore } from '@/stores/classificationStore';

const CLASSIFICATION_COLORS: Record<string, { bg: string; text: string }> = {
  green: { bg: '#40c057', text: '#000' },
  amber: { bg: '#fab005', text: '#000' },
  blue: { bg: '#4dabf7', text: '#000' },
  red: { bg: '#c92a2a', text: '#fff' },
  orange: { bg: '#e8590c', text: '#000' },
  yellow_on_red: { bg: '#c92a2a', text: '#ffd43b' },
};

interface ClassificationBannerProps {
  position: 'top' | 'bottom';
}

export default function ClassificationBanner({ position }: ClassificationBannerProps) {
  const { classification } = useClassificationStore();
  const colors = CLASSIFICATION_COLORS[classification.color] || CLASSIFICATION_COLORS.green;

  return (
    <div
      style={{
        position: 'fixed',
        [position]: 0,
        left: 0,
        right: 0,
        height: 24,
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          color: colors.text,
          letterSpacing: '3px',
        }}
      >
        {classification.banner_text}
      </span>
    </div>
  );
}
