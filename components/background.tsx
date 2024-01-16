import { useState, useRef, useEffect, useMemo } from 'react';

import * as THREE from 'three';
import { ResizeObserver } from "@juggle/resize-observer"
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, useCursor, RoundedBox } from '@react-three/drei'
import { interactionGroups, Physics, InstancedRigidBodies, RapierRigidBody, InstancedRigidBodyProps } from "@react-three/rapier";
import { Attractor } from "@react-three/rapier-addons";

import gsap from "gsap"

import style from "./background.module.scss"

let clickable: boolean = false
let firstLoad: boolean = true
let currentPage: string = ""

const colors = {
  "home": {
    "red": { r: 1, g: 0, b: 0 },
    "green": { r: 0, g: 1, b: 0 },
    "blue": { r: 0, g: 0, b: 1 },
  },
  "info": {
    r: 1, g: 0, b: 0
  },
  "dev": {
    r: 0, g: 1, b: 0
  },
  "art": {
    r: 0, g: 0, b: 1
  },
  "posts": {
    r: 1, g: 1, b: 0
  },
};

const getRandomPick = (items: Array<number>): number => {
  return items[Math.floor(Math.random() * items.length)];
}

const getRandomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
}

const animateIn = (meshes) => {
  for (var m of meshes) {

    if (firstLoad) {
      m.position.set(getRandomPick([-5, 5]), getRandomPick([-5, 5]), getRandomPick([-5, 5]))
    }

    if (m.name == "red") {
      gsap.to(m.position, { duration: 2, x: 0, y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: THREE.MathUtils.degToRad(90), y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.children[0].material.color, { duration: 2, r: colors[currentPage][m.name].r, g: colors[currentPage][m.name].g, b: colors[currentPage][m.name].b, ease: "Power2.easeOut" });
    } else if (m.name == "green") {
      gsap.to(m.position, { duration: 2, x: 0, y: -0.5, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: 0, y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.children[0].material.color, { duration: 2, r: colors[currentPage][m.name].r, g: colors[currentPage][m.name].g, b: colors[currentPage][m.name].b, ease: "Power2.easeOut" });
    } else if (m.name == "blue") {
      gsap.to(m.position, { duration: 2, x: 0.5, y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: 0, y: THREE.MathUtils.degToRad(90), z: 0, ease: "Power2.easeOut" });
      gsap.to(m.children[0].material.color, { duration: 2, r: colors[currentPage][m.name].r, g: colors[currentPage][m.name].g, b: colors[currentPage][m.name].b, ease: "Power2.easeOut" });
    }

    gsap.to(m.children[0].material, { duration: 2, opacity: 1, ease: "Power2.easeOut", onComplete: () => { clickable = true } });
  }
  firstLoad = false
}

const animateOut = (meshes, explode: boolean = false) => {
  let maxDegree = 45
  let maxDistance = explode ? 2 : 1
  for (var m of meshes) {
    gsap.to(m.rotation, { yoyo: explode ? true : false, repeat: explode ? 1 : 0, overwrite: true, duration: explode ? 1 : 1.5, x: THREE.MathUtils.degToRad(getRandomRange(-maxDegree, maxDegree)), y: THREE.MathUtils.degToRad(getRandomRange(-maxDegree, maxDegree)), z: THREE.MathUtils.degToRad(getRandomRange(-maxDegree, maxDegree)), ease: explode ? "Sine.easInOut" : "Power2.easInOut" });
    gsap.to(m.position, { yoyo: explode ? true : false, repeat: explode ? 1 : 0, overwrite: true, duration: explode ? 1 : 1.5, x: getRandomRange(-maxDistance, maxDistance), y: getRandomRange(-maxDistance, maxDistance), z: getRandomRange(-maxDistance, maxDistance), ease: explode ? "Sine.easInOut" : "Power2.easInOut" });
    gsap.to(m.children[0].material, { yoyo: explode ? true : false, repeat: explode ? 1 : 0, overwrite: true, duration: explode ? 1 : 1.5, opacity: explode ? 1 : 0.15, ease: explode ? "Sine.easInOut" : "Power2.easInOut", onComplete: () => { clickable = true } });

    if (!explode) {
      gsap.to(m.children[0].material.color, { overwrite: true, duration: 1.5, r: colors[currentPage].r, g: colors[currentPage].g, b: colors[currentPage].b, ease: "Power2.easInOut" });
    }
  }
  firstLoad = false
}

const handleClick = (e) => {
  if (!clickable || currentPage !== "home") {
    return
  }

  clickable = false

  const meshes = e.eventObject.children
  animateOut(meshes, true)
}

const RGBPlane = (props: any) => {
  const config = {
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    color: props.color,
    opacity: 0,
    depthTest: false,
    transparent: true,
  }
  return (
    <mesh {...props}>
      <RoundedBox args={[1, 1, 0.01]} radius={0.01}>
        <meshBasicMaterial {...config} />
      </RoundedBox>
    </mesh>
  )
}

interface ParticleProps {
  initialPosition: number[];
  initialVelocity: number;
  direction: number[];
  maxVelocity: number;
  canReset: boolean
}

const Particle: React.FC<ParticleProps> = ({
  initialPosition,
  initialVelocity,
  direction,
  maxVelocity,
  canReset
}) => {
  const ref = useRef<THREE.Points>(null);
  const [position, setPosition] = useState(initialPosition); // Set initial position
  const [velocity, setVelocity] = useState(initialVelocity);
  const [opacity, setOpacity] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { camera } = useThree();
  const geom = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...initialPosition),
      ]),
    []
  );

  useFrame((state, delta) => {
    const newElapsedTime = elapsedTime + delta;
    setElapsedTime(newElapsedTime);

    // Gradually increase velocity to maxVelocity
    if (velocity < maxVelocity) {
      const newVelocity = Math.min(velocity + 0.01, maxVelocity);
      setVelocity(newVelocity);
    } else {
      setVelocity(maxVelocity);
    }

    const fadeDuration = 2;
    if (canReset) {
      const newOpacity = Math.min(newElapsedTime / fadeDuration, 1);
    setOpacity(newOpacity);
    }


    // Update position based on velocity and direction
    const newPos = position.map(
      (p, idx) => p + velocity * direction[idx] * delta
    );
    setPosition(newPos);

    geom.setFromPoints([new THREE.Vector3(...position)]);

    // Reset position and opacity if past the camera
    if (isPastCamera(newPos, camera.position)) {
      setPosition(initialPosition);
      setVelocity(maxVelocity); // Reset velocity to initial velocity
      setOpacity(0); // Reset opacity
      setElapsedTime(0);
    }
  });

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial color="white" size={0.01} transparent opacity={opacity} />
    </points>
  );
};

