// src/components/common/StatCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  accentColor = 'indigo',
  onClick,
}) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <div className={`p-2.5 rounded-lg border ${colorMap[accentColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {(subtext || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtext && <span className="text-slate-500">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
