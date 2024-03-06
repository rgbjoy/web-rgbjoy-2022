import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { ShaderMaterial, Vector3 } from "three";

class StarfieldMaterial extends ShaderMaterial {
  constructor() {
    super({
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float opacity; // Custom opacity attribute
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vColor = color;
          vOpacity = opacity; // Pass opacity to fragment shader
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity; // Receive opacity from vertex shader
        void main() {
          gl_FragColor = vec4(vColor, vOpacity); // Use per-particle opacity
        }
      `,
      uniforms: {},
      depthTest: false,
      transparent: true,
    });
  }
}

extend({ StarfieldMaterial });

function getRandomBetween(min = -5, max = 5) {
  return Math.random() * (max - min) + min;
}

function Stars({ canReset = true }) {
  const count = 50;
  const distance = 10;
  const maxOpacity = 1.0;
  const viewDistance = 0;
  const startPoint = 0.5;
  const size = 3;
  const speed = 0.05;

  const mesh = useRef<THREE.Points>();
  const { positions, colors, sizes, opacity } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const color = new Vector3(1, 1, 1);
    const opacity = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2; // Random angle in radians
      const radius = Math.random() * startPoint;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = getRandomBetween(-distance * 2, 0);
      colors[i * 3] = color.x;
      colors[i * 3 + 1] = color.y;
      colors[i * 3 + 2] = color.z;
      sizes[i] = size;
      opacity[i] = 0;
    }

    return { positions, colors, sizes, opacity };
  }, [count]);

  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("opacity", new THREE.BufferAttribute(opacity, 1));
    return geometry;
  }, [positions, colors, sizes, opacity]);

  const material = useMemo(() => new StarfieldMaterial(), []);

  useFrame(() => {
    if (!mesh.current) return;

    const positions = mesh.current.geometry.attributes.position.array;
    const opacity = mesh.current.geometry.attributes.opacity.array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] += speed;

      if (positions[i + 2] > viewDistance && canReset && opacity[i / 3] < maxOpacity) {
        opacity[i / 3] += 0.02;
      }

      if (opacity[i / 3] > maxOpacity) {
        opacity[i / 3] = maxOpacity;
      }

      if (positions[i + 2] > distance) {
        positions[i + 2] = getRandomBetween(-distance * 2, 0);
        opacity[i / 3] = 0.0;
      }
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
    mesh.current.geometry.attributes.opacity.needsUpdate = true;
  });

  return <points ref={mesh as React.RefObject<THREE.Points>} args={[geometry, material]} />;
}

export default Stars
