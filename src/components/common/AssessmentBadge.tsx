import React from 'react';
import { AssessmentLevel } from '../../types/scanner';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

interface Props {
  assessment: AssessmentLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const AssessmentBadge: React.FC<Props> = ({ assessment, size = 'md', showIcon = true }) => {
  const configs = {
    low: {
      label: 'Low Concern',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconBg: 'text-emerald-700',
      icon: ShieldCheck,
      description: 'Well-tolerated with favorable safety evidence',
    },
    moderate: {
      label: 'Moderate Concern',
      bg: 'bg-amber-50 text-amber-900 border-amber-200',
      iconBg: 'text-amber-700',
      icon: AlertTriangle,
      description: 'Contains allergens, added sugars, or exposure-dependent elements',
    },
    high: {
      label: 'High Concern',
      bg: 'bg-rose-50 text-rose-900 border-rose-200',
      iconBg: 'text-rose-700',
      icon: AlertOctagon,
      description: 'Potential allergens, elevated sodium, or irritant flags present',
    },
    insufficient: {
      label: 'Insufficient Information',
      bg: 'bg-stone-100 text-stone-800 border-stone-300',
      iconBg: 'text-stone-600',
      icon: HelpCircle,
      description: 'Proprietary formula or unverified safety profile',
    },
  };

  const config = configs[assessment];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
    lg: 'text-base px-4 py-2 gap-2.5 font-semibold',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border ${config.bg} ${sizeClasses[size]} transition-colors`}
      title={config.description}
      role="status"
      aria-label={`Safety assessment: ${config.label}`}
    >
      {showIcon && <Icon size={iconSizes[size]} className={config.iconBg} aria-hidden="true" />}
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
