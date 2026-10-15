import { Euler, Matrix3, Matrix4, Quaternion, Vector3 } from "three"

/**
 * The striped plus that tumbles in the sun's shaft, just in front of the
 * spheres. Its shape in one place: written into the shaders as constants
 * (layout.ts), and used here to keep clicks on it from picking whatever is
 * behind.
 */

/** Half the length of each arm, end to end through the middle. */
export const PLUS_ARM = 0.55
/** Half the thickness of each bar. */
export const PLUS_BAR = 0.12
/** How much its edges round off. */
export const PLUS_ROUNDING = 0.03
/** Diagonal stripes per metre across its faces. */
export const PLUS_STRIPES = 4.5

/**
 * Just in front of the spheres, on the near edge of the sun's shaft, so its
 * arms swing in and out of the light as it tumbles and its shadow crosses the
 * orange sphere.
 */
export const PLUS_CENTER = new Vector3(0.6, 2.0, -1.75)

/** It tumbles a little as it spins, so every side comes round to the light. */
const TUMBLE = 0.37

const euler = new Euler()
const quaternion = new Quaternion()
const rotation = new Matrix4()

/** The plus's turn, local to world, once it has spun through `angle` radians. */
export function plusTurn(angle: number, target = new Matrix3()) {
  quaternion.setFromEuler(euler.set(angle * TUMBLE, angle, 0, "YXZ"))
  return target.setFromMatrix4(rotation.makeRotationFromQuaternion(quaternion))
}

const inverse = new Matrix3()
const o = new Vector3()
const d = new Vector3()

/** Where a ray in the plus's own frame enters a box about its middle; Infinity for a miss or one behind. */
function boxEntry(half: readonly number[]) {
  let near = -Infinity
  let far = Infinity
  for (let axis = 0; axis < 3; axis++) {
    const a = (-half[axis] - o.getComponent(axis)) / d.getComponent(axis)
    const b = (half[axis] - o.getComponent(axis)) / d.getComponent(axis)
    near = Math.max(near, Math.min(a, b))
    far = Math.min(far, Math.max(a, b))
  }
  return near <= far && near > 0 ? near : Infinity
}

/**
 * Distance along a ray to the plus, as the shader casts it: its two bars as
 * boxes, the rounding of their edges ignored. Infinity for a miss.
 */
export function plusHit(origin: Vector3, direction: Vector3, turn: Matrix3) {
  inverse.copy(turn).transpose()
  o.copy(origin).sub(PLUS_CENTER).applyMatrix3(inverse)
  d.copy(direction).applyMatrix3(inverse)
  return Math.min(boxEntry([PLUS_ARM, PLUS_BAR, PLUS_BAR]), boxEntry([PLUS_BAR, PLUS_ARM, PLUS_BAR]))
}
