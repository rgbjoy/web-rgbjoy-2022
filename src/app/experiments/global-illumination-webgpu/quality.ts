/**
 * Holds a frame's GPU time near a target by scaling the render resolution:
 * down on a GPU that can't keep up, back up when there's room. The cost of a
 * frame goes with its pixel count — the scale squared — so a step aims
 * straight for the target rather than inching. Each change restarts the
 * picture, so changes are kept rare: steps of 5%, a pause after each, and a
 * fresh average before the next.
 */
export class AdaptiveScale {
  /** The render resolution as a fraction of the panel's pixel ratio: 1 is the full ratio. */
  scale = 1
  private average: number | null = null
  private samples = 0
  private changedAt = -Infinity

  constructor(
    /** The frame time to hold, in milliseconds: room for 60 Hz with the rest of the page. */
    readonly target = 12,
    /** Below this the picture is too soft to be worth the frame rate. */
    readonly min = 0.5,
    /** Frames averaged before a change is judged. */
    readonly settle = 30,
    /** Milliseconds after a change before another. */
    readonly cooldown = 1000,
  ) {}

  /** Starts the measuring over, as after the page wakes or the settings change. */
  reset() {
    this.average = null
    this.samples = 0
  }

  /** Feeds one frame's cost in milliseconds; true when the scale changed. */
  sample(ms: number, now: number) {
    if (!(ms > 0) || now - this.changedAt < this.cooldown) return false
    this.average = this.average === null ? ms : this.average * 0.9 + ms * 0.1
    if (++this.samples < this.settle) return false

    const over = this.average > this.target * 1.25 && this.scale > this.min
    const under = this.average < this.target * 0.6 && this.scale < 1
    if (!over && !under) return false

    // Aim a little under the target on the way up, so it doesn't bounce back.
    const goal = over ? this.target : this.target * 0.85
    const next = Math.min(1, Math.max(this.min, this.scale * Math.sqrt(goal / this.average)))
    const stepped = Math.round(next * 20) / 20
    if (stepped === this.scale) return false
    this.scale = stepped
    this.changedAt = now
    this.reset()
    return true
  }
}
