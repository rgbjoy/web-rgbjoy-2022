"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Group, MathUtils, Vector3 } from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";

// Digits 0–9 of Geist Mono Bold in three's typeface JSON (SIL OFL 1.1).
import yardageFontData from "./yardage-font.json";

const YARDAGE_FONT = new Font(yardageFontData);
/** Height of the number's bottom edge, just above the top of the pin. */
const SIGN_BOTTOM_Y = 3.1;
const DEPTH_RATIO = 0.18;
/** A dark copy behind and below each number keeps light colors readable against the sky. */
const SHADOW_COLOR = "#20382a";
const SHADOW_OFFSET = 0.06;
/** Camera distances where a sign starts to shrink into its pin, and where it is gone. */
const SHRINK_START = 20;
const SHRINK_END = 6;
const signPosition = new Vector3();

/** Far numbers are drawn bigger so every flag reads from the tee. */
function signSize(yards: number) {
  return 0.8 + yards / 150;
}

function yardageGeometry(yards: number) {
  const size = signSize(yards);
  const geometry = new TextGeometry(String(yards), {
    font: YARDAGE_FONT,
    size,
    depth: size * DEPTH_RATIO,
    curveSegments: 4,
  });
  geometry.center();
  return geometry;
}

/** An extruded yardage number over a flag that turns to face the camera. */
export function YardageSign({ yards, color }: { yards: number; color: string }) {
  const groupRef = useRef<Group>(null);
  const geometry = useMemo(() => yardageGeometry(yards), [yards]);
  const size = signSize(yards);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera }) => {
    const group = groupRef.current;
    if (!group) return;
    group.getWorldPosition(signPosition);
    const dx = camera.position.x - signPosition.x;
    const dz = camera.position.z - signPosition.z;
    group.rotation.y = Math.atan2(dx, dz);
    // Shrink as the chase camera flies past so a sign never fills the screen.
    const scale = MathUtils.smoothstep(Math.hypot(dx, dz), SHRINK_END, SHRINK_START);
    group.scale.setScalar(scale);
    group.visible = scale > 0;
  });

  return (
    <group ref={groupRef} position={[0, SIGN_BOTTOM_Y + size * 0.4, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={color} roughness={0.6} fog={false} />
      </mesh>
      <mesh
        geometry={geometry}
        position={[size * SHADOW_OFFSET, -size * SHADOW_OFFSET, -size * DEPTH_RATIO]}
      >
        <meshBasicMaterial color={SHADOW_COLOR} fog={false} />
      </mesh>
    </group>
  );
}
