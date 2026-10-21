import { Color, MathUtils, Vector3 } from "three"

export type GamePhase = "idle" | "swinging" | "flying" | "rolling" | "resting"

/** A swing from the swing stick. */
export type Swing = {
  /** 0–1, from how far you pulled back. */
  power: number
  /** Lean of the forward stroke in radians; positive pushes right. */
  path: number
  /** How cleanly it was struck: 1 is pure, under 1 chunked, over 1 thinned. */
  strike: number
  /** How far past the lanes you let go, -1 to 1; 0 inside, positive is right. */
  shank: number
  /** Share of carry kept for the speed of the forward swing; see tempoFactor. */
  tempo: number
}

export type Shot = {
  club: Club
  direction: Vector3
  power: number
  start: Vector3
  launchEnd: Vector3
  wind: Vector3
  end: Vector3
  duration: number
  arcHeight: number
  elapsed: number
}

/** Bounce and roll-out after the ball lands. */
export type Roll = {
  from: Vector3
  to: Vector3
  /** Height of each hop after landing, highest first. */
  hops: number[]
  duration: number
  elapsed: number
}

/** How the club met the ball, kept for the result line. */
export type Contact = {
  /** The swing's strike factor; see strikeFactor. */
  strike: number
  /** The swing's shank; see shankFactor. */
  shank: number
  /** The shot's slice (positive) or hook (negative); see sliceFactor. */
  slice: number
  /** The swing's tempo; see tempoFactor. */
  tempo: number
}

export type ShotResult = Contact & {
  yards: number
  flagYards: number
  fromFlag: number
}

export type HudState = {
  phase: GamePhase
  lastYards: number
  longestYards: number
  windAngle: number
  windSpeed: number
  result?: ShotResult
  hint?: string
}

export type Wind = {
  angle: number
  strength: number
  speed: number
}

/** Backswing in screen pixels: a dead zone, then full power at the bottom. */
export const BACKSWING_DEAD_ZONE = 12
export const MAX_BACKSWING = 150
/**
 * Let go of the forward swing back where you started for a pure strike.
 * This many pixels either side still counts.
 */
export const SWEET_SPOT = 10
/** Pushing this far past the start is the thinnest strike; the swing fires there. */
export const MAX_OVERSWING = 40
/** A fully thinned strike carries this much further than you pulled for. */
const MAX_THIN_BONUS = 0.25
export const MAX_SWING_PATH = 0.6

/** World units are two yards, so the range fits a small, fogged world. */
export const YARDS_PER_UNIT = 2
/**
 * The bag. `minCarry` is the lightest swing and `maxCarry` a pure full swing,
 * in yards; each club's range overlaps its neighbours so every distance has
 * a club or two that reach it comfortably. `lane` is how far either side of
the start, in pixels, you can let go without shanking it: wide for a
forgiving wedge, narrow for the driver. `thinCarry` and `thinLaunch` say
what a thinned strike does: irons run long, the driver goes low and short.
`spin` scales how hard a slice or hook bends: most for the driver.
`launch` is the peak
 * height as a share of carry, so a wedge climbs steeply and a driver stays
 * low and long. `roll` scales how far it runs out after landing.
 */
export const CLUBS = [
  { id: "driver", name: "Driver", minCarry: 160, maxCarry: 270, lane: 11, thinCarry: -1, thinLaunch: -2, spin: 1, launch: 0.12, roll: 1 },
  { id: "5i", name: "5 Iron", minCarry: 120, maxCarry: 200, lane: 14, thinCarry: 1, thinLaunch: 0, spin: 0.75, launch: 0.17, roll: 0.65 },
  { id: "7i", name: "7 Iron", minCarry: 95, maxCarry: 165, lane: 17, thinCarry: 1, thinLaunch: 0, spin: 0.55, launch: 0.21, roll: 0.45 },
  { id: "9i", name: "9 Iron", minCarry: 70, maxCarry: 135, lane: 20, thinCarry: 1, thinLaunch: 0, spin: 0.4, launch: 0.26, roll: 0.3 },
  { id: "pw", name: "Wedge", minCarry: 20, maxCarry: 100, lane: 24, thinCarry: 1, thinLaunch: 0, spin: 0.25, launch: 0.34, roll: 0.15 },
]

