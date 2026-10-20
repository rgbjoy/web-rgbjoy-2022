"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  FLAGS,
  MAX_BACKSWING,
  MAX_OVERSWING,
  QUICK_FORWARD_MS,
  SWEET_SPOT,
  backswingForYards,
  powerColor,
  powerFromBackswing,
  shankFactor,
  strikeEffect,
  strikeFactor,
  swingPath,
  tempoFactor,
  type Club,
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
/** The power ring runs along the rim of the face, its stroke flush with the edge. */
const RING_RADIUS = 94;
const RING_STROKE = 5;
const START_Y = 28;
const TRACE_SCALE = (SIZE - START_Y * 2) / MAX_BACKSWING;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
/** Distance lines all share this half-width, which still fits the ring at full power. */
const DISTANCE_HALF_WIDTH = 44;

/**
 * A line across the meter for each flag this club can reach, so you can see
 * how far to pull for 50, 100, 150… yards.
 */
function distanceLines(club: Club) {
  const inRange = FLAGS.filter(
    (flag) => flag.yards >= club.minCarry && flag.yards <= club.maxCarry,
  );
  return inRange.map((flag) => {
    const y = START_Y + backswingForYards(flag.yards, club) * TRACE_SCALE;
    return { yards: flag.yards, y };
  });
}

/** Seconds spent going back and coming through; through is null until the turn. */
type SwingTimes = { back: number; through: number | null };

/** Through-swing colour: green while quick enough, then orange, then red. */
function throughColor(seconds: number) {
  const ms = seconds * 1000;
  if (ms <= QUICK_FORWARD_MS) return "#69e36f";
  return ms <= QUICK_FORWARD_MS * 2 ? "#ffb13b" : "#ff554d";
}

