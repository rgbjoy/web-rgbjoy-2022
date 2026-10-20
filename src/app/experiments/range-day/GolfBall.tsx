"use client";

/*
 * Golf Ball by ree27703
 * https://sketchfab.com/3d-models/golf-ball-0f6ecd40b2ba42deb2f2946f3fcd4dde
 * Licensed under the Sketchfab Standard License. The same model as golf is weird.
 */

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { Box3, Mesh, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "/models/golf-ball/scene.gltf";

/** The ball, centred on its origin and scaled to `radius`. */
export function GolfBallModel({ radius }: { radius: number }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);

  const model = useMemo(() => {
    const scene = gltf.scene.clone();
    scene.traverse((object) => {
      if ((object as Mesh).isMesh) object.castShadow = true;
    });

    const bounds = new Box3().setFromObject(scene);
    const size = bounds.getSize(new Vector3());
    const scale = (radius * 2) / Math.max(size.x, size.y, size.z);
    scene.scale.setScalar(scale);
    scene.position.copy(bounds.getCenter(new Vector3())).multiplyScalar(-scale);
    return scene;
  }, [gltf, radius]);

  return <primitive object={model} />;
}
