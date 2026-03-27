interface ProgressBarProps {
  percentage: number
  className?: string
}

export default function ProgressBar({ percentage, className = '' }: ProgressBarProps) {
  const clampedPct = Math.min(100, Math.max(0, percentage))

  return (
    <div className={`h-4 border-2 border-black p-[2px] ${className}`}>
      <div
        className="h-full bg-black transition-all duration-300"
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  )
}
