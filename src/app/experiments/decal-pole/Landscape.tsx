import { useMemo } from "react"
import * as THREE from "three"

import { NEON } from "./pole"

const GROUND_SIZE = 500
const GROUND_SEGMENTS = 100
/** The ground stays flat this far out, so the pole stands on level grid. */
const FLAT_RADIUS = 30
const TREE_COUNT = 60

const groundMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(...NEON.GROUND),
  wireframe: true,
  toneMapped: false,
})

/* Solid dark fill under the grid, so hills hide whatever stands behind them.
   Polygon offset pushes it back a touch so the grid lines draw on top. */
const groundFillMaterial = new THREE.MeshBasicMaterial({
  color: NEON.POLE_FILL,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
})

const treeMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(...NEON.TREE),
  wireframe: true,
  toneMapped: false,
})

const treeFillMaterial = new THREE.MeshBasicMaterial({
  color: NEON.TREE_FILL,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
})

const trunkGeometry = new THREE.CylinderGeometry(0.35, 0.6, 4, 8, 2)

/** A pine is three stacked cones, each narrower and higher than the last. */
const PINE_TIERS = [
  { y: 5, geometry: new THREE.ConeGeometry(3.8, 6, 10, 3) },
  { y: 8, geometry: new THREE.ConeGeometry(3, 5.5, 10, 3) },
  { y: 11, geometry: new THREE.ConeGeometry(2, 5, 10, 3) },
]

/** Rolling hills that rise out of the flat ground around the pole. */
function terrainHeight(x: number, z: number): number {
  const distance = Math.hypot(x, z)
  const rise = THREE.MathUtils.smoothstep(distance, FLAT_RADIUS, FLAT_RADIUS * 3)
  const hills = 10 + 6 * Math.sin(x * 0.05) * Math.cos(z * 0.07) + 4 * Math.sin(x * 0.13 + z * 0.09)
  return rise * hills
}

/** Stable pseudo-random number in [0, 1), so the trees never move between loads. */
function random(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

export function Landscape() {
  return (
    <>
      <Ground />
      <Trees />
    </>
  )
}

function Ground() {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, GROUND_SEGMENTS, GROUND_SEGMENTS)
    plane.rotateX(-Math.PI / 2)

    const positions = plane.attributes.position
    for (let i = 0; i < positions.count; i++) {
      positions.setY(i, terrainHeight(positions.getX(i), positions.getZ(i)))
    }
    return plane
  }, [])

  return (
    <>
      <mesh geometry={geometry} material={groundFillMaterial} />
      <mesh geometry={geometry} material={groundMaterial} />
    </>
  )
}

function Trees() {
  const trees = useMemo(
    () =>
      Array.from({ length: TREE_COUNT }, (_, i) => {
        const angle = random(i) * Math.PI * 2
        const distance = 25 + random(i + 100) * 150
        const x = Math.sin(angle) * distance
        const z = Math.cos(angle) * distance
        return { x, z, y: terrainHeight(x, z), size: 0.8 + random(i + 200) * 0.8, spin: random(i + 300) * Math.PI }
      }),
    [],
  )

  return (
    <>
      {trees.map((tree, i) => (
        <group
          key={i}
          position={[tree.x, tree.y, tree.z]}
          rotation={[0, tree.spin, 0]}
          scale={tree.size}
        >
          <mesh position={[0, 2, 0]} geometry={trunkGeometry} material={treeFillMaterial} />
          <mesh position={[0, 2, 0]} geometry={trunkGeometry} material={treeMaterial} />
          {PINE_TIERS.map((tier) => (
            <group key={tier.y} position={[0, tier.y, 0]}>
              <mesh geometry={tier.geometry} material={treeFillMaterial} />
              <mesh geometry={tier.geometry} material={treeMaterial} />
            </group>
          ))}
        </group>
      ))}
    </>
  )
}