export type Club = (typeof CLUBS)[number]

export const BALL_RADIUS = 0.11 / 1.5
export const MAT_TOP_Y = 0.04
export const TEE_HEIGHT = 0.07
export const BALL_TEE_Y = MAT_TOP_Y + TEE_HEIGHT + BALL_RADIUS

export const WIND_MAX_ANGLE = 78
export const WIND_MIN_SPEED = 4
export const WIND_SPEED_SPREAD = 8
export const WIND_BASE_STRENGTH = 0.28
export const WIND_STRENGTH_PER_SPEED = 0.145
/** Sideways drift per unit of carry: a mid wind moves a full drive ~15 yards. */
const WIND_DRIFT_PER_UNIT = 0.07
/** >1 makes drift build later in the flight, so the ball visibly bends. */
export const WIND_DRIFT_EXPONENT = 1.7

/** Target flags down the range, each with a green around it. */
export const GREEN_RADIUS = 4
export const FLAGS = [
  { yards: 50, x: -4, color: "#ff5a4f" },
  { yards: 100, x: 6, color: "#ffffff" },
  { yards: 150, x: -8, color: "#ffd23f" },
  { yards: 200, x: 4, color: "#4fa3ff" },
  { yards: 250, x: -2, color: "#ff8a3d" },
].map((flag) => ({ ...flag, z: -flag.yards / YARDS_PER_UNIT }))

export type Flag = (typeof FLAGS)[number]

const HINTS = [
  "Press on the ball, pull down for your backswing, then push up and let go at the white dot.",
  "A breeze now. Drag off the ball to aim into the wind arrow.",
  "Lean the forward swing right to fade, left to draw. Flags every 50 yards.",
]

export function hintForShot(shotIndex: number) {
  return HINTS[shotIndex]
}

const green = new Color("#69e36f")
const orange = new Color("#ffb13b")
const red = new Color("#ff554d")

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function powerFromBackswing(depth: number) {
  return clamp01(
    (depth - BACKSWING_DEAD_ZONE) / (MAX_BACKSWING - BACKSWING_DEAD_ZONE),
  )
}

/**
 * How cleanly you struck it, from where you let go of the forward swing
 * relative to where you started (y grows downward). 1 is pure. Stopping short
 * keeps only the share of the forward swing you made, so a quick jab barely
 * moves the ball. Pushing past thins it, carrying up to a quarter further.
 */
export function strikeFactor(bottomY: number, endY: number) {
  if (endY > SWEET_SPOT) {
    return clamp01((bottomY - endY) / (bottomY - SWEET_SPOT))
  }
  const overswing = clamp01((-endY - SWEET_SPOT) / (MAX_OVERSWING - SWEET_SPOT))
  return 1 + overswing * MAX_THIN_BONUS
}

/**
 * How a strike scales this club's carry and peak height. A chunk cuts carry
 * for every club; a thin follows the club's `thinCarry` and `thinLaunch`.
 */
export function strikeEffect(strike: number, club: Club) {
  if (strike <= 1) return { carry: strike, launch: 1 }
  const thin = strike - 1
  return { carry: 1 + thin * club.thinCarry, launch: 1 + thin * club.thinLaunch }
}

/** A forward swing quicker than this keeps all its power... */
export const QUICK_FORWARD_MS = 350
/** ...and one this slow or slower keeps only MIN_TEMPO of it. */
const SLOW_FORWARD_MS = 1200
const MIN_TEMPO = 0.4

/**
 * Share of carry kept for how long the forward swing took. A real swing
 * comes through fast, so easing slowly onto the start dot to make a perfect
 * strike just pushes the ball.
 */
