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
      role="banner"
      aria-label={`Classification: ${classification.banner_text}`}
      className="fixed left-0 right-0 h-[24px] flex items-center justify-center z-[9999]" style={{ [position]: 0, backgroundColor: colors.bg }}
    >
      <span
        className="font-[var(--font-mono)] text-[11px] font-bold tracking-[3px]" style={{ color: colors.text }}
      >
        {classification.banner_text}
      </span>
    </div>
  );
}
