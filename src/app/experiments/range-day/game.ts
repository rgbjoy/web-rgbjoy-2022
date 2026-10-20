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
}

export type Shot = {
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

export type ShotResult = {
  yards: number
  flagYards: number
  fromFlag: number
  /** The swing's strike factor; see strikeFactor. */
  strike: number
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
export const MIN_CARRY = 8
export const MAX_CARRY = 135

export const BALL_RADIUS = 0.11
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

export function carryDistance(power: number) {
  return MathUtils.lerp(MIN_CARRY, MAX_CARRY, clamp01(power))
}

/** How far down to pull, in pixels, to carry a given number of yards. */
export function backswingForYards(yards: number) {
  const power = clamp01(
    (yards / YARDS_PER_UNIT - MIN_CARRY) / (MAX_CARRY - MIN_CARRY),
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
    carry * MathUtils.lerp(0.18, 0.08, shot.power) * MathUtils.lerp(0.9, 1.1, random())
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
export function pointOnRoll(roll: Roll, progress: number, target = new Vector3()) {
  const t = clamp01(progress)
  target.lerpVectors(roll.from, roll.to, 1 - Math.pow(1 - t, 3))
  target.y = BALL_RADIUS + hopHeight(roll.hops, t * roll.duration)
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

export function resultForRest(point: Vector3, strike = 1): ShotResult {
  const { flag, distance } = nearestFlag(point)
  return {
    yards: toYards(Math.hypot(point.x, point.z)),
    flagYards: flag.yards,
    fromFlag: toYards(distance),
    strike,
  }
}