export function tempoFactor(forwardMs: number) {
  const slowness = clamp01(
    (forwardMs - QUICK_FORWARD_MS) / (SLOW_FORWARD_MS - QUICK_FORWARD_MS),
  )
  return MathUtils.lerp(1, MIN_TEMPO, slowness)
}

/** Lean past this, in radians, and a fade becomes a slice, a draw a hook. */
const SHAPE_LEAN = 0.25

/**
 * How hard the swing slices (positive) or hooks (negative) this club, from
 * the lean of the forward stroke. Under SHAPE_LEAN it is 0, a plain fade or
 * draw; it grows to ±club.spin at the steepest lean.
 */
export function sliceFactor(path: number, club: Club) {
  const past = clamp01(
    (Math.abs(path) - SHAPE_LEAN) / (MAX_SWING_PATH - SHAPE_LEAN),
  )
  return Math.sign(path) * past * club.spin
}

/** Letting go this many pixels past a lane is the worst shank. */
const SHANK_RANGE = 20
/** The worst shank loses this share of its carry... */
export const SHANK_POWER_LOSS = 0.6
/** ...and flies this many radians further off line. */
export const SHANK_ANGLE = 0.6

/**
 * How badly you shanked it, from where you let go sideways of where you
 * started. Inside the club's lanes it is 0; past them it grows to ±1, signed
 * by the side you went off.
 */
export function shankFactor(endX: number, club: Club) {
  const past = clamp01((Math.abs(endX) - club.lane) / SHANK_RANGE)
  return Math.sign(endX) * past
}

/**
 * Lean of the forward stroke from the bottom of the backswing to `point`,
 * both measured from where the swing started (y grows downward).
 */
export function swingPath(
  bottom: { x: number; y: number },
  point: { x: number; y: number },
) {
  const climb = bottom.y - point.y
  if (climb < 10) return 0
  const lean = Math.atan2(point.x - bottom.x, climb)
  return Math.max(-MAX_SWING_PATH, Math.min(MAX_SWING_PATH, lean))
}

export function carryDistance(power: number, club: Club) {
  const yards = MathUtils.lerp(club.minCarry, club.maxCarry, clamp01(power))
  return yards / YARDS_PER_UNIT
}

/** How far down to pull, in pixels, to carry a given number of yards. */
export function backswingForYards(yards: number, club: Club) {
  const power = clamp01(
    (yards - club.minCarry) / (club.maxCarry - club.minCarry),
  )
  return BACKSWING_DEAD_ZONE + power * (MAX_BACKSWING - BACKSWING_DEAD_ZONE)
}

export function toYards(units: number) {
  return Math.round(units * YARDS_PER_UNIT)
}

/** djb2 plus a murmur3 finalizer, forced back to unsigned at every step. */
function hash(text: string) {
  let value = 5381
  for (let index = 0; index < text.length; index += 1) {
    value = (Math.imul(value, 33) + text.charCodeAt(index)) >>> 0
  }

  value = (value ^ (value >>> 15)) >>> 0
  value = Math.imul(value, 2246822507) >>> 0
  value = (value ^ (value >>> 13)) >>> 0
  value = Math.imul(value, 3266489909) >>> 0
  return (value ^ (value >>> 16)) >>> 0
}

/**
 * Wind for a given shot, seeded by the session so a restart blows differently.
 * The first shot is calm and the second a breeze, to ease players in.
 */
export function windForShot(seed: number, shotIndex: number): Wind {
  const scale = shotIndex === 0 ? 0 : shotIndex === 1 ? 0.35 : 1
  if (scale <= 0) return { angle: 0, strength: 0, speed: 0 }

  const value = hash(`${seed}-${shotIndex}`)
  const angle = (value % (WIND_MAX_ANGLE * 2 + 1)) - WIND_MAX_ANGLE
  const speed = Math.max(
    1,
    Math.round(
      (WIND_MIN_SPEED + ((value >>> 9) % WIND_SPEED_SPREAD)) * scale,
    ),
  )

  return {
    angle,
    speed,
    strength: WIND_BASE_STRENGTH + speed * WIND_STRENGTH_PER_SPEED,
  }
}

