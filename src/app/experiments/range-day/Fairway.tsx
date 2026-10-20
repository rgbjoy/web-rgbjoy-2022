"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, Color, RepeatWrapping, SRGBColorSpace } from "three";

import { FLAGS, GREEN_RADIUS } from "./game";

/** A multiple of STRIPE_PERIOD, so the mowing lanes tile evenly. */
const FIELD_SIZE = 608;
const STRIPE_PERIOD = 8;
const STRIPE_LIGHT = "#7cb956";
const STRIPE_DARK = "#69a648";

/** The range floor: striped, carpet-grained fairway with a green per flag. */
export function Fairway() {
  const turf = useMemo(() => createTurfTexture(), []);

  useEffect(() => () => turf.dispose(), [turf]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FIELD_SIZE, FIELD_SIZE]} />
        <meshStandardMaterial map={turf} roughness={1} />
      </mesh>
      {FLAGS.map((flag) => (
        <mesh
          key={flag.yards}
          position={[flag.x, 0, flag.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[GREEN_RADIUS, 48]} />
          <meshStandardMaterial
            color="#8fcf62"
            roughness={0.9}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Texels across one lane; more makes the grain finer. */
const LANE_TEXELS = 256;

/**
 * One mowing lane pair, repeated across the field: a light and a dark lane,
 * each speckled with fine grain so up close the fairway reads like carpet.
 */
function createTurfTexture() {
  const width = LANE_TEXELS * 2;
  const height = LANE_TEXELS;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) {
    const random = mulberry32(0xca9e7);
    const light = new Color(STRIPE_LIGHT);
    const dark = new Color(STRIPE_DARK);
    const speck = new Color();
    const rgb = { r: 0, g: 0, b: 0 };
    const image = context.createImageData(width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        speck.copy(x < LANE_TEXELS ? light : dark).multiplyScalar(0.9 + random() * 0.18);
        speck.getRGB(rgb, SRGBColorSpace);
        const i = (y * width + x) * 4;
        image.data[i] = rgb.r * 255;
        image.data[i + 1] = rgb.g * 255;
        image.data[i + 2] = rgb.b * 255;
        image.data[i + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  // Square texels: a lane pair is STRIPE_PERIOD wide and half that deep.
  texture.repeat.set(FIELD_SIZE / STRIPE_PERIOD, (FIELD_SIZE / STRIPE_PERIOD) * 2);
  return texture;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
