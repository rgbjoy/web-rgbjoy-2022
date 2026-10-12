import { expect, test } from 'bun:test'

import { mulberry32 } from './blueNoise'
import {
  PROBE_ATLAS_HEIGHT,
  PROBE_ATLAS_WIDTH,
  PROBE_COUNT,
  PROBE_GRID,
  PROBE_ORIGIN,
  PROBE_SPACING,
  ProbeSchedule,
  probeDefines,
  randomRotation,
} from './probes'

// The room's inside, from scene.glsl.
const ROOM_MIN = [-3.5, 0, -6]
const ROOM_MAX = [3.5, 4.5, 6]

test('the grid fills the room evenly, a quarter metre in from every wall', () => {
  for (let axis = 0; axis < 3; axis++) {
    const first = PROBE_ORIGIN[axis]
    const last = first + (PROBE_GRID[axis] - 1) * PROBE_SPACING
    expect(first - ROOM_MIN[axis]).toBeCloseTo(0.25, 9)
    expect(ROOM_MAX[axis] - last).toBeCloseTo(0.25, 9)
  }
})

test('the atlas has a texel for every probe', () => {
  expect(PROBE_ATLAS_WIDTH * PROBE_ATLAS_HEIGHT).toBeGreaterThanOrEqual(PROBE_COUNT)
  expect(PROBE_ATLAS_WIDTH * (PROBE_ATLAS_HEIGHT - 1)).toBeLessThan(PROBE_COUNT)
})

test('the shader gets the same layout', () => {
  expect(probeDefines()).toEqual({
    PROBE_GRID: 'ivec3(14, 9, 24)',
    PROBE_ORIGIN: 'vec3(-3.2500, 0.2500, -5.7500)',
    PROBE_SPACING: '0.5000',
    PROBE_COUNT: '3024',
    PROBE_ATLAS_WIDTH: '64',
  })
})

test('updates start as a plain mean, keep a floor, and stop at the limit', () => {
  const schedule = new ProbeSchedule(40, 0.05)
  const weights: number[] = []
  while (schedule.pending()) weights.push(schedule.next())

  expect(weights).toHaveLength(40)
  expect(weights.slice(0, 3)).toEqual([1, 1 / 2, 1 / 3])
  expect(Math.min(...weights)).toBe(0.05)
  schedule.reset()
  expect(schedule.pending()).toBe(true)
  expect(schedule.next()).toBe(1)
})

test('ray rotations are proper rotations', () => {
  const random = mulberry32(9)
  for (let trial = 0; trial < 20; trial++) {
    const m = randomRotation(random)
    const column = (c: number) => [m[c * 3], m[c * 3 + 1], m[c * 3 + 2]]
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) expect(dot(column(i), column(j))).toBeCloseTo(i === j ? 1 : 0, 9)
    }
    // Right-handed: no mirror image.
    const [a, b, c] = [column(0), column(1), column(2)]
    const cross = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
    expect(dot(cross, c)).toBeCloseTo(1, 9)
  }
})