const isPastCamera = (particlePosition, cameraPosition) => {
  // Calculate the distance of the particle from the origin
  const distanceFromOrigin = Math.sqrt(
    particlePosition[0] * particlePosition[0] +
    particlePosition[1] * particlePosition[1] +
    particlePosition[2] * particlePosition[2]
  );

  // Calculate the distance of the camera from the origin
  const cameraDistance = Math.sqrt(
    cameraPosition.x * cameraPosition.x +
    cameraPosition.y * cameraPosition.y +
    cameraPosition.z * cameraPosition.z
  );

  return distanceFromOrigin > cameraDistance;
};

type ParticlesProps = {
  initialPosition: [number, number, number];
  initialVelocity: number;
  direction: number[];
  maxVelocity: number;
  canReset: boolean
};

// particles Manager Component
const ParticlesManager = ({
  maxparticles,
  maxVelocity,
  emitInterval,
  canReset,
}) => {
  const [particles, setParticles] = useState<ParticlesProps[]>([]);
  const emitCounter = useRef(0);
  const { camera } = useThree();

  useFrame((state, delta) => {
    emitCounter.current += delta;
    if (
      emitCounter.current >= emitInterval &&
      particles.length < maxparticles
    ) {
      emitCounter.current = 0;

      // doa bunch of magic math here...
      const depth = 1;
      const fovInRadians = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov);
      const height = 2 * depth * Math.tan(fovInRadians / 2);
      const width = height * (camera as THREE.PerspectiveCamera).aspect;

      // Randomize direction within this spread
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * width, // x-component
        (Math.random() - 0.5) * height, // y-component
        depth // z-component pointing behind the camera
      ).normalize();

      // Transform the direction by the camera's rotation
      const cameraMatrix = new THREE.Matrix4();
      cameraMatrix.extractRotation(camera.matrixWorld);
      direction.applyMatrix4(cameraMatrix);

      const initialPosition = [0, 0, 0];

      setParticles((particles: never[]) => [
        ...particles,
        {
          initialPosition,
          initialVelocity: 0,
          direction: direction.toArray(),
        },
      ] as never[]);
    }
  });

  return (
    <>
      {particles.map((particle, index) => (
        <Particle
          key={index}
          initialPosition={particle.initialPosition}
          initialVelocity={particle.initialVelocity}
          direction={particle.direction}
          maxVelocity={maxVelocity}
          canReset={canReset}
        />
      ))}
    </>
  );
};

const RigPages = ({ page }) => {

  const { camera } = useThree();
  camera.position.set(3, 3, 3);
  camera.lookAt(0, 0, 0);

  const [hovered, set] = useState(Boolean)
  useCursor(hovered && currentPage === "home", 'pointer', 'auto')

  const ref = useRef<THREE.Group>(null!)
  currentPage = page.split("/")[1] === "" ? "home" : page.split("/")[1]

  useEffect(() => {
    const meshes = ref.current && ref.current.children
    if (currentPage === "home") {
      animateIn(meshes)
    } else {
      animateOut(meshes)
    }
  }, [page])

  useFrame((state, delta) => {
    let WIDTH = state.viewport.width * state.viewport.factor;
    ref.current.position.y = WIDTH < 768 ? -0.5 : 0;
    ref.current.rotation.y += delta / (currentPage === "home" ? 5 : 25);
  })

  return (
    <>
      <group
        onPointerOver={() => set(true)} onPointerOut={() => set(false)}
        onClick={e => handleClick(e)}
        ref={ref}>
        <RGBPlane color="#FF0000" name="red" />
        <RGBPlane color="#00FF00" name="green" />
        <RGBPlane color="#0000FF" name="blue" />
      </group>
    </>
  )
}

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

const RenderPageContent = ({ page }) => {
  if (page === "404") {
    return <Rig404 />;
  } else {
    return (
      <RigPages page={page} />
    );
  }
};

const Background = ({ page }: { page: string }) => {
  return (
    <Canvas className={style.background} camera={{ fov: 35 }} resize={{ polyfill: ResizeObserver }}
      gl={{
        antialias: false,
        depth: false,
        toneMapping: THREE.NoToneMapping,
      }}>
      <Float>
        <RenderPageContent page={page} />
      </Float>
      <ParticlesManager
        maxparticles={100}
        maxVelocity={1.5}
        emitInterval={0.1}
        canReset={page === "/" ? true : false}
      />
    </Canvas>
  )
}

export default Background