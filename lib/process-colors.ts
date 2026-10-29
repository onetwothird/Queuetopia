// One color per process, shared by every chart and table so P3 is the same
// color everywhere it appears. Ids start at 1, so P1 takes the first swatch.
const PALETTE = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee', '#a3e635'];

export function processColor(id: number): string {
  return PALETTE[(((id - 1) % PALETTE.length) + PALETTE.length) % PALETTE.length];
}
