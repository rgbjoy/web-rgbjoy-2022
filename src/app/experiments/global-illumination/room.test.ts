import { afterEach, expect, test } from 'bun:test'
import { Quaternion, Vector3 } from 'three'

import { blockInverse, keepInRoom, OBJECTS, pickObject, resetObjects, rotatable, sceneDefines } from './room'

afterEach(resetObjects)

const toward = (from: Vector3, to: Vector3) => to.clone().sub(from).normalize()

test('a ray from inside the room picks what it meets first', () => {
  const eye = new Vector3(-2.2, 2.7, 5.2)
  expect(pickObject(eye, toward(eye, OBJECTS.glow.position))).toBe('glow')
  expect(pickObject(eye, toward(eye, OBJECTS.pebble.position))).toBe('pebble')
  expect(pickObject(eye, toward(eye, OBJECTS.block.position))).toBe('block')
  // Straight up at the ceiling: nothing.
  expect(pickObject(eye, new Vector3(0, 1, 0))).toBeNull()
})

test('the nearer of two objects in line wins', () => {
  OBJECTS.pebble.position.set(0, 1, 0)
  OBJECTS.glow.position.set(0, 1, -3)
  const eye = new Vector3(0, 1, 4)
  expect(pickObject(eye, new Vector3(0, 0, -1))).toBe('pebble')
})

test('from outside, only what shows through the window can be picked', () => {
  OBJECTS.block.position.set(0, 2.3, -2)
  // Level with the window, looking in through it.
  const window = new Vector3(14, 2.3, -2)
  expect(pickObject(window, new Vector3(-1, 0, 0))).toBe('block')
  // Same line of sight through the solid wall beside it.
  const wall = new Vector3(14, 2.3, 3)
  expect(pickObject(wall, toward(wall, new Vector3(0, 2.3, 3)))).toBeNull()
})

test('a turned block is picked by its own corners, not its upright box', () => {
  OBJECTS.block.position.set(0, 1, 0)
  OBJECTS.block.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4)
  const eye = new Vector3(-3, 1, 3)
  // A diagonal corner of the turned block reaches x = 1.41; the upright one would stop at 1.
  expect(pickObject(eye, toward(eye, new Vector3(1.3, 1, 0)))).toBe('block')
  // Through where the upright box's corner would be — x + z = 1.75 — but
  // outside the turned one's diamond (|x| + |z| ≤ 1.44): a miss.
  const corner = new Vector3(-1.25, 1, 3)
  expect(pickObject(corner, new Vector3(1, 0, -1).normalize())).toBeNull()
})

test('the block’s inverse rotation undoes its turn', () => {
  OBJECTS.block.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(1, 1, 0).normalize(), 0.7))
  const v = new Vector3(0.3, -0.2, 0.9)
  const turned = v.clone().applyQuaternion(OBJECTS.block.quaternion)
  expect(turned.applyMatrix3(blockInverse()).distanceTo(v)).toBeLessThan(1e-9)
})

test('objects stay inside the room, clear of its walls', () => {
  const p = keepInRoom('glow', new Vector3(10, -4, -20))
  expect(p.toArray()).toEqual([2.5, 1, -5])
  expect(keepInRoom('pebble', new Vector3(0, 0, 0)).y).toBe(0.55)
})

test('only the block turns', () => {
  expect(rotatable('block')).toBe(true)
  expect(rotatable('glow')).toBe(false)
  expect(rotatable('pebble')).toBe(false)
})

test('the shader gets the same shapes', () => {
  expect(sceneDefines()).toMatchObject({
    ROOM_CENTER: 'vec3(0.0000, 2.2500, 0.0000)',
    ROOM_HALF: 'vec3(3.5000, 2.2500, 6.0000)',
    WINDOW: 'vec4(2.3000, -2.0000, 1.2000, 1.2000)',
    BLOCK_HALF: 'vec3(1.0000)',
  })
})
