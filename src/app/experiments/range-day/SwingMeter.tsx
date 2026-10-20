"use client";

import { useCallback, useRef, useState } from "react";

import {
  FLAGS,
  MAX_BACKSWING,
  MAX_OVERSWING,
  SWEET_SPOT,
  backswingForYards,
  powerColor,
  powerFromBackswing,
  strikeFactor,
  swingPath,
  type Swing,
} from "./game";
import type { SwingApi } from "./RangeScene";
import styles from "./page.module.css";

type Point = { x: number; y: number };
/** A trace dot, marked by which half of the swing drew it. */
type Dot = Point & { forward: boolean };

type SwingStage = "ready" | "aiming" | "back" | "forward" | "done";

/** Meter drawing, in SVG units. The swing starts near the top of the ring. */
const SIZE = 200;
const CENTER = SIZE / 2;
const RING_RADIUS = 86;
const START_Y = 28;
const TRACE_SCALE = (SIZE - START_Y * 2) / MAX_BACKSWING;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
/**
 * A line across the meter for each flag's carry, so you can see how far to
 * pull for 50, 100, 150… yards. Each spans the ring, inset from its edge.
 */
const DISTANCE_LINES = FLAGS.map((flag) => {
  const y = START_Y + backswingForYards(flag.yards) * TRACE_SCALE;
  const halfWidth = Math.sqrt(RING_RADIUS ** 2 - (y - CENTER) ** 2) - 12;
  return { yards: flag.yards, y, halfWidth };
});

/** A new trace dot every few pixels of pointer travel. */
const DOT_SPACING = 6;
/** Radians of aim per pixel dragged off the ball. */
const AIM_PER_PIXEL = 0.005;
/** The swing turns forward once you climb this far back from the bottom. */
const TURN_THRESHOLD = 10;

/** One stretch of the power ring, as shares of a lap clockwise from the top. */
function RingArc({
  from,
  to,
  stroke,
  className,
}: {
  from: number;
  to: number;
  stroke?: string;
  className: string;
}) {
  if (to - from <= 0.005) return null;
  return (
    <circle
      cx={CENTER}
      cy={CENTER}
      r={RING_RADIUS}
      className={className}
      stroke={stroke}
      strokeDasharray={`${(to - from) * RING_LENGTH} ${RING_LENGTH}`}
      strokeDashoffset={-from * RING_LENGTH}
      transform={`rotate(-90 ${CENTER} ${CENTER})`}
    />
  );
}

/**
 * The power ring. On the backswing it fills to the power you pulled for. Once
 * you come forward it shows what you would strike with if you let go now:
 * short of the faint target is chunked, and past it (in violet) is thinned.
 */
function PowerRing({ power, strike }: { power: number; strike: number | null }) {
  const color = (value: number) => `#${powerColor(value).getHexString()}`;
  if (strike === null) {
    return <RingArc from={0} to={power} stroke={color(power)} className={styles.meterPower} />;
  }

  const live = power * strike;
  const solid = Math.min(live, power);
  return (
    <>
      <RingArc from={0} to={power} stroke={color(power)} className={styles.meterPowerTarget} />
      <RingArc from={0} to={solid} stroke={color(solid)} className={styles.meterPower} />
      <RingArc from={power} to={Math.min(live, 1)} className={styles.meterOverPower} />
      {/* A thinned full swing laps past the top of the ring. */}
      <RingArc from={0} to={live - 1} className={styles.meterOverPower} />
    </>
  );
}

/**
 * Drag anywhere off the ball to aim. On the ball, it is a swing stick in the
 * style of PGA 2K: press, pull down for the backswing, then push up and let
 * go where you started. How far you pull sets power, how straight you push
 * sets the path, and where you let go sets the strike. The stroke is traced
 * on a meter.
 */
