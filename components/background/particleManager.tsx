import { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei';

interface ParticleProps {
  initialPosition: number[];
  initialVelocity: number;
  direction: number[];
  maxVelocity: number;
  canReset: boolean;
}

const Particle: React.FC<ParticleProps> = ({
  initialPosition,
  initialVelocity,
  direction,
  maxVelocity,
  canReset,
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
    [initialPosition]
  );

  useFrame((state, delta) => {
    const newElapsedTime = elapsedTime + delta;
    setElapsedTime(newElapsedTime);

    setVelocity(maxVelocity);

    const fadeDuration = 1;
    if (canReset) {
      const newOpacity = Math.min(newElapsedTime / fadeDuration, 1);
      setOpacity(newOpacity);
    } else {
      setElapsedTime(0)
    }

    const newPos = position.map(
      (p, idx) => p + velocity * direction[idx] * delta
    );
    setPosition(newPos);

    geom.setFromPoints([new THREE.Vector3(...position)]);

    if (isPastCamera(newPos, camera.position)) {
      setPosition(initialPosition);
      setVelocity(maxVelocity);
      setOpacity(0);
      setElapsedTime(0);
    }
  });

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial color="white" size={0.02} transparent opacity={opacity} />
    </points>
  );
};

const isPastCamera = (particlePosition, cameraPosition) => {
  const distanceFromOrigin = Math.sqrt(
    particlePosition[0] * particlePosition[0] +
    particlePosition[1] * particlePosition[1] +
    particlePosition[2] * particlePosition[2]
  );

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

const ParticlesManager = ({
  maxParticles,
  maxVelocity,
  emitInterval,
  canReset,
}) => {
  const [particles, setParticles] = useState<ParticlesProps[]>([]);
  const { camera } = useThree();

  useEffect(() => {
    const interval = setInterval(() => {
      if (particles.length < maxParticles) {
        const depth = 1;
        const fovInRadians = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov);
        const height = 2 * depth * Math.tan(fovInRadians / 2);
        const width = height * (camera as THREE.PerspectiveCamera).aspect;

        const direction = new THREE.Vector3(
          (Math.random() - 0.5) * width,
          (Math.random() - 0.5) * height,
          depth
        ).normalize();

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

      } else {
        clearInterval(interval);
      }
    }, emitInterval);

    return () => clearInterval(interval);
  }, [particles, camera, emitInterval, maxParticles]);

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

export default ParticlesManager;