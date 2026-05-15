import { cn } from '@/lib/utils';

type BadgeType = 'cheapest' | 'fastest' | 'bestRated' | 'bestValue';

interface Props {
  type: BadgeType;
  className?: string;
}

const CONFIG: Record<BadgeType, { label: string; icon: string; color: string }> = {
  cheapest:  { label: 'Cheapest',   icon: '💸', color: 'bg-green-100 text-green-800 border-green-200' },
  fastest:   { label: 'Fastest',    icon: '⚡', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  bestRated: { label: 'Best Rated', icon: '⭐', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  bestValue: { label: 'Best Value', icon: '🏆', color: 'bg-purple-100 text-purple-800 border-purple-200' },
};

export default function RecommendationBadge({ type, className }: Props) {
  const { label, icon, color } = CONFIG[type];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        color,
        className
      )}
    >
      {icon} {label}
    </span>
  );
}
