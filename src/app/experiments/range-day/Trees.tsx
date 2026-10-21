"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  InstancedMesh,
  Object3D,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import type { Terrain } from "./game";

const TRUNK_HEIGHT = 2;
/** Stacked cones for the foliage, widest at the bottom: [radius, height, y]. */
const TIERS: [number, number, number][] = [
  [2.6, 4.2, 3.6],
  [2.1, 3.6, 5.4],
  [1.5, 3, 7.2],
];
const DARK_GREEN = new Color("#33602f");
const LIGHT_GREEN = new Color("#4f8044");

/** A repeatable 0–1 value for a tree, so the line looks the same every visit. */
function treeNoise(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** Where each tree stands: a far row across the end, and a row down each side. */
function treeSpots() {
  const spots: [number, number, number][] = [];
  for (let x = -110; x <= 110; x += 5) spots.push([x, -150, 0]);
  for (let z = 10; z > -150; z -= 6) {
    spots.push([-70, z, 1]);
    spots.push([70, z, 2]);
  }
  return spots.map(([x, z, row], index) => {
    const noise = treeNoise(index, row);
    return {
      x: x + (noise - 0.5) * 4,
      z: z + (noise - 0.5) * 6 - (row === 0 ? noise * 8 : 0),
      scale: 0.8 + noise * 0.6,
      turn: treeNoise(index, row + 3) * Math.PI * 2,
      shade: treeNoise(index, row + 7),
    };
  });
}

function foliageGeometry() {
  const tiers = TIERS.map(([radius, height, y]) =>
    new ConeGeometry(radius, height, 9).translate(0, y, 0),
  );
  const merged = mergeGeometries(tiers);
  tiers.forEach((tier) => tier.dispose());
  return merged;
}

/** Low-poly pines around the range: tiered, faceted, each a slightly different green. */
export function TreeLine({ terrain }: { terrain: Terrain }) {
  const foliageRef = useRef<InstancedMesh>(null);
  const trunkRef = useRef<InstancedMesh>(null);
  const trees = useMemo(() => treeSpots(), []);
  const foliage = useMemo(() => foliageGeometry(), []);
  const trunk = useMemo(
    () => new CylinderGeometry(0.28, 0.4, TRUNK_HEIGHT, 6).translate(0, TRUNK_HEIGHT / 2, 0),
    [],
  );

  useEffect(
    () => () => {
      foliage.dispose();
      trunk.dispose();
    },
    [foliage, trunk],
  );

  useEffect(() => {
    const leaves = foliageRef.current;
    const trunks = trunkRef.current;
    if (!leaves || !trunks) return;

    const dummy = new Object3D();
    const color = new Color();
    trees.forEach((tree, index) => {
      dummy.position.set(tree.x, terrain(tree.x, tree.z), tree.z);
      dummy.rotation.y = tree.turn;
      dummy.scale.setScalar(tree.scale);
      dummy.updateMatrix();
      leaves.setMatrixAt(index, dummy.matrix);
      trunks.setMatrixAt(index, dummy.matrix);
      leaves.setColorAt(index, color.lerpColors(DARK_GREEN, LIGHT_GREEN, tree.shade));
    });
    for (const mesh of [leaves, trunks]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  }, [terrain, trees]);

  return (
    <>
      <instancedMesh ref={foliageRef} args={[foliage, undefined, trees.length]}>
        <meshStandardMaterial roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[trunk, undefined, trees.length]}>
        <meshStandardMaterial color="#6b4a32" roughness={1} flatShading />
      </instancedMesh>
    </>
  );
}