/** How far, and which way, the wind pushes a shot of this power and carry. */
export function windOffset(
  direction: Vector3,
  strength: number,
  power: number,
  carry: number,
  target = new Vector3(),
) {
  const powerFactor = MathUtils.lerp(0.6, 1.25, power)
  return target
    .copy(direction)
    .multiplyScalar(strength * powerFactor * carry * WIND_DRIFT_PER_UNIT)
}

/**
 * Length to launch along `direction` so that, once `offset` is added, the total
 * displacement still measures `carry`. Wind bends where you end up without
 * lengthening or shortening the shot.
 */
export function solveLaunchDistance(
  direction: Vector3,
  offset: Vector3,
  carry: number,
) {
  const along = direction.dot(offset)
  return Math.max(
    0.2,
    -along +
      Math.sqrt(
        Math.max(0, along * along + carry * carry - offset.lengthSq()),
      ),
  )
}

export function powerColor(power: number, target = new Color()) {
  if (power < 0.55) {
    return target.lerpColors(green, orange, power / 0.55)
  }

  return target.lerpColors(orange, red, (power - 0.55) / 0.45)
}

export function pointOnShot(shot: Shot, progress: number, target = new Vector3()) {
  const t = clamp01(progress)
  target.lerpVectors(shot.start, shot.launchEnd, t)
  target.addScaledVector(shot.wind, Math.pow(t, WIND_DRIFT_EXPONENT))
  target.y += Math.sin(Math.PI * t) * shot.arcHeight
  return target
}

/** Horizontal velocity along the shot: the derivative of `pointOnShot`. */
export function velocityOnShot(
  shot: Shot,
  progress: number,
  target = new Vector3(),
) {
  const t = clamp01(progress)
  target.subVectors(shot.launchEnd, shot.start)
  target.addScaledVector(
    shot.wind,
    WIND_DRIFT_EXPONENT * Math.pow(t, WIND_DRIFT_EXPONENT - 1),
  )
  target.y = 0
  return target
}

/** Ground height at a point on the range, in world units. */
export type Terrain = (x: number, z: number) => number

/** Long, low swells summed into the ground; their peaks stay this high. */
const TERRAIN_HEIGHT = 1
const SWELLS = 4
const MIN_SWELL_LENGTH = 30
const MAX_SWELL_LENGTH = 90
/** The tee and greens stay flat out to these radii, then ease into the swells. */
const TEE_FLAT = 8
const GREEN_FLAT = GREEN_RADIUS + 1
const FLAT_BLEND = 10

/**
 * Gentle rolling ground for one play, seeded so a new bucket gets new
 * terrain. A few long sine swells at random angles, flattened at the tee
 * and around each green so the targets and the stance stay level.
 */
export function makeTerrain(seed: number): Terrain {
  const random = (salt: string) => hash(`${seed}-terrain-${salt}`) / 0xffffffff
  const swells = Array.from({ length: SWELLS }, (_, index) => {
    const angle = random(`angle${index}`) * Math.PI * 2
    const length = MathUtils.lerp(MIN_SWELL_LENGTH, MAX_SWELL_LENGTH, random(`length${index}`))
    return {
      dx: Math.cos(angle) * ((Math.PI * 2) / length),
      dz: Math.sin(angle) * ((Math.PI * 2) / length),
      phase: random(`phase${index}`) * Math.PI * 2,
    }
  })

  return (x, z) => {
    let height = 0
    for (const swell of swells) {
      height += Math.sin(x * swell.dx + z * swell.dz + swell.phase)
    }
    let flat = flatness(Math.hypot(x, z), TEE_FLAT)
    for (const flag of FLAGS) {
      flat = Math.min(flat, flatness(Math.hypot(x - flag.x, z - flag.z), GREEN_FLAT))
    }
    return (height / SWELLS) * TERRAIN_HEIGHT * flat
  }
}

