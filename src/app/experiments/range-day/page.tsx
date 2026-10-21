"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";

import { CLUBS, hintForShot, type HudState, type ShotResult } from "./game";
import { RangeScene, type SwingApi } from "./RangeScene";
import { SwingMeter } from "./SwingMeter";
import styles from "./page.module.css";

// The first shot is always calm.
const INITIAL_HUD: HudState = {
  phase: "idle",
  lastYards: 0,
  longestYards: 0,
  windAngle: 0,
  windSpeed: 0,
  hint: hintForShot(0),
};

const DEFAULT_HINT = "Aim ← → · pull back · swing through";
const PLAYER_DATA_KEY = "range-day-player-data";

type PlayerData = {
  version: 1;
  showInstructions: boolean;
  followBall: boolean;
  longestYards: number;
};

const DEFAULT_PLAYER_DATA: PlayerData = {
  version: 1,
  showInstructions: true,
  followBall: true,
  longestYards: 0,
};

const randomSeed = () => (Math.random() * 0xffffffff) >>> 0;
/** Radians per arrow-key press; holding a key repeats it. */
const KEY_AIM_STEP = (1.5 * Math.PI) / 180;

/** The headline for a clean strike, from how close it finished to a flag. */
function gradeShot(fromFlag: number) {
  if (fromFlag <= 3) return "Perfect!";
  if (fromFlag <= 8) return "Great shot";
  if (fromFlag <= 15) return "Good shot";
  return "Nice contact";
}

/** A headline for the shot, then the numbers behind it. */
function describeResult(result: ShotResult) {
  const carry = `${result.yards} yds`;
  const toFlag = `${carry} · ${result.fromFlag} yds from the ${result.flagYards}`;
  if (result.shank !== 0) {
    return { title: `Shanked it ${result.shank > 0 ? "right" : "left"}`, detail: carry };
  }
  if (result.tempo < 0.95) return { title: "Too slow", detail: carry };
  if (result.slice !== 0) {
    return { title: `${result.slice > 0 ? "Sliced" : "Hooked"} it`, detail: carry };
  }
  if (result.strike < 1) return { title: "Chunked it", detail: carry };
  if (result.strike > 1) return { title: "Thinned it", detail: toFlag };
  return { title: gradeShot(result.fromFlag), detail: toFlag };
}

