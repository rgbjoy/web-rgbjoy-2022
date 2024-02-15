import {  useRef, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber'
import * as THREE from 'three';
import { interactionGroups, Physics, InstancedRigidBodies, RapierRigidBody, InstancedRigidBodyProps } from "@react-three/rapier";
import { Attractor } from "@react-three/rapier-addons";

const Rig404 = () => {
  const COUNT = 26;
  const refMesh = useRef<THREE.InstancedMesh>(null);
  const rigidBodies = useRef<RapierRigidBody[]>(null);

  const { camera } = useThree();
  camera.position.set(0, 0, 20);
  camera.lookAt(0, 0, 0);

  useEffect(() => {
    const color = ["red", "green", "blue"]
    if (refMesh.current) {
      for (let i = 0; i < COUNT * COUNT; i++) {
        refMesh.current!.setColorAt(i, new THREE.Color(color[Math.floor(Math.random() * color.length)]));
      }
      refMesh.current!.instanceColor!.needsUpdate = true;
    }

  }, []);

  const instances = useMemo(() => {
    const instances: InstancedRigidBodyProps[] = [];
    for (let row = 0; row < COUNT / 2; row++) {
      for (let column = 0; column < COUNT / 2; column++) {
        const index = row * COUNT / 2 + column;
        instances.push({
          key: `instance_${row}_${column}`,
          position: [-(COUNT / 2) / 2 + row + 0.5, Math.random() * 4 + 1, -(COUNT / 2) / 2 + column + 0.5],
          collisionGroups: interactionGroups(index === 0 ? 0 : 1)
        });
      }
    }

    return instances;
  }, []);

  return (
    <Physics gravity={[0, 0, 0]}>
      <InstancedRigidBodies
        ref={rigidBodies}
        instances={instances}
        colliders="ball"
      >
        <instancedMesh ref={refMesh} args={[undefined, undefined, COUNT * COUNT]} count={COUNT * COUNT}>
          <sphereGeometry args={[0.25]} />
          <meshBasicMaterial side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthTest={false} transparent={true} />
          <Attractor
            strength={-0.3}
            range={2}
            collisionGroups={interactionGroups(0, 1)}
          />
        </instancedMesh>
      </InstancedRigidBodies>
      <Attractor strength={0.01} />
    </Physics>
  )
}

export default Rig404;