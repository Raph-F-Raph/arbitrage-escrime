export interface PoolResult {
  a: number; // score du tireur d'indice le plus petit
  b: number; // score du tireur d'indice le plus grand
}

export interface Pool {
  names: string[];
  results: Record<string, PoolResult>; // clé "i-j" avec i < j
}

export interface Row {
  index: number;
  name: string;
  v: number;
  d: number;
  td: number;
  tr: number;
  ind: number;
  rank: number;
}

export const key = (i: number, j: number) => `${Math.min(i, j)}-${Math.max(i, j)}`;

// Ordre des matchs (méthode du cercle) : un tireur ne tire pas deux fois de suite quand c'est possible
export function makeMatches(n: number): [number, number][] {
  const ids: number[] = Array.from({ length: n }, (_, i) => i);
  if (n % 2 === 1) ids.push(-1);
  const m = ids.length;
  const out: [number, number][] = [];
  let arr = [...ids];
  for (let r = 0; r < m - 1; r++) {
    for (let k = 0; k < m / 2; k++) {
      const x = arr[k];
      const y = arr[m - 1 - k];
      if (x !== -1 && y !== -1) out.push([Math.min(x, y), Math.max(x, y)]);
    }
    arr = [arr[0], arr[m - 1], ...arr.slice(1, m - 1)];
  }
  return out;
}

export function standings(pool: Pool): Row[] {
  const n = pool.names.length;
  const rows = pool.names.map((name, index) => ({ index, name, v: 0, d: 0, td: 0, tr: 0, m: 0 }));
  for (const [k, r] of Object.entries(pool.results)) {
    const [i, j] = k.split('-').map(Number);
    if (i >= n || j >= n) continue;
    rows[i].td += r.a;
    rows[i].tr += r.b;
    rows[j].td += r.b;
    rows[j].tr += r.a;
    rows[i].m++;
    rows[j].m++;
    if (r.a > r.b) {
      rows[i].v++;
      rows[j].d++;
    } else if (r.b > r.a) {
      rows[j].v++;
      rows[i].d++;
    }
  }
  const withIdx = rows.map((r) => ({ ...r, ind: r.td - r.tr, ratio: r.m ? r.v / r.m : 0 }));
  // Classement FIE : V/M, puis touches données - reçues, puis touches données
  withIdx.sort((x, y) => y.ratio - x.ratio || y.ind - x.ind || y.td - x.td);
  const out: Row[] = [];
  withIdx.forEach((r, idx) => {
    const prev = withIdx[idx - 1];
    const same = prev && prev.ratio === r.ratio && prev.ind === r.ind && prev.td === r.td;
    out.push({
      index: r.index,
      name: r.name,
      v: r.v,
      d: r.d,
      td: r.td,
      tr: r.tr,
      ind: r.ind,
      rank: same ? out[idx - 1].rank : idx + 1,
    });
  });
  return out;
}
