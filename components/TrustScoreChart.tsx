'use client'

interface DataPoint {
  label: string
  score: number
}

export default function TrustScoreChart({ points }: { points: DataPoint[] }) {
  if (points.length < 2) return null

  const W = 320
  const H = 100
  const PAD = { top: 8, right: 12, bottom: 22, left: 28 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const MIN = 1, MAX = 5

  const xScale = (i: number) => PAD.left + (i / (points.length - 1)) * plotW
  const yScale = (v: number) => PAD.top + (1 - (v - MIN) / (MAX - MIN)) * plotH

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(p.score).toFixed(1)}`)
    .join(' ')

  const areaPath = [
    ...points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(p.score).toFixed(1)}`),
    `L ${xScale(points.length - 1).toFixed(1)} ${(PAD.top + plotH).toFixed(1)}`,
    `L ${PAD.left.toFixed(1)} ${(PAD.top + plotH).toFixed(1)}`,
    'Z',
  ].join(' ')

  const gridVals = [2, 3, 4, 5]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Trust Score over time">
      <defs>
        <linearGradient id="ts-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="ts-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines + y labels */}
      {gridVals.map(v => (
        <g key={v}>
          <line
            x1={PAD.left} y1={yScale(v).toFixed(1)}
            x2={W - PAD.right} y2={yScale(v).toFixed(1)}
            stroke="rgba(255,255,255,0.07)" strokeWidth="0.8"
          />
          <text
            x={PAD.left - 4} y={yScale(v).toFixed(1)}
            textAnchor="end" dominantBaseline="middle"
            fontSize="7" fill="rgba(148,163,184,0.7)"
          >{v}</text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#ts-area)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="url(#ts-line)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={xScale(i).toFixed(1)} cy={yScale(p.score).toFixed(1)}
          r="3" fill="#0f172a" stroke="url(#ts-line)" strokeWidth="1.5"
        />
      ))}

      {/* X labels — show first, last, and middle */}
      {points.map((p, i) => {
        const showLabel = i === 0 || i === points.length - 1 || (points.length > 4 && i === Math.floor(points.length / 2))
        if (!showLabel) return null
        return (
          <text
            key={i}
            x={xScale(i).toFixed(1)} y={H - 4}
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            fontSize="7" fill="rgba(148,163,184,0.7)"
          >{p.label}</text>
        )
      })}
    </svg>
  )
}