/** 0 inside `radius`, easing up to 1 over FLAT_BLEND beyond it. */
function flatness(distance: number, radius: number) {
  return MathUtils.smoothstep(distance, radius, radius + FLAT_BLEND)
}

/** Pull on the ball between hops; a little stronger than in flight so it settles quickly. */
const BOUNCE_GRAVITY = 32
/** Hops lower than this would not show, so the ball just rolls. */
const MIN_HOP = 0.03
const MAX_HOPS = 4
/** Rolling time after the last hop. */
const ROLL_OUT_SECONDS = 0.4
const UP = new Vector3(0, 1, 0)

/** Each hop is a share of the one before, until it is too small to see. */
export function hopHeights(first: number, restitution: number) {
  const hops: number[] = []
  for (let hop = first; hop >= MIN_HOP && hops.length < MAX_HOPS; hop *= restitution) {
    hops.push(hop)
  }
  return hops
}

/** Seconds a hop of this height spends in the air. */
function hopSeconds(height: number) {
  return 2 * Math.sqrt((2 * height) / BOUNCE_GRAVITY)
}

/**
 * Low, soft shots skip several times and roll out further; high, hard ones
 * take a big first bounce that dies quickly and stop sooner. `random` adds a
 * little variety so no two landings look the same, including a small kick
 * off line.
 */
export function rollForShot(shot: Shot, random = Math.random): Roll {
  const carry = shot.start.distanceTo(shot.end)
  const direction = velocityOnShot(shot, 1)
    .normalize()
    .applyAxisAngle(UP, (random() - 0.5) * 0.16)
  const distance =
    carry *
    MathUtils.lerp(0.18, 0.08, shot.power) *
    shot.club.roll *
    MathUtils.lerp(0.9, 1.1, random())
  const firstHop =
    carry * MathUtils.lerp(0.005, 0.008, shot.power) * MathUtils.lerp(0.9, 1.1, random())
  const restitution = MathUtils.lerp(0.45, 0.35, shot.power) + (random() - 0.5) * 0.06
  const hops = hopHeights(firstHop, restitution)
  const hopsTime = hops.reduce((sum, hop) => sum + hopSeconds(hop), 0)

  return {
    from: shot.end.clone(),
    to: shot.end.clone().addScaledVector(direction, distance),
    hops,
    duration: hopsTime + ROLL_OUT_SECONDS + distance * 0.02,
    elapsed: 0,
  }
}

/**
 * Height above the ground `seconds` after landing. Each hop is a parabola under
 * the same gravity, like a real bounce, so they quicken as they shrink.
 */
function hopHeight(hops: number[], seconds: number) {
  let time = seconds
  for (const hop of hops) {
    const span = hopSeconds(hop)
    if (time < span) {
      const u = time / span
      return 4 * hop * u * (1 - u)
    }
    time -= span
  }
  return 0
}

/** A few shrinking hops, then an ease-out roll to a stop. */
export function pointOnRoll(
  roll: Roll,
  progress: number,
  terrain: Terrain,
  target = new Vector3(),
) {
  const t = clamp01(progress)
  target.lerpVectors(roll.from, roll.to, 1 - Math.pow(1 - t, 3))
  target.y =
    terrain(target.x, target.z) + BALL_RADIUS + hopHeight(roll.hops, t * roll.duration)
  return target
}

export function nearestFlag(point: Vector3) {
  let flag = FLAGS[0]
  let distance = Number.POSITIVE_INFINITY

  for (const candidate of FLAGS) {
    const gap = Math.hypot(point.x - candidate.x, point.z - candidate.z)
    if (gap < distance) {
      flag = candidate
      distance = gap
    }
  }

  return { flag, distance }
}

export function resultForRest(point: Vector3, contact: Contact): ShotResult {
  const { flag, distance } = nearestFlag(point)
  return {
    ...contact,
    yards: toYards(Math.hypot(point.x, point.z)),
    flagYards: flag.yards,
    fromFlag: toYards(distance),
  }
}