/** A new trace dot every few pixels of pointer travel. */
const DOT_SPACING = 8;
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
  club,
  dimmed,
}: {
  swingRef: React.RefObject<SwingApi | null>;
  club: Club;
  /** Faded while the ball is in play, until the next one is teed up. */
  dimmed: boolean;
}) {
  const lines = useMemo(() => distanceLines(club), [club]);
  const [trace, setTrace] = useState<Dot[]>([]);
  const [power, setPower] = useState(0);
  /** The strike if you let go now; null until the forward swing starts. */
  const [strike, setStrike] = useState<number | null>(null);
  /** True while letting go now would shank it. */
  const [shanking, setShanking] = useState(false);
  /** Share of carry the forward swing's speed keeps so far. */
  const [tempo, setTempo] = useState(1);
  /** When the backswing and forward swing began, in event time. */
  const backStartRef = useRef(0);
  const forwardStartRef = useRef(0);
  const [times, setTimes] = useState<SwingTimes | null>(null);
  const [swinging, setSwinging] = useState(false);
  const pointerIdRef = useRef<number | null>(null);
  const startRef = useRef<Point>({ x: 0, y: 0 });
  const bottomRef = useRef<Point>({ x: 0, y: 0 });
  const lastDotRef = useRef<Point>({ x: 0, y: 0 });
  const stageRef = useRef<SwingStage>("ready");
  const lastAimXRef = useRef(0);

  /** The back and through times as they stand at `now`. */
  const timesAt = useCallback((now: number): SwingTimes => {
    const forwardStart = forwardStartRef.current;
    if (stageRef.current === "back") {
      return { back: (now - backStartRef.current) / 1000, through: null };
    }
    return {
      back: (forwardStart - backStartRef.current) / 1000,
      through: (now - forwardStart) / 1000,
    };
  }, []);

  // Tick the timer every frame while a swing is under way.
  useEffect(() => {
    if (!swinging) return;
    let frame = 0;
    const tick = () => {
      setTimes(timesAt(performance.now()));
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [swinging, timesAt]);

  /** The swing as it stands when the forward stroke ends at `point`. */
  const swingFrom = useCallback((point: Point, time: number): Swing => {
    const bottom = bottomRef.current;
    return {
      power: powerFromBackswing(bottom.y),
      path: swingPath(bottom, point),
      strike: strikeFactor(bottom.y, point.y),
      shank: shankFactor(point.x, club),
      tempo: tempoFactor(time - forwardStartRef.current),
    };
  }, [club]);

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
      backStartRef.current = event.timeStamp;
      setSwinging(true);
      swing.begin();
      setTrace([{ x: 0, y: 0, forward: false }]);
      setPower(0);
      setStrike(null);
      setShanking(false);
      setTempo(1);
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
          forwardStartRef.current = event.timeStamp;
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
        setTempo(tempoFactor(event.timeStamp - forwardStartRef.current));
        setShanking(shankFactor(point.x, club) !== 0);
      }

      // Shoving far past the start fires the swing as the thinnest strike.
      if (stageRef.current === "forward" && point.y <= -MAX_OVERSWING) {
        const swing = swingFrom(point, event.timeStamp);
        setTimes(timesAt(event.timeStamp));
        setSwinging(false);
        stageRef.current = "done";
        end(event.currentTarget, event.pointerId);
        swingRef.current?.hit(swing);
      }
    },
    [club, end, swingFrom, swingRef, timesAt],
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
        const swing = swingFrom(point, event.timeStamp);
        setTimes(timesAt(event.timeStamp));
        setSwinging(false);
        setStrike(swing.strike);
        setTempo(swing.tempo);
        swingRef.current?.hit(swing);
      } else {
        swingRef.current?.cancel();
        setSwinging(false);
        setTimes(null);
        setTrace([]);
        setPower(0);
        setStrike(null);
        setShanking(false);
      }
      stageRef.current = "done";
    },
    [end, swingFrom, swingRef, timesAt],
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      end(event.currentTarget, event.pointerId);
      const wasAiming = stageRef.current === "aiming";
      stageRef.current = "done";
      if (wasAiming) return;
      swingRef.current?.cancel();
      setSwinging(false);
      setTimes(null);
      setTrace([]);
      setPower(0);
      setStrike(null);
      setShanking(false);
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
        data-dimmed={dimmed}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
      >
        <circle cx={CENTER} cy={CENTER} r={RING_RADIUS + RING_STROKE / 2} className={styles.meterFace} />
        <circle cx={CENTER} cy={CENTER} r={RING_RADIUS} className={styles.meterTrack} />
        {/* The ring shows carry, so a thinned driver or slow swing reads short. */}
        <PowerRing
          power={power}
          strike={strike === null ? null : strikeEffect(strike, club).carry * tempo}
        />
        {lines.map((line) => (
          <g key={line.yards}>
            <line
              x1={CENTER - DISTANCE_HALF_WIDTH}
              y1={line.y}
              x2={CENTER + DISTANCE_HALF_WIDTH}
              y2={line.y}
              className={styles.meterDistance}
            />
            <text
              x={CENTER + DISTANCE_HALF_WIDTH}
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
        {/* Let go outside these lanes and you shank it. */}
        {[-1, 1].map((side) => (
          <line
            key={side}
            x1={CENTER + side * club.lane * TRACE_SCALE}
            y1={START_Y}
            x2={CENTER + side * club.lane * TRACE_SCALE}
            y2={SIZE - START_Y}
            className={shanking ? styles.meterLaneShank : styles.meterLane}
          />
        ))}
        {trace.map((dot, index) => {
          const { x, y } = toMeter(dot);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={dot.forward ? 2.5 : 3}
              className={dot.forward ? styles.meterDotForward : styles.meterDotBack}
            />
          );
        })}
        {/* Drawn over the trace so it stays visible; green while a release would be pure. */}
        <circle
          cx={CENTER}
          cy={START_Y}
          r={SWEET_SPOT * TRACE_SCALE}
          className={strike === 1 ? styles.meterSweetSpotPure : styles.meterSweetSpot}
        />
        <circle cx={CENTER} cy={START_Y} r={4} className={styles.meterStart} />
        {times ? (
          <g>
            <rect
              x={CENTER - 64}
              y={SIZE + 4}
              width={128}
              height={18}
              className={styles.meterTimerBox}
            />
            <text x={CENTER - 58} y={SIZE + 16} className={styles.meterTimer}>
              BACK {times.back.toFixed(2)}
            </text>
            {times.through !== null ? (
              <text
                x={CENTER + 58}
                y={SIZE + 16}
                className={styles.meterTimer}
                style={{ fill: throughColor(times.through) }}
                textAnchor="end"
              >
                THRU {times.through.toFixed(2)}
              </text>
            ) : null}
          </g>
        ) : null}
      </svg>
    </>
  );
}
