"use client";

import { useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";

import {
  BALL_RADIUS,
  BALL_TEE_Y,
  FLAGS,
  GREEN_RADIUS,
  MAT_TOP_Y,
  SHANK_ANGLE,
  SHANK_POWER_LOSS,
  TEE_HEIGHT,
  carryDistance,
  hintForShot,
  makeTerrain,
  pointOnRoll,
  pointOnShot,
  resultForRest,
  rollForShot,
  solveLaunchDistance,
  sliceFactor,
  strikeEffect,
  velocityOnShot,
  windForShot,
  windOffset,
  type Club,
  type Contact,
  type Flag,
  type GamePhase,
  type HudState,
  type Roll,
  type Shot,
  type ShotResult,
  type Swing,
  type Terrain,
} from "./game";
import { GolfBallModel } from "./GolfBall";
import { ShotTrail, type ShotTrailHandle } from "./ShotTrail";
import { Fairway } from "./Fairway";
import { TreeLine } from "./Trees";
import { YardageSign } from "./YardageSign";

export const SKY_COLOR = "#cfe5e2";
const FOG_NEAR = 30;
const FOG_FAR = 170;

/** Camera framing at address, behind the ball and looking down the range. */
const ADDRESS_DISTANCE = 2.6;
const ADDRESS_HEIGHT = 1.05;
const ADDRESS_LOOK_AHEAD = 3;
/** Camera framing while chasing the ball. */
const CHASE_DISTANCE = 7;
const CHASE_HEIGHT = 2.2;
const CAMERA_DAMPING = 3;
const TURN_DAMPING = 4.2;
/** Seconds the ball rests where it stopped before the next one is teed up. */
const REST_TIME = 1.8;
/** How much the swing path pushes the start line, and how much it curves. */
const PATH_START_LINE = 0.4;
const PATH_CURVE = 0.3;
/** Extra bend, per unit of carry, for the worst slice or hook. */
const SLICE_CURVE = 0.12;
/** Share of carry the worst slice or hook loses. */
const SLICE_CARRY_LOSS = 0.2;
/** World-space reach around the ball that counts as pressing on it. */
const BALL_HIT_RADIUS = 0.35;
/** ...but never smaller than this on screen, so it stays easy to tap. */
const MIN_HIT_PIXELS = 28;
const WORLD_UP = new Vector3(0, 1, 0);
const DOWNRANGE = new Vector3(0, 0, -1);
const TEE_POSITION = new Vector3(0, BALL_TEE_Y, 0);
/** Ground rings sit just above the turf. */
const GROUND_RING_Y = 0.02;

type RangeSceneProps = {
  /** Seeds the wind. Supplied by the page so render stays pure. */
  seed: number;
  /** Chase the ball down the range, or stay at the tee and watch it. */
  followBall: boolean;
  /** The club in hand; read when the ball is struck. */
  club: Club;
  onHudChange: (next: HudState) => void;
  windArrowRef: React.RefObject<HTMLElement | null>;
  /** Filled by the scene so the page's swing meter can drive it. */
  swingRef: React.Ref<SwingApi>;
};

/** What the swing meter can ask of the scene. */
export type SwingApi = {
  /** True when a swing may start at this screen point: on the ball, at rest. */
  canSwingAt: (clientX: number, clientY: number) => boolean;
  /** A swing has started; aim is locked until it hits or is cancelled. */
  begin: () => void;
  /** The pointer is over the ball (or left it), for the hover ring. */
  hover: (over: boolean) => void;
  cancel: () => void;
  hit: (swing: Swing) => void;
  /** Turn the aim, in radians; positive turns right. Only while at rest. */
  aim: (radians: number) => void;
};

const tempDirection = new Vector3();
const tempCameraPosition = new Vector3();
const tempLookAt = new Vector3();
const tempWindOffset = new Vector3();
const tempVelocity = new Vector3();
const tempPrevious = new Vector3();
const tempScreen = new Vector3();
const tempEdge = new Vector3();
const tempTracked = new Vector3();

export function RangeScene({
  seed,
  followBall,
  club,
  onHudChange,
  windArrowRef,
  swingRef,
}: RangeSceneProps) {
  // New ground each play: the seed changes with every bucket.
  const terrain = useMemo<Terrain>(() => makeTerrain(seed), [seed]);
  const { camera, gl } = useThree();
  const ballRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);
  const burstRef = useRef<LandingBurstHandle>(null);
  const trailRef = useRef<ShotTrailHandle>(null);
  const phaseRef = useRef<GamePhase>("idle");
  const hoveredRef = useRef(false);
  const phaseStartedAtRef = useRef(0);
  const shotRef = useRef<Shot | null>(null);
  const rollRef = useRef<Roll | null>(null);
  const shotIndexRef = useRef(0);
  const lastYardsRef = useRef(0);
  const longestYardsRef = useRef(0);
  const resultRef = useRef<ShotResult | undefined>(undefined);
  const contactRef = useRef<Contact>({ strike: 1, shank: 0, slice: 0, tempo: 1 });
  // Aim, in radians off straight down the range; positive turns right.
  const aimYawRef = useRef(0);
  const aimDirectionRef = useRef(DOWNRANGE.clone());
  const viewDirectionRef = useRef(DOWNRANGE.clone());
  const smoothedDirectionRef = useRef(DOWNRANGE.clone());
  const smoothedYawRef = useRef(Math.atan2(DOWNRANGE.x, DOWNRANGE.z));
  // 0 frames the address view, 1 the chase view; eased between the two.
  const chaseRef = useRef(0);
  // Without follow, 0 looks down the range and 1 looks at the ball.
  const watchRef = useRef(0);
  // Set when a new ball is teed up, so the camera jumps straight behind it.
  const snapCameraRef = useRef(true);
  const followBallRef = useRef(followBall);
  useEffect(() => {
    followBallRef.current = followBall;
  }, [followBall]);
  const clubRef = useRef(club);
  useEffect(() => {
    clubRef.current = club;
  }, [club]);
  const windAngleRef = useRef(0);
  const windSpeedRef = useRef(0);
  const windStrengthRef = useRef(0);
  const windDirectionRef = useRef(DOWNRANGE.clone());

  const publishHud = useCallback(
    (phase = phaseRef.current) => {
      onHudChange({
        phase,
        lastYards: lastYardsRef.current,
        longestYards: longestYardsRef.current,
        windAngle: windAngleRef.current,
        windSpeed: windSpeedRef.current,
        result: phase === "resting" ? resultRef.current : undefined,
        hint: hintForShot(shotIndexRef.current),
      });
    },
    [onHudChange],
  );

  const setPhase = useCallback(
    (phase: GamePhase, elapsed = 0) => {
      phaseRef.current = phase;
      phaseStartedAtRef.current = elapsed;
      publishHud(phase);
    },
    [publishHud],
  );

  const applyWind = useCallback(
    (shotIndex: number) => {
      const wind = windForShot(seed, shotIndex);
      windAngleRef.current = wind.angle;
      windSpeedRef.current = wind.speed;
      windStrengthRef.current = wind.strength;
      windDirectionRef.current
        .copy(DOWNRANGE)
        // CSS rotates the HUD arrow clockwise; Three.js +Y is opposite from
        // this chase-camera view, so invert the world-space angle.
        .applyAxisAngle(WORLD_UP, MathUtils.degToRad(-wind.angle))
        .normalize();
    },
    [seed],
  );

  useEffect(() => {
    applyWind(0);
    publishHud("idle");
  }, [applyWind, publishHud]);

  const makeShot = useCallback((swing: Swing): Shot | null => {
    const ball = ballRef.current;
    if (!ball || swing.power * swing.strike <= 0) return null;

    // An open or closed swing path starts the ball off the aim line, then
    // curves it further the same way: a fade to the right, a draw to the left.
    // A shank kicks it further off toward the side you went off the lanes.
    tempDirection
      .copy(aimDirectionRef.current)
      .applyAxisAngle(
        WORLD_UP,
        -swing.path * PATH_START_LINE - swing.shank * SHANK_ANGLE,
      );
    const start = ball.position.clone();
    // A chunked or thinned strike scales the carry you pulled back for, and a
    // shank, slice, hook or slow swing cuts it.
    const club = clubRef.current;
    const effect = strikeEffect(swing.strike, club);
    const slice = sliceFactor(swing.path, club);
    const strike =
      effect.carry *
      swing.tempo *
      (1 - Math.abs(swing.shank) * SHANK_POWER_LOSS) *
      (1 - Math.abs(slice) * SLICE_CARRY_LOSS);
    const carry = carryDistance(swing.power, club) * strike;
    const power = Math.min(1, swing.power * strike);
    const curve = new Vector3(-tempDirection.z, 0, tempDirection.x)
      .multiplyScalar((swing.path * PATH_CURVE + slice * SLICE_CURVE) * carry);
    windOffset(
      windDirectionRef.current,
      windStrengthRef.current,
      power,
      carry,
      tempWindOffset,
    ).add(curve);
    const launchDistance = solveLaunchDistance(
      tempDirection,
      tempWindOffset,
      carry,
    );
    const launchEnd = start.clone().addScaledVector(tempDirection, launchDistance);
    const end = launchEnd.clone().add(tempWindOffset);
    // Come down onto the ground wherever it lands.
    const landingY = terrain(end.x, end.z) + BALL_RADIUS;
    launchEnd.setY(landingY);
    end.setY(landingY);

    // Higher shots hang longer, as a real ball would under gravity.
    const arcHeight = carry * club.launch * effect.launch;
    return {
      club,
      direction: tempDirection.clone(),
      power,
      start,
      launchEnd,
      wind: tempWindOffset.clone(),
      end,
      duration: Math.max(0.5, 0.9 * Math.sqrt(arcHeight)),
      arcHeight,
      elapsed: 0,
    };
  }, [terrain]);

  useImperativeHandle(
    swingRef,
    () => ({
      canSwingAt(clientX, clientY) {
        const ball = ballRef.current;
        if (!ball || phaseRef.current !== "idle") return false;

        // Project the ball, and a point the hit radius above it along the
        // camera's up axis, to find its centre and reach on screen.
        const rect = gl.domElement.getBoundingClientRect();
        const toScreen = (point: Vector3) => ({
          x: rect.left + ((point.x + 1) / 2) * rect.width,
          y: rect.top + ((1 - point.y) / 2) * rect.height,
        });
        const centre = toScreen(tempScreen.copy(ball.position).project(camera));
        const edge = toScreen(
          tempEdge
            .setFromMatrixColumn(camera.matrixWorld, 1)
            .multiplyScalar(BALL_HIT_RADIUS)
            .add(ball.position)
            .project(camera),
        );
        const reach = Math.max(
          MIN_HIT_PIXELS,
          Math.hypot(edge.x - centre.x, edge.y - centre.y),
        );
        return Math.hypot(clientX - centre.x, clientY - centre.y) <= reach;
      },
      hover(over) {
        hoveredRef.current = over;
      },
      begin() {
        if (phaseRef.current === "idle") setPhase("swinging");
      },
      cancel() {
        if (phaseRef.current === "swinging") setPhase("idle");
      },
      hit(swing) {
        const shot = makeShot(swing);
        if (!shot) {
          setPhase("idle");
          return;
        }

        viewDirectionRef.current.copy(shot.direction);
        shotRef.current = shot;
        contactRef.current = {
          strike: swing.strike,
          shank: swing.shank,
          slice: sliceFactor(swing.path, shot.club),
          tempo: swing.tempo,
        };
        setPhase("flying");
      },
      aim(radians) {
        if (phaseRef.current !== "idle") return;
        aimYawRef.current += radians;
        aimDirectionRef.current
          .copy(DOWNRANGE)
          .applyAxisAngle(WORLD_UP, -aimYawRef.current);
        viewDirectionRef.current.copy(aimDirectionRef.current);
      },
    }),
    [camera, gl, makeShot, setPhase],
  );

  const teeUpNextBall = useCallback(
    (ball: Group, elapsed: number) => {
      ball.position.copy(TEE_POSITION);
      trailRef.current?.clear();
      const aim = aimDirectionRef.current;
      smoothedYawRef.current = Math.atan2(aim.x, aim.z);
      chaseRef.current = 0;
      watchRef.current = 0;
      snapCameraRef.current = true;
      shotIndexRef.current += 1;
      applyWind(shotIndexRef.current);
      viewDirectionRef.current.copy(aim);
      setPhase("idle", elapsed);
    },
    [applyWind, setPhase],
  );

  useFrame((state, delta) => {
    const ball = ballRef.current;
    const spin = spinRef.current;
    if (!ball || !spin) return;

    const elapsed = state.elapsed;
    const phase = phaseRef.current;

    if (phase === "flying" && shotRef.current) {
      const shot = shotRef.current;
      shot.elapsed += delta;
      const progress = Math.min(1, shot.elapsed / shot.duration);
      pointOnShot(shot, progress, ball.position);
      trailRef.current?.draw(shot, progress);
      spin.rotation.x -= delta * 24;

      // Face where the ball is actually going; with a crosswind that bends
      // away from where it was aimed, and the camera drifts into the curve.
      velocityOnShot(shot, progress, tempVelocity);
      if (tempVelocity.lengthSq() > 1e-6) {
        viewDirectionRef.current.copy(tempVelocity).normalize();
      }

      if (progress >= 1) {
        rollRef.current = rollForShot(shot);
        shotRef.current = null;
        burstRef.current?.fire(shot.end);
        setPhase("rolling", elapsed);
      }
    } else if (phase === "rolling" && rollRef.current) {
      const roll = rollRef.current;
      roll.elapsed += delta;
      const progress = Math.min(1, roll.elapsed / roll.duration);
      tempPrevious.copy(ball.position);
      pointOnRoll(roll, progress, terrain, ball.position);
      tempPrevious.y = ball.position.y;
      spin.rotation.x -= tempPrevious.distanceTo(ball.position) / BALL_RADIUS;

      if (progress >= 1) {
        rollRef.current = null;
        resultRef.current = resultForRest(ball.position, contactRef.current);
        lastYardsRef.current = resultRef.current.yards;
        longestYardsRef.current = Math.max(
          longestYardsRef.current,
          lastYardsRef.current,
        );
        setPhase("resting", elapsed);
      }
    } else if (
      phase === "resting" &&
      elapsed - phaseStartedAtRef.current > REST_TIME
    ) {
      teeUpNextBall(ball, elapsed);
    }

    const targetYaw = Math.atan2(
      viewDirectionRef.current.x,
      viewDirectionRef.current.z,
    );
    smoothedYawRef.current = dampAngle(
      smoothedYawRef.current,
      targetYaw,
      TURN_DAMPING,
      delta,
    );
    const heading = smoothedDirectionRef.current.set(
      Math.sin(smoothedYawRef.current),
      0,
      Math.cos(smoothedYawRef.current),
    );
    ball.rotation.y = Math.atan2(-heading.x, -heading.z);

    if (windArrowRef.current) {
      const playerYaw = Math.atan2(heading.x, heading.z);
      const windYaw = Math.atan2(
        windDirectionRef.current.x,
        windDirectionRef.current.z,
      );
      const relativeWindAngle = MathUtils.radToDeg(
        MathUtils.euclideanModulo(playerYaw - windYaw + Math.PI, Math.PI * 2) -
          Math.PI,
      );
      windArrowRef.current.style.transform = `rotate(${relativeWindAngle}deg)`;
    }

    const follow = followBallRef.current;
    const inPlay = phase === "flying" || phase === "rolling" || phase === "resting";
    chaseRef.current = MathUtils.damp(chaseRef.current, follow && inPlay ? 1 : 0, 2.5, delta);
    watchRef.current = MathUtils.damp(watchRef.current, !follow && inPlay ? 1 : 0, 3, delta);
    const chase = chaseRef.current;
    // Track a hopping ball along the ground so the camera doesn't bounce too.
    const tracked = tempTracked.copy(ball.position);
    if (phase === "rolling") tracked.y = terrain(tracked.x, tracked.z) + BALL_RADIUS;
    // Without follow, the camera stays behind the tee and turns to watch.
    const anchor = follow ? tracked : TEE_POSITION;

    tempCameraPosition
      .copy(anchor)
      .addScaledVector(
        heading,
        -MathUtils.lerp(ADDRESS_DISTANCE, CHASE_DISTANCE, chase),
      );
    tempCameraPosition.y =
      MathUtils.lerp(ADDRESS_HEIGHT, CHASE_HEIGHT, chase) + anchor.y * 0.5;
    if (snapCameraRef.current) {
      camera.position.copy(tempCameraPosition);
      snapCameraRef.current = false;
    } else {
      camera.position.lerp(
        tempCameraPosition,
        1 - Math.exp(-delta * CAMERA_DAMPING),
      );
    }
    tempLookAt
      .copy(anchor)
      .addScaledVector(heading, MathUtils.lerp(ADDRESS_LOOK_AHEAD, 0, chase))
      .lerp(tracked, watchRef.current);
    // Look a little below a high ball so the field stays in frame.
    tempLookAt.y *= 0.7;
    camera.lookAt(tempLookAt);
  });

  return (
    <>
      <color attach="background" args={[SKY_COLOR]} />
      <fog attach="fog" args={[SKY_COLOR, FOG_NEAR, FOG_FAR]} />
      <ambientLight intensity={1.35} />
      <SunLight ballRef={ballRef} />

      <Fairway terrain={terrain} />
      <TeeMat />
      <TreeLine terrain={terrain} />
      {FLAGS.map((flag) => (
        <FlagPin key={flag.yards} flag={flag} windDirectionRef={windDirectionRef} />
      ))}
      <LandingBurst ref={burstRef} />
      <ShotTrail ref={trailRef} />
      <Ball
        ballRef={ballRef}
        spinRef={spinRef}
        phaseRef={phaseRef}
        hoveredRef={hoveredRef}
      />
    </>
  );
}

