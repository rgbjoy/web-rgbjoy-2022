import styles from "./page.module.css"

/** What an arc lights up as under the cursor, picked fresh on every pass. */
const SEEDS = ["var(--seed-r)", "var(--seed-g)", "var(--seed-b)"]

/** Set straight on the tint, so a hover needs no re-render. */
function lightUp(arc: SVGGElement) {
  const tint = arc.lastElementChild as SVGPathElement | null
  tint?.style.setProperty("fill", SEEDS[Math.floor(Math.random() * SEEDS.length)])
}

/** Rings of alternating arcs, offset ring to ring like a checkerboard bent into a circle. */
const RINGS = 7
const SEGMENTS = 12
const INNER = 70
const WIDTH = 46

/** An annular sector: the slice of a ring between two angles, in degrees. */
function arc(inner: number, outer: number, from: number, to: number) {
  const point = (radius: number, degrees: number) => {
    const radians = (degrees * Math.PI) / 180
    return `${(radius * Math.cos(radians)).toFixed(2)} ${(radius * Math.sin(radians)).toFixed(2)}`
  }
  return [
    `M ${point(outer, from)}`,
    `A ${outer} ${outer} 0 0 1 ${point(outer, to)}`,
    `L ${point(inner, to)}`,
    `A ${inner} ${inner} 0 0 0 ${point(inner, from)}`,
    "Z",
  ].join(" ")
}

function segments() {
  const step = 360 / SEGMENTS
  const paths: string[] = []
  for (let ring = 0; ring < RINGS; ring++) {
    const inner = INNER + ring * WIDTH
    for (let segment = 0; segment < SEGMENTS; segment++) {
      // Every other slice, shifted by one on each ring, so the filled ones alternate like squares.
      if ((ring + segment) % 2) continue
      paths.push(arc(inner, inner + WIDTH, segment * step, (segment + 1) * step))
    }
  }
  return paths
}

const PATHS = segments()
const EXTENT = INNER + RINGS * WIDTH

/** Each filled arc fades from nothing into the text colour, so the disc reads as light sweeping round.
    Under the cursor an arc flashes a random red, green or blue, then fades back. */
export function Disc({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={`${-EXTENT} ${-EXTENT} ${EXTENT * 2} ${EXTENT * 2}`} aria-hidden="true">
      <defs>
        <linearGradient id="disc-fade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
      </defs>
      {PATHS.map((d) => (
        <g key={d} className={styles.arc} onPointerEnter={(event) => lightUp(event.currentTarget)}>
          <path d={d} fill="url(#disc-fade)" />
          <path className={styles.tint} d={d} />
        </g>
      ))}
    </svg>
  )
}
