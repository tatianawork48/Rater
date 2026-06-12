import { Shield } from 'lucide-react'
import clsx from 'clsx'

interface VerifiedBadgeProps {
  size?: 'sm' | 'md'
  className?: string
}

export default function VerifiedBadge({ size = 'sm', className = '' }: VerifiedBadgeProps) {
  const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'
  const textSize = size === 'md' ? 'text-xs' : 'text-[10px]'
  const padding  = size === 'md' ? 'px-2.5 py-1' : 'px-1.5 py-0.5'

  return (
    <div className={clsx('relative group/vbadge inline-flex', className)}>
      <span className={clsx(
        'inline-flex items-center gap-1 font-semibold cursor-help select-none',
        'text-status-success bg-status-success/10 border border-status-success/30 rounded-md',
        textSize, padding
      )}>
        <Shield className={iconSize} />
        On-chain
      </span>

      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 z-50 opacity-0 group-hover/vbadge:opacity-100 transition-opacity duration-200">
        <div className="glass border border-status-success/25 rounded-xl px-3.5 py-3 shadow-card text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-status-success mb-1.5">
            <Shield className="w-3 h-3" />
            Hedera Verified
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            This review is permanently stored on Hedera Consensus Service and cannot be altered or deleted.
          </p>
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-status-success/25" />
      </div>
    </div>
  )
}