function dampAngle(
  current: number,
  target: number,
  damping: number,
  delta: number,
) {
  const shortestDelta =
    MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) -
    Math.PI;
  return current + shortestDelta * (1 - Math.exp(-damping * delta));
}

/**
 * Sun rides along with the ball. The shadow camera is a tight box around its
 * target, so leaving it at the tee would drop the ball's shadow downrange.
 */
function SunLight({ ballRef }: { ballRef: React.RefObject<Group | null> }) {
  const lightRef = useRef<DirectionalLight>(null);

  useFrame(() => {
    const ball = ballRef.current;
    const light = lightRef.current;
    if (!ball || !light) return;

    light.position.set(ball.position.x + 6, 12, ball.position.z + 8);
    light.target.position.set(ball.position.x, 0, ball.position.z);
    light.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={lightRef}
      castShadow
      position={[6, 12, 8]}
      intensity={2.1}
      shadow-bias={-0.00015}
      shadow-normalBias={0.025}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={0.5}
      shadow-camera-far={34}
      shadow-camera-left={-9}
      shadow-camera-right={9}
      shadow-camera-top={9}
      shadow-camera-bottom={-11}
    />
  );
}

/** Astroturf mat and a little white tee. */
function TeeMat() {
  return (
    <group>
      <mesh position={[0, MAT_TOP_Y / 2, 0.2]} receiveShadow>
        <boxGeometry args={[2.2, MAT_TOP_Y, 1.5]} />
        <meshStandardMaterial color="#2f6b3c" roughness={1} />
      </mesh>
      <mesh position={[0, MAT_TOP_Y + TEE_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.008, TEE_HEIGHT, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** A pin with its flag blowing downwind, so the flags read the wind too. */
const FlagPin = memo(function FlagPin({
  flag,
  windDirectionRef,
}: {
  flag: Flag;
  windDirectionRef: React.RefObject<Vector3>;
}) {
  const clothRef = useRef<Group>(null);
  const timeOffset = flag.yards * 0.37;

  useFrame((state, delta) => {
    const cloth = clothRef.current;
    if (!cloth) return;
    const wind = windDirectionRef.current;
    const downwind = Math.atan2(-wind.z, wind.x);
    const flutter = Math.sin(state.elapsed * 3 + timeOffset) * 0.12;
    cloth.rotation.y = dampAngle(cloth.rotation.y, downwind + flutter, 2, delta);
  });

  return (
    <group position={[flag.x, 0, flag.z]}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 2.8, 6]} />
        <meshStandardMaterial color="#f4f4ef" roughness={0.5} />
      </mesh>
      <group ref={clothRef} position={[0, 2.5, 0]}>
        <mesh position={[0.45, 0, 0]} castShadow>
          <planeGeometry args={[0.9, 0.55]} />
          <meshStandardMaterial color={flag.color} roughness={0.8} side={DoubleSide} />
        </mesh>
      </group>
      <YardageSign yards={flag.yards} color={flag.color} />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#1f3a22" polygonOffset polygonOffsetFactor={-4} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[GREEN_RADIUS - 0.12, GREEN_RADIUS, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
});

function Ball({
  ballRef,
  spinRef,
  phaseRef,
  hoveredRef,
}: {
  ballRef: React.RefObject<Group | null>;
  spinRef: React.RefObject<Group | null>;
  phaseRef: React.RefObject<GamePhase>;
  hoveredRef: React.RefObject<boolean>;
}) {
  return (
    // YXZ so yaw is the outermost rotation and spin acts on the ball's own axis.
    <group ref={ballRef} position={TEE_POSITION} rotation-order="YXZ">
      <BallRing phaseRef={phaseRef} hoveredRef={hoveredRef} />
      <group ref={spinRef}>
        <Suspense fallback={null}>
          <GolfBallModel radius={BALL_RADIUS} />
        </Suspense>
      </group>
    </group>
  );
}

/** How the ring around the ball looks in each state, in world units. */
type RingLook = {
  radius: number;
  /** Thickness of the ring's tube. */
  tube: number;
  opacity: number;
  color: Color;
  /** How much it swells and fades with each beat, and how fast it beats. */
  pulse: number;
  pulseSpeed: number;
};

const RING_LOOKS = {
  // Small, thin and breathing at rest, inviting you onto the ball.
  idle: {
    radius: 0.24,
    tube: 0.005,
    opacity: 0.55,
    color: new Color("#efffb2"),
    pulse: 0.15,
    pulseSpeed: 3.5,
  },
  hover: {
    radius: 0.36,
    tube: 0.008,
    opacity: 0.8,
    color: new Color("#efffb2"),
    pulse: 0,
    pulseSpeed: 0,
  },
  // Pressed and swinging: bold and throbbing.
  swing: {
    radius: 0.38,
    tube: 0.022,
    opacity: 0.92,
    color: new Color("#dfff69"),
    pulse: 0.035,
    pulseSpeed: 6,
  },
} satisfies Record<string, RingLook>;
/** The ring is a torus of radius 1 with this tube, scaled to each look. */
const RING_BASE_TUBE = 0.022;
const RING_EASE = 12;

function ringLook(phase: GamePhase, hovered: boolean): RingLook | null {
  if (phase === "swinging") return RING_LOOKS.swing;
  if (phase !== "idle") return null;
  return hovered ? RING_LOOKS.hover : RING_LOOKS.idle;
}

/**
 * One ring on the mat around the teed-up ball that eases between looks: small
 * and breathing at rest, steady while you hover the ball, bold once you press
 * it and swing. It fades out while the ball is away.
 */
function BallRing({
  phaseRef,
  hoveredRef,
}: {
  phaseRef: React.RefObject<GamePhase>;
  hoveredRef: React.RefObject<boolean>;
}) {
  const ringRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const shapeRef = useRef({ radius: RING_LOOKS.idle.radius, tube: RING_LOOKS.idle.tube });
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    const ring = ringRef.current;
    const material = materialRef.current;
    if (!ring || !material) return;

    timeRef.current += delta;
    const look = ringLook(phaseRef.current, hoveredRef.current);
    const shape = shapeRef.current;
    let opacity = 0;
    if (look) {
      const beat = 1 + look.pulse * Math.sin(timeRef.current * look.pulseSpeed);
      shape.radius = MathUtils.damp(shape.radius, look.radius * beat, RING_EASE, delta);
      shape.tube = MathUtils.damp(shape.tube, look.tube, RING_EASE, delta);
      material.color.lerp(look.color, 1 - Math.exp(-delta * RING_EASE));
      opacity = look.opacity * beat;
    }
    material.opacity = MathUtils.damp(material.opacity, opacity, RING_EASE, delta);
    // Scaling across the mat sets the radius; scaling up sets the tube.
    ring.scale.set(shape.radius, shape.radius, shape.tube / RING_BASE_TUBE);
    ring.visible = material.opacity > 0.01;
  });

  return (
    <mesh
      ref={ringRef}
      visible={false}
      position={[0, MAT_TOP_Y + 0.01 - BALL_TEE_Y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <torusGeometry args={[1, RING_BASE_TUBE, 8, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#efffb2"
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}

const BURST_COLOR = new Color("#fff3b0");
const BURST_DURATION = 0.6;

type LandingBurstHandle = {
  fire: (position: Vector3) => void;
};

/** Ring that pops where the ball first touches down. */
const LandingBurst = forwardRef<LandingBurstHandle>(
  function LandingBurst(_, ref) {
    const groupRef = useRef<Group>(null);
    const meshRef = useRef<Mesh>(null);
    const progressRef = useRef(1);

    useImperativeHandle(ref, () => ({
      fire(position) {
        const group = groupRef.current;
        if (!group) return;

        group.position.set(
          position.x,
          position.y - BALL_RADIUS + GROUND_RING_Y,
          position.z,
        );
        group.visible = true;
        progressRef.current = 0;
      },
    }));

    useFrame((_, delta) => {
      const group = groupRef.current;
      const mesh = meshRef.current;
      if (!group?.visible || !mesh) return;

      progressRef.current += delta / BURST_DURATION;
      if (progressRef.current >= 1) {
        group.visible = false;
        return;
      }

      const t = progressRef.current;
      group.scale.setScalar(0.6 + t * 1.8);
      (mesh.material as MeshBasicMaterial).opacity = (1 - t) * 0.85;
    });

    return (
      <group ref={groupRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={meshRef}>
          <ringGeometry args={[0.5, 0.66, 32]} />
          {/* Drawn over the ground so a slope can't swallow half the ring. */}
          <meshBasicMaterial
            color={BURST_COLOR}
            transparent
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      </group>
    );
  },
);
