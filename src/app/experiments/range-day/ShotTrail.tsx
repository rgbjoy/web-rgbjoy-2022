"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import { InterleavedBufferAttribute, Vector3 } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

import { pointOnShot, type Shot } from "./game";

/** Points along the trail; always this many, spread over the flight so far. */
const POINTS = 64;
const TRAIL_COLOR = "#fff3b0";
/** Screen pixels, so the trail stays readable far down the range. */
const TRAIL_WIDTH = 3;

export type ShotTrailHandle = {
  /** Trace `shot` from the tee to `progress` (0–1) of its flight. */
  draw: (shot: Shot, progress: number) => void;
  clear: () => void;
};

const tempPoint = new Vector3();

/**
 * A tracer line behind the ball. It stays up after landing so you can read
 * the shape of the shot, and clears when the next ball is teed up.
 */
export const ShotTrail = forwardRef<ShotTrailHandle>(function ShotTrail(_, ref) {
  const line = useMemo(() => {
    const geometry = new LineGeometry();
    geometry.setPositions(new Array(POINTS * 3).fill(0));
    const material = new LineMaterial({
      color: TRAIL_COLOR,
      linewidth: TRAIL_WIDTH,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const trail = new Line2(geometry, material);
    trail.visible = false;
    // The points move every frame, so skip the stale bounding sphere.
    trail.frustumCulled = false;
    return trail;
  }, []);

  useEffect(
    () => () => {
      line.geometry.dispose();
      line.material.dispose();
    },
    [line],
  );

  useImperativeHandle(
    ref,
    () => ({
      draw(shot, progress) {
        // The geometry stores each segment as a start and an end point, so
        // write straight into its buffer instead of reallocating each frame.
        const start = line.geometry.attributes.instanceStart as InterleavedBufferAttribute;
        const segments = start.data.array as Float32Array;
        for (let index = 0; index < POINTS; index += 1) {
          pointOnShot(shot, (index / (POINTS - 1)) * progress, tempPoint);
          if (index < POINTS - 1) tempPoint.toArray(segments, index * 6);
          if (index > 0) tempPoint.toArray(segments, index * 6 - 3);
        }
        start.data.needsUpdate = true;
        line.visible = true;
      },
      clear() {
        line.visible = false;
      },
    }),
    [line],
  );

  return <primitive object={line} />;
});