/** Frames per second, counted over each half second. */
function FpsCounter() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frame = 0;
    let frames = 0;
    let since = performance.now();
    const tick = (now: number) => {
      frames += 1;
      if (now - since >= 500) {
        setFps(Math.round((frames * 1000) / (now - since)));
        frames = 0;
        since = now;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return <div className={styles.fps}>{fps} FPS</div>;
}

function ResultBanner({ result }: { result: ShotResult }) {
  const { title, detail } = describeResult(result);
  return (
    <div className={styles.result}>
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

export default function Page() {
  const [hud, setHud] = useState(INITIAL_HUD);
  const [run, setRun] = useState(0);
  const [seed, setSeed] = useState(randomSeed);
  const [showIntro, setShowIntro] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  /** Phones only: the club list is a flyout above the menu button. */
  const [showClubs, setShowClubs] = useState(false);
  /** Debug: F toggles a frames-per-second readout. */
  const [showFps, setShowFps] = useState(false);
  const [playerData, setPlayerData] = useState(DEFAULT_PLAYER_DATA);
  const [club, setClub] = useState(CLUBS[0]);
  const playerDataRef = useRef(DEFAULT_PLAYER_DATA);
  const windArrowRef = useRef<HTMLElement>(null);
  const swingRef = useRef<SwingApi>(null);

  // Arrow keys (or A and D) nudge the aim; holding one repeats. Number keys
  // pick a club.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "f") {
        setShowFps((shown) => !shown);
        return;
      }
      const picked = CLUBS[Number(event.key) - 1];
      if (picked) {
        setClub(picked);
        return;
      }
      const steps =
        event.key === "ArrowLeft" || event.key === "a"
          ? -1
          : event.key === "ArrowRight" || event.key === "d"
            ? 1
            : 0;
      if (steps === 0) return;
      event.preventDefault();
      swingRef.current?.aim(steps * KEY_AIM_STEP);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const savePlayerData = useCallback((next: PlayerData) => {
    playerDataRef.current = next;
    setPlayerData(next);
    try {
      window.localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(next));
    } catch {
      // Storage may be unavailable in privacy mode; the in-memory setting
      // still works for the current session.
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(
          window.localStorage.getItem(PLAYER_DATA_KEY) ?? "null",
        ) as Partial<PlayerData> | null;
        if (!saved) return;

        const next: PlayerData = {
          version: 1,
          showInstructions: saved.showInstructions !== false,
          followBall: saved.followBall !== false,
          longestYards: Math.max(0, Number(saved.longestYards) || 0),
        };
        playerDataRef.current = next;
        setPlayerData(next);
      } catch {
        // Ignore malformed or unavailable storage and keep the defaults.
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleHudChange = useCallback(
    (next: HudState) => {
      setHud(next);

      const current = playerDataRef.current;
      if (next.longestYards <= current.longestYards) return;
      savePlayerData({ ...current, longestYards: next.longestYards });
    },
    [savePlayerData],
  );

  const toggleSetting = useCallback(
    (key: "showInstructions" | "followBall") => {
      const current = playerDataRef.current;
      savePlayerData({ ...current, [key]: !current[key] });
    },
    [savePlayerData],
  );

  const restart = useCallback(() => {
    setHud(INITIAL_HUD);
    setSeed(randomSeed());
    setRun((value) => value + 1);
    setShowMenu(false);
  }, []);

  const startSession = useCallback(() => setShowIntro(false), []);

  return (
    <main
      className={styles.main}
      onDragStart={(event) => event.preventDefault()}
    >
      <Canvas
        className={styles.canvas}
        dpr={1}
        shadows="percentage"
        camera={{ position: [0, 1.05, 2.6], fov: 46, near: 0.05, far: 260 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <RangeScene
          key={run}
          seed={seed}
          followBall={playerData.followBall}
          club={club}
          onHudChange={handleHudChange}
          windArrowRef={windArrowRef}
          swingRef={swingRef}
        />
      </Canvas>

      {showFps ? <FpsCounter /> : null}

      <SwingMeter
        swingRef={swingRef}
        club={club}
        dimmed={hud.phase !== "idle" && hud.phase !== "swinging"}
      />

      <button
        className={styles.clubButton}
        type="button"
        aria-expanded={showClubs}
        aria-controls="range-day-clubs"
        onClick={() => {
          setShowClubs((open) => !open);
          setShowMenu(false);
        }}
      >
        {club.name}
      </button>
      <div
        id="range-day-clubs"
        className={styles.clubs}
        data-open={showClubs}
        role="radiogroup"
        aria-label="Club"
      >
        {CLUBS.map((option, index) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={option === club}
            title={`${option.name} · ${option.minCarry}–${option.maxCarry} yds · key ${index + 1}`}
            onClick={() => {
              setClub(option);
              setShowClubs(false);
            }}
          >
            <strong>{option.name}</strong>
            <span>{option.maxCarry}</span>
          </button>
        ))}
      </div>

      <header className={styles.hud} aria-live="polite">
        <div className={styles.hudActions}>
          <div className={styles.stats}>
            <div>
              <span>Last</span>
              <strong>{hud.lastYards}</strong>
            </div>
            <div>
              <span>Longest</span>
              <strong>{Math.max(hud.longestYards, playerData.longestYards)}</strong>
            </div>
          </div>
          <div className={styles.menuWrap}>
            <button
              className={styles.menuButton}
              type="button"
              aria-expanded={showMenu}
              aria-controls="range-day-menu"
              onClick={() => {
                setShowMenu((open) => !open);
                setShowClubs(false);
              }}
            >
              Menu
            </button>
            {showMenu ? (
              <div id="range-day-menu" className={styles.menuPanel}>
                <button
                  className={styles.toggleRow}
                  type="button"
                  role="switch"
                  aria-checked={playerData.showInstructions}
                  onClick={() => toggleSetting("showInstructions")}
                >
                  <span>Instructions</span>
                  <i aria-hidden="true" />
                </button>
                <button
                  className={styles.toggleRow}
                  type="button"
                  role="switch"
                  aria-checked={playerData.followBall}
                  onClick={() => toggleSetting("followBall")}
                >
                  <span>Follow ball</span>
                  <i aria-hidden="true" />
                </button>
                <button type="button" onClick={restart}>
                  New bucket
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div
        className={styles.windDisplay}
        aria-label={
          hud.windSpeed > 0
            ? `Wind ${hud.windSpeed} miles per hour`
            : "Wind calm"
        }
      >
        <span>Wind</span>
        <div className={styles.windReadout}>
          {hud.windSpeed > 0 ? (
            <>
              <i
                ref={windArrowRef}
                className={styles.windArrow}
                style={{ transform: `rotate(${hud.windAngle}deg)` }}
                aria-hidden="true"
              >
                ↑
              </i>
              <span className={styles.windSpeed}>
                <strong>{hud.windSpeed}</strong>
                <small>MPH</small>
              </span>
            </>
          ) : (
            <strong className={styles.calm}>Calm</strong>
          )}
        </div>
      </div>

      {playerData.showInstructions ? (
        <div className={styles.instructions}>
          <span className={styles.mouseIcon} aria-hidden="true" />
          <span>{hud.hint ?? DEFAULT_HINT}</span>
          <span className={styles.power} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      ) : null}

      {hud.result ? (
        <ResultBanner result={hud.result} />
      ) : null}

      {showIntro ? (
        <section
          className={styles.intro}
          role="dialog"
          aria-modal="true"
          aria-labelledby="range-day-intro-title"
        >
          <div className={styles.introCard}>
            <div className={styles.introMain}>
              <span className={styles.introKicker}>A chill driving range</span>
              <h2 id="range-day-intro-title">Read the wind. Find the flag.</h2>
              <p>
                Pick a club, read the wind and drop it next to a flag. They
                sit every 50 yards out to 250.
              </p>
            </div>
            <div className={styles.introStart}>
              <button type="button" onClick={startSession}>
                Grab a bucket
              </button>
            </div>
            <div className={styles.introSide}>
              <ol className={styles.introSteps} aria-label="How to play">
                <li>
                  <b>01</b>
                  <strong>Aim</strong>
                  <span>Drag off the ball or use ← →. Keys 1–5 pick a club.</span>
                </li>
                <li>
                  <b>02</b>
                  <strong>Pull back</strong>
                  <span>Press on the ball and pull down. Further is more power.</span>
                </li>
                <li>
                  <b>03</b>
                  <strong>Swing through</strong>
                  <span>Push up quickly and let go on the white dot.</span>
                </li>
              </ol>
              <p className={styles.introFaults}>
                Stop short and you chunk it; push past and you thin it. Lean
                to fade or draw, too far and you slice or hook. Let go outside
                the lanes and you shank it, and a slow swing loses power.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
