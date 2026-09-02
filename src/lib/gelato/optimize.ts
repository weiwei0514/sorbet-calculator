/**
 * Dependency-free constrained-optimisation helper for the Gelato solver.
 *
 * All search variables are normalised to [0, 1]; the objective clamps out-of-box
 * points itself, so this is a plain box-bounded minimiser: Nelder–Mead downhill
 * simplex from several deterministic starts, keeping the global best.
 *
 * It is deliberately a single small module so the whole search strategy can be
 * swapped (e.g. for a coarse grid + local polish) without touching the engine.
 */

export interface MinimizeOptions {
  /** Number of search variables. */
  dim: number
  /** Restarts (distinct starting simplices). Default 12. */
  starts?: number
  /** Nelder–Mead iterations per start. Default 250. */
  iters?: number
  /** Stop a start early once the simplex spread drops below this. Default 1e-7. */
  tol?: number
}

export interface MinimizeResult {
  x: number[]
  fx: number
}

/** Deterministic pseudo-random in [0,1) — a tiny LCG so runs are reproducible. */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function nelderMead(
  fn: (x: number[]) => number,
  start: number[],
  iters: number,
  tol: number
): MinimizeResult {
  const n = start.length
  const alpha = 1
  const gamma = 2
  const rho = 0.5
  const sigma = 0.5
  const step = 0.15

  // Build the initial simplex: start + a nudge along each axis.
  const simplex: number[][] = [start.slice()]
  for (let i = 0; i < n; i++) {
    const p = start.slice()
    p[i] = clamp01(p[i] + (p[i] > 0.5 ? -step : step))
    simplex.push(p)
  }

  const fvals = simplex.map(fn)

  const order = () => {
    const idx = fvals.map((_, i) => i).sort((a, b) => fvals[a] - fvals[b])
    return { simplex: idx.map((i) => simplex[i]), fvals: idx.map((i) => fvals[i]) }
  }

  for (let iter = 0; iter < iters; iter++) {
    const ord = order()
    for (let i = 0; i < simplex.length; i++) {
      simplex[i] = ord.simplex[i]
      fvals[i] = ord.fvals[i]
    }

    const spread = Math.abs(fvals[fvals.length - 1] - fvals[0])
    if (spread < tol) break

    // Centroid of all but the worst point.
    const centroid = new Array(n).fill(0)
    for (let i = 0; i < simplex.length - 1; i++) {
      for (let j = 0; j < n; j++) centroid[j] += simplex[i][j] / (simplex.length - 1)
    }

    const worst = simplex[simplex.length - 1]
    const reflect = centroid.map((c, j) => clamp01(c + alpha * (c - worst[j])))
    const fr = fn(reflect)

    if (fr < fvals[0]) {
      const expand = centroid.map((c, j) => clamp01(c + gamma * (reflect[j] - c)))
      const fe = fn(expand)
      if (fe < fr) {
        simplex[simplex.length - 1] = expand
        fvals[fvals.length - 1] = fe
      } else {
        simplex[simplex.length - 1] = reflect
        fvals[fvals.length - 1] = fr
      }
    } else if (fr < fvals[fvals.length - 2]) {
      simplex[simplex.length - 1] = reflect
      fvals[fvals.length - 1] = fr
    } else {
      const contract = centroid.map((c, j) => clamp01(c + rho * (worst[j] - c)))
      const fc = fn(contract)
      if (fc < fvals[fvals.length - 1]) {
        simplex[simplex.length - 1] = contract
        fvals[fvals.length - 1] = fc
      } else {
        // Shrink toward the best point.
        const best = simplex[0]
        for (let i = 1; i < simplex.length; i++) {
          simplex[i] = simplex[i].map((v, j) => clamp01(best[j] + sigma * (v - best[j])))
          fvals[i] = fn(simplex[i])
        }
      }
    }
  }

  const ord = order()
  return { x: ord.simplex[0], fx: ord.fvals[0] }
}

export function minimize(fn: (x: number[]) => number, opts: MinimizeOptions): MinimizeResult {
  const { dim } = opts
  const starts = opts.starts ?? 12
  const iters = opts.iters ?? 250
  const tol = opts.tol ?? 1e-7
  const rng = makeRng(0x5eed)

  let best: MinimizeResult = { x: new Array(dim).fill(0.5), fx: Infinity }

  for (let s = 0; s < starts; s++) {
    const start =
      s === 0
        ? new Array(dim).fill(0.5)
        : Array.from({ length: dim }, () => clamp01(0.15 + 0.7 * rng()))
    const res = nelderMead(fn, start, iters, tol)
    if (res.fx < best.fx) best = res
  }

  return best
}
