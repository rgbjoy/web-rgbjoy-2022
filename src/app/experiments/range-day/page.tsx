"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";

import { hintForShot, type HudState, type ShotResult } from "./game";
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

function describeResult(result: ShotResult) {
  if (result.strike < 1) {
    return `Chunked it · ${result.yards} yds`;
  }
  if (result.strike > 1) {
    return `Thinned it · ${result.yards} yds`;
  }
  if (result.fromFlag <= 3) {
    return `Stuck it · ${result.fromFlag} yds from the ${result.flagYards}`;
  }
  return `${result.yards} yds · ${result.fromFlag} yds from the ${result.flagYards}`;
}

export default function Page() {
  const [hud, setHud] = useState(INITIAL_HUD);
  const [run, setRun] = useState(0);
  const [seed, setSeed] = useState(randomSeed);
  const [showIntro, setShowIntro] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [playerData, setPlayerData] = useState(DEFAULT_PLAYER_DATA);
  const playerDataRef = useRef(DEFAULT_PLAYER_DATA);
  const windArrowRef = useRef<HTMLElement>(null);
  const swingRef = useRef<SwingApi>(null);

  // Arrow keys (or A and D) nudge the aim; holding one repeats.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
    <main className={styles.main}>
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
          onHudChange={handleHudChange}
          windArrowRef={windArrowRef}
          swingRef={swingRef}
        />
      </Canvas>

      <SwingMeter swingRef={swingRef} />

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
              onClick={() => setShowMenu((open) => !open)}
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
        <div className={styles.result}>{describeResult(hud.result)}</div>
      ) : null}

      {showIntro ? (
        <section
          className={styles.intro}
          role="dialog"
          aria-modal="true"
          aria-labelledby="range-day-intro-title"
        >
          <div className={styles.introCard}>
            <span className={styles.introKicker}>A chill driving range</span>
            <h2 id="range-day-intro-title">Read the wind. Find the flag.</h2>
            <p>
              Drag to aim. Press on the ball, pull down, then push up and let
              go where you started.
            </p>
            <details className={styles.introMore}>
              <summary>Read more</summary>
              <p>
                Pull further for more power. Stop short of where you started
                and you chunk it; push past and you thin it long. Lean the
                swing to fade or draw. Flags sit every 50 yards out to 250.
              </p>
            </details>
            <div className={styles.introTips} aria-label="How to play">
              <span>
                <b>01</b> Aim
              </span>
              <span>
                <b>02</b> Pull back
              </span>
              <span>
                <b>03</b> Swing through
              </span>
            </div>
            <button type="button" onClick={startSession}>
              Grab a bucket
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
