// SVG tone arm. The whole arm rotates around the pivot from -28deg
// (track start) to +18deg (track end), lerped from playback progress.
// globals.css gives .tonearm-pivot-group `transition: transform 2s ease`.

const START_DEG = -28
const END_DEG = 18
const PIVOT = { x: 60, y: 42 }

export default function ToneArm({ progressMs = 0, durationMs = 0 }) {
  const t = durationMs > 0 ? Math.min(Math.max(progressMs / durationMs, 0), 1) : 0
  const angle = START_DEG + t * (END_DEG - START_DEG)

  return (
    <svg
      className="tonearm"
      viewBox="0 0 120 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Pivot base (static) */}
      <circle cx={PIVOT.x} cy={PIVOT.y} r="22" fill="#1b1b22" stroke="#3a3a44" strokeWidth="2" />

      {/* Rotating assembly */}
      <g
        className="tonearm-pivot-group"
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
        }}
      >
        {/* Counterweight */}
        <rect x={PIVOT.x - 9} y={PIVOT.y - 38} width="18" height="22" rx="5" fill="#26262e" stroke="#44444f" strokeWidth="1.5" />
        {/* Arm tube */}
        <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2="196" stroke="#c9c9d4" strokeWidth="5" strokeLinecap="round" />
        {/* Elbow joint */}
        <circle cx={PIVOT.x} cy="150" r="4.5" fill="#9a9aa6" />
        {/* Headshell */}
        <g transform={`rotate(14 ${PIVOT.x} 196)`}>
          <rect x={PIVOT.x - 7} y="190" width="14" height="30" rx="4" fill="#2c2c35" stroke="#50505c" strokeWidth="1.5" />
          {/* Stylus */}
          <line x1={PIVOT.x} y1="220" x2={PIVOT.x} y2="227" stroke="#e8e8f0" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>

      {/* Pivot cap (on top of arm) */}
      <circle cx={PIVOT.x} cy={PIVOT.y} r="9" fill="#34343e" stroke="#55555f" strokeWidth="1.5" />
    </svg>
  )
}
