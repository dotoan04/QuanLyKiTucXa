import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  gradient?: 'navy' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo'
  subtitle?: string
  trend?: { value: number; label: string }
  className?: string
}

const colorMap = {
  navy: 'stats-card-navy',
  blue: 'stats-card-blue',
  green: 'stats-card-green',
  amber: 'stats-card-amber',
  red: 'stats-card-red',
  purple: 'stats-card-purple',
  indigo: 'stats-card-indigo',
}

export function StatsCard({ title, value, icon, gradient = 'blue', subtitle, trend, className = '' }: StatsCardProps) {
  return (
    <div className={`${colorMap[gradient]} rounded-2xl p-5 text-white shadow-card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-white/75">{title}</p>
          <p className="text-2xl font-bold font-sans tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-white/60">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-medium ${trend.value >= 0 ? 'bg-white/20 text-white' : 'bg-white/20 text-red-200'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-white/50">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  )
}
