import { Matrix3, Matrix4, Object3D, Quaternion, Vector3 } from "three"

/**
 * The room's shape, in one place: fed to scene.glsl as defines, and used here
 * to pick what's under the pointer and to keep things inside the room.
 */
export const ROOM_CENTER = [0, 2.25, 0] as const
export const ROOM_HALF = [3.5, 2.25, 6] as const
export const WALL = 0.6
/** The window through the +x wall: centre y and z, then half height and half width. */
export const WINDOW = [2.3, -2.0, 1.2, 1.2] as const

export const GLOW_RADIUS = 1
export const PEBBLE_RADIUS = 0.55
export const BLOCK_HALF = 1
/** The block's edges are rounded this much. */
export const BLOCK_ROUNDING = 0.02

export type SceneObject = "glow" | "pebble" | "block"

const vec3 = (v: readonly number[]) => `vec3(${v.map((n) => n.toFixed(4)).join(", ")})`

export function sceneDefines() {
  return {
    ROOM_CENTER: vec3(ROOM_CENTER),
    ROOM_HALF: vec3(ROOM_HALF),
    WALL: WALL.toFixed(4),
    WINDOW: `vec4(${WINDOW.map((n) => n.toFixed(4)).join(", ")})`,
    GLOW_RADIUS: GLOW_RADIUS.toFixed(4),
    PEBBLE_RADIUS: PEBBLE_RADIUS.toFixed(4),
    BLOCK_HALF: `vec3(${BLOCK_HALF.toFixed(4)})`,
    BLOCK_ROUNDING: BLOCK_ROUNDING.toFixed(4),
  }
}

const DEFAULTS = {
  glow: new Vector3(-1.7, 1.0, -2.7),
  pebble: new Vector3(0.2, 0.55, -2.1),
  block: new Vector3(2.2, 1.0, -3.6),
  blockTurn: new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.35),
}

/**
 * The three movable objects, as stand-ins for the transform gizmo to drag
 * around. Kept for the page's lifetime, so a move survives leaving the page
 * and coming back, like the panel's settings.
 */
export const OBJECTS: Record<SceneObject, Object3D> = {
  glow: new Object3D(),
  pebble: new Object3D(),
  block: new Object3D(),
}

export function resetObjects() {
  OBJECTS.glow.position.copy(DEFAULTS.glow)
  OBJECTS.glow.quaternion.identity()
  OBJECTS.pebble.position.copy(DEFAULTS.pebble)
  OBJECTS.pebble.quaternion.identity()
  OBJECTS.block.position.copy(DEFAULTS.block)
  OBJECTS.block.quaternion.copy(DEFAULTS.blockTurn)
}
resetObjects()

/** Only the block shows a turn; a plain sphere looks the same however it's spun. */
export const rotatable = (name: SceneObject) => name === "block"

/** How far each object's centre has to keep from the walls, floor and ceiling. */
const CLEARANCE: Record<SceneObject, number> = {
  glow: GLOW_RADIUS,
  pebble: PEBBLE_RADIUS,
  // Its corners stick out furthest; only its middle is held off the walls,
  // so a turned block can still sit flush in a corner.
  block: BLOCK_HALF,
}

/** Keeps an object's centre inside the room, its surface off the walls. */
export function keepInRoom(name: SceneObject, position: Vector3) {
  const margin = CLEARANCE[name]
  for (let axis = 0; axis < 3; axis++) {
    const lo = ROOM_CENTER[axis] - ROOM_HALF[axis] + margin
    const hi = ROOM_CENTER[axis] + ROOM_HALF[axis] - margin
    position.setComponent(axis, Math.min(Math.max(position.getComponent(axis), lo), hi))
  }
  return position
}

const turn = new Matrix4()

/** The block's world-to-local rotation, as the shader wants it. */
export function blockInverse(target = new Matrix3()) {
  return target.setFromMatrix4(turn.makeRotationFromQuaternion(OBJECTS.block.quaternion)).transpose()
}

/** Where a ray enters and leaves an axis-aligned box; null if it misses or the box is behind it. */
function boxSpan(origin: Vector3, direction: Vector3, centre: readonly number[], half: readonly number[]) {
  let near = -Infinity
  let far = Infinity
  for (let axis = 0; axis < 3; axis++) {
    const o = origin.getComponent(axis) - centre[axis]
    const d = direction.getComponent(axis)
    const a = (-half[axis] - o) / d
    const b = (half[axis] - o) / d
    near = Math.max(near, Math.min(a, b))
    far = Math.min(far, Math.max(a, b))
  }
  return near <= far && far > 0 ? { near, far } : null
}

function sphereHit(origin: Vector3, direction: Vector3, centre: Vector3, radius: number) {
  const oc = origin.clone().sub(centre)
  const b = oc.dot(direction)
  const h = b * b - oc.lengthSq() + radius * radius
  if (h < 0) return Infinity
  const t = -b - Math.sqrt(h)
  return t > 0 ? t : Infinity
}

function blockHit(origin: Vector3, direction: Vector3) {
  const inverse = blockInverse()
  const o = origin.clone().sub(OBJECTS.block.position).applyMatrix3(inverse)
  const d = direction.clone().applyMatrix3(inverse)
  const half = BLOCK_HALF + BLOCK_ROUNDING
  const span = boxSpan(o, d, [0, 0, 0], [half, half, half])
  return span && span.near > 0 ? span.near : Infinity
}

/**
 * The object a ray from the camera lands on first, or null. Same shapes the
 * shader draws: from inside the room — or from inside a wall, which the
 * camera sees straight through — anything goes; from outside, only what can
 * be seen in through the window.
 */
export function pickObject(origin: Vector3, direction: Vector3): SceneObject | null {
  const shell = ROOM_HALF.map((h) => h + WALL)
  const outside = ROOM_CENTER.some((c, axis) => Math.abs(origin.getComponent(axis) - c) > shell[axis])
  let from = 0
  if (outside) {
    const room = boxSpan(origin, direction, ROOM_CENTER, ROOM_HALF)
    if (!room) return null
    const entry = origin.clone().addScaledVector(direction, room.near)
    const throughWindow =
      Math.abs(entry.x - (ROOM_CENTER[0] + ROOM_HALF[0])) < 1e-3 &&
      Math.abs(entry.y - WINDOW[0]) <= WINDOW[2] &&
      Math.abs(entry.z - WINDOW[1]) <= WINDOW[3]
    if (!throughWindow) return null
    from = room.near
  }

  const hits: [SceneObject, number][] = [
    ["glow", sphereHit(origin, direction, OBJECTS.glow.position, GLOW_RADIUS)],
    ["pebble", sphereHit(origin, direction, OBJECTS.pebble.position, PEBBLE_RADIUS)],
    ["block", blockHit(origin, direction)],
  ]
  const [name, t] = hits.reduce((best, hit) => (hit[1] < best[1] ? hit : best))
  return t < Infinity && t >= from ? name : null
}
