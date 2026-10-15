/** GPU time per group of passes, in milliseconds; null where the group didn't run in the frame measured. */
export type Timings = { probes: number | null; trace: number | null; post: number | null }

type Group = keyof Timings

/** One frame's queries, a query per group that ran. */
type Frame = Partial<Record<Group, WebGLQuery>>

/** Frames left waiting for their results before the oldest is given up on. */
const MAX_PENDING = 8

/**
 * GPU time per group of passes, from WebGL 2's disjoint timer queries — the
 * same readout the WebGPU page gets from its timestamp queries, so the two
 * can be set side by side. Results come back a frame or more late. A frame
 * the GPU was interrupted during (a "disjoint" event: preempted, or its clock
 * changed) is thrown away rather than reported wrong.
 */
export class GpuTimer {
  private readonly ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null
  private pending: Frame[] = []
  private current: Frame = {}
  /** Only one elapsed-time query may be open at once; groups never nest. */
  private open = false

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly onTimings: (timings: Timings) => void,
  ) {
    this.ext = gl.getExtension("EXT_disjoint_timer_query_webgl2")
  }

  get supported() {
    return this.ext !== null
  }

  /** Starts timing a group of passes; everything drawn until end() counts toward it. */
  begin(group: Group) {
    if (!this.ext || this.open) return
    const query = this.gl.createQuery()
    if (!query) return
    this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, query)
    this.current[group] = query
    this.open = true
  }

  end() {
    if (!this.ext || !this.open) return
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT)
    this.open = false
  }

  /** Closes this frame's queries and reports every earlier frame whose results are in. */
  finish() {
    if (!this.ext) return
    if (Object.keys(this.current).length > 0) this.pending.push(this.current)
    this.current = {}
    if (this.pending.length > MAX_PENDING) this.pending.splice(0, this.pending.length - MAX_PENDING).forEach(this.discard)

    const gl = this.gl
    const disjoint = gl.getParameter(this.ext.GPU_DISJOINT_EXT) as boolean
    while (this.pending.length > 0) {
      const frame = this.pending[0]
      const queries = Object.values(frame)
      // Queries finish in order, so the first frame not yet in holds up the rest.
      if (!disjoint && !queries.every((query) => gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE))) break
      this.pending.shift()
      if (!disjoint) {
        const ms = (group: Group) => {
          const query = frame[group]
          return query ? (gl.getQueryParameter(query, gl.QUERY_RESULT) as number) / 1e6 : null
        }
        this.onTimings({ probes: ms("probes"), trace: ms("trace"), post: ms("post") })
      }
      this.discard(frame)
    }
  }

  dispose() {
    if (this.open) this.end()
    this.pending.forEach(this.discard)
    this.discard(this.current)
    this.pending = []
    this.current = {}
  }

  private readonly discard = (frame: Frame) => {
    Object.values(frame).forEach((query) => this.gl.deleteQuery(query))
  }
}