export function SwingMeter({
  swingRef,
}: {
  swingRef: React.RefObject<SwingApi | null>;
}) {
  const [trace, setTrace] = useState<Dot[]>([]);
  const [power, setPower] = useState(0);
  /** The strike if you let go now; null until the forward swing starts. */
  const [strike, setStrike] = useState<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startRef = useRef<Point>({ x: 0, y: 0 });
  const bottomRef = useRef<Point>({ x: 0, y: 0 });
  const lastDotRef = useRef<Point>({ x: 0, y: 0 });
  const stageRef = useRef<SwingStage>("ready");
  const lastAimXRef = useRef(0);

  /** The swing as it stands when the forward stroke ends at `point`. */
  const swingFrom = useCallback((point: Point): Swing => {
    const bottom = bottomRef.current;
    return {
      power: powerFromBackswing(bottom.y),
      path: swingPath(bottom, point),
      strike: strikeFactor(bottom.y, point.y),
    };
  }, []);

  const end = useCallback(
    (target: HTMLElement, pointerId: number) => {
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
      target.style.cursor = "";
      swingRef.current?.hover(false);
      pointerIdRef.current = null;
    },
    [swingRef],
  );

  const handlePointerLeave = useCallback(() => {
    if (pointerIdRef.current === null) swingRef.current?.hover(false);
  }, [swingRef]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const swing = swingRef.current;
      if (pointerIdRef.current !== null || !swing) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      pointerIdRef.current = event.pointerId;
      event.currentTarget.style.cursor = "grabbing";

      // Off the ball, a drag turns the aim and the view instead.
      if (!swing.canSwingAt(event.clientX, event.clientY)) {
        stageRef.current = "aiming";
        lastAimXRef.current = event.clientX;
        return;
      }

      startRef.current = { x: event.clientX, y: event.clientY };
      bottomRef.current = { x: 0, y: 0 };
      lastDotRef.current = { x: 0, y: 0 };
      stageRef.current = "back";
      swing.begin();
      setTrace([{ x: 0, y: 0, forward: false }]);
      setPower(0);
      setStrike(null);
    },
    [swingRef],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Not swinging: just show a grab cursor while over the ball.
      if (pointerIdRef.current === null) {
        const over = Boolean(
          swingRef.current?.canSwingAt(event.clientX, event.clientY),
        );
        event.currentTarget.style.cursor = over ? "grab" : "";
        swingRef.current?.hover(over);
        return;
      }
      if (pointerIdRef.current !== event.pointerId) return;

      if (stageRef.current === "aiming") {
        swingRef.current?.aim((event.clientX - lastAimXRef.current) * AIM_PER_PIXEL);
        lastAimXRef.current = event.clientX;
        return;
      }

      const point = {
        x: event.clientX - startRef.current.x,
        y: event.clientY - startRef.current.y,
      };
      const bottom = bottomRef.current;

      if (stageRef.current === "back") {
        if (point.y > bottom.y) {
          bottomRef.current = point;
        } else if (bottom.y - point.y > TURN_THRESHOLD && powerFromBackswing(bottom.y) > 0) {
          stageRef.current = "forward";
        }
      }

      const last = lastDotRef.current;
      if (Math.hypot(point.x - last.x, point.y - last.y) >= DOT_SPACING) {
        const forward = stageRef.current === "forward";
        lastDotRef.current = point;
        setTrace((dots) => [...dots, { ...point, forward }]);
      }

      setPower(powerFromBackswing(bottomRef.current.y));
      if (stageRef.current === "forward") {
        setStrike(strikeFactor(bottomRef.current.y, point.y));
      }

      // Shoving far past the start fires the swing as the thinnest strike.
      if (stageRef.current === "forward" && point.y <= -MAX_OVERSWING) {
        const swing = swingFrom(point);
        stageRef.current = "done";
        end(event.currentTarget, event.pointerId);
        swingRef.current?.hit(swing);
      }
    },
    [end, swingFrom, swingRef],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      end(event.currentTarget, event.pointerId);
      if (stageRef.current === "aiming") {
        stageRef.current = "done";
        return;
      }

      // Letting go during the forward swing hits, and where you let go sets
      // the strike; letting go during the backswing backs out.
      const point = {
        x: event.clientX - startRef.current.x,
        y: event.clientY - startRef.current.y,
      };
      if (stageRef.current === "forward") {
        const swing = swingFrom(point);
        setStrike(swing.strike);
        swingRef.current?.hit(swing);
      } else {
        swingRef.current?.cancel();
        setTrace([]);
        setPower(0);
        setStrike(null);
      }
      stageRef.current = "done";
    },
    [end, swingFrom, swingRef],
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      end(event.currentTarget, event.pointerId);
      const wasAiming = stageRef.current === "aiming";
      stageRef.current = "done";
      if (wasAiming) return;
      swingRef.current?.cancel();
      setTrace([]);
      setPower(0);
      setStrike(null);
    },
    [end, swingRef],
  );

  const toMeter = (point: Point) => ({
    x: CENTER + point.x * TRACE_SCALE,
    y: START_Y + point.y * TRACE_SCALE,
  });

  return (
    <>
      <div
        className={styles.swingPad}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
      />
      <svg
        className={styles.swingMeter}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
      >
        <circle cx={CENTER} cy={CENTER} r={RING_RADIUS + 10} className={styles.meterFace} />
        <circle cx={CENTER} cy={CENTER} r={RING_RADIUS} className={styles.meterTrack} />
        <PowerRing power={power} strike={strike} />
        {DISTANCE_LINES.map((line) => (
          <g key={line.yards}>
            <line
              x1={CENTER - line.halfWidth}
              y1={line.y}
              x2={CENTER + line.halfWidth}
              y2={line.y}
              className={styles.meterDistance}
            />
            <text
              x={CENTER + line.halfWidth}
              y={line.y - 3}
              className={styles.meterLabel}
            >
              {line.yards}
            </text>
          </g>
        ))}
        <line
          x1={CENTER}
          y1={START_Y}
          x2={CENTER}
          y2={SIZE - START_Y}
          className={styles.meterGuide}
        />
        <circle
          cx={CENTER}
          cy={START_Y}
          r={SWEET_SPOT * TRACE_SCALE}
          className={styles.meterSweetSpot}
        />
        {trace.map((dot, index) => {
          const { x, y } = toMeter(dot);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={dot.forward ? 3 : 4}
              className={dot.forward ? styles.meterDotForward : styles.meterDotBack}
            />
          );
        })}
        <circle cx={CENTER} cy={START_Y} r={5} className={styles.meterStart} />
      </svg>
    </>
  );
}
